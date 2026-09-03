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

    mfg_check = _check_manufacturer(ocr_data)
    checks.append(mfg_check)
    if not mfg_check["passed"]:
        violations.append(mfg_check)

    care_check = _check_consumer_care(ocr_data)
    checks.append(care_check)
    if not care_check["passed"]:
        violations.append(care_check)

    usp_check = _check_unit_sale_price(ocr_data)
    checks.append(usp_check)
    if not usp_check["passed"]:
        violations.append(usp_check)

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
    for region in ocr_data.get("detected_text_regions") or []:
        if isinstance(region, dict) and region.get("category") == "mrp":
            mrp_text = str(region.get("text") or "")
            break

    if not mrp_text:
        mrp_text = str(ocr_data.get("mrp_declaration") or "")

    mrp_lower = mrp_text.lower()
    inclusive = "inclusive" in mrp_lower and "tax" in mrp_lower
    has_mrp = "mrp" in mrp_lower or "rp" in mrp_lower or "₹" in mrp_lower or "rs" in mrp_lower

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
    net_qty = str(ocr_data.get("net_quantity") or "").strip()
    illegal_patterns = ["gms", "gms.", "kgs", "kgs.", "ltrs", "ltrs.", "ML.", "MLs", "MLs."]
    found_illegal = [p for p in illegal_patterns if p.lower() in net_qty.lower()]

    has_valid_unit = any(
        net_qty.lower().endswith(u.strip()) for u in ["g", "kg", "ml", "l"]
    ) or re.match(r"^\d+\.?\d*\s*(g|kg|ml|l)$", net_qty, re.IGNORECASE) is not None

    return {
        "rule": "Rule 6(1)(c)",
        "description": "Net quantity must use standard SI units (g, kg, ml, l)",
        "passed": has_valid_unit and len(found_illegal) == 0,
        "severity": "high",
        "found": net_qty if net_qty else "Net quantity not found",
        "expected": "e.g., '70 g', '500 ml', '1 kg'",
        "illegal_units_found": found_illegal,
        "remedy": f"Replace illegal units ({', '.join(found_illegal)}) with SI units" if found_illegal else "Declare quantity with SI units"
    }


def _check_packing_date(ocr_data: dict) -> dict:
    date_found = False
    date_text = ""
    for region in ocr_data.get("detected_text_regions") or []:
        if isinstance(region, dict) and region.get("category") == "date":
            date_text = str(region.get("text") or "")
            date_found = True
            break

    if not date_text:
        date_text = str(ocr_data.get("date_of_packing") or "")
        date_found = bool(date_text)

    date_pattern = r"\d{2}/\d{2}/\d{4}|\d{2}-\d{2}-\d{4}|\d{2}\.\d{2}\.\d{4}"
    valid_format = bool(re.search(date_pattern, date_text)) if date_text else False

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
    for region in ocr_data.get("detected_text_regions") or []:
        if isinstance(region, dict) and region.get("category") == "origin":
            origin = str(region.get("text") or "")
            break

    if not origin:
        origin = str(ocr_data.get("country_of_origin") or "")

    has_origin = bool(origin) and origin.strip().lower() not in ["", "not found", "unknown", "none", "null"]

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

    net_qty_str = str(ocr_data.get("net_quantity") or "0")
    net_qty_g = _parse_net_quantity_to_grams(net_qty_str)
    brackets = rules.get("rule_7", {}).get("schedule_ii", {}).get("brackets") or []

    required_height = 1.0
    for bracket in brackets:
        if bracket.get("net_quantity_min_g", 0) <= net_qty_g <= bracket.get("net_quantity_max_g", 999999):
            required_height = bracket.get("min_height_mm", 1.0)
            break

    violations = []
    for measurement in scale_data.get("measured_font_heights") or []:
        if float(measurement.get("physical_height_mm") or 0) < required_height:
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
            {"text": v.get("text", ""), "measured_mm": v.get("physical_height_mm", 0)}
            for v in violations
        ],
        "remedy": f"Increase numeral font height to at least {required_height}mm"
    }


def _check_net_quantity(ocr_data: dict) -> dict:
    net_qty = str(ocr_data.get("net_quantity") or "").strip()
    has_qty = bool(net_qty) and net_qty.lower() not in ["", "not found", "unknown", "none", "null"]

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
    match = re.match(r"(\d+\.?\d*)\s*(g|kg|ml|l)", str(qty_str or "").lower().strip())
    if not match:
        return 100.0

    try:
        value = float(match.group(1))
        unit = match.group(2)
        if unit in ["kg", "l"]:
            return value * 1000.0
        return value
    except (ValueError, TypeError):
        return 100.0


def _check_manufacturer(ocr_data: dict) -> dict:
    mfg = str(ocr_data.get("manufacturer") or "").strip()
    pincode = str(ocr_data.get("manufacturer_pincode") or "").strip()

    if not pincode and mfg:
        pin_match = re.search(r"\b[1-9][0-9]{5}\b", mfg)
        if pin_match:
            pincode = pin_match.group(0)

    has_mfg = bool(mfg) and len(mfg) > 5 and mfg.lower() not in ["not found", "unknown", "none", "null"]
    has_valid_address = has_mfg and bool(pincode)

    return {
        "rule": "Rule 6(1)(a)",
        "description": "Name and complete address of manufacturer/packer with PIN code",
        "passed": has_valid_address,
        "severity": "high" if not has_mfg else "medium",
        "found": mfg if mfg else "Manufacturer details not found",
        "pincode_found": pincode if pincode else "PIN code missing",
        "expected": "Complete physical address including 6-digit postal PIN code",
        "remedy": "Declare full postal address of manufacturer including valid 6-digit PIN code"
    }


def _check_consumer_care(ocr_data: dict) -> dict:
    cc_text = str(ocr_data.get("customer_care") or "").strip()
    email = str(ocr_data.get("customer_care_email") or "").strip()
    phone = str(ocr_data.get("customer_care_phone") or "").strip()

    if not email and cc_text:
        email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", cc_text)
        if email_match:
            email = email_match.group(0)

    if not phone and cc_text:
        phone_match = re.search(r"(\+91[\-\s]?)?[0]?(91)?[6-9]\d{9}|1800[\-\s]?\d{3}[\-\s]?\d{3,4}", cc_text)
        if phone_match:
            phone = phone_match.group(0)

    has_email = bool(email) and "@" in email
    has_phone = bool(phone) and len(phone) >= 8
    passed = has_email and has_phone

    return {
        "rule": "Rule 6(1)(g)",
        "description": "Consumer care details must include both telephone number and email address",
        "passed": passed,
        "severity": "high" if not (has_email or has_phone) else "medium",
        "found": f"Email: {email or 'MISSING'} | Phone: {phone or 'MISSING'}",
        "email": email,
        "phone": phone,
        "expected": "Contact executive name, phone number, and valid email address",
        "remedy": "Include both valid customer care email address and telephone helpline"
    }


def _check_unit_sale_price(ocr_data: dict) -> dict:
    net_qty_str = str(ocr_data.get("net_quantity") or "0")
    net_qty_g = _parse_net_quantity_to_grams(net_qty_str)
    usp = str(ocr_data.get("unit_sale_price") or "").strip()

    mandatory = net_qty_g > 100.0
    passed = True
    found_desc = usp or "Not declared"

    if mandatory:
        passed = bool(usp) and usp.lower() not in ["null", "none", "not declared", "", "unknown"]
        if not passed:
            found_desc = f"Net Qty {net_qty_str} (>100g) but USP is missing"

    return {
        "rule": "Rule 6(11) [2021 Amendment]",
        "description": "Unit Sale Price (USP) per g/ml mandatory for commodities > 100g or 100ml",
        "passed": passed,
        "severity": "medium",
        "found": found_desc,
        "expected": "e.g., '₹ 0.20 / g' or '₹ 20.00 / 100 g'",
        "remedy": "Declare Unit Sale Price rounded to nearest rupee or paisa per g/ml"
    }
