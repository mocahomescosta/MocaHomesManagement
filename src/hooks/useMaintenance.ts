import { useState, useEffect } from 'react';
import { Maintenance } from '../types';
import { subscribeToMaintenance } from '../services/maintenance.service';

export const useMaintenance = () => {
  const [items, setItems] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToMaintenance(data => {
      setItems(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { items, loading };
};
