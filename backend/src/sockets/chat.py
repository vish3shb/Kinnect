from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from src.services.db import async_session
from src.models.schema import ChatMessage, User, Activity, Participant, Notification

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps activity_id to a set of active websocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, activity_id: str):
        await websocket.accept()
        if activity_id not in self.active_connections:
            self.active_connections[activity_id] = set()
        self.active_connections[activity_id].add(websocket)

    def disconnect(self, websocket: WebSocket, activity_id: str):
        if activity_id in self.active_connections:
            self.active_connections[activity_id].remove(websocket)
            if not self.active_connections[activity_id]:
                del self.active_connections[activity_id]

    async def broadcast(self, message: str, activity_id: str):
        if activity_id in self.active_connections:
            # We copy the set to avoid "Set changed size during iteration" runtime errors
            connections = list(self.active_connections[activity_id])
            for connection in connections:
                try:
                    await connection.send_text(message)
                except Exception:
                    # If connection fails, ignore, it will be removed on disconnect
                    pass

manager = ConnectionManager()

@router.websocket("/chat/{activity_id}")
async def websocket_endpoint(websocket: WebSocket, activity_id: str):
    await manager.connect(websocket, activity_id)
    
    # Fetch and send history using a manually managed session
    try:
        async with async_session() as db:
            query = select(ChatMessage).options(joinedload(ChatMessage.sender)).where(ChatMessage.activity_id == activity_id).order_by(ChatMessage.sent_at.asc())
            result = await db.execute(query)
            messages = result.scalars().all()
            for msg in messages:
                hist_msg = json.dumps({
                    "sender_id": msg.sender_id,
                    "name": msg.sender.name if msg.sender else "Unknown",
                    "text": msg.content,
                    "sent_at": msg.sent_at.isoformat()
                })
                await websocket.send_text(hist_msg)
    except Exception as e:
        print(f"[Chat] Error fetching chat history: {e}")

    try:
        while True:
            data = await websocket.receive_text()
            try:
                json_data = json.loads(data)
                
                # ensure timestamp
                if 'sent_at' not in json_data:
                    json_data['sent_at'] = datetime.utcnow().isoformat()
                
                # Save message to DB if it has sender info
                if 'sender_id' in json_data and 'text' in json_data:
                    async with async_session() as db:
                        new_msg = ChatMessage(
                            activity_id=activity_id,
                            sender_id=json_data['sender_id'],
                            content=json_data['text'],
                            sent_at=datetime.fromisoformat(json_data['sent_at'].replace('Z', '')) if 'Z' in json_data['sent_at'] else datetime.utcnow()
                        )
                        db.add(new_msg)
                        
                        # Notify other participants + creator (one notification per user per activity)
                        try:
                            act_query = select(Activity).where(Activity.id == activity_id)
                            act_result = await db.execute(act_query)
                            act = act_result.scalars().first()
                            if act:
                                p_query = select(Participant.user_id).where(Participant.activity_id == activity_id)
                                p_result = await db.execute(p_query)
                                recipient_ids = set(p_result.scalars().all())
                                recipient_ids.add(act.creator_id)
                                
                                sender_id = json_data['sender_id']
                                recipient_ids.discard(sender_id)
                                
                                sender_name = json_data.get('name', 'Someone')
                                
                                for pid in recipient_ids:
                                    # Check for existing unread chat notification for this activity
                                    existing_notif_q = select(Notification).where(
                                        Notification.user_id == pid,
                                        Notification.activity_id == activity_id,
                                        Notification.type == 'new_message',
                                        Notification.is_read == False
                                    )
                                    existing_result = await db.execute(existing_notif_q)
                                    existing_notif = existing_result.scalars().first()
                                    
                                    if existing_notif:
                                        # Update the existing notification with latest sender
                                        existing_notif.message = f"{sender_name} texted you in '{act.title}'"
                                        existing_notif.created_at = datetime.utcnow()
                                    else:
                                        notif = Notification(
                                            user_id=pid,
                                            activity_id=activity_id,
                                            type='new_message',
                                            message=f"{sender_name} texted you in '{act.title}'"
                                        )
                                        db.add(notif)
                        except Exception as e:
                            print(f"[Chat] Error creating notifications: {e}")
                            
                        await db.commit()

                formatted_data = json.dumps(json_data)
            except json.JSONDecodeError:
                formatted_data = json.dumps({
                    "sender": "Unknown", 
                    "content": data, 
                    "sent_at": datetime.utcnow().isoformat()
                })
            
            await manager.broadcast(formatted_data, activity_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, activity_id)
        # Avoid broadcasting generic leave messages as they can clutter
        # We already added explicit leave broadcast in activities.py
