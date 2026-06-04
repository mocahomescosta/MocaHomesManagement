import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AppUser } from '../types';
import firebase from 'firebase/compat/app';

export const loginWithEmail = async (email: string, password: string) => {
  const credential = await auth.signInWithEmailAndPassword(email, password);
  await setDoc(
    doc(db, 'users', credential.user!.uid),
    { lastLoginAt: serverTimestamp() },
    { merge: true }
  );
  try {
    const { registerPushToken } = await import('./notifications.service');
    await registerPushToken(credential.user!.uid);
  } catch {}
  return credential.user;
};

export const logout = () => auth.signOut();

export const getCurrentUserProfile = async (uid: string): Promise<AppUser | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as AppUser;
};

export const subscribeToAuthChanges = (
  callback: (user: firebase.User | null) => void
) => auth.onAuthStateChanged(callback);
