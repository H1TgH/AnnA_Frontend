import { useState, useCallback } from 'react';
import { api, endpoints } from '../utils/api';

export const useAvatar = (isOwnProfile: boolean, updateProfile: (updates: any) => void, setUser: any) => {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatarFile(file);
  }, []);

  const handleAvatarSave = useCallback(async () => {
    if (!avatarFile || !isOwnProfile) return;
    
    try {
      const uploadResponse = await api.get(endpoints.users.avatar.uploadUrl);
      
      await api.uploadFile(uploadResponse.upload_url, avatarFile);

      const saveResponse = await api.post(endpoints.users.avatar.save, { 
        object_name: uploadResponse.object_name 
      });

      const newAvatarUrl = saveResponse.avatar_url || uploadResponse.object_name;
      updateProfile({ avatar_url: newAvatarUrl });
      setUser((prev: any) => (prev ? { ...prev, avatar_url: newAvatarUrl } : prev));
      
      setAvatarFile(null);
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Ошибка сохранения аватара');
    }
  }, [avatarFile, isOwnProfile, updateProfile, setUser]);

  const resetAvatar = useCallback(() => {
    setAvatarFile(null);
  }, []);

  return {
    avatarFile,
    handleAvatarChange,
    handleAvatarSave,
    resetAvatar,
  };
}; 