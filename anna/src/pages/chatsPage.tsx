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
}

const ChatsPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  const fetchConversations = useCallback(async (pageNum: number) => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      const response = await api.get(`/messages?limit=20`);
      const newConversations = response;
      setConversations((prev) => [...prev, ...newConversations]);
      setHasMore(newConversations.length === 20);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке чатов');
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [hasMore]);

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

  if (authLoading || (isLoading && page === 1)) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div className="min-h-screen bg-rose-50 p-6 sm:p-12 font-sans pt-20">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <h2 className="text-2xl font-bold p-6 text-rose-600">Чаты</h2>
        {conversations.length === 0 ? (
          <p className="p-6 text-gray-600">У вас пока нет чатов</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <li
                key={conversation.conversation_id}
                className="p-4 hover:bg-rose-50 cursor-pointer transition-colors duration-200"
                onClick={() => navigate(`/chats/${conversation.conversation_id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-rose-200 overflow-hidden">
                    {conversation.participants[0]?.avatar_url ? (
                      <img
                        src={conversation.participants[0].avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-rose-600 text-sm font-bold">
                          {conversation.participants[0]?.name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-800">
                        {conversation.participants[0]?.name} {conversation.participants[0]?.surname}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {conversation.participants[0]?.status === 'online' ? (
                          <span className="text-green-500">● Online</span>
                        ) : (
                          'Offline'
                        )}
                      </span>
                    </div>
                    <p className="text-gray-600 truncate">
                      {conversation.last_message?.text || 'Нет сообщений'}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div ref={sentinelRef} />
      </div>
    </div>
  );
};

export default ChatsPage;