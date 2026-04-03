from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.db.session import get_db
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
from app.models.payment import Payment
from app.models.user import User
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse, MarkPaidRequest
from app.core.security import get_current_user
from app.services.pdf_service import generate_invoice_pdf
from app.services.qr_service import generate_qris_qr
from app.services.email_service import send_invoice_email
import uuid

router = APIRouter(prefix="/invoices", tags=["invoices"])


def generate_invoice_number(db: Session, user_id) -> str:
    today = date.today()
    count = db.query(Invoice).filter(Invoice.user_id == user_id).count()
    return f"INV-{today.year}-{str(count + 1).zfill(4)}"


def calculate_totals(items_data, discount: float, tax_rate: float):
    subtotal = sum(item.quantity * item.unit_price for item in items_data)
    discount_amount = float(subtotal) * discount / 100
    after_discount = float(subtotal) - discount_amount
    tax_amount = after_discount * tax_rate / 100
    total = after_discount + tax_amount
    return float(subtotal), discount_amount, tax_amount, total


@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Invoice).filter(Invoice.user_id == current_user.id)
    if status:
        query = query.filter(Invoice.status == status)
    return query.order_by(Invoice.created_at.desc()).all()


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(invoice_in: InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice_number = generate_invoice_number(db, current_user.id)

    invoice = Invoice(
        user_id=current_user.id,
        client_id=invoice_in.client_id,
        template_id=invoice_in.template_id,
        invoice_number=invoice_number,
        status=InvoiceStatus.draft,
        issue_date=invoice_in.issue_date,
        due_date=invoice_in.due_date,
        notes=invoice_in.notes,
        terms=invoice_in.terms,
        discount=invoice_in.discount,
        tax_rate=invoice_in.tax_rate,
        subtotal=0,
        discount_amount=0,
        tax_amount=0,
        total=0,
    )
    db.add(invoice)
    db.flush()

    subtotal = 0
    for item_data in invoice_in.items:
        item_subtotal = item_data.quantity * item_data.unit_price
        subtotal += float(item_subtotal)
        item = InvoiceItem(
            invoice_id=invoice.id,
            description=item_data.description,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            subtotal=item_subtotal,
        )
        db.add(item)

    discount_amount = subtotal * float(invoice_in.discount) / 100
    after_discount = subtotal - discount_amount
    tax_amount = after_discount * float(invoice_in.tax_rate) / 100
    invoice.subtotal = subtotal
    invoice.discount_amount = discount_amount
    invoice.tax_amount = tax_amount
    invoice.total = after_discount + tax_amount

    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(invoice_id: str, invoice_update: InvoiceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status == InvoiceStatus.paid:
        raise HTTPException(status_code=400, detail="Cannot edit a paid invoice")

    update_data = invoice_update.dict(exclude_unset=True)
    items_data = update_data.pop("items", None)

    for field, value in update_data.items():
        setattr(invoice, field, value)

    if items_data is not None:
        for old_item in invoice.items:
            db.delete(old_item)
        db.flush()

        subtotal = 0
        for item_data in items_data:
            item_subtotal = item_data["quantity"] * item_data["unit_price"]
            subtotal += float(item_subtotal)
            item = InvoiceItem(
                invoice_id=invoice.id,
                description=item_data["description"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                subtotal=item_subtotal,
            )
            db.add(item)

        discount = float(invoice.discount)
        tax_rate = float(invoice.tax_rate)
        discount_amount = subtotal * discount / 100
        after_discount = subtotal - discount_amount
        tax_amount = after_discount * tax_rate / 100
        invoice.subtotal = subtotal
        invoice.discount_amount = discount_amount
        invoice.tax_amount = tax_amount
        invoice.total = after_discount + tax_amount

    db.commit()
    db.refresh(invoice)
    return invoice


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(invoice_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(invoice)
    db.commit()


@router.post("/{invoice_id}/send")
def send_invoice(invoice_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    template = invoice.template
    pdf_path = generate_invoice_pdf(invoice, current_user, invoice.client, template)
    invoice.pdf_path = pdf_path
    invoice.status = InvoiceStatus.sent
    db.commit()

    email_sent = False
    if invoice.client and invoice.client.email:
        email_sent = send_invoice_email(
            to_email=invoice.client.email,
            invoice_number=invoice.invoice_number,
            client_name=invoice.client.name,
            total=float(invoice.total),
            pdf_path=pdf_path,
        )

    return {"message": "Invoice sent", "email_sent": email_sent, "status": invoice.status}


@router.post("/{invoice_id}/pay", response_model=InvoiceResponse)
def mark_paid(invoice_id: str, payment_data: MarkPaidRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status == InvoiceStatus.paid:
        raise HTTPException(status_code=400, detail="Invoice already paid")

    invoice.status = InvoiceStatus.paid
    payment = Payment(
        invoice_id=invoice.id,
        amount=invoice.total,
        payment_date=payment_data.payment_date,
        payment_method=payment_data.payment_method,
        notes=payment_data.notes,
    )
    db.add(payment)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/{invoice_id}/pdf")
def download_pdf(invoice_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not invoice.pdf_path:
        template = invoice.template
        pdf_path = generate_invoice_pdf(invoice, current_user, invoice.client, template)
        invoice.pdf_path = pdf_path
        db.commit()
    
    import os
    if not os.path.exists(invoice.pdf_path):
        template = invoice.template
        pdf_path = generate_invoice_pdf(invoice, current_user, invoice.client, template)
        invoice.pdf_path = pdf_path
        db.commit()

    return FileResponse(
        invoice.pdf_path,
        media_type="application/pdf",
        filename=f"Invoice_{invoice.invoice_number}.pdf",
    )


@router.get("/{invoice_id}/qr")
def get_qr_code(invoice_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    qr_data = generate_qris_qr(invoice.invoice_number, float(invoice.total))
    return {"qr_code": qr_data, "invoice_number": invoice.invoice_number, "amount": float(invoice.total)}


@router.post("/{invoice_id}/duplicate", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def duplicate_invoice(invoice_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    original = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == current_user.id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Invoice not found")

    new_invoice = Invoice(
        user_id=current_user.id,
        client_id=original.client_id,
        template_id=original.template_id,
        invoice_number=generate_invoice_number(db, current_user.id),
        status=InvoiceStatus.draft,
        issue_date=date.today(),
        due_date=date.today(),
        notes=original.notes,
        terms=original.terms,
        discount=original.discount,
        tax_rate=original.tax_rate,
        subtotal=original.subtotal,
        discount_amount=original.discount_amount,
        tax_amount=original.tax_amount,
        total=original.total,
    )
    db.add(new_invoice)
    db.flush()

    for item in original.items:
        new_item = InvoiceItem(
            invoice_id=new_invoice.id,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
        )
        db.add(new_item)

    db.commit()
    db.refresh(new_invoice)
    return new_invoice
