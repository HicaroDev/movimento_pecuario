/**
 * Suplemento Control — Seed de Demonstração
 * Usa fetch direto para GoTrue (admin API) e SDK para PostgREST
 */
import { createClient } from '@supabase/supabase-js';

const BASE_URL        = 'https://saas-supabase.bj3amt.easypanel.host';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(BASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const FARM_ID = '10000000-0000-4000-8000-000000000001';
const AUTH    = { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };

function ok(label, extra)  { console.log(`  ✅ ${label}`, extra ?? ''); }
function warn(label, extra){ console.log(`  ⚠️  ${label}`, extra ?? ''); }
function fail(label, err)  { console.error(`  ❌ ${label}:`, typeof err === 'string' ? err : (err?.message ?? JSON.stringify(err))); }

/* ── Helpers GoTrue via fetch ── */
async function authListUsers() {
  const r = await fetch(`${BASE_URL}/auth/v1/admin/users?per_page=200`, { headers: AUTH });
  const j = await r.json();
  return j.users ?? [];
}

async function authCreateUser(email, password, metadata) {
  const r = await fetch(`${BASE_URL}/auth/v1/admin/users`, {
    method:  'POST',
    headers: AUTH,
    body:    JSON.stringify({ email, password, email_confirm: true, user_metadata: metadata }),
  });
  return r.json();
}

async function authDeleteUser(id) {
  await fetch(`${BASE_URL}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: AUTH });
}

/* ─────────────────────────────────────────────────────────── */
async function main() {
  console.log('\n🌱 Suplemento Control — Seed de Demonstração');
  console.log('─'.repeat(52));

  /* ── 1. Limpar dados anteriores ── */
  console.log('\n1. Limpando dados anteriores...');

  const users = await authListUsers();
  for (const email of ['admin@suplemento.com', 'cliente@malhada.com']) {
    const u = users.find(x => x.email === email);
    if (u) {
      await supabase.from('profiles').delete().eq('id', u.id);
      await authDeleteUser(u.id);
      warn(`Removido: ${email}`);
    }
  }

  await supabase.from('data_entries').delete().eq('farm_id', FARM_ID);
  await supabase.from('pastures').delete().eq('farm_id', FARM_ID);
  await supabase.from('farms').delete().eq('id', FARM_ID);
  ok('Limpeza concluída');

  /* ── 2. Fazenda ── */
  console.log('\n2. Criando fazenda...');
  const { error: farmErr } = await supabase.from('farms').insert({
    id:                 FARM_ID,
    nome_fazenda:       'Fazenda Malhada Grande',
    nome_responsavel:   'Carlos Eduardo Oliveira',
    quantidade_cabecas: 1200,
    endereco:           'Rodovia BR-080, Km 45 — Cocalinho/MT',
    telefone:           '(65) 98765-4321',
    email:              'carlos@malhada.com.br',
    active:             true,
  });
  if (farmErr) { fail('Fazenda', farmErr); process.exit(1); }
  ok('Fazenda Malhada Grande criada');

  /* ── 3. Usuários via fetch direto ── */
  console.log('\n3. Criando usuários...');

  const adminUser  = await authCreateUser('admin@suplemento.com',  'admin123',    { name: 'Administrador',         role: 'admin'  });
  const clientUser = await authCreateUser('cliente@malhada.com',   'malhada123',  { name: 'Fazenda Malhada Grande', role: 'client' });

  const adminId  = adminUser.id  ?? adminUser.error;
  const clientId = clientUser.id ?? clientUser.error;

  if (adminUser.id)  ok(`admin@suplemento.com   (id: ${adminId})`);
  else               fail('Admin',   adminUser);

  if (clientUser.id) ok(`cliente@malhada.com    (id: ${clientId})`);
  else               fail('Cliente', clientUser);

  /* ── 4. Ajustar perfis ── */
  console.log('\n4. Ajustando perfis...');

  if (adminUser.id) {
    const { error } = await supabase.from('profiles').update({
      modules: ['relatorio','formulario','pastos','fazendas','usuarios'],
      active:  true,
    }).eq('id', adminUser.id);
    if (error) fail('Perfil admin', error); else ok('Admin: todos os módulos');
  }

  if (clientUser.id) {
    const { error } = await supabase.from('profiles').update({
      farm_id: FARM_ID,
      modules: ['relatorio','formulario','pastos'],
      active:  true,
    }).eq('id', clientUser.id);
    if (error) fail('Perfil cliente', error); else ok('Cliente: vinculado à fazenda');
  }

  /* ── 5. Pastos ── */
  console.log('\n5. Criando pastos...');

  const pastures = [
    { nome: 'Cana',                    area: 45.0  },
    { nome: 'Tamboril',                area: 38.5  },
    { nome: 'Sujo 1',                  area: 62.0  },
    { nome: 'Mama de Baixo Piquete 2', area: 28.0  },
    { nome: 'Mama de Baixo Piquete 1', area: 32.0  },
    { nome: 'Palhadão do Meio',        area: 55.0  },
    { nome: 'Rio do Ouro de Baixo',    area: 80.0  },
    { nome: 'Rio do Ouro de Cima',     area: 75.0  },
    { nome: 'Pequi 2',                 area: 41.0  },
    { nome: 'João Jacinto de Cima',    area: 52.0  },
    { nome: 'Da Maternidade',          area: 23.5  },
    { nome: 'Ponte Cima',              area: 19.0  },
    { nome: 'Luizinho',                area: 16.0  },
    { nome: 'Boiada Gorda',            area: 88.0  },
    { nome: 'Divaldo',                 area: 110.0 },
    { nome: 'Pasto do Braquiarão',     area: 67.0  },
    { nome: 'João Jacinto de Baixo',   area: 49.0  },
    { nome: 'Tucuzão Braquiára',       area: 71.0  },
    { nome: 'Da Pedra',                area: 44.0  },
  ].map(p => ({ ...p, farm_id: FARM_ID }));

  const { error: pastErr } = await supabase.from('pastures').insert(pastures);
  if (pastErr) fail('Pastos', pastErr); else ok(`${pastures.length} pastos criados`);

  /* ── 6. Lançamentos ── */
  console.log('\n6. Inserindo lançamentos...');

  const entries = [
    // Energético 0,3%
    { pasto_nome: 'Cana',                    suplemento: 'Energético 0,3%',       quantidade:  30, periodo: 30, sacos:  96, kg: 2400, consumo: 0.842 },
    { pasto_nome: 'Tamboril',                suplemento: 'Energético 0,3%',       quantidade:  30, periodo: 30, sacos:  48, kg: 1200, consumo: 1.000 },
    { pasto_nome: 'Sujo 1',                  suplemento: 'Energético 0,3%',       quantidade:  40, periodo: 30, sacos:  54, kg: 1350, consumo: 1.452 },
    { pasto_nome: 'Mama de Baixo Piquete 2', suplemento: 'Energético 0,3%',       quantidade: 117, periodo: 30, sacos:  16, kg:  400, consumo: 0.833 },
    { pasto_nome: 'Mama de Baixo Piquete 1', suplemento: 'Energético 0,3%',       quantidade:  98, periodo: 30, sacos:  44, kg: 1100, consumo: 0.780 },
    { pasto_nome: 'Palhadão do Meio',        suplemento: 'Energético 0,3%',       quantidade:  31, periodo: 30, sacos:  70, kg: 1750, consumo: 0.729 },
    { pasto_nome: 'Rio do Ouro de Baixo',    suplemento: 'Energético 0,3%',       quantidade:  64, periodo: 30, sacos: 120, kg: 3000, consumo: 0.862 },
    { pasto_nome: 'Rio do Ouro de Cima',     suplemento: 'Energético 0,3%',       quantidade:  80, periodo: 30, sacos:  40, kg: 1000, consumo: 0.450 },
    { pasto_nome: 'Pequi 2',                 suplemento: 'Energético 0,3%',       quantidade:  20, periodo: 30, sacos:  45, kg: 1125, consumo: 0.586 },
    { pasto_nome: 'João Jacinto de Cima',    suplemento: 'Energético 0,3%',       quantidade:  74, periodo: 30, sacos:  40, kg: 1000, consumo: 0.606 },
    { pasto_nome: 'Da Maternidade',          suplemento: 'Energético 0,3%',       quantidade:  34, periodo: 30, sacos:  38, kg:  950, consumo: 0.772 },
    { pasto_nome: 'Ponte Cima',              suplemento: 'Energético 0,3%',       quantidade:  36, periodo: 30, sacos:  28, kg:  700, consumo: 0.496 },
    { pasto_nome: 'Luizinho',                suplemento: 'Energético 0,3%',       quantidade:  30, periodo: 30, sacos:  25, kg:  625, consumo: 0.326 },
    // Mineral Adensado Águas
    { pasto_nome: 'Boiada Gorda',            suplemento: 'Mineral Adensado Águas', quantidade:  97, periodo: 30, sacos: 18, kg: 450, consumo: 0.155 },
    { pasto_nome: 'Divaldo',                 suplemento: 'Mineral Adensado Águas', quantidade: 174, periodo: 30, sacos: 30, kg: 750, consumo: 0.144 },
    { pasto_nome: 'Pasto do Braquiarão',     suplemento: 'Mineral Adensado Águas', quantidade:  57, periodo: 30, sacos: 12, kg: 300, consumo: 0.175 },
    { pasto_nome: 'João Jacinto de Baixo',   suplemento: 'Mineral Adensado Águas', quantidade:  78, periodo: 30, sacos: 15, kg: 375, consumo: 0.160 },
    { pasto_nome: 'Tucuzão Braquiára',       suplemento: 'Mineral Adensado Águas', quantidade:  85, periodo: 30, sacos: 17, kg: 425, consumo: 0.167 },
    { pasto_nome: 'Da Pedra',                suplemento: 'Mineral Adensado Águas', quantidade:  82, periodo: 30, sacos: 15, kg: 375, consumo: 0.152 },
    // Ração Creep
    { pasto_nome: 'Tamboril',                suplemento: 'Ração Creep', quantidade:  40, periodo: 30, sacos: 27, kg:  675, consumo: 0.563 },
    { pasto_nome: 'Boiada Gorda',            suplemento: 'Ração Creep', quantidade:  94, periodo: 30, sacos:  9, kg:  225, consumo: 0.080 },
    { pasto_nome: 'Rio do Ouro de Cima',     suplemento: 'Ração Creep', quantidade:  75, periodo: 30, sacos: 75, kg: 1875, consumo: 0.833 },
    { pasto_nome: 'Pasto do Braquiarão',     suplemento: 'Ração Creep', quantidade:  56, periodo: 30, sacos: 25, kg:  625, consumo: 0.372 },
    { pasto_nome: 'João Jacinto de Cima',    suplemento: 'Ração Creep', quantidade:  53, periodo: 30, sacos: 20, kg:  500, consumo: 0.314 },
    { pasto_nome: 'Tucuzão Braquiára',       suplemento: 'Ração Creep', quantidade:  82, periodo: 30, sacos: 20, kg:  500, consumo: 0.203 },
    { pasto_nome: 'Da Pedra',                suplemento: 'Ração Creep', quantidade:  80, periodo: 30, sacos: 20, kg:  500, consumo: 0.208 },
    { pasto_nome: 'Da Maternidade',          suplemento: 'Ração Creep', quantidade:  39, periodo: 30, sacos: 12, kg:  300, consumo: 0.256 },
    { pasto_nome: 'Ponte Cima',              suplemento: 'Ração Creep', quantidade:  45, periodo: 30, sacos: 16, kg:  400, consumo: 0.296 },
  ].map(e => ({ ...e, farm_id: FARM_ID, data: '2026-01-28' }));

  const { error: entErr } = await supabase.from('data_entries').insert(entries);
  if (entErr) {
    // Fallback: coluna 'tipo' ainda existe (patch.sql não rodou)
    if (entErr.message?.includes('tipo') || entErr.message?.includes('null value')) {
      warn('Coluna "tipo" detectada — modo compatibilidade...');
      const { error: e2 } = await supabase.from('data_entries').insert(
        entries.map(e => ({ ...e, tipo: e.suplemento }))
      );
      if (e2) fail('Lançamentos', e2); else ok(`${entries.length} lançamentos inseridos`);
    } else {
      fail('Lançamentos', entErr);
    }
  } else {
    ok(`${entries.length} lançamentos inseridos`);
  }

  /* ── Resumo ── */
  console.log('\n' + '─'.repeat(52));
  console.log('✅ Seed concluído!\n');
  console.log('  Credenciais de acesso:');
  console.log('  ┌─────────────────────────────────────────────┐');
  console.log('  │ Admin   → admin@suplemento.com  / admin123  │');
  console.log('  │ Cliente → cliente@malhada.com   / malhada123│');
  console.log('  └─────────────────────────────────────────────┘\n');
}

main().catch(err => {
  console.error('\n💥 Erro fatal:', err.message ?? err);
  process.exit(1);
});
