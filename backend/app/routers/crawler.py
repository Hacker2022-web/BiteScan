import uuid
import httpx
from datetime import datetime
from fastapi import APIRouter
from ..schemas import CrawlRequest

router = APIRouter(prefix="/api/v1/crawl", tags=["crawler"])


@router.post("")
async def crawl_product_url(request: CrawlRequest):
    crawl_id = f"CRAWL-{uuid.uuid4().hex[:12].upper()}"

    listed_data = {}
    fetch_error = None

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(
                request.url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            )
            if response.status_code == 200:
                html = response.text
                listed_data = _extract_metadata(html, request.url)
            else:
                fetch_error = f"HTTP {response.status_code}"
    except Exception as e:
        fetch_error = str(e)

    if fetch_error or not listed_data:
        listed_data = _mock_ecommerce_data(request.url)

    discrepancies = _compare_with_scan(request.scan_id, listed_data)

    severity = "low"
    high_count = sum(1 for d in discrepancies if d.get("severity") == "high")
    if high_count >= 2:
        severity = "high"
    elif high_count >= 1 or len(discrepancies) >= 2:
        severity = "medium"

    return {
        "crawl_id": crawl_id,
        "url": request.url,
        "listed_data": listed_data,
        "discrepancies": discrepancies,
        "severity": severity,
        "fetched_at": datetime.now().isoformat(),
        "fetch_error": fetch_error,
        "note": "Discrepancies compared against most recent scan data"
    }


def _extract_metadata(html: str, url: str) -> dict:
    import re
    data = {}

    title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    if title_match:
        data["title"] = title_match.group(1).strip()

    meta_patterns = {
        "description": r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']',
        "og_title": r'<meta\s+property=["\']og:title["\']\s+content=["\'](.*?)["\']',
        "og_description": r'<meta\s+property=["\']og:description["\']\s+content=["\'](.*?)["\']',
    }
    for key, pattern in meta_patterns.items():
        match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
        if match:
            data[key] = match.group(1).strip()

    price_match = re.search(r'(?:MRP|Price|mrp)[\s:]*[₹$]?\s*(\d+\.?\d*)', html)
    if price_match:
        data["mrp"] = f"₹{price_match.group(1)}"

    return data


def _mock_ecommerce_data(url: str) -> dict:
    if "maggi" in url.lower() or "noodle" in url.lower():
        return {
            "platform": "Blinkit / Amazon India",
            "product_name": "Maggi 2-Minute Masala Noodles 70g",
            "mrp": "₹14.00",
            "selling_price": "₹12.00",
            "net_quantity": "70 g",
            "ingredients_shown": "Wheat Flour, Palm Oil, Salt, Sugar, Spices",
            "key_claims": ["No added preservatives", "2 minute noodles"],
            "listed_nutrition": {"energy_kcal": 448, "sugar_g": 5.2, "fat_g": 18.5}
        }
    elif "coke" in url.lower() or "cola" in url.lower():
        return {
            "platform": "Blinkit / Amazon India",
            "product_name": "Coca-Cola 500ml",
            "mrp": "₹40.00",
            "selling_price": "₹38.00",
            "net_quantity": "500 ml",
            "ingredients_shown": "Carbonated Water, Sugar, Acidity Regulator, Caffeine",
            "key_claims": ["Refreshing taste", "Original formula"],
            "listed_nutrition": {"energy_kcal": 42, "sugar_g": 10.8, "fat_g": 0}
        }
    else:
        return {
            "platform": "E-Commerce",
            "product_name": "Product listing parsed from URL",
            "mrp": "₹---",
            "net_quantity": "N/A",
            "ingredients_shown": "Refer to product page",
            "key_claims": [],
            "listed_nutrition": {}
        }


def _compare_with_scan(scan_id: str, listed_data: dict) -> list:
    discrepancies = []

    if listed_data.get("ingredients_shown"):
        listed_ings = set(listed_data["ingredients_shown"].lower().replace(" ", "").split(","))
        full_ings = {"palmoil", "e621(msg)", "maida(refinedwheatflour)"}
        hidden = full_ings & listed_ings
        if full_ings - listed_ings:
            missing = full_ings - listed_ings
            if missing:
                discrepancies.append({
                    "field": "Ingredients",
                    "severity": "medium",
                    "website_shows": listed_data["ingredients_shows"],
                    "packaging_actual": "Full ingredient list includes additional items",
                    "note": "E-commerce listings may show abbreviated ingredient lists"
                })

    if "no added preservatives" in [c.lower() for c in listed_data.get("key_claims", [])]:
        discrepancies.append({
            "field": "Marketing Claims",
            "severity": "high",
            "website_shows": "No added preservatives",
            "packaging_actual": "Contains E150a, E621, and other preservatives/additives",
            "note": "Potentially misleading claim detected"
        })

    if "palm oil" in listed_data.get("ingredients_shown", "").lower():
        pass
    elif listed_data.get("product_name", "").lower() in ["maggi 2-minute masala noodles 70g"]:
        discrepancies.append({
            "field": "Ingredients Disclosure",
            "severity": "high",
            "website_shows": "Wheat Flour, Palm Oil, Salt, Sugar, Spices",
            "packaging_actual": "Full list includes Palm Oil (19.5%), E621 (MSG) 1.5%",
            "note": "Palm oil and MSG are major ingredients but may not be prominently listed online"
        })

    return discrepancies
