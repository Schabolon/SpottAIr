import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser
from app.core.schemas import AgentParams, AgentResponse, EvaluationResponse, RecommendationResponse, PlanAdjustmentRequest, PlanAdjustmentResponse

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
    feedback_text = response.content

    # 2. Generate Recommendation (if needed)
    # We assume if we are here, feedback was needed.
    recommendation = await recommend_adjustment(request.session_data.exercise_name, feedback_text)

    return AgentResponse(text=feedback_text, recommendation=recommendation)


async def recommend_adjustment(exercise_name: str, feedback_text: str) -> RecommendationResponse | None:
    parser = JsonOutputParser(pydantic_object=RecommendationResponse)

    prompt = (
        f"Based on the following analysis of a {exercise_name} session, "
        "suggest ONE corrective exercise to add to the training plan to fix the main issue.\n\n"
        f"Analysis:\n{feedback_text}\n\n"
        "You MUST suggest a corrective exercise if there are any form issues mentioned.\n"
        "Only return null if the feedback explicitly states that the form was perfect with no issues.\n"
        "Return a JSON object with:\n"
        "- 'exercise': Name of the corrective exercise\n"
        "- 'reason': Brief explanation of why this helps\n"
        "- 'difficulty': 'Beginner', 'Intermediate', or 'Advanced'\n"
    )

    messages = [
        SystemMessage(content="You are an expert fitness coach. Output valid JSON only."),
        HumanMessage(content=prompt + "\n" + parser.get_format_instructions()),
    ]

    try:
        print(f"Generating recommendation for {exercise_name} with feedback: {feedback_text[:50]}...")
        response = await chat.ainvoke(messages)
        print(f"Recommendation response: {response.content}")
        
        # Handle potential null response or empty string if model decides no rec is needed
        if not response.content.strip() or response.content.strip().lower() == 'null':
            print("No recommendation generated (null response).")
            return None
        
        parsed = parser.parse(response.content)
        print(f"Parsed recommendation: {parsed}")
        return RecommendationResponse(**parsed)
    except Exception as e:
        print(f"Recommendation failed: {e}")
        return None


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
        # Fallback: always provide feedback if quick eval fails
        return EvaluationResponse(needs_feedback=True)


async def adjust_training_plan(request: PlanAdjustmentRequest) -> PlanAdjustmentResponse:
    parser = JsonOutputParser(pydantic_object=PlanAdjustmentResponse)

    prompt = (
        "You are an expert fitness coach. Your goal is to optimize the user's training plan based on their recent performance.\n\n"
        f"Context:\n"
        f"- User just performed: {request.exercise_name}\n"
        f"- Feedback received: {request.workout_feedback}\n\n"
        "Current Training Plan (JSON):\n"
        f"{request.current_plan}\n\n"
        "Task:\n"
        "1. Analyze the feedback and the current plan.\n"
        "2. Make necessary adjustments to the plan. This could involve:\n"
        "   - Adding corrective exercises (e.g., for posture or weak points).\n"
        "   - Adjusting sets/reps for existing exercises.\n"
        "   - Swapping exercises if one is causing issues.\n"
        "3. Return the FULLY adjusted training plan structure.\n"
        "4. Provide a short, encouraging explanation of what you changed and why.\n"
        "5. For 'icon', use one of: 'Dumbbell', 'Activity', 'Footprints', 'ArrowUp', 'Shield', 'MoveVertical'. Default to 'Dumbbell'.\n\n"
        "IMPORTANT: Return valid JSON matching the PlanAdjustmentResponse schema.\n"
    )

    messages = [
        SystemMessage(content="You are a world-class personal trainer AI. Output valid JSON only."),
        HumanMessage(content=prompt + "\n" + parser.get_format_instructions()),
    ]

    try:
        print("Generating plan adjustment...")
        response = await chat.ainvoke(messages)
        parsed = parser.parse(response.content)
        return PlanAdjustmentResponse(**parsed)
    except Exception as e:
        print(f"Plan adjustment failed: {e}")
        # Fallback: return original plan with error message
        return PlanAdjustmentResponse(
            adjusted_plan=request.current_plan,
            explanation="Sorry, I couldn't optimize the plan at this moment. Please try again later."
        )
