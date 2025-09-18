import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import { api } from '../utils/api';

interface Message {
  id: string;
  sender_id: string;
  text: string;
  is_read: boolean;
  created_at: string;
  is_edited?: boolean;
  edited_at?: string;
}

interface Participant {
  id: string;
  name: string;
  surname: string;
  avatar_url: string | null;
  status: string;
  last_seen?: string;
}

interface ConversationData {
  messages: Message[];
  participant: Participant;
  has_more: boolean;
  next_cursor: string | null;
}

const ChatPage: React.FC = () => {
  const { conversation_id } = useParams<{ conversation_id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const previousScrollHeightRef = useRef(0);

  // Получение данных собеседника и первой порции сообщений
  const fetchInitialData = useCallback(async () => {
    if (!conversation_id || !user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Получаем список бесед для поиска участника
      const conversationsResponse = await api.get('/messages');
      const conversation = conversationsResponse.find((conv: any) => conv.conversation_id === conversation_id);
      
      if (!conversation || !conversation.participants[0]) {
        setError('Беседа не найдена');
        return;
      }

      const participant = conversation.participants[0];
      
      // Получаем историю сообщений
      const messagesResponse = await api.get(`/messages/${conversation_id}?limit=50`);
      const messagesData = messagesResponse.messages.reverse(); // API возвращает в обратном порядке
      
      setConversationData({
        messages: messagesData,
        participant,
        has_more: messagesResponse.has_more,
        next_cursor: messagesResponse.next_cursor
      });
      
      setMessages(messagesData);
      setHasMore(messagesResponse.has_more);
      setNextCursor(messagesResponse.next_cursor);
      
    } catch (err: any) {
      console.error('Ошибка при загрузке данных чата:', err);
      setError(err.message || 'Не удалось загрузить чат');
    } finally {
      setIsLoading(false);
    }
  }, [conversation_id, user]);

  // Загрузка более старых сообщений
  const loadMoreMessages = useCallback(async () => {
    if (!conversation_id || !hasMore || isFetchingRef.current || !nextCursor) return;

    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      const container = messagesContainerRef.current;
      if (container) {
        previousScrollHeightRef.current = container.scrollHeight;
      }

      // Приведение курсора к ISO без лишних пробелов
      const cursorISO = new Date(nextCursor).toISOString();

      const response = await api.get(`/messages/${conversation_id}?limit=30&cursor=${cursorISO}`);
      const newMessages = response.messages.reverse();

      setMessages(prev => [...newMessages, ...prev]);
      setHasMore(response.has_more);
      setNextCursor(response.next_cursor);

      // Восстанавливаем позицию прокрутки после загрузки
      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
          container.scrollTop = scrollDiff;
        }
      }, 0);

    } catch (err: any) {
      console.error('Ошибка при загрузке старых сообщений:', err);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [conversation_id, hasMore, nextCursor]);

  // WebSocket подключение
  const connectWebSocket = useCallback(() => {
    if (!conversation_id || !user) return;
    
    const wsUrl = `ws://localhost:8000/api/v1/ws/chat/${conversation_id}`;
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('WebSocket подключен');
      setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.event === 'new_message') {
        setMessages(prev => [...prev, data.message]);
        // Автоскролл к новому сообщению
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket ошибка:', error);
    };
    
    websocket.onclose = () => {
      console.log('WebSocket отключен');
      setWs(null);
    };
    
    return websocket;
  }, [conversation_id, user]);

  // Отправка сообщения
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !ws || isSending) return;
    
    setIsSending(true);
    
    try {
      ws.send(JSON.stringify({
        event: 'new_message',
        text: newMessage.trim()
      }));
      
      setNewMessage('');
    } catch (err) {
      console.error('Ошибка при отправке сообщения:', err);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, ws, isSending]);

  // Форматирование времени
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Форматирование последнего визита
  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

    if (diffInSeconds < 60) return 'только что';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин назад`;
    if (diffInSeconds < 86400) return `был(а) в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffInSeconds < 604800) return `был(а) ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;
    
    return `был(а) ${date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined,
    })}`;
  };

  // Получение даты сообщения для разделителей
  const getMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: today.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Проверка нужен ли разделитель дат
  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.created_at).toDateString();
    const previousDate = new Date(previousMessage.created_at).toDateString();
    
    return currentDate !== previousDate;
  };

  // Проверка нужна ли аватарка (если это не последнее сообщение в группе от одного пользователя)
  const shouldShowAvatar = (currentMessage: Message, nextMessage?: Message) => {
    if (!nextMessage) return true;
    return currentMessage.sender_id !== nextMessage.sender_id;
  };

  // Intersection Observer для загрузки старых сообщений
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isInitialLoadRef.current) {
          loadMoreMessages();
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    if (topSentinelRef.current) {
      observer.observe(topSentinelRef.current);
    }

    return () => observer.disconnect();
  }, [loadMoreMessages]);

  // Инициализация
  useEffect(() => {
    if (!authLoading && user) {
      fetchInitialData();
    }
  }, [authLoading, user, fetchInitialData]);

  // WebSocket подключение после загрузки данных
  useEffect(() => {
    if (conversationData && user) {
      const websocket = connectWebSocket();
      return () => {
        websocket?.close();
      };
    }
  }, [conversationData, user, connectWebSocket]);

  // Автоскролл при первой загрузке
  useEffect(() => {
    if (messages.length > 0 && isInitialLoadRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        isInitialLoadRef.current = false;
      }, 100);
    }
  }, [messages]);

  // Обработка Enter в поле ввода
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  if (!conversationData) return <ErrorDisplay error="Данные чата не найдены" />;

  const { participant } = conversationData;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Заголовок чата */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm sticky top-0 z-10">
        <button
          onClick={() => navigate('/chats')}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-200 to-rose-300 border-2 border-white shadow-sm overflow-hidden">
            {participant.avatar_url ? (
              <img
                src={participant.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-rose-600 text-lg font-bold">
                  {participant.name[0]}
                </span>
              </div>
            )}
          </div>
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
              participant.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
            }`}
          >
            {participant.status === 'online' && (
              <div className="absolute inset-0.5 rounded-full bg-green-500 animate-pulse"></div>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {participant.name} {participant.surname}
          </h2>
          <p className="text-sm text-gray-600">
            {participant.status === 'online' 
              ? 'в сети' 
              : participant.last_seen 
                ? formatLastSeen(participant.last_seen)
                : 'был(а) недавно'
            }
          </p>
        </div>
      </div>

      {/* Область сообщений */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2"
        style={{ height: 'calc(100vh - 140px)' }}
      >
        {/* Индикатор загрузки старых сообщений */}
        {hasMore && (
          <div ref={topSentinelRef} className="flex justify-center py-4">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Загружаем старые сообщения...</span>
              </div>
            )}
          </div>
        )}

        {/* Сообщения */}
        {messages.map((message, index) => {
          const previousMessage = index > 0 ? messages[index - 1] : undefined;
          const nextMessage = index < messages.length - 1 ? messages[index + 1] : undefined;
          const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
          const showAvatar = shouldShowAvatar(message, nextMessage);
          const isOwnMessage = message.sender_id === user?.id;
          const isConsecutive = previousMessage?.sender_id === message.sender_id && !showDateSeparator;

          return (
            <div key={message.id}>
              {/* Разделитель дат */}
              {showDateSeparator && (
                <div className="flex justify-center my-4">
                  <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {getMessageDate(message.created_at)}
                  </div>
                </div>
              )}

              {/* Сообщение */}
              <div className={`flex items-end gap-2 mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
                {/* Аватар собеседника */}
                {!isOwnMessage && (
                  <div className="flex-shrink-0 w-8">
                    {showAvatar ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-200 to-rose-300 overflow-hidden">
                        {participant.avatar_url ? (
                          <img
                            src={participant.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-rose-600 text-sm font-bold">
                              {participant.name[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Сообщение */}
                <div className={`max-w-xs sm:max-w-md lg:max-w-lg ${isOwnMessage ? 'order-first' : ''}`}>
                  <div
                    className={`px-4 py-2 rounded-2xl relative ${
                      isOwnMessage
                        ? 'bg-rose-500 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                    } ${isConsecutive ? (isOwnMessage ? 'rounded-br-2xl' : 'rounded-bl-2xl') : ''}`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                    {message.is_edited && (
                      <span className={`text-xs opacity-70 italic ${isOwnMessage ? 'text-rose-100' : 'text-gray-500'}`}>
                        {' '}изменено
                      </span>
                    )}
                  </div>
                  
                  {/* Время сообщения */}
                  <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    {formatMessageTime(message.created_at)}
                    {isOwnMessage && (
                      <span className="ml-1">
                        {message.is_read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Отступ для собственных сообщений */}
                {isOwnMessage && <div className="flex-shrink-0 w-8" />}
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 min-h-10 max-h-32 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500 transition-all">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Написать сообщение..."
              className="w-full p-3 bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-500"
              rows={1}
              style={{
                minHeight: '40px',
                maxHeight: '120px',
                overflow: newMessage.split('\n').length > 1 ? 'auto' : 'hidden'
              }}
              onInput={(e) => {
                const textarea = e.target as HTMLTextAreaElement;
                textarea.style.height = 'auto';
                textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
              }}
              disabled={isSending}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              newMessage.trim() && !isSending
                ? 'bg-rose-500 text-white hover:bg-rose-600 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;