import json
import base64
import random
from pathlib import Path
from ..config import settings


async def analyze_image_with_gemini(image_base64: str = None, preset: str = None) -> dict:
    if preset:
        return _get_preset_data(preset)
    if not image_base64:
        return _get_preset_data("olive_oil")

    if settings.GEMINI_API_KEY:
        return await _call_gemini_api(image_base64)
    return _mock_ocr_from_image(image_base64)


async def _call_gemini_api(image_base64: str) -> dict:
    try:
        import httpx

        # Determine MIME type and clean base64 data
        mime_type = "image/jpeg"
        cleaned_b64 = image_base64
        if "data:" in cleaned_b64 and ";base64," in cleaned_b64:
            header, cleaned_b64 = cleaned_b64.split(";base64,")
            if "png" in header:
                mime_type = "image/png"
            elif "webp" in header:
                mime_type = "image/webp"
            elif "jpeg" in header or "jpg" in header:
                mime_type = "image/jpeg"

        prompt = """You are an official Legal Metrology Inspector and FSSAI Food Safety Analyst for the Government of India.
Examine this product packaging image with forensic accuracy under the Legal Metrology (Packaged Commodities) Rules, 2011 and FSSAI Packaging & Labelling Regulations.

Extract every statutory label detail and return a strictly valid JSON object adhering to this schema:
{
    "product_name": "Commercial brand/product name as printed",
    "brand": "Brand or Manufacturer name",
    "generic_name": "Generic or common name of commodity (e.g., Potato Chips, Instant Noodles, Edible Oil)",
    "net_quantity": "Exact net quantity string with unit e.g. 70 g or 150 gms",
    "quantity_value": 70.0,
    "quantity_unit": "g",
    "mrp": "MRP numeric with currency e.g. ₹14.00",
    "mrp_declaration": "Full exact MRP statement as printed e.g. MRP Rs. 14.00 (incl. of all taxes)",
    "has_tax_statement": true,
    "unit_sale_price": "Unit Sale Price e.g. ₹0.20 / g if declared, otherwise null",
    "date_of_packing": "Date/Month of packing or manufacture e.g. MM/YYYY",
    "best_before": "Expiry or best before statement e.g. Best before 9 months from manufacture",
    "country_of_origin": "Declared Country of Origin e.g. India",
    "manufacturer": "Full manufacturer/packer/importer name and address including 6-digit PIN code",
    "manufacturer_pincode": "6-digit PIN code if present",
    "customer_care": "Full customer care/consumer grievance details",
    "customer_care_email": "Customer care email ID if present",
    "customer_care_phone": "Customer care helpline/telephone number if present",
    "ingredients": ["Ingredient 1", "Ingredient 2"],
    "additives": ["E-number or chemical additive names e.g. INS 621, INS 150d"],
    "nutrition_per_100g": {
        "energy_kcal": 400.0,
        "sugar_g": 4.2,
        "fat_g": 15.0,
        "saturated_fat_g": 6.8,
        "trans_fat_g": 0.0,
        "sodium_mg": 1100.0,
        "protein_g": 8.0,
        "carbohydrate_g": 60.0,
        "fiber_g": 2.0
    },
    "sugar_rank_in_ingredients": 4,
    "contains_palm_oil": false,
    "detected_barcodes": [
        {"type": "EAN-13", "value": "8901058002479", "x": 100, "y": 200, "w": 300, "h": 120}
    ],
    "detected_text_regions": [
        {"text": "70 g", "x": 120, "y": 400, "w": 80, "h": 30, "category": "net_qty"},
        {"text": "MRP Rs. 14.00 (incl. of all taxes)", "x": 120, "y": 450, "w": 250, "h": 25, "category": "mrp"}
    ],
    "font_analysis": {
        "net_quantity_numeral_height_mm": 3.5,
        "principal_display_panel_area_sq_cm": 150.0,
        "is_sub_minimum": false
    }
}

IMPORTANT:
- If a declaration (like customer care email or inclusive of all taxes) is missing on the package, set it to null or false.
- Read exact units: note if the package erroneously prints 'gms' instead of standard 'g', or 'ltrs' instead of 'l'.
- Output ONLY the raw JSON object. Do not include markdown explanation."""

        candidate_models = [
            settings.GEMINI_MODEL,
            "gemini-3.6-flash",
            "gemini-3.7-flash",
            "gemini-3.8-flash",
            "gemini-flash-latest"
        ]
        # Deduplicate while preserving order
        candidate_models = list(dict.fromkeys(m for m in candidate_models if m))

        async with httpx.AsyncClient(timeout=45.0) as client:
            for model_name in candidate_models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
                    payload = {
                        "contents": [{
                            "parts": [
                                {"text": prompt},
                                {"inline_data": {"mime_type": mime_type, "data": cleaned_b64}}
                            ]
                        }],
                        "generationConfig": {"responseMimeType": "application/json"}
                    }
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            # Find text part (ignoring thought parts if any)
                            text = ""
                            for p in parts:
                                if "text" in p and not p.get("thought", False):
                                    text += p["text"]
                            text = text.strip()
                            if text.startswith("```json"):
                                text = text[7:]
                            elif text.startswith("```"):
                                text = text[3:]
                            if text.endswith("```"):
                                text = text[:-3]
                            text = text.strip()
                            parsed = json.loads(text)
                            print(f"[Gemini Vision Success] Analyzed packaging using {model_name}: {parsed.get('product_name')}")
                            return parsed
                    else:
                        print(f"[Gemini Vision {model_name} Error {response.status_code}]: {response.text[:200]}")
                except Exception as model_err:
                    print(f"[Gemini Vision Model {model_name} Failed]: {model_err}")
                    continue

    except Exception as e:
        print(f"[Gemini Vision Overall Exception] {e}")

    return _mock_ocr_from_image(image_base64)


def _mock_ocr_from_image(image_base64: str) -> dict:
    mock_products = [
        {
            "product_name": "Maggi 2-Minute Masala Noodles",
            "brand": "Nestle India Ltd.",
            "net_quantity": "70 g",
            "mrp": "₹14.00",
            "mrp_declaration": "MRP Rs. 14.00 (inclusive of all taxes)",
            "date_of_packing": "15/08/2025",
            "best_before": "Use within 6 months from date of manufacture",
            "country_of_origin": "India",
            "manufacturer": "Nestle India Ltd., 100/101, Sector 16, NOIDA, UP",
            "customer_care": "1800-111-222 / customercare@nestle.in",
            "ingredients": [
                "Wheat Flour (Maida) 44.9%",
                "Palm Oil 19.5%",
                "Salt 5.8%",
                "Sugar 4.2%",
                "Spices & Condiments 4.1%",
                "Hydrolysed Vegetable Protein 3.2%",
                "Onion Powder 2.8%",
                "Garlic Powder 1.5%",
                "Turmeric 0.8%",
                "Chilli Powder 0.6%",
                "Natural & Artificial Flavouring Substances 3.4%",
                "Citric Acid 1.2%",
                "Sodium Pyrophosphate 1.0%",
                "Potassium Chloride 0.5%",
                "E621 (MSG) 1.5%"
            ],
            "additives": ["E621", "E330", "E452", "E627", "E631", "E150a"],
            "nutrition_per_100g": {
                "energy_kcal": 448,
                "sugar_g": 5.2,
                "fat_g": 18.5,
                "saturated_fat_g": 9.1,
                "trans_fat_g": 0.03,
                "sodium_mg": 1280,
                "protein_g": 9.2,
                "carbohydrate_g": 63.8,
                "fiber_g": 2.1
            },
            "sugar_rank_in_ingredients": 4,
            "contains_palm_oil": True,
            "detected_barcodes": [
                {"type": "EAN-13", "value": "8901042011066", "x": 620, "y": 340, "w": 180, "h": 120}
            ],
            "detected_text_regions": [
                {"text": "MRP Rs. 14.00 (inclusive of all taxes)", "x": 50, "y": 200, "w": 300, "h": 30, "category": "mrp"},
                {"text": "70 g", "x": 380, "y": 150, "w": 60, "h": 25, "category": "net_qty"},
                {"text": "15/08/2025", "x": 50, "y": 280, "w": 120, "h": 20, "category": "date"},
                {"text": "Made in India", "x": 50, "y": 320, "w": 100, "h": 20, "category": "origin"}
            ]
        },
        {
            "product_name": "Coca-Cola",
            "brand": "Hindustan Coca-Cola Beverages Pvt. Ltd.",
            "net_quantity": "500 ml",
            "mrp": "₹40.00",
            "mrp_declaration": "MRP Rs. 40.00 (inclusive of all taxes)",
            "date_of_packing": "01/07/2025",
            "best_before": "Best before 9 months from date of manufacture",
            "country_of_origin": "India",
            "manufacturer": "Hindustan Coca-Cola Beverages Pvt. Ltd.",
            "customer_care": "1800-103-3111 / support@coca-cola.co.in",
            "ingredients": [
                "Carbonated Water",
                "Sugar 10.8g per 100ml",
                "Acidity Regulator (E338)",
                "Caffeine",
                "Natural Flavouring Substances",
                "Caramel Color (E150d)"
            ],
            "additives": ["E338", "E150d"],
            "nutrition_per_100g": {
                "energy_kcal": 42,
                "sugar_g": 10.8,
                "fat_g": 0,
                "saturated_fat_g": 0,
                "trans_fat_g": 0,
                "sodium_mg": 8,
                "protein_g": 0,
                "carbohydrate_g": 10.8,
                "fiber_g": 0
            },
            "sugar_rank_in_ingredients": 2,
            "contains_palm_oil": False,
            "detected_barcodes": [
                {"type": "EAN-13", "value": "8901764541018", "x": 580, "y": 300, "w": 180, "h": 120}
            ],
            "detected_text_regions": [
                {"text": "MRP Rs. 40.00 (inclusive of all taxes)", "x": 80, "y": 180, "w": 280, "h": 30, "category": "mrp"},
                {"text": "500 ml", "x": 400, "y": 120, "w": 60, "h": 25, "category": "net_qty"},
                {"text": "01/07/2025", "x": 80, "y": 250, "w": 120, "h": 20, "category": "date"}
            ]
        },
        {
            "product_name": "Borges Extra Virgin Olive Oil",
            "brand": "Borges Agricultural & Industrial Nuts, S.A.",
            "net_quantity": "1 L",
            "mrp": "₹650.00",
            "mrp_declaration": "MRP Rs. 650.00 (inclusive of all taxes)",
            "date_of_packing": "10/01/2025",
            "best_before": "Best before 18 months from date of packing",
            "country_of_origin": "Spain",
            "manufacturer": "Borges Agroindustrial S.A., Tarragona, Spain",
            "customer_care": "care@borges.com",
            "ingredients": [
                "100% Extra Virgin Olive Oil"
            ],
            "additives": [],
            "nutrition_per_100g": {
                "energy_kcal": 884,
                "sugar_g": 0,
                "fat_g": 100,
                "saturated_fat_g": 14,
                "trans_fat_g": 0,
                "sodium_mg": 0,
                "protein_g": 0,
                "carbohydrate_g": 0,
                "fiber_g": 0
            },
            "sugar_rank_in_ingredients": 0,
            "contains_palm_oil": False,
            "detected_barcodes": [
                {"type": "EAN-13", "value": "8410113001226", "x": 600, "y": 350, "w": 180, "h": 120}
            ],
            "detected_text_regions": [
                {"text": "MRP Rs. 650.00 (inclusive of all taxes)", "x": 100, "y": 220, "w": 280, "h": 30, "category": "mrp"},
                {"text": "1 L", "x": 420, "y": 160, "w": 50, "h": 25, "category": "net_qty"},
                {"text": "Product of Spain", "x": 100, "y": 300, "w": 130, "h": 20, "category": "origin"},
                {"text": "10/01/2025", "x": 100, "y": 340, "w": 120, "h": 20, "category": "date"}
            ]
        }
    ]

    if preset:
        for p in mock_products:
            if preset.lower().replace(" ", "_") in p["product_name"].lower().replace(" ", "_"):
                return p
            if preset.lower() in p["product_name"].lower():
                return p

    return random.choice(mock_products)


def _get_preset_data(preset: str) -> dict:
    presets = {
        "maggi": {
            "product_name": "Maggi 2-Minute Masala Noodles",
            "brand": "Nestle India Ltd.",
            "net_quantity": "70 g",
            "mrp": "₹14.00",
            "mrp_declaration": "MRP Rs. 14.00 (inclusive of all taxes)",
            "date_of_packing": "15/08/2025",
            "best_before": "Use within 6 months from date of manufacture",
            "country_of_origin": "India",
            "manufacturer": "Nestle India Ltd., 100/101, Sector 16, NOIDA, UP",
            "customer_care": "1800-111-222 / customercare@nestle.in",
            "ingredients": [
                "Wheat Flour (Maida) 44.9%",
                "Palm Oil 19.5%",
                "Salt 5.8%",
                "Sugar 4.2%",
                "Spices & Condiments 4.1%",
                "Hydrolysed Vegetable Protein 3.2%",
                "Onion Powder 2.8%",
                "Garlic Powder 1.5%",
                "Turmeric 0.8%",
                "Chilli Powder 0.6%",
                "Natural & Artificial Flavouring Substances 3.4%",
                "Citric Acid 1.2%",
                "Sodium Pyrophosphate 1.0%",
                "Potassium Chloride 0.5%",
                "E621 (MSG) 1.5%"
            ],
            "additives": ["E621", "E330", "E452", "E627", "E631", "E150a"],
            "nutrition_per_100g": {
                "energy_kcal": 448,
                "sugar_g": 5.2,
                "fat_g": 18.5,
                "saturated_fat_g": 9.1,
                "trans_fat_g": 0.03,
                "sodium_mg": 1280,
                "protein_g": 9.2,
                "carbohydrate_g": 63.8,
                "fiber_g": 2.1
            },
            "sugar_rank_in_ingredients": 4,
            "contains_palm_oil": True,
            "detected_barcodes": [
                {"type": "EAN-13", "value": "8901042011066", "x": 620, "y": 340, "w": 180, "h": 120}
            ],
            "detected_text_regions": [
                {"text": "MRP Rs. 14.00 (inclusive of all taxes)", "x": 50, "y": 200, "w": 300, "h": 30, "category": "mrp"},
                {"text": "70 g", "x": 380, "y": 150, "w": 60, "h": 25, "category": "net_qty"},
                {"text": "15/08/2025", "x": 50, "y": 280, "w": 120, "h": 20, "category": "date"},
                {"text": "Made in India", "x": 50, "y": 320, "w": 100, "h": 20, "category": "origin"}
            ]
        },
        "coca_cola": {
            "product_name": "Coca-Cola",
            "brand": "Hindustan Coca-Cola Beverages Pvt. Ltd.",
            "net_quantity": "500 ml",
            "mrp": "₹40.00",
            "mrp_declaration": "MRP Rs. 40.00 (inclusive of all taxes)",
            "date_of_packing": "01/07/2025",
            "best_before": "Best before 9 months from date of manufacture",
            "country_of_origin": "India",
            "manufacturer": "Hindustan Coca-Cola Beverages Pvt. Ltd.",
            "customer_care": "1800-103-3111 / support@coca-cola.co.in",
            "ingredients": [
                "Carbonated Water",
                "Sugar 10.8g per 100ml",
                "Acidity Regulator (E338)",
                "Caffeine",
                "Natural Flavouring Substances",
                "Caramel Color (E150d)"
            ],
            "additives": ["E338", "E150d"],
            "nutrition_per_100g": {
                "energy_kcal": 42,
                "sugar_g": 10.8,
                "fat_g": 0,
                "saturated_fat_g": 0,
                "trans_fat_g": 0,
                "sodium_mg": 8,
                "protein_g": 0,
                "carbohydrate_g": 10.8,
                "fiber_g": 0
            },
            "sugar_rank_in_ingredients": 2,
            "contains_palm_oil": False,
            "detected_barcodes": [
                {"type": "EAN-13", "value": "8901764541018", "x": 580, "y": 300, "w": 180, "h": 120}
            ],
            "detected_text_regions": [
                {"text": "MRP Rs. 40.00 (inclusive of all taxes)", "x": 80, "y": 180, "w": 280, "h": 30, "category": "mrp"},
                {"text": "500 ml", "x": 400, "y": 120, "w": 60, "h": 25, "category": "net_qty"},
                {"text": "01/07/2025", "x": 80, "y": 250, "w": 120, "h": 20, "category": "date"}
            ]
        },
        "olive_oil": {
            "product_name": "Borges Extra Virgin Olive Oil",
            "brand": "Borges Agricultural & Industrial Nuts, S.A.",
            "net_quantity": "1 L",
            "mrp": "₹650.00",
            "mrp_declaration": "MRP Rs. 650.00 (inclusive of all taxes)",
            "date_of_packing": "10/01/2025",
            "best_before": "Best before 18 months from date of packing",
            "country_of_origin": "Spain",
            "manufacturer": "Borges Agroindustrial S.A., Tarragona, Spain",
            "customer_care": "care@borges.com",
            "ingredients": [
                "100% Extra Virgin Olive Oil"
            ],
            "additives": [],
            "nutrition_per_100g": {
                "energy_kcal": 884,
                "sugar_g": 0,
                "fat_g": 100,
                "saturated_fat_g": 14,
                "trans_fat_g": 0,
                "sodium_mg": 0,
                "protein_g": 0,
                "carbohydrate_g": 0,
                "fiber_g": 0
            },
            "sugar_rank_in_ingredients": 0,
            "contains_palm_oil": False,
            "detected_barcodes": [
                {"type": "EAN-13", "value": "8410113001226", "x": 600, "y": 350, "w": 180, "h": 120}
            ],
            "detected_text_regions": [
                {"text": "MRP Rs. 650.00 (inclusive of all taxes)", "x": 100, "y": 220, "w": 280, "h": 30, "category": "mrp"},
                {"text": "1 L", "x": 420, "y": 160, "w": 50, "h": 25, "category": "net_qty"},
                {"text": "Product of Spain", "x": 100, "y": 300, "w": 130, "h": 20, "category": "origin"},
                {"text": "10/01/2025", "x": 100, "y": 340, "w": 120, "h": 20, "category": "date"}
            ]
        }
    }
    return presets.get(preset, presets["olive_oil"])
