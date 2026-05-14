# VPS Recovery — Suplemento Control

> Criado em: 2026-05-14 | IP: `129.121.45.185` | Painel: Hostgator + EasyPanel (:3000)

---

## O que aconteceu

O deploy travou a VPS por falta de RAM.  
O `npm run build` roda: **vitest (50 testes) + tsc + vite build (bundle 1,6 MB)** — consome 1-2 GB RAM.  
Com pouca memória disponível, o processo congela o sistema operacional inteiro.

---

## Passo 1 — Reiniciar a VPS

### Opção A — SSH (mais rápido, ~1 min)
```bash
ssh root@129.121.45.185 "reboot"
```

### Opção B — Painel Hostgator (15 min)
Acesse o painel → VPS → Reiniciar

**Após reiniciar:** EasyPanel sobe automaticamente em `http://129.121.45.185:3000/`

---

## Passo 2 — Trocar o comando de build no EasyPanel

Após a VPS voltar, acesse EasyPanel → app `suplemento-control` → configurações de build:

| Campo | Valor atual | Trocar para |
|-------|------------|-------------|
| Build command | `npm run build` | `npm run build:prod` |

`build:prod` = `tsc -b && vite build` (sem testes — muito mais leve)

---

## Passo 3 — Adicionar Swap (evita travar no futuro)

Acesse via SSH após reiniciar e rode:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Verifica se criou:
```bash
free -h
```

---

## Passo 4 — Verificar se app voltou

```bash
# Testar se responde
curl -I http://129.121.45.185:3000/
```

Ou abrir no browser: `http://129.121.45.185:3000/`

---

## Passo 5 — Restart do Supabase Auth (race condition pós-reboot)

Após qualquer reboot da VPS, o container `auth` (GoTrue) tenta subir antes do banco (`db`) registrar o alias de rede Docker. Isso causa erro 502 no login mesmo com credenciais corretas.

**Sintoma:** Login retorna "E-mail ou senha incorretos" + Network tab mostra `token?grant_type=password` com status **502**.

**Diagnóstico rápido via SSH:**
```bash
docker logs saas_supabase-auth-1 --tail 5
# Se aparecer: "hostname resolving error (lookup db ... no such host)" → aplique o fix abaixo
```

**Fix (30 segundos):**
```bash
ssh root@129.121.45.185 -p 22022
docker restart saas_supabase-auth-1
# Aguarda ~5 segundos e tenta logar novamente
```

**Confirmação que subiu:**
```bash
docker logs saas_supabase-auth-1 --tail 5
# Deve aparecer: "GoTrue API started on: 0.0.0.0:9999"
```

---

## Checklist de recuperação

- [ ] VPS reiniciada (SSH ou Hostgator)
- [ ] EasyPanel acessível em :3000
- [ ] Build command trocado para `npm run build:prod`
- [ ] Swap de 2GB criado
- [ ] Auth restart: `docker restart saas_supabase-auth-1` (aguardar 5s)
- [ ] Login funcionando (sem erro 502)
- [ ] Novo deploy feito com `build:prod`
- [ ] App funcionando normalmente

---

## Referência rápida

| Item | Valor |
|------|-------|
| IP VPS | `129.121.45.185` |
| EasyPanel | `http://129.121.45.185:3000/` |
| SSH | `ssh root@129.121.45.185` |
| Script seguro | `npm run build:prod` |
| Script com testes | `npm run build` (só local) |
| Supabase | `https://saas-supabase.bj3amt.easypanel.host` |
