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
  prenha?: boolean;
  bezerros_quantidade?: number;
  bezerros_peso_medio?: number;
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
  pasto_origem?: string;
  pasto_destino?: string;
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
    peso_medio:          (row.peso_medio as number) ?? undefined,
    sexo:                (row.sexo as string) ?? undefined,
    prenha:              (row.prenha as boolean) ?? false,
    bezerros_quantidade: (row.bezerros_quantidade as number) ?? undefined,
    bezerros_peso_medio: (row.bezerros_peso_medio as number) ?? undefined,
    observacoes:         (row.observacoes as string) ?? undefined,
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
    id:            row.id as string,
    farm_id:       row.farm_id as string,
    animal_id:     row.animal_id as string,
    tipo:          row.tipo as string,
    descricao:     (row.descricao as string) ?? undefined,
    quantidade:    (row.quantidade as number) ?? undefined,
    peso_medio:    (row.peso_medio as number) ?? undefined,
    pasto_origem:  (row.pasto_origem as string) ?? undefined,
    pasto_destino: (row.pasto_destino as string) ?? undefined,
    created_at:    row.created_at as string,
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
    data?: string,
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('animals')
      .update({ pasto_id: pastoId })
      .eq('id', animal.id);
    if (error) throw new Error(error.message);

    const acao    = pastoId ? `alocado em ${pastoNome}` : 'removido do pasto';
    const dataStr = data ? ` · ${new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}` : '';
    await insertHistorico({
      farm_id:       animal.farm_id,
      animal_id:     animal.id,
      tipo:          'alocacao',
      descricao:     `Lote "${animal.nome}" ${acao}${dataStr}`,
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
    data?: string,
    bezPesoMedio?: number,
  ): Promise<void> {
    const ids = animals.map(a => a.id);
    const patch: Record<string, unknown> = { categoria_id: novaCategoriaId };
    if (pesoMedio) patch.peso_medio = pesoMedio;

    const { error } = await supabaseAdmin
      .from('animals')
      .update(patch)
      .in('id', ids);

    // Atualiza peso dos bezerros apenas nos lotes que têm bezerros
    if (bezPesoMedio) {
      const idsComBez = animals.filter(a => (a.bezerros_quantidade ?? 0) > 0).map(a => a.id);
      if (idsComBez.length > 0) {
        await supabaseAdmin.from('animals').update({ bezerros_peso_medio: bezPesoMedio }).in('id', idsComBez);
      }
    }
    if (error) throw new Error(error.message);

    const totalCab   = animals.reduce((s, a) => s + a.quantidade, 0);
    const nomesLotes = animals.map(a => `"${a.nome}"`).join(', ');
    const dataStr    = data ? ` · ${new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}` : '';
    await Promise.all(animals.map(a =>
      insertHistorico({
        farm_id:           a.farm_id,
        animal_id:         a.id,
        tipo:              'evolucao_categoria',
        descricao:         `${nomesLotes}: ${categoriaOrigemNome} → ${categoriaDestinoNome} (${totalCab} cab.)${dataStr}`,
        categoria_origem:  a.categoria_id ?? null,
        categoria_destino: novaCategoriaId,
        quantidade:        a.quantidade,
        peso_medio:        pesoMedio ?? null,
      })
    ));
  },

  async registrarSaida(
    animal: Animal,
    quantidade: number,
    tipoSaida: 'abate' | 'venda',
    pesoMedio?: number,
    data?: string,
    obs?: string,
  ): Promise<void> {
    const novaQtd = animal.quantidade - quantidade;
    const patch: Record<string, unknown> = { quantidade: novaQtd };
    if (novaQtd <= 0) patch.status = tipoSaida === 'venda' ? 'vendido' : 'abatido';

    const { error } = await supabaseAdmin
      .from('animals')
      .update(patch)
      .eq('id', animal.id);
    if (error) throw new Error(error.message);

    const encerrado = novaQtd <= 0 ? ' — lote encerrado' : '';
    const dataStr   = data ? ` · ${new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}` : '';
    const prefixo   = tipoSaida === 'venda' ? 'Venda' : 'Abate';
    await insertHistorico({
      farm_id:    animal.farm_id,
      animal_id:  animal.id,
      tipo:       tipoSaida,
      descricao:  `${prefixo}: ${quantidade} cab. do lote "${animal.nome}"${pesoMedio ? ` · ${pesoMedio} kg` : ''}${dataStr}${obs ? ` · ${obs}` : ''}${encerrado}`,
      quantidade,
      peso_medio: pesoMedio ?? null,
    });
  },

  /** Mantido por compatibilidade com histórico antigo */
  async registrarAbate(
    animal: Animal,
    quantidade: number,
    pesoMedio?: number,
    data?: string,
    obs?: string,
  ): Promise<void> {
    return manejoService.registrarSaida(animal, quantidade, 'abate', pesoMedio, data, obs);
  },

  async desagruparLote(params: {
    loteOrigem: Animal;
    qtd: number;
    pesoMedio?: number;
    data?: string;
    destino: { tipo: 'existente'; loteId: string } | { tipo: 'novo'; nome: string; categoriaId?: string };
    farmId: string;
    loteDestinoNome?: string;
  }): Promise<void> {
    const { loteOrigem, qtd, pesoMedio, data, destino, farmId, loteDestinoNome } = params;

    // Reduz quantidade do lote de origem
    const novaQtd = loteOrigem.quantidade - qtd;
    const { error: errUpd } = await supabaseAdmin
      .from('animals')
      .update({ quantidade: novaQtd })
      .eq('id', loteOrigem.id);
    if (errUpd) throw new Error(errUpd.message);

    const dataStr = data ? ` · ${new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}` : '';
    let descrDestino = '';

    if (destino.tipo === 'existente') {
      const { data: loteAtual, error: errLer } = await supabaseAdmin
        .from('animals').select('quantidade').eq('id', destino.loteId).single();
      if (errLer) throw new Error(errLer.message);
      const { error } = await supabaseAdmin
        .from('animals')
        .update({ quantidade: (loteAtual.quantidade as number) + qtd })
        .eq('id', destino.loteId);
      if (error) throw new Error(error.message);
      descrDestino = `agregados ao lote "${loteDestinoNome ?? destino.loteId}"`;
    } else {
      const { error } = await supabaseAdmin.from('animals').insert({
        farm_id:      farmId,
        nome:         destino.nome,
        quantidade:   qtd,
        categoria_id: destino.categoriaId ?? null,
        peso_medio:   pesoMedio ?? null,
        pasto_id:     loteOrigem.pasto_id ?? null,
        status:       'ativo',
      });
      if (error) throw new Error(error.message);
      descrDestino = `novo lote "${destino.nome}" criado`;
    }

    await insertHistorico({
      farm_id:    farmId,
      animal_id:  loteOrigem.id,
      tipo:       'desagrupamento',
      descricao:  `Desagrupamento: ${qtd} cab. do lote "${loteOrigem.nome}"${pesoMedio ? ` · ${pesoMedio} kg` : ''}${dataStr} — ${descrDestino}`,
      quantidade: qtd,
      peso_medio: pesoMedio ?? null,
    });
  },

  async registrarParicao(params: {
    loteMae: Animal;
    qtdPartos: number;
    pesoMedio?: number;
    data?: string;
    destino: { tipo: 'existente'; loteId: string } | { tipo: 'novo'; nome: string; categoriaId?: string };
    farmId: string;
    loteDestinoNome?: string;
  }): Promise<void> {
    const { loteMae, qtdPartos, pesoMedio, data, destino, farmId, loteDestinoNome } = params;
    const dataStr = data ? ` · ${new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}` : '';
    let descrDestino = '';

    if (destino.tipo === 'existente') {
      const { data: loteAtual, error: errLer } = await supabaseAdmin
        .from('animals').select('quantidade').eq('id', destino.loteId).single();
      if (errLer) throw new Error(errLer.message);
      const { error } = await supabaseAdmin
        .from('animals')
        .update({ quantidade: (loteAtual.quantidade as number) + qtdPartos })
        .eq('id', destino.loteId);
      if (error) throw new Error(error.message);
      descrDestino = `agregados ao lote "${loteDestinoNome ?? destino.loteId}"`;
    } else {
      const { error } = await supabaseAdmin.from('animals').insert({
        farm_id:      farmId,
        nome:         destino.nome,
        quantidade:   qtdPartos,
        categoria_id: destino.categoriaId ?? null,
        peso_medio:   pesoMedio ?? null,
        pasto_id:     loteMae.pasto_id ?? null,
        status:       'ativo',
      });
      if (error) throw new Error(error.message);
      descrDestino = `novo lote "${destino.nome}" criado`;
    }

    await insertHistorico({
      farm_id:    farmId,
      animal_id:  loteMae.id,
      tipo:       'paricao',
      descricao:  `Parição: ${qtdPartos} bezerro(s) do lote "${loteMae.nome}"${pesoMedio ? ` · ${pesoMedio} kg` : ''}${dataStr} — ${descrDestino}`,
      quantidade: qtdPartos,
      peso_medio: pesoMedio ?? null,
    });
  },

  async manejarBezerros(params: {
    loteOrigem: Animal;
    qtdBezerros: number;
    pesoMedio?: number;
    data?: string;
    destino: { tipo: 'existente'; loteId: string } | { tipo: 'novo'; nome: string; categoriaId?: string };
    farmId: string;
    loteDestinoNome?: string;
  }): Promise<void> {
    const { loteOrigem, qtdBezerros, pesoMedio, data, destino, farmId, loteDestinoNome } = params;
    const dataStr = data ? ` · ${new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}` : '';
    let descrDestino = '';

    if (destino.tipo === 'existente') {
      const { data: loteAtual, error: errLer } = await supabaseAdmin
        .from('animals').select('quantidade').eq('id', destino.loteId).single();
      if (errLer) throw new Error(errLer.message);
      const { error } = await supabaseAdmin
        .from('animals')
        .update({ quantidade: (loteAtual.quantidade as number) + qtdBezerros })
        .eq('id', destino.loteId);
      if (error) throw new Error(error.message);
      descrDestino = `agregados ao lote "${loteDestinoNome ?? destino.loteId}"`;
    } else {
      const { error } = await supabaseAdmin.from('animals').insert({
        farm_id:      farmId,
        nome:         destino.nome,
        quantidade:   qtdBezerros,
        categoria_id: destino.categoriaId ?? null,
        peso_medio:   pesoMedio ?? null,
        pasto_id:     loteOrigem.pasto_id ?? null,
        status:       'ativo',
      });
      if (error) throw new Error(error.message);
      descrDestino = `novo lote "${destino.nome}" criado`;
    }

    // Reduz (ou zera) bezerros_quantidade no lote de origem
    const bezRestantes = (loteOrigem.bezerros_quantidade ?? 0) - qtdBezerros;
    await supabaseAdmin.from('animals').update({
      bezerros_quantidade: bezRestantes > 0 ? bezRestantes : null,
      bezerros_peso_medio: bezRestantes > 0 ? (loteOrigem.bezerros_peso_medio ?? null) : null,
    }).eq('id', loteOrigem.id);

    await insertHistorico({
      farm_id:    farmId,
      animal_id:  loteOrigem.id,
      tipo:       'manejo_bezerros',
      descricao:  `Bezerros: ${qtdBezerros} cab. do lote "${loteOrigem.nome}"${pesoMedio ? ` · ${pesoMedio} kg` : ''}${dataStr} — ${descrDestino}`,
      quantidade: qtdBezerros,
      peso_medio: pesoMedio ?? null,
    });
  },

  /** Funde 2+ lotes em um só. O primeiro lote recebe o novo nome e a quantidade total.
   *  Os demais lotes são marcados como inativo. */
  async fundirLotes(
    lots: Animal[],
    novoNome: string,
    farmId: string,
    data?: string,
  ): Promise<void> {
    if (lots.length < 2) throw new Error('Selecione pelo menos 2 lotes para fundir.');
    const [primary, ...others] = lots;
    const totalQtd = lots.reduce((s, a) => s + a.quantidade, 0);
    const totalBez = lots.reduce((s, a) => s + (a.bezerros_quantidade ?? 0), 0);

    const { error: errPrimary } = await supabaseAdmin.from('animals').update({
      nome:               novoNome,
      quantidade:         totalQtd,
      bezerros_quantidade: totalBez > 0 ? totalBez : null,
    }).eq('id', primary.id);
    if (errPrimary) throw new Error(errPrimary.message);

    const otherIds = others.map(a => a.id);
    const { error: errOthers } = await supabaseAdmin.from('animals')
      .update({ status: 'inativo' }).in('id', otherIds);
    if (errOthers) throw new Error(errOthers.message);

    const dataStr    = data ? ` · ${new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}` : '';
    const nomesOrig  = lots.map(a => `"${a.nome}"`).join(' + ');
    await insertHistorico({
      farm_id:    farmId,
      animal_id:  primary.id,
      tipo:       'fusao',
      descricao:  `Fusão: ${nomesOrig} → "${novoNome}" (${totalQtd} cab.)${dataStr}`,
      quantidade: totalQtd,
    });
  },

  /** Transfere parte da quantidade de um lote para outro (sem mudar pasto). */
  async transferirParcial(
    origem: Animal,
    destino: Animal,
    qtd: number,
    farmId: string,
    data?: string,
  ): Promise<void> {
    if (qtd <= 0) throw new Error('Quantidade inválida.');
    if (qtd > origem.quantidade) throw new Error(`Quantidade maior que o disponível no lote (${origem.quantidade} cab.).`);

    const { error: e1 } = await supabaseAdmin.from('animals')
      .update({ quantidade: origem.quantidade - qtd }).eq('id', origem.id);
    if (e1) throw new Error(e1.message);

    const { error: e2 } = await supabaseAdmin.from('animals')
      .update({ quantidade: destino.quantidade + qtd }).eq('id', destino.id);
    if (e2) throw new Error(e2.message);

    const dataStr = data ? ` · ${new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}` : '';
    await insertHistorico({
      farm_id:    farmId,
      animal_id:  origem.id,
      tipo:       'transf_parcial',
      descricao:  `${qtd} cab. transferidas de "${origem.nome}" → "${destino.nome}"${dataStr}`,
      quantidade: qtd,
    });
  },

  /** Transfere parcialmente para um PASTO de destino (cria novo lote ou agrega em lote existente). */
  async transferirParcialParaPasto(params: {
    origem: Animal;
    qtd: number;
    destPastoId: string;
    destPastoNome: string;
    farmId: string;
    data?: string;
    mergeLoteId?: string;
    mergeLoteNome?: string;
    mergeLoteQtd?: number;
    novoLoteNome?: string;
  }): Promise<void> {
    const { origem, qtd, destPastoId, destPastoNome, farmId, data, mergeLoteId, mergeLoteNome, mergeLoteQtd, novoLoteNome } = params;
    if (qtd <= 0) throw new Error('Quantidade inválida.');
    if (qtd > origem.quantidade) throw new Error(`Quantidade maior que o disponível no lote (${origem.quantidade} cab.).`);

    // Deduz do lote de origem
    const { error: e1 } = await supabaseAdmin.from('animals')
      .update({ quantidade: origem.quantidade - qtd }).eq('id', origem.id);
    if (e1) throw new Error(e1.message);

    const dataStr = data ? ` · ${new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')}` : '';
    let descrDest: string;

    if (mergeLoteId) {
      // Agrega em lote existente no pasto destino
      const { error: e2 } = await supabaseAdmin.from('animals')
        .update({ quantidade: (mergeLoteQtd ?? 0) + qtd }).eq('id', mergeLoteId);
      if (e2) throw new Error(e2.message);
      descrDest = `agregados ao lote "${mergeLoteNome ?? mergeLoteId}" no pasto ${destPastoNome}`;
    } else {
      // Cria novo lote no pasto destino
      const { error: e2 } = await supabaseAdmin.from('animals').insert({
        farm_id:     farmId,
        nome:        novoLoteNome ?? `${origem.nome} (parcial)`,
        quantidade:  qtd,
        categoria_id: origem.categoria_id ?? null,
        peso_medio:  origem.peso_medio ?? null,
        raca:        origem.raca ?? null,
        sexo:        origem.sexo ?? null,
        pasto_id:    destPastoId,
        status:      'ativo',
      });
      if (e2) throw new Error(e2.message);
      descrDest = `novo lote "${novoLoteNome ?? origem.nome}" criado no pasto ${destPastoNome}`;
    }

    await insertHistorico({
      farm_id:    farmId,
      animal_id:  origem.id,
      tipo:       'transf_parcial',
      descricao:  `${qtd} cab. de "${origem.nome}" → ${descrDest}${dataStr}`,
      quantidade: qtd,
    });
  },

  async listarHistorico(farmId: string, tipo?: string | string[], limit = 30): Promise<ManejoEvent[]> {
    let q = supabaseAdmin
      .from('manejo_historico')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (Array.isArray(tipo)) {
      q = q.in('tipo', tipo);
    } else if (tipo) {
      q = q.eq('tipo', tipo);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map(toEvent);
  },
};
