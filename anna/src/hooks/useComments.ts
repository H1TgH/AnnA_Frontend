import { useState, useCallback } from 'react';
import { api, endpoints } from '../utils/api';

export const useComments = () => {
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});
  const [replyFormVisible, setReplyFormVisible] = useState<{ [commentId: string]: boolean }>({});
  const [commentErrors, setCommentErrors] = useState<{ [postId: string]: string }>({});
  const [replyErrors, setReplyErrors] = useState<{ [commentId: string]: string }>({});
  const [visibleComments, setVisibleComments] = useState<{ [postId: string]: number }>({});
  const [commentsLoading, setCommentsLoading] = useState<{ [postId: string]: boolean }>({});

  const setCommentInput = useCallback((postId: string, value: string) => {
    setCommentInputs((prev: { [postId: string]: string }) => ({ ...prev, [postId]: value }));
    setCommentErrors((prev: { [postId: string]: string }) => ({ ...prev, [postId]: '' }));
  }, []);

  const setReplyInput = useCallback((commentId: string, value: string) => {
    setReplyInputs((prev: { [commentId: string]: string }) => ({ ...prev, [commentId]: value }));
    setReplyErrors((prev: { [commentId: string]: string }) => ({ ...prev, [commentId]: '' }));
  }, []);

  const toggleReplyForm = useCallback((commentId: string) => {
    setReplyFormVisible((prev: { [postId: string]: boolean }) => ({ ...prev, [commentId]: !prev[commentId] }));
    setReplyInputs((prev: { [commentId: string]: string }) => ({ ...prev, [commentId]: '' }));
    setReplyErrors((prev: { [commentId: string]: string }) => ({ ...prev, [commentId]: '' }));
  }, []);

  const toggleComments = useCallback(async (postId: string, posts: any[], setPosts: any) => {
    // Если комментарии уже загружены, просто переключаем видимость
    if (visibleComments[postId] && visibleComments[postId] > 0) {
      setVisibleComments((prev: { [postId: string]: number }) => ({
        ...prev,
        [postId]: 0,
      }));
      return;
    }

    // Если комментарии не загружены, загружаем их
    if (!posts.find(p => p.id === postId)?.comments?.length) {
      setCommentsLoading((prev: { [postId: string]: boolean }) => ({ ...prev, [postId]: true }));
      
      try {
        const response = await api.get(endpoints.posts.comments(postId));
        const comments = response.comments || [];
        
        // Обновляем посты с загруженными комментариями
        setPosts((prevPosts: any[]) =>
          prevPosts.map((post: any) =>
            post.id === postId
              ? { ...post, comments, comments_count: comments.length }
              : post
          )
        );
        
        // Показываем комментарии
        setVisibleComments((prev: { [postId: string]: number }) => ({
          ...prev,
          [postId]: 3,
        }));
      } catch (error) {
        console.error('Ошибка загрузки комментариев:', error);
        setCommentErrors((prev: { [postId: string]: string }) => ({ 
          ...prev, 
          [postId]: 'Ошибка загрузки комментариев' 
        }));
      } finally {
        setCommentsLoading((prev: { [postId: string]: boolean }) => ({ ...prev, [postId]: false }));
      }
    } else {
      // Комментарии уже загружены, просто показываем их
      setVisibleComments((prev: { [postId: string]: number }) => ({
        ...prev,
        [postId]: 3,
      }));
    }
  }, [visibleComments]);

  const loadMoreComments = useCallback((postId: string) => {
    setVisibleComments((prev: { [postId: string]: number }) => ({
      ...prev,
      [postId]: (prev[postId] || 3) + 3,
    }));
  }, []);

  const clearCommentInput = useCallback((postId: string) => {
    setCommentInputs((prev: { [postId: string]: string }) => ({ ...prev, [postId]: '' }));
    setCommentErrors((prev: { [postId: string]: string }) => ({ ...prev, [postId]: '' }));
  }, []);

  const clearReplyInput = useCallback((commentId: string) => {
    setReplyInputs((prev: { [commentId: string]: string }) => ({ ...prev, [commentId]: '' }));
    setReplyErrors((prev: { [commentId: string]: string }) => ({ ...prev, [commentId]: '' }));
  }, []);

  return {
    commentInputs,
    replyInputs,
    replyFormVisible,
    commentErrors,
    replyErrors,
    visibleComments,
    commentsLoading,
    setCommentInput,
    setReplyInput,
    toggleReplyForm,
    toggleComments,
    loadMoreComments,
    clearCommentInput,
    clearReplyInput,
    setCommentErrors,
    setReplyErrors,
    setVisibleComments,
  };
}; 