from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    business_phone: Optional[str] = None


class UserUpdate(BaseModel):
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    business_phone: Optional[str] = None
    logo_url: Optional[str] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    business_name: Optional[str]
    business_address: Optional[str]
    business_phone: Optional[str]
    logo_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
