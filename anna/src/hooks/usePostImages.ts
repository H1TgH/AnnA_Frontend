import { useCallback } from 'react';
import { api, endpoints } from '../utils/api';

export const usePostImages = (
  newPost: any,
  setNewPost: any,
  setPostErrors: any
) => {
  const handlePostImagesChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).slice(0, 10 - newPost.images.length);
    
    try {
      const uploadUrls = await Promise.all(
        newImages.map(async () => {
          const response = await api.get(endpoints.posts.uploadUrl);
          console.log('Upload URL response:', response); // <--- проверить object_name
          return response;
        })
      );

      const uploadedUrls: string[] = [];
      for (let i = 0; i < newImages.length; i++) {
        await api.uploadFile(uploadUrls[i].upload_url, newImages[i]);
        uploadedUrls.push(uploadUrls[i].object_name);
      }

      setNewPost((prev: any) => ({
        ...prev,
        images: [...prev.images, ...newImages],
        imageUrls: [...prev.imageUrls, ...uploadedUrls],
      }));
      
      setPostErrors((prev: any) => ({ ...prev, images: '' }));
    } catch (err: any) {
      setPostErrors((prev: any) => ({ 
        ...prev, 
        images: err.message || 'Ошибка загрузки изображений' 
      }));
    }
  }, [newPost.images, newPost.imageUrls, setNewPost, setPostErrors]);

  const removePostImage = useCallback((index: number) => {
    setNewPost((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: any, i: number) => i !== index),
      imageUrls: prev.imageUrls.filter((_: any, i: number) => i !== index),
    }));
  }, [setNewPost]);

  return {
    handlePostImagesChange,
    removePostImage,
  };
}; 