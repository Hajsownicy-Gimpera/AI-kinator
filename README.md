## 📄 Specyfikacja prototypu

Zobacz: [AIKINATOR-PROTOTYPE](docs/AIKINATOR-PROTOTYPE.md)

---

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
│   ├── main.py                 # FastAPI app – endpoints, Pydantic models, DB setup
│   ├── pyproject.toml          # Python project config (uv)
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Env var template (GOOGLE_API_KEY)
│   ├── ai/
│   │   ├── config.py           # LLM model config
│   │   ├── llm_chain.py        # LangChain + Gemini wrapper, dummy mode
│   │   └── prompts.py          # System prompt, example characters
│   └── tests/
│       ├── test_room_state.py
│       ├── test_llm_chain.py
│       └── test_question_endpoint.py
├── frontend/
│   ├── package.json            # React app configuration
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js              # Main component + routing
│       ├── App.css
│       ├── index.js
│       ├── index.css
│       └── pages/
│           └── GameView/       # Game room component
│               ├── GameView.js # Room state polling, chat, input
│               └── GameView.css
├── docs/
│   └── AIKINATOR-PROTOTYPE.md  # Implementation tasks
├── .github/
│   └── copilot-instructions.md # Development guide
└── README.md
```

