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

**Available endpoints:**
- `GET /` → `{"status": "ok"}`
- `GET /health` → `{"status": "healthy"}`
- `POST /games/solo` – Create solo game
- `POST /games/duel` – Create duel room  
- `POST /games/battle-royale` – Create battle royale room

**Frontend Features:**
- Frontend opens on http://localhost:3000
- Displays backend health status
- Fetches from backend `/health` endpoint
- Shows connection status

### First Run Notes

**Expected output from `npm run dev`:**
```
✓ Backend running: http://0.0.0.0:8000
✓ Frontend running: http://localhost:3000
ℹ Backend watching for changes
ℹ Frontend compiled successfully
```

**Expected warnings (safe to ignore):**
- ESLint warnings about unused imports (will be cleaned up)
- npm audit warnings (review with `npm audit` when needed)
- Deprecation warnings from dependencies (normal in development)

**If something doesn't work:**
1. Ensure Python 3.14+ is installed: `python --version`
2. Verify UV is installed: `uv --version`
3. Clear cache: `rm -r backend/.venv` then `npm install`
4. Check ports aren't in use: `lsof -i :8000` and `lsof -i :3000`

---

## 📋 Project Structure

```
ai-kinator/
├── backend/
│   ├── main.py                 # FastAPI app with / and /health endpoints
│   ├── pyproject.toml          # UV + project metadata
│   ├── uv.lock                 # UV lock file (auto-generated)
│   ├── .venv/                  # Python virtual environment (auto-created)
│   └── .gitignore
├── frontend/
│   ├── package.json            # React app configuration
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js              # Main component (displays health status)
│   │   ├── pages/GameView/GameView.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── .gitignore
├── docs/
│   ├── AIKINATOR-PROTOTYPE.md  # Implementation tasks
│   └── TASK1_COMPLETION.md
├── instalacja.md               # Installation & first-run reference
├── copilot-instructions.md     # Development guide
├── package.json                # Root workspace config (npm-run-all for parallel dev)
└── README.md                   # This file
```

---

## ✅ Task 1 Acceptance Criteria – COMPLETED

- ✅ Backend starts without errors: `uvicorn main:app --reload --port 8000`
- ✅ Frontend starts successfully: `npm start`
- ✅ Frontend can fetch and display backend health status
- ✅ CORS configured for localhost:3000
- ✅ Project structure created and organized
- ✅ .gitignore files added

## ✅ Task 2 Acceptance Criteria – IN PROGRESS

- ✅Data Models defined**: Pydantic models for Room creation request and response
- ✅Room Creation Endpoint**: `POST /rooms` implemented in FastAPI
- ✅Unique Room ID Generation**: Logic to generate short, unique alphanumeric IDs
- ✅In-memory Storage/Database**: Basic dictionary or SQLite logic to store room state
- ✅Validation**: Ensure room names/settings are validated before creation
- ✅API Documentation**: Endpoint visible and testable via `/docs` (Swagger UI)
- ✅Unit Tests**: Basic test cases for room creation (optional but recommended)

**Next:** Task 3 - Room joining and player session management