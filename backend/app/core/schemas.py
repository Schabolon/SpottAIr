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


class AgentParams(BaseModel):
    frames: List[PoseLandmarkerResult] | None = None
    instruction: str | None = None
    image: str | None = None
