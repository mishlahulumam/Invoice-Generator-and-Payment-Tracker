from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date
from app.db.session import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.payment import Payment
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    today = date.today()

    total_invoices = db.query(Invoice).filter(Invoice.user_id == user_id).count()

    paid_invoices = db.query(Invoice).filter(Invoice.user_id == user_id, Invoice.status == InvoiceStatus.paid).all()
    total_revenue = sum(float(inv.total) for inv in paid_invoices)

    outstanding_invoices = db.query(Invoice).filter(
        Invoice.user_id == user_id,
        Invoice.status.in_([InvoiceStatus.sent, InvoiceStatus.overdue])
    ).all()
    total_outstanding = sum(float(inv.total) for inv in outstanding_invoices)

    overdue_count = db.query(Invoice).filter(
        Invoice.user_id == user_id, Invoice.status == InvoiceStatus.overdue
    ).count()

    this_month_revenue = sum(
        float(inv.total)
        for inv in paid_invoices
        if inv.payment and inv.payment.payment_date.month == today.month and inv.payment.payment_date.year == today.year
    )

    return {
        "total_invoices": total_invoices,
        "total_revenue": total_revenue,
        "total_outstanding": total_outstanding,
        "overdue_count": overdue_count,
        "this_month_revenue": this_month_revenue,
    }


@router.get("/revenue-chart")
def get_revenue_chart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    months = []
    for i in range(11, -1, -1):
        month = today.month - i
        year = today.year
        while month <= 0:
            month += 12
            year -= 1
        months.append((year, month))

    result = []
    for year, month in months:
        paid = (
            db.query(func.sum(Invoice.total))
            .join(Payment, Payment.invoice_id == Invoice.id)
            .filter(
                Invoice.user_id == current_user.id,
                Invoice.status == InvoiceStatus.paid,
                extract("year", Payment.payment_date) == year,
                extract("month", Payment.payment_date) == month,
            )
            .scalar()
        )
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        result.append({
            "month": f"{month_names[month - 1]} {year}",
            "revenue": float(paid or 0),
        })

    return result


@router.get("/invoice-stats")
def get_invoice_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    stats = {}
    for s in InvoiceStatus:
        count = db.query(Invoice).filter(Invoice.user_id == user_id, Invoice.status == s).count()
        stats[s.value] = count
    return stats
