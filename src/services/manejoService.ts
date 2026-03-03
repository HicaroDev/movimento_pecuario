import { supabaseAdmin } from '../lib/supabase';

/* ── Types ── */

export interface Animal {
  id: string;
  farm_id: string;
  nome: string;
  quantidade: number;
  raca?: string;
  categoria_id?: string;
  peso_medio?: number;
  sexo?: string;
  observacoes?: string;
  pasto_id?: string;
  status: 'ativo' | 'abatido' | 'vendido';
  created_at?: string;
}

export interface AnimalCategory {
  id: string;
  farm_id: string;
  nome: string;
}

export interface ManejoEvent {
  id: string;
  farm_id: string;
  animal_id: string;
  tipo: string;
  descricao?: string;
  quantidade?: number;
  peso_medio?: number;
  created_at: string;
}

/* ── Helpers ── */

function toAnimal(row: Record<string, unknown>): Animal {
  return {
    id:           row.id as string,
    farm_id:      row.farm_id as string,
    nome:         row.nome as string,
    quantidade:   (row.quantidade as number) ?? 0,
    raca:         (row.raca as string) ?? undefined,
    categoria_id: (row.categoria_id as string) ?? undefined,
    peso_medio:   (row.peso_medio as number) ?? undefined,
    sexo:         (row.sexo as string) ?? undefined,
    observacoes:  (row.observacoes as string) ?? undefined,
    pasto_id:     (row.pasto_id as string) ?? undefined,
    status:       ((row.status as string) ?? 'ativo') as Animal['status'],
    created_at:   (row.created_at as string) ?? undefined,
  };
}

function toCategory(row: Record<string, unknown>): AnimalCategory {
  return {
    id:      row.id as string,
    farm_id: row.farm_id as string,
    nome:    row.nome as string,
  };
}

function toEvent(row: Record<string, unknown>): ManejoEvent {
  return {
    id:         row.id as string,
    farm_id:    row.farm_id as string,
    animal_id:  row.animal_id as string,
    tipo:       row.tipo as string,
    descricao:  (row.descricao as string) ?? undefined,
    quantidade: (row.quantidade as number) ?? undefined,
    peso_medio: (row.peso_medio as number) ?? undefined,
    created_at: row.created_at as string,
  };
}

async function insertHistorico(payload: {
  farm_id: string;
  animal_id: string;
  tipo: string;
  descricao?: string;
  pasto_origem?: string | null;
  pasto_destino?: string | null;
  categoria_origem?: string | null;
  categoria_destino?: string | null;
  quantidade?: number | null;
  peso_medio?: number | null;
}) {
  await supabaseAdmin.from('manejo_historico').insert(payload);
}

/* ── Service ── */

export const manejoService = {

  async listarAnimais(farmId: string): Promise<Animal[]> {
    const { data, error } = await supabaseAdmin
      .from('animals')
      .select('*')
      .eq('farm_id', farmId)
      .order('nome');
    if (error) throw new Error(error.message);
    return (data ?? []).map(toAnimal);
  },

  async listarCategorias(farmId: string): Promise<AnimalCategory[]> {
    const { data, error } = await supabaseAdmin
      .from('animal_categories')
      .select('*')
      .eq('farm_id', farmId)
      .order('nome');
    if (error) throw new Error(error.message);
    return (data ?? []).map(toCategory);
  },

  async alocarPasto(
    animal: Animal,
    pastoId: string | null,
    pastoNome: string,
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('animals')
      .update({ pasto_id: pastoId })
      .eq('id', animal.id);
    if (error) throw new Error(error.message);

    const acao = pastoId ? `alocado em ${pastoNome}` : 'removido do pasto';
    await insertHistorico({
      farm_id:       animal.farm_id,
      animal_id:     animal.id,
      tipo:          'alocacao',
      descricao:     `Lote "${animal.nome}" ${acao}`,
      pasto_origem:  animal.pasto_id ?? null,
      pasto_destino: pastoId,
    });
  },

  async transferir(
    animal: Animal,
    pastoDestinoId: string,
    pastoOrigemNome: string,
    pastoDestinoNome: string,
    data?: string,
    obs?: string,
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('animals')
      .update({ pasto_id: pastoDestinoId })
      .eq('id', animal.id);
    if (error) throw new Error(error.message);

    const dataStr = data ? ` · ${new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}` : '';
    await insertHistorico({
      farm_id:       animal.farm_id,
      animal_id:     animal.id,
      tipo:          'transferencia',
      descricao:     `Lote "${animal.nome}" transferido de ${pastoOrigemNome} → ${pastoDestinoNome}${dataStr}${obs ? ` · ${obs}` : ''}`,
      pasto_origem:  animal.pasto_id ?? null,
      pasto_destino: pastoDestinoId,
    });
  },

  async evoluirCategorias(
    animals: Animal[],
    novaCategoriaId: string,
    categoriaOrigemNome: string,
    categoriaDestinoNome: string,
    pesoMedio?: number,
  ): Promise<void> {
    const ids = animals.map(a => a.id);
    const patch: Record<string, unknown> = { categoria_id: novaCategoriaId };
    if (pesoMedio) patch.peso_medio = pesoMedio;

    const { error } = await supabaseAdmin
      .from('animals')
      .update(patch)
      .in('id', ids);
    if (error) throw new Error(error.message);

    const totalCab = animals.reduce((s, a) => s + a.quantidade, 0);
    const nomesLotes = animals.map(a => `"${a.nome}"`).join(', ');
    await Promise.all(animals.map(a =>
      insertHistorico({
        farm_id:           a.farm_id,
        animal_id:         a.id,
        tipo:              'evolucao_categoria',
        descricao:         `${nomesLotes}: ${categoriaOrigemNome} → ${categoriaDestinoNome} (${totalCab} cab.)`,
        categoria_origem:  a.categoria_id ?? null,
        categoria_destino: novaCategoriaId,
        quantidade:        a.quantidade,
        peso_medio:        pesoMedio ?? null,
      })
    ));
  },

  async registrarAbate(
    animal: Animal,
    quantidade: number,
    pesoMedio?: number,
    obs?: string,
  ): Promise<void> {
    const novaQtd = animal.quantidade - quantidade;
    const patch: Record<string, unknown> = { quantidade: novaQtd };
    if (novaQtd <= 0) patch.status = 'abatido';

    const { error } = await supabaseAdmin
      .from('animals')
      .update(patch)
      .eq('id', animal.id);
    if (error) throw new Error(error.message);

    const encerrado = novaQtd <= 0 ? ' — lote encerrado' : '';
    await insertHistorico({
      farm_id:    animal.farm_id,
      animal_id:  animal.id,
      tipo:       'abate',
      descricao:  `Abate de ${quantidade} cab. do lote "${animal.nome}"${pesoMedio ? ` · ${pesoMedio} kg` : ''}${obs ? ` · ${obs}` : ''}${encerrado}`,
      quantidade,
      peso_medio: pesoMedio ?? null,
    });
  },

  async listarHistorico(farmId: string, tipo?: string, limit = 30): Promise<ManejoEvent[]> {
    let q = supabaseAdmin
      .from('manejo_historico')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (tipo) q = q.eq('tipo', tipo);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map(toEvent);
  },
};
