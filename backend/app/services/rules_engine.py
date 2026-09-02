import json
import re
from pathlib import Path
from ..config import settings

_font_rules = None


def _load_font_rules():
    global _font_rules
    if _font_rules is None:
        with open(settings.DATA_DIR / "font_rules.json", "r") as f:
            _font_rules = json.load(f)
    return _font_rules


def check_compliance(ocr_data: dict, scale_data: dict = None) -> dict:
    rules = _load_font_rules()
    violations = []
    checks = []

    mrp_check = _check_mrp_inclusive(ocr_data)
    checks.append(mrp_check)
    if not mrp_check["passed"]:
        violations.append(mrp_check)

    unit_check = _check_si_units(ocr_data)
    checks.append(unit_check)
    if not unit_check["passed"]:
        violations.append(unit_check)

    date_check = _check_packing_date(ocr_data)
    checks.append(date_check)
    if not date_check["passed"]:
        violations.append(date_check)

    origin_check = _check_country_of_origin(ocr_data)
    checks.append(origin_check)
    if not origin_check["passed"]:
        violations.append(origin_check)

    font_check = _check_font_height(ocr_data, scale_data, rules)
    checks.append(font_check)
    if not font_check["passed"]:
        violations.append(font_check)

    qty_check = _check_net_quantity(ocr_data)
    checks.append(qty_check)
    if not qty_check["passed"]:
        violations.append(qty_check)

    total_checks = len(checks)
    passed_checks = sum(1 for c in checks if c["passed"])

    return {
        "total_checks": total_checks,
        "passed_checks": passed_checks,
        "violations_count": len(violations),
        "compliance_score": round((passed_checks / total_checks) * 100, 1) if total_checks > 0 else 0,
        "checks": checks,
        "violations": violations,
        "overall_status": "COMPLIANT" if len(violations) == 0 else "NON-COMPLIANT"
    }


def _check_mrp_inclusive(ocr_data: dict) -> dict:
    mrp_text = ""
    for region in ocr_data.get("detected_text_regions", []):
        if region.get("category") == "mrp":
            mrp_text = region.get("text", "")
            break

    if not mrp_text:
        mrp_text = ocr_data.get("mrp_declaration", "")

    inclusive = "inclusive" in mrp_text.lower() and "tax" in mrp_text.lower()
    has_mrp = "mrp" in mrp_text.lower() or "rp" in mrp_text.lower()

    return {
        "rule": "Rule 6(1)(e)",
        "description": "MRP must be declared inclusive of all taxes",
        "passed": has_mrp and inclusive,
        "severity": "high" if has_mrp and not inclusive else "medium",
        "found": mrp_text if mrp_text else "MRP declaration not found",
        "expected": "MRP Rs. XX.XX (inclusive of all taxes)",
        "remedy": "Add 'inclusive of all taxes' after MRP declaration"
    }


def _check_si_units(ocr_data: dict) -> dict:
    net_qty = ocr_data.get("net_quantity", "")
    illegal_patterns = ["gms", "gms.", "kgs", "kgs.", "ltrs", "ltrs.", "ML.", "MLs", "MLs."]
    found_illegal = [p for p in illegal_patterns if p.lower() in net_qty.lower()]

    si_patterns = ["g ", "g\n", "kg ", "ml ", "l ", "kg\n", "ml\n", "l\n"]
    has_valid_unit = any(
        net_qty.strip().lower().endswith(u.strip()) for u in ["g", "kg", "ml", "l"]
    ) or re.match(r"^\d+\.?\d*\s*(g|kg|ml|l)$", net_qty.strip(), re.IGNORECASE) is not None

    return {
        "rule": "Rule 6(1)(c)",
        "description": "Net quantity must use standard SI units (g, kg, ml, l)",
        "passed": has_valid_unit and len(found_illegal) == 0,
        "severity": "high",
        "found": net_qty,
        "expected": "e.g., '70 g', '500 ml', '1 kg'",
        "illegal_units_found": found_illegal,
        "remedy": f"Replace illegal units ({', '.join(found_illegal)}) with SI units"
    }


def _check_packing_date(ocr_data: dict) -> dict:
    date_found = False
    date_text = ""
    for region in ocr_data.get("detected_text_regions", []):
        if region.get("category") == "date":
            date_text = region.get("text", "")
            date_found = True
            break

    if not date_text:
        date_text = ocr_data.get("date_of_packing", "")
        date_found = bool(date_text)

    date_pattern = r"\d{2}/\d{2}/\d{4}|\d{2}-\d{2}-\d{4}|\d{2}\.\d{2}\.\d{4}"
    valid_format = bool(re.match(date_pattern, date_text)) if date_text else False

    return {
        "rule": "Rule 6(1)(d)",
        "description": "Date of manufacturing/packing must be clearly declared",
        "passed": date_found and valid_format,
        "severity": "medium",
        "found": date_text if date_text else "Date not found",
        "expected": "DD/MM/YYYY or DD-MM-YYYY format",
        "remedy": "Declare date of packing in DD/MM/YYYY format"
    }


def _check_country_of_origin(ocr_data: dict) -> dict:
    origin = ""
    for region in ocr_data.get("detected_text_regions", []):
        if region.get("category") == "origin":
            origin = region.get("text", "")
            break

    if not origin:
        origin = ocr_data.get("country_of_origin", "")

    has_origin = bool(origin) and origin.lower() not in ["", "not found", "unknown"]

    return {
        "rule": "Rule 6(1)(da)",
        "description": "Country of origin must be declared",
        "passed": has_origin,
        "severity": "medium",
        "found": origin if origin else "Country of origin not declared",
        "expected": "Country of origin: [Country Name]",
        "remedy": "Declare country of origin on the label"
    }


def _check_font_height(ocr_data: dict, scale_data: dict, rules: dict) -> dict:
    if not scale_data or not scale_data.get("measured_font_heights"):
        return {
            "rule": "Rule 7 (Schedule II)",
            "description": "Minimum font height for numerals based on net quantity",
            "passed": True,
            "severity": "low",
            "found": "No scale data available — visual inspection recommended",
            "expected": "Varies by net quantity (1mm to 6mm)",
            "remedy": "Use barcode calibration to measure font height"
        }

    net_qty_str = ocr_data.get("net_quantity", "0")
    net_qty_g = _parse_net_quantity_to_grams(net_qty_str)
    brackets = rules.get("rule_7", {}).get("schedule_ii", {}).get("brackets", [])

    required_height = 1.0
    for bracket in brackets:
        if bracket["net_quantity_min_g"] <= net_qty_g <= bracket["net_quantity_max_g"]:
            required_height = bracket["min_height_mm"]
            break

    violations = []
    for measurement in scale_data["measured_font_heights"]:
        if measurement["physical_height_mm"] < required_height:
            violations.append(measurement)

    all_pass = len(violations) == 0

    return {
        "rule": "Rule 7 (Schedule II)",
        "description": f"Minimum font height ≥ {required_height}mm for {net_qty_str} net quantity",
        "passed": all_pass,
        "severity": "high" if not all_pass else "low",
        "found": f"{len(violations)} regions below {required_height}mm" if violations else "All fonts comply",
        "expected": f"Minimum {required_height}mm numeral height",
        "required_height_mm": required_height,
        "violations": [
            {"text": v["text"], "measured_mm": v["physical_height_mm"]}
            for v in violations
        ],
        "remedy": f"Increase numeral font height to at least {required_height}mm"
    }


def _check_net_quantity(ocr_data: dict) -> dict:
    net_qty = ocr_data.get("net_quantity", "")
    has_qty = bool(net_qty) and net_qty.lower() not in ["", "not found", "unknown"]

    return {
        "rule": "Rule 6(1)(b)",
        "description": "Net quantity must be clearly declared",
        "passed": has_qty,
        "severity": "high",
        "found": net_qty if net_qty else "Net quantity not declared",
        "expected": "e.g., '70 g', '500 ml'",
        "remedy": "Declare net quantity in SI units"
    }


def _parse_net_quantity_to_grams(qty_str: str) -> float:
    match = re.match(r"(\d+\.?\d*)\s*(g|kg|ml|l)", qty_str.lower().strip())
    if not match:
        return 100.0

    value = float(match.group(1))
    unit = match.group(2)

    if unit == "kg":
        return value * 1000
    elif unit == "l":
        return value * 1000
    elif unit == "ml":
        return value
    return value
