import json
import re
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"


def extract_json(text: str):
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return None


def llm_score(topic: str, question: str, answer: str) -> dict:
    prompt = f"""
You are an HR evaluator.

Topic: {topic}
Question: {question}
Answer: {answer}

Return ONLY valid JSON:
{{
  "relevance": 0-5,
  "depth": 0-5,
  "clarity": 0-5,
  "feedback": "short feedback"
}}
"""

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False
        },
        timeout=30
    )

    print("STATUS:", response.status_code)
    print("RAW RESPONSE:\n", response.text)

    # parsed = extract_json(response.text)
    try:
        print(json.loads(response.text)['response'])
        return json.loads(json.loads(response.text)['response'])
    except json.JSONDecodeError:
        return {
            "relevance": 0,
            "depth": 0,
            "clarity": 0,
            "feedback": "LLM evaluation failed"
        }
    if not parsed:
        return {
            "relevance": 0,
            "depth": 0,
            "clarity": 0,
            "feedback": "LLM evaluation failed"
        }

    return parsed
