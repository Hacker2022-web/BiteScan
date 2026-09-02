# 🔍 BiteScan — AI Legal Metrology & Food Safety Compliance Engine

> **Smart India Hackathon (SIH26034)**  
> **Ministry of Consumer Affairs, Food & Public Distribution — Department of Consumer Affairs (DoCA)**  
> Automated Compliance Checking System for *Legal Metrology (Packaged Commodities) Rules, 2011*.

---

## 📌 Problem Overview

Under the **Legal Metrology Act, 2009** and **Packaged Commodities Rules (PCR), 2011**, all packaged commodities sold across India (both in physical retail and e-commerce) must bear mandatory declarations:
- Manufacturer/Packer/Importer details with PIN code
- Standard Net Quantity (`g`, `kg`, `ml`, `l`, `m`, `N`)
- Maximum Retail Price (MRP) with mandatory `(incl. of all taxes)` statement
- Unit Sale Price (USP) for items $>100\text{g/ml}$
- Month & Year of Manufacture/Packing
- Country of Origin & Valid Consumer Care details
- Minimum numeral & font height thresholds (Rule 7, Table 1)

With **1.2+ Crore physical retail stores** and **100M+ e-commerce SKUs** monitored by only **~2,500–3,000 inspectors**, manual physical inspection does not scale. **BiteScan** automates end-to-end scanning, rule validation, font scaling, violation detection, and statutory notice generation in under 2 seconds.

---

## ✨ Key Features

- 📸 **Multi-Source Image & Listing Ingestion**: Scan via mobile camera, shelf photos, or e-commerce catalog URLs.
- 📐 **Pixel-to-Millimeter Font Calibration (Rule 7)**: Calibrates text height using GS1 EAN-13 physical barcode dimensions ($37.29\text{mm} \times 25.91\text{mm}$) to verify statutory millimeter heights without physical gauges.
- ⚡ **Deterministic Legal Metrology Rule Engine**: Enforces Rules 6, 7, 8, 9, 13 and detects non-standard units (e.g. `gms` vs `g`), missing tax statements, omitted dates, and invalid consumer care emails.
- 📄 **1-Click Legal Show Cause Notice Generator**: Generates court-admissible, timestamped PDF violation notices with embedded cropped image evidence (ReportLab).
- ☁️ **Supabase Realtime Cloud Sync**: Real-time persistence of scan records, notices, and inspector audit logs with Row Level Security.
- 🛒 **TruthIn & Open Food Facts Integration**: Analyzes nutritional quality, ultra-processed food alarms (palm oil, high sugar), and suggests clean alternatives.

---

## 🏗️ Architecture & Tech Stack

```
bitescan/
├── frontend/             # React 19 + Tailwind CSS 4 + Vite Web App
│   ├── src/
│   │   ├── components/  # Scanner, Dashboard, TruthIn, Notices UI
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
├── backend/              # FastAPI Python Microservices Server
│   ├── app/
│   │   ├── routers/     # scan, dashboard, notices, crawler, truthin
│   │   ├── services/    # gemini_vision, scale_service, rules_engine,
│   │   │                # supabase_service, pdf_service, health_engine
│   │   ├── data/        # font_rules, alternatives, truthin_database
│   │   ├── config.py
│   │   └── main.py
│   ├── supabase_schema.sql  # Database schema & RLS policies
│   ├── data_collector.py    # Open Food Facts dataset collection tool
│   └── requirements.txt
└── README.md
```

- **Frontend**: React 19, Tailwind CSS 4, Vite, Lucide Icons
- **Backend**: FastAPI, Uvicorn, Pydantic, Python 3.11+
- **Computer Vision & AI**: OpenCV, Multimodal Vision-LLM (Gemini 1.5/2.5 Flash), PaddleOCR
- **Database & Cloud**: Supabase (PostgreSQL + RLS), Realtime
- **Reporting**: ReportLab PDF Engine

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
python3 -m pip install -r requirements.txt
cp .env.example .env
# Fill in your GEMINI_API_KEY and SUPABASE keys in .env
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The app will be accessible at:
- **Web App**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs`

---

## 📄 License & Attribution
Developed for Smart India Hackathon.  
Compliant with the *Legal Metrology Act, 2009* & *Legal Metrology (Packaged Commodities) Rules, 2011*.
