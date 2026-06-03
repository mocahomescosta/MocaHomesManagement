import {
  collection, doc, getDocs, getDoc, updateDoc,
  serverTimestamp, query, orderBy, where, onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppUser, UserRole, UserStatus } from '../types';

const COL = 'users';

export const getUsers = async (): Promise<AppUser[]> => {
  const q = query(collection(db, COL), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
};

export const getUser = async (uid: string): Promise<AppUser | null> => {
  const snap = await getDoc(doc(db, COL, uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as AppUser;
};

export const updateUserStatus = async (uid: string, status: UserStatus): Promise<void> => {
  await updateDoc(doc(db, COL, uid), { status, updatedAt: serverTimestamp() });
};

export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
  await updateDoc(doc(db, COL, uid), { role, updatedAt: serverTimestamp() });
};

export const updateUserProfile = async (uid: string, data: Partial<Pick<AppUser, 'name' | 'phone'>>): Promise<void> => {
  await updateDoc(doc(db, COL, uid), { ...data, updatedAt: serverTimestamp() });
};

export const subscribeToUsers = (callback: (users: AppUser[]) => void) => {
  const q = query(collection(db, COL), orderBy('name'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser)));
  });
};
