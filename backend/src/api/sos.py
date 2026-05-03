from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime, timedelta
import math
from src.services.db import get_db
from src.models.schema import Emergency, User, Notification

router = APIRouter()


def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class EmergencyCreate(BaseModel):
    sender_id: str
    description: str
    lat: float
    lon: float


class ValidatePayload(BaseModel):
    responder_id: str
    resolution: str   # 'true_alarm' or 'false_alarm'


@router.post("/")
@router.post("")
async def broadcast_sos(emergency_in: EmergencyCreate, db: AsyncSession = Depends(get_db)):
    # Persist emergency
    new_emergency = Emergency(
        sender_id=emergency_in.sender_id,
        description=emergency_in.description,
        lat=emergency_in.lat,
        lon=emergency_in.lon,
    )
    db.add(new_emergency)
    await db.flush()   # get the id before commit

    # Fetch sender info for notification message
    sender = await db.get(User, emergency_in.sender_id)
    sender_name = sender.name if sender else "Someone"

    # Fetch all users except sender (need their location to sort by distance)
    # We store user location only per-activity, so we approximate via activities.
    # For simplicity: notify the 5 most recently active users closest to the SOS lat/lon.
    # We use User table directly and look at activities they created/joined for last known lat/lon.
    # Since User has no lat/lon column, we pull from the Activity table as a proxy.
    from src.models.schema import Activity, Participant
    from sqlalchemy.orm import joinedload

    # Get a map of user_id → last known location from their own activities
    act_result = await db.execute(
        select(Activity.creator_id, Activity.lat, Activity.lon)
        .where(Activity.creator_id != emergency_in.sender_id)
        .order_by(Activity.created_at.desc())
    )
    user_locations: dict[str, tuple[float, float]] = {}
    for creator_id, lat, lon in act_result.all():
        if creator_id not in user_locations:
            user_locations[creator_id] = (lat, lon)

    # Also add participant lat/lon via their joined activities
    part_result = await db.execute(
        select(Participant.user_id, Activity.lat, Activity.lon)
        .join(Activity, Activity.id == Participant.activity_id)
        .where(Participant.user_id != emergency_in.sender_id)
        .order_by(Activity.created_at.desc())
    )
    for user_id, lat, lon in part_result.all():
        if user_id not in user_locations:
            user_locations[user_id] = (lat, lon)

    # Sort by distance and take top 5
    sorted_users = sorted(
        user_locations.items(),
        key=lambda item: haversine(emergency_in.lat, emergency_in.lon, item[1][0], item[1][1])
    )
    nearby_user_ids = [uid for uid, _ in sorted_users[:5]]

    # If we have fewer than 5 users with activity data, top up from all users
    if len(nearby_user_ids) < 5:
        all_users_result = await db.execute(
            select(User.id).where(User.id != emergency_in.sender_id)
        )
        all_ids = [r[0] for r in all_users_result.all()]
        for uid in all_ids:
            if uid not in nearby_user_ids:
                nearby_user_ids.append(uid)
            if len(nearby_user_ids) >= 5:
                break

    # Create notification for each nearby user
    for uid in nearby_user_ids:
        notif = Notification(
            user_id=uid,
            type="sos_alert",
            message=f"🚨 SOS from {sender_name}: {emergency_in.description}",
            is_read=False,
        )
        notif.activity_id = None
        # Store emergency_id in message metadata (hack: append to message)
        notif.message = f"🚨 {sender_name} needs help! {emergency_in.description}"
        # We need the emergency_id in the notification — store in activity_id field as workaround
        # Actually we'll use a separate approach: store in message with a delimiter
        notif.message = f"SOS::{new_emergency.id}::{sender_name}::{emergency_in.description}::{round(emergency_in.lat, 5)}::{round(emergency_in.lon, 5)}"
        db.add(notif)

    await db.commit()

    return {
        "status": "success",
        "message": "SOS broadcasted successfully",
        "emergency_id": new_emergency.id,
        "notified_users": len(nearby_user_ids),
    }


@router.post("/{emergency_id}/respond")
async def respond_to_sos(emergency_id: str, responder_id: str, db: AsyncSession = Depends(get_db)):
    """Mark a user as responding to an SOS."""
    emergency = await db.get(Emergency, emergency_id)
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    emergency.responder_id = responder_id

    # Notify sender that help is on the way
    responder = await db.get(User, responder_id)
    responder_name = responder.name if responder else "Someone"
    notif = Notification(
        user_id=emergency.sender_id,
        type="sos_response",
        message=f"✅ {responder_name} is responding to your SOS and is on their way!",
        is_read=False,
    )
    db.add(notif)
    await db.commit()

    return {"status": "ok", "message": f"{responder_name} is now responding"}


@router.post("/{emergency_id}/validate")
async def validate_sos(emergency_id: str, payload: ValidatePayload, db: AsyncSession = Depends(get_db)):
    """Responder validates whether the SOS was a true or false alarm."""
    emergency = await db.get(Emergency, emergency_id)
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")

    emergency.is_resolved = True
    emergency.resolution = payload.resolution

    if payload.resolution == "false_alarm":
        sender = await db.get(User, emergency.sender_id)
        if sender:
            sender.sos_false_alarms = (sender.sos_false_alarms or 0) + 1

            if sender.sos_false_alarms >= 2:
                # Ban for 10 days
                sender.banned_until = datetime.utcnow() + timedelta(days=10)
                ban_notif = Notification(
                    user_id=sender.id,
                    type="sos_ban",
                    message=(
                        "⛔ Your account has been suspended for 10 days due to repeated false SOS alerts. "
                        "Misusing the emergency system puts real lives at risk. "
                        "If you believe this is a mistake, please contact support."
                    ),
                    is_read=False,
                )
                db.add(ban_notif)
            else:
                # First warning
                warn_notif = Notification(
                    user_id=sender.id,
                    type="sos_warning",
                    message=(
                        "⚠️ Warning: Your recent SOS was marked as a false alarm. "
                        "A second false alarm will result in a 10-day account suspension. "
                        "Please only use SOS for genuine emergencies."
                    ),
                    is_read=False,
                )
                db.add(warn_notif)

    await db.commit()
    return {"status": "ok", "resolution": payload.resolution}


@router.get("/active")
async def get_active_emergencies(db: AsyncSession = Depends(get_db)):
    from datetime import timedelta
    time_threshold = datetime.utcnow() - timedelta(minutes=30)
    query = select(Emergency).where(Emergency.reported_at >= time_threshold)
    result = await db.execute(query)
    emergencies = result.scalars().all()
    return {"emergencies": emergencies}
