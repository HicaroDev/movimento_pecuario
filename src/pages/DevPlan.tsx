import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { motion } from 'motion/react';
import { ClipboardList, RefreshCw, Lock, Send, MessageSquare, Reply } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabaseAdmin } from '../lib/supabase';

interface NavEntry {
  file: string;
  title: string;
  icon: string;
}

interface Comment {
  id: string;
  file: string;
  comment: string;
  author_name: string;
  author_role: string;
  lido: boolean;
  created_at: string;
}

marked.setOptions({ breaks: true });

function checksKey(file: string) {
  return `devplan_checks_${file}`;
}
function loadChecks(file: string): Record<number, boolean> {
  try { return JSON.parse(localStorage.getItem(checksKey(file)) ?? '{}'); } catch { return {}; }
}
function saveChecks(file: string, checks: Record<number, boolean>) {
  localStorage.setItem(checksKey(file), JSON.stringify(checks));
}

export function DevPlan() {
  const { isAdmin, user } = useAuth();
  const farmId = user?.farmId ?? '';

  const [nav, setNav]           = useState<NavEntry[]>([]);
  const [active, setActive]     = useState<string>('');
  const [rawMd, setRawMd]       = useState<string>('');
  const [loading, setLoading]   = useState(true);
  const [lastMod, setLastMod]   = useState<string>('');
  const [checks, setChecks]     = useState<Record<number, boolean>>({});
  const contentRef              = useRef<HTMLDivElement>(null);

  // Comentários
  const [comments, setComments]     = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending]       = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [modalText, setModalText]   = useState('');

  /* carrega index.json */
  useEffect(() => {
    fetch('/devplan/index.json')
      .then(r => r.json())
      .then((data: NavEntry[]) => { setNav(data); if (data.length) setActive(data[0].file); })
      .catch(() => setNav([]));
  }, []);

  /* carrega MD ao trocar aba */
  useEffect(() => {
    if (!active) return;
    setLoading(true);
    setChecks(loadChecks(active));
    fetch(`/devplan/${active}?t=${Date.now()}`)
      .then(r => { const lm = r.headers.get('Last-Modified'); if (lm) setLastMod(new Date(lm).toLocaleDateString('pt-BR')); return r.text(); })
      .then(md => setRawMd(md))
      .catch(() => setRawMd('> Erro ao carregar arquivo.'))
      .finally(() => setLoading(false));
    loadComments(active);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  async function loadComments(file: string) {
    const { data } = await supabaseAdmin
      .from('devplan_comments')
      .select('*')
      .eq('file', file)
      .order('created_at', { ascending: true });
    setComments((data ?? []) as Comment[]);

    // admin marca como lido ao abrir
    if (isAdmin && data?.some(c => !c.lido)) {
      await supabaseAdmin
        .from('devplan_comments')
        .update({ lido: true })
        .eq('file', file)
        .eq('lido', false);
    }
  }

  async function handleSend() {
    if (!newComment.trim()) return;
    setSending(true);
    await supabaseAdmin.from('devplan_comments').insert({
      farm_id:     farmId || '10000000-0000-4000-8000-000000000001',
      file:        active,
      comment:     newComment.trim(),
      author_name: user?.name ?? 'Usuário',
      author_role: isAdmin ? 'admin' : 'client',
      lido:        false,
    });
    setNewComment('');
    await loadComments(active);
    setSending(false);
  }

  async function handleModalSend() {
    if (!modalText.trim()) return;
    setSending(true);
    await supabaseAdmin.from('devplan_comments').insert({
      farm_id:     farmId || '10000000-0000-4000-8000-000000000001',
      file:        active,
      comment:     modalText.trim(),
      author_name: user?.name ?? 'Usuário',
      author_role: isAdmin ? 'admin' : 'client',
      lido:        false,
    });
    setModalText('');
    setShowModal(false);
    await loadComments(active);
    setSending(false);
  }

  /* injeta checkboxes interativos */
  useEffect(() => {
    if (!contentRef.current || loading) return;
    const items = contentRef.current.querySelectorAll<HTMLLIElement>('li');
    let idx = 0;
    items.forEach(li => {
      const text = li.childNodes[0]?.textContent ?? '';
      const isUnchecked = text.trimStart().startsWith('[ ]');
      const isChecked   = text.trimStart().startsWith('[x]') || text.trimStart().startsWith('[X]');
      if (!isUnchecked && !isChecked) return;
      const currentIdx = idx++;
      const checked = checks[currentIdx] ?? isChecked;
      if (li.childNodes[0]?.nodeType === Node.TEXT_NODE) {
        li.childNodes[0].textContent = li.childNodes[0].textContent!.replace(/^\s*\[[ xX]\]\s*/, ' ');
      }
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = checked; cb.disabled = !isAdmin; cb.className = 'devplan-checkbox';
      cb.addEventListener('change', () => {
        const next = { ...loadChecks(active), [currentIdx]: cb.checked };
        saveChecks(active, next); setChecks(next);
      });
      li.prepend(cb);
      li.style.display = 'flex'; li.style.alignItems = 'flex-start'; li.style.gap = '8px';
      if (checked) li.style.opacity = '0.55';
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawMd, loading, active]);

  useEffect(() => {
    if (!contentRef.current) return;
    const cbs = contentRef.current.querySelectorAll<HTMLInputElement>('input.devplan-checkbox');
    let idx = 0;
    cbs.forEach(cb => {
      cb.checked = checks[idx] ?? cb.checked;
      const li = cb.closest('li') as HTMLLIElement | null;
      if (li) li.style.opacity = cb.checked ? '0.55' : '1';
      idx++;
    });
  }, [checks]);

  const html = DOMPurify.sanitize(marked.parse(rawMd) as string);
  const activeEntry = nav.find(n => n.file === active);

  function fmtDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex bg-gray-50">

      {/* ── Sidebar ── */}
      <aside className="w-60 flex-shrink-0 flex flex-col"
        style={{ background: 'rgba(255,255,255,0.90)', borderRight: '1px solid rgba(0,0,0,0.08)', boxShadow: '2px 0 12px rgba(0,0,0,0.04)' }}>
        <div className="p-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-4 h-4" style={{ color: '#1a6040' }} />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Planejamento</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-snug">
            {isAdmin ? 'Admin — checkboxes e comentários ativos' : 'Somente leitura — comentários ativos'}
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map((entry, i) => {
            const isActive = entry.file === active;
            return (
              <motion.button key={entry.file} onClick={() => setActive(entry.file)}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-150"
                style={isActive ? { background: 'linear-gradient(135deg, #1a6040, #0f4a30)', color: '#fff', boxShadow: '0 3px 12px rgba(26,96,64,0.30)' } : { color: '#6b7280' }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span className="text-base leading-none">{entry.icon}</span>
                <span className="text-sm font-medium">{entry.title}</span>
              </motion.button>
            );
          })}
        </nav>
        <div className="p-4 flex items-center gap-2 text-[10px] text-gray-400" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {!isAdmin && <Lock className="w-3 h-3" />}
          {!isAdmin ? 'Somente leitura' : 'Admin'}
        </div>
      </aside>

      {/* ── Conteúdo principal ── */}
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">

          {/* Badge última atualização */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {activeEntry && <span className="text-2xl">{activeEntry.icon}</span>}
              <h1 className="text-xl font-bold text-gray-800">{activeEntry?.title ?? 'Planejamento'}</h1>
            </div>
            {lastMod && (
              <span className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(26,96,64,0.08)', color: '#1a6040' }}>
                <RefreshCw className="w-3 h-3" />
                Atualizado: {lastMod}
              </span>
            )}
          </div>

          {/* Conteúdo MD */}
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 rounded" style={{ background: 'rgba(0,0,0,0.06)', width: i % 3 === 0 ? '60%' : i % 2 === 0 ? '90%' : '75%' }} />
              ))}
            </div>
          ) : (
            <motion.div key={active} ref={contentRef}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
              className="devplan-prose"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}

          {/* ── Seção de Comentários ── */}
          <div className="mt-10 pt-6" style={{ borderTop: '2px solid rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-2 mb-5">
              <MessageSquare className="w-4 h-4" style={{ color: '#1a6040' }} />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Mensagens — {activeEntry?.title}
              </h2>
              {comments.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(26,96,64,0.10)', color: '#1a6040' }}>
                  {comments.length}
                </span>
              )}
            </div>

            {/* Thread de comentários */}
            {comments.length === 0 ? (
              <p className="text-sm text-gray-400 italic mb-4">Nenhuma mensagem ainda. Deixe uma observação abaixo.</p>
            ) : (
              <div className="space-y-3 mb-5">
                {comments.map(c => {
                  const isMe = (isAdmin && c.author_role === 'admin') || (!isAdmin && c.author_role === 'client');
                  return (
                    <motion.div key={c.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[80%]">
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'rounded-tr-sm text-white'
                            : 'rounded-tl-sm bg-white border border-gray-200 text-gray-800'
                        }`}
                          style={isMe ? { background: '#1a6040' } : {}}>
                          {c.comment}
                        </div>
                        <p className={`text-[10px] mt-1 text-gray-400 ${isMe ? 'text-right' : 'text-left'}`}>
                          <strong>{c.author_name}</strong> · {fmtDate(c.created_at)}
                          {isAdmin && !c.lido && c.author_role !== 'admin' && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold"
                              style={{ background: '#fef3c7', color: '#92400e' }}>NOVO</span>
                          )}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Input de envio */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Escreva uma mensagem ou observação…"
                className="flex-1 h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={handleSend}
                disabled={sending || !newComment.trim()}
                className="h-10 px-4 rounded-xl text-white text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-40"
                style={{ background: '#1a6040' }}
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Botão flutuante Responder */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-semibold text-white"
        style={{ background: 'linear-gradient(135deg, #1a6040, #0f4a30)' }}
      >
        <Reply className="w-4 h-4" />
        Responder
      </motion.button>

      {/* Modal de resposta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4" style={{ color: '#1a6040' }} />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                Responder — {activeEntry?.title}
              </h3>
            </div>
            <textarea
              value={modalText}
              onChange={e => setModalText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleModalSend()}
              placeholder="Digite sua mensagem ou observação…"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              autoFocus
            />
            <p className="text-[10px] text-gray-400 mt-1 mb-4">Ctrl+Enter para enviar</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleModalSend}
                disabled={sending || !modalText.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all disabled:opacity-40"
                style={{ background: '#1a6040' }}>
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
