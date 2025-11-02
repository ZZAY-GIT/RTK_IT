# app/core/security.py
import bcrypt
import logging

logger = logging.getLogger(__name__)


def hash_password(password: str) -> bytes:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed


def verify_password(password: str, hashed_password: bytes) -> bool:
    try:
        password_bytes = password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_password)
    except (ValueError, TypeError) as e:
        logging.error(f"Failed to verify password: {str(e)}")
        return False
