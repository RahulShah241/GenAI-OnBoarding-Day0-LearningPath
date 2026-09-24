# 🚀 AI Employee Onboarding Platform

> Full-stack HR platform with AI chatbot onboarding, dual NLP + LLM answer scoring, automatic employee profile generation, and intelligent project–employee matching.

![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Pydantic](https://img.shields.io/badge/Pydantic-v2-orange?style=flat-square)
![Deployed](https://img.shields.io/badge/Deployed-Render-purple?style=flat-square)

---

## 📌 What It Solves

Traditional onboarding captures job titles and years of experience — nothing about **actual knowledge depth**. New hires fill out static forms, HR learns nothing useful, and project assignment is based on guesswork.

**Real challenges this platform addresses:**

1. **Knowledge quality problem** — A threshold gate rejects low-quality answers before storage and prompts the employee to try again. Only substantive responses are persisted and scored.
2. **Skills gap problem** — The NLP scorer extracts actual skills from an employee's own words and writes them back into their profile, making project matching progressively richer as they complete more topics.
3. **Assignment problem** — A weighted matching algorithm (70% skill overlap + 30% experience) ranks all employees against any project, surfacing exact matched and missing skills for HR to act on.

---

## ✨ Key Features

### AI Chatbot Onboarding
- Topic-based question flow (Role, Skills, Experience, Goals, etc.)
- Session resume — employees continue exactly where they left off across sessions
- Real-time scoring feedback after each answer
- Threshold gate — answers below minimum score are rejected with written feedback

### Dual Scoring Pipeline
- **NLP scorer** — keyword density, topic relevance, answer length and structure (0–5 scale)
- **LLM scorer** — evaluates relevance, depth, and clarity with written feedback (0–5 per dimension)
- **Combined score** — `mean(nlp_score, llm_average)` capped at 5.0
- **Threshold enforcement** — `threshold_passed=False` prevents storage of low-quality answers

### Automatic Profile Generation
- After every topic submission, a full `EmployeeProfile` is regenerated and persisted
- NLP-extracted skills written back to `employees.json` — matching always uses richest skill data
- Readiness classification: `Ready / Developing / Needs Development`

### Project–Employee Matching
- Weighted formula: `0.7 × skill_score + 0.3 × experience_score`
- Case-insensitive skill comparison, matched and missing skills surfaced per employee
- Role level → required years mapping: Junior=1, Mid=3, Senior=5, Lead=7

### Role-Based Access Control
- `EMPLOYEE` — own data only (chatbot, own profile)
- `HR` — all profiles, employee list, project matching
- `ADMIN` — full control, add employees, manage projects

---

## 💥 Impact

| Metric | Value |
|--------|-------|
| Scoring dimensions | 4 (NLP score + LLM relevance/depth/clarity) |
| Profile regeneration | After every topic — always current |
| Skill sync | Automatic NLP extraction → employee record |
| Match precision | Skill overlap + experience, with missing skills surfaced |
| Frontend | Production-grade React + TypeScript + Shadcn/UI |
| Deployment | Live on Render |

---

## 🏗️ Technical Architecture

### Scoring Pipeline

```
Employee Answer + Topic
        │
        ├──► NLP Scorer
        │        ├── keyword extraction
        │        ├── topic relevance score
        │        ├── length/structure checks
        │        └── threshold_passed (bool)
        │
        ├──► LLM Scorer
        │        ├── relevance (0–5)
        │        ├── depth (0–5)
        │        ├── clarity (0–5)
        │        └── written feedback
        │
        └──► combine_scores()
                 ├── llm_avg = (relevance + depth + clarity) / 3
                 ├── final_score = mean(nlp_score, llm_avg)
                 └── capped at 5.0
                          │
                          ▼
              threshold_passed?
             /                 \
           NO                  YES
            │                   │
      Return feedback       Persist answer
      (not stored)          Regenerate profile
                            Sync skills → employees.json
```

### Matching Formula

```python
skill_score   = (matched_skills / required_skills) * 100   # 0–100
exp_score     = min(employee_exp / required_exp, 1) * 100  # 0–100
final_score   = round(0.7 * skill_score + 0.3 * exp_score) # 0–100 integer
```

### Project Structure

```
onboarding/
├── backend/
│   ├── main.py                      ← FastAPI app (all endpoints)
│   ├── matching.py                  ← Project–employee matching algorithm
│   ├── schemas.py                   ← Pydantic v2 models
│   ├── json_db.py                   ← JSON file DB helpers
│   ├── auth/
│   │   ├── router.py                ← /auth/login
│   │   ├── security.py              ← JWT issue/verify
│   │   └── dependencies.py          ← get_current_user, require_roles
│   ├── services/
│   │   ├── nlp_scoring.py           ← NLP scorer (0–5)
│   │   ├── llm_scoring.py           ← LLM scorer (0–5 per dimension)
│   │   ├── scoring_engine.py        ← combine_scores()
│   │   └── profile_generator.py     ← EmployeeProfile builder
│   └── data/
│       ├── employees.json           ← Employee records
│       ├── projectDetails.json      ← Project definitions
│       ├── employee_responses/      ← Per-employee chatbot responses
│       └── profiles/                ← Generated EmployeeProfile JSONs
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── api/
    │   │   ├── api.tsx              ← Axios client
    │   │   └── hooks.ts             ← React Query hooks
    │   ├── auth/
    │   │   └── ProtectedRoute.tsx
    │   ├── pages/                   ← All route pages
    │   └── components/              ← Shadcn/UI + custom components
    ├── package.json
    └── vite.config.ts
```

### API Endpoints

| Tag | Method | Endpoint | Roles | Description |
|-----|--------|----------|-------|-------------|
| Auth | `POST` | `/auth/login` | All | Issue JWT |
| Chatbot | `POST` | `/employee/topic-response` | EMPLOYEE | Submit answer, get score + feedback |
| Chatbot | `GET` | `/employee/progress/{id}` | EMPLOYEE | Resume state — completed topics + history |
| Chatbot | `POST` | `/employee/finalize-profile` | EMPLOYEE | Explicitly regenerate + store profile |
| Profiles | `GET` | `/employee/profile/{id}` | EMPLOYEE/HR/ADMIN | Get generated profile |
| Profiles | `GET` | `/hr/employee-profiles` | HR/ADMIN | List all profiles |
| Projects | `GET` | `/projects` | HR/ADMIN | List projects (summary) |
| Projects | `GET` | `/projects/{id}` | All | Full project details |
| Projects | `POST` | `/project` | HR/ADMIN | Create project |
| Matching | `GET` | `/projects/{id}/suggested-employees` | HR/ADMIN | Ranked employee suggestions |
| Employees | `GET` | `/employees` | HR/ADMIN | List all employees |
| Employees | `GET` | `/employees/{id}` | All (own only for EMPLOYEE) | Get employee |

---

## 🚀 Run Locally

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set your LLM API key and allowed origins

# Start the server
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### Frontend

```bash
cd frontend

npm install
npm run dev
# Opens at http://localhost:5173
```

### Default Credentials (demo data)

| Role | Email | Password |
|------|-------|----------|
| HR | hr@company.com | password123 |
| Employee | employee@company.com | password123 |

---

## 🔐 Authentication

All endpoints except `/auth/login` require a JWT Bearer token:

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "hr@company.com", "password": "password123"}'

# Use token
curl http://localhost:8000/employees \
  -H "Authorization: Bearer <token>"
```

---

## 📊 Employee Profile Schema

```json
{
  "employee_id": "E001",
  "overall_score": 4.2,
  "readiness": "Ready",
  "extracted_skills": ["Python", "FastAPI", "React", "SQL"],
  "merged_skills": ["Python", "FastAPI", "React", "SQL", "TypeScript"],
  "topic_scores": {
    "Role": 4.5,
    "Skills": 4.1,
    "Experience": 3.9
  },
  "responses_count": 12,
  "generated_at": "2025-04-12T10:30:00Z"
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | FastAPI 0.111 + Uvicorn |
| Auth | JWT (python-jose) + bcrypt |
| Validation | Pydantic v2 |
| AI scoring | NLP (custom) + LLM (configurable) |
| Database | JSON file-based (drop-in SQLite/Postgres upgrade) |
| Frontend framework | React 18 + TypeScript |
| UI components | Shadcn/UI + Tailwind CSS |
| Build tool | Vite |
| Deployment | Render |

---

## 🗺️ Roadmap

- [ ] Replace JSON file DB with PostgreSQL for concurrent write safety
- [ ] Add evaluation harness for scoring pipeline quality
- [ ] E2E test suite (Playwright)
- [ ] Bulk employee import (CSV)
- [ ] Dashboard analytics for HR (score distributions, readiness heatmap)

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
