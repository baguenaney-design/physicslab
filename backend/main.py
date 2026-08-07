"""PhysicsLab backend — thin AI proxy.

Phase 3.1: skeleton only. The /api/chat endpoint is a placeholder that returns a
fixed string. The Anthropic API is deliberately NOT wired up here — that is Phase
3.2, and it is gated on Peter Syrenne's review of the momentum content, because
the system prompt must contain the reviewed summary before the tutor can ship.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="PhysicsLab API", version="0.1.0")

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
    shape (momentum sends m1/v1/m2/v2/mode/collided, projectile will send angle
    and launch speed). The backend does not validate its contents in Phase 3.1.
    """

    message: str
    sim_state: dict
    simulation: str


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat")
def chat(request: ChatRequest):
    # Placeholder. Phase 3.2 replaces this with a streamed Anthropic call whose
    # system prompt is loaded from backend/prompts/{simulation}.txt.
    return {"response": "AI tutor not yet wired — Phase 3.2 pending"}
