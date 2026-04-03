import os
import uuid
from io import BytesIO
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_LEFT, TA_CENTER

PDF_DIR = "pdfs"
os.makedirs(PDF_DIR, exist_ok=True)


def hex_to_color(hex_str: str):
    hex_str = hex_str.lstrip("#")
    r, g, b = int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16)
    return colors.Color(r / 255, g / 255, b / 255)


def generate_invoice_pdf(invoice, user, client, template=None) -> str:
    theme_color_hex = template.theme_color if template else "#3B82F6"
    accent_color_hex = template.accent_color if template else "#1E40AF"
    theme_color = hex_to_color(theme_color_hex)
    accent_color = hex_to_color(accent_color_hex)

    filename = f"{PDF_DIR}/invoice_{invoice.invoice_number}_{uuid.uuid4().hex[:8]}.pdf"
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle("title", fontSize=28, textColor=theme_color, fontName="Helvetica-Bold")
    header_style = ParagraphStyle("header", fontSize=11, textColor=colors.white, fontName="Helvetica-Bold")
    normal_style = ParagraphStyle("normal", fontSize=9, textColor=colors.black)
    bold_style = ParagraphStyle("bold", fontSize=9, textColor=colors.black, fontName="Helvetica-Bold")
    right_style = ParagraphStyle("right", fontSize=9, textColor=colors.black, alignment=TA_RIGHT)
    right_bold = ParagraphStyle("right_bold", fontSize=10, textColor=colors.black, fontName="Helvetica-Bold", alignment=TA_RIGHT)
    total_style = ParagraphStyle("total", fontSize=12, textColor=colors.white, fontName="Helvetica-Bold", alignment=TA_RIGHT)

    # Header section
    business_name = user.business_name or "My Business"
    header_data = [
        [
            Paragraph(business_name, title_style),
            Paragraph("INVOICE", ParagraphStyle("inv", fontSize=32, textColor=accent_color, fontName="Helvetica-Bold", alignment=TA_RIGHT)),
        ]
    ]
    header_table = Table(header_data, colWidths=[100 * mm, 80 * mm])
    header_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story.append(header_table)
    story.append(Spacer(1, 5 * mm))
    story.append(HRFlowable(width="100%", thickness=2, color=theme_color))
    story.append(Spacer(1, 5 * mm))

    # Info section
    client_name = client.name if client else "N/A"
    client_email = client.email if client else ""
    client_address = client.address if client else ""

    info_data = [
        [
            Paragraph(f"<b>Bill To:</b><br/>{client_name}<br/>{client_email}<br/>{client_address}", normal_style),
            Table(
                [
                    [Paragraph("<b>Invoice #:</b>", bold_style), Paragraph(invoice.invoice_number, right_style)],
                    [Paragraph("<b>Issue Date:</b>", bold_style), Paragraph(str(invoice.issue_date), right_style)],
                    [Paragraph("<b>Due Date:</b>", bold_style), Paragraph(str(invoice.due_date), right_style)],
                    [Paragraph("<b>Status:</b>", bold_style), Paragraph(invoice.status.value.upper(), right_style)],
                ],
                colWidths=[35 * mm, 45 * mm],
            ),
        ]
    ]
    info_table = Table(info_data, colWidths=[90 * mm, 90 * mm])
    story.append(info_table)
    story.append(Spacer(1, 8 * mm))

    # Items table
    item_header = [
        Paragraph("Description", header_style),
        Paragraph("Qty", header_style),
        Paragraph("Unit Price", header_style),
        Paragraph("Subtotal", header_style),
    ]
    item_rows = [item_header]
    for item in invoice.items:
        item_rows.append([
            Paragraph(item.description, normal_style),
            Paragraph(str(item.quantity), normal_style),
            Paragraph(f"Rp {item.unit_price:,.0f}", right_style),
            Paragraph(f"Rp {item.subtotal:,.0f}", right_style),
        ])

    items_table = Table(item_rows, colWidths=[80 * mm, 20 * mm, 40 * mm, 40 * mm])
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), theme_color),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.Color(0.96, 0.96, 0.98)]),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 5 * mm))

    # Totals
    totals_data = [
        ["", Paragraph("Subtotal:", right_style), Paragraph(f"Rp {invoice.subtotal:,.0f}", right_style)],
    ]
    if invoice.discount > 0:
        totals_data.append(["", Paragraph(f"Discount ({invoice.discount}%):", right_style), Paragraph(f"- Rp {invoice.discount_amount:,.0f}", right_style)])
    if invoice.tax_rate > 0:
        totals_data.append(["", Paragraph(f"Tax (PPN {invoice.tax_rate}%):", right_style), Paragraph(f"Rp {invoice.tax_amount:,.0f}", right_style)])

    totals_table = Table(totals_data, colWidths=[80 * mm, 60 * mm, 40 * mm])
    totals_table.setStyle(TableStyle([("ALIGN", (1, 0), (-1, -1), "RIGHT"), ("TOPPADDING", (0, 0), (-1, -1), 2)]))
    story.append(totals_table)

    # Total box
    total_data = [[
        Paragraph("TOTAL DUE", ParagraphStyle("td", fontSize=11, textColor=colors.white, fontName="Helvetica-Bold")),
        Paragraph(f"Rp {invoice.total:,.0f}", total_style),
    ]]
    total_table = Table(total_data, colWidths=[130 * mm, 50 * mm])
    total_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), accent_color),
        ("ALIGN", (0, 0), (0, 0), "LEFT"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(total_table)

    # Notes & Terms
    if invoice.notes:
        story.append(Spacer(1, 6 * mm))
        story.append(Paragraph("<b>Notes:</b>", bold_style))
        story.append(Paragraph(invoice.notes, normal_style))
    if invoice.terms:
        story.append(Spacer(1, 4 * mm))
        story.append(Paragraph("<b>Terms & Conditions:</b>", bold_style))
        story.append(Paragraph(invoice.terms, normal_style))

    # Footer
    story.append(Spacer(1, 8 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey))
    story.append(Spacer(1, 2 * mm))
    footer_text = user.business_address or ""
    story.append(Paragraph(footer_text, ParagraphStyle("footer", fontSize=8, textColor=colors.grey, alignment=TA_CENTER)))

    doc.build(story)
    buffer.seek(0)

    with open(filename, "wb") as f:
        f.write(buffer.read())

    return filename
