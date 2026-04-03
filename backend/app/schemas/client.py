from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid


class ClientCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    npwp: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    npwp: Optional[str] = None


class ClientResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    npwp: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
