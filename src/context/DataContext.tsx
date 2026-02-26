import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { DataEntry } from '../lib/data';
import { loadData, sampleRows } from '../lib/data';
import { useAuth } from './AuthContext';
import { userService } from '../services/userService';
import { farmService } from '../services/farmService';
import type { Farm } from '../types/farm';

/* ── Types ── */

export interface Pasture {
  id: string;
  nome: string;
  area?: number;
  observacoes?: string;
}

// ClientInfo agora é Farm (dados da fazenda ativa)
export type ClientInfo = Farm;

/* ── Default pastures (Fazenda Malhada Grande, id='2') ── */
const defaultPastures: Pasture[] = [
  { id: '1',  nome: 'Cana' },
  { id: '2',  nome: 'Tamboril' },
  { id: '3',  nome: 'Sujo 1' },
  { id: '4',  nome: 'Mama de Baixo Piquete 1' },
  { id: '5',  nome: 'Mama de Baixo Piquete 2' },
  { id: '6',  nome: 'Palhadão do Meio' },
  { id: '7',  nome: 'Rio do Ouro de Baixo' },
  { id: '8',  nome: 'Rio do Ouro de Cima' },
  { id: '9',  nome: 'Pequi 2' },
  { id: '10', nome: 'João Jacinto de Cima' },
  { id: '11', nome: 'Da Maternidade' },
  { id: '12', nome: 'Ponte Cima' },
  { id: '13', nome: 'Luizinho' },
  { id: '14', nome: 'Boiada Gorda' },
  { id: '15', nome: 'Divaldo' },
  { id: '16', nome: 'Pasto do Braquiarão' },
  { id: '17', nome: 'João Jacinto de Baixo' },
  { id: '18', nome: 'Tucuzão Braquiára' },
  { id: '19', nome: 'Da Pedra' },
];

/* ── Per-farm storage helpers (entries & pastures only) ── */

function jsonLoad<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

function jsonSave(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function loadEntriesFarm(farmId: string): DataEntry[] {
  const perFarm = jsonLoad<{ rows: DataEntry[] }>(`suplementoControlData_${farmId}`);
  if (perFarm?.rows?.length) return perFarm.rows;
  if (farmId === '2') {
    const legacy = loadData();
    if (legacy?.length) return legacy;
  }
  return farmId === '2' ? sampleRows : [];
}

function saveEntriesFarm(farmId: string, entries: DataEntry[]): void {
  jsonSave(`suplementoControlData_${farmId}`, { rows: entries, updatedAt: new Date().toISOString() });
}

function loadPasturesFarm(farmId: string): Pasture[] {
  const perFarm = jsonLoad<Pasture[]>(`suplementoControlPastures_${farmId}`);
  if (perFarm?.length) return perFarm;
  if (farmId === '2') {
    const legacy = jsonLoad<Pasture[]>('suplementoControlPastures');
    if (legacy?.length) return legacy;
    return defaultPastures;
  }
  return [];
}

function savePasturesFarm(farmId: string, pastures: Pasture[]): void {
  jsonSave(`suplementoControlPastures_${farmId}`, pastures);
}

/* ── Context type ── */

interface DataContextType {
  activeFarmId: string;
  selectFarm: (farmId: string) => void;
  entries: DataEntry[];
  addEntry: (entry: DataEntry) => void;
  removeEntry: (index: number) => void;
  clearAll: () => void;
  loadSample: () => void;
  /* clientInfo agora vem do userService.fazenda */
  clientInfo: ClientInfo | null;
  updateClientInfo: (info: ClientInfo) => void;
  pastures: Pasture[];
  addPasture: (pasture: Omit<Pasture, 'id'>) => void;
  deletePasture: (id: string) => void;
  updatePasture: (id: string, data: Partial<Pasture>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

/* ── Provider ── */

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();

  const initialFarmId = (() => {
    if (!user) return '';
    if (!isAdmin) {
      // cliente: usar o farmId vinculado ao usuário
      return userService.findById(user.id)?.farmId || '';
    }
    return localStorage.getItem('suplementoControlActiveFarm') || 'farm-1';
  })();

  const [activeFarmId, setActiveFarmId] = useState<string>(initialFarmId);
  const [entries,   setEntries]   = useState<DataEntry[]>(() => activeFarmId ? loadEntriesFarm(activeFarmId)  : []);
  const [pastures,  setPastures]  = useState<Pasture[]>(()   => activeFarmId ? loadPasturesFarm(activeFarmId) : []);

  /* clientInfo vem do farmService — fonte única de verdade */
  const getFarmInfo = (farmId: string): ClientInfo | null =>
    farmService.findById(farmId) ?? null;

  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(() =>
    activeFarmId ? getFarmInfo(activeFarmId) : null
  );

  /* Sync on user change */
  useEffect(() => {
    if (!user) { setActiveFarmId(''); return; }
    if (!isAdmin) {
      const fid = userService.findById(user.id)?.farmId || '';
      setActiveFarmId(fid);
      return;
    }
    const saved = localStorage.getItem('suplementoControlActiveFarm');
    if (saved) setActiveFarmId(saved);
  }, [user?.id, isAdmin]);

  /* Reload when farm changes */
  useEffect(() => {
    if (!activeFarmId) return;
    setEntries(loadEntriesFarm(activeFarmId));
    setPastures(loadPasturesFarm(activeFarmId));
    setClientInfo(getFarmInfo(activeFarmId));
  }, [activeFarmId]);

  /* Auto-persist entries & pastures (clientInfo é gerido pelo farmService) */
  useEffect(() => { if (activeFarmId) saveEntriesFarm(activeFarmId, entries); }, [entries, activeFarmId]);
  useEffect(() => { if (activeFarmId) savePasturesFarm(activeFarmId, pastures); }, [pastures, activeFarmId]);

  function selectFarm(farmId: string) {
    if (!isAdmin) return;
    setActiveFarmId(farmId);
    localStorage.setItem('suplementoControlActiveFarm', farmId);
  }

  /* clientInfo é salvo via farmService */
  function updateClientInfo(info: ClientInfo) {
    if (!activeFarmId) return;
    const updated = farmService.update(activeFarmId, info);
    setClientInfo(updated);
  }

  /* Entries */
  const addEntry    = (e: DataEntry) => setEntries(prev => [...prev, e]);
  const removeEntry = (i: number)    => setEntries(prev => prev.filter((_, idx) => idx !== i));
  const clearAll    = () => {
    setEntries([]);
    if (activeFarmId) localStorage.removeItem(`suplementoControlData_${activeFarmId}`);
  };
  const loadSample = () => setEntries(sampleRows);

  /* Pastures */
  const addPasture    = (p: Omit<Pasture, 'id'>) => setPastures(prev => [...prev, { ...p, id: Date.now().toString() }]);
  const deletePasture = (id: string) => setPastures(prev => prev.filter(p => p.id !== id));
  const updatePasture = (id: string, data: Partial<Pasture>) =>
    setPastures(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));

  return (
    <DataContext.Provider value={{
      activeFarmId, selectFarm,
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
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
