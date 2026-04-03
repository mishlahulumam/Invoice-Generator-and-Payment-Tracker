from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime, date
import uuid


class RecurringCreate(BaseModel):
    client_id: Optional[uuid.UUID] = None
    name: str
    frequency: str  # weekly, monthly, yearly
    start_date: date
    end_date: Optional[date] = None
    base_invoice_data: Dict[str, Any]


class RecurringUpdate(BaseModel):
    name: Optional[str] = None
    frequency: Optional[str] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    base_invoice_data: Optional[Dict[str, Any]] = None


class RecurringResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    client_id: Optional[uuid.UUID]
    name: str
    frequency: str
    start_date: date
    end_date: Optional[date]
    next_run_date: date
    is_active: bool
    base_invoice_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
