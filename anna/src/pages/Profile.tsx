import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

interface UserProfile {
  id: string;
  name: string;
  surname: string;
  email: string;
  birthday: string;
  gender: string;
  avatar_url: string | null;
}

const calculateAge = (birthday: string): number => {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, setUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState<boolean>(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState<boolean>(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    if (!id || !user) {
      setError('Пользователь не авторизован или ID профиля не указан');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 0);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const isOwn = id === user.id;
      setIsOwnProfile(isOwn);

      if (isOwn) {
        // Для собственного профиля используем данные из AuthContext
        setProfile(user);
        console.log('Profile using AuthContext user:', user);
      } else {
        // Для чужого профиля делаем запрос
        const response = await fetch(`http://localhost:8000/api/v1/users/${id}`, {
          method: 'GET',
          credentials: 'include',
        });
        const profileData = await response.json();
        console.log('Profile fetchData response:', profileData);
        if (!response.ok) {
          throw new Error(profileData.detail || 'User not found');
        }
        setProfile({
          id: profileData.id,
          name: profileData.name,
          surname: profileData.surname,
          email: profileData.email,
          birthday: profileData.birthday,
          gender: profileData.gender,
          avatar_url: profileData.avatar_url,
        });
      }
    } catch (err: any) {
      console.error('Profile fetchData error:', err.message);
      setError(err.message || 'Ошибка загрузки профиля');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 0);
    } finally {
      setIsLoading(false);
    }
  }, [id, user, navigate]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [fetchData, authLoading, user]);

  const handleAvatarEditToggle = useCallback(() => {
    setIsEditingAvatar((prev) => !prev);
    setAvatarFile(null);
  }, []);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatarFile(file);
  }, []);

  const handleAvatarSave = useCallback(async () => {
    if (!avatarFile || !isOwnProfile) return;
    try {
      const uploadResponse = await fetch('http://localhost:8000/api/v1/users/avatar/upload-url', {
        method: 'GET',
        credentials: 'include',
      });
      const uploadData = await uploadResponse.json();
      console.log('Profile avatar upload-url response:', uploadData);
      if (!uploadResponse.ok) throw new Error(uploadData.detail || 'Failed to get upload URL');

      await fetch(uploadData.upload_url, {
        method: 'PUT',
        body: avatarFile,
      });

      const saveResponse = await fetch('http://localhost:8000/api/v1/users/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ object_name: uploadData.object_name }),
      });
      const saveData = await saveResponse.json();
      console.log('Profile avatar save response:', saveData);
      if (!saveResponse.ok) throw new Error(saveData.detail || 'Failed to save avatar');

      const newAvatarUrl = saveData.avatar_url || uploadData.object_name;
      // Обновляем локальное состояние profile
      setProfile((prev) => (prev ? { ...prev, avatar_url: newAvatarUrl } : prev));
      // Обновляем глобальное состояние user в AuthContext
      setUser((prev) => (prev ? { ...prev, avatar_url: newAvatarUrl } : prev));
      setIsEditingAvatar(false);
      setAvatarFile(null);
    } catch (err: any) {
      console.error('Profile avatar save error:', err.message);
      setError(err.message || 'Ошибка сохранения аватара');
    }
  }, [avatarFile, isOwnProfile, setUser]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-xl">
          <svg
            className="animate-spin h-12 w-12 text-rose-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-lg text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-red-500 text-lg">{error || 'Профиль не найден'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50 p-6 sm:p-12 font-sans pt-20">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-rose-200 overflow-hidden mb-6">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-rose-600 text-2xl font-bold">{profile.name[0]}</span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-800">{`${profile.name} ${profile.surname}`}</h1>
          <p className="text-gray-600 mt-2">{profile.email}</p>
          <p className="text-gray-600 mt-1">Пол: {profile.gender === 'MALE' ? 'Мужской' : profile.gender === 'FEMALE' ? 'Женский' : 'Не указан'}</p>
          <p className="text-gray-600 mt-1">Возраст: {calculateAge(profile.birthday)}</p>
          {isOwnProfile && (
            <button
              onClick={handleAvatarEditToggle}
              className="mt-6 bg-rose-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200"
            >
              Изменить аватар
            </button>
          )}
        </div>
      </div>

      {isEditingAvatar && isOwnProfile && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full m-4 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Изменить аватар</h2>
              <button onClick={handleAvatarEditToggle} className="text-gray-500 hover:text-gray-800 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="flex flex-col gap-1">
              <label htmlFor="avatar" className="text-gray-700 font-medium text-sm">
                Новый аватар
              </label>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="text-gray-700 text-sm"
              />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={handleAvatarEditToggle}
                className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
              >
                Отмена
              </button>
              <button
                onClick={handleAvatarSave}
                disabled={!avatarFile}
                className="bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:bg-gray-400"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;