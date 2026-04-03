import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from app.core.config import settings
import os


def send_invoice_email(to_email: str, invoice_number: str, client_name: str, total: float, pdf_path: str = None) -> bool:
    """Send invoice email via Mailtrap SMTP sandbox."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Invoice #{invoice_number} from {settings.MAIL_FROM}"
        msg["From"] = settings.MAIL_FROM
        msg["To"] = to_email

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 30px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
            .header {{ background: #3B82F6; color: white; padding: 30px 40px; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .body {{ padding: 30px 40px; }}
            .amount-box {{ background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px 20px; margin: 20px 0; border-radius: 4px; }}
            .amount-box .label {{ color: #6B7280; font-size: 12px; text-transform: uppercase; }}
            .amount-box .amount {{ color: #1E40AF; font-size: 24px; font-weight: bold; }}
            .btn {{ display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }}
            .footer {{ background: #F9FAFB; padding: 20px 40px; text-align: center; color: #9CA3AF; font-size: 12px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Invoice #{invoice_number}</h1>
            </div>
            <div class="body">
              <p>Dear <strong>{client_name}</strong>,</p>
              <p>Please find attached your invoice. Here is a summary of the amount due:</p>
              <div class="amount-box">
                <div class="label">Amount Due</div>
                <div class="amount">Rp {total:,.0f}</div>
              </div>
              <p>Please make payment before the due date indicated on the invoice.</p>
              <p>If you have any questions, please don't hesitate to contact us.</p>
              <p>Thank you for your business!</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply directly to this message.</p>
            </div>
          </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_body, "html"))

        if pdf_path and os.path.exists(pdf_path):
            with open(pdf_path, "rb") as f:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", f'attachment; filename="Invoice_{invoice_number}.pdf"')
                msg.attach(part)

        with smtplib.SMTP("sandbox.smtp.mailtrap.io", 2525) as server:
            server.starttls()
            server.login(settings.MAILTRAP_USERNAME, settings.MAILTRAP_PASSWORD)
            server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())

        return True
    except Exception as e:
        print(f"Email send error: {e}")
        return False
