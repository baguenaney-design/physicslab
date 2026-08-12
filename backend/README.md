# PhysicsLab Backend

A thin FastAPI proxy between the React frontend and the Anthropic Claude API.
It exists so the API key never reaches the browser and so every tutor call is
grounded in teacher-reviewed content server-side.

**Current status: Phase 3.3 — fully wired.** `/api/chat` streams a real Claude
reply through the Anthropic Python SDK. The system prompt for the requested
simulation is loaded from `prompts/`; `prompts/momentum.txt` carries the momentum
tutor's Peter- and Jacob-reviewed content.

**`ANTHROPIC_API_KEY` must be present in the environment.** The server boots
without it, but every `/api/chat` request returns 500 until it is set. In local
development it is read from `backend/.env` via `python-dotenv`.

## Setup

From the `backend/` directory:

```bash
# 1. Create a virtual environment (Python 3.9+)
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create your env file
cp .env.example .env
# then open .env and paste your real key
```

`.env` and `.venv/` are gitignored. Never commit a real key.

## Run

```bash
uvicorn main:app --reload
```

Serves on `http://127.0.0.1:8000`. Interactive API docs at
`http://127.0.0.1:8000/docs`.

## Test

Health check:

```bash
curl http://127.0.0.1:8000/api/health
# {"status":"ok"}
```

Chat endpoint. The reply is streamed as `text/plain`, arriving in chunks rather
than as one JSON body — `-N` turns off curl's buffering so you can watch it land:

```bash
curl -N -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Why is momentum conserved here?",
    "sim_state": {"m1": 2, "v1": 3, "m2": 3, "v2": -1, "mode": "elastic", "collided": false},
    "simulation": "momentum"
  }'
# This question involves:
# - IB A.2 Forces and momentum / AP Physics 1 Unit 4 Linear Momentum — covered
# ...
```

Requires a working `ANTHROPIC_API_KEY`; without one this returns 500.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness check. Returns `{"status": "ok"}`. |
| POST | `/api/chat` | Tutor request. Streams the reply as `text/plain`. |

### POST /api/chat body

| Field | Type | Notes |
|---|---|---|
| `message` | string | The student's question. |
| `sim_state` | object | Current simulation variables. Shape varies per simulation. Rendered into readable text and prepended to the question. |
| `simulation` | string | Topic slug, e.g. `momentum`. Selects `prompts/<slug>.txt`. Must match `[a-z0-9-]+`. |
| `history` | array | Optional, defaults to `[]`. Prior turns as `{role, content}` with roles `user` / `assistant`. ChatPanel sends the last 10. Without it the tutor's response-mode menu cannot hold across turns. |

## Errors

| Status | When |
|---|---|
| 404 | No prompt file for the requested `simulation`. A slug failing the `[a-z0-9-]+` check returns the same 404, so a path-traversal attempt is indistinguishable from a missing topic. |
| 500 | `ANTHROPIC_API_KEY` is not set on the server. |
| 502 | The Anthropic call failed — bad key, rate limit, outage. The message is deliberately generic so upstream detail never reaches the browser. |

A failure *after* streaming has started cannot change the status code, because the
200 is already on the wire. Those append `[Tutor connection lost. Please ask
again.]` to the reply rather than truncating it silently.

## Model

`claude-sonnet-4-6`, `max_tokens` 2048 — enough headroom for the "Full derivation"
response mode, which `momentum.txt` exempts from its usual length limit. The
system prompt is sent with `cache_control: ephemeral`, so a student asking several
questions in one sitting is not re-billed for all ~9,000 tokens each time.

## CORS

Allowed origins are the local Vite dev server (`localhost:5173` and
`127.0.0.1:5173`) plus any `*.vercel.app` deployment. Tighten the regex to the
real production domain once the project name is final.

## Deployment

Railway, connected to this repo. Set `ANTHROPIC_API_KEY` as an environment
variable there — do not rely on a `.env` file in production.
