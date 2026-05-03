from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api import feed, activities, auth, sos, friends
from src.sockets import chat, dm
from src.models.schema import Base
from src.services.db import engine

import os

app = FastAPI(
    title="Kinnect API", 
    description="Antigravity Framework API for IITK Campus Coordination",
    redirect_slashes=False
)

# Enable CORS for the Next.js frontend
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    frontend_url,
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(feed.router, prefix="/api/feed", tags=["Feed"])
app.include_router(activities.router, prefix="/api/activities", tags=["Activities"])
app.include_router(sos.router, prefix="/api/sos", tags=["SOS"])
app.include_router(friends.router, prefix="/api/friends", tags=["Friends"])
app.include_router(chat.router, prefix="/ws", tags=["Chat"])
app.include_router(dm.router, prefix="/ws", tags=["DM"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Kinnect API"}
