import { useState, useEffect } from 'react';
import { AppUser } from '../types';
import { useAuth } from './useAuth';
import { getCurrentUserProfile } from '../services/auth.service';

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); return; }
    getCurrentUserProfile(user.uid).then(p => {
      setProfile(p);
      setLoading(false);
    });
  }, [user?.uid]);

  return { profile, setProfile, loading };
};
