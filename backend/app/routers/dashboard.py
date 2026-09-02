from fastapi import APIRouter
from ..services.supabase_service import fetch_dashboard_stats, fetch_scan_history, get_supabase_status
from ..schemas import DashboardStats, HistoryItem

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats():
    return await fetch_dashboard_stats()


@router.get("/history")
async def get_history():
    history = await fetch_scan_history(limit=50)

    items = []
    for h in history:
        items.append({
            "scan_id": h.get("scan_id", ""),
            "timestamp": h.get("timestamp", ""),
            "product_name": h.get("product_name", "Unknown"),
            "brand": h.get("brand", ""),
            "health_score": h.get("health_score", 0),
            "violations": h.get("violations_count", h.get("violations", 0)),
            "role": h.get("role", "citizen")
        })

    return {"history": items, "total": len(items)}


@router.get("/status")
async def get_db_status():
    return get_supabase_status()
