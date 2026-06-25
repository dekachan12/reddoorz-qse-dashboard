-- =====================================================
-- RedZero - Migration V3
-- Fase 2: Inspeksi, Foto, KPI
-- Jalankan di Supabase SQL Editor
-- =====================================================

-- Pastikan tabel inspections & inspection_items sudah ada
-- (sudah dibuat di migration_v2.sql)

-- Tambah kolom photo_url ke improvement (before/after foto)
ALTER TABLE improvements ADD COLUMN IF NOT EXISTS photo_before TEXT;
ALTER TABLE improvements ADD COLUMN IF NOT EXISTS photo_after TEXT;

-- Tambah kolom notes per item di inspection_items
ALTER TABLE inspection_items ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- TABLE: kpi_targets (target KPI per properti)
CREATE TABLE IF NOT EXISTS kpi_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  target NUMERIC NOT NULL,
  actual NUMERIC DEFAULT 0,
  period TEXT NOT NULL,  -- e.g. '2026-06'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE kpi_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated" ON kpi_targets
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Storage bucket untuk foto (jalankan di Supabase Storage)
-- Buat bucket "redzero-photos" dengan Public access = true

-- RLS untuk inspections (sudah ada di migration_v2 tapi perlu dicek)
DROP POLICY IF EXISTS "Read inspections" ON inspections;
DROP POLICY IF EXISTS "Manage inspections" ON inspections;
CREATE POLICY "Allow all authenticated" ON inspections
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Read inspection_items" ON inspection_items;
DROP POLICY IF EXISTS "Manage inspection_items" ON inspection_items;
CREATE POLICY "Allow all authenticated" ON inspection_items
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verifikasi
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
