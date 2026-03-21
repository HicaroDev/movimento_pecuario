import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FormData { email: string; }

const inputClass =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all';

export function RecuperarSenha() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      data.email.toLowerCase().trim(),
      { redirectTo: `${window.location.origin}/login` },
    );
    setLoading(false);
    if (err) {
      setError('Envio de e-mail não disponível no momento. Entre em contato com o administrador para redefinir sua senha.');
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">E-mail Enviado!</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Verifique sua caixa de entrada.<br />
            Clique no link recebido para redefinir sua senha.
          </p>
          <Link
            to="/login"
            className="block w-full py-3 rounded-xl text-white font-semibold text-sm bg-teal-600 hover:bg-teal-700 transition-all text-center"
          >
            Voltar ao Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full">
        <img src="/images/logo.png" alt="Movimento Pecuário" className="w-36 mx-auto mb-8" />
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Recuperar Senha</h2>
        <p className="text-sm text-gray-500 mb-8">
          Informe seu e-mail e enviaremos um link para redefinir a senha.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">E-mail</label>
            <input
              type="email" placeholder="seu@email.com"
              className={inputClass}
              style={{ textTransform: 'none' }}
              {...register('email', { required: 'Informe o e-mail' })}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : 'Enviar Link'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-teal-600 font-semibold hover:underline">
            Voltar ao Login
          </Link>
        </p>
      </div>
    </div>
  );
}
