from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.recurring import RecurringInvoice
from app.models.user import User
from app.schemas.recurring import RecurringCreate, RecurringUpdate, RecurringResponse
from app.core.security import get_current_user
from app.services.scheduler import calculate_next_run

router = APIRouter(prefix="/recurring", tags=["recurring"])


@router.get("", response_model=List[RecurringResponse])
def list_recurring(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(RecurringInvoice).filter(RecurringInvoice.user_id == current_user.id).order_by(RecurringInvoice.created_at.desc()).all()


@router.post("", response_model=RecurringResponse, status_code=status.HTTP_201_CREATED)
def create_recurring(rec_in: RecurringCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    next_run = calculate_next_run(rec_in.frequency, rec_in.start_date)
    rec = RecurringInvoice(
        user_id=current_user.id,
        client_id=rec_in.client_id,
        name=rec_in.name,
        frequency=rec_in.frequency,
        start_date=rec_in.start_date,
        end_date=rec_in.end_date,
        next_run_date=next_run,
        is_active=True,
        base_invoice_data=rec_in.base_invoice_data,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@router.get("/{rec_id}", response_model=RecurringResponse)
def get_recurring(rec_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rec = db.query(RecurringInvoice).filter(RecurringInvoice.id == rec_id, RecurringInvoice.user_id == current_user.id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recurring invoice not found")
    return rec


@router.put("/{rec_id}", response_model=RecurringResponse)
def update_recurring(rec_id: str, rec_update: RecurringUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rec = db.query(RecurringInvoice).filter(RecurringInvoice.id == rec_id, RecurringInvoice.user_id == current_user.id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recurring invoice not found")
    for field, value in rec_update.dict(exclude_unset=True).items():
        setattr(rec, field, value)
    db.commit()
    db.refresh(rec)
    return rec


@router.post("/{rec_id}/pause", response_model=RecurringResponse)
def toggle_pause(rec_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rec = db.query(RecurringInvoice).filter(RecurringInvoice.id == rec_id, RecurringInvoice.user_id == current_user.id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recurring invoice not found")
    rec.is_active = not rec.is_active
    db.commit()
    db.refresh(rec)
    return rec


@router.delete("/{rec_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring(rec_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rec = db.query(RecurringInvoice).filter(RecurringInvoice.id == rec_id, RecurringInvoice.user_id == current_user.id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recurring invoice not found")
    db.delete(rec)
    db.commit()
