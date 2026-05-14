-- ══════════════════════════════════════════════════════════════
-- Cron job: popula lote_diario todo dia às 23:00
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. Função que faz o upsert diário
CREATE OR REPLACE FUNCTION upsert_lote_diario_hoje()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today date := CURRENT_DATE;
BEGIN
  -- Remove registros não confirmados de hoje para recriar com dados frescos
  DELETE FROM lote_diario
  WHERE data = today AND confirmado = false;

  -- Insere registro por animal ativo com suplemento ou GMD no pasto
  INSERT INTO lote_diario (
    farm_id, animal_id, data, pasto_id, pasto_nome,
    suplemento, fonte_meta, meta_pct, meta_kg_cab, meta_kg_total,
    consumo_kg_cab, gmd, ganho_dia, ganho_acum, peso_estimado, confirmado
  )
  SELECT
    a.farm_id,
    a.id                                                            AS animal_id,
    today                                                           AS data,
    a.pasto_id,
    p.nome                                                          AS pasto_nome,
    ls.suplemento,

    CASE
      WHEN a.meta_percentagem IS NOT NULL THEN 'manual'
      WHEN mp.meta_pct        IS NOT NULL THEN 'suplemento'
      ELSE NULL
    END                                                             AS fonte_meta,

    COALESCE(a.meta_percentagem, mp.meta_pct)                       AS meta_pct,

    -- meta_kg_cab = peso_medio × meta_pct / 100
    CASE
      WHEN COALESCE(a.meta_percentagem, mp.meta_pct) IS NOT NULL
       AND a.peso_medio IS NOT NULL
      THEN ROUND(
             (a.peso_medio * COALESCE(a.meta_percentagem, mp.meta_pct) / 100.0)::numeric, 4)
    END                                                             AS meta_kg_cab,

    -- meta_kg_total = meta_kg_cab × quantidade
    CASE
      WHEN COALESCE(a.meta_percentagem, mp.meta_pct) IS NOT NULL
       AND a.peso_medio IS NOT NULL
      THEN ROUND(
             (a.peso_medio * COALESCE(a.meta_percentagem, mp.meta_pct) / 100.0
              * COALESCE(a.quantidade, 1))::numeric, 3)
    END                                                             AS meta_kg_total,

    NULL                                                            AS consumo_kg_cab,

    COALESCE(a.gmd, st.gmd_esperado)                                AS gmd,
    COALESCE(a.gmd, st.gmd_esperado)                                AS ganho_dia,

    -- ganho_acum = gmd × dias desde data_entrada
    CASE
      WHEN COALESCE(a.gmd, st.gmd_esperado) IS NOT NULL
       AND a.data_entrada IS NOT NULL
      THEN ROUND(
             (COALESCE(a.gmd, st.gmd_esperado)
              * GREATEST(0, today - a.data_entrada))::numeric, 3)
      ELSE 0
    END                                                             AS ganho_acum,

    -- peso_estimado = peso_medio + ganho_acum
    COALESCE(a.peso_medio, 0) + CASE
      WHEN COALESCE(a.gmd, st.gmd_esperado) IS NOT NULL
       AND a.data_entrada IS NOT NULL
      THEN ROUND(
             (COALESCE(a.gmd, st.gmd_esperado)
              * GREATEST(0, today - a.data_entrada))::numeric, 1)
      ELSE 0
    END                                                             AS peso_estimado,

    false                                                           AS confirmado

  FROM animals a
  JOIN pastures p ON p.id = a.pasto_id

  -- Suplemento adulto mais recente do pasto (ignora Creep)
  LEFT JOIN LATERAL (
    SELECT de.suplemento
    FROM data_entries de
    WHERE de.farm_id = a.farm_id
      AND UPPER(TRIM(de.pasto_nome)) = UPPER(TRIM(p.nome))
      AND UPPER(de.suplemento) NOT LIKE '%CREEP%'
    ORDER BY de.data DESC, de.created_at DESC
    LIMIT 1
  ) ls ON true

  -- Tipo do suplemento para GMD e consumo%
  LEFT JOIN supplement_types st
    ON  st.farm_id = a.farm_id
    AND UPPER(TRIM(st.nome)) = UPPER(TRIM(ls.suplemento))

  -- Converte consumo% em valor numérico de meta
  LEFT JOIN LATERAL (
    SELECT CASE st.consumo
      WHEN '20 A 30 GRAMAS/100 KG PV'   THEN 0.030
      WHEN '35 A 45 GRAMAS/100 KG PV'   THEN 0.040
      WHEN '50 A 100 GRAMAS/100 KG PV'  THEN 0.060
      WHEN '100 A 120 GRAMAS/100 KG PV' THEN 0.110
      WHEN '200 A 300 GRAMAS/100 KG PV' THEN 0.250
      WHEN '300 A 400 GRAMAS/100 KG PV' THEN 0.350
      WHEN '500 A 700 GRAMAS/100 KG PV' THEN 0.600
      WHEN '1,0 A 1,50% PV'             THEN 1.300
      WHEN '1,50 A 2,30% PV'            THEN 2.000
      ELSE NULL
    END AS meta_pct
  ) mp ON true

  WHERE (a.status = 'ativo' OR a.status IS NULL)
    AND a.pasto_id IS NOT NULL
    AND (
      COALESCE(a.gmd, st.gmd_esperado) IS NOT NULL
      OR COALESCE(a.meta_percentagem, mp.meta_pct) IS NOT NULL
    )

  -- Pula registros que já existem confirmados (não sobrescreve)
  ON CONFLICT (farm_id, animal_id, data) DO NOTHING;

END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 2. Agendamento via pg_cron (todo dia às 23:00 horário do servidor)
-- ──────────────────────────────────────────────────────────────

-- Remove agendamento anterior se já existir
SELECT cron.unschedule('upsert-lote-diario-23h');

-- Cria o agendamento
SELECT cron.schedule(
  'upsert-lote-diario-23h',
  '0 23 * * *',
  'SELECT upsert_lote_diario_hoje()'
);

-- Confirma que foi criado
SELECT jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'upsert-lote-diario-23h';

-- ──────────────────────────────────────────────────────────────
-- 3. Testar manualmente (opcional — roda agora para ver se funciona)
-- ──────────────────────────────────────────────────────────────
-- SELECT upsert_lote_diario_hoje();
-- SELECT * FROM lote_diario ORDER BY data DESC LIMIT 20;
