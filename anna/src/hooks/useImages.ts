import { useState, useCallback } from 'react';

export const useImages = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [currentImageIndices, setCurrentImageIndices] = useState<{ [postId: string]: number }>({});

  const handleImageClick = useCallback((imageUrl: string, index: number) => {
    setSelectedImage(imageUrl);
    setCurrentImageIndex(index);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedImage(null);
    setCurrentImageIndex(0);
  }, []);

  const handlePrevImage = useCallback((allPhotos: string[]) => {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : allPhotos.length - 1;
    setCurrentImageIndex(newIndex);
    setSelectedImage(allPhotos[newIndex]);
  }, [currentImageIndex]);

  const handleNextImage = useCallback((allPhotos: string[]) => {
    const newIndex = currentImageIndex < allPhotos.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    setSelectedImage(allPhotos[newIndex]);
  }, [currentImageIndex]);

  const handleImageSelect = useCallback((index: number, allPhotos: string[]) => {
    setCurrentImageIndex(index);
    setSelectedImage(allPhotos[index]);
  }, []);

  const handlePrevPostImage = useCallback((postId: string, posts: any[]) => {
    setCurrentImageIndices(prev => {
      const currentIndex = prev[postId] || 0;
      const post = posts.find((p) => p.id === postId);
      const nextIndex = currentIndex > 0 ? currentIndex - 1 : (post?.images.length || 1) - 1;
      return { ...prev, [postId]: nextIndex };
    });
  }, []);

  const handleNextPostImage = useCallback((postId: string, posts: any[]) => {
    setCurrentImageIndices(prev => {
      const currentIndex = prev[postId] || 0;
      const post = posts.find((p) => p.id === postId);
      const nextIndex = currentIndex < (post?.images.length || 1) - 1 ? currentIndex + 1 : 0;
      return { ...prev, [postId]: nextIndex };
    });
  }, []);

  return {
    selectedImage,
    currentImageIndex,
    currentImageIndices,
    handleImageClick,
    handleCloseModal,
    handlePrevImage,
    handleNextImage,
    handleImageSelect,
    handlePrevPostImage,
    handleNextPostImage,
    setCurrentImageIndices,
  };
};