from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid
from src.services.db import get_db
from src.models.schema import Activity, Participant, JoinRequest, User, Notification
from sqlalchemy import select, func
import json

router = APIRouter()

class ActivityCreate(BaseModel):
    creator_id: str
    title: str
    description: str
    activity_type: str = "general"
    join_mode: str = "open"
    location_name: str
    lat: float
    lon: float
    tier_category: int = 3
    max_capacity: int
    event_time: datetime
    ttl_hours: int = 2

async def notify_participants(db: AsyncSession, activity_id: str, exclude_user_id: str, notif_type: str, message: str):
    """Send a notification to all participants of an activity (except exclude_user_id)."""
    p_query = select(Participant.user_id).where(Participant.activity_id == activity_id)
    result = await db.execute(p_query)
    participant_ids = [row[0] for row in result.all()]
    
    # Also notify the creator
    activity = await db.get(Activity, activity_id)
    if activity and activity.creator_id not in participant_ids:
        participant_ids.append(activity.creator_id)
    
    for uid in participant_ids:
        if uid != exclude_user_id:
            notif = Notification(
                user_id=uid,
                activity_id=activity_id,
                type=notif_type,
                message=message
            )
            db.add(notif)

@router.post("/")
@router.post("")
async def create_activity(activity_in: ActivityCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists and is banned
    user = await db.get(User, activity_in.creator_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.banned_until and user.banned_until > datetime.utcnow():
        raise HTTPException(status_code=403, detail=f"You are banned from creating activities until {user.banned_until.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        
    # Check limit of active floats (only those that haven't expired)
    active_count_query = select(func.count(Activity.id)).where(
        Activity.creator_id == activity_in.creator_id, 
        Activity.is_active == True,
        Activity.expires_at > datetime.utcnow()
    )
    active_count_result = await db.execute(active_count_query)
    active_count = active_count_result.scalar()
    
    if active_count >= 5:
        raise HTTPException(status_code=400, detail="You can only have up to 5 active activities at a time")

    event_time_utc = activity_in.event_time.replace(tzinfo=None)
    expires_at = event_time_utc + timedelta(hours=activity_in.ttl_hours)
    
    new_activity = Activity(
        creator_id=activity_in.creator_id,
        title=activity_in.title,
        description=activity_in.description,
        activity_type=activity_in.activity_type,
        join_mode=activity_in.join_mode,
        location_name=activity_in.location_name,
        lat=activity_in.lat,
        lon=activity_in.lon,
        tier_category=activity_in.tier_category,
        max_capacity=activity_in.max_capacity,
        event_time=event_time_utc,
        expires_at=expires_at
    )
    
    db.add(new_activity)
    await db.commit()
    await db.refresh(new_activity)
    
    return new_activity

@router.post("/{activity_id}/join")
async def join_activity(activity_id: str, user_id: str, db: AsyncSession = Depends(get_db)):
    
    activity = await db.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    if activity.current_capacity >= activity.max_capacity:
        raise HTTPException(status_code=400, detail="Activity is full")

    # Check if already a participant
    existing = await db.execute(
        select(Participant).where(Participant.activity_id == activity_id, Participant.user_id == user_id)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Already joined this activity")
        
    if activity.join_mode == 'approval':
        # Check for existing pending request
        existing_req = await db.execute(
            select(JoinRequest).where(JoinRequest.activity_id == activity_id, JoinRequest.user_id == user_id, JoinRequest.status == 'pending')
        )
        if existing_req.scalars().first():
            return {"status": "pending", "message": "Request already sent"}
        
        # Create a join request instead
        join_request = JoinRequest(activity_id=activity_id, user_id=user_id)
        db.add(join_request)
        
        # Notify the host
        user = await db.get(User, user_id)
        user_name = user.name if user else "Someone"
        notif = Notification(
            user_id=activity.creator_id,
            activity_id=activity_id,
            type="join_request",
            message=f"{user_name} wants to join \"{activity.title}\""
        )
        db.add(notif)
        await db.commit()
        return {"status": "pending", "message": "Request sent for approval"}
    
    # Open mode: direct join
    participant = Participant(activity_id=activity_id, user_id=user_id)
    db.add(participant)
    
    activity.current_capacity += 1
    
    # Notify everyone in the group
    user = await db.get(User, user_id)
    user_name = user.name if user else "Someone"
    await notify_participants(db, activity_id, user_id, "user_joined", f"{user_name} joined \"{activity.title}\"")
    
    await db.commit()
    
    # Broadcast to chat
    try:
        from src.sockets.chat import manager
        sys_msg = json.dumps({"sender": "System", "content": f"{user_name} has joined the activity", "sent_at": datetime.utcnow().isoformat()})
        await manager.broadcast(sys_msg, activity_id)
    except Exception:
        pass
    
    return {"status": "joined", "current_capacity": activity.current_capacity}

@router.get("/me")
async def get_my_activities(user_id: str, db: AsyncSession = Depends(get_db)):
    # Hosted activities
    hosted_query = select(Activity).where(Activity.creator_id == user_id)
    hosted_result = await db.execute(hosted_query)
    hosted = hosted_result.scalars().all()
    
    # Joined activities
    joined_query = select(Activity).join(Participant).where(Participant.user_id == user_id)
    joined_result = await db.execute(joined_query)
    joined = joined_result.scalars().all()
    
    return {
        "hosted": hosted,
        "joined": joined
    }

@router.delete("/{activity_id}")
async def delete_activity(activity_id: str, db: AsyncSession = Depends(get_db)):
    activity = await db.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    activity.is_active = False
    
    # Notify all participants about disband
    await notify_participants(db, activity_id, activity.creator_id, "activity_disbanded", f"The host has disbanded \"{activity.title}\"")
    
    await db.commit()
    
    # Broadcast to chat
    try:
        from src.sockets.chat import manager
        sys_msg = json.dumps({"sender": "System", "content": "The host has closed this activity", "sent_at": datetime.utcnow().isoformat()})
        await manager.broadcast(sys_msg, activity_id)
    except Exception:
        pass
        
    return {"status": "deleted"}

@router.post("/{activity_id}/report")
async def report_activity(activity_id: str, db: AsyncSession = Depends(get_db)):
    activity = await db.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    activity.reports += 1
    
    if activity.reports >= 5:
        activity.is_active = False
        creator = await db.get(User, activity.creator_id)
        if creator:
            creator.banned_until = datetime.utcnow() + timedelta(days=5)
            
    await db.commit()
    return {"status": "reported", "reports": activity.reports}

@router.post("/{activity_id}/leave")
async def leave_activity(activity_id: str, user_id: str, db: AsyncSession = Depends(get_db)):
    activity = await db.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    # Check if user is participant
    query = select(Participant).where(Participant.activity_id == activity_id, Participant.user_id == user_id)
    result = await db.execute(query)
    participant = result.scalars().first()
    
    if not participant:
        raise HTTPException(status_code=400, detail="You are not a participant of this activity")
        
    await db.delete(participant)
    if activity.current_capacity > 0:
        activity.current_capacity -= 1
    
    # Notify everyone in the group
    user = await db.get(User, user_id)
    user_name = user.name if user else "A user"
    await notify_participants(db, activity_id, user_id, "user_left", f"{user_name} has left \"{activity.title}\"")
        
    await db.commit()
    
    # Broadcast to chat
    try:
        from src.sockets.chat import manager
        sys_msg = json.dumps({"sender": "System", "content": f"{user_name} has left the activity", "sent_at": datetime.utcnow().isoformat()})
        await manager.broadcast(sys_msg, activity_id)
    except Exception:
        pass
        
    return {"status": "left"}

@router.get("/notifications")
async def get_notifications(user_id: str, db: AsyncSession = Depends(get_db)):
    """Get all notifications for a user, newest first."""
    query = select(Notification).where(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).limit(50)
    result = await db.execute(query)
    notifs = result.scalars().all()
    
    return {"notifications": [
        {
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "activity_id": n.activity_id,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in notifs
    ]}

@router.post("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, db: AsyncSession = Depends(get_db)):
    notif = await db.get(Notification, notif_id)
    if notif:
        notif.is_read = True
        await db.commit()
    return {"status": "ok"}

@router.delete("/notifications/{notif_id}")
async def delete_notification(notif_id: str, db: AsyncSession = Depends(get_db)):
    notif = await db.get(Notification, notif_id)
    if notif:
        await db.delete(notif)
        await db.commit()
    return {"status": "ok"}

@router.post("/notifications/clear-all")
async def clear_all_notifications(user_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import delete
    await db.execute(delete(Notification).where(Notification.user_id == user_id))
    await db.commit()
    return {"status": "ok"}

@router.get("/requests/me")
async def get_my_requests(user_id: str, db: AsyncSession = Depends(get_db)):
    from src.models.schema import User
    # Get requests for activities hosted by user_id
    query = select(JoinRequest, Activity.title, User.name).join(
        Activity, JoinRequest.activity_id == Activity.id
    ).join(
        User, JoinRequest.user_id == User.id
    ).where(
        Activity.creator_id == user_id, 
        JoinRequest.status == 'pending'
    )
    result = await db.execute(query)
    requests = []
    for req, title, user_name in result:
        requests.append({
            "id": req.id,
            "activity_id": req.activity_id,
            "activity_title": title,
            "user_id": req.user_id,
            "user_name": user_name,
            "status": req.status,
            "requested_at": req.requested_at
        })
    return {"requests": requests}

@router.post("/requests/{request_id}/{action}")
async def respond_to_request(request_id: str, action: str, db: AsyncSession = Depends(get_db)):
    req = await db.get(JoinRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if action not in ['approve', 'reject']:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    req.status = action
    
    if action == 'approve':
        activity = await db.get(Activity, req.activity_id)
        if activity and activity.current_capacity < activity.max_capacity:
            participant = Participant(activity_id=req.activity_id, user_id=req.user_id)
            db.add(participant)
            activity.current_capacity += 1
            
            # Notify the requester they've been approved
            notif = Notification(
                user_id=req.user_id,
                activity_id=req.activity_id,
                type="request_approved",
                message=f"Your request to join \"{activity.title}\" has been approved!"
            )
            db.add(notif)
    else:
        # Notify the requester they've been rejected
        activity = await db.get(Activity, req.activity_id)
        title = activity.title if activity else "an activity"
        notif = Notification(
            user_id=req.user_id,
            activity_id=req.activity_id,
            type="request_rejected",
            message=f"Your request to join \"{title}\" was declined"
        )
        db.add(notif)
            
    await db.commit()
    return {"status": action}

