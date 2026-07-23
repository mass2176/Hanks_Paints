from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.domain import ShopUser, ShopUserRole

ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return password_context.verify(password, password_hash)


def create_access_token(user: ShopUser) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.auth_token_expire_minutes)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.auth_secret_key, algorithm=ALGORITHM)


def public_user(user: ShopUser) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
    }


def get_current_shop_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> ShopUser:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Shop login required",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.auth_secret_key, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError as exc:
        raise credentials_error from exc

    if not user_id:
        raise credentials_error

    user = db.get(ShopUser, int(user_id))
    if not user or not user.active:
        raise credentials_error

    return user


def require_admin(user: ShopUser = Depends(get_current_shop_user)) -> ShopUser:
    if user.role != ShopUserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def seed_initial_admin(db: Session) -> None:
    if not settings.initial_admin_email or not settings.initial_admin_password:
        return

    existing = db.query(ShopUser).filter(ShopUser.email == settings.initial_admin_email.lower()).first()
    if existing:
        return

    admin = ShopUser(
        email=settings.initial_admin_email.lower(),
        full_name=settings.initial_admin_name,
        role=ShopUserRole.admin,
        password_hash=hash_password(settings.initial_admin_password),
        active=True,
    )
    db.add(admin)
    db.commit()
