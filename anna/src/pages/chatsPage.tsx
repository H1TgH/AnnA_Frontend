import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import { api } from '../utils/api';

interface Participant {
  id: string;
  name: string;
  surname: string;
  avatar_url: string | null;
  status: string;
}

interface LastMessage {
  id: string;
  text: string;
  sender_id: string;
  created_at: string;
}

interface Conversation {
  conversation_id: string;
  participants: Participant[];
  last_message: LastMessage | null;
  unread_count?: number;
}

const ChatsPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  const fetchConversations = useCallback(async (pageNum: number) => {
    if (!user || isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      const response = await api.get(`/messages?page=${pageNum}&limit=20`);
      const newConversations = response;
      setConversations((prev) => [...prev, ...newConversations]);
      setHasMore(newConversations.length === 20);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке чатов');
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [user, hasMore]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchConversations(page);
    }
  }, [authLoading, user, page, fetchConversations]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conversationId = params.get('conversation_id');
    if (conversationId) {
      navigate(`/chats/${conversationId}`, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
          setPage((prev) => prev + 1);
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
  }, [hasMore]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(
        (conv) =>
          conv.participants.some((p) =>
            `${p.name} ${p.surname}`.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          (conv.last_message?.text.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  const formatLastSeen = (dateString: string) => {
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

  const getLastMessagePreview = (message: LastMessage | null, senderId: string) => {
    if (!message) return 'Нет сообщений';
    const isOwn = message.sender_id === user?.id;
    const prefix = isOwn ? 'Вы: ' : '';
    const text = message.text.length > 35 ? `${message.text.substring(0, 35)}...` : message.text;
    return `${prefix}${text}`;
  };

  const handleConversationClick = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.conversation_id === conversationId ? { ...conv, unread_count: 0 } : conv
      )
    );
    navigate(`/chats/${conversationId}`);
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);
  };

  if (authLoading || (isLoading && page === 1)) return <LoadingSpinner />;
  if (error) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="text-red-600 text-lg mb-2">{error}</div>
        <button
          onClick={() => {
            setError(null);
            fetchConversations(1);
          }}
          className="text-rose-600 hover:text-rose-700"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-red-50 pt-10">
      <div className="max-w-4xl mx-auto bg-white min-h-screen shadow-lg">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Чаты</h1>
                {getTotalUnreadCount() > 0 && (
                  <div className="bg-rose-500 text-white text-sm rounded-full px-2 py-1 min-w-6 h-6 flex items-center justify-center font-medium">
                    {getTotalUnreadCount()}
                  </div>
                )}
              </div>
              <button
                className="bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 transition-colors shadow-lg"
                title="Новый чат"
                onClick={() => navigate('/users/search')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск чатов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Чаты не найдены' : 'У вас пока нет чатов'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm">
                {searchQuery
                  ? 'Попробуйте изменить поисковый запрос'
                  : 'Найдите людей и начните общаться с ними'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate('/users/search')}
                  className="bg-rose-500 text-white px-6 py-3 rounded-full hover:bg-rose-600 transition-colors font-medium"
                >
                  Найти людей
                </button>
              )}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const participant = conversation.participants[0];
              const isUnread = (conversation.unread_count || 0) > 0;

              return (
                <div
                  key={conversation.conversation_id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
                  onClick={() => handleConversationClick(conversation.conversation_id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-200 to-rose-300 border-2 border-white shadow-sm overflow-hidden">
                        {participant?.avatar_url ? (
                          <img
                            src={participant.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-rose-600 text-lg font-bold">
                              {participant?.name[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white shadow-sm ${
                          participant?.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      >
                        {participant?.status === 'online' && (
                          <div className="absolute inset-0.5 rounded-full bg-green-500 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`text-lg font-medium truncate ${
                            isUnread ? 'text-gray-900' : 'text-gray-800'
                          }`}
                        >
                          {participant?.name} {participant?.surname}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {conversation.last_message && (
                            <span className="text-sm text-gray-500">
                              {formatLastSeen(conversation.last_message.created_at)}
                            </span>
                          )}
                          {isUnread && (
                            <div className="bg-rose-500 text-white text-xs rounded-full px-2 py-1 min-w-5 h-5 flex items-center justify-center font-medium">
                              {conversation.unread_count}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm truncate flex-1 ${
                            isUnread ? 'text-gray-700 font-medium' : 'text-gray-600'
                          }`}
                        >
                          {getLastMessagePreview(conversation.last_message, participant.id)}
                        </p>
                        {conversation.last_message?.sender_id === user?.id && (
                          <div className="text-gray-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div ref={sentinelRef} />
      </div>
    </div>
  );
};

export default ChatsPage;