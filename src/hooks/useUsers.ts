import { useState, useEffect } from 'react';
import { AppUser } from '../types';
import { subscribeToUsers } from '../services/users.service';

export const useUsers = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToUsers(data => {
      setUsers(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { users, loading };
};
