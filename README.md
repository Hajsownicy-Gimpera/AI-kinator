## 📄 Specyfikacja prototypu

Zobacz: [AIKINATOR-PROTOTYPE](docs/AIKINATOR-PROTOTYPE.md)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.9+)
- **Docker Engine** (v29.1.3+ - earlier may work just fine too)
- **UV** package manager (automatically installed, or install manually: `pip3 install uv` or install from https://docs.astral.sh/uv/getting-started/installation/)

### Installation & Running

Before starting the app, create `backend/.env` from `backend/.env.example` and set `GOOGLE_API_KEY` to your Google AI Studio key. If the key is missing, the backend falls back to dummy LLM mode.

```bash
# Start both backend and frontend with Docker Compose
docker compose up --build
```

This will start:
- **Backend:** `http://localhost:8000` (FastAPI with auto-reload)
- **Frontend:** `http://localhost:3000` (React development server)

In Docker, the backend starts with `uvicorn` and the frontend starts with `npm start`.

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

