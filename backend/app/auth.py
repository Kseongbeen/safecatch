import hashlib
import hmac
import base64
import json
import time
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from . import models

SECRET_KEY = "safecatch_super_secret_key_for_local_development"
TOKEN_EXPIRY_HOURS = 24
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login-form-url-dummy", auto_error=False)

def hash_password(password: str) -> str:
    # Use PBKDF2-HMAC-SHA256 (standard Python, secure and robust)
    salt = b"safecatch_salt"
    iterations = 100000
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return base64.b64encode(hashed).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = time.time() + expires_delta.total_seconds()
    else:
        expire = time.time() + (TOKEN_EXPIRY_HOURS * 3600)
    
    to_encode.update({"exp": expire})
    
    # Encode payload to base64
    payload_json = json.dumps(to_encode).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_json).decode("utf-8").rstrip("=")
    
    # Sign the payload
    signature = hmac.new(SECRET_KEY.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
    
    # Combine to make a token (format: payload.signature)
    return f"{payload_b64}.{signature_b64}"

def verify_access_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        
        payload_b64, signature_b64 = parts[0], parts[1]
        
        # Verify signature
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode("utf-8").rstrip("=")
        
        if not hmac.compare_digest(signature_b64, expected_sig_b64):
            return None
            
        # Decode payload
        # Pad base64 if needed
        padding = 4 - (len(payload_b64) % 4)
        if padding < 4:
            payload_b64 += "=" * padding
            
        payload_json = base64.urlsafe_b64decode(payload_b64).decode("utf-8")
        payload = json.loads(payload_json)
        
        # Check expiry
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload
    except Exception:
        return None

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
        
    payload = verify_access_token(token)
    if payload is None:
        raise credentials_exception
        
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user
