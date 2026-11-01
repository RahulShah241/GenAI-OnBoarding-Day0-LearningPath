# TalentForge AI - Employee–Project Matching Platform

## 🐳 Running with Docker (Recommended)

To build and launch the complete stack (**FastAPI Backend + SQLite DB + React Frontend**) using Docker:

```bash
docker compose up --build
```

- **Frontend UI**: [http://localhost:8080](http://localhost:8080)
- **Backend API**: [http://localhost:8000](http://localhost:8000)

To stop the containers:

```bash
docker compose down
```

---

## 🚀 Native One-Command Setup

If running locally without Docker:

```bash
python start.py
```

### Windows Launchers:

- **Batch**: `start.bat` (or double-click `start.bat`)
- **PowerShell**: `.\start.ps1`

---

## 🛠 Manual Setup

### Backend (FastAPI + SQLite)

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate  # Windows
pip install -r requirements.txt
python migrate_to_sqlite.py  # SQLite DB Setup
python -m uvicorn main:app --reload --port 8000
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 URLs

- **Frontend UI**: [http://localhost:8080](http://localhost:8080)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

## Eval

---

## CASE ID | CATEGORY | CTX REL | FAITH | ANS REL | COMP | STATUS

LP-001 | learning_path | 0.78 | 0.77 | 0.87 | 0.84 | [PASS]
LP-002 | learning_path | 0.60 | 0.77 | 0.80 | 0.79 | [PASS]
CR-001 | course_recommendatio | 0.60 | 0.81 | 0.84 | 0.84 | [PASS]
RET-001 | candidate_retrieval | 1.00 | 1.00 | 0.67 | 0.90 | [PASS]
RET-002 | candidate_retrieval | 1.00 | 1.00 | 0.33 | 0.80 | [PASS]

---

SUMMARY SCORECARD:

- Total Test Cases : 5
- Passed Cases : 5
- Pass Rate : 100.0%
- Mean Context Relevance: 0.7956
- Mean Faithfulness : 0.8680
- Mean Answer Relevance : 0.7013
- Mean Composite Score : 0.8342
