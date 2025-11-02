from fastapi import APIRouter

from app.api.v1.auth.router import router as auth_router
from app.api.v1.admin.router import router as admin_router
from app.api.v1.ai.router import router as ai_router
from app.api.v1.dashboard.router import router as dashboard_router
from app.api.v1.robots.router import router as robots_router 
from app.api.v1.inventory.router import router as inventory_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(robots_router, prefix="/robots", tags=["Robots"])
api_router.include_router(inventory_router, prefix="/inventory", tags=["History"])

