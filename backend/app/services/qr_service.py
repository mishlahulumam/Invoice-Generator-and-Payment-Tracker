import qrcode
import base64
from io import BytesIO


def generate_qris_qr(invoice_number: str, amount: float) -> str:
    """Generate a QRIS-style QR code and return as base64 PNG string."""
    qr_data = f"QRIS|{invoice_number}|{amount:.0f}|IDR"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    encoded = base64.b64encode(buffer.read()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"
