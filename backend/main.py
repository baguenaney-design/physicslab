"""PhysicsLab backend — thin AI proxy.

/api/chat streams a Claude response grounded in the teacher-reviewed content for
the requested simulation. The system prompt is loaded from prompts/<slug>.txt —
see prompts/momentum.txt, which carries the Peter- and Jacob-reviewed momentum
content plus the tutor's behaviour rules.

The API key never reaches the browser: the frontend talks only to this proxy.
"""

import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, AsyncIterator, Dict, List

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, StreamingResponse
from pydantic import BaseModel

# Reads backend/.env. Without this, a key sitting in that file never reaches
# os.environ and every request comes back 500.
load_dotenv(Path(__file__).parent / ".env")

app = FastAPI(title="PhysicsLab API", version="0.1.0")

# Pinned in CLAUDE.md.
MODEL = "claude-sonnet-4-6"

# Headroom for response mode 4 ("Full derivation"), which momentum.txt exempts
# from its 3-4 paragraph limit. A tighter cap truncates mid-derivation.
MAX_TOKENS = 2048

PROMPTS_DIR = Path(__file__).parent / "prompts"

# `simulation` arrives from the browser and is interpolated into a file path, so
# it is restricted to the slug shape used by src/simulations/ before it is ever
# joined onto PROMPTS_DIR. Without this, "../../etc/passwd" reads that file.
SIMULATION_SLUG = re.compile(r"^[a-z0-9-]+$")

# Built at import time. The SDK resolves credentials lazily, so this does not
# raise when ANTHROPIC_API_KEY is unset — the app boots either way, and the
# missing-key case is handled per request in chat() below.
client = anthropic.AsyncAnthropic()

# Local Vite dev server. Both spellings — some browsers resolve one, not the other.
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Vercel production + preview deployments. Tightened to the real domain once the
# project name is final (see CLAUDE.md — the "physicslab" slug is provisional).
ALLOWED_ORIGIN_REGEX = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    """Body of a tutor request.

    sim_state is intentionally an open dict: each simulation reports a different
    shape (momentum sends m1/v1/m2/v2/mode/collided/post_v1/post_v2 — see
    buildSimState in ChatPanel.jsx — projectile will send angle and launch speed).
    The backend does not validate its contents.

    history is optional and currently always empty: ChatPanel does not send prior
    turns yet. Until it does, every request is single-turn, which means the
    response-mode menu in momentum.txt cannot work — the tutor never sees which
    mode the student picked. Nothing here needs to change when the frontend
    starts sending it.
    """

    message: str
    sim_state: dict
    simulation: str
    history: List[Dict[str, Any]] = []


@lru_cache(maxsize=None)
def load_prompt(simulation: str) -> str:
    """Read the system prompt for a simulation.

    Cached: these files do not change while the server is running, and
    momentum.txt alone is ~35 KB. Raises FileNotFoundError for both a rejected
    slug and a missing file, so the caller has one 404 path rather than two.
    """
    if not SIMULATION_SLUG.match(simulation):
        raise FileNotFoundError(simulation)
    return (PROMPTS_DIR / "{}.txt".format(simulation)).read_text(encoding="utf-8")


def format_message(sim_state: Dict[str, Any], student_message: str) -> str:
    """Render the simulation state as readable text, per TECHNICAL_DESIGN 3.4.

    Only the fields ChatPanel actually sends appear here. Momenta, total momentum
    and KE loss are deliberately NOT computed: momentum.txt section 6 tells the
    tutor those values are not supplied and must be derived from m and v, and
    sending them anyway would contradict its own instructions.
    """
    collided = bool(sim_state.get("collided"))

    lines = [
        "Current simulation state:",
        "- Block A: mass = {} kg, velocity = {} m/s".format(
            sim_state.get("m1"), sim_state.get("v1")
        ),
        "- Block B: mass = {} kg, velocity = {} m/s".format(
            sim_state.get("m2"), sim_state.get("v2")
        ),
        "- Collision mode: {}".format(sim_state.get("mode")),
        "- Collision has occurred: {}".format("yes" if collided else "no"),
    ]

    # post_v1/post_v2 are null until the blocks have actually collided.
    if collided:
        lines.append(
            "- Block A velocity after collision: {} m/s".format(sim_state.get("post_v1"))
        )
        lines.append(
            "- Block B velocity after collision: {} m/s".format(sim_state.get("post_v2"))
        )

    lines += ["", "Student's question:", student_message]
    return "\n".join(lines)


async def stream_reply(
    system_prompt: str, messages: List[Dict[str, Any]]
) -> AsyncIterator[str]:
    """Yield the tutor's reply as it arrives, chunk by chunk."""
    async with client.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        # cache_control stops the ~9000-token system prompt being billed in full
        # on every question. Break-even is two requests inside the 5 minute TTL,
        # which any real tutoring session clears.
        system=[
            {
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        system_prompt = load_prompt(request.simulation)
    except (FileNotFoundError, OSError):
        raise HTTPException(
            status_code=404,
            detail="No system prompt for simulation '{}'.".format(request.simulation),
        )

    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="ANTHROPIC_API_KEY is not set on the server.",
        )

    messages = list(request.history)
    messages.append(
        {
            "role": "user",
            "content": format_message(request.sim_state, request.message),
        }
    )

    replies = stream_reply(system_prompt, messages)

    # Pull the first chunk before the response starts. Once StreamingResponse
    # begins writing, the 200 is already on the wire and nothing can turn a
    # failure into a 502 — so the auth, rate limit and outage cases have to
    # surface here, which is where all of them land in practice.
    try:
        first = await replies.__anext__()
    except StopAsyncIteration:
        return PlainTextResponse("The tutor returned an empty response. Please ask again.")
    except anthropic.APIError:
        await replies.aclose()
        # Deliberately generic: upstream errors can carry request details.
        raise HTTPException(status_code=502, detail="AI service unavailable.")

    async def body() -> AsyncIterator[str]:
        yield first
        try:
            async for chunk in replies:
                yield chunk
        except anthropic.APIError:
            # Too late for a 502 — the status and the opening text are already
            # sent. A visible marker beats a silently truncated explanation.
            yield "\n\n[Tutor connection lost. Please ask again.]"

    return StreamingResponse(body(), media_type="text/plain")
