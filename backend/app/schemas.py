from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class Role(str, Enum):
    CITIZEN = "citizen"
    INSPECTOR = "inspector"


class ScanRequest(BaseModel):
    role: Role = Role.CITIZEN
    image_base64: Optional[str] = None
    preset: Optional[str] = None


class ScanResult(BaseModel):
    scan_id: str
    timestamp: str
    role: Role
    ocr_data: dict = {}
    scale_data: Optional[dict] = None
    compliance: Optional[dict] = None
    health: Optional[dict] = None
    alternatives: Optional[list] = None
    notices: Optional[list] = None
    image_url: Optional[str] = None


class CrawlRequest(BaseModel):
    url: str
    scan_id: Optional[str] = None


class CrawlResult(BaseModel):
    crawl_id: str
    url: str
    listed_data: dict = {}
    discrepancies: list = []
    severity: str = "low"


class NoticeGenerateRequest(BaseModel):
    scan_id: str
    violation_details: dict
    inspector_name: str = "Inspector — Consumer Affairs"
    inspector_badge: str = "CA-2024-0001"
    gps_coordinates: Optional[str] = "28.6139°N, 77.2090°E"
    language: str = "bilingual"


class NoticeResult(BaseModel):
    notice_id: str
    pdf_url: str
    generated_at: str
    section: str = "Section 36, Legal Metrology Act, 2009"


class DashboardStats(BaseModel):
    total_scans: int = 0
    violations_found: int = 0
    notices_generated: int = 0
    health_danger: int = 0
    health_safe: int = 0
    avg_health_score: float = 0.0


class HistoryItem(BaseModel):
    scan_id: str
    timestamp: str
    product_name: str = "Unknown"
    health_score: float = 0.0
    violations: int = 0
    role: str = "citizen"
