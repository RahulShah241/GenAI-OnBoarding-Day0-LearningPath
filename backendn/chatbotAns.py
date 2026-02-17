from pydantic import BaseModel, Field
from typing import Dict, List


class ChatbotAnswer(BaseModel):
    question: str
    answer: str


class EmployeeChatbotResponse(BaseModel):
    employee_id: str = Field(description="Unique employee identifier")
    role: str = Field(description="Employee role/title")
    responses: Dict[str, List[ChatbotAnswer]] = Field(
        description="Topic-wise chatbot answers"
    )
    confirmed: bool = Field(default=False)
