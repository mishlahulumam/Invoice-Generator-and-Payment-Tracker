from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class TemplateCreate(BaseModel):
    name: str
    theme_color: str = "#3B82F6"
    accent_color: str = "#1E40AF"
    layout: str = "classic"
    is_default: bool = False


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    theme_color: Optional[str] = None
    accent_color: Optional[str] = None
    layout: Optional[str] = None
    is_default: Optional[bool] = None


class TemplateResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    theme_color: str
    accent_color: str
    layout: str
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True
