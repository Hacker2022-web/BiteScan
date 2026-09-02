import asyncio
import json
import httpx
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "truthin_database.json"

POPULAR_INDIAN_SEARCHES = [
    # Biscuits & Cookies
    "Parle-G", "Britannia Good Day", "Dark Fantasy", "Oreo", "Bourbon", "Hide & Seek", "Marie Gold", "Little Hearts", "Monaco",
    # Instant Foods & Noodles
    "Maggi Masala", "Yippee Noodles", "Top Ramen", "Chings Secret", "Wai Wai", "Knorr Soupy Noodles",
    # Beverages & Drinks
    "Coca Cola", "Thums Up", "Sprite", "Fanta", "Pepsi", "Mountain Dew", "Frooti", "Maaza", "Real Fruit Power", "Paper Boat", "Sting Energy", "Red Bull",
    # Breakfast & Health Drinks
    "Bournvita", "Horlicks", "Complan", "Boost", "Nutella", "Kelloggs Chocos", "Kelloggs Corn Flakes",
    # Chips & Snacks
    "Lays Magic Masala", "Kurkure Masala", "Bingo Mad Angles", "Haldiram Bhujia", "Haldiram Aloo Bhujia", "Too Yumm", "Crax",
    # Chocolates & Sweets
    "Dairy Milk", "KitKat", "5 Star", "Munch", "Perk", "Amul Dark Chocolate",
    # Sauces & Spreads
    "Kissan Ketchup", "Maggi Hot Sweet", "Kissan Jam", "Pintola Peanut Butter",
    # Dairy & Cooking
    "Amul Butter", "Amul Cheese", "Fortune Oil", "Saffola Gold", "Borges Olive Oil"
]

def calculate_health_score(ingredients_text: str, nutriments: dict) -> tuple[float, str, str, list]:
    text_lower = ingredients_text.lower()
    sugar = nutriments.get("sugars_100g", 0.0) or 0.0
    fat = nutriments.get("fat_100g", 0.0) or 0.0
    sodium = (nutriments.get("sodium_100g", 0.0) or 0.0) * 1000

    has_palm_oil = any(k in text_lower for k in ["palm oil", "palmolein", "fractionated palm", "palm fat"])
    
    score = 8.5
    alarms = []

    if has_palm_oil:
        score -= 2.5
        alarms.append({
            "type": "palm_oil",
            "title": "Contains Palm Oil / Palmolein",
            "message": "High in atherogenic saturated fats. Linked to cardiovascular risks."
        })

    if sugar > 30:
        score -= 3.0
        alarms.append({
            "type": "excessive_sugar",
            "title": f"Extreme Sugar ({sugar:.1f}g/100g)",
            "message": "Over 30% of this product is pure sugar."
        })
    elif sugar > 15:
        score -= 1.5
        alarms.append({
            "type": "excessive_sugar",
            "title": f"High Added Sugar ({sugar:.1f}g/100g)",
            "message": "Exceeds recommended healthy snack limits."
        })

    if sodium > 800:
        score -= 1.5
        alarms.append({
            "type": "excess_sodium",
            "title": f"High Sodium ({sodium:.0f}mg/100g)",
            "message": "Exceeds daily sodium intake limits."
        })

    score = max(1.0, min(10.0, round(score, 1)))

    if score >= 8.0:
        label = "Clean & Safe"
        status = "Healthy Choice"
    elif score >= 5.0:
        label = "Moderate"
        status = "Consume in Moderation"
    else:
        label = "Harmful"
        status = "Ultra-Processed"

    return score, label, status, alarms

async def fetch_product_data(search_term: str, client: httpx.AsyncClient):
    url = "https://world.openfoodfacts.org/cgi/search.pl"
    params = {
        "search_terms": search_term,
        "search_simple": 1,
        "action": "process",
        "json": 1,
        "page_size": 2
    }
    headers = {"User-Agent": "BiteScan-DataFetcher/1.0 (contact@bitescan.org)"}
    
    try:
        res = await client.get(url, params=params, headers=headers, timeout=10.0)
        if res.status_code == 200:
            data = res.json()
            products = data.get("products", [])
            for p in products:
                img = p.get("image_url") or p.get("image_front_url")
                name = p.get("product_name") or p.get("product_name_en")
                if img and name and len(name) > 3:
                    ingredients = p.get("ingredients_text_en") or p.get("ingredients_text") or ""
                    nutriments = p.get("nutriments", {})
                    score, label, status, alarms = calculate_health_score(ingredients, nutriments)

                    brand = p.get("brands") or "FMCG Brand"
                    barcode = p.get("code") or "8900000000000"
                    
                    category = "packaged_food"
                    cat_lower = (p.get("categories", "") + " " + name).lower()
                    if "noodle" in cat_lower or "pasta" in cat_lower:
                        category = "instant_foods"
                    elif "biscuit" in cat_lower or "cookie" in cat_lower:
                        category = "biscuits_cookies"
                    elif "drink" in cat_lower or "beverage" in cat_lower or "cola" in cat_lower or "juice" in cat_lower:
                        category = "beverages_juices"
                    elif "chip" in cat_lower or "snack" in cat_lower or "namkeen" in cat_lower:
                        category = "chips_munchies"
                    elif "chocolate" in cat_lower or "spread" in cat_lower:
                        category = "breakfast_spreads"
                    elif "oil" in cat_lower or "ghee" in cat_lower:
                        category = "cooking_oils_ghee"

                    return {
                        "id": f"fmcg_{barcode}",
                        "name": name,
                        "brand": brand,
                        "category": category,
                        "category_label": category.replace("_", " ").title(),
                        "health_score": score,
                        "health_status": status,
                        "score_label": label,
                        "mrp": "₹" + str(p.get("price", "—") if p.get("price") else "20–50"),
                        "barcode": barcode,
                        "image_url": img,
                        "key_ingredients": [i.strip() for i in ingredients.split(",")[:6] if i.strip()] if ingredients else ["Refined Flour", "Sugar", "Edible Vegetable Oil"],
                        "alarms": alarms,
                        "clean_alternatives": []
                    }
    except Exception as e:
        print(f"Error fetching '{search_term}': {e}")
    return None

async def main():
    print(f"Fetching {len(POPULAR_INDIAN_SEARCHES)} popular Indian FMCG products with photos...")
    
    # Load existing database
    existing_products = []
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            existing_products = json.load(f).get("products", [])
    
    existing_barcodes = {p.get("barcode") for p in existing_products}
    new_products = list(existing_products)

    async with httpx.AsyncClient() as client:
        tasks = [fetch_product_data(term, client) for term in POPULAR_INDIAN_SEARCHES]
        results = await asyncio.gather(*tasks)

        for prod in results:
            if prod and prod["barcode"] not in existing_barcodes:
                new_products.append(prod)
                existing_barcodes.add(prod["barcode"])
                print(f"✅ Added: {prod['name']} ({prod['brand']}) - Image: {prod['image_url'][:40]}...")

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump({"products": new_products}, f, indent=2, ensure_ascii=False)

    print(f"\n🎉 Total products in database: {len(new_products)}")

if __name__ == "__main__":
    asyncio.run(main())
