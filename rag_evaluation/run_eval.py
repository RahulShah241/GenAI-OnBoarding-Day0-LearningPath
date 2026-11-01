"""
rag_evaluation/run_eval.py
──────────────────────────
CLI Evaluation Runner for TalentForge AI RAG System.

Usage:
  python rag_evaluation/run_eval.py
  python rag_evaluation/run_eval.py --live
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Fix Windows console encoding if needed
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Setup import path
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_BACKEND_DIR = _PROJECT_ROOT / "backend"

if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from rag_evaluation.dataset import BENCHMARK_DATASET
from rag_evaluation.evaluator import RAGEvaluator


def print_banner():
    print("=" * 80)
    print(" [*] TalentForge AI - RAG Evaluation Suite Runner")
    print(f" Timestamp: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("=" * 80)


def run_evaluation(live: bool = False) -> dict:
    evaluator = RAGEvaluator(min_composite_threshold=0.60, min_faithfulness_threshold=0.50)
    print("\n[+] Executing RAG evaluation across benchmark test cases...")

    results = evaluator.evaluate_benchmark_suite(BENCHMARK_DATASET, use_live_llm=live)

    # Print summary table
    print("\n" + "-" * 80)
    print(f"{'CASE ID':<10} | {'CATEGORY':<20} | {'CTX REL':<8} | {'FAITH':<8} | {'ANS REL':<8} | {'COMP':<8} | {'STATUS'}")
    print("-" * 80)

    for item in results["results"]:
        status = "[PASS]" if item["passed"] else "[FAIL]"
        c_rel = f"{item['context_relevance']:.2f}"
        faith = f"{item['faithfulness']:.2f}"
        a_rel = f"{item['answer_relevance']:.2f}"
        comp = f"{item['composite_score']:.2f}"
        cat = item['category'][:20]
        cid = item['case_id']
        print(f"{cid:<10} | {cat:<20} | {c_rel:<8} | {faith:<8} | {a_rel:<8} | {comp:<8} | {status}")

    print("-" * 80)
    print("SUMMARY SCORECARD:")
    print(f"  * Total Test Cases      : {results['total_cases']}")
    print(f"  * Passed Cases          : {results['passed_cases']}")
    print(f"  * Failed Cases          : {results['failed_cases']}")
    print(f"  * Pass Rate             : {results['pass_rate_percentage']}%")
    print(f"  * Mean Context Relevance: {results['mean_context_relevance']:.4f}")
    print(f"  * Mean Faithfulness     : {results['mean_faithfulness']:.4f}")
    print(f"  * Mean Answer Relevance : {results['mean_answer_relevance']:.4f}")
    print(f"  * Mean Composite Score  : {results['mean_composite_rag_score']:.4f}")
    print("=" * 80 + "\n")

    # Save reports
    report_json_path = Path(__file__).resolve().parent / "eval_report.json"
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"[+] Detailed JSON report saved to: {report_json_path}")

    # Generate Markdown report
    report_md_path = Path(__file__).resolve().parent / "eval_report.md"
    generate_markdown_report(results, report_md_path)
    print(f"[+] Markdown summary saved to   : {report_md_path}\n")

    return results


def generate_markdown_report(results: dict, out_path: Path):
    lines = [
        "# RAG Evaluation Report — TalentForge AI",
        "",
        f"**Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        "",
        "## Aggregate Scorecard",
        "",
        "| Metric | Value | Target Threshold | Status |",
        "|---|---|---|---|",
        f"| **Pass Rate** | {results['pass_rate_percentage']}% | >= 80% | {'PASS' if results['pass_rate_percentage'] >= 80 else 'FAIL'} |",
        f"| **Mean Context Relevance** | {results['mean_context_relevance']:.4f} | >= 0.60 | {'PASS' if results['mean_context_relevance'] >= 0.60 else 'FAIL'} |",
        f"| **Mean Faithfulness (Groundedness)** | {results['mean_faithfulness']:.4f} | >= 0.50 | {'PASS' if results['mean_faithfulness'] >= 0.50 else 'FAIL'} |",
        f"| **Mean Answer Relevance** | {results['mean_answer_relevance']:.4f} | >= 0.60 | {'PASS' if results['mean_answer_relevance'] >= 0.60 else 'FAIL'} |",
        f"| **Composite RAG Triad Score** | {results['mean_composite_rag_score']:.4f} | >= 0.60 | {'PASS' if results['mean_composite_rag_score'] >= 0.60 else 'FAIL'} |",
        "",
        "## Detailed Test Case Breakdown",
        "",
        "| Case ID | Category | Context Rel | Faithfulness | Answer Rel | Composite | Result |",
        "|---|---|---|---|---|---|---|",
    ]

    for item in results["results"]:
        status = "PASS" if item["passed"] else "FAIL"
        lines.append(
            f"| `{item['case_id']}` | {item['category']} | {item['context_relevance']:.2f} | "
            f"{item['faithfulness']:.2f} | {item['answer_relevance']:.2f} | {item['composite_score']:.2f} | {status} |"
        )

    lines.append("")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main():
    parser = argparse.ArgumentParser(description="TalentForge AI RAG Evaluation Runner")
    parser.add_argument("--live", action="store_true", help="Execute against live Gemini LLM APIs")
    args = parser.parse_args()

    print_banner()
    run_evaluation(live=args.live)


if __name__ == "__main__":
    main()
