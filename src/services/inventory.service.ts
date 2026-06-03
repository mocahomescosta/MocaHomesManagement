import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy, where, onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { InventoryItem, InventoryItemFormData, StockLevel } from '../types';

const COL = 'inventory';

function computeStockLevel(current: number, min: number): StockLevel {
  if (current <= 0) return 'agotado';
  if (current <= min) return 'bajo';
  return 'ok';
}

function withStockLevel(data: any, id: string): InventoryItem {
  return {
    id,
    ...data,
    stockLevel: computeStockLevel(data.currentStock ?? 0, data.minStock ?? 1),
  } as InventoryItem;
}

export const getInventoryByUnit = async (unitId: string): Promise<InventoryItem[]> => {
  const q = query(collection(db, COL), where('unitId', '==', unitId), orderBy('category'), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map(d => withStockLevel(d.data(), d.id));
};

export const createInventoryItem = async (data: InventoryItemFormData): Promise<string> => {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateInventoryItem = async (id: string, data: Partial<InventoryItemFormData>): Promise<void> => {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
};

export const updateStock = async (id: string, newStock: number, updatedByName: string): Promise<void> => {
  await updateDoc(doc(db, COL, id), {
    currentStock: newStock,
    lastUpdatedByName: updatedByName,
    updatedAt: serverTimestamp(),
  });
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COL, id));
};

export const subscribeToInventory = (callback: (items: InventoryItem[]) => void) => {
  const q = query(collection(db, COL), orderBy('unitId'), orderBy('category'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => withStockLevel(d.data(), d.id)));
  });
};

export const subscribeToLowStock = (callback: (items: InventoryItem[]) => void) => {
  return onSnapshot(query(collection(db, COL), orderBy('unitId')), snap => {
    const all = snap.docs.map(d => withStockLevel(d.data(), d.id));
    callback(all.filter(i => i.stockLevel !== 'ok'));
  });
};
