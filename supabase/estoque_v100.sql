-- ============================================================
-- ESTOQUE DE SUPLEMENTOS — v1.0.0
-- Rodar no SQL Editor do Supabase
-- ============================================================

-- 1. Adicionar campos de controle de estoque em supplement_types
ALTER TABLE supplement_types
  ADD COLUMN IF NOT EXISTS estoque_minimo_sacos numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS alerta_reposicao     boolean DEFAULT false;

-- 2. Tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS estoque_movimentos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id             uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  tipo                text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  suplemento_id       uuid REFERENCES supplement_types(id) ON DELETE SET NULL,
  suplemento_nome     text NOT NULL,
  data                date NOT NULL DEFAULT now(),
  sacos               numeric(10,2) NOT NULL DEFAULT 0,
  kg                  numeric(10,2) NOT NULL DEFAULT 0,
  valor_unitario_kg   numeric(10,4),   -- R$/kg (entrada)
  fornecedor          text,
  nota_fiscal         text,
  os_id               uuid,            -- futura ref. OS
  observacoes         text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_estoque_farm    ON estoque_movimentos(farm_id);
CREATE INDEX IF NOT EXISTS idx_estoque_data    ON estoque_movimentos(data DESC);
CREATE INDEX IF NOT EXISTS idx_estoque_tipo    ON estoque_movimentos(tipo);
CREATE INDEX IF NOT EXISTS idx_estoque_supl_id ON estoque_movimentos(suplemento_id);

-- 3. RLS
ALTER TABLE estoque_movimentos ENABLE ROW LEVEL SECURITY;

-- Admin: acesso total
CREATE POLICY "admin_all_estoque" ON estoque_movimentos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Cliente: leitura da própria fazenda
CREATE POLICY "client_read_estoque" ON estoque_movimentos
  FOR SELECT USING (
    farm_id IN (
      SELECT farm_id FROM profiles WHERE profiles.id = auth.uid()
      UNION
      SELECT unnest(farm_ids) FROM profiles WHERE profiles.id = auth.uid()
    )
  );

-- ============================================================
-- VERIFICAÇÃO (rodar depois para confirmar)
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'supplement_types'
-- ORDER BY ordinal_position;
--
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'estoque_movimentos'
-- ORDER BY ordinal_position;
-- ============================================================
