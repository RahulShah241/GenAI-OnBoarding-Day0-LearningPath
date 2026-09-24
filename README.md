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
