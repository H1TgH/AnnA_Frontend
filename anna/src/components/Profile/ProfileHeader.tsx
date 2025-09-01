import React, { useCallback } from 'react';
import { UserProfile, calculateAge } from '../types/Profile';

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
  return (
    <>
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
    </>
  );
};

export default ProfileHeader;