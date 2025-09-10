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

interface Conversation {
  conversation_id: string;
  participants: { id: string; name: string; surname: string; avatar_url: string | null; status: string }[];
}

const ChatPage: React.FC = () => {
  const { conversation_id } = useParams<{ conversation_id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = useCallback(async (cursor?: string) => {
    if (!conversation_id || isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    try {
      const query = cursor ? `?limit=20&cursor=${encodeURIComponent(cursor)}` : '?limit=20';
      const response = await api.get(`/messages/${conversation_id}${query}`);
      setMessages((prev) => [...response.messages.reverse(), ...prev]);
      setNextCursor(response.next_cursor);
      setHasMore(response.has_more);
      if (!cursor) scrollToBottom();
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке сообщений');
    } finally {
      isFetchingRef.current = false;
    }
  }, [conversation_id, hasMore, scrollToBottom]);

  const fetchConversation = useCallback(async () => {
    try {
      const response = await api.get('/messages');
      const conv = response.find((c: Conversation) => c.conversation_id === conversation_id);
      if (conv) {
        setConversation(conv);
      } else {
        setError('Беседа не найдена');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке беседы');
    }
  }, [conversation_id]);

  const setupWebSocket = useCallback(() => {
    if (!conversation_id || !user) return;

    const wsUrl = `ws://localhost:8000/api/v1/ws/chat/${conversation_id}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'new_message') {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();
      } else if (data.event === 'message_read') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.message_id ? { ...msg, is_read: true } : msg
          )
        );
      } else if (data.event === 'message_edited') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.message.id
              ? { ...msg, text: data.message.text, is_edited: true, edited_at: data.message.edited_at }
              : msg
          )
        );
      } else if (data.event === 'message_deleted') {
        setMessages((prev) => prev.filter((msg) => msg.id !== data.message_id));
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Ошибка подключения к чату');
    };

    return () => {
      wsRef.current?.close();
    };
  }, [conversation_id, user, scrollToBottom]);

  useEffect(() => {
    if (!authLoading && user && conversation_id) {
      fetchConversation();
      fetchMessages();
      setIsLoading(false);
      const cleanup = setupWebSocket();
      return cleanup;
    }
  }, [authLoading, user, conversation_id, fetchMessages, fetchConversation, setupWebSocket]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !wsRef.current || !conversation || !user) return;

    const receiver = conversation.participants.find((p) => p.id !== user.id);
    if (!receiver) return;

    const messageData = {
      event: 'new_message',
      text: newMessage,
      receiver_id: receiver.id,
    };

    wsRef.current.send(JSON.stringify(messageData));
    setNewMessage('');
  };

  const handleMarkAsRead = useCallback(
    (messageId: string) => {
      if (wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            event: 'read_message',
            message_id: messageId,
          })
        );
      }
    },
    []
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

    if (diffInSeconds < 60) return 'только что';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин`;
    if (diffInSeconds < 86400) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (diffInSeconds < 604800) return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (error || !conversation) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="text-red-600 text-lg mb-2">{error || 'Беседа не найдена'}</div>
        <button
          onClick={() => {
            setError(null);
            fetchConversation();
            fetchMessages();
          }}
          className="text-rose-600 hover:text-rose-700"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );

  const otherParticipant = conversation.participants.find((p) => p.id !== user?.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white min-h-screen shadow-lg">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/chats')}
                className="text-rose-600 hover:text-rose-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Назад
              </button>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-200 to-rose-300 border-2 border-white shadow-sm overflow-hidden">
                  {otherParticipant?.avatar_url ? (
                    <img
                      src={otherParticipant.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-rose-600 text-lg font-bold">
                        {otherParticipant?.name[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                    otherParticipant?.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                >
                  {otherParticipant?.status === 'online' && (
                    <div className="absolute inset-0.5 rounded-full bg-green-500 animate-pulse"></div>
                  )}
                </div>
              </div>
              <h2 className="text-lg font-medium text-gray-900">
                {otherParticipant?.name} {otherParticipant?.surname}
              </h2>
            </div>
          </div>
        </div>
        <div className="p-6 max-h-[calc(100vh-180px)] overflow-y-auto">
          <div ref={sentinelRef} />
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              onClick={() => !message.is_read && message.sender_id !== user?.id && handleMarkAsRead(message.id)}
            >
              <div
                className={`max-w-[70%] p-3 rounded-xl ${
                  message.sender_id === user?.id
                    ? 'bg-gradient-to-br from-rose-100 to-rose-200 text-gray-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <span>{formatTime(message.created_at)}</span>
                  {message.is_edited && <span>(ред.)</span>}
                  {message.sender_id === user?.id && message.is_read && (
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M10.707 5.293a1 1 0 010 1.414l-2 2a1 1 0 01-1.414 0l-1-1a1 1 0 011.414-1.414L8 6.586l2.293-2.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Напишите сообщение..."
              className="flex-1 pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              className="bg-rose-500 text-white p-3 rounded-full hover:bg-rose-600 transition-colors shadow-lg"
              disabled={!newMessage.trim()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;