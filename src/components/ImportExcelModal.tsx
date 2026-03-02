import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import type { DataEntry } from '../lib/data';

/* ── App fields that need mapping ── */
const APP_FIELDS = [
  { key: 'pasto',      label: 'PASTO',                required: true  },
  { key: 'quantidade', label: 'QUANTIDADE',            required: true  },
  { key: 'tipo',       label: 'TIPO DE SUPLEMENTO',    required: true  },
  { key: 'periodo',    label: 'PERÍODO (dias)',         required: true  },
  { key: 'sacos',      label: 'SACOS (25 kg)',          required: false },
  { key: 'kg',         label: 'KG CONSUMIDOS',         required: false },
  { key: 'consumo',    label: 'CONSUMO (kg/cab dia)',  required: false },
  { key: 'data',       label: 'DATA (YYYY-MM-DD)',     required: false },
] as const;

type FieldKey = typeof APP_FIELDS[number]['key'];

/* Auto-detect common column name patterns */
function autoMap(headers: string[]): Partial<Record<FieldKey, string>> {
  const patterns: Record<FieldKey, RegExp[]> = {
    pasto:      [/pasto/i],
    quantidade: [/quantidade|qtd|cabecas|cabeças/i],
    tipo:       [/tipo|suplemento|supplement/i],
    periodo:    [/periodo|período|dias/i],
    sacos:      [/sacos/i],
    kg:         [/kg.consum|kg.period|kgcons/i],
    consumo:    [/consumo|kg.cab|kg\/cab/i],
    data:       [/^data$|^date$|^data.fechamento/i],
  };
  const result: Partial<Record<FieldKey, string>> = {};
  for (const [field, pats] of Object.entries(patterns) as [FieldKey, RegExp[]][]) {
    const match = headers.find(h => pats.some(p => p.test(h)));
    if (match) result[field] = match;
  }
  return result;
}

interface Props {
  onClose: () => void;
}

export function ImportExcelModal({ onClose }: Props) {
  const { addEntry } = useData();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep]           = useState<'upload' | 'map' | 'done'>('upload');
  const [headers, setHeaders]     = useState<string[]>([]);
  const [preview, setPreview]     = useState<Record<string, unknown>[]>([]);
  const [allRows, setAllRows]     = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping]     = useState<Partial<Record<FieldKey, string>>>({});
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [fileName, setFileName]   = useState('');

  function handleFile(file: File) {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const wb = XLSX.read(data, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      if (rows.length === 0) {
        toast.error('Planilha vazia ou sem dados reconhecíveis.');
        return;
      }
      const hdrs = Object.keys(rows[0]);
      setHeaders(hdrs);
      setAllRows(rows);
      setPreview(rows.slice(0, 5));
      setMapping(autoMap(hdrs));
      setStep('map');
    };
    reader.readAsBinaryString(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function parseRow(row: Record<string, unknown>): DataEntry | null {
    const get = (key: FieldKey) => {
      const col = mapping[key];
      return col ? row[col] : undefined;
    };
    const pasto = String(get('pasto') ?? '').trim();
    const quantidade = Number(get('quantidade') ?? 0);
    const tipo  = String(get('tipo') ?? '').trim();
    const periodo = Number(get('periodo') ?? 30);
    if (!pasto || !tipo || !quantidade) return null;

    const sacos  = Number(get('sacos') ?? 0);
    const kg     = Number(get('kg') ?? sacos * 25);
    const consumo = Number(get('consumo') ?? (kg > 0 && quantidade > 0 && periodo > 0 ? kg / (quantidade * periodo) : 0));
    const dataRaw = get('data');
    const data = dataRaw ? String(dataRaw).trim() : new Date().toISOString().split('T')[0];

    return { pasto, quantidade, tipo, periodo, sacos, kg, consumo, data };
  }

  async function handleImport() {
    const required = APP_FIELDS.filter(f => f.required).map(f => f.key);
    const missing  = required.filter(k => !mapping[k]);
    if (missing.length > 0) {
      toast.error(`Mapeie os campos obrigatórios: ${missing.join(', ')}`);
      return;
    }

    setImporting(true);
    let count = 0;
    for (const row of allRows) {
      const entry = parseRow(row);
      if (entry) {
        addEntry(entry);
        count++;
        // Small delay to avoid hammering Supabase
        if (count % 10 === 0) await new Promise(r => setTimeout(r, 200));
      }
    }
    setImportedCount(count);
    setImporting(false);
    setStep('done');
    toast.success(`${count} registros importados com sucesso!`);
  }

  const requiredMapped = APP_FIELDS.filter(f => f.required).every(f => !!mapping[f.key]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <h2 className="text-base font-bold text-gray-900">Importar Excel</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Step 1: Upload ── */}
          {step === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all"
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">Arraste o arquivo ou clique para selecionar</p>
              <p className="text-xs text-gray-400">.xlsx ou .xls</p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </div>
          )}

          {/* ── Step 2: Map columns ── */}
          {step === 'map' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <span className="font-medium text-gray-800">{fileName}</span>
                <span className="text-gray-400">— {allRows.length} linhas encontradas</span>
              </div>

              {/* Column mapping */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Mapear colunas da planilha</h3>
                <div className="space-y-2">
                  {APP_FIELDS.map(field => (
                    <div key={field.key} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded text-right ${field.required ? 'text-gray-700' : 'text-gray-400'}`}>
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </span>
                      <span className="text-gray-300 text-xs">←</span>
                      <select
                        value={mapping[field.key] ?? ''}
                        onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value || undefined }))}
                        className="w-full h-8 px-2 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="">(não mapear)</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Preview (5 primeiras linhas)</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="text-[11px] w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        {headers.map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 border-b border-gray-200 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          {headers.map(h => (
                            <td key={h} className="px-3 py-1.5 text-gray-700 whitespace-nowrap max-w-[120px] truncate">
                              {String(row[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 'done' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-teal-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">{importedCount} registros importados!</h3>
              <p className="text-sm text-gray-500">Os dados já estão disponíveis no Relatório.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          {step === 'upload' && (
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
          )}
          {step === 'map' && (
            <>
              <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Voltar</button>
              {!requiredMapped && (
                <div className="flex items-center gap-1.5 text-amber-600 text-xs mr-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Mapeie os campos obrigatórios (*)
                </div>
              )}
              <button
                onClick={handleImport}
                disabled={!requiredMapped || importing}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? 'Importando...' : `Importar ${allRows.length} linhas`}
              </button>
            </>
          )}
          {step === 'done' && (
            <button onClick={onClose} className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold">Fechar</button>
          )}
        </div>
      </div>
    </div>
  );
}
