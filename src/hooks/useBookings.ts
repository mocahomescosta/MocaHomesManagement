import { useState, useEffect } from 'react';
import { Booking } from '../types';
import { subscribeToBookings } from '../services/bookings.service';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToBookings(data => {
      setBookings(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { bookings, loading };
};
