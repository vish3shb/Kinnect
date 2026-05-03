from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from src.services.db import get_db
from src.models.schema import User
import uuid

router = APIRouter()

class UserSync(BaseModel):
    email: str
    name: str
    avatar_url: Optional[str] = None
    hall_of_residence: Optional[str] = None
    interests: Optional[str] = None

@router.post("/sync")
async def sync_user(user_in: UserSync, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    query = select(User).where(User.email == user_in.email)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        # Create new user
        user = User(
            id=str(uuid.uuid4()),
            email=user_in.email,
            name=user_in.name,
            avatar_url=user_in.avatar_url,
            hall_of_residence=user_in.hall_of_residence,
            interests=user_in.interests
        )
        db.add(user)
    else:
        # Update existing user info if provided
        if user_in.name: user.name = user_in.name
        if user_in.avatar_url: user.avatar_url = user_in.avatar_url
        if user_in.hall_of_residence: user.hall_of_residence = user_in.hall_of_residence
        if user_in.interests: user.interests = user_in.interests

    await db.commit()
    await db.refresh(user)
    
    return {
        "id": user.id, 
        "email": user.email, 
        "name": user.name,
        "hall_of_residence": user.hall_of_residence,
        "avatar_url": user.avatar_url,
        "interests": user.interests
    }
