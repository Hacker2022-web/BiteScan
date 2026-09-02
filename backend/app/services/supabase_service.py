"""
BiteScan — Supabase Database Integration Service
Provides persistent cloud storage for product scans, violations, legal notices, and crawler results.
Includes seamless offline/fallback caching if Supabase credentials are not yet configured.
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..config import settings

logger = logging.getLogger(__name__)

# In-memory fallbacks when Supabase is unreachable or unconfigured
_memory_scans: List[Dict[str, Any]] = []
_memory_notices: List[Dict[str, Any]] = []
_memory_crawler: List[Dict[str, Any]] = []

_supabase_client = None
_client_initialized = False


def get_supabase_client():
    """Initializes and returns the Supabase client singleton."""
    global _supabase_client, _client_initialized
    if _client_initialized:
        return _supabase_client

    url = settings.SUPABASE_URL.strip() if settings.SUPABASE_URL else ""
    key = settings.SUPABASE_KEY.strip() if settings.SUPABASE_KEY else ""

    if url and key and "placeholder" not in key:
        try:
            from supabase import create_client, Client
            _supabase_client = create_client(url, key)
            _client_initialized = True
            logger.info(" Connected to Supabase cloud database.")
            return _supabase_client
        except Exception as e:
            logger.warning(f"⚠️ Supabase initialization failed: {e}. Falling back to memory storage.")
            _client_initialized = True
            return None
    else:
        _client_initialized = True
        return None


def get_supabase_status() -> Dict[str, Any]:
    """Returns the current connection status of Supabase."""
    client = get_supabase_client()
    return {
        "configured": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY and "placeholder" not in settings.SUPABASE_KEY),
        "connected": client is not None,
        "supabase_url": settings.SUPABASE_URL if settings.SUPABASE_URL else None
    }


# ==========================================
# SCANS TABLE OPERATIONS
# ==========================================

async def save_scan_record(scan_entry: Dict[str, Any]) -> Dict[str, Any]:
    """Saves a product scan result to Supabase `scans` table (and memory fallback)."""
    _memory_scans.append(scan_entry)

    client = get_supabase_client()
    if client:
        try:
            db_payload = {
                "scan_id": scan_entry.get("scan_id"),
                "timestamp": scan_entry.get("timestamp") or datetime.now().isoformat(),
                "product_name": scan_entry.get("product_name") or "Unknown Product",
                "brand": scan_entry.get("brand") or "",
                "role": scan_entry.get("role") or "citizen",
                "health_score": float(scan_entry.get("health_score", 0)),
                "violations_count": int(scan_entry.get("violations", 0)),
                "ocr_data": scan_entry.get("ocr_data"),
                "scale_data": scan_entry.get("scale_data"),
                "compliance_data": scan_entry.get("compliance"),
                "health_data": scan_entry.get("health"),
                "alternatives": scan_entry.get("alternatives")
            }
            res = client.table("scans").insert(db_payload).execute()
            logger.info(f"💾 Scan {scan_entry.get('scan_id')} persisted to Supabase.")
        except Exception as e:
            logger.error(f"❌ Failed to persist scan to Supabase: {e}")

    return scan_entry


async def fetch_scan_history(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves scan history from Supabase `scans` table (or memory fallback)."""
    client = get_supabase_client()
    if client:
        try:
            res = client.table("scans").select("*").order("timestamp", desc=True).limit(limit).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.error(f"❌ Failed to fetch scan history from Supabase: {e}")

    return list(reversed(_memory_scans[-limit:]))


# ==========================================
# NOTICES TABLE OPERATIONS
# ==========================================

async def save_notice_record(notice_entry: Dict[str, Any]) -> Dict[str, Any]:
    """Saves a generated Show-Cause Notice to Supabase `notices` table."""
    _memory_notices.append(notice_entry)

    client = get_supabase_client()
    if client:
        try:
            db_payload = {
                "notice_id": notice_entry.get("notice_id"),
                "timestamp": datetime.now().isoformat(),
                "product_name": notice_entry.get("product_name") or "Unknown Product",
                "brand": notice_entry.get("brand") or "",
                "inspector_name": notice_entry.get("inspector_name") or "",
                "inspector_badge": notice_entry.get("inspector_badge") or "",
                "gps_coordinates": notice_entry.get("gps_coordinates") or "",
                "pdf_filename": notice_entry.get("pdf_filename") or "",
                "pdf_download_url": notice_entry.get("download_url") or "",
                "violation_details": notice_entry.get("violation_details")
            }
            client.table("notices").insert(db_payload).execute()
            logger.info(f"💾 Legal notice {notice_entry.get('notice_id')} saved to Supabase.")
        except Exception as e:
            logger.error(f"❌ Failed to save notice to Supabase: {e}")

    return notice_entry


async def fetch_notices(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves all generated Show Cause Notices."""
    client = get_supabase_client()
    if client:
        try:
            res = client.table("notices").select("*").order("timestamp", desc=True).limit(limit).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.error(f"❌ Failed to fetch notices from Supabase: {e}")

    return list(reversed(_memory_notices[-limit:]))


# ==========================================
# CRAWLER PRODUCTS TABLE OPERATIONS
# ==========================================

async def save_crawler_item(product_entry: Dict[str, Any]) -> Dict[str, Any]:
    """Saves or updates crawled quick-commerce product compliance status."""
    _memory_crawler.append(product_entry)

    client = get_supabase_client()
    if client:
        try:
            db_payload = {
                "barcode": product_entry.get("barcode") or product_entry.get("id"),
                "name": product_entry.get("name") or product_entry.get("product_name"),
                "brand": product_entry.get("brand"),
                "category": product_entry.get("category"),
                "price": product_entry.get("price"),
                "is_compliant": product_entry.get("is_compliant", True),
                "violations_count": len(product_entry.get("violations", [])),
                "violations": product_entry.get("violations"),
                "scanned_at": datetime.now().isoformat()
            }
            client.table("crawler_products").upsert(db_payload, on_conflict="barcode").execute()
        except Exception as e:
            logger.error(f"❌ Failed to upsert crawler item to Supabase: {e}")

    return product_entry


async def fetch_crawler_items(limit: int = 100) -> List[Dict[str, Any]]:
    """Retrieves crawled products from Supabase."""
    client = get_supabase_client()
    if client:
        try:
            res = client.table("crawler_products").select("*").order("scanned_at", desc=True).limit(limit).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.error(f"❌ Failed to fetch crawler items from Supabase: {e}")

    return _memory_crawler


# ==========================================
# DASHBOARD METRICS AGGREGATOR
# ==========================================

async def fetch_dashboard_stats() -> Dict[str, Any]:
    """Computes aggregated dashboard statistics from Supabase."""
    history = await fetch_scan_history(limit=500)
    notices = await fetch_notices(limit=500)

    total = len(history)
    violations = sum(1 for h in history if (h.get("violations_count", 0) > 0 or h.get("violations", 0) > 0))
    notices_count = len(notices)

    danger = 0
    safe = 0
    scores = []
    for h in history:
        hs = h.get("health_score", 0)
        if hs > 0:
            scores.append(hs)
            if hs < 5.0:
                danger += 1
            elif hs >= 7.0:
                safe += 1

    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    return {
        "total_scans": total,
        "violations_found": violations,
        "notices_generated": notices_count,
        "health_danger": danger,
        "health_safe": safe,
        "avg_health_score": avg_score
    }
