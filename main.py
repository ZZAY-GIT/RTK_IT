from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from datetime import datetime
import asyncio
import json
from api.api import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
