import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.schemas import AgentParams, AgentResponse

load_dotenv()

# Initialize LangChain Chat Model
chat = ChatOpenAI(
    model="gpt-4o", api_key=os.environ.get("OPENAI_API_KEY"), temperature=0.7
)


async def analyze_pose(request: AgentParams) -> AgentResponse:
    instruction = (
        request.instruction
        or "Analyze the following pose landmarks and provide feedback."
    )

    messages = [
        SystemMessage(
            content="You are an expert fitness coach and biomechanics specialist. Analyze the provided image containing a 3D pose."
        ),
    ]

    user_content = []
    
    if request.session_data:
        # Construct detailed prompt from session data
        session = request.session_data
        instruction = (
            f"Analyze the following training session for {session.exercise_name}.\n"
            f"Total Reps: {session.total_reps}\n\n"
            "Rep Details:\n"
        )
        
        for i, rep in enumerate(session.reps):
            instruction += (
                f"Rep {i+1}: {rep.duration:.1f}s, Valid: {rep.is_valid}\n"
                f"  Feedback given: {', '.join(rep.feedback) if rep.feedback else 'None'}\n"
            )
            if rep.min_angles and "knee" in rep.min_angles:
                instruction += f"  Lowest Knee Angle: {rep.min_angles['knee']:.1f} degrees\n"
            if rep.start_angles and "knee" in rep.start_angles:
                instruction += f"  Highest Knee Angle (Start): {rep.start_angles['knee']:.1f} degrees\n"
            elif rep.min_angles:
                instruction += f"  Depth (Min Angles): {rep.min_angles}\n"
        
        instruction += "\nProvide a max of 10 words for performance summary. Give criticism and tips for improvement (very short bullet-points, max of 4 points). Use Markdown formatting with bullet points. Keep it very short and concise!"
    
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
