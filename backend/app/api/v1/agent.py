from fastapi import APIRouter

from app.core.schemas import AgentParams, AgentResponse
from app.core.agent import analyze_pose

router = APIRouter()


@router.post("/route", response_model=AgentResponse)
async def basic(request: AgentParams):
    return await analyze_pose(request)
