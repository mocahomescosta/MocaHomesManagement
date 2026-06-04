import { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { subscribeToAuthChanges } from '../services/auth.service';

export const useAuth = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAuthChanges(u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, loading };
};
