## 📄 Specyfikacja prototypu

Zobacz: [AIKINATOR-PROTOTYPE](docs/AIKINATOR-PROTOTYPE.md)
Zobacz w root folderze: copilot-instructions.md

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.14+)
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
│   ├── main.py                 # FastAPI app with / and /health endpoints
│   ├── requirements.txt        # Python dependencies
│   └── .gitignore
├── frontend/
│   ├── package.json            # React app configuration
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js              # Main component (displays health status)
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── .gitignore
├── docs/
│   └── AIKINATOR-PROTOTYPE.md  # Implementation tasks
├── .github/
│   └── copilot-instructions.md # Development guide
└── README.md
```

---

## ✅ Task 1 – Project Setup & Repository Structure – COMPLETED (2026-04-08)

- ✅ Backend: FastAPI with `/` and `/health` endpoints
- ✅ Frontend: React with Axios for API calls
- ✅ CORS configured for localhost:3000
- ✅ Project structure organized

**Backend**: `python -m uvicorn main:app --reload --port 8000`  
**Frontend**: `npm start`

---

## ✅ Task 2 – Backend Room Creation Endpoints – COMPLETED (2026-04-12)

- ✅ `POST /games/solo` – creates solo room
- ✅ `POST /games/duel` – creates duel room
- ✅ `POST /games/battle-royale` – creates battle royale room
- ✅ SQLite database with persistent storage
- ✅ Unique UUID4 room IDs
- ✅ Room schema: `room_id`, `game_mode`, `status`, `created_at`

**Test via Swagger UI**: `http://localhost:8000/docs`

---

## 📋 Next Tasks – Ready to Start

### Backend (BE-3, BE-4, BE-5)
1. **BE-3**: `GET /rooms/{room_id}/state` – Dummy room state endpoint
2. **BE-4**: Expand Room model with game state (players, history, phase)
3. **BE-5**: `POST /rooms/{room_id}/question` – Question submission (dummy)

### Frontend (FE-3, FE-4, FE-5)
2. **FE-3**: Implement GameView component with polling
3. **FE-4**: Question & guess buttons (placeholder actions)
4. **FE-5**: Styling and UX polish

### LLM Integration (LLM-1 to LLM-6) – **Parallel Stream**
1. **LLM-1**: Configure LangChain + environment variables
2. **LLM-2**: Create system prompts for AI-kinator
3. **LLM-3**: Build LLMChain wrapper class
4. **LLM-4**: Write unit tests for LLMChain
5. **LLM-5**: Integrate LLMChain with BE-5 question endpoint
6. **LLM-6**: Production configuration + secrets management

### Integration (INT-1)
1. **INT-1**: End-to-end flow testing and polish

**📋 Full Details:** See `KANBAN_TASKS.md` for detailed specs, or `QUICK_COPY_TASKS.md` for quick copy-paste templates.