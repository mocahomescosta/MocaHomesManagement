import { useState, useEffect } from 'react';
import { Unit } from '../types';
import { subscribeToUnits } from '../services/units.service';

export const useUnits = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToUnits(data => {
      setUnits(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { units, loading, error };
};
