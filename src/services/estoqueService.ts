import { supabaseAdmin } from '../lib/supabase';

/* ── Types ── */

export interface EstoqueMovimento {
  id: string;
  farm_id: string;
  tipo: 'entrada' | 'saida';
  suplemento_id?: string | null;
  suplemento_nome: string;
  data: string;              // YYYY-MM-DD
  sacos: number;
  kg: number;
  valor_unitario_kg?: number | null;
  fornecedor?: string | null;
  nota_fiscal?: string | null;
  os_id?: string | null;
  observacoes?: string | null;
  created_at: string;
  created_by?: string | null;
}

export interface SaldoSuplemento {
  suplemento_id: string | null;
  suplemento_nome: string;
  sacos_entrada: number;
  sacos_saida: number;
  saldo_sacos: number;
  kg_entrada: number;
  kg_saida: number;
  saldo_kg: number;
  estoque_minimo_sacos: number;
  alerta_reposicao: boolean;
  em_alerta: boolean;         // saldo_sacos <= estoque_minimo_sacos
  valor_medio_kg: number | null;
  ultimo_movimento?: string | null;
}

export interface SuppTypeWithEstoque {
  id: string;
  nome: string;
  unidade: string;
  peso?: number | null;
  valor_kg?: number | null;
  consumo?: string | null;
  estoque_minimo_sacos: number;
  alerta_reposicao: boolean;
}

/* ── Helpers ── */

function toSacos(kg: number, pesoSaco = 25): number {
  return pesoSaco > 0 ? kg / pesoSaco : 0;
}

/* ── Service ── */

export const estoqueService = {

  /* ---------- Supplement types com campos de estoque ---------- */

  async listarSuplementos(farmId: string): Promise<SuppTypeWithEstoque[]> {
    const { data, error } = await supabaseAdmin
      .from('supplement_types')
      .select('id, nome, unidade, peso, valor_kg, consumo, estoque_minimo_sacos, alerta_reposicao')
      .eq('farm_id', farmId)
      .order('nome');
    if (error) throw new Error(error.message);
    return (data ?? []) as SuppTypeWithEstoque[];
  },

  async atualizarEstoqueMinimo(
    id: string,
    minimo: number,
    alerta: boolean,
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('supplement_types')
      .update({ estoque_minimo_sacos: minimo, alerta_reposicao: alerta })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  /* ---------- Movimentações ---------- */

  async listarMovimentos(
    farmId: string,
    opts?: {
      tipo?: 'entrada' | 'saida';
      suplementoNome?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    },
  ): Promise<EstoqueMovimento[]> {
    let q = supabaseAdmin
      .from('estoque_movimentos')
      .select('*')
      .eq('farm_id', farmId)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    if (opts?.tipo)            q = q.eq('tipo', opts.tipo);
    if (opts?.suplementoNome)  q = q.eq('suplemento_nome', opts.suplementoNome);
    if (opts?.dateFrom)        q = q.gte('data', opts.dateFrom);
    if (opts?.dateTo)          q = q.lte('data', opts.dateTo);
    if (opts?.limit)           q = q.limit(opts.limit);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as EstoqueMovimento[];
  },

  async adicionarEntrada(payload: {
    farmId: string;
    suplementoId?: string;
    suplementoNome: string;
    data: string;
    sacos: number;
    kg: number;
    valorUnitarioKg?: number;
    fornecedor?: string;
    notaFiscal?: string;
    observacoes?: string;
    createdBy?: string;
  }): Promise<EstoqueMovimento> {
    const row = {
      farm_id:           payload.farmId,
      tipo:              'entrada' as const,
      suplemento_id:     payload.suplementoId ?? null,
      suplemento_nome:   payload.suplementoNome,
      data:              payload.data,
      sacos:             payload.sacos,
      kg:                payload.kg,
      valor_unitario_kg: payload.valorUnitarioKg ?? null,
      fornecedor:        payload.fornecedor ?? null,
      nota_fiscal:       payload.notaFiscal ?? null,
      observacoes:       payload.observacoes ?? null,
      created_by:        payload.createdBy ?? null,
    };
    const { data, error } = await supabaseAdmin
      .from('estoque_movimentos')
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as EstoqueMovimento;
  },

  async adicionarSaida(payload: {
    farmId: string;
    suplementoId?: string;
    suplementoNome: string;
    data: string;
    sacos: number;
    kg: number;
    osId?: string;
    observacoes?: string;
    createdBy?: string;
  }): Promise<EstoqueMovimento> {
    const row = {
      farm_id:         payload.farmId,
      tipo:            'saida' as const,
      suplemento_id:   payload.suplementoId ?? null,
      suplemento_nome: payload.suplementoNome,
      data:            payload.data,
      sacos:           payload.sacos,
      kg:              payload.kg,
      os_id:           payload.osId ?? null,
      observacoes:     payload.observacoes ?? null,
      created_by:      payload.createdBy ?? null,
    };
    const { data, error } = await supabaseAdmin
      .from('estoque_movimentos')
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as EstoqueMovimento;
  },

  async deletarMovimento(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('estoque_movimentos')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  /* ---------- Saldo por suplemento ---------- */

  async calcularSaldos(
    farmId: string,
    supls: SuppTypeWithEstoque[],
  ): Promise<SaldoSuplemento[]> {
    const { data: movs, error } = await supabaseAdmin
      .from('estoque_movimentos')
      .select('suplemento_nome, tipo, sacos, kg, valor_unitario_kg, data')
      .eq('farm_id', farmId);
    if (error) throw new Error(error.message);

    // Agrupa por nome de suplemento
    const map = new Map<string, {
      sacos_e: number; sacos_s: number;
      kg_e: number;    kg_s: number;
      valores: number[];
      ultima: string;
    }>();

    for (const m of (movs ?? [])) {
      const nome = m.suplemento_nome as string;
      if (!map.has(nome)) map.set(nome, { sacos_e: 0, sacos_s: 0, kg_e: 0, kg_s: 0, valores: [], ultima: '' });
      const acc = map.get(nome)!;
      if (m.tipo === 'entrada') {
        acc.sacos_e += Number(m.sacos);
        acc.kg_e    += Number(m.kg);
        if (m.valor_unitario_kg) acc.valores.push(Number(m.valor_unitario_kg));
      } else {
        acc.sacos_s += Number(m.sacos);
        acc.kg_s    += Number(m.kg);
      }
      if (!acc.ultima || (m.data as string) > acc.ultima) acc.ultima = m.data as string;
    }

    // Monta resultado — inclui suplementos sem movimentos (saldo 0)
    const result: SaldoSuplemento[] = supls.map(s => {
      const acc = map.get(s.nome) ?? { sacos_e: 0, sacos_s: 0, kg_e: 0, kg_s: 0, valores: [], ultima: '' };
      const saldo_sacos = acc.sacos_e - acc.sacos_s;
      const saldo_kg    = acc.kg_e    - acc.kg_s;
      const valor_medio = acc.valores.length > 0
        ? acc.valores.reduce((a, b) => a + b, 0) / acc.valores.length
        : null;
      return {
        suplemento_id:       s.id,
        suplemento_nome:     s.nome,
        sacos_entrada:       acc.sacos_e,
        sacos_saida:         acc.sacos_s,
        saldo_sacos,
        kg_entrada:          acc.kg_e,
        kg_saida:            acc.kg_s,
        saldo_kg,
        estoque_minimo_sacos: s.estoque_minimo_sacos,
        alerta_reposicao:    s.alerta_reposicao,
        em_alerta:           s.alerta_reposicao && saldo_sacos <= s.estoque_minimo_sacos,
        valor_medio_kg:      valor_medio,
        ultimo_movimento:    acc.ultima || null,
      };
    });

    // Também inclui movimentos de suplementos não cadastrados mais (deletados)
    for (const [nome, acc] of map.entries()) {
      if (result.some(r => r.suplemento_nome === nome)) continue;
      const saldo_sacos = acc.sacos_e - acc.sacos_s;
      result.push({
        suplemento_id:       null,
        suplemento_nome:     nome,
        sacos_entrada:       acc.sacos_e,
        sacos_saida:         acc.sacos_s,
        saldo_sacos,
        kg_entrada:          acc.kg_e,
        kg_saida:            acc.kg_s,
        saldo_kg:            acc.kg_e - acc.kg_s,
        estoque_minimo_sacos: 0,
        alerta_reposicao:    false,
        em_alerta:           false,
        valor_medio_kg:      acc.valores.length > 0
          ? acc.valores.reduce((a, b) => a + b, 0) / acc.valores.length
          : null,
        ultimo_movimento:    acc.ultima || null,
      });
    }

    // Ordena: alertas primeiro, depois alfabético
    return result.sort((a, b) => {
      if (a.em_alerta !== b.em_alerta) return a.em_alerta ? -1 : 1;
      return a.suplemento_nome.localeCompare(b.suplemento_nome);
    });
  },

  /* ---------- Consumo médio (30 dias) para sugestão de compra ---------- */

  async consumoMedio30d(farmId: string, suplementoNome: string): Promise<number> {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const fromStr = from.toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('estoque_movimentos')
      .select('sacos')
      .eq('farm_id', farmId)
      .eq('suplemento_nome', suplementoNome)
      .eq('tipo', 'saida')
      .gte('data', fromStr);
    if (error) return 0;
    return (data ?? []).reduce((s, r) => s + Number(r.sacos), 0);
  },

  /* ---------- util: kg → sacos dado o peso do saco ---------- */
  kgParaSacos: toSacos,
};
