import { supabaseAdmin } from '../lib/supabase';
import { estoqueService } from './estoqueService';

/* ── Types ── */
export interface SolicitacaoCompra {
  id: string;
  farm_id: string;
  numero: string;
  suplemento_nome: string;
  suplemento_id?: string | null;
  sacos: number;
  kg?: number | null;
  fornecedor?: string | null;
  observacoes?: string | null;
  status: 'pendente' | 'aprovada' | 'recebida' | 'cancelada';
  motivo_cancelamento?: string | null;
  created_at: string;
  created_by?: string | null;
  recebido_at?: string | null;
  recebido_by?: string | null;
}

export type NovaSolicitacao = {
  farmId: string;
  suplementoNome: string;
  suplementoId?: string;
  sacos: number;
  kg?: number;
  fornecedor?: string;
  observacoes?: string;
  createdBy?: string;
};

function toSolicitacao(row: Record<string, unknown>): SolicitacaoCompra {
  return {
    id:                  row.id as string,
    farm_id:             row.farm_id as string,
    numero:              row.numero as string,
    suplemento_nome:     row.suplemento_nome as string,
    suplemento_id:       (row.suplemento_id as string) ?? null,
    sacos:               Number(row.sacos),
    kg:                  row.kg != null ? Number(row.kg) : null,
    fornecedor:          (row.fornecedor as string) ?? null,
    observacoes:         (row.observacoes as string) ?? null,
    status:              row.status as SolicitacaoCompra['status'],
    motivo_cancelamento: (row.motivo_cancelamento as string) ?? null,
    created_at:          row.created_at as string,
    created_by:          (row.created_by as string) ?? null,
    recebido_at:         (row.recebido_at as string) ?? null,
    recebido_by:         (row.recebido_by as string) ?? null,
  };
}

async function gerarNumero(farmId: string): Promise<string> {
  const ano = new Date().getFullYear();
  const { count } = await supabaseAdmin
    .from('solicitacoes_compra')
    .select('id', { count: 'exact', head: true })
    .eq('farm_id', farmId)
    .like('numero', `SOL-${ano}-%`);
  const seq = String((count ?? 0) + 1).padStart(3, '0');
  return `SOL-${ano}-${seq}`;
}

/* ── Service ── */
export const solicitacaoService = {

  async listar(farmId: string): Promise<SolicitacaoCompra[]> {
    const { data, error } = await supabaseAdmin
      .from('solicitacoes_compra')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(r => toSolicitacao(r as Record<string, unknown>));
  },

  async criar(payload: NovaSolicitacao): Promise<SolicitacaoCompra> {
    const numero = await gerarNumero(payload.farmId);
    const { data, error } = await supabaseAdmin
      .from('solicitacoes_compra')
      .insert({
        farm_id:         payload.farmId,
        numero,
        suplemento_nome: payload.suplementoNome,
        suplemento_id:   payload.suplementoId ?? null,
        sacos:           payload.sacos,
        kg:              payload.kg ?? null,
        fornecedor:      payload.fornecedor ?? null,
        observacoes:     payload.observacoes ?? null,
        status:          'pendente',
        created_by:      payload.createdBy ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toSolicitacao(data as Record<string, unknown>);
  },

  async aprovar(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('solicitacoes_compra')
      .update({ status: 'aprovada' })
      .eq('id', id)
      .eq('status', 'pendente');
    if (error) throw new Error(error.message);
  },

  async receber(
    sol: SolicitacaoCompra,
    farmId: string,
    userId: string,
  ): Promise<void> {
    const hoje = new Date().toISOString().split('T')[0];
    // Cria entrada no estoque
    await estoqueService.adicionarEntrada({
      farmId,
      suplementoId:    sol.suplemento_id ?? undefined,
      suplementoNome:  sol.suplemento_nome,
      data:            hoje,
      sacos:           sol.sacos,
      kg:              sol.kg ?? sol.sacos * 25,
      fornecedor:      sol.fornecedor ?? undefined,
      observacoes:     `Recebido via pedido ${sol.numero}`,
      createdBy:       userId,
    });
    // Marca como recebida
    const { error } = await supabaseAdmin
      .from('solicitacoes_compra')
      .update({
        status:      'recebida',
        recebido_at: new Date().toISOString(),
        recebido_by: userId,
      })
      .eq('id', sol.id);
    if (error) throw new Error(error.message);
  },

  async cancelar(id: string, motivo: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('solicitacoes_compra')
      .update({ status: 'cancelada', motivo_cancelamento: motivo })
      .eq('id', id)
      .in('status', ['pendente', 'aprovada']);
    if (error) throw new Error(error.message);
  },

  async deletar(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('solicitacoes_compra')
      .delete()
      .eq('id', id)
      .eq('status', 'pendente');
    if (error) throw new Error(error.message);
  },
};
