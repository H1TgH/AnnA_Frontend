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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const previousScrollHeightRef = useRef(0);

  /** -------------------- Запрет скролла страницы -------------------- **/
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  /** -------------------- Загрузка данных -------------------- **/
  const fetchInitialData = useCallback(async () => {
    if (!conversation_id || !user) return;
    setIsLoading(true);
    setError(null);

    try {
      const conversationsResponse = await api.get('/messages');
      const conversation = conversationsResponse.find((conv: any) => conv.conversation_id === conversation_id);
      if (!conversation || !conversation.participants[0]) {
        setError('Беседа не найдена');
        return;
      }

      const participant = conversation.participants[0];
      const messagesResponse = await api.get(`/messages/${conversation_id}?limit=50`);
      const messagesData = messagesResponse.messages.reverse();

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

  const loadMoreMessages = useCallback(async () => {
    if (!conversation_id || !hasMore || isFetchingRef.current || !nextCursor) return;

    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      const container = messagesContainerRef.current;
      if (container) previousScrollHeightRef.current = container.scrollHeight;

      const cursorISO = new Date(nextCursor).toISOString();
      const response = await api.get(`/messages/${conversation_id}?limit=30&cursor=${cursorISO}`);
      const newMessages = response.messages.reverse();

      setMessages(prev => [...newMessages, ...prev]);
      setHasMore(response.has_more);
      setNextCursor(response.next_cursor);

      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - previousScrollHeightRef.current;
        }
      }, 0);

    } catch (err: any) {
      console.error('Ошибка при загрузке старых сообщений:', err);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [conversation_id, hasMore, nextCursor]);

  /** -------------------- WebSocket -------------------- **/
  const connectWebSocket = useCallback(() => {
    if (!conversation_id || !user) return;
    const websocket = new WebSocket(`ws://localhost:8000/api/v1/ws/chat/${conversation_id}`);

    websocket.onopen = () => setWs(websocket);
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === 'new_message') {
        setMessages(prev => [...prev, data.message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else if (data.event === 'message_read') {
        setMessages(prev => prev.map(m => m.id === data.message_id ? { ...m, is_read: true } : m));
      } else if (data.event === 'message_edited') {
        setMessages(prev => prev.map(m => m.id === data.message.id ? { ...m, text: data.message.text, is_edited: true } : m));
      } else if (data.event === 'message_deleted') {
        if (data.mode === 'all') {
          setMessages(prev => prev.filter(m => m.id !== data.message_id));
        } else {
          setMessages(prev => prev.filter(m => m.id !== data.message_id));
        }
      }
    };
    websocket.onerror = (error) => console.error('WebSocket ошибка:', error);
    websocket.onclose = () => setWs(null);

    return websocket;
  }, [conversation_id, user]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !ws || isSending) return;
    setIsSending(true);

    try {
      ws.send(JSON.stringify({ event: 'new_message', text: newMessage.trim() }));
      setNewMessage('');
    } catch (err) {
      console.error('Ошибка при отправке сообщения:', err);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, ws, isSending]);

  // Редактирование сообщения
  const startEditMessage = useCallback((messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setEditingText(currentText);
  }, []);

  const cancelEditMessage = useCallback(() => {
    setEditingMessageId(null);
    setEditingText('');
  }, []);

  const saveEditMessage = useCallback(() => {
    if (!ws || !editingMessageId || !editingText.trim()) return;
    ws.send(JSON.stringify({ event: 'edit_message', message_id: editingMessageId, text: editingText.trim() }));
    setEditingMessageId(null);
    setEditingText('');
  }, [ws, editingMessageId, editingText]);

  // Удаление сообщения
  const deleteMessageForMe = useCallback((messageId: string) => {
    if (!ws) return;
    // backend ожидает mode: 'self' | 'all'
    ws.send(JSON.stringify({ event: 'delete_message', message_id: messageId, mode: 'self' }));
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, [ws]);

  const deleteMessageForAll = useCallback((messageId: string) => {
    if (!ws) return;
    ws.send(JSON.stringify({ event: 'delete_message', message_id: messageId, mode: 'all' }));
  }, [ws]);

  /** -------------------- Отметка прочитанных сообщений -------------------- **/
  const markMessagesAsRead = useCallback(() => {
    if (!ws || !user) return;

    messages.forEach(message => {
      if (message.sender_id !== user.id && !message.is_read) {
        ws.send(JSON.stringify({ event: 'read_message', message_id: message.id }));
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, is_read: true } : m));
      }
    });
  }, [ws, messages, user]);

  // IntersectionObserver для автоматического прочтения видимых сообщений
  useEffect(() => {
    if (!messagesContainerRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            markMessagesAsRead();
          }
        });
      },
      { root: messagesContainerRef.current, threshold: 1.0 }
    );

    const messageElements = messagesContainerRef.current.querySelectorAll('.message-item');
    messageElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, markMessagesAsRead]);

  /** -------------------- Форматирование -------------------- **/
  const formatMessageTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = (now.getTime() - date.getTime()) / 1000;
    if (diffSec < 60) return 'только что';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мин назад`;
    if (diffSec < 86400) return `был(а) в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffSec < 604800) return `был(а) ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;
    return `был(а) ${date.toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'short', year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
    })}`;
  };

  const getMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Сегодня';
    if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: today.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
    });
  };

  const shouldShowDateSeparator = (curr: Message, prev?: Message) => !prev || new Date(curr.created_at).toDateString() !== new Date(prev.created_at).toDateString();
  const shouldShowAvatar = (curr: Message, next?: Message) => !next || curr.sender_id !== next.sender_id;

  /** -------------------- Intersection Observer для пагинации -------------------- **/
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isInitialLoadRef.current) loadMoreMessages();
    }, { rootMargin: '100px', threshold: 0.1 });

    if (topSentinelRef.current) observer.observe(topSentinelRef.current);
    return () => observer.disconnect();
  }, [loadMoreMessages]);

  /** -------------------- Инициализация -------------------- **/
  useEffect(() => { if (!authLoading && user) fetchInitialData(); }, [authLoading, user, fetchInitialData]);
  useEffect(() => { if (conversationData && user) { const ws = connectWebSocket(); return () => ws?.close(); } }, [conversationData, user, connectWebSocket]);
  useEffect(() => { if (messages.length > 0 && isInitialLoadRef.current) { setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }); isInitialLoadRef.current = false; }, 100); } }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  if (!conversationData) return <ErrorDisplay error="Данные чата не найдены" />;

  const { participant } = conversationData;

  return (
    <div className="h-screen flex flex-col items-center bg-red-50">
      <div className="w-full max-w-4xl flex flex-col flex-1 bg-white">
        {/* Чат-хедер */}
        <div className="sticky top-[60px] bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm z-20">
          <button onClick={() => navigate('/chats')} className="text-gray-600 hover:text-gray-800 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="relative flex-shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${participant.id}`)}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-200 to-rose-300 border-2 border-white shadow-sm overflow-hidden">
              {participant.avatar_url ? (
                <img src={participant.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-rose-600 text-lg font-bold">{participant.name[0]}</span>
                </div>
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${participant.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}>
              {participant.status === 'online' && <div className="absolute inset-0.5 rounded-full bg-green-500 animate-pulse"></div>}
            </div>
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${participant.id}`)}>
            <h2 className="text-lg font-semibold text-gray-900 truncate">{participant.name} {participant.surname}</h2>
            <p className="text-sm text-gray-600">{participant.status === 'online' ? 'в сети' : participant.last_seen ? formatLastSeen(participant.last_seen) : 'был(а) недавно'}</p>
          </div>
        </div>

        {/* Область сообщений */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-2" style={{ maxHeight: 'calc(100vh - 60px - 64px - 64px)' }}>
          {hasMore && (
            <div ref={topSentinelRef} className="flex justify-center py-4">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Загружаем старые сообщения...</span>
                </div>
              )}
            </div>
          )}

          {messages.map((message, index) => {
            const prev = index > 0 ? messages[index - 1] : undefined;
            const next = index < messages.length - 1 ? messages[index + 1] : undefined;
            const showDate = shouldShowDateSeparator(message, prev);
            const showAvatar = shouldShowAvatar(message, next);
            const isOwn = message.sender_id === user?.id;
            const isConsecutive = prev?.sender_id === message.sender_id && !showDate;

            return (
              <div key={message.id} className="message-item">
                {showDate && (
                  <div className="flex justify-center my-4">
                    <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">{getMessageDate(message.created_at)}</div>
                  </div>
                )}

                <div className={`flex items-end gap-2 mb-2 ${isOwn ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
                  {!isOwn && showAvatar && (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-rose-200 to-rose-300">
                      {participant.avatar_url ? <img src={participant.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-rose-600 font-bold">{participant.name[0]}</div>}
                    </div>
                  )}
                  <div className={`max-w-xs sm:max-w-md lg:max-w-lg ${isOwn ? 'order-first' : ''}`}>
                    <div className={`px-3 py-2 rounded-2xl relative group ${isOwn ? 'bg-rose-500 text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'} ${isConsecutive ? (isOwn ? 'rounded-br-2xl' : 'rounded-bl-2xl') : ''}`}>
                      {editingMessageId === message.id ? (
                        <div className="flex items-end gap-2">
                          <textarea
                            className={`w-full bg-transparent border rounded-md px-2 py-1 text-sm ${isOwn ? 'border-rose-200 placeholder:opacity-70' : 'border-gray-300'}`}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={1}
                          />
                          <button onClick={saveEditMessage} className="text-xs px-2 py-1 rounded bg-emerald-500 text-white">Сохранить</button>
                          <button onClick={cancelEditMessage} className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">Отмена</button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap break-words pr-10">{message.text}</p>
                          <div className={`absolute right-2 bottom-1 flex items-center gap-1 text-[10px] ${isOwn ? 'text-rose-100' : 'text-gray-500'}`}>
                            <span>{formatMessageTime(message.created_at)}</span>
                            {isOwn && (
                              <span aria-label={message.is_read ? 'Прочитано' : 'Отправлено'}>{message.is_read ? '✓✓' : '✓'}</span>
                            )}
                          </div>
                          {message.is_edited && (
                            <div className={`mt-1 text-[10px] opacity-70 italic ${isOwn ? 'text-rose-100' : 'text-gray-500'}`}>изменено</div>
                          )}
                          {isOwn && (
                            <div className="absolute -top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button onClick={() => startEditMessage(message.id, message.text)} className="text-[11px] px-2 py-0.5 rounded bg-gray-200 text-gray-700">Ред.</button>
                              <button onClick={() => deleteMessageForMe(message.id)} className="text-[11px] px-2 py-0.5 rounded bg-gray-200 text-gray-700">Уд.</button>
                              <button onClick={() => deleteMessageForAll(message.id)} className="text-[11px] px-2 py-0.5 rounded bg-red-500 text-white">Для всех</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {isOwn && <div className="w-8 flex-shrink-0" />}
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
                style={{ minHeight: '40px', maxHeight: '120px', overflow: newMessage.split('\n').length > 1 ? 'auto' : 'hidden' }}
                onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height='auto'; t.style.height=Math.min(t.scrollHeight,120)+'px'; }}
                disabled={isSending}
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${newMessage.trim() && !isSending ? 'bg-rose-500 text-white hover:bg-rose-600 active:scale-95' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
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
    </div>
  );
};

export default ChatPage;
