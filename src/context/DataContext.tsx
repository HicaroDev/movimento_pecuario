import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import type { DataEntry } from '../lib/data';
import { sampleRows } from '../lib/data';
import { useAuth } from './AuthContext';
import { farmService } from '../services/farmService';
import { supabase } from '../lib/supabase';
import type { Farm } from '../types/farm';

/* ── Types ── */

export interface Pasture {
  id: string;
  nome: string;
  area?: number;
  observacoes?: string;
}

export type ClientInfo = Farm;

/* ── Helpers de mapeamento ── */

function toDataEntry(row: Record<string, unknown>): DataEntry {
  return {
    id:         row.id as string,
    data:       row.data as string,
    pasto:      (row.pasto_nome as string) ?? '',
    quantidade: row.quantidade as number,
    tipo:       row.suplemento as string,
    periodo:    row.periodo as number,
    sacos:      (row.sacos as number) ?? 0,
    kg:         row.kg as number,
    consumo:    row.consumo as number,
  };
}

function toPasture(row: Record<string, unknown>): Pasture {
  return {
    id:          row.id as string,
    nome:        row.nome as string,
    area:        (row.area as number) ?? undefined,
    observacoes: (row.observacoes as string) ?? undefined,
  };
}

/* ── Context type ── */

interface DataContextType {
  activeFarmId: string;
  selectFarm: (farmId: string) => void;
  loading: boolean;
  entries: DataEntry[];
  addEntry: (entry: DataEntry) => void;
  removeEntry: (index: number) => void;
  clearAll: () => void;
  loadSample: () => void;
  clientInfo: ClientInfo | null;
  updateClientInfo: (info: ClientInfo) => void;
  pastures: Pasture[];
  addPasture: (pasture: Omit<Pasture, 'id'>) => void;
  deletePasture: (id: string) => void;
  updatePasture: (id: string, data: Partial<Pasture>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const fallbackContext: DataContextType = {
  activeFarmId: '',
  selectFarm: () => {},
  loading: true,
  entries: [],
  addEntry: () => {},
  removeEntry: () => {},
  clearAll: () => {},
  loadSample: () => {},
  clientInfo: null,
  updateClientInfo: () => {},
  pastures: [],
  addPasture: () => {},
  deletePasture: () => {},
  updatePasture: () => {},
};

/* ── Provider ── */

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();

  const [activeFarmId, setActiveFarmId] = useState<string>('');
  const [loading,      setLoading]      = useState(true);
  const [entries,      setEntries]      = useState<DataEntry[]>([]);
  const [pastures,     setPastures]     = useState<Pasture[]>([]);
  const [clientInfo,   setClientInfo]   = useState<ClientInfo | null>(null);
  const [refreshTick,  setRefreshTick]  = useState(0);

  /* Determina a fazenda ativa ao logar */
  useEffect(() => {
    if (!user) { setActiveFarmId(''); return; }

    // Cliente: usa o farmId já presente no perfil (vem do AuthContext)
    if (!isAdmin) {
      // Só atualiza se realmente mudou — evita reload desnecessário em troca de aba
      setActiveFarmId(prev => (prev === (user.farmId || '') ? prev : user.farmId || ''));
      return;
    }

    // Admin: restaura da sessão ou auto-seleciona a primeira fazenda
    const saved = localStorage.getItem('suplementoControlActiveFarm');
    if (saved) {
      // Só atualiza se realmente mudou
      setActiveFarmId(prev => (prev === saved ? prev : saved));
    } else {
      farmService.list().then(farms => {
        if (farms.length > 0) {
          setActiveFarmId(prev => {
            if (prev === farms[0].id) return prev;
            localStorage.setItem('suplementoControlActiveFarm', farms[0].id);
            return farms[0].id;
          });
        } else {
          setLoading(false); // Admin sem fazendas cadastradas
        }
      });
    }
  }, [user?.id, user?.farmId, isAdmin]);

  /* Recarrega quando o tab volta ao foco após 30s+ de inatividade */
  const hiddenAtRef = useRef<number | null>(null);
  useEffect(() => {
    const THRESHOLD = 30_000; // só recarrega se ficou oculto 30+ segundos
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      } else if (document.visibilityState === 'visible' && activeFarmId) {
        const elapsed = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
        if (elapsed > THRESHOLD) setRefreshTick(t => t + 1);
        hiddenAtRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [activeFarmId]);

  /* Carrega dados quando a fazenda muda ou ao voltar ao foco */
  const prevFarmRef = useRef<string>('');
  useEffect(() => {
    const farmChanged = prevFarmRef.current !== activeFarmId;
    prevFarmRef.current = activeFarmId;

    if (!activeFarmId) {
      setEntries([]); setPastures([]); setClientInfo(null);
      // Libera loading só quando definitivamente não há fazenda para carregar.
      // Enquanto user ainda não carregou (null), mantém loading=true para não
      // piscar estado vazio antes do skeleton aparecer.
      if (user && !isAdmin && !user.farmId) setLoading(false);
      return;
    }

    // Só limpa os dados e mostra skeleton quando a FAZENDA mudou (primeira carga ou troca).
    // Em refresh de background (refreshTick), mantém dados visíveis enquanto recarrega silenciosamente.
    if (farmChanged) {
      setEntries([]); setPastures([]); setClientInfo(null);
      setLoading(true);
    }
    let cancelled = false;

    // Timeout de segurança — libera o skeleton se o servidor demorar mais de 20s
    // (ex: aba nova com servidor frio ou rede lenta)
    const timeoutId = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 20_000);

    Promise.all([
      supabase.from('data_entries').select('*').eq('farm_id', activeFarmId).order('created_at'),
      supabase.from('pastures').select('*').eq('farm_id', activeFarmId).order('nome'),
      farmService.findById(activeFarmId),
    ]).then(([entriesRes, pasturesRes, farm]) => {
      if (cancelled) return;
      if (!entriesRes.error) setEntries((entriesRes.data ?? []).map(toDataEntry));
      if (!pasturesRes.error) setPastures((pasturesRes.data ?? []).map(toPasture));
      if (farm) setClientInfo(farm);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setLoading(false);
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [activeFarmId, refreshTick]);

  function selectFarm(farmId: string) {
    if (!isAdmin) return;
    setActiveFarmId(farmId);
    localStorage.setItem('suplementoControlActiveFarm', farmId);
  }

  function updateClientInfo(info: ClientInfo) {
    if (!activeFarmId) return;
    farmService.update(activeFarmId, info).then(updated => setClientInfo(updated));
  }

  /* ── Entries ── */
  function addEntry(entry: DataEntry) {
    const tempId = `temp-${Date.now()}`;
    setEntries(prev => [...prev, { ...entry, id: tempId }]);
    supabase.from('data_entries').insert({
      farm_id:   activeFarmId,
      data:      entry.data || new Date().toISOString().split('T')[0],
      pasto_nome: entry.pasto,
      suplemento: entry.tipo,
      quantidade: entry.quantidade,
      periodo:    entry.periodo,
      sacos:      entry.sacos,
      kg:         entry.kg,
      consumo:    entry.consumo,
    }).select().single().then(({ data, error }) => {
      if (data) setEntries(prev => prev.map(e => e.id === tempId ? toDataEntry(data) : e));
      if (error) setEntries(prev => prev.filter(e => e.id !== tempId));
    });
  }

  function removeEntry(index: number) {
    const entry = entries[index];
    setEntries(prev => prev.filter((_, i) => i !== index));
    if (entry?.id && !entry.id.startsWith('temp-')) {
      supabase.from('data_entries').delete().eq('id', entry.id);
    }
  }

  function clearAll() {
    setEntries([]);
    if (activeFarmId) supabase.from('data_entries').delete().eq('farm_id', activeFarmId);
  }

  function loadSample() {
    const today = new Date().toISOString().split('T')[0];
    const rows = sampleRows.map(r => ({
      farm_id: activeFarmId, data: today,
      pasto_nome: r.pasto, suplemento: r.tipo,
      quantidade: r.quantidade, periodo: r.periodo,
      sacos: r.sacos, kg: r.kg, consumo: r.consumo,
    }));
    setEntries(sampleRows.map((r, i) => ({ ...r, id: `temp-sample-${i}` })));
    supabase.from('data_entries').insert(rows).select().then(({ data }) => {
      if (data) setEntries(data.map(toDataEntry));
    });
  }

  /* ── Pastures ── */
  function addPasture(p: Omit<Pasture, 'id'>) {
    const tempId = `temp-${Date.now()}`;
    setPastures(prev => [...prev, { ...p, id: tempId }]);
    supabase.from('pastures').insert({
      farm_id: activeFarmId, nome: p.nome,
      area: p.area ?? null, observacoes: p.observacoes ?? null,
    }).select().single().then(({ data, error }) => {
      if (data) setPastures(prev => prev.map(x => x.id === tempId ? toPasture(data) : x));
      if (error) setPastures(prev => prev.filter(x => x.id !== tempId));
    });
  }

  function deletePasture(id: string) {
    setPastures(prev => prev.filter(p => p.id !== id));
    supabase.from('pastures').delete().eq('id', id);
  }

  function updatePasture(id: string, patch: Partial<Pasture>) {
    setPastures(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    supabase.from('pastures').update({
      ...(patch.nome        !== undefined && { nome:        patch.nome }),
      ...(patch.area        !== undefined && { area:        patch.area ?? null }),
      ...(patch.observacoes !== undefined && { observacoes: patch.observacoes ?? null }),
    }).eq('id', id);
  }

  return (
    <DataContext.Provider value={{
      activeFarmId, selectFarm,
      loading,
      entries, addEntry, removeEntry, clearAll, loadSample,
      clientInfo, updateClientInfo,
      pastures, addPasture, deletePasture, updatePasture,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) {
    if (typeof window !== 'undefined') {
      console.warn('useData called without DataProvider');
    }
    return fallbackContext;
  }
  return ctx;
}
