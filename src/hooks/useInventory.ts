import { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { subscribeToInventory } from '../services/inventory.service';

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToInventory(data => {
      setItems(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { items, loading };
};
