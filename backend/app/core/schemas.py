from pydantic import BaseModel
from typing import List


class Landmark(BaseModel):
    x: float
    y: float
    z: float
    visibility: float
    presence: float


class PoseLandmarkerResult(BaseModel):
    landmarks: List[Landmark]


class AgentResponse(BaseModel):
    text: str


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


class AgentParams(BaseModel):
    frames: List[PoseLandmarkerResult] | None = None
    instruction: str | None = None
    image: str | None = None
    session_data: ExerciseSession | None = None
