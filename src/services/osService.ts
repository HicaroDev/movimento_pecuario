import { supabaseAdmin } from '../lib/supabase';

/* ── Types ── */

export interface OSItem {
  id?: string;
  os_id?: string;
  pasto_id?: string | null;
  pasto_nome: string;
  cocho?: string | null;
  suplemento_id?: string | null;
  suplemento_nome: string;
  sacos: number;
  kg?: number | null;
  quantidade_animais?: number | null;
  periodo_dias: number;
  executado?: boolean;
}

export interface OrdemSuplemento {
  id: string;
  farm_id: string;
  numero?: string | null;
  data_emissao: string;          // YYYY-MM-DD
  data_prevista?: string | null;
  responsavel?: string | null;
  salgador?: string | null;
  status: 'pendente' | 'executada' | 'cancelada';
  motivo_cancelamento?: string | null;
  observacoes?: string | null;
  created_at: string;
  created_by?: string | null;
  itens?: OSItem[];
}

export type NovaOS = Omit<OrdemSuplemento, 'id' | 'created_at' | 'numero' | 'status'> & {
  itens: Omit<OSItem, 'id' | 'os_id'>[];
};

/* ── Helpers ── */

function rowToOS(row: Record<string, unknown>, itens: OSItem[] = []): OrdemSuplemento {
  return {
    id:                   row.id as string,
    farm_id:              row.farm_id as string,
    numero:               (row.numero as string) ?? null,
    data_emissao:         row.data_emissao as string,
    data_prevista:        (row.data_prevista as string) ?? null,
    responsavel:          (row.responsavel as string) ?? null,
    salgador:             (row.salgador as string) ?? null,
    status:               (row.status as OrdemSuplemento['status']),
    motivo_cancelamento:  (row.motivo_cancelamento as string) ?? null,
    observacoes:          (row.observacoes as string) ?? null,
    created_at:           row.created_at as string,
    created_by:           (row.created_by as string) ?? null,
    itens,
  };
}

function rowToItem(row: Record<string, unknown>): OSItem {
  return {
    id:                 row.id as string,
    os_id:              row.os_id as string,
    pasto_id:           (row.pasto_id as string) ?? null,
    pasto_nome:         row.pasto_nome as string,
    cocho:              (row.cocho as string) ?? null,
    suplemento_id:      (row.suplemento_id as string) ?? null,
    suplemento_nome:    row.suplemento_nome as string,
    sacos:              Number(row.sacos ?? 0),
    kg:                 row.kg != null ? Number(row.kg) : null,
    quantidade_animais: row.quantidade_animais != null ? Number(row.quantidade_animais) : null,
    periodo_dias:       Number(row.periodo_dias ?? 1),
    executado:          Boolean(row.executado),
  };
}

/* ── Queries ── */

/** Lista todas as OS de uma fazenda, com itens incluídos */
export async function listarOS(farmId: string): Promise<OrdemSuplemento[]> {
  const { data, error } = await supabaseAdmin
    .from('ordens_suplemento')
    .select('*, ordens_suplemento_itens(*)')
    .eq('farm_id', farmId)
    .order('data_emissao', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => {
    const rawItens = (row.ordens_suplemento_itens as Record<string, unknown>[]) ?? [];
    return rowToOS(row, rawItens.map(rowToItem));
  });
}

/** Busca uma OS pelo ID com itens */
export async function buscarOS(id: string): Promise<OrdemSuplemento | null> {
  const { data, error } = await supabaseAdmin
    .from('ordens_suplemento')
    .select('*, ordens_suplemento_itens(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const rawItens = (data.ordens_suplemento_itens as Record<string, unknown>[]) ?? [];
  return rowToOS(data as Record<string, unknown>, rawItens.map(rowToItem));
}

/** Gera numeração OS-YYYY-NNN via função SQL */
async function gerarNumero(farmId: string): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc('generate_os_numero', { p_farm_id: farmId });
  if (error) {
    // Fallback client-side
    const year = new Date().getFullYear();
    const { count } = await supabaseAdmin
      .from('ordens_suplemento')
      .select('id', { count: 'exact', head: true })
      .eq('farm_id', farmId);
    const n = ((count ?? 0) + 1).toString().padStart(3, '0');
    return `OS-${year}-${n}`;
  }
  return data as string;
}

/** Cria uma nova OS com itens */
export async function criarOS(payload: NovaOS): Promise<OrdemSuplemento> {
  const numero = await gerarNumero(payload.farm_id);

  const { data: osRow, error: osErr } = await supabaseAdmin
    .from('ordens_suplemento')
    .insert({
      farm_id:       payload.farm_id,
      numero,
      data_emissao:  payload.data_emissao,
      data_prevista: payload.data_prevista ?? null,
      responsavel:   payload.responsavel ?? null,
      salgador:      payload.salgador ?? null,
      observacoes:   payload.observacoes ?? null,
      status:        'pendente',
      created_by:    payload.created_by ?? null,
    })
    .select()
    .single();

  if (osErr || !osRow) throw osErr ?? new Error('Erro ao criar OS');

  if (payload.itens.length > 0) {
    const itensPayload = payload.itens.map(item => ({
      os_id:             osRow.id,
      pasto_id:          item.pasto_id ?? null,
      pasto_nome:        item.pasto_nome,
      cocho:             item.cocho ?? null,
      suplemento_id:     item.suplemento_id ?? null,
      suplemento_nome:   item.suplemento_nome,
      sacos:             item.sacos,
      kg:                item.kg ?? null,
      quantidade_animais: item.quantidade_animais ?? null,
      periodo_dias:      item.periodo_dias,
      executado:         false,
    }));

    const { error: itensErr } = await supabaseAdmin
      .from('ordens_suplemento_itens')
      .insert(itensPayload);

    if (itensErr) throw itensErr;
  }

  return buscarOS(osRow.id) as Promise<OrdemSuplemento>;
}

/** Atualiza cabeçalho da OS (apenas pendente) */
export async function atualizarOS(
  id: string,
  patch: Partial<Pick<OrdemSuplemento, 'data_prevista' | 'responsavel' | 'salgador' | 'observacoes'>>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('ordens_suplemento')
    .update(patch)
    .eq('id', id)
    .eq('status', 'pendente');
  if (error) throw error;
}

/**
 * Confirma execução da OS:
 * 1. Saída no estoque para cada item
 * 2. Lançamento em data_entries para cada item
 * 3. Auto-despesa no livro_caixa (por item com valor_kg cadastrado)
 * 4. Marca itens como executados + status 'executada'
 */
export async function confirmarExecucao(
  os: OrdemSuplemento,
  farmId: string,
  userId: string
): Promise<void> {
  const dataExec = new Date().toISOString().slice(0, 10);
  const itens = os.itens ?? [];

  // 1. Saídas no estoque
  if (itens.length > 0) {
    const { error } = await supabaseAdmin
      .from('estoque_movimentos')
      .insert(itens.map(item => ({
        farm_id:         farmId,
        tipo:            'saida',
        suplemento_id:   item.suplemento_id ?? null,
        suplemento_nome: item.suplemento_nome,
        data:            dataExec,
        sacos:           item.sacos,
        kg:              item.kg ?? item.sacos * 25,
        os_id:           os.id,
        observacoes:     `OS ${os.numero} — ${item.pasto_nome}`,
        created_by:      userId,
      })));
    if (error) throw error;
  }

  // 2. Lançamentos em data_entries
  if (itens.length > 0) {
    const { error } = await supabaseAdmin
      .from('data_entries')
      .insert(itens.map(item => ({
        farm_id:    farmId,
        data:       dataExec,
        pasto_nome: item.pasto_nome,
        suplemento: item.suplemento_nome,
        quantidade: item.quantidade_animais ?? 0,
        periodo:    item.periodo_dias,
        sacos:      item.sacos,
        kg:         item.kg ?? item.sacos * 25,
        consumo:    item.quantidade_animais && item.quantidade_animais > 0
                      ? ((item.kg ?? item.sacos * 25) / item.quantidade_animais / item.periodo_dias)
                      : 0,
        os_id:      os.id,
      })));
    if (error) throw error;
  }

  // 3. Auto-despesa no livro_caixa — por item com valor_kg conhecido
  if (itens.length > 0) {
    // Busca valor_kg dos suplementos (supplement_types da fazenda)
    const { data: suppTypes } = await supabaseAdmin
      .from('supplement_types')
      .select('id, nome, valor_kg, peso')
      .eq('farm_id', farmId);

    const suppMap = new Map<string, { valor_kg: number | null; peso: number }>(
      (suppTypes ?? []).map(s => [
        s.id as string,
        { valor_kg: s.valor_kg as number | null, peso: (s.peso as number) ?? 25 },
      ])
    );

    const caixaPayload = itens
      .map(item => {
        const supl = item.suplemento_id ? suppMap.get(item.suplemento_id) : null;
        const valorKg = supl?.valor_kg ?? null;
        if (!valorKg || valorKg <= 0) return null;
        const kg = item.kg ?? item.sacos * (supl?.peso ?? 25);
        const valor = kg * valorKg;
        return {
          farm_id:    farmId,
          tipo:       'despesa',
          categoria:  'Compra de suplemento',
          descricao:  `OS ${os.numero} — ${item.suplemento_nome} (${item.pasto_nome})`,
          valor,
          data:       dataExec,
          referencia: os.numero ?? null,
          origem:     'os',
          os_id:      os.id,
          created_by: userId,
        };
      })
      .filter(Boolean);

    if (caixaPayload.length > 0) {
      await supabaseAdmin.from('livro_caixa').insert(caixaPayload);
      // Silencioso — não lança erro se caixa falhar (tabela pode não existir ainda)
    }
  }

  // 4. Marcar itens como executados
  const { error: itemErr } = await supabaseAdmin
    .from('ordens_suplemento_itens')
    .update({ executado: true })
    .eq('os_id', os.id);
  if (itemErr) throw itemErr;

  // 5. Status da OS
  const { error: osErr } = await supabaseAdmin
    .from('ordens_suplemento')
    .update({ status: 'executada' })
    .eq('id', os.id);
  if (osErr) throw osErr;
}

/** Cancela uma OS com motivo */
export async function cancelarOS(id: string, motivo: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('ordens_suplemento')
    .update({ status: 'cancelada', motivo_cancelamento: motivo })
    .eq('id', id)
    .eq('status', 'pendente');
  if (error) throw error;
}

/** Remove uma OS (somente pendente) */
export async function deletarOS(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('ordens_suplemento')
    .delete()
    .eq('id', id)
    .eq('status', 'pendente');
  if (error) throw error;
}

export const osService = {
  listarOS,
  buscarOS,
  criarOS,
  atualizarOS,
  confirmarExecucao,
  cancelarOS,
  deletarOS,
};
