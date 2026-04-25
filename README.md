## 📄 Specyfikacja prototypu

Zobacz: [AIKINATOR-PROTOTYPE](docs/AIKINATOR-PROTOTYPE.md)

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

