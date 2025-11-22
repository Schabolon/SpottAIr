from fastapi import APIRouter

from app.api.v1 import agent
from datetime import datetime

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(agent.router)

all_routs = APIRouter(prefix="/api")


@all_routs.get("/health")
async def health():
    return {"date": datetime.now()}


all_routs.include_router(v1_router)
