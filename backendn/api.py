from fastapi import APIRouter, HTTPException
from chatbotAns import EmployeeChatbotResponse
from datetime import datetime

router = APIRouter(prefix="/api/chatbot", tags=["Employee Chatbot"])

# Temporary in-memory storage (replace with DB later)
CHATBOT_RESPONSES_DB = []


@router.post("/submit")
async def submit_chatbot_response(payload: EmployeeChatbotResponse):
    """
    Called AFTER employee completes all chatbot topics
    """

    if not payload.responses:
        raise HTTPException(
            status_code=400,
            detail="Chatbot responses cannot be empty",
        )

    # Ensure all topics have at least one answer
    for topic, answers in payload.responses.items():
        if len(answers) == 0:
            raise HTTPException(
                status_code=400,
                detail=f"Topic '{topic}' has no answers",
            )

    record = {
        "employee_id": payload.employee_id,
        "role": payload.role,
        "responses": payload.responses,
        "confirmed": payload.confirmed,
        "submitted_at": datetime.utcnow(),
    }

    CHATBOT_RESPONSES_DB.append(record)

    return {
        "status": "success",
        "message": "Employee chatbot responses saved successfully",
        "employee_id": payload.employee_id,
        "topics_completed": len(payload.responses),
    }


@router.get("/all")
async def get_all_chatbot_responses():
    """HR / Admin endpoint"""
    return CHATBOT_RESPONSES_DB
