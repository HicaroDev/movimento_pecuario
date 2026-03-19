import { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { motion } from 'motion/react';
import { ClipboardList, RefreshCw } from 'lucide-react';

interface NavEntry {
  file: string;
  title: string;
  icon: string;
}

marked.setOptions({ breaks: true });

export function DevPlan() {
  const [nav, setNav]           = useState<NavEntry[]>([]);
  const [active, setActive]     = useState<string>('');
  const [html, setHtml]         = useState<string>('');
  const [loading, setLoading]   = useState(true);
  const [lastMod, setLastMod]   = useState<string>('');

  /* carrega index.json */
  useEffect(() => {
    fetch('/devplan/index.json')
      .then(r => r.json())
      .then((data: NavEntry[]) => {
        setNav(data);
        if (data.length) setActive(data[0].file);
      })
      .catch(() => setNav([]));
  }, []);

  /* carrega o MD ativo */
  useEffect(() => {
    if (!active) return;
    setLoading(true);
    fetch(`/devplan/${active}?t=${Date.now()}`)
      .then(r => {
        const lm = r.headers.get('Last-Modified');
        if (lm) setLastMod(new Date(lm).toLocaleDateString('pt-BR'));
        return r.text();
      })
      .then(md => {
        const dirty = marked.parse(md) as string;
        setHtml(DOMPurify.sanitize(dirty));
      })
      .catch(() => setHtml('<p>Erro ao carregar arquivo.</p>'))
      .finally(() => setLoading(false));
  }, [active]);

  const activeEntry = nav.find(n => n.file === active);

  return (
    <div className="flex h-full min-h-screen bg-gray-50">

      {/* ── Sidebar de navegação ── */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col"
        style={{
          background: 'rgba(255,255,255,0.90)',
          borderRight: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
        }}
      >
        {/* Header */}
        <div className="p-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-4 h-4" style={{ color: '#1a6040' }} />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Planejamento</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-snug">
            Atualizado pela equipe HicaroDev — somente leitura
          </p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map((entry, i) => {
            const isActive = entry.file === active;
            return (
              <motion.button
                key={entry.file}
                onClick={() => setActive(entry.file)}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-150"
                style={isActive ? {
                  background: 'linear-gradient(135deg, #1a6040, #0f4a30)',
                  color: '#fff',
                  boxShadow: '0 3px 12px rgba(26,96,64,0.30)',
                } : {
                  color: '#6b7280',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <span className="text-base leading-none">{entry.icon}</span>
                <span className="text-sm font-medium">{entry.title}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Footer nav */}
        <div className="p-4 text-[10px] text-gray-400" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          HicaroDev + Claude Code · 2026
        </div>
      </aside>

      {/* ── Conteúdo principal ── */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto">

          {/* Badge de última atualização */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {activeEntry && (
                <span className="text-2xl">{activeEntry.icon}</span>
              )}
              <h1 className="text-xl font-bold text-gray-800">
                {activeEntry?.title ?? 'Planejamento'}
              </h1>
            </div>
            {lastMod && (
              <span
                className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(26,96,64,0.08)', color: '#1a6040' }}
              >
                <RefreshCw className="w-3 h-3" />
                Atualizado: {lastMod}
              </span>
            )}
          </div>

          {/* Conteúdo MD */}
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 rounded"
                  style={{
                    background: 'rgba(0,0,0,0.06)',
                    width: i % 3 === 0 ? '60%' : i % 2 === 0 ? '90%' : '75%',
                  }}
                />
              ))}
            </div>
          ) : (
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="devplan-prose"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
