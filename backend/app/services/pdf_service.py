import os
from pathlib import Path
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image as RLImage
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from ..config import settings


TERRACOTTA = HexColor("#C86428")
WALNUT = HexColor("#24201E")
SLATE = HexColor("#78716C")
CRIMSON = HexColor("#DC2626")
FOREST = HexColor("#5B7038")


def generate_show_cause_notice(
    scan_data: dict,
    violation_details: dict,
    inspector_name: str = "Inspector — Consumer Affairs",
    inspector_badge: str = "CA-2024-0001",
    gps_coordinates: str = "28.6139°N, 77.2090°E",
    language: str = "bilingual"
) -> dict:
    notice_id = f"SCN-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    pdf_filename = f"{notice_id}.pdf"
    pdf_path = settings.NOTICES_DIR / pdf_filename

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=2*cm,
        rightMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'NoticeTitle',
        parent=styles['Title'],
        fontSize=14,
        textColor=TERRACOTTA,
        spaceAfter=6,
        alignment=TA_CENTER,
        leading=18
    )

    subtitle_style = ParagraphStyle(
        'NoticeSubtitle',
        parent=styles['Heading2'],
        fontSize=11,
        textColor=WALNUT,
        spaceAfter=4,
        alignment=TA_CENTER,
        leading=14
    )

    body_style = ParagraphStyle(
        'NoticeBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=WALNUT,
        spaceAfter=6,
        leading=14
    )

    small_style = ParagraphStyle(
        'NoticeSmall',
        parent=styles['Normal'],
        fontSize=8,
        textColor=SLATE,
        spaceAfter=3,
        leading=10
    )

    bold_style = ParagraphStyle(
        'NoticeBold',
        parent=body_style,
        fontSize=10,
        textColor=CRIMSON,
    )

    elements = []

    elements.append(Paragraph("GOVERNMENT OF INDIA", subtitle_style))
    elements.append(Paragraph("MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION", subtitle_style))
    elements.append(Paragraph("Department of Consumer Affairs", subtitle_style))
    elements.append(Spacer(1, 8*mm))

    elements.append(HRFlowable(width="100%", thickness=2, color=TERRACOTTA))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph("SHOW CAUSE NOTICE", title_style))
    elements.append(Paragraph(
        f"Under Section 36 of the Legal Metrology Act, 2009",
        subtitle_style
    ))
    elements.append(Paragraph(
        f"Notice No: {notice_id}",
        subtitle_style
    ))
    elements.append(Spacer(1, 4*mm))

    elements.append(HRFlowable(width="100%", thickness=1, color=SLATE))
    elements.append(Spacer(1, 4*mm))

    product_name = scan_data.get("product_name", "Unknown Product")
    brand = scan_data.get("brand", "Unknown Brand")
    mrp = scan_data.get("mrp", "N/A")
    net_qty = scan_data.get("net_quantity", "N/A")
    manufacturer = scan_data.get("manufacturer", "N/A")

    elements.append(Paragraph(
        f"<b>To:</b> {manufacturer}",
        body_style
    ))
    elements.append(Paragraph(
        f"<b>Product:</b> {product_name} ({brand})",
        body_style
    ))
    elements.append(Paragraph(
        f"<b>MRP:</b> {mrp} | <b>Net Quantity:</b> {net_qty}",
        body_style
    ))
    elements.append(Paragraph(
        f"<b>Date of Inspection:</b> {timestamp}",
        body_style
    ))
    elements.append(Paragraph(
        f"<b>GPS Coordinates:</b> {gps_coordinates}",
        body_style
    ))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph("<b>VIOLATIONS IDENTIFIED:</b>", bold_style))
    elements.append(Spacer(1, 2*mm))

    compliance = scan_data.get("compliance", {})
    checks = compliance.get("checks", [])
    violations = [c for c in checks if not c.get("passed", True)]

    if violations:
        for i, v in enumerate(violations, 1):
            rule = v.get("rule", "Unknown Rule")
            desc = v.get("description", "No description")
            found = v.get("found", "Not found")
            expected = v.get("expected", "Not specified")
            severity = v.get("severity", "medium").upper()

            elements.append(Paragraph(
                f"<b>Violation {i} [{severity}]:</b> {rule}",
                body_style
            ))
            elements.append(Paragraph(
                f"Requirement: {desc}",
                small_style
            ))
            elements.append(Paragraph(
                f"Found: <font color='#DC2626'>{found}</font>",
                small_style
            ))
            elements.append(Paragraph(
                f"Expected: <font color='#5B7038'>{expected}</font>",
                small_style
            ))
            elements.append(Spacer(1, 2*mm))
    else:
        elements.append(Paragraph("No violations detected during this inspection.", body_style))

    elements.append(Spacer(1, 6*mm))
    elements.append(Paragraph("<b>HEALTH & SAFETY CONCERNS:</b>", bold_style))
    elements.append(Spacer(1, 2*mm))

    health = scan_data.get("health", {})
    alerts = health.get("alerts", [])
    if alerts:
        for alert in alerts:
            sev = alert.get("severity", "medium").upper()
            elements.append(Paragraph(
                f"<b>[{sev}]</b> {alert.get('title', '')} — {alert.get('message', '')}",
                body_style
            ))
            elements.append(Spacer(1, 1*mm))
    else:
        elements.append(Paragraph("No health concerns flagged.", body_style))

    elements.append(Spacer(1, 8*mm))
    elements.append(Paragraph(
        "<b>IN VIEW OF THE ABOVE,</b> you are hereby called upon to show cause within "
        "<b>30 days</b> from the date of receipt of this notice as to why appropriate "
        "action should not be initiated against you under the provisions of the Legal "
        "Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011 "
        "for the above-mentioned violations.",
        body_style
    ))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph(
        "Failure to respond within the stipulated time will result in ex-parte proceedings "
        "and appropriate penalties as prescribed under the Act.",
        bold_style
    ))

    elements.append(Spacer(1, 12*mm))
    elements.append(HRFlowable(width="40%", thickness=1, color=SLATE))
    elements.append(Paragraph(f"<b>{inspector_name}</b>", body_style))
    elements.append(Paragraph(f"Badge: {inspector_badge}", small_style))
    elements.append(Paragraph("Ministry of Consumer Affairs, Food & Public Distribution", small_style))
    elements.append(Paragraph(f"Date: {timestamp}", small_style))

    elements.append(Spacer(1, 8*mm))
    elements.append(HRFlowable(width="100%", thickness=1, color=SLATE))
    elements.append(Paragraph(
        f"BiteScan Automated Compliance System v1.0 | Generated: {timestamp}",
        small_style
    ))
    elements.append(Paragraph(
        "This is a computer-generated document. For queries contact: compliance@bitescan.gov.in",
        small_style
    ))

    doc.build(elements)

    return {
        "notice_id": notice_id,
        "pdf_url": f"/api/v1/notices/{pdf_filename}",
        "pdf_path": str(pdf_path),
        "generated_at": timestamp,
        "section": "Section 36, Legal Metrology Act, 2009",
        "violations_count": len(violations) if violations else 0,
        "product": product_name,
        "manufacturer": manufacturer
    }
