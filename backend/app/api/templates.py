from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.template import InvoiceTemplate
from app.models.user import User
from app.schemas.template import TemplateCreate, TemplateUpdate, TemplateResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=List[TemplateResponse])
def list_templates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(InvoiceTemplate).filter(InvoiceTemplate.user_id == current_user.id).all()


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(template_in: TemplateCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if template_in.is_default:
        db.query(InvoiceTemplate).filter(InvoiceTemplate.user_id == current_user.id).update({"is_default": False})

    template = InvoiceTemplate(**template_in.dict(), user_id=current_user.id)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(template_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    template = db.query(InvoiceTemplate).filter(InvoiceTemplate.id == template_id, InvoiceTemplate.user_id == current_user.id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(template_id: str, template_update: TemplateUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    template = db.query(InvoiceTemplate).filter(InvoiceTemplate.id == template_id, InvoiceTemplate.user_id == current_user.id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if template_update.is_default:
        db.query(InvoiceTemplate).filter(InvoiceTemplate.user_id == current_user.id).update({"is_default": False})

    for field, value in template_update.dict(exclude_unset=True).items():
        setattr(template, field, value)
    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(template_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    template = db.query(InvoiceTemplate).filter(InvoiceTemplate.id == template_id, InvoiceTemplate.user_id == current_user.id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
