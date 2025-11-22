from pydantic import BaseModel
from typing import List, Tuple


class AgentResponse(BaseModel):
    text: str


class AgentParams(BaseModel):
    points: List[List[Tuple[float]]]
