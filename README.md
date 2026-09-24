# TalentForge AI - Employee–Project Matching Platform

## 🚀 One-Command Setup & Launch

To bring up both the **FastAPI Backend (Port 8000)** and **Vite Frontend (Port 8080)** together with automatic SQLite database initialization:

```bash
python start.py
```

### Windows Users
You can also run either of the helper scripts in the root directory:
- **Batch**: `start.bat` (or double-click `start.bat`)
- **PowerShell**: `.\start.ps1`

---

## 🛠 Manual Setup (Optional)

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
