import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser
from app.core.schemas import AgentParams, AgentResponse, EvaluationResponse

load_dotenv()

# Initialize LangChain Chat Model
chat = ChatOpenAI(
    model="gpt-4o", api_key=os.environ.get("OPENAI_API_KEY"), temperature=0.7
)

# Initialize Fast Model for Quick Evaluation
chat_fast = ChatOpenAI(
    model="gpt-4o-mini", api_key=os.environ.get("OPENAI_API_KEY"), temperature=0.3
)


async def analyze_pose(request: AgentParams) -> AgentResponse:
    instruction = (
        request.instruction
        or "Analyze the following pose landmarks and provide feedback."
    )

    messages = [
        SystemMessage(
            content=(
                "You are an expert fitness coach and biomechanics specialist. "
                "Analyze the provided image containing a 3D pose."
            )
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
            feedback_str = ", ".join(rep.feedback) if rep.feedback else "None"
            instruction += (
                f"Rep {i+1}: {rep.duration:.1f}s, Valid: {rep.is_valid}\n"
                f"  Feedback given: {feedback_str}\n"
            )
            if rep.min_angles and "knee" in rep.min_angles:
                instruction += (
                    f"  Lowest Knee Angle: {rep.min_angles['knee']:.1f} degrees\n"
                )
            if rep.start_angles and "knee" in rep.start_angles:
                instruction += (
                    f"  Highest Knee Angle (Start): "
                    f"{rep.start_angles['knee']:.1f} degrees\n"
                )
            if rep.metrics:
                instruction += "  Metrics:\n"
                for key, value in rep.metrics.items():
                    val_str = f"{value:.2f}" if isinstance(value, float) else str(value)
                    instruction += f"    - {key}: {val_str}\n"
            elif rep.min_angles:
                instruction += f"  Depth (Min Angles): {rep.min_angles}\n"

        instruction += (
            "\nProvide a very concise summary of the performance and specific tips "
            "for improvement. Use Markdown formatting with bullet points "
            "(maximum 4 points). Keep it short!"
        )

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


async def quick_evaluate(request: AgentParams) -> EvaluationResponse:
    parser = JsonOutputParser(pydantic_object=EvaluationResponse)

    instruction = (
        "You are a strict fitness coach. Analyze the session data to decide if the user needs detailed feedback. "
        "Return JSON with a single key 'needs_feedback' (boolean). "
        "Set 'needs_feedback' to true ONLY if there are significant form issues. "
        "If form is generally good, set 'needs_feedback' to false."
        "\n\n"
    )

    if request.session_data:
        session = request.session_data
        instruction += f"Exercise: {session.exercise_name}\n"
        for i, rep in enumerate(session.reps):
            instruction += (
                f"Rep {i+1}: Valid={rep.is_valid}, "
                f"Feedback={rep.feedback}, "
                f"Metrics={rep.metrics}\n"
            )

    messages = [
        SystemMessage(content="You are a fitness AI. Output valid JSON only."),
        HumanMessage(content=instruction + "\n" + parser.get_format_instructions()),
    ]

    try:
        response = await chat_fast.ainvoke(messages)
        parsed = parser.parse(response.content)
        return EvaluationResponse(**parsed)
    except Exception as e:
        print(f"Quick evaluation failed: {e}")
        # Fallback: always provide feedback if quick eval fails
        return EvaluationResponse(needs_feedback=True)
