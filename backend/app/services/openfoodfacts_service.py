import httpx
from typing import Optional, Dict, Any, List

OFF_API_URL = "https://world.openfoodfacts.org/api/v2/product"
OFF_SEARCH_URL = "https://in.openfoodfacts.org/cgi/search.pl"

async def fetch_product_by_barcode_from_openfoodfacts(barcode: str) -> Optional[Dict[str, Any]]:
    """
    Fetches real product metadata, ingredients, additives, and nutrition
    from Open Food Facts India by EAN-13 barcode.
    """
    try:
        url = f"{OFF_API_URL}/{barcode}.json"
        headers = {"User-Agent": "BiteScan-India-SIH/1.0 (contact@bitescan.org)"}
        
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == 1:
                    p = data.get("product", {})
                    return _normalize_off_product(p, barcode)
    except Exception as e:
        print(f"[OpenFoodFacts API Exception] {e}")
    return None

async def search_openfoodfacts_products(query: str) -> List[Dict[str, Any]]:
    """
    Searches Open Food Facts India by product name or brand.
    """
    try:
        url = f"{OFF_SEARCH_URL}?search_terms={query}&search_simple=1&action=process&json=1&page_size=10"
        headers = {"User-Agent": "BiteScan-India-SIH/1.0 (contact@bitescan.org)"}
        
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                products = data.get("products", [])
                return [_normalize_off_product(p, p.get("code", "")) for p in products if p.get("product_name")]
    except Exception as e:
        print(f"[OpenFoodFacts Search Exception] {e}")
    return []

def _normalize_off_product(p: dict, barcode: str) -> dict:
    """Normalize raw OpenFoodFacts item into BiteScan schema."""
    ingredients_text = p.get("ingredients_text_en") or p.get("ingredients_text") or ""
    ingredients_list = [i.strip() for i in ingredients_text.split(",") if i.strip()]
    
    nutriments = p.get("nutriments", {})
    sugar = nutriments.get("sugars_100g", 0.0)
    energy = nutriments.get("energy-kcal_100g", 0.0)
    fat = nutriments.get("fat_100g", 0.0)
    sodium = nutriments.get("sodium_100g", 0.0) * 1000  # convert g to mg
    
    has_palm_oil = bool(p.get("ingredients_from_palm_oil_n", 0) > 0 or "palm" in ingredients_text.lower())
    
    # Calculate health score out of 10
    score = 8.5
    if has_palm_oil:
        score -= 2.5
    if sugar > 20:
        score -= 2.5
    elif sugar > 10:
        score -= 1.5
    if sodium > 800:
        score -= 1.5
    score = max(1.0, round(score, 1))

    return {
        "id": f"off_{barcode}",
        "name": p.get("product_name") or p.get("product_name_en") or "Packaged Food Item",
        "brand": p.get("brands") or "FMCG Brand",
        "category": "packaged_food",
        "category_label": p.get("categories", "Packaged Food").split(",")[0],
        "health_score": score,
        "health_status": "Ultra-Processed" if score < 5 else "Moderate" if score < 7.5 else "Clean & Safe",
        "score_label": "Harmful" if score < 5 else "Moderate" if score < 7.5 else "Clean",
        "mrp": f"₹{p.get('price', '—')}",
        "barcode": barcode,
        "image_url": p.get("image_url") or p.get("image_front_url") or "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80",
        "key_ingredients": ingredients_list[:6] if ingredients_list else ["Extracted from packaging"],
        "alarms": [
            *([{"type": "palm_oil", "title": "Contains Palm Oil", "message": "High in saturated fat."}] if has_palm_oil else []),
            *([{"type": "excessive_sugar", "title": f"High Sugar ({sugar}g/100g)", "message": "High sugar content."}] if sugar > 15 else [])
        ],
        "clean_alternatives": []
    }
