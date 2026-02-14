
-- Nexus CRM Pro - Database Schema Update

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public categories are viewable by everyone." ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories." ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- 2. Update Leads Table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expiration_date DATE;

-- Populate some default categories
INSERT INTO categories (name, color) VALUES 
('VIP', '#f59e0b'), 
('Mensalidade', '#10b981'), 
('Anual', '#8b5cf6'), 
('Trial', '#94a3b8')
ON CONFLICT (name) DO NOTHING;
