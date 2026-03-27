import { useState, useEffect } from 'react';
import { Plus, ClipboardList, CheckCircle2, XCircle, Clock, Printer, Trash2, Play, X, ChevronDown, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { osService, type OrdemSuplemento, type OSItem, type NovaOS } from '../services/osService';
import { estoqueService, type SuppTypeWithEstoque } from '../services/estoqueService';

/* ── helpers ─────────────────────────────────────────────────────────── */

function fmtDate(d: string) {
  if (!d) return '—';
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}

function statusLabel(s: OrdemSuplemento['status']) {
  if (s === 'pendente')  return { text: 'Em Aberto', color: '#d97706', bg: 'rgba(217,119,6,0.10)' };
  if (s === 'executada') return { text: 'Executada', color: '#16a34a', bg: 'rgba(22,163,74,0.10)' };
  return                        { text: 'Cancelada', color: '#dc2626', bg: 'rgba(220,38,38,0.10)' };
}

/* ── Item vazio para o formulário ────────────────────────────────────── */
const newItemRow = (): Omit<OSItem, 'id' | 'os_id'> => ({
  pasto_id: null, pasto_nome: '', cocho: '',
  suplemento_id: null, suplemento_nome: '',
  sacos: 0, kg: null, quantidade_animais: null, periodo_dias: 1,
});

/* ══════════════════════════════════════════════════════════════════════ */

export function OS() {
  const { user, isAdmin } = useAuth();
  const { activeFarmId, pastures } = useData();
  const farmId = activeFarmId;

  const [ordens, setOrdens]           = useState<OrdemSuplemento[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<'pendente' | 'executada' | 'cancelada'>('pendente');
  const [supls, setSupls]             = useState<SuppTypeWithEstoque[]>([]);

  /* modais */
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState<OrdemSuplemento | null>(null);
  const [showCancel, setShowCancel]     = useState<OrdemSuplemento | null>(null);
  const [showDelete, setShowDelete]     = useState<OrdemSuplemento | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [submitting, setSubmitting]     = useState(false);

  /* ── guard admin ── */
  if (!isAdmin) return null;

  /* ── load ── */
  useEffect(() => {
    if (!farmId) return;
    setLoading(true);
    Promise.all([
      osService.listarOS(farmId),
      estoqueService.listarSuplementos(farmId),
    ])
      .then(([os, s]) => { setOrdens(os); setSupls(s); })
      .catch(() => toast.error('Erro ao carregar ordens'))
      .finally(() => setLoading(false));
  }, [farmId]);

  const filtered = ordens.filter(o => o.status === tab);

  /* ── ações ── */
  async function handleConfirm() {
    if (!showConfirm || !user) return;
    setSubmitting(true);
    try {
      await osService.confirmarExecucao(showConfirm, farmId, user.id);
      toast.success(`${showConfirm.numero} confirmada! Estoque e relatório atualizados.`);
      const updated = await osService.listarOS(farmId);
      setOrdens(updated);
      setShowConfirm(null);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Erro ao confirmar');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!showCancel || !cancelMotivo.trim()) return;
    setSubmitting(true);
    try {
      await osService.cancelarOS(showCancel.id, cancelMotivo.trim());
      toast.success(`${showCancel.numero} cancelada.`);
      const updated = await osService.listarOS(farmId);
      setOrdens(updated);
      setShowCancel(null);
      setCancelMotivo('');
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Erro ao cancelar');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!showDelete) return;
    setSubmitting(true);
    try {
      await osService.deletarOS(showDelete.id);
      toast.success(`${showDelete.numero} removida.`);
      setOrdens(prev => prev.filter(o => o.id !== showDelete!.id));
      setShowDelete(null);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Erro ao remover');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── PDF romaneio ── */
  function handlePrint(os: OrdemSuplemento) {
    const totalSacos = (os.itens ?? []).reduce((s, i) => s + i.sacos, 0);
    const totalKg    = (os.itens ?? []).reduce((s, i) => s + (i.kg ?? i.sacos * 25), 0);
    const totalAnim  = (os.itens ?? []).reduce((s, i) => s + (i.quantidade_animais ?? 0), 0);

    const rows = (os.itens ?? []).map(item => `
      <tr>
        <td>${item.pasto_nome}</td>
        <td>${item.cocho ?? '—'}</td>
        <td>${item.suplemento_nome}</td>
        <td style="text-align:center">${item.sacos.toFixed(1)}</td>
        <td style="text-align:center">${(item.kg ?? item.sacos * 25).toFixed(0)}</td>
        <td style="text-align:center">${item.quantidade_animais ?? '—'}</td>
        <td style="text-align:center">${item.periodo_dias}d</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${os.numero}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 24px; }
          .brand-bar { height: 6px; background: linear-gradient(90deg, #1a6040, #0b2748); border-radius: 3px; margin-bottom: 18px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
          .header h1 { font-size: 18px; font-weight: 700; color: #1a6040; }
          .header .meta { text-align: right; font-size: 11px; color: #555; line-height: 1.6; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
          .info-item label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; }
          .info-item p { font-size: 12px; font-weight: 600; color: #111; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          thead tr { background: #1a6040; color: #fff; }
          thead th { padding: 7px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
          thead th:nth-child(4), thead th:nth-child(5), thead th:nth-child(6), thead th:nth-child(7) { text-align: center; }
          tbody tr:nth-child(even) { background: #f9fafb; }
          tbody td { padding: 7px 10px; font-size: 11px; border-bottom: 1px solid #e5e7eb; }
          tfoot tr { background: #0f4a30; color: #fff; }
          tfoot td { padding: 7px 10px; font-size: 11px; font-weight: 700; }
          .totals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 24px; }
          .total-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px; text-align: center; }
          .total-box span { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #15803d; display: block; }
          .total-box strong { font-size: 16px; color: #14532d; }
          .sign-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 32px; }
          .sign-line { border-top: 1px solid #374151; padding-top: 8px; }
          .sign-line p { font-size: 10px; color: #6b7280; }
          .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; text-align: center; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        <div class="brand-bar"></div>
        <div class="header">
          <div>
            <h1>ORDEM DE SUPLEMENTO</h1>
            <p style="font-size:22px;font-weight:800;color:#0f4a30;letter-spacing:0.04em">${os.numero ?? '—'}</p>
          </div>
          <div class="meta">
            <strong>Emissão:</strong> ${fmtDate(os.data_emissao)}<br>
            ${os.data_prevista ? `<strong>Prevista:</strong> ${fmtDate(os.data_prevista)}<br>` : ''}
            <strong>Status:</strong> ${os.status.toUpperCase()}
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item"><label>Salgador</label><p>${os.salgador ?? '—'}</p></div>
          <div class="info-item"><label>Responsável</label><p>${os.responsavel ?? '—'}</p></div>
          ${os.observacoes ? `<div class="info-item"><label>Observações</label><p>${os.observacoes}</p></div>` : '<div></div>'}
        </div>
        <table>
          <thead>
            <tr>
              <th>Pasto</th>
              <th>Cocho</th>
              <th>Suplemento</th>
              <th>Sacos</th>
              <th>KG</th>
              <th>Animais</th>
              <th>Período</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="3"><strong>TOTAL</strong></td>
              <td style="text-align:center"><strong>${totalSacos.toFixed(1)}</strong></td>
              <td style="text-align:center"><strong>${totalKg.toFixed(0)}</strong></td>
              <td style="text-align:center"><strong>${totalAnim > 0 ? totalAnim : '—'}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        <div class="totals">
          <div class="total-box"><span>Total Sacos</span><strong>${totalSacos.toFixed(1)}</strong></div>
          <div class="total-box"><span>Total KG</span><strong>${totalKg.toFixed(0)}</strong></div>
          <div class="total-box"><span>Total Animais</span><strong>${totalAnim > 0 ? totalAnim : '—'}</strong></div>
        </div>
        <div class="sign-section">
          <div>
            <div class="sign-line">
              <p>Assinatura do salgador: <strong>${os.salgador ?? '___________________'}</strong></p>
            </div>
          </div>
          <div>
            <div class="sign-line">
              <p>Data de execução: ______/______/______</p>
            </div>
          </div>
        </div>
        <div class="footer">
          Suplemento Control — Movimento Pecuário | ${os.numero} | Gerado em ${new Date().toLocaleDateString('pt-BR')}
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (!win) { toast.error('Permita popups para imprimir'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }

  /* ─────────────────────────────────────────────── RENDER ─── */

  const tabConfig = [
    { key: 'pendente' as const,  label: 'Em Aberto',  icon: Clock,         count: ordens.filter(o => o.status === 'pendente').length  },
    { key: 'executada' as const, label: 'Executadas', icon: CheckCircle2,  count: ordens.filter(o => o.status === 'executada').length },
    { key: 'cancelada' as const, label: 'Canceladas', icon: XCircle,       count: ordens.filter(o => o.status === 'cancelada').length },
  ];

  return (
    <div className="p-4 md:p-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between gap-4 mb-8 flex-wrap no-print"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
            Gestão de Campo
          </p>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
            Ordens de Suplemento
          </h1>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
          style={{ boxShadow: '0 2px 10px rgba(26,96,64,0.25)' }}
        >
          <Plus className="w-4 h-4" />
          Nova OS
        </button>
      </motion.div>

      <div>
        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
          style={{ background: 'rgba(0,0,0,0.05)' }}>
          {tabConfig.map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={active
                  ? { background: '#1a6040', color: '#fff', boxShadow: '0 2px 8px rgba(26,96,64,0.3)' }
                  : { color: '#6b7280' }
                }
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                {t.count > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={active
                      ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                      : { background: 'rgba(0,0,0,0.08)', color: '#6b7280' }
                    }>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: '#e5e7eb' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(26,96,64,0.07)' }}>
              <ClipboardList className="w-8 h-8" style={{ color: '#1a6040' }} />
            </div>
            <p className="text-gray-500 font-medium">Nenhuma OS {tab === 'pendente' ? 'em aberto' : tab === 'executada' ? 'executada' : 'cancelada'}</p>
            {tab === 'pendente' && (
              <button
                onClick={() => setShowNew(true)}
                className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#1a6040' }}
              >
                Criar primeira OS
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(os => {
              const st = statusLabel(os.status);
              const totalSacos = (os.itens ?? []).reduce((s, i) => s + i.sacos, 0);
              const totalKg    = (os.itens ?? []).reduce((s, i) => s + (i.kg ?? i.sacos * 25), 0);
              const nItens     = (os.itens ?? []).length;
              return (
                <motion.div
                  key={os.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                >
                  <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
                    {/* Info principal */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: st.bg }}>
                        <ClipboardList className="w-5 h-5" style={{ color: st.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-bold text-gray-900">{os.numero ?? '—'}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: st.bg, color: st.color }}>
                            {st.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                          <span>Emissão: <strong className="text-gray-700">{fmtDate(os.data_emissao)}</strong></span>
                          {os.data_prevista && <span>Prevista: <strong className="text-gray-700">{fmtDate(os.data_prevista)}</strong></span>}
                          {os.salgador && <span>Salgador: <strong className="text-gray-700">{os.salgador}</strong></span>}
                        </div>
                        {os.motivo_cancelamento && (
                          <p className="text-xs text-red-500 mt-1">Motivo: {os.motivo_cancelamento}</p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Itens</p>
                        <p className="text-lg font-bold" style={{ color: '#1a6040' }}>{nItens}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Sacos</p>
                        <p className="text-lg font-bold" style={{ color: '#1a6040' }}>{totalSacos.toFixed(1)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400">KG</p>
                        <p className="text-lg font-bold text-gray-700">{totalKg.toFixed(0)}</p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrint(os)}
                        title="Imprimir romaneio"
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: '#6b7280' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(26,96,64,0.08)'; (e.currentTarget as HTMLElement).style.color = '#1a6040'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {os.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => setShowConfirm(os)}
                            title="Confirmar execução"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                            style={{ background: '#1a6040' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#0f4a30'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#1a6040'}
                          >
                            <Play className="w-3.5 h-3.5" />
                            Executar
                          </button>
                          <button
                            onClick={() => setShowCancel(os)}
                            title="Cancelar OS"
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#6b7280' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.08)'; (e.currentTarget as HTMLElement).style.color = '#dc2626'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDelete(os)}
                            title="Remover OS"
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#6b7280' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.08)'; (e.currentTarget as HTMLElement).style.color = '#dc2626'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Itens da OS — expandido */}
                  {(os.itens ?? []).length > 0 && (
                    <div style={{ borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                              {['Pasto', 'Cocho', 'Suplemento', 'Sacos', 'KG', 'Animais', 'Período'].map(h => (
                                <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-400 uppercase tracking-wide text-[10px]">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(os.itens ?? []).map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td className="px-4 py-2 font-medium text-gray-700">{item.pasto_nome}</td>
                                <td className="px-4 py-2 text-gray-500">{item.cocho || '—'}</td>
                                <td className="px-4 py-2 text-gray-700">{item.suplemento_nome}</td>
                                <td className="px-4 py-2 font-bold" style={{ color: '#1a6040' }}>{item.sacos.toFixed(1)}</td>
                                <td className="px-4 py-2 text-gray-600">{(item.kg ?? item.sacos * 25).toFixed(0)}</td>
                                <td className="px-4 py-2 text-gray-600">{item.quantidade_animais ?? '—'}</td>
                                <td className="px-4 py-2 text-gray-500">{item.periodo_dias}d</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal: Nova OS ── */}
      {showNew && (
        <NovaOSModal
          farmId={farmId}
          userId={user?.id ?? ''}
          userName={user?.name ?? ''}
          pastures={pastures}
          supls={supls}
          onClose={() => setShowNew(false)}
          onCreated={async () => {
            setShowNew(false);
            const updated = await osService.listarOS(farmId);
            setOrdens(updated);
            setTab('pendente');
          }}
        />
      )}

      {/* ── Modal: Confirmar execução ── */}
      {showConfirm && (
        <ModalOverlay onClose={() => setShowConfirm(null)}>
          <div className="w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(26,96,64,0.1)' }}>
                <Play className="w-5 h-5" style={{ color: '#1a6040' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Confirmar Execução</h2>
                <p className="text-sm text-gray-500">{showConfirm.numero}</p>
              </div>
            </div>
            <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(26,96,64,0.05)', border: '1px solid rgba(26,96,64,0.12)' }}>
              <p className="text-sm text-gray-700 font-medium mb-2">Ao confirmar, serão gerados automaticamente:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" style={{ color: '#1a6040' }} /> Saída no estoque para cada item</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" style={{ color: '#1a6040' }} /> Lançamento no relatório (data de hoje)</li>
              </ul>
            </div>
            <p className="text-sm text-amber-700 font-medium flex items-center gap-2 mb-5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600">
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: '#1a6040' }}
              >
                {submitting ? 'Confirmando...' : 'Confirmar Execução'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Modal: Cancelar OS ── */}
      {showCancel && (
        <ModalOverlay onClose={() => { setShowCancel(null); setCancelMotivo(''); }}>
          <div className="w-full max-w-md">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.1)' }}>
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Cancelar OS</h2>
                <p className="text-sm text-gray-500">{showCancel.numero}</p>
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo do cancelamento *</label>
            <textarea
              value={cancelMotivo}
              onChange={e => setCancelMotivo(e.target.value)}
              rows={3}
              placeholder="Descreva o motivo..."
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowCancel(null); setCancelMotivo(''); }} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600">
                Voltar
              </button>
              <button
                onClick={handleCancel}
                disabled={submitting || !cancelMotivo.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 disabled:opacity-50"
              >
                {submitting ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Modal: Deletar OS ── */}
      {showDelete && (
        <ModalOverlay onClose={() => setShowDelete(null)}>
          <div className="w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(220,38,38,0.1)' }}>
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Remover {showDelete.numero}?</h2>
            <p className="text-sm text-gray-500 mb-6">Esta OS será excluída permanentemente. Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600">Cancelar</button>
              <button onClick={handleDelete} disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 disabled:opacity-50">
                {submitting ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Modal Overlay genérico
══════════════════════════════════════════════════════════════════════ */
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full z-10 p-6"
        style={{ maxWidth: '560px' }}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Modal: Nova OS
══════════════════════════════════════════════════════════════════════ */
function NovaOSModal({
  farmId, userId, userName, pastures, supls, onClose, onCreated,
}: {
  farmId: string;
  userId: string;
  userName: string;
  pastures: { id: string; nome: string }[];
  supls: SuppTypeWithEstoque[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [dataEmissao, setDataEmissao]   = useState(today);
  const [dataPrevista, setDataPrevista] = useState('');
  const [responsavel, setResponsavel]   = useState(userName);
  const [salgador, setSalgador]         = useState('');
  const [observacoes, setObservacoes]   = useState('');
  const [itens, setItens]               = useState<Omit<OSItem, 'id' | 'os_id'>[]>([newItemRow()]);
  const [submitting, setSubmitting]     = useState(false);

  function updateItem(idx: number, patch: Partial<Omit<OSItem, 'id' | 'os_id'>>) {
    setItens(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, ...patch };
      // auto-calc kg = sacos × peso do suplemento (ou 25 por padrão)
      if ('sacos' in patch || 'suplemento_id' in patch) {
        const supl = supls.find(s => s.id === updated.suplemento_id);
        const peso = supl?.peso ?? 25;
        updated.kg = updated.sacos * peso;
      }
      // auto-fill suplemento_nome
      if ('suplemento_id' in patch) {
        const supl = supls.find(s => s.id === patch.suplemento_id);
        updated.suplemento_nome = supl?.nome ?? '';
      }
      // auto-fill pasto_nome
      if ('pasto_id' in patch) {
        const p = pastures.find(p => p.id === patch.pasto_id);
        updated.pasto_nome = p?.nome ?? '';
      }
      return updated;
    }));
  }

  function addItem() { setItens(prev => [...prev, newItemRow()]); }
  function removeItem(idx: number) { setItens(prev => prev.filter((_, i) => i !== idx)); }

  async function handleSubmit() {
    const validItens = itens.filter(i => i.pasto_nome && i.suplemento_nome && i.sacos > 0);
    if (validItens.length === 0) { toast.error('Adicione ao menos um item válido'); return; }

    setSubmitting(true);
    try {
      const payload: NovaOS = {
        farm_id:       farmId,
        data_emissao:  dataEmissao,
        data_prevista: dataPrevista || null,
        responsavel:   responsavel || null,
        salgador:      salgador || null,
        observacoes:   observacoes || null,
        created_by:    userId || null,
        itens:         validItens,
      };
      await osService.criarOS(payload);
      toast.success('OS criada com sucesso!');
      onCreated();
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Erro ao criar OS');
    } finally {
      setSubmitting(false);
    }
  }

  const totalSacos = itens.reduce((s, i) => s + (i.sacos || 0), 0);
  const totalKg    = itens.reduce((s, i) => s + (i.kg || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full z-10 flex flex-col"
        style={{ maxWidth: '760px', maxHeight: '90vh' }}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(26,96,64,0.1)' }}>
              <ClipboardList className="w-4.5 h-4.5" style={{ color: '#1a6040' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Nova Ordem de Suplemento</h2>
              <p className="text-xs text-gray-400">Numeração gerada automaticamente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body scrollável */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Cabeçalho da OS */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Data de Emissão *</label>
              <input type="date" value={dataEmissao} onChange={e => setDataEmissao(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Data Prevista</label>
              <input type="date" value={dataPrevista} onChange={e => setDataPrevista(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Responsável</label>
              <input type="text" value={responsavel} onChange={e => setResponsavel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Salgador</label>
              <input type="text" value={salgador} onChange={e => setSalgador(e.target.value)}
                placeholder="Nome do salgador"
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Observações</label>
              <input type="text" value={observacoes} onChange={e => setObservacoes(e.target.value)}
                placeholder="Observações gerais..."
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Itens da OS</label>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(26,96,64,0.08)', color: '#1a6040' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar item
              </button>
            </div>

            <div className="rounded-xl border overflow-hidden">
              {/* Header */}
              <div className="grid text-[10px] font-bold uppercase tracking-wide text-gray-400 px-3 py-2"
                style={{ gridTemplateColumns: '2fr 2fr 1fr 0.8fr 0.8fr 0.6fr 0.5fr', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <span>Pasto</span>
                <span>Suplemento</span>
                <span>Cocho</span>
                <span>Sacos</span>
                <span>KG</span>
                <span>Animais</span>
                <span></span>
              </div>

              {/* Linhas */}
              {itens.map((item, idx) => (
                <div
                  key={idx}
                  className="grid items-center gap-2 px-3 py-2"
                  style={{
                    gridTemplateColumns: '2fr 2fr 1fr 0.8fr 0.8fr 0.6fr 0.5fr',
                    borderBottom: idx < itens.length - 1 ? '1px solid #f3f4f6' : 'none',
                  }}
                >
                  {/* Pasto */}
                  <div className="relative">
                    <select
                      value={item.pasto_id ?? ''}
                      onChange={e => updateItem(idx, { pasto_id: e.target.value || null })}
                      className="w-full h-8 px-2 pr-7 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 appearance-none"
                    >
                      <option value="">Selecionar...</option>
                      {pastures.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-gray-400" />
                  </div>

                  {/* Suplemento */}
                  <div className="relative">
                    <select
                      value={item.suplemento_id ?? ''}
                      onChange={e => updateItem(idx, { suplemento_id: e.target.value || null })}
                      className="w-full h-8 px-2 pr-7 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 appearance-none"
                    >
                      <option value="">Selecionar...</option>
                      {supls.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-gray-400" />
                  </div>

                  {/* Cocho */}
                  <input
                    type="text"
                    value={item.cocho ?? ''}
                    onChange={e => updateItem(idx, { cocho: e.target.value })}
                    placeholder="C-01"
                    className="h-8 px-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 w-full"
                  />

                  {/* Sacos */}
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={item.sacos || ''}
                    onChange={e => updateItem(idx, { sacos: Number(e.target.value) })}
                    className="h-8 px-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 w-full text-center"
                  />

                  {/* KG (readonly) */}
                  <input
                    type="number"
                    value={item.kg != null ? item.kg.toFixed(0) : ''}
                    readOnly
                    className="h-8 px-2 rounded-lg text-xs w-full text-center"
                    style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid #e5e7eb', color: '#6b7280' }}
                  />

                  {/* Animais */}
                  <input
                    type="number"
                    min="0"
                    value={item.quantidade_animais ?? ''}
                    onChange={e => updateItem(idx, { quantidade_animais: e.target.value ? Number(e.target.value) : null })}
                    className="h-8 px-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 w-full text-center"
                  />

                  {/* Remover */}
                  <button
                    onClick={() => removeItem(idx)}
                    disabled={itens.length === 1}
                    className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors disabled:opacity-30"
                    style={{ color: '#6b7280' }}
                    onMouseEnter={e => { if (itens.length > 1) { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.08)'; (e.currentTarget as HTMLElement).style.color = '#dc2626'; } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Totais dos itens */}
            <div className="flex items-center justify-end gap-6 mt-3 px-3">
              <span className="text-xs text-gray-400">Total:</span>
              <span className="text-sm font-bold" style={{ color: '#1a6040' }}>{totalSacos.toFixed(1)} sacos</span>
              <span className="text-sm font-semibold text-gray-600">{totalKg.toFixed(0)} kg</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#1a6040' }}
          >
            {submitting ? 'Criando...' : 'Criar OS'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
