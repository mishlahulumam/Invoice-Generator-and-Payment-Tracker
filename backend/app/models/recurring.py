import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class RecurringInvoice(Base):
    __tablename__ = "recurring_invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    name = Column(String, nullable=False)
    frequency = Column(String, nullable=False)  # weekly, monthly, yearly
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    next_run_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    base_invoice_data = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="recurring_invoices")
    client = relationship("Client", back_populates="recurring_invoices")
