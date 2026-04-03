from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
import uuid
from app.models.invoice import InvoiceStatus


class InvoiceItemCreate(BaseModel):
    description: str
    quantity: int
    unit_price: Decimal


class InvoiceItemResponse(BaseModel):
    id: uuid.UUID
    description: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


class InvoiceCreate(BaseModel):
    client_id: Optional[uuid.UUID] = None
    template_id: Optional[uuid.UUID] = None
    issue_date: date
    due_date: date
    notes: Optional[str] = None
    terms: Optional[str] = None
    discount: Decimal = Decimal("0")
    tax_rate: Decimal = Decimal("11")
    items: List[InvoiceItemCreate]


class InvoiceUpdate(BaseModel):
    client_id: Optional[uuid.UUID] = None
    template_id: Optional[uuid.UUID] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    discount: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    items: Optional[List[InvoiceItemCreate]] = None


class PaymentInfo(BaseModel):
    id: uuid.UUID
    amount: Decimal
    payment_date: date
    payment_method: Optional[str]
    notes: Optional[str]

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    client_id: Optional[uuid.UUID]
    template_id: Optional[uuid.UUID]
    invoice_number: str
    status: InvoiceStatus
    issue_date: date
    due_date: date
    notes: Optional[str]
    terms: Optional[str]
    discount: Decimal
    tax_rate: Decimal
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total: Decimal
    pdf_path: Optional[str]
    created_at: datetime
    items: List[InvoiceItemResponse] = []
    payment: Optional[PaymentInfo] = None

    class Config:
        from_attributes = True


class MarkPaidRequest(BaseModel):
    payment_date: date
    payment_method: Optional[str] = "transfer"
    notes: Optional[str] = None
