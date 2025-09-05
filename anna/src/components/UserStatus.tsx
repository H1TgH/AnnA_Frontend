import React, { useState, useEffect } from 'react';

interface UserStatus {
  status: 'online' | 'offline';
  last_seen: string | null;
}

interface UserStatusProps {
  userId: string;
  className?: string;
}

const UserStatusComponent: React.FC<UserStatusProps> = ({ userId, className = '' }) => {
  const [status, setStatus] = useState<UserStatus>({ status: 'offline', last_seen: null });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/users/${userId}/status`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setStatus({
            status: data.status,
            last_seen: data.last_seen,
          });
        }
      } catch (error) {
        console.error('Error fetching user status:', error);
      }
    };

    fetchStatus();

    // Обновляем статус каждые 30 секунд
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, [userId]);

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

  if (status.status === 'online') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-green-600 text-sm font-medium">В сети</span>
      </div>
    );
  }

  if (status.last_seen) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        <span className="text-gray-500 text-sm">Был в сети {formatLastSeen(status.last_seen)}</span>
      </div>
    );
  }

  return null;
};

export default UserStatusComponent;