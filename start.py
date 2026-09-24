"""
start.py
────────
Single startup script for TalentForge AI platform.
Initialises SQLite database and starts FastAPI backend (Port 8000) and Vite frontend (Port 8080) concurrently.
"""

import io
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

# Ensure stdout/stderr handles UTF-8 on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"


def get_python_executable() -> str:
    """Locate backend .venv Python executable or fall back to sys.executable."""
    venv_py = (
        BACKEND_DIR
        / ".venv"
        / ("Scripts" if os.name == "nt" else "bin")
        / ("python.exe" if os.name == "nt" else "python")
    )
    if venv_py.exists():
        return str(venv_py)
    return sys.executable


def main() -> None:
    py_bin = get_python_executable()
    print("=" * 65)
    print("[STARTUP] Starting TalentForge AI Platform (Backend & Frontend)")
    print("=" * 65)
    print(f"Python Binary : {py_bin}")
    print(f"Backend Dir   : {BACKEND_DIR}")
    print(f"Frontend Dir  : {FRONTEND_DIR}")
    print("=" * 65)

    # 1. Database Initialization / Migration
    print("\n[DB] Initialising SQLite database...")
    subprocess.run([py_bin, "migrate_to_sqlite.py"], cwd=BACKEND_DIR, check=False)

    processes: list[subprocess.Popen] = []
    try:
        # 2. Start Backend FastAPI Server
        print("\n[BACKEND] Starting FastAPI Backend Server (http://localhost:8000)...")
        backend_cmd = [py_bin, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"]
        backend_proc = subprocess.Popen(backend_cmd, cwd=BACKEND_DIR)
        processes.append(backend_proc)

        # 3. Start Frontend Vite Dev Server
        print("[FRONTEND] Starting Vite Frontend Dev Server (http://localhost:8080)...")
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        frontend_cmd = [npm_cmd, "run", "dev"]
        frontend_proc = subprocess.Popen(frontend_cmd, cwd=FRONTEND_DIR)
        processes.append(frontend_proc)

        print("\n" + "=" * 65)
        print("[READY] TalentForge AI platform is up and running!")
        print("   - Frontend UI  : http://localhost:8080")
        print("   - Backend API  : http://localhost:8000")
        print("   Press Ctrl+C to terminate both servers.")
        print("=" * 65 + "\n")

        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[SHUTDOWN] Shutting down backend and frontend servers...")
        for p in processes:
            try:
                p.terminate()
            except Exception:
                pass
        sys.exit(0)


if __name__ == "__main__":
    main()
