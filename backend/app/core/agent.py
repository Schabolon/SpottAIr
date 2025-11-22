import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.schemas import AgentParams, AgentResponse

# Initialize LangChain Chat Model
chat = ChatOpenAI(
    model="gpt-4o",
    api_key=os.environ.get("OPENAI_API_KEY"),
    temperature=0.7
)

async def analyze_pose(request: AgentParams) -> AgentResponse:
    instruction = (
        request.instruction
        or "Analyze the following pose landmarks and provide feedback."
    )

    messages = [
        SystemMessage(content="You are an expert fitness coach and biomechanics specialist. Analyze the provided image containing a 3D pose."),
    ]

    user_content = []
    if request.image:
        user_content.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{request.image}"},
            }
        )

    user_content.append({"type": "text", "text": instruction})
    
    messages.append(HumanMessage(content=user_content))

    response = await chat.ainvoke(messages)

    return AgentResponse(text=response.content)
