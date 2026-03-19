import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { motion } from 'motion/react';
import { ClipboardList, RefreshCw, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavEntry {
  file: string;
  title: string;
  icon: string;
}

marked.setOptions({ breaks: true });

/* Chave localStorage: devplan_checks_{file} → Record<number, boolean> */
function checksKey(file: string) {
  return `devplan_checks_${file}`;
}

function loadChecks(file: string): Record<number, boolean> {
  try {
    return JSON.parse(localStorage.getItem(checksKey(file)) ?? '{}');
  } catch {
    return {};
  }
}

function saveChecks(file: string, checks: Record<number, boolean>) {
  localStorage.setItem(checksKey(file), JSON.stringify(checks));
}

export function DevPlan() {
  const { isAdmin } = useAuth();
  const [nav, setNav]         = useState<NavEntry[]>([]);
  const [active, setActive]   = useState<string>('');
  const [rawMd, setRawMd]     = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lastMod, setLastMod] = useState<string>('');
  const [checks, setChecks]   = useState<Record<number, boolean>>({});
  const contentRef            = useRef<HTMLDivElement>(null);

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

  /* carrega MD ao trocar aba */
  useEffect(() => {
    if (!active) return;
    setLoading(true);
    setChecks(loadChecks(active));
    fetch(`/devplan/${active}?t=${Date.now()}`)
      .then(r => {
        const lm = r.headers.get('Last-Modified');
        if (lm) setLastMod(new Date(lm).toLocaleDateString('pt-BR'));
        return r.text();
      })
      .then(md => setRawMd(md))
      .catch(() => setRawMd('> Erro ao carregar arquivo.'))
      .finally(() => setLoading(false));
  }, [active]);

  /* injeta checkboxes interativos após renderizar */
  useEffect(() => {
    if (!contentRef.current || loading) return;

    const items = contentRef.current.querySelectorAll<HTMLLIElement>('li');
    let idx = 0;

    items.forEach(li => {
      const text = li.childNodes[0]?.textContent ?? '';
      const isUnchecked = text.trimStart().startsWith('[ ]') || text.trimStart().startsWith('[ ]');
      const isChecked   = text.trimStart().startsWith('[x]') || text.trimStart().startsWith('[X]');
      if (!isUnchecked && !isChecked) return;

      const currentIdx = idx++;
      const checked = checks[currentIdx] ?? isChecked;

      /* remove o marcador de texto */
      if (li.childNodes[0]?.nodeType === Node.TEXT_NODE) {
        li.childNodes[0].textContent = li.childNodes[0].textContent!
          .replace(/^\s*\[[ xX]\]\s*/, ' ');
      }

      /* cria checkbox */
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = checked;
      cb.disabled = !isAdmin;
      cb.className = 'devplan-checkbox';
      cb.addEventListener('change', () => {
        const next = { ...loadChecks(active), [currentIdx]: cb.checked };
        saveChecks(active, next);
        setChecks(next);
      });

      li.prepend(cb);

      /* estilo visual da linha */
      li.style.display = 'flex';
      li.style.alignItems = 'flex-start';
      li.style.gap = '8px';
      if (checked) li.style.opacity = '0.55';
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawMd, loading, active]);

  /* re-aplica checked state sem re-renderizar o MD */
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
            {isAdmin ? 'Admin — checkboxes clicáveis' : 'Somente leitura'}
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
        <div className="p-4 flex items-center gap-2 text-[10px] text-gray-400" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {!isAdmin && <Lock className="w-3 h-3" />}
          {!isAdmin ? 'Somente leitura' : 'Admin'}
        </div>
      </aside>

      {/* ── Conteúdo principal ── */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto">

          {/* Badge de última atualização */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {activeEntry && <span className="text-2xl">{activeEntry.icon}</span>}
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
              ref={contentRef}
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
