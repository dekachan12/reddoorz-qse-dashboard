-- =====================================================
-- RedDoorz QSE Dashboard - Migration V2
-- Multi-Property + Role Access
-- Jalankan di Supabase SQL Editor
-- =====================================================

-- =====================================================
-- TABLE: properties (127 properti)
-- =====================================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,         -- e.g. RDZ-MDN-001
  name TEXT NOT NULL,                -- Nama properti
  brand TEXT NOT NULL DEFAULT 'RedDoorz' CHECK (brand IN ('RedDoorz', 'Sans Hotel', 'Zo Rooms', 'Nite Jolie')),
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('Sumatera', 'Jawa', 'Kalimantan', 'Sulawesi', 'Bali & Nusa Tenggara', 'Papua & Maluku')),
  address TEXT,
  pic_name TEXT,                     -- Nama PIC properti
  pic_phone TEXT,
  total_rooms INT DEFAULT 0,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Renovation')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: user_profiles (role management)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'ops' CHECK (role IN ('admin', 'qse', 'ops', 'maintenance', 'manager')),
  property_id UUID REFERENCES properties(id),  -- NULL = akses semua
  region TEXT,                                  -- Filter per region
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ALTER existing tables: tambah property_id
-- =====================================================
ALTER TABLE petty_cash      ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id);
ALTER TABLE linen_items     ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id);
ALTER TABLE improvements    ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id);

-- =====================================================
-- TABLE: inspections
-- =====================================================
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL,
  inspector_name TEXT NOT NULL,
  overall_score NUMERIC(5,2),
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Reviewed', 'Closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: inspection_items (checklist)
-- =====================================================
CREATE TABLE IF NOT EXISTS inspection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  category TEXT NOT NULL,     -- Kamar, Lobby, Kamar Mandi, Area Umum, dll
  item TEXT NOT NULL,         -- Nama item yang dicek
  status TEXT NOT NULL CHECK (status IN ('Comply', 'Non-Comply', 'N/A')),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RLS POLICIES: user_profiles
-- =====================================================
ALTER TABLE properties       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;

-- Properties: semua authenticated bisa lihat
CREATE POLICY "Read properties" ON properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage properties" ON properties FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','qse')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','qse')));

-- User profiles: bisa lihat profile sendiri, admin bisa lihat semua
CREATE POLICY "Read own profile" ON user_profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admin read all profiles" ON user_profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','qse')));
CREATE POLICY "Insert own profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Update own profile" ON user_profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Inspections
CREATE POLICY "Read inspections" ON inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage inspections" ON inspections FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','qse')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','qse')));

CREATE POLICY "Read inspection_items" ON inspection_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage inspection_items" ON inspection_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','qse')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','qse')));

-- Trigger updated_at
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER inspections_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SEED: Sample properties (bisa diedit/ditambah)
-- =====================================================
INSERT INTO properties (code, name, brand, city, province, region, pic_name, total_rooms, status) VALUES
('RDZ-MDN-001', 'RedDoorz Medan Petisah', 'RedDoorz', 'Medan', 'Sumatera Utara', 'Sumatera', 'Budi Santoso', 24, 'Active'),
('RDZ-MDN-002', 'RedDoorz Medan Polonia', 'RedDoorz', 'Medan', 'Sumatera Utara', 'Sumatera', 'Andi Wijaya', 18, 'Active'),
('RDZ-MDN-003', 'RedDoorz Medan Helvetia', 'RedDoorz', 'Medan', 'Sumatera Utara', 'Sumatera', 'Sari Dewi', 20, 'Active'),
('SNS-MDN-001', 'Sans Hotel Finest Medan', 'Sans Hotel', 'Medan', 'Sumatera Utara', 'Sumatera', 'Rini Kusuma', 40, 'Active'),
('RDZ-SBY-001', 'RedDoorz Surabaya Gubeng', 'RedDoorz', 'Surabaya', 'Jawa Timur', 'Jawa', 'Hendra Putra', 22, 'Active'),
('RDZ-JKT-001', 'RedDoorz Jakarta Selatan', 'RedDoorz', 'Jakarta', 'DKI Jakarta', 'Jawa', 'Dewi Lestari', 30, 'Active'),
('RDZ-BDG-001', 'RedDoorz Bandung Dago', 'RedDoorz', 'Bandung', 'Jawa Barat', 'Jawa', 'Fajar Nugroho', 26, 'Active'),
('RDZ-MKS-001', 'RedDoorz Makassar Panakkukang', 'RedDoorz', 'Makassar', 'Sulawesi Selatan', 'Sulawesi', 'Irwan Baso', 20, 'Active'),
('RDZ-DPS-001', 'RedDoorz Denpasar Kuta', 'RedDoorz', 'Denpasar', 'Bali', 'Bali & Nusa Tenggara', 'Ni Made Ayu', 28, 'Active'),
('RDZ-PLB-001', 'RedDoorz Palembang Ilir', 'RedDoorz', 'Palembang', 'Sumatera Selatan', 'Sumatera', 'Rizky Amalia', 22, 'Active')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- DONE! V2 Migration selesai.
-- =====================================================
