// src/components/ProfileHeader.tsx
import React from 'react';
import { UserProfile, calculateAge } from '../types/Profile';
import { useUserStatus } from '../../hooks/useUserStatus';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

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
  const { userStatus, isLoading: statusLoading } = useUserStatus(
    !isOwnProfile ? profile.id : undefined
  );

  const formatLastSeen = (lastSeen: string) => {
    try {
      const date = parseISO(lastSeen);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      if (diffInMinutes < 1) return 'только что';
      if (diffInMinutes < 60) return `${diffInMinutes} мин. назад`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч. назад`;
      return formatDistanceToNow(date, { addSuffix: true, locale: ru });
    } catch {
      return 'недавно';
    }
  };

  const getStatusInfo = () => {
    if (statusLoading) return { isOnline: false, statusText: 'Загрузка...', statusColor: 'bg-gray-400', pulseClass: '', textColor: 'text-gray-500' };
    if (!userStatus) return { isOnline: false, statusText: 'Неизвестно', statusColor: 'bg-gray-400', pulseClass: '', textColor: 'text-gray-500' };
    if (userStatus.status === 'online') return { isOnline: true, statusText: 'В сети', statusColor: 'bg-green-500', pulseClass: 'animate-pulse', textColor: 'text-green-600' };
    const lastSeenText = userStatus.last_seen ? formatLastSeen(userStatus.last_seen) : 'давно не заходил';
    return { isOnline: false, statusText: `был ${lastSeenText}`, statusColor: 'bg-gray-400', pulseClass: '', textColor: 'text-gray-600' };
  };

  const statusInfo = getStatusInfo();

  return (
    <>
      <div className="h-56 bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 relative overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="absolute top-32 left-1/3 w-16 h-16 bg-white/10 rounded-full"></div>
        </div>

        {/* Аватарка с индикатором */}
        <div className="absolute bottom-8 left-8">
          <div
            className={`relative w-36 h-36 rounded-full shadow-2xl transition-all duration-300 ${
              isOwnProfile ? 'cursor-pointer hover:scale-105' : ''
            }`}
            onClick={handleAvatarClick}
            onMouseEnter={() => isOwnProfile && setIsHoveringAvatar(true)}
            onMouseLeave={() => isOwnProfile && setIsHoveringAvatar(false)}
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-300 to-gray-400 rounded-full">
                <span className="text-rose-600 text-5xl font-bold">{profile.name[0]}</span>
              </div>
            )}

            {/* Индикатор статуса */}
            {!isOwnProfile && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-white shadow-lg">
                <div className={`w-full h-full rounded-full ${statusInfo.statusColor} ${statusInfo.pulseClass}`}></div>
                {statusInfo.isOnline && (
                  <div className="absolute inset-0 w-full h-full bg-green-500 rounded-full animate-ping opacity-75"></div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Контент профиля */}
      <div className="pt-12 pb-8 px-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 mb-4">
              <h1 className="text-5xl font-bold text-gray-800 flex items-center gap-3">
                {`${profile.name} ${profile.surname}`}
                {isOwnProfile && (
                  <span className="text-sm bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-medium">
                    Это вы
                  </span>
                )}
              </h1>

              {/* Статус рядом с именем */}
              {!isOwnProfile && (
                <div className="mt-2 sm:mt-2"> {/* увеличил до 0.5rem */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border-2 transition-all duration-200 ${
                    statusInfo.isOnline 
                      ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}>
                    <div className="relative w-3 h-3">
                      <div className={`w-full h-full rounded-full ${statusInfo.statusColor} ${statusInfo.pulseClass}`} />
                      {statusInfo.isOnline && (
                        <div className="absolute inset-0 w-full h-full bg-green-500 rounded-full animate-ping opacity-75"></div>
                      )}
                    </div>
                    <span className={`font-medium text-sm ${statusInfo.textColor} capitalize`}>
                      {statusInfo.statusText}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {profile.status && (
              <div className="flex items-start gap-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <p className="text-gray-600 text-lg italic max-w-2xl leading-relaxed">{profile.status}</p>
              </div>
            )}

            {/* Поля пола и возраста */}
            <div className="flex flex-wrap items-center gap-6 text-gray-600">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">{profile.gender === 'MALE' ? 'Мужской' : profile.gender === 'FEMALE' ? 'Женский' : 'Не указан'}</span>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Возраст: {calculateAge(profile.birthday)} лет</span>
              </div>
            </div>
          </div>

          {/* Кнопки редактирования */}
          {isOwnProfile && (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleProfileEditToggle}
                className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-6 py-3 rounded-2xl hover:from-rose-700 hover:to-rose-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-rose-200 shadow-lg hover:shadow-xl flex items-center gap-3 font-semibold"
                title="Редактировать профиль"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Редактировать профиль
              </button>
            </div>
          )}
        </div>

        {isOwnProfile && isAvatarButtonVisible && (
          <div className="mt-6 animate-fade-in">
            <button
              onClick={handleAvatarEditToggle}
              className="bg-white border-2 border-rose-600 text-rose-600 font-semibold py-3 px-6 rounded-2xl hover:bg-rose-50 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-rose-200 shadow-md hover:shadow-lg flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Изменить аватар
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfileHeader;
