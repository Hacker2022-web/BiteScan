-- =========================================================================
-- BiteScan — Supabase Database Schema
-- SIH26034 / Department of Consumer Affairs Legal Metrology Compliance
-- =========================================================================

-- 1. SCANS TABLE (Stores every citizen & inspector product scan)
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id TEXT NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    product_name TEXT NOT NULL,
    brand TEXT,
    role TEXT NOT NULL DEFAULT 'citizen', -- 'citizen' or 'inspector'
    health_score NUMERIC(3, 1) DEFAULT 0.0,
    violations_count INTEGER DEFAULT 0,
    ocr_data JSONB,
    scale_data JSONB,
    compliance_data JSONB,
    health_data JSONB,
    alternatives JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast scan queries and time-series sorting
CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON public.scans (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scans_role ON public.scans (role);
CREATE INDEX IF NOT EXISTS idx_scans_violations ON public.scans (violations_count);

-- 2. NOTICES TABLE (Stores generated Statutory Show Cause Notices)
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id TEXT NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    product_name TEXT NOT NULL,
    brand TEXT,
    inspector_name TEXT,
    inspector_badge TEXT,
    gps_coordinates TEXT,
    pdf_filename TEXT,
    pdf_download_url TEXT,
    violation_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notices_timestamp ON public.notices (timestamp DESC);

-- 3. CRAWLER_PRODUCTS TABLE (Stores quick-commerce catalog audits)
CREATE TABLE IF NOT EXISTS public.crawler_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    price TEXT,
    is_compliant BOOLEAN DEFAULT TRUE,
    violations_count INTEGER DEFAULT 0,
    violations JSONB,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crawler_compliant ON public.crawler_products (is_compliant);
CREATE INDEX IF NOT EXISTS idx_crawler_barcode ON public.crawler_products (barcode);

-- 4. SCAN_SESSIONS TABLE (Used by frontend Supabase client for inspector telemetry)
CREATE TABLE IF NOT EXISTS public.scan_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'inspector',
    product_name TEXT,
    brand TEXT,
    barcode TEXT,
    image_url TEXT,
    is_lm_compliant BOOLEAN DEFAULT TRUE,
    lm_compliance_score NUMERIC(5, 2) DEFAULT 100.0,
    health_score NUMERIC(3, 1) DEFAULT 10.0,
    health_status TEXT,
    measured_font_height_mm NUMERIC(4, 2),
    required_min_font_height_mm NUMERIC(4, 2),
    ppm_scale NUMERIC(5, 2),
    inspector_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_sessions_created ON public.scan_sessions (created_at DESC);

-- 5. VIOLATIONS TABLE (Specific rule violations attached to scan sessions)
CREATE TABLE IF NOT EXISTS public.violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
    rule_clause TEXT,
    category TEXT DEFAULT 'LEGAL_METROLOGY',
    title TEXT,
    description TEXT,
    severity TEXT DEFAULT 'HIGH',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. HEALTHY_ALTERNATIVES TABLE
CREATE TABLE IF NOT EXISTS public.healthy_alternatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT,
    health_score NUMERIC(3, 1),
    price TEXT,
    target_category TEXT,
    image_url TEXT,
    benefits JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawler_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthy_alternatives ENABLE ROW LEVEL SECURITY;

-- Allow public read and insert for demo/app use
CREATE POLICY "Allow public all on scans" ON public.scans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on notices" ON public.notices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on crawler_products" ON public.crawler_products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on scan_sessions" ON public.scan_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on violations" ON public.violations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on healthy_alternatives" ON public.healthy_alternatives FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Grant access to anon and authenticated roles
GRANT ALL ON TABLE public.scans TO anon, authenticated;
GRANT ALL ON TABLE public.notices TO anon, authenticated;
GRANT ALL ON TABLE public.crawler_products TO anon, authenticated;
GRANT ALL ON TABLE public.scan_sessions TO anon, authenticated;
GRANT ALL ON TABLE public.violations TO anon, authenticated;
GRANT ALL ON TABLE public.healthy_alternatives TO anon, authenticated;
