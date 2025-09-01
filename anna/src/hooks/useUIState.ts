import { useState, useCallback } from 'react';

export const useUIState = () => {
  const [isEditingAvatar, setIsEditingAvatar] = useState<boolean>(false);
  const [isAvatarButtonVisible, setIsAvatarButtonVisible] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState<boolean>(false);

  const toggleAvatarEdit = useCallback(() => {
    setIsEditingAvatar(prev => !prev);
    setIsAvatarButtonVisible(false);
  }, []);

  const toggleProfileEdit = useCallback(() => {
    setIsEditingProfile(prev => !prev);
  }, []);

  const toggleCreatePost = useCallback(() => {
    setIsCreatingPost(prev => !prev);
  }, []);

  const showAvatarButton = useCallback(() => {
    setIsAvatarButtonVisible(true);
  }, []);

  const hideAvatarButton = useCallback(() => {
    setIsAvatarButtonVisible(false);
  }, []);

  return {
    isEditingAvatar,
    isAvatarButtonVisible,
    isEditingProfile,
    isCreatingPost,
    isHoveringAvatar,
    setIsHoveringAvatar,
    toggleAvatarEdit,
    toggleProfileEdit,
    toggleCreatePost,
    showAvatarButton,
    hideAvatarButton,
  };
}; 