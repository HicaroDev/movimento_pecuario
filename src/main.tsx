import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

/* ── Uppercase global em todos os inputs de texto ──────────────
   Feito via JS para preservar a posição do cursor.
   CSS text-transform: uppercase causa bug de cursor nos browsers.
──────────────────────────────────────────────────────────────── */
document.addEventListener('input', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return;
  if (['number', 'date', 'password', 'email', 'checkbox', 'radio'].includes(t.type)) return;
  const start = t.selectionStart;
  const end   = t.selectionEnd;
  t.value = t.value.toUpperCase();
  t.setSelectionRange(start, end); // preserva posição do cursor
});

createRoot(document.getElementById('root')!).render(<App />);
