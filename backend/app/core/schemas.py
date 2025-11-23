from pydantic import BaseModel
from typing import List, Dict, Any


class Landmark(BaseModel):
    x: float
    y: float
    z: float
    visibility: float
    presence: float


class PoseLandmarkerResult(BaseModel):
    landmarks: List[Landmark]


class RecommendationResponse(BaseModel):
    exercise: str
    reason: str
    difficulty: str


class AgentResponse(BaseModel):
    text: str
    recommendation: RecommendationResponse | None = None


class EvaluationResponse(BaseModel):
    needs_feedback: bool


class RepDetail(BaseModel):
    duration: float
    feedback: List[str]
    start_angles: dict[str, float] | None = None
    min_angles: dict[str, float] | None = None
    metrics: dict[str, float | str] | None = None
    is_valid: bool


class ExerciseSession(BaseModel):
    exercise_name: str
    total_reps: int
    reps: List[RepDetail]


class Exercise(BaseModel):
    id: str
    title: str
    sets: str
    reps: str | int
    muscle: str
    icon: Any | None = None
    image: str | None = None


class WorkoutSession(BaseModel):
    title: str
    focus: str
    exercises: List[Exercise]


class PlanAdjustmentRequest(BaseModel):
    current_plan: Dict[str, WorkoutSession]
    workout_feedback: str
    exercise_name: str


class PlanAdjustmentResponse(BaseModel):
    adjusted_plan: Dict[str, WorkoutSession]
    explanation: str


class AgentParams(BaseModel):
    frames: List[PoseLandmarkerResult] | None = None
    instruction: str | None = None
    image: str | None = None
    session_data: ExerciseSession | None = None
