# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging

from app.api.v1.router import api_router
from app.db.session import engine
from app.db.base import Base
from app.api.v1.dashboard.websocket_manager import ws_manager
from app.core.settings import settings
from app.db.DataBaseManager import db
from redis.asyncio import Redis
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting application...")
    
    await db.create_tables()

    # Redis + Cache
    redis = Redis(
        host=settings.REDIS.host,
        port=settings.REDIS.port,
        db=settings.REDIS.db.cache,
    )
    FastAPICache.init(
        RedisBackend(redis), 
        prefix=settings.CACHE.prefix,
    )
    # Запуск broadcast
    broadcast_task = asyncio.create_task(
        ws_manager.broadcast_dashboard_updates(interval=5)
    )
    app.state.broadcast_task = broadcast_task

    yield

    logger.info("Shutting down...")
    broadcast_task.cancel()
    try:
        await broadcast_task
    except asyncio.CancelledError:
        pass

    for ws in ws_manager.active_connections[:]:
        try:
            await ws.close()
        except:
            pass

app = FastAPI(title="Simple FastAPI Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="http://localhost:[0-9]+",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "websocket_connections": ws_manager.get_connections_count()
    }