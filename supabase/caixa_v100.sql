-- =====================================================================
-- Livro Caixa — Fase 3C
-- Execute no SQL Editor do Supabase
-- =====================================================================

CREATE TABLE IF NOT EXISTS livro_caixa (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id     uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  tipo        text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria   text NOT NULL,
  descricao   text,
  valor       numeric(12,2) NOT NULL CHECK (valor > 0),
  data        date NOT NULL DEFAULT now(),
  referencia  text,
  origem      text NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual', 'os', 'estoque')),
  os_id       uuid REFERENCES ordens_suplemento(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS livro_caixa_farm_idx  ON livro_caixa(farm_id);
CREATE INDEX IF NOT EXISTS livro_caixa_data_idx  ON livro_caixa(data DESC);
CREATE INDEX IF NOT EXISTS livro_caixa_tipo_idx  ON livro_caixa(tipo);

-- RLS
ALTER TABLE livro_caixa ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_caixa ON livro_caixa
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY client_read_caixa ON livro_caixa
  FOR SELECT USING (
    farm_id IN (
      SELECT unnest(farm_ids) FROM profiles WHERE id = auth.uid()
      UNION SELECT farm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- =====================================================================
-- Verificação
-- =====================================================================
SELECT COUNT(*) AS livro_caixa_linhas FROM livro_caixa;
