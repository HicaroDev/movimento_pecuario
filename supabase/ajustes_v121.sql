-- v1.21 — Adiciona campo prenha em animals
ALTER TABLE animals ADD COLUMN IF NOT EXISTS prenha boolean DEFAULT false;
