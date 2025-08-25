import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

interface UserProfile {
  id: string;
  name: string;
  surname: string;
  email: string;
  birthday: string;
  gender: string | null;
  avatar_url: string | null;
  status: string | null;
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
  const [isAvatarButtonVisible, setIsAvatarButtonVisible] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    status: '',
    birthday: '',
    gender: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    surname: '',
    status: '',
    birthday: '',
  });

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
        setProfile({ ...user, status: user.status || null, gender: user.gender || null });
        console.log('Profile using AuthContext user:', user);
      } else {
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
          email: profileData.email || '',
          birthday: profileData.birthday,
          gender: profileData.gender || null,
          avatar_url: profileData.avatar_url,
          status: profileData.status || null,
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

  const handleAvatarClick = useCallback(() => {
    if (isOwnProfile) {
      setIsAvatarButtonVisible(true);
    }
  }, [isOwnProfile]);

  const handleAvatarEditToggle = useCallback(() => {
    setIsEditingAvatar((prev) => !prev);
    setAvatarFile(null);
    setIsAvatarButtonVisible(false);
  }, []);

  const handleProfileEditToggle = useCallback(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        surname: profile.surname,
        status: profile.status || '',
        birthday: profile.birthday,
        gender: profile.gender || '',
      });
      setFormErrors({ name: '', surname: '', status: '', birthday: '' });
    }
    setIsEditingProfile((prev) => !prev);
  }, [profile]);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatarFile(file);
  }, []);

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = { name: '', surname: '', status: '', birthday: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Имя обязательно';
      isValid = false;
    } else if (formData.name.length > 50) {
      errors.name = 'Имя не должно превышать 50 символов';
      isValid = false;
    }

    if (!formData.surname.trim()) {
      errors.surname = 'Фамилия обязательна';
      isValid = false;
    } else if (formData.surname.length > 50) {
      errors.surname = 'Фамилия не должна превышать 50 символов';
      isValid = false;
    }

    if (formData.status.length > 200) {
      errors.status = 'Статус не должен превышать 200 символов';
      isValid = false;
    }

    if (!formData.birthday) {
      errors.birthday = 'Дата рождения обязательна';
      isValid = false;
    } else {
      const age = calculateAge(formData.birthday);
      if (age < 13) {
        errors.birthday = 'Пользователь должен быть старше 13 лет';
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  }, [formData]);

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

      const newAvatarUrl = `${saveData.avatar_url || uploadData.object_name}?t=${Date.now()}`;
      setProfile((prev) => (prev ? { ...prev, avatar_url: newAvatarUrl } : prev));
      setUser((prev) => (prev ? { ...prev, avatar_url: newAvatarUrl } : prev));
      setIsEditingAvatar(false);
      setAvatarFile(null);
      setIsAvatarButtonVisible(false);
    } catch (err: any) {
      console.error('Profile avatar save error:', err.message);
      setError(err.message || 'Ошибка сохранения аватара');
    }
  }, [avatarFile, isOwnProfile, setUser]);

  const handleProfileSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      const updateData = {
        name: formData.name,
        surname: formData.surname,
        status: formData.status || null,
        birthday: formData.birthday,
        gender: formData.gender || null,
      };
      console.log('Profile save data:', updateData);
      const response = await fetch('http://localhost:8000/api/v1/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      console.log('Profile save response:', data);
      if (!response.ok) throw new Error(data.detail || 'Failed to update profile');

      setProfile((prev) =>
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
      setUser((prev) =>
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
      setIsEditingProfile(false);
    } catch (err: any) {
      console.error('Profile save error:', err.message);
      setError(err.message || 'Ошибка сохранения профиля');
    }
  }, [formData, validateForm, setUser]);

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
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-lg w-full text-center">
          <p className="text-red-500 text-lg">{error || 'Профиль не найден'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50 p-6 sm:p-12 font-sans pt-20">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-rose-400 to-rose-600 relative">
          <div className="absolute -bottom-16 left-8 transform translate-y-0">
            <div
              className={`w-32 h-32 rounded-full bg-gray-200 border-4 border-white overflow-hidden relative ${isOwnProfile ? 'cursor-pointer' : ''}`}
              onClick={handleAvatarClick}
              onMouseEnter={() => isOwnProfile && setIsHoveringAvatar(true)}
              onMouseLeave={() => isOwnProfile && setIsHoveringAvatar(false)}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-300">
                  <span className="text-rose-600 text-4xl font-bold">{profile.name[0]}</span>
                </div>
              )}
              {isOwnProfile && isHoveringAvatar && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Profile Info */}
        <div className="pt-20 pb-8 px-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{`${profile.name} ${profile.surname}`}</h1>
              {profile.status && (
                <p className="text-gray-600 italic mt-2 max-w-md">{profile.status}</p>
              )}
            </div>
            {isOwnProfile && (
              <button
                onClick={handleProfileEditToggle}
                className="bg-rose-600 text-white p-2 rounded-full hover:bg-rose-700 transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-rose-200"
                title="Редактировать профиль"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>
                {profile.gender === 'MALE' ? 'Мужской' : profile.gender === 'FEMALE' ? 'Женский' : 'Не указан'}
              </span>
            </div>
            <div className="flex items-center text-gray-600 mt-2 sm:mt-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Возраст: {calculateAge(profile.birthday)}</span>
            </div>
          </div>
          {isOwnProfile && isAvatarButtonVisible && (
            <div className="mt-4">
              <button
                onClick={handleAvatarEditToggle}
                className="bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-rose-200"
              >
                Изменить аватар
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditingAvatar && isOwnProfile && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full m-4 animate-scale-in">
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

      {isEditingProfile && isOwnProfile && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full m-4 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Редактировать профиль</h2>
              <button onClick={handleProfileEditToggle} className="text-gray-500 hover:text-gray-800 transition-colors">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="text-gray-700 font-medium text-sm">
                  Имя
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="surname" className="text-gray-700 font-medium text-sm">
                  Фамилия
                </label>
                <input
                  id="surname"
                  name="surname"
                  type="text"
                  value={formData.surname}
                  onChange={handleFormChange}
                  className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                />
                {formErrors.surname && <p className="text-red-500 text-sm mt-1">{formErrors.surname}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="status" className="text-gray-700 font-medium text-sm">
                  Статус
                </label>
                <textarea
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  maxLength={200}
                  placeholder="Ваш статус (до 200 символов)"
                  className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                />
                {formErrors.status && <p className="text-red-500 text-sm mt-1">{formErrors.status}</p>}
              </div>
              <div>
                <label htmlFor="birthday" className="text-gray-700 font-medium text-sm">
                  Дата рождения
                </label>
                <input
                  id="birthday"
                  name="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={handleFormChange}
                  className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                />
                {formErrors.birthday && <p className="text-red-500 text-sm mt-1">{formErrors.birthday}</p>}
              </div>
              <div>
                <label htmlFor="gender" className="text-gray-700 font-medium text-sm">
                  Пол
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleFormChange}
                  className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                >
                  <option value="">Не указан</option>
                  <option value="MALE">Мужской</option>
                  <option value="FEMALE">Женский</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={handleProfileEditToggle}
                className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
              >
                Отмена
              </button>
              <button
                onClick={handleProfileSave}
                className="bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200"
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