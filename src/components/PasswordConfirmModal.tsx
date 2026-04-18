import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, X, Eye, EyeOff } from 'lucide-react';

interface PasswordConfirmModalProps {
  title: string;
  description?: string;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}

export function PasswordConfirmModal({ title, description, onConfirm, onCancel }: PasswordConfirmModalProps) {
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleConfirm() {
    if (!password) { setError('Digite a senha.'); return; }
    setLoading(true);
    setError('');
    try {
      await onConfirm(password);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao confirmar.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onCancel();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel}
      />
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Lock className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {description && (
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">{description}</p>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Senha</label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua senha"
                className={`w-full h-10 px-3 pr-10 rounded-lg border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  error ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-300 bg-white focus:ring-teal-500 focus:border-transparent'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? 'Verificando...' : 'Confirmar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
