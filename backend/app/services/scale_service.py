import json
from ..config import settings


def analyze_scale(ocr_data: dict) -> dict:
    barcodes = ocr_data.get("detected_barcodes", [])

    if not barcodes:
        return {
            "barcode_detected": False,
            "ppm": 0,
            "message": "No barcode detected in image"
        }

    barcode = barcodes[0]
    barcode_pixel_w = barcode.get("w", 180)

    ppm = barcode_pixel_w / settings.EAN13_PHYSICAL_WIDTH_MM

    measured_font_heights = []
    for region in ocr_data.get("detected_text_regions", []):
        if region.get("category") in ["mrp", "net_qty", "date", "origin"]:
            physical_h_mm = region.get("h", 25) / ppm
            measured_font_heights.append({
                "text": region["text"],
                "category": region["category"],
                "pixel_height": region.get("h", 25),
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
