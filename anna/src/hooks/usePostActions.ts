import { useCallback } from 'react';
import { api, endpoints } from '../utils/api';
import { validatePost, validateComment } from '../utils/validation';

export const usePostActions = (
  user: any,
  posts: any[],
  setPosts: any,
  newPost: any,
  setNewPost: any,
  setPostErrors: any,
  setError: any
) => {
  const handleCreatePost = useCallback(async () => {
    const { errors, isValid } = validatePost(newPost.content, newPost.images);
    if (!isValid) {
      setPostErrors(errors);
      return;
    }

    try {
      const postData = {
        text: newPost.content.trim() || null,
        images: newPost.imageUrls,
      };
      
      const data = await api.post(endpoints.posts.create, postData);

      const newPostData = {
        id: data.post_id,
        text: data.text,
        images: data.images,
        created_at: data.created_at,
        likes_count: 0,
        comments_count: 0,
        comments: [],
        likes: [],
      };

      setPosts((prev: any) => [newPostData, ...prev]);
      setNewPost({ content: '', images: [], imageUrls: [] });
      return true;
    } catch (err: any) {
      setError(err.message || 'Ошибка создания поста');
      return false;
    }
  }, [newPost, setPosts, setNewPost, setPostErrors, setError]);

  const handleLikePost = useCallback(async (postId: string) => {
    if (!user) {
      setError('Авторизуйтесь, чтобы лайкать посты');
      return;
    }

    try {
      await api.post(endpoints.posts.like(postId));
      
      setPosts((prev: any) =>
        prev.map((post: any) =>
          post.id === postId
            ? {
                ...post,
                likes_count: post.likes_count + 1,
                likes: [...post.likes, user.id],
              }
            : post
        )
      );
    } catch (err: any) {
      if (err.message.includes('User already liked this post')) {
        try {
          await api.delete(endpoints.posts.like(postId));
          setPosts((prev: any) =>
            prev.map((post: any) =>
              post.id === postId
                ? {
                    ...post,
                    likes_count: post.likes_count - 1,
                    likes: post.likes.filter((id: string) => id !== user.id),
                  }
                : post
            )
          );
        } catch (deleteErr: any) {
          setError(deleteErr.message || 'Ошибка при удалении лайка');
        }
      } else {
        setError(err.message || 'Ошибка при изменении лайка');
      }
    }
  }, [user, setPosts, setError]);

  const handleAddComment = useCallback(async (postId: string, commentText: string) => {
    if (!user) {
      setError('Авторизуйтесь, чтобы комментировать');
      return;
    }

    const error = validateComment(commentText);
    if (error) {
      return { error };
    }

    try {
      const data = await api.post(endpoints.posts.comment(postId), { 
        text: commentText, 
        parent_id: null 
      });

      const newComment = {
        id: data.id,
        user_id: data.user_id,
        text: data.text,
        created_at: data.created_at,
        replies: [],
      };

      setPosts((prev: any) =>
        prev.map((post: any) =>
          post.id === postId
            ? {
                ...post,
                comments: [newComment, ...post.comments],
                comments_count: post.comments_count + 1,
              }
            : post
        )
      );

      return { success: true, comment: newComment };
    } catch (err: any) {
      setError(err.message || 'Ошибка добавления комментария');
      return { error: err.message || 'Ошибка добавления комментария' };
    }
  }, [user, setPosts, setError]);

  const handleAddReply = useCallback(async (postId: string, commentId: string, replyText: string) => {
    if (!user) {
      setError('Авторизуйтесь, чтобы отвечать на комментарии');
      return;
    }

    const error = validateComment(replyText);
    if (error) {
      return { error };
    }

    try {
      const data = await api.post(endpoints.posts.comment(postId), { 
        text: replyText, 
        parent_id: commentId 
      });

      const newReply = {
        id: data.id,
        user_id: data.user_id,
        text: data.text,
        created_at: data.created_at,
        replies: [],
      };

      setPosts((prev: any) =>
        prev.map((post: any) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.map((comment: any) =>
                  comment.id === commentId
                    ? {
                        ...comment,
                        replies: [newReply, ...comment.replies],
                      }
                    : comment
                ),
                comments_count: post.comments_count + 1,
              }
            : post
        )
      );

      return { success: true, reply: newReply };
    } catch (err: any) {
      setError(err.message || 'Ошибка добавления ответа');
      return { error: err.message || 'Ошибка добавления ответа' };
    }
  }, [user, setPosts, setError]);

  return {
    handleCreatePost,
    handleLikePost,
    handleAddComment,
    handleAddReply,
  };
}; 