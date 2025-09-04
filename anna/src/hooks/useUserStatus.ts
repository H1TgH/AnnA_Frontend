import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';

export interface UserStatus {
  user_id: string;
  status: 'online' | 'offline';
  last_seen: string | null;
}

export const useUserStatus = (userId: string | undefined) => {
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUserStatus = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);
      const statusData = await api.get(`/users/${userId}/status`);
      setUserStatus(statusData);
    } catch (err: any) {
      setError(err.message || 'Ошибка получения статуса пользователя');
      console.error('Error fetching user status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Периодическое обновление статуса каждые 30 секунд
  useEffect(() => {
    if (!userId) return;

    // Первоначальная загрузка
    fetchUserStatus();

    // Установка интервала для обновления
    intervalRef.current = setInterval(fetchUserStatus, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, fetchUserStatus]);

  const refreshStatus = useCallback(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);

  return {
    userStatus,
    isLoading,
    error,
    refreshStatus,
  };
};

// Хук для WebSocket подключения для текущего пользователя
export const usePresenceWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = useCallback(() => {
    try {
      // WebSocket автоматически отправляет куки в заголовках
      const wsUrl = 'ws://localhost:8000/api/v1/ws/presence';
      console.log('Attempting to connect to WebSocket...');
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Отправляем пинг каждые 25 секунд для поддержания соединения
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send('ping');
          }
        }, 25000);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Переподключение с экспоненциальной задержкой
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
          reconnectAttemptsRef.current++;
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      // Переподключение через 5 секунд при ошибке
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
        reconnectAttemptsRef.current++;
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
  };
};