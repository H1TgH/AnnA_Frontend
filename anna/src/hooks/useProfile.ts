import { useState, useCallback } from 'react';
import { UserProfile } from '../components/types/Profile';

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState<boolean>(false);

  const setProfileData = useCallback((data: UserProfile, isOwn: boolean) => {
    setProfile(data);
    setIsOwnProfile(isOwn);
    setIsLoading(false);
    setError(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setErrorState = useCallback((errorMsg: string | null) => {
    setError(errorMsg);
    if (errorMsg) setIsLoading(false);
  }, []);

  return {
    profile,
    isLoading,
    error,
    isOwnProfile,
    setProfileData,
    updateProfile,
    setLoading,
    setErrorState,
  };
}; 