from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.recurring import RecurringInvoice
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
import uuid

scheduler = BackgroundScheduler()


def calculate_next_run(frequency: str, current_date: date) -> date:
    if frequency == "weekly":
        return current_date + timedelta(weeks=1)
    elif frequency == "monthly":
        month = current_date.month + 1
        year = current_date.year
        if month > 12:
            month = 1
            year += 1
        try:
            return current_date.replace(year=year, month=month)
        except ValueError:
            import calendar
            last_day = calendar.monthrange(year, month)[1]
            return current_date.replace(year=year, month=month, day=last_day)
    elif frequency == "yearly":
        try:
            return current_date.replace(year=current_date.year + 1)
        except ValueError:
            return current_date.replace(year=current_date.year + 1, day=28)
    return current_date + timedelta(days=30)


def generate_invoice_number(db: Session, user_id) -> str:
    today = date.today()
    count = db.query(Invoice).filter(Invoice.user_id == user_id).count()
    return f"INV-{today.year}-{str(count + 1).zfill(4)}"


def process_recurring_invoices():
    db: Session = SessionLocal()
    try:
        today = date.today()
        due_recurring = (
            db.query(RecurringInvoice)
            .filter(RecurringInvoice.is_active == True, RecurringInvoice.next_run_date <= today)
            .all()
        )
        for rec in due_recurring:
            if rec.end_date and today > rec.end_date:
                rec.is_active = False
                db.commit()
                continue

            data = rec.base_invoice_data
            invoice_number = generate_invoice_number(db, rec.user_id)
            due_days = data.get("due_days", 14)

            invoice = Invoice(
                id=uuid.uuid4(),
                user_id=rec.user_id,
                client_id=rec.client_id,
                invoice_number=invoice_number,
                status=InvoiceStatus.draft,
                issue_date=today,
                due_date=today + timedelta(days=due_days),
                notes=data.get("notes"),
                terms=data.get("terms"),
                discount=data.get("discount", 0),
                tax_rate=data.get("tax_rate", 11),
                subtotal=0,
                discount_amount=0,
                tax_amount=0,
                total=0,
            )
            db.add(invoice)
            db.flush()

            subtotal = 0
            for item_data in data.get("items", []):
                qty = item_data["quantity"]
                price = item_data["unit_price"]
                item_subtotal = qty * price
                subtotal += item_subtotal
                item = InvoiceItem(
                    invoice_id=invoice.id,
                    description=item_data["description"],
                    quantity=qty,
                    unit_price=price,
                    subtotal=item_subtotal,
                )
                db.add(item)

            discount_amount = subtotal * float(invoice.discount) / 100
            after_discount = subtotal - discount_amount
            tax_amount = after_discount * float(invoice.tax_rate) / 100
            invoice.subtotal = subtotal
            invoice.discount_amount = discount_amount
            invoice.tax_amount = tax_amount
            invoice.total = after_discount + tax_amount

            rec.next_run_date = calculate_next_run(rec.frequency, today)
            db.commit()
            print(f"[Scheduler] Generated invoice {invoice_number} from recurring {rec.id}")

    except Exception as e:
        print(f"[Scheduler] Error: {e}")
        db.rollback()
    finally:
        db.close()


def update_overdue_invoices():
    db: Session = SessionLocal()
    try:
        today = date.today()
        db.query(Invoice).filter(
            Invoice.status == InvoiceStatus.sent,
            Invoice.due_date < today,
        ).update({"status": InvoiceStatus.overdue})
        db.commit()
    except Exception as e:
        print(f"[Scheduler] Overdue update error: {e}")
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(process_recurring_invoices, "cron", hour=0, minute=5, id="recurring_invoices")
    scheduler.add_job(update_overdue_invoices, "cron", hour=0, minute=0, id="overdue_update")
    scheduler.start()
    print("[Scheduler] Started")


def stop_scheduler():
    scheduler.shutdown()
