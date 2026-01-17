from dotenv import load_dotenv

load_dotenv()

from langchain.agents import create_agent
from langchain_ollama import ChatOllama
from langchain_tavily import TavilySearch

from schemas import AgentResponse, Course

tools = [TavilySearch()]
llm = ChatOllama(model="llama3.2", url="http://localhost:11434")


agent = create_agent(
    model=llm,
    tools=tools,
    response_format=AgentResponse,
)
agent2=create_agent(
    model=llm,
    tools=tools,
    response_format=Course,
)
#use mcp agent to get relavent user profile data from user profile mcp

def main():
    result = agent2.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "search for 3 Learning resource for an {} using langchain from udemhy and list their details".format("AI Engineer"),
                }
            ]
        }
    )
    # Access structured response from the agent
    structured = result.get("structured_response", None)
    print(structured if structured is not None else result)


if __name__ == "__main__":
    main()
