import { useState, useEffect } from 'react';
import { Cleaning } from '../types';
import { subscribeToCleanings } from '../services/cleanings.service';

export const useCleanings = () => {
  const [cleanings, setCleanings] = useState<Cleaning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCleanings(data => {
      setCleanings(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { cleanings, loading };
};
