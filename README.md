## 📄 Specyfikacja prototypu

Zobacz: [AIKINATOR-PROTOTYPE](docs/AIKINATOR-PROTOTYPE.md)

---

## Running backend tests

If you want to run backend unit tests locally, use the `backend/` directory and install the dev extras first:

```bash
cd backend
uv sync --extra dev
uv run pytest tests -q
```

If you already have a synced environment and only need to update the test tools, run:

```bash
cd backend
uv sync --extra dev
```

Notes:
- `uv sync --extra dev` installs the backend runtime dependencies plus `pytest` and `httpx` from `backend/pyproject.toml`.
- Run tests from inside `backend/` so `uv` uses the local project environment.
- On success you should see output like `8 passed`.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.9+)
- **UV** package manager (automatically installed, or install manually: `pip3 install uv` or install from https://docs.astral.sh/uv/getting-started/installation/)

### Installation & Running

```bash
# Install dependencies (backend uses uv manager, triggered automatically)
# This will:
# - Install frontend dependencies with npm
# - Create Python virtual environment
# - Install backend packages with uv
npm install

# Run both backend and frontend in parallel
npm run dev
```

This will start:
- **Backend:** `http://localhost:8000` (FastAPI with auto-reload)
- **Frontend:** `http://localhost:3000` (React development server)

Note: The backend now includes the question endpoint `POST /rooms/{room_id}/question` (BE-5) which returns a dummy LLM answer and persists conversation history. LLM integration will be added in LLM-4.

Note: The backend now includes the question endpoint `POST /rooms/{room_id}/question` (BE-5) which returns a dummy LLM answer and persists conversation history. LLM integration will be added in LLM-4.

**Or run individually:**

```bash
# Backend only (http://localhost:8000)
npm run backend
# Or: cd backend && uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend only (http://localhost:3000)
npm run frontend
# Or: cd frontend && npm start
```

---

## 📋 Project Structure

```
ai-kinator/
├── backend/
│   ├── main.py                 # FastAPI app with endpoints
│   ├── pyproject.toml          # Python project config
│   ├── requirements.txt        # Python dependencies
│   ├── tests/
│   │   └── test_room_state.py # Room state tests
│   └── .gitignore
├── frontend/
│   ├── package.json            # React app configuration
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js              # Main component
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   └── pages/
│   │       └── GameView/       # Game room component
│   │           ├── GameView.js # Room state polling, chat, input
│   │           └── GameView.css
│   └── .gitignore
├── docs/
│   └── AIKINATOR-PROTOTYPE.md  # Implementation tasks
├── .github/
│   └── copilot-instructions.md # Development guide
└── README.md
```

