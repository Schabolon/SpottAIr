from fastapi import APIRouter

from app.core.schemas import AgentParams, AgentResponse
from app.core.agent import do_stuff

router = APIRouter()


@router.post("/route", response_model=AgentResponse)
async def basic(request: AgentParams):
    return do_stuff(request)
