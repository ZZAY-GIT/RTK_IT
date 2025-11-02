# app/api/v1/admin/router.py
from fastapi import APIRouter

from app.api.v1.admin.users.router import router as users_router
from app.api.v1.admin.products.router import router as products_router
from app.api.v1.admin.robots.router import router as robots_router

router = APIRouter()

router.include_router(users_router, prefix="/users", tags=["Admin - Users"])
router.include_router(products_router, prefix="/products", tags=["Admin - Products"])
router.include_router(robots_router, prefix="/robots", tags=["Admin - Robots"])
