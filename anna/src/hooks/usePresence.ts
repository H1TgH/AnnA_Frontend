import { useEffect, useRef, useState } from 'react';

interface UserStatus {
  status: 'online' | 'offline';
  last_seen: string | null;
}

export const usePresence = (user: any) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Состояние для хранения статусов пользователей
  const [userStatuses, setUserStatuses] = useState<Map<string, UserStatus>>(new Map());

  const connect = () => {
    if (!user || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const getTokenFromCookies = () => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'refresh_token') {
            return value;
          }
        }
        return null;
      };

      const token = getTokenFromCookies();
      const wsUrl = `ws://localhost:8000/api/v1/ws/presence${token ? `?token=${token}` : ''}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for presence');
        
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send('ping');
          }
        }, 25000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Обрабатываем обновления статусов пользователей
          if (data.type === 'user_status_update') {
            setUserStatuses(prev => {
              const newMap = new Map(prev);
              newMap.set(data.user_id, {
                status: data.status,
                last_seen: data.last_seen
              });
              return newMap;
            });
          }
          
          // Обрабатываем массовые обновления статусов (при первом подключении)
          if (data.type === 'users_status_list') {
            const newStatuses = new Map();
            data.users?.forEach((userStatus: any) => {
              newStatuses.set(userStatus.user_id, {
                status: userStatus.status,
                last_seen: userStatus.last_seen
              });
            });
            setUserStatuses(newStatuses);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        if (event.code !== 1000 && user) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const disconnect = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User logout');
      wsRef.current = null;
    }

    // Очищаем статусы при отключении
    setUserStatuses(new Map());
  };

  // Функция для получения статуса конкретного пользователя
  const getUserStatus = (userId: string): UserStatus => {
    return userStatuses.get(userId) || { status: 'offline', last_seen: null };
  };

  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    disconnect,
    reconnect: connect,
    getUserStatus,
    userStatuses,
  };
};