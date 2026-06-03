import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Unit, UnitFormData } from '../types';

const COLLECTION = 'units';

export const getUnits = async (): Promise<Unit[]> => {
  const q = query(collection(db, COLLECTION), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Unit));
};

export const getUnit = async (id: string): Promise<Unit | null> => {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Unit;
};

export const createUnit = async (data: UnitFormData): Promise<string> => {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateUnit = async (id: string, data: Partial<UnitFormData>): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteUnit = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};

export const subscribeToUnits = (callback: (units: Unit[]) => void) => {
  const q = query(collection(db, COLLECTION), orderBy('name'));
  return onSnapshot(q, snap => {
    const units = snap.docs.map(d => ({ id: d.id, ...d.data() } as Unit));
    callback(units);
  });
};
