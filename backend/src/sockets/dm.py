from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
from datetime import datetime
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import joinedload
from src.services.db import async_session
from src.models.schema import DirectMessage, User, Friendship

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps dm_room_id to a set of active websocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
        self.active_connections[room_id].add(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: str, room_id: str):
        if room_id in self.active_connections:
            connections = list(self.active_connections[room_id])
            for connection in connections:
                try:
                    await connection.send_text(message)
                except Exception:
                    pass

manager = ConnectionManager()

def get_room_id(user1_id: str, user2_id: str) -> str:
    # Always sort to ensure same room id for both users
    sorted_ids = sorted([user1_id, user2_id])
    return f"dm_{sorted_ids[0]}_{sorted_ids[1]}"

@router.websocket("/dm/{current_user_id}/{friend_id}")
async def websocket_endpoint(websocket: WebSocket, current_user_id: str, friend_id: str):
    room_id = get_room_id(current_user_id, friend_id)
    await manager.connect(websocket, room_id)
    
    # Fetch and send history
    try:
        async with async_session() as db:
            # Verify they are friends
            f_query = select(Friendship).where(
                or_(
                    and_(Friendship.requester_id == current_user_id, Friendship.addressee_id == friend_id),
                    and_(Friendship.requester_id == friend_id, Friendship.addressee_id == current_user_id)
                ),
                Friendship.status == 'accepted'
            )
            f_result = await db.execute(f_query)
            friendship = f_result.scalars().first()
            
            if not friendship:
                await websocket.close()
                return

            query = select(DirectMessage).options(joinedload(DirectMessage.sender)).where(
                or_(
                    and_(DirectMessage.sender_id == current_user_id, DirectMessage.receiver_id == friend_id),
                    and_(DirectMessage.sender_id == friend_id, DirectMessage.receiver_id == current_user_id)
                )
            ).order_by(DirectMessage.sent_at.asc())
            
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
        print(f"[DM] Error fetching dm history: {e}")

    try:
        while True:
            data = await websocket.receive_text()
            try:
                json_data = json.loads(data)
                
                # ensure timestamp
                if 'sent_at' not in json_data:
                    json_data['sent_at'] = datetime.utcnow().isoformat()
                
                if 'sender_id' in json_data and 'text' in json_data:
                    async with async_session() as db:
                        new_msg = DirectMessage(
                            sender_id=json_data['sender_id'],
                            receiver_id=friend_id if json_data['sender_id'] == current_user_id else current_user_id,
                            content=json_data['text'],
                            sent_at=datetime.fromisoformat(json_data['sent_at'].replace('Z', '')) if 'Z' in json_data['sent_at'] else datetime.utcnow()
                        )
                        db.add(new_msg)
                        await db.commit()

                formatted_data = json.dumps(json_data)
            except json.JSONDecodeError:
                formatted_data = json.dumps({
                    "sender": "Unknown", 
                    "content": data, 
                    "sent_at": datetime.utcnow().isoformat()
                })
            
            await manager.broadcast(formatted_data, room_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
