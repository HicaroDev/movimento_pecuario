# Database Schema — Suplemento Control

## PostgreSQL via Supabase

### organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### farms
```sql
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### divisions (retiros)
```sql
CREATE TABLE divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);
```

### pastures (pastos)
```sql
CREATE TABLE pastures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);
```

### supplements
```sql
CREATE TABLE supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mineral', 'energético', 'ração', 'proteinado'))
);
```

### forage_types (forragens)
```sql
CREATE TABLE forage_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);
```

### consumption_records (tabela principal)
```sql
CREATE TABLE consumption_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  farm_id UUID REFERENCES farms(id),
  division_id UUID REFERENCES divisions(id),
  pasture_id UUID REFERENCES pastures(id),
  supplement_id UUID REFERENCES supplements(id),
  forage_type_id UUID REFERENCES forage_types(id),
  closing_date DATE NOT NULL,
  lot_size INTEGER NOT NULL,
  average_weight NUMERIC(8,2),
  days_count INTEGER NOT NULL DEFAULT 30,
  sacks_25kg INTEGER,
  supplement_placed_kg NUMERIC(10,2),
  supplement_left_kg NUMERIC(10,2),
  kg_consumed NUMERIC(10,2),
  consumption_per_head_day NUMERIC(8,4) NOT NULL,
  expected_consumption NUMERIC(8,4),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Row Level Security (RLS)

```sql
-- Users can only see data from their organization
ALTER TABLE consumption_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own org data"
  ON consumption_records FOR SELECT
  USING (org_id = (SELECT org_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users insert own org data"
  ON consumption_records FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users update own org data"
  ON consumption_records FOR UPDATE
  USING (org_id = (SELECT org_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users delete own org data"
  ON consumption_records FOR DELETE
  USING (org_id = (SELECT org_id FROM profiles WHERE user_id = auth.uid()));
```

## Indexes

```sql
CREATE INDEX idx_consumption_org ON consumption_records(org_id);
CREATE INDEX idx_consumption_date ON consumption_records(closing_date);
CREATE INDEX idx_consumption_supplement ON consumption_records(supplement_id);
CREATE INDEX idx_consumption_pasture ON consumption_records(pasture_id);
CREATE INDEX idx_farms_org ON farms(org_id);
CREATE INDEX idx_divisions_farm ON divisions(farm_id);
CREATE INDEX idx_pastures_division ON pastures(division_id);
```

## Seed Data (Fazenda Malhada Grande — Março 2025)

The sample data from the Excel workbook includes:
- **13 pastos** with Energético 0,3% (684 cabeças total, média 0,748)
- **6 pastos** with Mineral Adensado Águas (573 cabeças total, média 0,156)
- **9 pastos** with Ração Creep (400 cabeças total, média 0,370)
