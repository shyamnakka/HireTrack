import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Union
from app.config import settings

def verify_password(plain_password: str, password_hash: str) -> bool:
    """
    Verify a plain password against the stored bcrypt hash.
    """
    pwd_bytes = plain_password.encode('utf-8')
    hash_bytes = password_hash.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hash_bytes)

def create_access_token(subject: Union[str, int], expires_delta: timedelta = None) -> str:
    """
    Generate a signed JWT access token.
    """
    # 1. Convert subject to string consistently (typically user database ID)
    subject_str = str(subject)

    # 2. Establish token expiration using timezone-aware UTC datetimes
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)

    # 3. Design token payload
    to_encode = {
        "sub": subject_str,
        "exp": int(expire.timestamp())  # exp claim is represented as Unix epoch timestamp
    }

    # 4. Sign and encode JWT token
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    return encoded_jwt

def decode_access_token(token: str) -> str:
    """
    Decode and validate a JWT access token.
    Raises jwt.PyJWTError subclasses on invalid, tampered, or expired tokens.
    Returns the subject string on success.
    """
    # Decode token verifying signature, algorithm, and expiration
    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm]
    )
    
    subject: str = payload.get("sub")
    if subject is None:
        raise jwt.InvalidTokenError("Token payload missing sub claim")
        
    return subject
