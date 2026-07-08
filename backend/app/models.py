from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    walking_histories = relationship("WalkingHistory", back_populates="user", cascade="all, delete-orphan")
    routines = relationship("RoutineNotification", back_populates="user", cascade="all, delete-orphan")
    trip_alarms = relationship("TripAlarm", back_populates="user", cascade="all, delete-orphan")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    average_walk_speed = Column(Float, default=1.2) # in m/s
    start_point = Column(String, default="집 (분당)")
    start_lat = Column(Float, default=37.382) # Bundang Latitude
    start_lon = Column(Float, default=127.118) # Bundang Longitude
    
    end_point = Column(String, default="학교/회사 (강남)")
    end_lat = Column(Float, default=37.497) # Gangnam Latitude
    end_lon = Column(Float, default=127.027) # Gangnam Longitude
    
    transit_type = Column(String, default="bus") # "bus" or "subway"
    transit_line = Column(String, default="8100") # line number/name
    
    buffer_time = Column(Integer, default=5) # minutes before departure to alert
    night_silent = Column(Boolean, default=True) # 21:00 ~ 08:00 silence
    notification_agreed = Column(Boolean, default=True)

    user = relationship("User", back_populates="profile")

class WalkingHistory(Base):
    __tablename__ = "walking_histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    
    speed = Column(Float, nullable=False)
    steps = Column(Integer, nullable=False)
    duration = Column(Float, nullable=False) # seconds
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="walking_histories")

class RoutineNotification(Base):
    __tablename__ = "routine_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    
    day_of_week = Column(Integer, nullable=False) # 0=Monday, 6=Sunday
    schedule_time = Column(String, nullable=False) # "HH:MM" format
    active = Column(Boolean, default=True)

    user = relationship("User", back_populates="routines")

class TripAlarm(Base):
    __tablename__ = "trip_alarms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String, nullable=False) # e.g. "출근", "약속"
    
    start_point = Column(String, nullable=False)
    start_lat = Column(Float, nullable=False)
    start_lon = Column(Float, nullable=False)
    
    end_point = Column(String, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lon = Column(Float, nullable=False)
    
    target_arrival_time = Column(String, nullable=False) # "HH:MM"
    transit_type = Column(String, default="bus")
    transit_line = Column(String, default="")
    buffer_time = Column(Integer, default=5) # minutes before departure to alert
    active = Column(Boolean, default=True)

    user = relationship("User", back_populates="trip_alarms")
