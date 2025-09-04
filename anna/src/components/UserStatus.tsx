// src/components/UserStatus.tsx
import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { UserStatus as UserStatusType } from '../hooks/useUserStatus';

interface UserStatusProps {
  userStatus: UserStatusType | null;
  isLoading?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserStatus: React.FC<UserStatusProps> = ({ 
  userStatus, 
  isLoading = false, 
  showText = true, 
  size = 'md',
  className = '' 
}) => {
  const formatLastSeen = (lastSeen: string) => {
    try {
      const date = parseISO(lastSeen);
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: ru 
      });
    } catch (error) {
      return 'недавно';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          dot: 'w-2 h-2',
          text: 'text-xs',
          container: 'gap-1'
        };
      case 'lg':
        return {
          dot: 'w-4 h-4',
          text: 'text-base',
          container: 'gap-3'
        };
      default:
        return {
          dot: 'w-3 h-3',
          text: 'text-sm',
          container: 'gap-2'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (isLoading) {
    return (
      <div className={`flex items-center ${sizeClasses.container} ${className}`}>
        <div className={`${sizeClasses.dot} bg-gray-300 rounded-full animate-pulse`} />
        {showText && (
          <span className={`text-gray-500 ${sizeClasses.text}`}>
            Загрузка...
          </span>
        )}
      </div>
    );
  }

  if (!userStatus) {
    return null;
  }

  const isOnline = userStatus.status === 'online';

  return (
    <div className={`flex items-center ${sizeClasses.container} ${className}`}>
      {/* Статус точка */}
      <div className="relative">
        <div 
          className={`
            ${sizeClasses.dot} 
            rounded-full 
            ${isOnline 
              ? 'bg-green-500 shadow-lg' 
              : 'bg-gray-400'
            }
            ${isOnline ? 'animate-pulse' : ''}
          `} 
        />
        {isOnline && (
          <div 
            className={`
              absolute inset-0 
              ${sizeClasses.dot} 
              bg-green-500 
              rounded-full 
              animate-ping 
              opacity-75
            `} 
          />
        )}
      </div>

      {/* Статус текст */}
      {showText && (
        <div className="flex flex-col">
          <span 
            className={`
              font-medium 
              ${sizeClasses.text}
              ${isOnline 
                ? 'text-green-600' 
                : 'text-gray-600'
              }
            `}
          >
            {isOnline ? 'В сети' : 'Не в сети'}
          </span>
          
          {!isOnline && userStatus.last_seen && (
            <span 
              className={`
                text-gray-500 
                ${size === 'lg' ? 'text-sm' : 'text-xs'}
              `}
            >
              был {formatLastSeen(userStatus.last_seen)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserStatus;