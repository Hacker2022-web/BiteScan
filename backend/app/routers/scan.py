import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from ..schemas import ScanRequest, ScanResult, Role
from ..services.gemini_vision import analyze_image_with_gemini
from ..services.scale_service import analyze_scale
from ..services.rules_engine import check_compliance
from ..services.health_engine import analyze_health
from ..services.supabase_service import save_scan_record, fetch_scan_history

router = APIRouter(prefix="/api/v1/scan", tags=["scan"])


@router.post("")
async def scan_product(request: ScanRequest):
    scan_id = f"SCAN-{uuid.uuid4().hex[:12].upper()}"
    timestamp = datetime.now().isoformat()

    ocr_data = await analyze_image_with_gemini(
        image_base64=request.image_base64,
        preset=request.preset
    )

    scale_data = None
    compliance = None
    health = None
    alternatives = None

    if request.role == Role.INSPECTOR:
        scale_data = analyze_scale(ocr_data)
        compliance = check_compliance(ocr_data, scale_data)

    if request.role == Role.CITIZEN:
        health_result = analyze_health(ocr_data)
        health = health_result
        alternatives = health_result.get("alternatives", [])

    history_entry = {
        "scan_id": scan_id,
        "timestamp": timestamp,
        "product_name": ocr_data.get("product_name", "Unknown"),
        "brand": ocr_data.get("brand", ""),
        "health_score": health.get("health_score", 0) if health else 0,
        "violations": compliance.get("violations_count", 0) if compliance else 0,
        "role": request.role.value,
        "ocr_data": ocr_data,
        "scale_data": scale_data,
        "compliance": compliance,
        "health": health,
        "alternatives": alternatives
    }
    await save_scan_record(history_entry)

    return {
        "scan_id": scan_id,
        "timestamp": timestamp,
        "role": request.role,
        "ocr_data": ocr_data,
        "scale_data": scale_data,
        "compliance": compliance,
        "health": health,
        "alternatives": alternatives,
        "image_url": None
    }


@router.get("/presets")
async def list_presets():
    return {
        "presets": [
            {
                "id": "maggi",
                "name": "Maggi 2-Minute Noodles 70g",
                "brand": "Nestle",
                "category": "Processed Food",
                "concern": "Palm Oil + MSG",
                "icon": "noodles"
            },
            {
                "id": "coca_cola",
                "name": "Coca-Cola 500ml",
                "brand": "Coca-Cola",
                "category": "Soft Drink",
                "concern": "Excessive Sugar",
                "icon": "bottle"
            },
            {
                "id": "olive_oil",
                "name": "Borges Extra Virgin Olive Oil 1L",
                "brand": "Borges",
                "category": "Cooking Oil",
                "concern": "Clean — No Issues",
                "icon": "bottle"
            }
        ]
    }


async def get_scan_history() -> list[dict]:
    return await fetch_scan_history()
