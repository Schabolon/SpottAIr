from fastapi import APIRouter

from app.core.schemas import AgentParams, AgentResponse, EvaluationResponse
from app.core.agent import analyze_pose, quick_evaluate

router = APIRouter()


@router.post("/route", response_model=AgentResponse)
async def basic(request: AgentParams):
    return await analyze_pose(request)


@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate(request: AgentParams):
    return await quick_evaluate(request)
