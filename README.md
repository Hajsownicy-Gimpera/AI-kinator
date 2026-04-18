## 📄 Specyfikacja prototypu

Zobacz: [AIKINATOR-PROTOTYPE](docs/AIKINATOR-PROTOTYPE.md)
Zobacz w root folderze: copilot-instructions.md

---

## 🚀 Quick Start – Task 1: Setup Complete ✅

### Installation & Running

```bash
# Install dependencies (backend uses uv manager, triggered automatically)
npm install

# Run both backend and frontend in parallel
npm run dev
```

**Or run individually:**

```bash
# Backend only (http://localhost:8000)
npm run backend

# Frontend only (http://localhost:3000)
npm run frontend
```

**Available endpoints:**
- `GET /` → `{"status": "ok"}`
- `GET /health` → `{"status": "healthy"}`

**Frontend Features:**
- Frontend opens on http://localhost:3000
- Displays backend health status
- Fetches from backend `/health` endpoint
- Shows connection status

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