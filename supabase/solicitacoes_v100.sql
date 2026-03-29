-- =====================================================================
-- Solicitações de Compra — Fase 3D
-- Execute no SQL Editor do Supabase
-- =====================================================================

CREATE TABLE IF NOT EXISTS solicitacoes_compra (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id             uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  numero              text NOT NULL,
  suplemento_nome     text NOT NULL,
  suplemento_id       uuid REFERENCES supplement_types(id) ON DELETE SET NULL,
  sacos               numeric(10,2) NOT NULL CHECK (sacos > 0),
  kg                  numeric(10,2),
  fornecedor          text,
  observacoes         text,
  status              text NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente', 'aprovada', 'recebida', 'cancelada')),
  motivo_cancelamento text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recebido_at         timestamptz,
  recebido_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS solicitacoes_farm_idx   ON solicitacoes_compra(farm_id);
CREATE INDEX IF NOT EXISTS solicitacoes_status_idx ON solicitacoes_compra(status);

-- RLS
ALTER TABLE solicitacoes_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_solicitacoes ON solicitacoes_compra
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================================
-- Verificação
-- =====================================================================
SELECT COUNT(*) AS solicitacoes_linhas FROM solicitacoes_compra;
