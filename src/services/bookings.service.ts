import {
  collection, doc, getDocs, getDoc, updateDoc,
  serverTimestamp, query, orderBy, where, onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Booking } from '../types';

const COL = 'bookings';

export const getBookings = async (): Promise<Booking[]> => {
  const q = query(collection(db, COL), orderBy('arrivalDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
};

export const getBooking = async (id: string): Promise<Booking | null> => {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Booking;
};

export const subscribeToBookings = (callback: (bookings: Booking[]) => void) => {
  const q = query(collection(db, COL), orderBy('arrivalDate', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
  });
};

export const subscribeToUpcomingBookings = (callback: (bookings: Booking[]) => void) => {
  const today = new Date().toISOString().split('T')[0];
  const q = query(
    collection(db, COL),
    where('departureDate', '>=', today),
    orderBy('departureDate', 'asc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
  });
};
