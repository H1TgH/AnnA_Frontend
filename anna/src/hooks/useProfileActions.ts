import { useCallback } from 'react';
import { api, endpoints } from '../utils/api';
import { validateProfileForm } from '../utils/validation';

export const useProfileActions = (
  formData: any,
  setFormErrors: any,
  updateProfile: any,
  setUser: any
) => {
  const handleProfileSave = useCallback(async () => {
    const { errors, isValid } = validateProfileForm(formData);
    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    try {
      const updateData = {
        name: formData.name,
        surname: formData.surname,
        status: formData.status || null,
        birthday: formData.birthday,
        gender: formData.gender || null,
      };

      const data = await api.patch(endpoints.users.me, updateData);

      updateProfile({
        name: data.name,
        surname: data.surname,
        status: data.status || null,
        birthday: data.birthday,
        gender: data.gender || null,
        avatar_url: data.avatar_url,
      });

      setUser((prev: any) =>
        prev
          ? {
              ...prev,
              name: data.name,
              surname: data.surname,
              status: data.status || null,
              birthday: data.birthday,
              gender: data.gender || null,
              avatar_url: data.avatar_url || prev.avatar_url,
            }
          : prev
      );

      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Ошибка обновления профиля');
    }
  }, [formData, setFormErrors, updateProfile, setUser]);

  return {
    handleProfileSave,
  };
}; 