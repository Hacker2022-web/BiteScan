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

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawler_products ENABLE ROW LEVEL SECURITY;

-- Allow public read and insert for demo/app use
CREATE POLICY "Allow public select on scans"
    ON public.scans FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public insert on scans"
    ON public.scans FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow public select on notices"
    ON public.notices FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public insert on notices"
    ON public.notices FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow public select on crawler_products"
    ON public.crawler_products FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public all on crawler_products"
    ON public.crawler_products FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Grant access to anon and authenticated roles
GRANT ALL ON TABLE public.scans TO anon, authenticated;
GRANT ALL ON TABLE public.notices TO anon, authenticated;
GRANT ALL ON TABLE public.crawler_products TO anon, authenticated;
