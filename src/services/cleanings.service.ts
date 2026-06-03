import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  serverTimestamp, query, orderBy, where, onSnapshot, arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Cleaning, CleaningFormData, CleaningStatus } from '../types';

const COL = 'cleanings';

export const getCleanings = async (): Promise<Cleaning[]> => {
  const q = query(collection(db, COL), orderBy('scheduledDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Cleaning));
};

export const getCleaning = async (id: string): Promise<Cleaning | null> => {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Cleaning;
};

export const createCleaning = async (data: CleaningFormData): Promise<string> => {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    startedAt: null,
    completedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateCleaning = async (id: string, data: Partial<Cleaning>): Promise<void> => {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
};

export const updateCleaningStatus = async (id: string, status: CleaningStatus): Promise<void> => {
  const updates: any = { status, updatedAt: serverTimestamp() };
  if (status === 'en_curso') updates.startedAt = serverTimestamp();
  if (status === 'completada' || status === 'verificada') updates.completedAt = serverTimestamp();
  await updateDoc(doc(db, COL, id), updates);
};

export const updateChecklist = async (id: string, checklist: Cleaning['checklist']): Promise<void> => {
  await updateDoc(doc(db, COL, id), { checklist, updatedAt: serverTimestamp() });
};

export const addAreaPhoto = async (
  cleaningId: string,
  area: string,
  photoURL: string
): Promise<void> => {
  const photo = {
    area,
    photoURL,
    uploadedAt: new Date().toISOString(),
  };
  await updateDoc(doc(db, 'cleanings', cleaningId), {
    areaPhotos: arrayUnion(photo),
    updatedAt: serverTimestamp(),
  });
};

export const subscribeToCleanings = (callback: (cleanings: Cleaning[]) => void) => {
  const q = query(collection(db, COL), orderBy('scheduledDate', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cleaning)));
  });
};

export const subscribeToCleaningsByDate = (date: string, callback: (cleanings: Cleaning[]) => void) => {
  const q = query(collection(db, COL), where('scheduledDate', '==', date), orderBy('scheduledTime'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cleaning)));
  });
};
