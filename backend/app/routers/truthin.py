import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from app.config import settings
from app.services.openfoodfacts_service import search_openfoodfacts_products, fetch_product_by_barcode_from_openfoodfacts

router = APIRouter(prefix="/api/v1/truthin", tags=["TruthIn Clean Food Database"])

def _load_truthin_data():
    db_path = settings.DATA_DIR / "truthin_database.json"
    if db_path.exists():
        with open(db_path, "r", encoding="utf-8") as f:
            return json.load(f).get("products", [])
    return []

PRODUCTS_CACHE = _load_truthin_data()

@router.get("/products")
async def get_all_products(category: Optional[str] = None):
    """Fetch all TruthIn products, optionally filtered by category."""
    if not category or category == "all":
        return {"count": len(PRODUCTS_CACHE), "products": PRODUCTS_CACHE}
    
    filtered = [p for p in PRODUCTS_CACHE if p.get("category") == category]
    return {"count": len(filtered), "products": filtered}

@router.get("/categories")
async def get_categories():
    """Return all clean FMCG food categories with icons and counts."""
    categories = [
      {"id": "instant_foods", "name": "Instant Foods & Noodles", "icon": "🍜", "count": "15+ SKUs"},
      {"id": "biscuits_cookies", "name": "Biscuits & Cookies", "icon": "🍪", "count": "24+ SKUs"},
      {"id": "breakfast_spreads", "name": "Breakfast & Spreads", "icon": "🍯", "count": "18+ SKUs"},
      {"id": "beverages_juices", "name": "Cold Drinks & Juices", "icon": "🥤", "count": "20+ SKUs"},
      {"id": "chips_munchies", "name": "Chips & Munchies", "icon": "🍿", "count": "16+ SKUs"},
      {"id": "sauces_condiments", "name": "Sauces & Condiments", "icon": "🍅", "count": "12+ SKUs"},
      {"id": "cooking_oils_ghee", "name": "Cooking Oils & Ghee", "icon": "🫒", "count": "14+ SKUs"}
    ]
    return {"categories": categories}

@router.get("/search")
async def search_truthin_products(q: str = Query("", min_length=1)):
    """Search products by brand, name, category, or ingredient with Open Food Facts fallback."""
    query = q.lower().strip()
    results = []
    
    for p in PRODUCTS_CACHE:
        name_match = query in p.get("name", "").lower()
        brand_match = query in p.get("brand", "").lower()
        cat_match = query in p.get("category_label", "").lower()
        ing_match = any(query in ing.lower() for ing in p.get("key_ingredients", []))
        
        if name_match or brand_match or cat_match or ing_match:
            results.append(p)
            
    # If local search has few results, search Open Food Facts India in real-time
    if len(results) < 3:
        off_results = await search_openfoodfacts_products(query)
        for off_item in off_results:
            if not any(r["name"].lower() == off_item["name"].lower() for r in results):
                results.append(off_item)
            
    return {"query": q, "count": len(results), "results": results}

@router.get("/product/{product_id}")
async def get_product_by_id(product_id: str):
    """Retrieve full product details, FSSAI score, and clean alternatives."""
    for p in PRODUCTS_CACHE:
        if p["id"] == product_id:
            return p
            
    # Check if barcode in OpenFoodFacts
    if product_id.startswith("off_"):
        barcode = product_id.replace("off_", "")
        off_p = await fetch_product_by_barcode_from_openfoodfacts(barcode)
        if off_p:
            return off_p

    raise HTTPException(status_code=404, detail="Product not found in database")
