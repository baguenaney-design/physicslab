# PhysicsLab Backend

A thin FastAPI proxy between the React frontend and the Anthropic Claude API.
It exists so the API key never reaches the browser and so every tutor call is
grounded in teacher-reviewed content server-side.

**Current status: Phase 3.2 — system prompt written, API not yet wired.**
`prompts/momentum.txt` holds the momentum tutor's system prompt, grounded in the
reviewed content in `docs/content/momentum.md`. `/api/chat` still returns a
hardcoded placeholder — wiring the streamed Claude call is Phase 3.3.

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

Placeholder chat endpoint:

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Why is momentum conserved here?",
    "sim_state": {"m1": 2, "v1": 3, "m2": 3, "v2": -1, "mode": "elastic", "collided": false},
    "simulation": "momentum"
  }'
# {"response":"AI tutor not yet wired — Phase 3.3 pending"}
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness check. Returns `{"status": "ok"}`. |
| POST | `/api/chat` | Tutor request. Placeholder until Phase 3.3. |

### POST /api/chat body

| Field | Type | Notes |
|---|---|---|
| `message` | string | The student's question. |
| `sim_state` | object | Current simulation variables. Shape varies per simulation. |
| `simulation` | string | Topic slug, e.g. `momentum`. Selects the system prompt in 3.2. |

## CORS

Allowed origins are the local Vite dev server (`localhost:5173` and
`127.0.0.1:5173`) plus any `*.vercel.app` deployment. Tighten the regex to the
real production domain once the project name is final.

## Deployment

Railway, connected to this repo. Set `ANTHROPIC_API_KEY` as an environment
variable there — do not rely on a `.env` file in production.
