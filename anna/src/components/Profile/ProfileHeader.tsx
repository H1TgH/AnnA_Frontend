import React, { useState, useEffect } from 'react';
import { UserProfile, calculateAge } from '../types/Profile';

interface UserStatus {
  status: 'online' | 'offline';
  last_seen: string | null;
}

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  isHoveringAvatar: boolean;
  setIsHoveringAvatar: (value: boolean) => void;
  handleAvatarClick: () => void;
  handleProfileEditToggle: () => void;
  isAvatarButtonVisible: boolean;
  handleAvatarEditToggle: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  isHoveringAvatar,
  setIsHoveringAvatar,
  handleAvatarClick,
  handleProfileEditToggle,
  isAvatarButtonVisible,
  handleAvatarEditToggle,
}) => {
  const [userStatus, setUserStatus] = useState<UserStatus>({ status: 'offline', last_seen: null });

  useEffect(() => {
    if (isOwnProfile) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/users/${profile.id}/status`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUserStatus({
            status: data.status,
            last_seen: data.last_seen,
          });
        }
      } catch (error) {
        console.error('Error fetching user status:', error);
      }
    };

    fetchStatus();
    // Обновляем статус каждые 30 секунд для более быстрого отображения изменений
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [profile.id, isOwnProfile]);

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return '';
   
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'только что';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин. назад`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч. назад`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} дн. назад`;
   
    return lastSeenDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: now.getFullYear() !== lastSeenDate.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <>
      <div className="h-56 bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 relative overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="absolute top-32 left-1/3 w-16 h-16 bg-white/10 rounded-full"></div>
        </div>
       
        <div className="absolute bottom-8 left-8 transform translate-y-0">
          <div
            className={`w-36 h-36 rounded-full bg-gray-200 border-6 border-white overflow-hidden relative shadow-2xl transition-all duration-300 ${
              isOwnProfile ? 'cursor-pointer hover:scale-105' : ''
            }`}
            onClick={isOwnProfile ? handleAvatarEditToggle : undefined}
            onMouseEnter={() => isOwnProfile && setIsHoveringAvatar(true)}
            onMouseLeave={() => isOwnProfile && setIsHoveringAvatar(false)}
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-300 to-gray-400">
                <span className="text-rose-600 text-5xl font-bold">{profile.name[0]}</span>
              </div>
            )}
           
            {/* Индикатор онлайн статуса */}
            {!isOwnProfile && (
              <div className={`absolute bottom-3 right-6 w-6 h-6 rounded-full border-4 border-white shadow-lg transition-all duration-300 ${
                userStatus.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              }`}>
                {userStatus.status === 'online' && (
                  <div className="absolute inset-0 rounded-full bg-green-500 animate-pulse"></div>
                )}
              </div>
            )}
           
            {isOwnProfile && isHoveringAvatar && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm transition-all duration-300">
                <div className="text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-white mx-auto mb-2"
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
                  <p className="text-white text-sm font-medium">Изменить фото</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
     
      <div className="pt-12 pb-8 px-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div className="flex-1">
            <div className="mb-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
                <h1 className="text-5xl font-bold text-gray-800 flex items-center gap-3">
                  {`${profile.name} ${profile.surname}`}
                  {isOwnProfile && (
                    <span className="text-sm bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-medium">
                      Это вы
                    </span>
                  )}
                </h1>
                
                {/* Онлайн статус справа от имени */}
                {!isOwnProfile && (
                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm mt-2">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      userStatus.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      {userStatus.status === 'online' && (
                        <div className="w-full h-full rounded-full bg-green-500 animate-pulse"></div>
                      )}
                    </div>
                    <span className={`text-sm font-medium whitespace-nowrap ${
                      userStatus.status === 'online' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {userStatus.status === 'online' 
                        ? 'В сети' 
                        : userStatus.last_seen 
                          ? `Был в сети ${formatLastSeen(userStatus.last_seen)}`
                          : 'Не в сети'
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
           
            {profile.status && (
              <div className="flex items-start gap-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <p className="text-gray-600 text-lg italic max-w-2xl leading-relaxed">{profile.status}</p>
              </div>
            )}
           
            <div className="flex flex-wrap items-center gap-6 text-gray-600">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-rose-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="font-medium">
                  {profile.gender === 'MALE' ? 'Мужской' : profile.gender === 'FEMALE' ? 'Женский' : 'Не указан'}
                </span>
              </div>
             
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-rose-500"
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
                <span className="font-medium">Возраст: {calculateAge(profile.birthday)} лет</span>
              </div>
            </div>
          </div>
         
          {isOwnProfile && (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleProfileEditToggle}
                className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-6 py-3 rounded-2xl hover:from-rose-700 hover:to-rose-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-rose-200 shadow-lg hover:shadow-xl flex items-center gap-3 font-semibold"
                title="Редактировать профиль"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
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
                Редактировать профиль
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileHeader;