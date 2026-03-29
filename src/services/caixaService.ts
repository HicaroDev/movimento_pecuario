import { supabaseAdmin } from '../lib/supabase';

/* ── Categorias ── */
export const CATEGORIAS_RECEITA = [
  'Venda de animais',
  'Venda de leite',
  'Arrendamento',
  'Outras receitas',
];

export const CATEGORIAS_DESPESA = [
  'Compra de suplemento',
  'Compra de ração',
  'Medicamentos / Veterinário',
  'Mão de obra',
  'Combustível',
  'Manutenção / Equipamentos',
  'Impostos / Taxas',
  'Outras despesas',
];

/* ── Types ── */
export interface LancamentoCaixa {
  id: string;
  farm_id: string;
  tipo: 'receita' | 'despesa';
  categoria: string;
  descricao?: string | null;
  valor: number;
  data: string;            // YYYY-MM-DD
  referencia?: string | null;
  origem: 'manual' | 'os' | 'estoque';
  os_id?: string | null;
  created_at: string;
  created_by?: string | null;
}

export type NovoLancamento = Omit<LancamentoCaixa, 'id' | 'created_at'>;

export interface ResumoCaixa {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
}

export interface PontoGrafico {
  mes: string;       // "Jan/26"
  receitas: number;
  despesas: number;
  saldo: number;
}

/* ── Helpers ── */
function rowToLancamento(row: Record<string, unknown>): LancamentoCaixa {
  return {
    id:         row.id as string,
    farm_id:    row.farm_id as string,
    tipo:       row.tipo as LancamentoCaixa['tipo'],
    categoria:  row.categoria as string,
    descricao:  (row.descricao as string) ?? null,
    valor:      Number(row.valor),
    data:       row.data as string,
    referencia: (row.referencia as string) ?? null,
    origem:     (row.origem as LancamentoCaixa['origem']) ?? 'manual',
    os_id:      (row.os_id as string) ?? null,
    created_at: row.created_at as string,
    created_by: (row.created_by as string) ?? null,
  };
}

/* ── Service ── */
export const caixaService = {

  async listar(
    farmId: string,
    opts?: {
      tipo?: 'receita' | 'despesa';
      dateFrom?: string;
      dateTo?: string;
      categoria?: string;
    }
  ): Promise<LancamentoCaixa[]> {
    let q = supabaseAdmin
      .from('livro_caixa')
      .select('*')
      .eq('farm_id', farmId)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    if (opts?.tipo)      q = q.eq('tipo', opts.tipo);
    if (opts?.categoria) q = q.eq('categoria', opts.categoria);
    if (opts?.dateFrom)  q = q.gte('data', opts.dateFrom);
    if (opts?.dateTo)    q = q.lte('data', opts.dateTo);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(r => rowToLancamento(r as Record<string, unknown>));
  },

  async criar(payload: NovoLancamento): Promise<LancamentoCaixa> {
    const { data, error } = await supabaseAdmin
      .from('livro_caixa')
      .insert({
        farm_id:    payload.farm_id,
        tipo:       payload.tipo,
        categoria:  payload.categoria,
        descricao:  payload.descricao ?? null,
        valor:      payload.valor,
        data:       payload.data,
        referencia: payload.referencia ?? null,
        origem:     payload.origem ?? 'manual',
        os_id:      payload.os_id ?? null,
        created_by: payload.created_by ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToLancamento(data as Record<string, unknown>);
  },

  async deletar(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('livro_caixa')
      .delete()
      .eq('id', id)
      .eq('origem', 'manual');   // só remove lançamentos manuais
    if (error) throw error;
  },

  calcularResumo(lancamentos: LancamentoCaixa[]): ResumoCaixa {
    const totalReceitas = lancamentos
      .filter(l => l.tipo === 'receita')
      .reduce((s, l) => s + l.valor, 0);
    const totalDespesas = lancamentos
      .filter(l => l.tipo === 'despesa')
      .reduce((s, l) => s + l.valor, 0);
    return { totalReceitas, totalDespesas, saldo: totalReceitas - totalDespesas };
  },

  calcularGrafico(lancamentos: LancamentoCaixa[]): PontoGrafico[] {
    const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const map: Record<string, { receitas: number; despesas: number }> = {};

    for (const l of lancamentos) {
      if (!l.data) continue;
      const [y, m] = l.data.split('-');
      const key = `${y}-${m}`;
      if (!map[key]) map[key] = { receitas: 0, despesas: 0 };
      if (l.tipo === 'receita') map[key].receitas += l.valor;
      else                       map[key].despesas += l.valor;
    }

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { receitas, despesas }]) => {
        const [y, m] = key.split('-').map(Number);
        return {
          mes: `${MESES[m - 1]}/${String(y).slice(2)}`,
          receitas,
          despesas,
          saldo: receitas - despesas,
        };
      });
  },
};
