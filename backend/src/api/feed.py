from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import math
from typing import Optional
from src.services.db import get_db
from src.models.schema import Activity, Participant, JoinRequest, User
from sqlalchemy import func

router = APIRouter()

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in meters using Haversine formula."""
    R = 6371000 # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

@router.get("/")
@router.get("")
async def get_proximity_feed(
    user_lat: float, 
    user_lon: float, 
    user_hall: str,
    user_id: Optional[str] = None,
    activity_type: Optional[str] = None,
    join_mode: Optional[str] = None,
    dist_min: Optional[int] = None,
    dist_max: Optional[int] = None,
    event_date: Optional[str] = None,
    time_of_day: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy.orm import joinedload
    # Fetch all active activities, hiding activities created by the current user
    query = select(Activity).options(joinedload(Activity.creator)).join(User, Activity.creator_id == User.id)
    query = query.where(Activity.is_active == True).where(Activity.expires_at > datetime.utcnow())
    query = query.where((User.banned_until == None) | (User.banned_until < datetime.utcnow()))
    
    if user_id:
        query = query.where(Activity.creator_id != user_id)
    
    if activity_type and activity_type != 'all':
        query = query.where(Activity.activity_type == activity_type)
    if join_mode:
        query = query.where(Activity.join_mode == join_mode)
        
    result = await db.execute(query)
    activities = result.scalars().all()
    
    feed = []
    for activity in activities:
        # Calculate distance in Python instead of PostGIS
        distance = haversine_distance(user_lat, user_lon, activity.lat, activity.lon)
        
        # Apply distance filters
        if dist_min is not None and distance < dist_min:
            continue
        if dist_max is not None and distance > dist_max:
            continue
            
        # Apply date filter (YYYY-MM-DD)
        if event_date:
            if activity.event_time.strftime("%Y-%m-%d") != event_date:
                continue
                
        # Apply time of day filter
        if time_of_day:
            hour = activity.event_time.hour
            if time_of_day == 'morning' and not (5 <= hour < 12): continue
            elif time_of_day == 'afternoon' and not (12 <= hour < 17): continue
            elif time_of_day == 'evening' and not (17 <= hour < 21): continue
            elif time_of_day == 'night' and not (hour >= 21 or hour < 5): continue
        
        # Determine Tier
        if activity.location_name == user_hall:
            tier = 1
        elif activity.tier_category == 2:
            tier = 2
        else:
            tier = 3
            
        # Check join status if user_id is provided
        has_joined = False
        join_status = None
        if user_id:
            # Check Participant table
            p_query = select(Participant).where(Participant.activity_id == activity.id, Participant.user_id == user_id)
            p_result = await db.execute(p_query)
            if p_result.scalars().first():
                has_joined = True
            else:
                # Check JoinRequest table
                j_query = select(JoinRequest).where(JoinRequest.activity_id == activity.id, JoinRequest.user_id == user_id)
                j_result = await db.execute(j_query)
                j_req = j_result.scalars().first()
                if j_req:
                    join_status = j_req.status

        # Fetch real participant avatars (excluding creator to avoid duplicate)
        parts_query = (
            select(User.id, User.name, User.avatar_url)
            .join(Participant, Participant.user_id == User.id)
            .where(Participant.activity_id == activity.id)
            .where(User.id != activity.creator_id)
            .limit(3)
        )
        parts_result = await db.execute(parts_query)
        participant_rows = parts_result.all()
        participants = [
            {"id": str(r.id), "name": r.name, "avatar_url": r.avatar_url}
            for r in participant_rows
        ]

        feed.append({
            "id": activity.id,
            "title": activity.title,
            "description": activity.description,
            "activity_type": activity.activity_type,
            "join_mode": activity.join_mode,
            "event_time": activity.event_time,
            "location_name": activity.location_name,
            "lat": activity.lat,
            "lon": activity.lon,
            "distance_meters": round(distance, 2),
            "tier": tier,
            "max_capacity": activity.max_capacity,
            "current_capacity": activity.current_capacity,
            "expires_at": activity.expires_at,
            "has_joined": has_joined,
            "join_status": join_status,
            "is_full": activity.current_capacity >= activity.max_capacity,
            "creator_name": activity.creator.name if activity.creator else "Unknown",
            "creator_avatar": activity.creator.avatar_url if activity.creator else None,
            "creator_id": activity.creator_id,
            "participants": participants,
        })
        
    # Sort by is_full first (False before True), then Tier, then distance
    feed.sort(key=lambda x: (x["is_full"], x["tier"], x["distance_meters"]))
    
    return {"feed": feed}

@router.get("/active-users")
async def get_active_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.count(User.id)))
    count = result.scalar()
    return {"count": count or 0}
