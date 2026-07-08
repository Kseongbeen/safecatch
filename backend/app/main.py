from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uvicorn

from .database import engine, Base, get_db
from . import models, schemas, auth, transit

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SafeCatch API", version="1.0")

# CORS middleware to allow connection from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For local testing we allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to SafeCatch API. Go to /docs for Swagger documentation."}

# --- AUTHENTICATION ---

@app.post("/api/signup", response_model=schemas.UserResponse)
def signup(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Hash password
    hashed_pwd = auth.hash_password(user_data.password)
    
    # Create user
    new_user = models.User(username=user_data.username, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Initialize default profile
    default_profile = models.UserProfile(user_id=new_user.id)
    db.add(default_profile)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@app.post("/api/login")
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == login_data.username).first()
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "username": user.username}

# --- USER PROFILE ---

@app.get("/api/profile", response_model=schemas.UserProfileResponse)
def get_profile(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@app.put("/api/profile", response_model=schemas.UserProfileResponse)
def update_profile(
    profile_data: schemas.UserProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    for key, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, key, value)
        
    db.commit()
    db.refresh(profile)
    return profile

# --- WALKING PATTERN & ANALYTICS ---

@app.get("/api/walking-history", response_model=List[schemas.WalkingHistoryResponse])
def get_walking_history(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.WalkingHistory).filter(models.WalkingHistory.user_id == current_user.id).order_by(models.WalkingHistory.created_at.desc()).all()

@app.post("/api/walking-history", response_model=schemas.WalkingHistoryResponse)
def add_walking_history(
    history_data: schemas.WalkingHistoryCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    new_history = models.WalkingHistory(
        user_id=current_user.id,
        speed=history_data.speed,
        steps=history_data.steps,
        duration=history_data.duration
    )
    db.add(new_history)
    
    # Automatically recalculate user's average walk speed based on history
    histories = db.query(models.WalkingHistory).filter(models.WalkingHistory.user_id == current_user.id).all()
    speeds = [h.speed for h in histories] + [history_data.speed]
    avg_speed = sum(speeds) / len(speeds)
    
    # Update profile speed
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if profile:
        profile.average_walk_speed = round(avg_speed, 2)
        
    db.commit()
    db.refresh(new_history)
    return new_history

# --- ROUTINE NOTIFICATIONS ---

@app.get("/api/routines", response_model=List[schemas.RoutineNotificationResponse])
def get_routines(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.RoutineNotification).filter(models.RoutineNotification.user_id == current_user.id).all()

@app.post("/api/routines", response_model=schemas.RoutineNotificationResponse)
def create_routine(
    routine_data: schemas.RoutineNotificationCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    new_routine = models.RoutineNotification(
        user_id=current_user.id,
        day_of_week=routine_data.day_of_week,
        schedule_time=routine_data.schedule_time,
        active=routine_data.active
    )
    db.add(new_routine)
    db.commit()
    db.refresh(new_routine)
    return new_routine

@app.delete("/api/routines/{routine_id}")
def delete_routine(
    routine_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    routine = db.query(models.RoutineNotification).filter(
        models.RoutineNotification.id == routine_id,
        models.RoutineNotification.user_id == current_user.id
    ).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
        
    db.delete(routine)
    db.commit()
    return {"message": "Routine deleted successfully"}

# --- TRIP ALARMS ---

@app.get("/api/trip-alarms", response_model=List[schemas.TripAlarmResponse])
def get_trip_alarms(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.TripAlarm).filter(models.TripAlarm.user_id == current_user.id).all()

@app.post("/api/trip-alarms", response_model=schemas.TripAlarmResponse)
def create_trip_alarm(
    alarm_data: schemas.TripAlarmCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    new_alarm = models.TripAlarm(
        user_id=current_user.id,
        name=alarm_data.name,
        start_point=alarm_data.start_point,
        start_lat=alarm_data.start_lat,
        start_lon=alarm_data.start_lon,
        end_point=alarm_data.end_point,
        end_lat=alarm_data.end_lat,
        end_lon=alarm_data.end_lon,
        target_arrival_time=alarm_data.target_arrival_time,
        transit_type=alarm_data.transit_type,
        transit_line=alarm_data.transit_line,
        buffer_time=alarm_data.buffer_time,
        active=alarm_data.active
    )
    db.add(new_alarm)
    db.commit()
    db.refresh(new_alarm)
    return new_alarm

@app.put("/api/trip-alarms/{alarm_id}", response_model=schemas.TripAlarmResponse)
def update_trip_alarm(
    alarm_id: int,
    alarm_data: schemas.TripAlarmUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    alarm = db.query(models.TripAlarm).filter(
        models.TripAlarm.id == alarm_id,
        models.TripAlarm.user_id == current_user.id
    ).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Trip alarm not found")
        
    for key, value in alarm_data.dict(exclude_unset=True).items():
        setattr(alarm, key, value)
        
    db.commit()
    db.refresh(alarm)
    return alarm

@app.delete("/api/trip-alarms/{alarm_id}")
def delete_trip_alarm(
    alarm_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    alarm = db.query(models.TripAlarm).filter(
        models.TripAlarm.id == alarm_id,
        models.TripAlarm.user_id == current_user.id
    ).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Trip alarm not found")
        
    db.delete(alarm)
    db.commit()
    return {"message": "Trip alarm deleted successfully"}

@app.get("/api/trip-alarms/{alarm_id}/status")
def get_trip_alarm_status_detail(
    alarm_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    alarm = db.query(models.TripAlarm).filter(
        models.TripAlarm.id == alarm_id,
        models.TripAlarm.user_id == current_user.id
    ).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Trip alarm not found")
        
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    walk_speed = profile.average_walk_speed if profile else 1.2
    
    # Calculate status using transit helper
    status_info = transit.get_trip_alarm_status(
        start_lat=alarm.start_lat,
        start_lon=alarm.start_lon,
        end_lat=alarm.end_lat,
        end_lon=alarm.end_lon,
        target_arrival_time=alarm.target_arrival_time,
        buffer_time=alarm.buffer_time,
        average_walk_speed=walk_speed,
        start_name=alarm.start_point,
        end_name=alarm.end_point,
        preferred_transit_type=alarm.transit_type,
        preferred_transit_line=alarm.transit_line
    )
    status_info["alarm_name"] = alarm.name
    status_info["active"] = alarm.active
    status_info["id"] = alarm.id
    return status_info

# --- REAL-TIME TRANSIT & FEASIBILITY ---

@app.get("/api/transit/status")
def get_realtime_status(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    walk_speed = profile.average_walk_speed if profile else 1.2
    
    # 1. Check if user has active TripAlarms
    alarms = db.query(models.TripAlarm).filter(
        models.TripAlarm.user_id == current_user.id,
        models.TripAlarm.active == True
    ).all()
    
    if alarms:
        # Find the most urgent active alarm (closest future departure, or closest past if all passed)
        urgent_alarm = None
        urgent_status = None
        min_countdown = float('inf')
        
        for alarm in alarms:
            try:
                status = transit.get_trip_alarm_status(
                    start_lat=alarm.start_lat,
                    start_lon=alarm.start_lon,
                    end_lat=alarm.end_lat,
                    end_lon=alarm.end_lon,
                    target_arrival_time=alarm.target_arrival_time,
                    buffer_time=alarm.buffer_time,
                    average_walk_speed=walk_speed,
                    start_name=alarm.start_point,
                    end_name=alarm.end_point,
                    preferred_transit_type=alarm.transit_type,
                    preferred_transit_line=alarm.transit_line
                )
                countdown = status.get("departure_countdown_seconds", 999999)
                
                if urgent_alarm is None:
                    urgent_alarm = alarm
                    urgent_status = status
                    min_countdown = countdown
                else:
                    # Prefer positive count downs (future departure times)
                    if countdown > 0 and min_countdown <= 0:
                        urgent_alarm = alarm
                        urgent_status = status
                        min_countdown = countdown
                    elif countdown > 0 and min_countdown > 0 and countdown < min_countdown:
                        urgent_alarm = alarm
                        urgent_status = status
                        min_countdown = countdown
                    elif countdown <= 0 and min_countdown <= 0 and countdown > min_countdown:
                        urgent_alarm = alarm
                        urgent_status = status
                        min_countdown = countdown
            except Exception as e:
                print(f"Error calculating status for alarm {alarm.id}: {e}")
                continue
                
        if urgent_alarm and urgent_status:
            # Map routes and calculate transit remaining seconds for animation compat
            routes = urgent_status.get("routes", [])
            walk_time = 300  # Default walk time fallback
            if routes and len(routes) > 0 and len(routes[0].get("legs", [])) > 0:
                first_leg = routes[0]["legs"][0]
                if first_leg.get("mode") == "WALK":
                    walk_time = int(first_leg.get("duration", 300))
                    
            countdown_val = urgent_status["departure_countdown_seconds"]
            
            # Map into a standard transit info response format with "is_trip_alarm": True
            return {
                "is_trip_alarm": True,
                "alarm_id": urgent_alarm.id,
                "alarm_name": urgent_alarm.name,
                "start_point": urgent_alarm.start_point,
                "end_point": urgent_alarm.end_point,
                "target_arrival_time": urgent_alarm.target_arrival_time,
                "transit_type": urgent_alarm.transit_type,
                "transit_line": urgent_alarm.transit_line,
                "total_travel_time_seconds": urgent_status["total_travel_time_seconds"],
                "departure_time": urgent_status["departure_time"],
                "departure_countdown_seconds": countdown_val,
                "alert_time": urgent_status["alert_time"],
                "alert_countdown_seconds": urgent_status["alert_countdown_seconds"],
                "routes": routes,
                "api_limit_exceeded": urgent_status.get("api_limit_exceeded", False),
                
                # Compatibility fields
                "distance_meters": int(routes[0].get("total_distance", 500)) if routes else 500,
                "transit_remaining_seconds": max(0, countdown_val) + walk_time,
                "transit_arrival_time": urgent_alarm.target_arrival_time,
                "user_walk_time_seconds": walk_time,
                "user_eta_minutes": int(walk_time / 60),
                "boarding_status": "출발 대기" if countdown_val > 0 else "지금 즉시 출발!",
                "status_code": "stable" if countdown_val > 300 else ("warning" if countdown_val > 0 else "impossible")
            }

    # 2. Fallback to default Profile-based Transit Check (SafeCatch Live original logic)
    status_info = transit.get_transit_info(
        user_id=current_user.id,
        transit_type=profile.transit_type,
        transit_line=profile.transit_line,
        average_walk_speed=profile.average_walk_speed,
        buffer_time=profile.buffer_time,
        start_lat=profile.start_lat,
        start_lon=profile.start_lon,
        end_lat=profile.end_lat,
        end_lon=profile.end_lon
    )
    status_info["is_trip_alarm"] = False
    return status_info

@app.get("/api/transit/search-poi")
def search_poi(keyword: str, current_user: models.User = Depends(auth.get_current_user)):
    import urllib.parse
    import urllib.request
    import json
    
    api_key = transit.load_tmap_api_key()
    if not api_key:
        raise HTTPException(status_code=400, detail="Tmap API Key is not configured in .env")
        
    encoded_keyword = urllib.parse.quote(keyword)
    url = f"https://apis.openapi.sk.com/tmap/pois?version=1&searchKeyword={encoded_keyword}&resCoordType=WGS84GEO&count=10"
    headers = {
        "appKey": api_key,
        "Accept": "application/json"
    }
    
    try:
        req = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            search_info = res_data.get("searchPoiInfo", {})
            pois = search_info.get("pois", {}).get("poi", [])
            
            results = []
            for poi in pois:
                name = poi.get("name")
                lat = poi.get("noorLat")
                lon = poi.get("noorLon")
                addr = " ".join(filter(None, [
                    poi.get("upperAddrName"),
                    poi.get("middleAddrName"),
                    poi.get("lowerAddrName"),
                    poi.get("roadName")
                ]))
                results.append({
                    "name": name,
                    "address": addr,
                    "latitude": float(lat) if lat else 0.0,
                    "longitude": float(lon) if lon else 0.0
                })
            return results
    except Exception as e:
        print(f"POI Search Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to query Tmap POI: {str(e)}")

@app.post("/api/transit/late")
def handle_late_departure(current_user: models.User = Depends(auth.get_current_user)):
    # Shift transit calculation to the next dispatch schedule
    new_offset = transit.skip_to_next_transit(current_user.id)
    return {"message": f"Successfully set skip offset to {new_offset} transits."}

@app.get("/api/transit/recommend-route")
def recommend_route(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
    start_name: str = "출발지",
    end_name: str = "목적지",
    current_user: models.User = Depends(auth.get_current_user)
):
    res = transit.get_tmap_transit_route(
        start_lat, start_lon, end_lat, end_lon,
        start_name=start_name, end_name=end_name
    )
    if not res:
        raise HTTPException(status_code=404, detail="추천 대중교통 경로를 찾을 수 없습니다.")
        
    return res

@app.post("/api/transit/reset")
def handle_reset_departure(current_user: models.User = Depends(auth.get_current_user)):
    transit.reset_skipped_transits(current_user.id)
    return {"message": "Successfully reset transit skips."}

if __name__ == "__main__":
    uvicorn.run("safecatch.backend.app.main:app", host="0.0.0.0", port=8000, reload=True)


