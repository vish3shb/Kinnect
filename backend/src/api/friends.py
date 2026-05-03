from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from pydantic import BaseModel
from typing import Optional
from src.services.db import get_db
from src.models.schema import Friendship, User, Notification
from datetime import datetime

router = APIRouter()

class FriendRequestInput(BaseModel):
    requester_id: str
    addressee_id: str

class FriendRespondInput(BaseModel):
    user_id: str
    requester_id: str
    action: str # 'accept' or 'decline'

@router.post("/request")
async def send_friend_request(req: FriendRequestInput, db: AsyncSession = Depends(get_db)):
    if req.requester_id == req.addressee_id:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    # Check if a friendship already exists
    query = select(Friendship).where(
        or_(
            and_(Friendship.requester_id == req.requester_id, Friendship.addressee_id == req.addressee_id),
            and_(Friendship.requester_id == req.addressee_id, Friendship.addressee_id == req.requester_id)
        )
    )
    result = await db.execute(query)
    existing = result.scalars().first()
    
    if existing:
        return {"status": "error", "message": f"Friendship status is already: {existing.status}"}
    
    new_friendship = Friendship(
        requester_id=req.requester_id,
        addressee_id=req.addressee_id,
        status='pending'
    )
    db.add(new_friendship)
    
    # Get requester info for notification
    req_user_query = select(User).where(User.id == req.requester_id)
    req_user_res = await db.execute(req_user_query)
    req_user = req_user_res.scalars().first()
    requester_name = req_user.name if req_user else "Someone"

    # Send Notification
    notif = Notification(
        user_id=req.addressee_id,
        type='friend_request',
        message=f"{requester_name} sent you a friend request"
    )
    db.add(notif)
    
    await db.commit()
    return {"status": "success"}

@router.post("/respond")
async def respond_friend_request(req: FriendRespondInput, db: AsyncSession = Depends(get_db)):
    query = select(Friendship).where(
        Friendship.requester_id == req.requester_id,
        Friendship.addressee_id == req.user_id,
        Friendship.status == 'pending'
    )
    result = await db.execute(query)
    friendship = result.scalars().first()
    
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found or already processed")
        
    if req.action == 'accept':
        friendship.status = 'accepted'
        
        # Notify the requester
        acc_user_query = select(User).where(User.id == req.user_id)
        acc_user_res = await db.execute(acc_user_query)
        acc_user = acc_user_res.scalars().first()
        acc_name = acc_user.name if acc_user else "Someone"

        notif = Notification(
            user_id=req.requester_id,
            type='friend_accepted',
            message=f"{acc_name} accepted your friend request!"
        )
        db.add(notif)
    elif req.action == 'decline':
        friendship.status = 'declined'
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    await db.commit()
    return {"status": "success"}

@router.get("/me")
async def get_my_friends(user_id: str, db: AsyncSession = Depends(get_db)):
    # Get accepted friends
    friends_query = select(Friendship).where(
        or_(Friendship.requester_id == user_id, Friendship.addressee_id == user_id),
        Friendship.status == 'accepted'
    )
    friends_result = await db.execute(friends_query)
    accepted = friends_result.scalars().all()
    
    friend_ids = []
    for f in accepted:
        if f.requester_id == user_id:
            friend_ids.append(f.addressee_id)
        else:
            friend_ids.append(f.requester_id)
            
    # Get pending incoming requests
    incoming_query = select(Friendship).where(
        Friendship.addressee_id == user_id,
        Friendship.status == 'pending'
    )
    incoming_result = await db.execute(incoming_query)
    incoming = incoming_result.scalars().all()
    
    incoming_requester_ids = [f.requester_id for f in incoming]
    
    # Fetch User objects
    all_user_ids = set(friend_ids + incoming_requester_ids)
    if all_user_ids:
        users_query = select(User).where(User.id.in_(all_user_ids))
        users_result = await db.execute(users_query)
        users = {u.id: u for u in users_result.scalars().all()}
    else:
        users = {}
        
    friends_data = [{
        "id": uid,
        "name": users[uid].name,
        "avatar_url": users[uid].avatar_url,
        "hall_of_residence": users[uid].hall_of_residence
    } for uid in friend_ids if uid in users]
    
    incoming_data = [{
        "id": uid,
        "name": users[uid].name,
        "avatar_url": users[uid].avatar_url,
        "hall_of_residence": users[uid].hall_of_residence
    } for uid in incoming_requester_ids if uid in users]
    
    return {
        "friends": friends_data,
        "pending_requests": incoming_data
    }

@router.get("/users/{target_id}")
async def get_user_profile(target_id: str, current_user_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.id == target_id)
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    friendship_status = 'none'
    if current_user_id and current_user_id != target_id:
        f_query = select(Friendship).where(
            or_(
                and_(Friendship.requester_id == current_user_id, Friendship.addressee_id == target_id),
                and_(Friendship.requester_id == target_id, Friendship.addressee_id == current_user_id)
            )
        )
        f_result = await db.execute(f_query)
        f = f_result.scalars().first()
        if f:
            if f.status == 'accepted':
                friendship_status = 'friends'
            elif f.status == 'pending':
                if f.requester_id == current_user_id:
                    friendship_status = 'request_sent'
                else:
                    friendship_status = 'request_received'
            elif f.status == 'declined':
                # If it was declined, let's treat it as none for now so they can send another one, or we keep it as none
                friendship_status = 'none'
                
    return {
        "id": user.id,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "hall_of_residence": user.hall_of_residence,
        "interests": user.interests,
        "friendship_status": friendship_status
    }
