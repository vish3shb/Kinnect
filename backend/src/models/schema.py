import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    avatar_url = Column(String)
    hall_of_residence = Column(String(100))
    interests = Column(String) # Comma separated interests
    created_at = Column(DateTime, default=datetime.utcnow)
    banned_until = Column(DateTime, nullable=True)
    sos_false_alarms = Column(Integer, default=0)

class Activity(Base):
    __tablename__ = 'activities'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, ForeignKey('users.id'))
    title = Column(String(100), nullable=False)
    description = Column(String)
    activity_type = Column(String(50), default='general') # e.g. running, swimming, travel
    join_mode = Column(String(20), default='open') # 'open' or 'approval'
    location_name = Column(String(255))
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    tier_category = Column(Integer) # 1: Hall, 2: Hub, 3: General
    max_capacity = Column(Integer, nullable=False)
    current_capacity = Column(Integer, default=1)
    event_time = Column(DateTime, nullable=False) # Time the event actually happens
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    reports = Column(Integer, default=0)

    creator = relationship("User")

class Participant(Base):
    __tablename__ = 'participants'

    activity_id = Column(String, ForeignKey('activities.id'), primary_key=True)
    user_id = Column(String, ForeignKey('users.id'), primary_key=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

class JoinRequest(Base):
    __tablename__ = 'join_requests'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    activity_id = Column(String, ForeignKey('activities.id'))
    user_id = Column(String, ForeignKey('users.id'))
    status = Column(String(20), default='pending') # pending, approved, rejected
    requested_at = Column(DateTime, default=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = 'chat_messages'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    activity_id = Column(String, ForeignKey('activities.id'))
    sender_id = Column(String, ForeignKey('users.id'))
    content = Column(String, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User")

class Emergency(Base):
    __tablename__ = 'emergencies'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(String, ForeignKey('users.id'))
    description = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    reported_at = Column(DateTime, default=datetime.utcnow)
    responder_id = Column(String, ForeignKey('users.id'), nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolution = Column(String(20), nullable=True)  # 'true_alarm' or 'false_alarm'

    sender = relationship("User", foreign_keys=[sender_id])
    responder = relationship("User", foreign_keys=[responder_id])

class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    activity_id = Column(String, ForeignKey('activities.id'), nullable=True)
    type = Column(String(50), nullable=False)  # 'join_request', 'user_joined', 'user_left', 'activity_disbanded', 'request_approved', 'request_rejected', 'friend_request', 'friend_accepted'
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Friendship(Base):
    __tablename__ = 'friendships'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    requester_id = Column(String, ForeignKey('users.id'), nullable=False)
    addressee_id = Column(String, ForeignKey('users.id'), nullable=False)
    status = Column(String(20), default='pending') # pending, accepted, declined
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requester = relationship("User", foreign_keys=[requester_id])
    addressee = relationship("User", foreign_keys=[addressee_id])

class DirectMessage(Base):
    __tablename__ = 'direct_messages'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(String, ForeignKey('users.id'), nullable=False)
    receiver_id = Column(String, ForeignKey('users.id'), nullable=False)
    content = Column(String, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

