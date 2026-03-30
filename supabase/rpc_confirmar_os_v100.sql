-- =====================================================================
-- RPC: confirmar_execucao_os — Fase 3B correção R-02
-- Substitui os 5 inserts sequenciais do osService.ts por uma
-- transação atômica: se qualquer passo falhar → rollback total.
--
-- Execute no SQL Editor do Supabase APÓS rls_auditoria_v200.sql
-- =====================================================================

CREATE OR REPLACE FUNCTION public.confirmar_execucao_os(
  p_os_id      uuid,
  p_farm_id    uuid,
  p_user_id    uuid,
  p_data_exec  date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_os              RECORD;
  v_item            RECORD;
  v_supl            RECORD;
  v_valor_kg        numeric;
  v_peso_saco       numeric;
  v_kg_calc         numeric;
  v_valor_total     numeric;
  v_caixa_count     integer := 0;
  v_estoque_count   integer := 0;
  v_entries_count   integer := 0;
BEGIN

  -- ── Validações ──────────────────────────────────────────────────────
  SELECT * INTO v_os
    FROM ordens_suplemento
   WHERE id = p_os_id
     AND farm_id = p_farm_id
     AND status = 'pendente'
  FOR UPDATE;  -- lock pessimista: evita execução dupla simultânea

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'OS não encontrada, não pertence à fazenda, ou não está pendente'
    );
  END IF;

  -- Valida que o usuário pertence à fazenda ou é admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
     WHERE id = p_user_id
       AND (
         role = 'admin'
         OR farm_id = p_farm_id
         OR p_farm_id = ANY(COALESCE(farm_ids, ARRAY[]::uuid[]))
       )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuário sem permissão para esta fazenda');
  END IF;

  -- ── Processa cada item ───────────────────────────────────────────────
  FOR v_item IN
    SELECT * FROM ordens_suplemento_itens
     WHERE os_id = p_os_id
  LOOP
    v_kg_calc := COALESCE(v_item.kg, v_item.sacos * 25);

    -- 1. Saída no estoque (obrigatório — falha aborta tudo)
    INSERT INTO estoque_movimentos (
      farm_id, tipo, suplemento_id, suplemento_nome,
      data, sacos, kg, os_id, observacoes, created_by
    ) VALUES (
      p_farm_id,
      'saida',
      v_item.suplemento_id,
      v_item.suplemento_nome,
      p_data_exec,
      v_item.sacos,
      v_kg_calc,
      p_os_id,
      'OS ' || COALESCE(v_os.numero, p_os_id::text) || ' — ' || v_item.pasto_nome,
      p_user_id
    );
    v_estoque_count := v_estoque_count + 1;

    -- 2. Lançamento em data_entries (obrigatório — falha aborta tudo)
    INSERT INTO data_entries (
      farm_id, data, pasto_nome, suplemento,
      quantidade, periodo, sacos, kg, consumo
    ) VALUES (
      p_farm_id,
      p_data_exec,
      v_item.pasto_nome,
      v_item.suplemento_nome,
      COALESCE(v_item.quantidade_animais, 0),
      v_item.periodo_dias,
      v_item.sacos,
      v_kg_calc,
      CASE
        WHEN COALESCE(v_item.quantidade_animais, 0) > 0 AND v_item.periodo_dias > 0
        THEN v_kg_calc / v_item.quantidade_animais / v_item.periodo_dias
        ELSE 0
      END
    );
    v_entries_count := v_entries_count + 1;

    -- 3. Despesa no livro_caixa — melhor esforço (não aborta se falhar)
    BEGIN
      IF v_item.suplemento_id IS NOT NULL THEN
        SELECT valor_kg, COALESCE(peso, 25)
          INTO v_valor_kg, v_peso_saco
          FROM supplement_types
         WHERE id = v_item.suplemento_id AND farm_id = p_farm_id;

        IF FOUND AND v_valor_kg IS NOT NULL AND v_valor_kg > 0 THEN
          v_kg_calc    := COALESCE(v_item.kg, v_item.sacos * v_peso_saco);
          v_valor_total := v_kg_calc * v_valor_kg;

          INSERT INTO livro_caixa (
            farm_id, tipo, categoria, descricao,
            valor, data, referencia, origem, os_id, created_by
          ) VALUES (
            p_farm_id,
            'despesa',
            'Compra de suplemento',
            'OS ' || COALESCE(v_os.numero, '') || ' — ' || v_item.suplemento_nome || ' (' || v_item.pasto_nome || ')',
            v_valor_total,
            p_data_exec,
            COALESCE(v_os.numero, p_os_id::text),
            'os',
            p_os_id,
            p_user_id
          );
          v_caixa_count := v_caixa_count + 1;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- livro_caixa falhou — avisa mas não aborta a transação principal
      RAISE WARNING 'confirmar_execucao_os: falha ao inserir livro_caixa para item % — %',
        v_item.id, SQLERRM;
    END;

  END LOOP;

  -- 4. Marcar todos os itens como executados (obrigatório)
  UPDATE ordens_suplemento_itens
     SET executado = true
   WHERE os_id = p_os_id;

  -- 5. Atualizar status da OS para executada (obrigatório)
  UPDATE ordens_suplemento
     SET status = 'executada'
   WHERE id = p_os_id;

  RETURN jsonb_build_object(
    'ok',             true,
    'os_id',          p_os_id,
    'estoque_saidas', v_estoque_count,
    'data_entries',   v_entries_count,
    'caixa_despesas', v_caixa_count
  );

EXCEPTION WHEN OTHERS THEN
  -- Qualquer erro nos passos 1, 2, 4 ou 5 → rollback automático de tudo
  RETURN jsonb_build_object(
    'ok',    false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Apenas usuários autenticados podem chamar
REVOKE ALL ON FUNCTION public.confirmar_execucao_os FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirmar_execucao_os TO authenticated;

-- ── Verificação ───────────────────────────────────────────────────────
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'confirmar_execucao_os';
-- Deve retornar: confirmar_execucao_os | FUNCTION | DEFINER
