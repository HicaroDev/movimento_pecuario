-- =====================================================================
-- OS (Ordens de Suplemento) — Fase 3B
-- Execute no SQL Editor do Supabase
-- =====================================================================

-- ── Tabela principal ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ordens_suplemento (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id       uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  numero        text,                      -- ex: OS-2026-001 (auto)
  data_emissao  date NOT NULL DEFAULT now(),
  data_prevista date,
  responsavel   text,
  salgador      text,
  status        text NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente','executada','cancelada')),
  motivo_cancelamento text,
  observacoes   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ── Itens da OS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ordens_suplemento_itens (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id               uuid NOT NULL REFERENCES ordens_suplemento(id) ON DELETE CASCADE,
  pasto_id            uuid REFERENCES pastures(id) ON DELETE SET NULL,
  pasto_nome          text NOT NULL,
  cocho               text,
  suplemento_id       uuid REFERENCES supplement_types(id) ON DELETE SET NULL,
  suplemento_nome     text NOT NULL,
  sacos               numeric(10,2) NOT NULL DEFAULT 0,
  kg                  numeric(10,2),
  quantidade_animais  integer,
  periodo_dias        integer NOT NULL DEFAULT 1,
  executado           boolean NOT NULL DEFAULT false
);

-- ── Índices ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS ordens_suplemento_farm_idx     ON ordens_suplemento(farm_id);
CREATE INDEX IF NOT EXISTS ordens_suplemento_status_idx   ON ordens_suplemento(status);
CREATE INDEX IF NOT EXISTS ordens_suplemento_data_idx     ON ordens_suplemento(data_emissao DESC);
CREATE INDEX IF NOT EXISTS os_itens_os_idx                ON ordens_suplemento_itens(os_id);

-- ── RLS ───────────────────────────────────────────────────────────────
ALTER TABLE ordens_suplemento       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_suplemento_itens ENABLE ROW LEVEL SECURITY;

-- Admin: acesso total
CREATE POLICY admin_all_ordens ON ordens_suplemento
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY admin_all_ordens_itens ON ordens_suplemento_itens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ordens_suplemento os
      JOIN profiles p ON p.id = auth.uid() AND p.role = 'admin'
      WHERE os.id = os_id
    )
  );

-- Cliente: somente leitura na própria fazenda
CREATE POLICY client_read_ordens ON ordens_suplemento
  FOR SELECT USING (
    farm_id IN (
      SELECT unnest(farm_ids) FROM profiles WHERE id = auth.uid()
      UNION SELECT farm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY client_read_ordens_itens ON ordens_suplemento_itens
  FOR SELECT USING (
    os_id IN (
      SELECT id FROM ordens_suplemento WHERE farm_id IN (
        SELECT unnest(farm_ids) FROM profiles WHERE id = auth.uid()
        UNION SELECT farm_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ── Função: numeração automática OS-YYYY-NNN ─────────────────────────
CREATE OR REPLACE FUNCTION generate_os_numero(p_farm_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_year  text := to_char(now(), 'YYYY');
  v_count integer;
BEGIN
  SELECT COUNT(*) + 1
    INTO v_count
    FROM ordens_suplemento
   WHERE farm_id = p_farm_id
     AND to_char(data_emissao, 'YYYY') = v_year;

  RETURN 'OS-' || v_year || '-' || LPAD(v_count::text, 3, '0');
END;
$$;

-- =====================================================================
-- Verificação final
-- =====================================================================
SELECT
  'ordens_suplemento'       AS tabela, COUNT(*) AS linhas FROM ordens_suplemento
UNION ALL
SELECT
  'ordens_suplemento_itens' AS tabela, COUNT(*) AS linhas FROM ordens_suplemento_itens;
