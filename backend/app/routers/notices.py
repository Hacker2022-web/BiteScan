from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path
from ..schemas import NoticeGenerateRequest
from ..services.pdf_service import generate_show_cause_notice
from ..services.supabase_service import save_notice_record, fetch_notices
from ..config import settings

router = APIRouter(prefix="/api/v1/notices", tags=["notices"])


@router.post("/generate")
async def generate_notice(request: NoticeGenerateRequest):
    scan_data = {
        "product_name": request.violation_details.get("product_name", "Unknown Product"),
        "brand": request.violation_details.get("brand", ""),
        "mrp": request.violation_details.get("mrp", "N/A"),
        "net_quantity": request.violation_details.get("net_quantity", "N/A"),
        "manufacturer": request.violation_details.get("manufacturer", "N/A"),
        "compliance": request.violation_details.get("compliance", {}),
        "health": request.violation_details.get("health", {})
    }

    result = generate_show_cause_notice(
        scan_data=scan_data,
        violation_details=request.violation_details,
        inspector_name=request.inspector_name,
        inspector_badge=request.inspector_badge,
        gps_coordinates=request.gps_coordinates,
        language=request.language
    )

    # Persist notice record
    await save_notice_record({
        "notice_id": result.get("notice_id"),
        "product_name": scan_data["product_name"],
        "brand": scan_data["brand"],
        "inspector_name": request.inspector_name,
        "inspector_badge": request.inspector_badge,
        "gps_coordinates": request.gps_coordinates,
        "pdf_filename": result.get("filename"),
        "download_url": result.get("download_url"),
        "violation_details": request.violation_details
    })

    return result


@router.get("")
async def list_notices():
    notices = await fetch_notices(limit=50)
    return {"notices": notices, "total": len(notices)}


@router.get("/{filename}")
async def download_notice(filename: str):
    file_path = settings.NOTICES_DIR / filename
    if not file_path.exists():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Notice PDF not found")
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/pdf"
    )
