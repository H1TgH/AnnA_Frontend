// useDataFetching.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, endpoints } from '../utils/api';
import { UserProfile } from '../components/types/Profile';

export const useDataFetching = (
  id: string | undefined,
  user: any,
  setProfileData: (data: UserProfile, isOwn: boolean) => void,
  setLoading: (loading: boolean) => void,
  setErrorState: (error: string | null) => void,
  setPosts: any
) => {
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    if (!id || !user) {
      setErrorState('Пользователь не авторизован или ID профиля не указан');
      navigate('/', { replace: true });
      return;
    }

    setLoading(true);
    setErrorState(null);

    try {
      const isOwn = id === user.id;

      if (isOwn) {
        setProfileData({ ...user, status: user.status || null, gender: user.gender || null }, true);
      } else {
        const profileData = await api.get(endpoints.users.profile(id));
        setProfileData({
          id: profileData.id,
          name: profileData.name,
          surname: profileData.surname,
          email: profileData.email || '',
          birthday: profileData.birthday,
          gender: profileData.gender || null,
          avatar_url: profileData.avatar_url,
          status: profileData.status || null,
        }, false);
      }
    } catch (err: any) {
      setErrorState(err.message || 'Ошибка загрузки профиля');
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, user, setProfileData, setLoading, setErrorState, navigate]);

  // ---------- изменённая функция fetchPosts ----------
  // Если cursor не передан — это initial load: replace posts.
  // Если передан — append к существующим.
  const fetchPosts = useCallback(async (cursor?: string, limit = 10) => {
    if (!id) return [];
    try {
      const data = await api.get(endpoints.posts.userPosts(id, limit, cursor));
      const mapped = (data.posts || []).map((post: any) => ({
        id: post.id,
        text: post.text,
        images: post.images || [],
        created_at: post.created_at,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        comments: post.comments || [],
        likes: post.likes || [],
        is_liked: post.is_liked
      }));

      if (cursor) {
        // append
        setPosts((prev: any[]) => [...prev, ...mapped]);
      } else {
        // initial load / replace
        setPosts(mapped);
      }

      return mapped; // возвращаем подгруженные посты для логики hasMore
    } catch (err: any) {
      setErrorState(err.message || 'Ошибка загрузки постов');
      return [];
    }
  }, [id, setPosts, setErrorState]);

  return {
    fetchProfile,
    fetchPosts,
  };
};
