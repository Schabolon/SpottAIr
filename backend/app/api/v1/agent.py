from fastapi import APIRouter

from app.core.schemas import AgentParams, AgentResponse, EvaluationResponse, PlanAdjustmentRequest, PlanAdjustmentResponse
from app.core.agent import analyze_pose, quick_evaluate, adjust_training_plan

router = APIRouter()


@router.post("/route", response_model=AgentResponse)
async def basic(request: AgentParams):
    return await analyze_pose(request)


@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate(request: AgentParams):
    return await quick_evaluate(request)


@router.post("/adjust-plan", response_model=PlanAdjustmentResponse)
async def adjust_plan(request: PlanAdjustmentRequest):
    return await adjust_training_plan(request)
