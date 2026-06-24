-- =====================================================
-- RedDoorz QSE Dashboard - Database Migration
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: petty_cash
-- =====================================================
CREATE TABLE IF NOT EXISTS petty_cash (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Perbaikan', 'Supplies', 'Transportasi', 'F&B', 'Laundry', 'Lainnya')),
  type TEXT NOT NULL CHECK (type IN ('expense', 'replenishment')),
  amount NUMERIC(15,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: linen_items
-- =====================================================
CREATE TABLE IF NOT EXISTS linen_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Bed Linen', 'Bath Linen', 'F&B Linen')),
  total_stock INT NOT NULL DEFAULT 0,
  in_use INT NOT NULL DEFAULT 0,
  in_laundry INT NOT NULL DEFAULT 0,
  in_storage INT NOT NULL DEFAULT 0,
  damaged INT NOT NULL DEFAULT 0,
  par_level INT NOT NULL DEFAULT 0,
  condition TEXT NOT NULL DEFAULT 'Good' CHECK (condition IN ('Good', 'Fair', 'Poor')),
  last_opname DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: linen_history
-- =====================================================
CREATE TABLE IF NOT EXISTS linen_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  linen_item_id UUID REFERENCES linen_items(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('stock_in', 'stock_out', 'discard', 'opname')),
  quantity INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: inventory_items
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Amenities', 'Cleaning', 'Office', 'Equipment', 'F&B', 'Lainnya')),
  unit TEXT NOT NULL DEFAULT 'pcs',
  current_stock NUMERIC(15,2) NOT NULL DEFAULT 0,
  min_stock NUMERIC(15,2) NOT NULL DEFAULT 0,
  price NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: inventory_history
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('stock_in', 'stock_out')),
  quantity NUMERIC(15,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: improvements
-- =====================================================
CREATE TABLE IF NOT EXISTS improvements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Quality', 'Safety', 'Environment', 'Guest Satisfaction', 'Operational')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Completed', 'Verified')),
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  department TEXT,
  before_condition TEXT,
  after_condition TEXT,
  start_date DATE,
  target_date DATE,
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS: auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER linen_items_updated_at BEFORE UPDATE ON linen_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER improvements_updated_at BEFORE UPDATE ON improvements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Enable untuk semua tabel
-- =====================================================
ALTER TABLE petty_cash ENABLE ROW LEVEL SECURITY;
ALTER TABLE linen_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE linen_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvements ENABLE ROW LEVEL SECURITY;

-- Policy: Allow semua operasi untuk authenticated users
CREATE POLICY "Allow all for authenticated" ON petty_cash FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON linen_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON linen_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON inventory_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON improvements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- SEED DATA (Opsional - hapus jika tidak diperlukan)
-- =====================================================
INSERT INTO linen_items (name, category, total_stock, in_use, in_laundry, in_storage, damaged, par_level, condition) VALUES
('Bath Towel', 'Bath Linen', 120, 80, 25, 12, 3, 90, 'Good'),
('Hand Towel', 'Bath Linen', 100, 65, 20, 13, 2, 80, 'Good'),
('Bedsheet Single', 'Bed Linen', 90, 60, 20, 8, 2, 70, 'Fair'),
('Bedsheet Double', 'Bed Linen', 80, 55, 18, 5, 2, 65, 'Good'),
('Pillowcase', 'Bed Linen', 160, 110, 35, 12, 3, 130, 'Good'),
('Duvet Cover', 'Bed Linen', 70, 48, 15, 5, 2, 60, 'Fair');

INSERT INTO inventory_items (name, category, unit, current_stock, min_stock, price) VALUES
('Sabun Mandi Mini', 'Amenities', 'pcs', 250, 100, 3500),
('Shampo Mini', 'Amenities', 'pcs', 180, 80, 4000),
('Sikat Gigi', 'Amenities', 'pcs', 50, 40, 5000),
('Pasta Gigi Mini', 'Amenities', 'pcs', 75, 40, 4500),
('Toilet Paper', 'Amenities', 'roll', 120, 60, 4000),
('Karbol Lantai', 'Cleaning', 'liter', 15, 10, 25000),
('Pembersih Kaca', 'Cleaning', 'botol', 8, 5, 35000),
('Sarung Tangan Karet', 'Cleaning', 'pasang', 20, 10, 15000);

-- =====================================================
-- DONE! Database siap digunakan.
-- =====================================================
