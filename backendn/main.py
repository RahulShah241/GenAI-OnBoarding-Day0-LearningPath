# from dotenv import load_dotenv

# load_dotenv()

# from langchain.agents import create_agent
# from langchain_ollama import ChatOllama
# from langchain_tavily import TavilySearch

# from schemas import AgentResponse, Course

# tools = [TavilySearch()]
# llm = ChatOllama(model="llama3.2", url="http://localhost:11434")


# agent = create_agent(
#     model=llm,
#     tools=tools,
#     response_format=AgentResponse,
# )
# agent2=create_agent(
#     model=llm,
#     tools=tools,
#     response_format=Course,
# )
# #use mcp agent to get relavent user profile data from user profile mcp

# def main():
#     result = agent2.invoke(
#         {
#             "messages": [
#                 {
#                     "role": "user",
#                     "content": "search for 3 Learning resource for an {} using langchain from udemhy and list their details".format("AI Engineer"),
#                 }
#             ]
#         }
#     )
#     # Access structured response from the agent
#     structured = result.get("structured_response", None)
#     print(structured if structured is not None else result)


# if __name__ == "__main__":
#     main()

from fastapi import FastAPI
from api import router as chatbot_router
from server import general_pages_router 
from schemas import TopicResponseCreate, TopicResponseStored
from pathlib import Path
from datetime import datetime
import json
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="GenAI Employee Onboarding Platform")

app.include_router(chatbot_router)
app.include_router(general_pages_router)

# ✅ CORS CONFIG (VERY IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],     # allows OPTIONS, POST, GET, etc
    allow_headers=["*"],
)
# app = FastAPI(title="Employee Skill Assessment (File Storage)")

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "responses"
DATA_DIR.mkdir(parents=True, exist_ok=True)


def get_employee_file(email: str) -> Path:
    safe_email = email.replace("@", "_").replace(".", "_")
    return DATA_DIR / f"{safe_email}.json"


@app.post("/employee/topic-response")
def save_topic_response(payload: TopicResponseCreate):
    file_path = get_employee_file(payload.employee_email)

    new_entry = TopicResponseStored(
        **payload.model_dump(),
        timestamp=datetime.utcnow()
    ).model_dump()

    # Load existing data
    if file_path.exists():
        with open(file_path, "r") as f:
            data = json.load(f)
    else:
        data = {
            "employee_email": payload.employee_email,
            "role": payload.role,
            "responses": []
        }

    data["responses"].append(new_entry)

    with open(file_path, "w") as f:
        json.dump(data, f, indent=2, default=str)

    return {
        "status": "saved",
        "topic": payload.topic
    }


@app.get("/employee/{email}/responses")
def get_employee_responses(email: str):
    file_path = get_employee_file(email)

    if not file_path.exists():
        return {"responses": []}

    with open(file_path, "r") as f:
        return json.load(f)
