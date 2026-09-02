import json
import re
from pathlib import Path
from ..config import settings

_additives_db = None
_alternatives_db = None


def _load_additives():
    global _additives_db
    if _additives_db is None:
        with open(settings.DATA_DIR / "fssai_additives.json", "r") as f:
            _additives_db = json.load(f)
    return _additives_db


def _load_alternatives():
    global _alternatives_db
    if _alternatives_db is None:
        with open(settings.DATA_DIR / "alternatives.json", "r") as f:
            _alternatives_db = json.load(f)
    return _alternatives_db


def analyze_health(ocr_data: dict) -> dict:
    addons = _load_additives()
    alts_db = _load_alternatives()

    ingredients = ocr_data.get("ingredients", [])
    additives_detected = ocr_data.get("additives", [])
    nutrition = ocr_data.get("nutrition_per_100g", {})
    sugar_rank = ocr_data.get("sugar_rank_in_ingredients", 0)
    has_palm_oil = ocr_data.get("contains_palm_oil", False)

    alerts = []
    score = 10.0

    if has_palm_oil:
        alerts.append({
            "type": "palm_oil",
            "severity": "high",
            "icon": "palmoil",
            "title": "Palm Oil Detected",
            "message": "Contains Palm Oil / Palmolein — high in saturated fat, linked to cardiovascular risks. FSSAI recommends moderation.",
            "ingredient_position": _find_ingredient_position(ingredients, ["palm oil", "palmolein"])
        })
        score -= 2.0

    sugar_alert = _check_sugar(nutrition, sugar_rank)
    if sugar_alert:
        alerts.append(sugar_alert)
        score -= 2.0

    banned_found = _check_banned_additives(additives_detected, addons.get("banned", []))
    for b in banned_found:
        alerts.append({
            "type": "banned_additive",
            "severity": "high",
            "icon": "banned",
            "title": f"Banned/Restricted: {b['code']} ({b['name']})",
            "message": f"FSSAI status: {b['fssai_status']}. Risk: {b['effects']}",
            "code": b["code"]
        })
        score -= 1.5

    restricted_found = _check_restricted_additives(additives_detected, addons.get("restricted", []))
    for r in restricted_found:
        alerts.append({
            "type": "restricted_additive",
            "severity": "medium",
            "icon": "warning",
            "title": f"Restricted: {r['code']} ({r['name']})",
            "message": f"FSSAI status: {r['fssai_status']}. {r['effects']}",
            "code": r["code"]
        })
        score -= 0.5

    excess_sodium = _check_sodium(nutrition)
    if excess_sodium:
        alerts.append(excess_sodium)
        score -= 0.5

    excess_saturated_fat = _check_saturated_fat(nutrition)
    if excess_saturated_fat:
        alerts.append(excess_saturated_fat)
        score -= 0.5

    trans_fat_alert = _check_trans_fat(nutrition)
    if trans_fat_alert:
        alerts.append(trans_fat_alert)
        score -= 1.0

    score = max(1.0, min(10.0, round(score, 1)))

    alternatives = _get_alternatives(ocr_data, alts_db)

    ingredients_clean = _is_ingredients_clean(ingredients, additives_detected, has_palm_oil, sugar_rank)

    return {
        "health_score": score,
        "score_label": _score_label(score),
        "score_color": _score_color(score),
        "alerts": alerts,
        "alert_count": len(alerts),
        "alternatives": alternatives,
        "nutrition_summary": {
            "energy_kcal": nutrition.get("energy_kcal", 0),
            "sugar_g": nutrition.get("sugar_g", 0),
            "fat_g": nutrition.get("fat_g", 0),
            "saturated_fat_g": nutrition.get("saturated_fat_g", 0),
            "trans_fat_g": nutrition.get("trans_fat_g", 0),
            "sodium_mg": nutrition.get("sodium_mg", 0),
            "protein_g": nutrition.get("protein_g", 0),
            "fiber_g": nutrition.get("fiber_g", 0)
        },
        "clean_label": ingredients_clean,
        "palm_oil_detected": has_palm_oil,
        "sugar_rank_in_ingredients": sugar_rank
    }


def _check_sugar(nutrition: dict, sugar_rank: int) -> dict:
    sugar = nutrition.get("sugar_g", 0)

    if sugar_rank > 0 and sugar_rank <= 3:
        return {
            "type": "excessive_sugar",
            "severity": "high",
            "icon": "sugar",
            "title": "High Sugar Content",
            "message": f"Sugar ranks #{sugar_rank} in ingredient list ({sugar}g/100ml). WHO recommends limiting free sugars to <25g/day.",
            "sugar_g_per_100ml": sugar,
            "rank": sugar_rank
        }
    elif sugar > 8:
        return {
            "type": "excessive_sugar",
            "severity": "medium",
            "icon": "sugar",
            "title": "High Sugar Content",
            "message": f"{sugar}g sugar per 100ml — exceeds WHO recommended daily limit.",
            "sugar_g_per_100ml": sugar,
            "rank": sugar_rank
        }
    return None


def _check_sodium(nutrition: dict) -> dict:
    sodium = nutrition.get("sodium_mg", 0)
    if sodium > 800:
        return {
            "type": "excess_sodium",
            "severity": "medium",
            "icon": "salt",
            "title": "Excessive Sodium",
            "message": f"{sodium}mg sodium per 100g. FSSAI recommends <2000mg/day. Excess sodium linked to hypertension.",
            "sodium_mg": sodium
        }
    return None


def _check_saturated_fat(nutrition: dict) -> dict:
    sat_fat = nutrition.get("saturated_fat_g", 0)
    if sat_fat > 5:
        return {
            "type": "excess_saturated_fat",
            "severity": "medium",
            "icon": "fat",
            "title": "High Saturated Fat",
            "message": f"{sat_fat}g saturated fat per 100g. Excess saturated fat linked to cardiovascular disease.",
            "saturated_fat_g": sat_fat
        }
    return None


def _check_trans_fat(nutrition: dict) -> dict:
    trans = nutrition.get("trans_fat_g", 0)
    if trans > 0:
        return {
            "type": "trans_fat",
            "severity": "high",
            "icon": "danger",
            "title": "Trans Fat Detected",
            "message": f"{trans}g trans fat per 100g. FSSAI mandates trans fat < 2% by weight. WHO recommends elimination.",
            "trans_fat_g": trans
        }
    return None


def _check_banned_additives(detected: list, banned: list) -> list:
    found = []
    detected_lower = [d.lower() for d in detected]
    for b in banned:
        code = b.get("code", "").lower()
        if code in detected_lower:
            found.append(b)
    return found


def _check_restricted_additives(detected: list, restricted: list) -> list:
    found = []
    detected_lower = [d.lower() for d in detected]
    for r in restricted:
        code = r.get("code", "").lower()
        if code in detected_lower:
            found.append(r)
    return found


def _find_ingredient_position(ingredients: list, keywords: list) -> int:
    for i, ing in enumerate(ingredients):
        for kw in keywords:
            if kw.lower() in ing.lower():
                return i + 1
    return 0


def _get_alternatives(ocr_data: dict, alts_db: dict) -> list:
    product_name = ocr_data.get("product_name", "").lower()
    has_palm = ocr_data.get("contains_palm_oil", False)
    sugar_rank = ocr_data.get("sugar_rank_in_ingredients", 0)

    alternatives = []

    if has_palm:
        for group in alts_db.get("palm_oil_alternatives", []):
            if _name_match(product_name, group.get("original_product", "")):
                alternatives = group.get("alternatives", [])
                break

    if not alternatives and sugar_rank > 0 and sugar_rank <= 3:
        for group in alts_db.get("sugar_alternatives", []):
            if _name_match(product_name, group.get("original_product", "")):
                alternatives = group.get("alternatives", [])
                break

    if not alternatives:
        for group in alts_db.get("palm_oil_alternatives", []):
            original_ings = [i.lower() for i in group.get("original_ingredients", [])]
            current_ings = [i.lower() for i in ocr_data.get("ingredients", [])]
            overlap = sum(1 for o in original_ings if any(o in c for c in current_ings))
            if overlap >= 2:
                alternatives = group.get("alternatives", [])
                break

    return alternatives[:3]


def _name_match(product: str, target: str) -> bool:
    product_words = set(product.lower().split())
    target_words = set(target.lower().split())
    overlap = product_words & target_words
    return len(overlap) >= 2


def _is_ingredients_clean(ingredients, additives, has_palm, sugar_rank) -> bool:
    if has_palm:
        return False
    if sugar_rank > 0 and sugar_rank <= 2:
        return False
    if len(additives) > 3:
        return False
    for ing in ingredients:
        if any(kw in ing.lower() for kw in ["maltodextrin", "msg", "hydrolysed", "artificial"]):
            return False
    return True


def _score_label(score: float) -> str:
    if score >= 8.0:
        return "Excellent"
    elif score >= 6.5:
        return "Good"
    elif score >= 5.0:
        return "Moderate"
    elif score >= 3.0:
        return "Poor"
    return "Harmful"


def _score_color(score: float) -> str:
    if score >= 8.0:
        return "#5B7038"
    elif score >= 5.0:
        return "#D97706"
    return "#DC2626"
