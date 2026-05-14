-- Popula data_entries.pasto_id para todos os registros históricos
-- onde ainda está NULL, fazendo JOIN pelo nome normalizado com pastures.
-- Execute uma vez no Supabase SQL Editor.

UPDATE data_entries de
SET pasto_id = p.id
FROM pastures p
WHERE p.farm_id = de.farm_id
  AND UPPER(TRIM(p.nome)) = UPPER(TRIM(de.pasto_nome))
  AND de.pasto_id IS NULL;

-- Verificar resultado:
SELECT
  COUNT(*)                                        AS total,
  COUNT(pasto_id)                                 AS com_pasto_id,
  COUNT(*) FILTER (WHERE pasto_id IS NULL)        AS sem_pasto_id
FROM data_entries;
