import { useState, useCallback, useMemo } from 'react';
import { Post } from '../components/types/Profile';

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState({
    content: '',
    images: [] as File[],
    imageUrls: [] as string[],
  });
  const [postErrors, setPostErrors] = useState({
    content: '',
    images: '',
  });

  const allPhotos = useMemo(() => {
    return posts.reduce((acc: string[], post) => [...acc, ...post.images], []);
  }, [posts]);

  const addPost = useCallback((post: Post) => {
    setPosts(prev => [post, ...prev]);
  }, []);

  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, ...updates } : post
    ));
  }, []);

  const resetNewPost = useCallback(() => {
    setNewPost({ content: '', images: [], imageUrls: [] });
    setPostErrors({ content: '', images: '' });
  }, []);

  const setNewPostData = useCallback((field: string, value: any) => {
    setNewPost(prev => ({ ...prev, [field]: value }));
    setPostErrors(prev => ({ ...prev, [field === 'content' ? 'content' : 'images']: '' }));
  }, []);

  return {
    posts,
    newPost,
    postErrors,
    allPhotos,
    addPost,
    updatePost,
    resetNewPost,
    setNewPostData,
    setPosts,
    setPostErrors,
  };
}; 