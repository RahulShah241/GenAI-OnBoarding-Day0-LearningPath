# RAG Evaluation Report — TalentForge AI

**Generated:** 2026-11-01 06:17:17 UTC

## Aggregate Scorecard

| Metric | Value | Target Threshold | Status |
|---|---|---|---|
| **Pass Rate** | 80.0% | >= 80% | PASS |
| **Mean Context Relevance** | 0.7956 | >= 0.60 | PASS |
| **Mean Faithfulness (Groundedness)** | 0.6746 | >= 0.50 | PASS |
| **Mean Answer Relevance** | 0.7013 | >= 0.60 | PASS |
| **Composite RAG Triad Score** | 0.7663 | >= 0.60 | PASS |

## Detailed Test Case Breakdown

| Case ID | Category | Context Rel | Faithfulness | Answer Rel | Composite | Result |
|---|---|---|---|---|---|---|
| `LP-001` | learning_path | 0.78 | 0.04 | 0.87 | 0.59 | FAIL |
| `LP-002` | learning_path | 0.60 | 0.51 | 0.84 | 0.71 | PASS |
| `CR-001` | course_recommendations | 0.60 | 0.82 | 0.80 | 0.84 | PASS |
| `RET-001` | candidate_retrieval | 1.00 | 1.00 | 0.67 | 0.90 | PASS |
| `RET-002` | candidate_retrieval | 1.00 | 1.00 | 0.33 | 0.80 | PASS |
