import { useForm } from 'react-hook-form';
import { motion } from 'motion/react';
import { Plus, BarChart3, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router';
import { useData } from '../context/DataContext';
import type { DataEntry } from '../lib/data';
import { supplementOrder } from '../lib/data';
import { fmt, fmtInt } from '../lib/utils';

interface FormFields {
  pasto: string;
  quantidade: number;
  tipo: string;
  periodo: number;
  sacos: number;
}

const inputClass =
  'w-full h-10 px-3 rounded-lg bg-gray-100 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors';
const labelClass = 'block text-xs font-medium text-gray-500 mb-1';

export function Formulario() {
  const { entries, addEntry, removeEntry, clearAll, loadSample, pastures } = useData();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormFields>({
    defaultValues: { periodo: 30 },
  });

  const quantidade = watch('quantidade');
  const periodo    = watch('periodo');
  const sacos      = watch('sacos');

  /* Auto-calc: kg = sacos × 25; consumo = kg / (qtd × periodo) */
  const kgCalculado = Number(sacos) > 0 ? Number(sacos) * 25 : 0;
  const consumoCalculado =
    Number(quantidade) > 0 && Number(periodo) > 0 && kgCalculado > 0
      ? kgCalculado / (Number(quantidade) * Number(periodo))
      : 0;

  const onAddRow = (data: FormFields) => {
    const entry: DataEntry = {
      pasto:     data.pasto,
      quantidade: Number(data.quantidade),
      tipo:      data.tipo,
      periodo:   Number(data.periodo),
      sacos:     Number(data.sacos),
      kg:        kgCalculado,
      consumo:   consumoCalculado,
    };
    addEntry(entry);
    toast.success('Registro adicionado!', { description: `${entry.pasto} — ${entry.tipo}` });
    reset({ periodo: 30 });
  };

  const handleClearAll = () => {
    clearAll();
    toast.info('Todos os registros foram removidos.');
  };

  const handleLoadSample = () => {
    loadSample();
    toast.success('Dados de exemplo carregados!', { description: '29 registros.' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* ── Page Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Suplemento Control
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Formulário de Lançamento</h1>
            <p className="text-sm text-gray-500 mt-1">
              Insira os dados por pasto e suplemento. Estes dados alimentam o relatório e os gráficos.
            </p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shadow-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Ir para Relatórios
          </Link>
        </div>

        {/* ── Card: Novo Registro ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Novo Registro</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Carregar Exemplo
              </button>
              <button
                type="button"
                onClick={handleSubmit(onAddRow)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit(onAddRow)} className="p-6">
            {/* Row 1: Pasto (select) | Quantidade | Tipo de Suplemento */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelClass}>Pasto</label>
                <select
                  {...register('pasto', { required: true })}
                  className={`${inputClass} cursor-pointer ${errors.pasto ? 'ring-2 ring-red-400' : ''}`}
                >
                  <option value="">Selecione</option>
                  {pastures.map(p => (
                    <option key={p.id} value={p.nome}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Quantidade</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="30"
                  {...register('quantidade', { required: true, valueAsNumber: true })}
                  className={`${inputClass} ${errors.quantidade ? 'ring-2 ring-red-400' : ''}`}
                />
              </div>
              <div>
                <label className={labelClass}>Tipo de Suplemento</label>
                <select
                  {...register('tipo', { required: true })}
                  className={`${inputClass} cursor-pointer ${errors.tipo ? 'ring-2 ring-red-400' : ''}`}
                >
                  <option value="">Selecione</option>
                  {supplementOrder.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Período | Sacos | Kg consumidos (auto-calc) */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelClass}>Período (dias)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  {...register('periodo', { required: true, valueAsNumber: true })}
                  className={`${inputClass} ${errors.periodo ? 'ring-2 ring-red-400' : ''}`}
                />
              </div>
              <div>
                <label className={labelClass}>Sacos (25 kg)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="56"
                  {...register('sacos', { required: true, valueAsNumber: true })}
                  className={`${inputClass} ${errors.sacos ? 'ring-2 ring-red-400' : ''}`}
                />
              </div>
              <div>
                <label className={labelClass}>Kg consumidos no período</label>
                <input
                  type="text"
                  readOnly
                  value={kgCalculado > 0 ? kgCalculado : '0'}
                  className="w-full h-10 px-3 rounded-lg bg-gray-100 text-sm text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Row 3: Consumo (auto-calc) */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Consumo (kg/cab dia)</label>
                <input
                  type="text"
                  readOnly
                  value={consumoCalculado > 0 ? fmt(consumoCalculado) : '0,000'}
                  className="w-full h-10 px-3 rounded-lg bg-gray-100 text-sm text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
          </form>
        </div>

        {/* ── Card: Registros Salvos ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Registros Salvos</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClearAll}
                disabled={entries.length === 0}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Limpar Tudo
              </button>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="font-medium">Nenhum registro cadastrado.</p>
              <p className="text-sm mt-1">Preencha o formulário acima ou clique em "Carregar Exemplo".</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pasto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantidade</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo de Suplemento</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Período</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sacos</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">KG Consumidos</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Consumo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {entries.map((entry, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(index * 0.02, 0.3) }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-3 text-gray-900 font-medium">{entry.pasto}</td>
                      <td className="px-4 py-3 text-gray-700 tabular-nums">{fmtInt(entry.quantidade)}</td>
                      <td className="px-4 py-3 text-gray-700">{entry.tipo}</td>
                      <td className="px-4 py-3 text-gray-700 tabular-nums">{fmtInt(entry.periodo)}</td>
                      <td className="px-4 py-3 text-gray-700 tabular-nums">{fmtInt(entry.sacos)}</td>
                      <td className="px-4 py-3 text-gray-700 tabular-nums">{fmtInt(entry.kg)}</td>
                      <td className="px-4 py-3 text-gray-900 font-bold tabular-nums">{fmt(entry.consumo)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeEntry(index)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
