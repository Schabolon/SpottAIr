import os
from openai import AsyncOpenAI
from app.core.schemas import AgentParams, AgentResponse

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


async def analyze_pose(request: AgentParams) -> AgentResponse:
    instruction = request.instruction or "Analyze the following pose landmarks and provide feedback."

    messages = [
        {
            "role": "system",
            "content": "You are an expert fitness coach and biomechanics specialist. Analyze the provided image containing a 3D pose.",
        },
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
    messages.append({"role": "user", "content": user_content})

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
    )

    return AgentResponse(text=response.choices[0].message.content)
