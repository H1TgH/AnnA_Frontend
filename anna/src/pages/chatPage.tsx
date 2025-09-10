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
  participants: { id: string; name: string; surname: string; avatar_url: string | null }[];
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

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (error || !conversation) return <ErrorDisplay error={error || 'Беседа не найдена'} />;

  const otherParticipant = conversation.participants.find((p) => p.id !== user?.id);

  return (
    <div className="min-h-screen bg-rose-50 p-6 sm:p-12 font-sans pt-20">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/chats')}
              className="text-rose-600 hover:text-rose-700"
            >
              ← Назад
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-rose-200 overflow-hidden">
                {otherParticipant?.avatar_url ? (
                  <img
                    src={otherParticipant.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-rose-600 text-sm font-bold">
                      {otherParticipant?.name[0]}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                {otherParticipant?.name} {otherParticipant?.surname}
              </h2>
            </div>
          </div>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div ref={sentinelRef} />
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              onClick={() => !message.is_read && message.sender_id !== user?.id && handleMarkAsRead(message.id)}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.sender_id === user?.id
                    ? 'bg-rose-100 text-gray-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p>{message.text}</p>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(message.created_at).toLocaleTimeString()} {message.is_edited && '(ред.)'}
                  {message.sender_id === user?.id && message.is_read && (
                    <span className="ml-2">✓✓</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Напишите сообщение..."
              className="flex-1 p-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
            />
            <button
              type="submit"
              className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors duration-200"
            >
              Отправить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;