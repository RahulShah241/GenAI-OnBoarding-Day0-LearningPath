# 🧪 RAG Evaluation Suite — TalentForge AI

Comprehensive automated evaluation suite for Retrieval-Augmented Generation (RAG) within the **TalentForge AI** (Employee–Project Matching & Onboarding) platform.

---

## 📌 Overview

The platform uses RAG and GenAI across multiple stages:
1. **Candidate Retrieval & Matching** (`backend/matching.py`): Ingests project requirements and retrieves top candidate employee profiles.
2. **AI Tutor Learning Path Generation** (`backend/services/learning_path.py`): Retrieves project context & employee skill gaps, feeding them to Google Gemini LLM to generate structured 3-tier learning paths with interactive demos.
3. **Course Recommendations** (`backend/services/course_recommender.py`): Retrieves skill gaps and generates vetted course links and platforms.
4. **Onboarding Quality Evaluation & Threshold Gate** (`backend/services/nlp_scoring.py` & `llm_scoring.py`): Enforces answer quality thresholds (`SCORE_THRESHOLD = 2.5`) to reject low-substance responses before database storage.

This module provides objective, repeatable metrics to evaluate both the **Retrieval** and **Generation** stages, preventing hallucinations and ensuring high groundedness.

---

## 📐 Evaluated Metrics

### 1. The RAG Triad
| Metric | Description | Target |
|---|---|---|
| **Context Relevance** | Precision of query concepts and required skills in retrieved project/employee contexts. | $\ge 0.60$ |
| **Faithfulness (Groundedness)** | Fraction of claims, skills, and tools in the LLM generation that are grounded in retrieved context (detects hallucinations). | $\ge 0.50$ |
| **Answer Relevance** | Degree to which the output directly addresses the user query and required missing skills. | $\ge 0.60$ |

### 2. Retrieval & Information Retrieval (IR) Metrics
- **Precision@K**: Fraction of top-$K$ retrieved employees or projects that are relevant.
- **Recall@K**: Fraction of total relevant candidates captured in the top-$K$.
- **Hit Rate@K**: Whether at least one relevant candidate is present in top-$K$.
- **MRR (Mean Reciprocal Rank)**: Reciprocal rank ($1/\text{rank}$) of the first relevant retrieved candidate.

### 3. Structural & Domain Checks
- **Skill Gap Coverage**: Percentage of identified skill gaps addressed by the generated curriculum.
- **Schema Adherence**: Verification of JSON output structure (e.g., `learning_tiers`, `practical_demo`, `required_frameworks`).
- **Threshold Gate Enforcement**: Verification that low-quality answers fail the minimum score threshold.

---

## 📂 Directory Structure

```
rag_evaluation/
├── __init__.py               # Package exports
├── metrics.py                # Core RAG Triad & IR metric implementations
├── dataset.py                # Curated benchmark cases (grounded + hallucinated negatives)
├── evaluator.py              # RAGEvaluator engine and scorecard aggregator
├── test_rag_evaluation.py    # Automated test suite (pytest + unittest compatible)
├── run_eval.py               # CLI runner with scorecard and report export
├── requirements.txt          # Python dependencies
├── eval_report.json          # Generated JSON evaluation output
├── eval_report.md            # Generated Markdown evaluation scorecard
└── README.md                 # Documentation
```

---

## 🚀 Running the Tests & Evaluation

### 1. Run with `pytest` (Recommended)
```bash
.\backend\.venv\Scripts\python.exe -m pytest rag_evaluation/test_rag_evaluation.py -v
```

### 2. Run with standard Python `unittest` (Zero Extra Dependencies)
```bash
.\backend\.venv\Scripts\python.exe -m unittest discover -s rag_evaluation -v
```

### 3. Run the CLI Evaluation Runner & Generate Reports
```bash
.\backend\.venv\Scripts\python.exe rag_evaluation/run_eval.py
```
This prints the benchmark scorecard in the console and updates:
- [`rag_evaluation/eval_report.json`](file:///c:/Users/ASUS%20ROG/Desktop/py/GenAI/Projects/langchain-course/tcs/GenAI-OnBoarding-Day0-LearningPath/rag_evaluation/eval_report.json)
- [`rag_evaluation/eval_report.md`](file:///c:/Users/ASUS%20ROG/Desktop/py/GenAI/Projects/langchain-course/tcs/GenAI-OnBoarding-Day0-LearningPath/rag_evaluation/eval_report.md)

---

## 🧪 Adding New Test Cases

Edit `rag_evaluation/dataset.py` and append new cases to `BENCHMARK_DATASET`:

```python
BENCHMARK_DATASET["learning_path_cases"].append({
    "id": "LP-003",
    "name": "Custom Project Onboarding",
    "query": "...",
    "project_data": { ... },
    "employee_skills": [ ... ],
    "expected_gap_skills": [ ... ],
    "retrieved_context": [ ... ],
    "grounded_response": { ... },
    "hallucinated_response": { ... },
})
```
