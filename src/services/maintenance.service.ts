import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  serverTimestamp, query, orderBy, where, onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Maintenance, MaintenanceFormData, MaintenanceStatus, PeriodicMaintenance } from '../types';

const PERIODIC_COL = 'periodicMaintenance';

const COL = 'maintenance';

export const getMaintenance = async (): Promise<Maintenance[]> => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Maintenance));
};

export const getMaintenanceItem = async (id: string): Promise<Maintenance | null> => {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Maintenance;
};

export const createMaintenance = async (data: MaintenanceFormData): Promise<string> => {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    resolvedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateMaintenance = async (id: string, data: Partial<Maintenance>): Promise<void> => {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
};

export const updateMaintenanceStatus = async (id: string, status: MaintenanceStatus): Promise<void> => {
  const updates: any = { status, updatedAt: serverTimestamp() };
  if (status === 'resuelta') updates.resolvedAt = serverTimestamp();
  await updateDoc(doc(db, COL, id), updates);
};

export const subscribeToMaintenance = (callback: (items: Maintenance[]) => void) => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Maintenance)));
  });
};

export const subscribeToPeriodicMaintenance = (callback: (items: PeriodicMaintenance[]) => void) => {
  const q = query(collection(db, PERIODIC_COL), orderBy('nextDate', 'asc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as PeriodicMaintenance)));
  });
};

export const createPeriodicMaintenance = async (data: Omit<PeriodicMaintenance, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const ref = await addDoc(collection(db, PERIODIC_COL), {
    ...data,
    active: true,
    lastCompletedDate: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updatePeriodicMaintenance = async (id: string, data: Partial<PeriodicMaintenance>): Promise<void> => {
  await updateDoc(doc(db, PERIODIC_COL, id), { ...data, updatedAt: serverTimestamp() });
};

export const markPeriodicDone = async (id: string, nextDate: Date): Promise<void> => {
  await updateDoc(doc(db, PERIODIC_COL, id), {
    lastCompletedDate: serverTimestamp(),
    nextDate,
    updatedAt: serverTimestamp(),
  });
};
