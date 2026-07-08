from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    average_walk_speed: float
    start_point: str
    start_lat: float
    start_lon: float
    end_point: str
    end_lat: float
    end_lon: float
    transit_type: str
    transit_line: str
    buffer_time: int
    night_silent: bool
    notification_agreed: bool

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    username: str
    profile: Optional[UserProfileResponse] = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    average_walk_speed: Optional[float] = None
    start_point: Optional[str] = None
    start_lat: Optional[float] = None
    start_lon: Optional[float] = None
    end_point: Optional[str] = None
    end_lat: Optional[float] = None
    end_lon: Optional[float] = None
    transit_type: Optional[str] = None
    transit_line: Optional[str] = None
    buffer_time: Optional[int] = None
    night_silent: Optional[bool] = None
    notification_agreed: Optional[bool] = None

class WalkingHistoryCreate(BaseModel):
    speed: float
    steps: int
    duration: float

class WalkingHistoryResponse(BaseModel):
    id: int
    user_id: int
    speed: float
    steps: int
    duration: float
    created_at: datetime

    class Config:
        from_attributes = True

class RoutineNotificationCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    schedule_time: str # "HH:MM"
    active: bool = True

class RoutineNotificationResponse(BaseModel):
    id: int
    user_id: int
    day_of_week: int
    schedule_time: str
    active: bool

    class Config:
        from_attributes = True

class TripAlarmCreate(BaseModel):
    name: str
    start_point: str
    start_lat: float
    start_lon: float
    end_point: str
    end_lat: float
    end_lon: float
    target_arrival_time: str # "HH:MM"
    transit_type: Optional[str] = "bus"
    transit_line: Optional[str] = ""
    buffer_time: Optional[int] = 5
    active: Optional[bool] = True

class TripAlarmUpdate(BaseModel):
    name: Optional[str] = None
    start_point: Optional[str] = None
    start_lat: Optional[float] = None
    start_lon: Optional[float] = None
    end_point: Optional[str] = None
    end_lat: Optional[float] = None
    end_lon: Optional[float] = None
    target_arrival_time: Optional[str] = None
    transit_type: Optional[str] = None
    transit_line: Optional[str] = None
    buffer_time: Optional[int] = None
    active: Optional[bool] = None

class TripAlarmResponse(BaseModel):
    id: int
    user_id: int
    name: str
    start_point: str
    start_lat: float
    start_lon: float
    end_point: str
    end_lat: float
    end_lon: float
    target_arrival_time: str
    transit_type: str
    transit_line: str
    buffer_time: int
    active: bool

    class Config:
        from_attributes = True
