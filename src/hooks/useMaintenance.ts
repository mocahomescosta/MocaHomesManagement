import { useState, useEffect } from 'react';
import { Maintenance, PeriodicMaintenance } from '../types';
import { subscribeToMaintenance, subscribeToPeriodicMaintenance } from '../services/maintenance.service';

export const useMaintenance = () => {
  const [items, setItems] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodicItems, setPeriodicItems] = useState<PeriodicMaintenance[]>([]);
  const [loadingPeriodic, setLoadingPeriodic] = useState(true);

  useEffect(() => {
    const unsub1 = subscribeToMaintenance(data => {
      setItems(data);
      setLoading(false);
    });
    const unsub2 = subscribeToPeriodicMaintenance(data => {
      setPeriodicItems(data);
      setLoadingPeriodic(false);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  return { items, loading, periodicItems, loadingPeriodic };
};
