import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

interface Conversation {
  conversation_id: string;
  participants: { 
    id: string; 
    name: string; 
    surname: string; 
    avatar_url: string | null;
    status?: string;
  }[];
}

const ChatPage: React.FC = () => {
  const { conversation_id } = useParams<{ conversation_id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const isFetchingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const scrollToBottom = useCallback((smooth = true) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto' 
      });
    }, 100);
  }, []);

  const checkScrollPosition = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 200;
      setShowScrollButton(!isNearBottom);
    }
  }, []);

  const fetchMessages = useCallback(async (cursor?: string) => {
    if (!conversation_id || isFetchingRef.current || !hasMore) return;
    
    isFetchingRef.current = true;
    try {
      const query = cursor ? `?limit=20&cursor=${encodeURIComponent(cursor)}` : '?limit=20';
      const response = await api.get(`/messages/${conversation_id}${query}`);
      
      if (cursor) {
        setMessages((prev) => [...response.messages.reverse(), ...prev]);
      } else {
        setMessages(response.messages.reverse());
        setTimeout(() => scrollToBottom(false), 200);
      }
      
      setNextCursor(response.next_cursor);
      setHasMore(response.has_more);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Ошибка при загрузке сообщений');
    } finally {
      isFetchingRef.current = false;
    }
  }, [conversation_id, hasMore, scrollToBottom]);

  const fetchConversation = useCallback(async () => {
    if (!conversation_id) return;
    
    try {
      const response = await api.get('/messages');
      const conv = response.find((c: Conversation) => c.conversation_id === conversation_id);
      if (conv) {
        setConversation(conv);
      } else {
        setError('Беседа не найдена');
      }
    } catch (err: any) {
      console.error('Error fetching conversation:', err);
      setError(err.message || 'Ошибка при загрузке беседы');
    }
  }, [conversation_id]);

  const connectWebSocket = useCallback(() => {
    if (!conversation_id || !user || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const wsUrl = `ws://localhost:8000/api/v1/ws/chat/${conversation_id}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.event) {
            case 'new_message':
              setMessages((prev) => {
                const exists = prev.some(msg => msg.id === data.message.id);
                if (exists) return prev;
                
                const newMessages = [...prev, data.message];
                setTimeout(() => {
                  const container = messagesContainerRef.current;
                  if (container) {
                    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
                    if (isAtBottom || data.message.sender_id === user?.id) {
                      scrollToBottom();
                    }
                  }
                }, 50);
                
                return newMessages;
              });
              break;

            case 'message_read':
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === data.message_id ? { ...msg, is_read: true } : msg
                )
              );
              break;

            case 'message_edited':
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === data.message.id
                    ? { 
                        ...msg, 
                        text: data.message.text, 
                        is_edited: true, 
                        edited_at: data.message.edited_at 
                      }
                    : msg
                )
              );
              break;

            case 'message_deleted':
              if (data.mode === 'all') {
                setMessages((prev) => prev.filter((msg) => msg.id !== data.message_id));
              }
              break;

            case 'error':
              setConnectionError(data.message);
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connectWebSocket();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError('Не удалось подключиться к чату. Обновите страницу.');
        }
      };

      wsRef.current.onerror = () => {
        setConnectionError('Ошибка подключения к чату');
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Не удалось создать подключение к чату');
    }
  }, [conversation_id, user, scrollToBottom]);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  useEffect(() => {
    const initializeChat = async () => {
      if (authLoading || !user || !conversation_id) return;

      setIsLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchConversation(),
          fetchMessages()
        ]);
        
        connectWebSocket();
      } catch (err) {
        console.error('Error initializing chat:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    return () => {
      disconnectWebSocket();
    };
  }, [authLoading, user, conversation_id, fetchConversation, fetchMessages, connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
          fetchMessages(nextCursor || undefined);
        }
      },
      { rootMargin: '300px', threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [hasMore, nextCursor, fetchMessages]);

  // Focus on input when component loads
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    
    if (!trimmedMessage || !wsRef.current || !conversation || !user || !isConnected) {
      if (!isConnected) {
        setConnectionError('Нет подключения к чату');
      }
      return;
    }

    const receiver = conversation.participants.find((p) => p.id !== user.id);
    if (!receiver) {
      setConnectionError('Получатель не найден');
      return;
    }

    try {
      const messageData = {
        event: 'new_message',
        text: trimmedMessage,
        receiver_id: receiver.id,
      };

      wsRef.current.send(JSON.stringify(messageData));
      setNewMessage('');
      setConnectionError(null);
      
      // Focus back to input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionError('Ошибка отправки сообщения');
    }
  };

  const handleMarkAsRead = useCallback(
    (messageId: string) => {
      if (wsRef.current && isConnected) {
        wsRef.current.send(
          JSON.stringify({
            event: 'read_message',
            message_id: messageId,
          })
        );
      }
    },
    [isConnected]
  );

  const handleRetryConnection = useCallback(() => {
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
    connectWebSocket();
  }, [connectWebSocket]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return messageDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return `Вчера ${messageDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return messageDate.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (error || !conversation) return <ErrorDisplay error={error || 'Беседа не найдена'} />;

  const otherParticipant = conversation.participants.find((p) => p.id !== user?.id);

  return (
    <div 
    className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50"
    style={{ 
      maxHeight: '92vh',
      minHeight: '92vh',
    }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/chats')}
                className="p-2 rounded-xl text-gray-600 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 group"
              >
                <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg overflow-hidden ring-2 ring-white">
                    {otherParticipant?.avatar_url ? (
                      <img
                        src={otherParticipant.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-white text-lg font-bold">
                          {otherParticipant?.name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Online indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                    otherParticipant?.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`}>
                    {otherParticipant?.status === 'online' && (
                      <div className="w-full h-full rounded-full bg-green-500 animate-pulse"></div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {otherParticipant && (
                      <Link
                        to={`/profile/${otherParticipant.id}`}
                        className="hover:underline hover:text-rose-600 transition-colors"
                      >
                        {otherParticipant.name} {otherParticipant.surname}
                      </Link>
                    )}
                  </h1>

                  <p className={`text-sm ${
                    otherParticipant?.status === 'online' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {otherParticipant?.status === 'online' ? 'В сети' : 'Не в сети'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className={`text-sm font-medium ${
                isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {isConnected ? 'Подключено' : 'Переподключение...'}
              </span>
            </div>
          </div>
          
          {/* Connection error */}
          {connectionError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 text-sm">{connectionError}</span>
              </div>
              <button
                onClick={handleRetryConnection}
                className="text-red-700 hover:text-red-800 underline text-sm font-medium transition-colors"
              >
                Повторить
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div 
        ref={messagesContainerRef}
        className="overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-rose-200 scrollbar-track-transparent"
        onScroll={checkScrollPosition}
        style={{ scrollBehavior: 'smooth'}}
      >
        <div className="max-w-4xl mx-auto">
          {/* Load more sentinel */}
          <div ref={sentinelRef} className="h-4" />
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Начните беседу</h3>
              <p className="text-gray-500">Отправьте первое сообщение, чтобы начать общение</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const prevMessage = messages[index - 1];
                const prevDate = prevMessage ? new Date(prevMessage.created_at).toDateString() : null;
                const currDate = new Date(message.created_at).toDateString();
                const showDateDivider = !prevMessage || prevDate !== currDate;

                const nextMessage = messages[index + 1];
                const isLastInGroup = !nextMessage || nextMessage.sender_id !== message.sender_id;

                // 👇 пример логики для "Новые сообщения"
                const firstUnreadIndex = messages.findIndex(m => !m.is_read && m.sender_id !== user?.id);
                const showNewMessagesDivider = index === firstUnreadIndex;

                return (
                  <React.Fragment key={message.id}>
                    {/* Дата */}
                    {showDateDivider && (
                      <div className="flex justify-center my-4">
                        <span className="px-4 py-1 text-xs bg-gray-200/70 text-gray-600 rounded-full shadow-sm">
                          {(() => {
                            const now = new Date();
                            const msgDate = new Date(message.created_at);
                            const diffDays = Math.floor((+now - +msgDate) / (1000 * 60 * 60 * 24));
                            if (diffDays === 0) return "Сегодня";
                            if (diffDays === 1) return "Вчера";
                            return msgDate.toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "short",
                              year: msgDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
                            });
                          })()}
                        </span>
                      </div>
                    )}

                    {/* Новые сообщения */}
                    {showNewMessagesDivider && (
                      <div className="flex justify-center my-2">
                        <span className="px-4 py-1 text-xs bg-rose-100 text-rose-600 rounded-full shadow-md">
                          Новые сообщения
                        </span>
                      </div>
                    )}

                    {/* Сообщение */}
                    <div className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"} group items-end`}>
                      {/* Для чужих сообщений */}
                      {!isOwn && (
                        <div className="w-10 h-10 flex-shrink-0">
                          {isLastInGroup ? (
                            otherParticipant?.avatar_url ? (
                              <img
                                src={otherParticipant.avatar_url}
                                alt="Avatar"
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-white font-bold">{otherParticipant?.name[0]}</span>
                              </div>
                            )
                          ) : (
                            // Если не последнее в группе — просто пустой блок того же размера
                            <div className="w-full h-full" />
                          )}
                        </div>
                      )}

                      {/* Бабл */}
                      <div
                        className={`relative max-w-[70%] px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 ${
                          isOwn
                            ? `bg-gradient-to-br from-rose-500 to-rose-600 text-white ${
                                isLastInGroup ? "rounded-br-md" : ""
                              }`
                            : `bg-white border border-gray-200 text-gray-800 hover:border-gray-300 ${
                                isLastInGroup ? "rounded-bl-md" : ""
                              }`
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.text}
                        </p>

                        {/* Экшены при наведении */}
                        <div
                          className={`absolute ${
                            isOwn ? "-left-16" : "-right-16"
                          } top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity`}
                        >
                          <button className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 shadow-sm">
                            ✏️
                          </button>
                          <button className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 shadow-sm">
                            🗑
                          </button>
                          <button className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 shadow-sm">
                            📋
                          </button>
                        </div>
                      </div>

                      {/* Время + статус */}
                      {isLastInGroup && (
                        <div
                          className={`flex items-center gap-2 mt-1 px-1 ${
                            isOwn ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(message.created_at)}
                            {message.is_edited && " (изм.)"}
                          </span>
                          {isOwn && (
                            <svg
                              className={`w-4 h-4 ${
                                message.is_read ? "text-blue-500" : "text-gray-400"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={() => scrollToBottom()}
          className="fixed bottom-24 right-8 w-12 h-12 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-all duration-200 hover:scale-110 animate-bounce-in z-10"
        >
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}

      {/* Message input */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-md border-t border-gray-200/50 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isConnected ? "Напишите сообщение..." : "Подключение..."}
                disabled={!isConnected}
                rows={1}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all duration-200 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed text-sm leading-relaxed placeholder:text-gray-400"
                style={{ 
                  minHeight: '48px',
                  maxHeight: '120px',
                  overflowY: newMessage.split('\n').length > 3 ? 'scroll' : 'hidden'
                }}
                maxLength={1000}
              />
              
              {/* Character counter */}
              {newMessage.length > 800 && (
                <div className="absolute -top-6 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                  {newMessage.length}/1000
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!isConnected || !newMessage.trim()}
              className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl hover:from-rose-600 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center group"
            >
              <svg 
                className={`w-5 h-5 transition-transform ${
                  newMessage.trim() ? 'translate-x-0' : 'translate-x-0'
                } group-hover:translate-x-0.5`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                />
              </svg>
            </button>
          </form>
          
          {/* Typing indicator placeholder */}
          {isTyping && (
            <div className="flex items-center gap-2 mt-2 px-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-gray-500">печатает...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;