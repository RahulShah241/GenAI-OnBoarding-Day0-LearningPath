import json
def combine_scores(nlp: dict, llm: dict) -> dict:
    if isinstance(llm, str):
        llm = json.loads(llm)
    llm_avg = (
        llm["relevance"] +
        llm["depth"] +
        llm["clarity"]
    ) / 3

    final_score = round((nlp["nlp_score"] + llm_avg) / 2, 2)

    return {
        "final_score": min(final_score, 10),
        "nlp": nlp,
        "llm": llm
    }
