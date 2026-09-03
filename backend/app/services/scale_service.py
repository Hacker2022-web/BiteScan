import json
from ..config import settings


def analyze_scale(ocr_data: dict) -> dict:
    barcodes = ocr_data.get("detected_barcodes") or []

    if not barcodes:
        return {
            "barcode_detected": False,
            "ppm": 0.0,
            "message": "No barcode detected in image"
        }

    barcode = barcodes[0] if isinstance(barcodes, list) and len(barcodes) > 0 else {}
    barcode_pixel_w = float(barcode.get("w") or 180)
    if barcode_pixel_w <= 0:
        barcode_pixel_w = 180.0

    ppm = barcode_pixel_w / max(0.1, settings.EAN13_PHYSICAL_WIDTH_MM)
    if ppm <= 0:
        ppm = 4.83

    measured_font_heights = []
    for region in ocr_data.get("detected_text_regions") or []:
        if isinstance(region, dict) and region.get("category") in ["mrp", "net_qty", "date", "origin"]:
            h_val = float(region.get("h") or 25)
            physical_h_mm = h_val / ppm
            measured_font_heights.append({
                "text": region.get("text", ""),
                "category": region.get("category", ""),
                "pixel_height": h_val,
                "physical_height_mm": round(physical_h_mm, 2),
                "text_content": region.get("text", "")
            })

    return {
        "barcode_detected": True,
        "barcode_type": barcode.get("type", "EAN-13"),
        "barcode_value": barcode.get("value", ""),
        "barcode_pixel_width": barcode_pixel_w,
        "physical_width_mm": settings.EAN13_PHYSICAL_WIDTH_MM,
        "ppm": round(ppm, 2),
        "measured_font_heights": measured_font_heights,
        "calibration_quality": _assess_calibration(ppm)
    }


def _assess_calibration(ppm: float) -> str:
    if 3.5 <= ppm <= 6.5:
        return "good"
    elif 2.0 <= ppm <= 8.0:
        return "moderate"
    return "poor"
