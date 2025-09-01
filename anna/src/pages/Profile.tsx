import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../App';
import ProfileHeader from '../components/Profile/ProfileHeader';
import AvatarEditor from '../components/Profile/AvatarEditor';
import ProfileEditor from '../components/Profile/ProfileEditor';
import CreatePostForm from '../components/Profile/CreatePostForm';
import PhotosFeed from '../components/Profile/PhotosFeed';
import PostsFeed from '../components/Profile/PostsFeed';
import ImageModal from '../components/Profile/ImageModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import CreatePostButton from '../components/CreatePostButton';

import { useProfile } from '../hooks/useProfile';
import { usePosts } from '../hooks/usePosts';
import { useUIState } from '../hooks/useUIState';
import { useComments } from '../hooks/useComments';
import { useImages } from '../hooks/useImages';
import { useProfileForm, usePostForm } from '../hooks/useForms';
import { useAvatar } from '../hooks/useAvatar';
import { usePostActions } from '../hooks/usePostActions';
import { useDataFetching } from '../hooks/useDataFetching';
import { usePostImages } from '../hooks/usePostImages';
import { useProfileActions } from '../hooks/useProfileActions';

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading, setUser } = useAuth();

  // Основные хуки состояния
  const {
    profile,
    isLoading,
    error,
    isOwnProfile,
    setProfileData,
    updateProfile,
    setLoading,
    setErrorState,
  } = useProfile();

  const {
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
  } = usePosts();

  const {
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
  } = useUIState();

  const {
    commentInputs,
    replyInputs,
    replyFormVisible,
    commentErrors,
    replyErrors,
    visibleComments,
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
  } = useComments();

  const {
    selectedImage,
    currentImageIndex,
    currentImageIndices,
    handleImageClick,
    handleCloseModal,
    handlePrevImage,
    handleNextImage,
    handlePrevPostImage,
    handleNextPostImage,
    setCurrentImageIndices,
  } = useImages();

  const {
    formData,
    formErrors,
    setFormData,
    setFormErrors,
    handleFormChange,
    resetForm,
  } = useProfileForm({
    name: '',
    surname: '',
    status: '',
    birthday: '',
    gender: '',
  });

  const {
    newPost: postFormData,
    postErrors: postFormErrors,
    setNewPost: setPostFormData,
    setPostErrors: setPostFormErrors,
    handlePostChange,
    resetPostForm,
  } = usePostForm();

  // Хуки для действий
  const { handleProfileSave } = useProfileActions(
    formData,
    setFormErrors,
    updateProfile,
    setUser
  );

  const { handleCreatePost, handleLikePost, handleAddComment, handleAddReply } = usePostActions(
    user,
    posts,
    setPosts,
    newPost,
    setNewPostData,
    setPostErrors,
    setErrorState
  );

  const { handlePostImagesChange, removePostImage } = usePostImages(
    newPost,
    setNewPostData,
    setPostErrors
  );

  const { avatarFile, handleAvatarChange, handleAvatarSave, resetAvatar } = useAvatar(
    isOwnProfile,
    updateProfile,
    setUser
  );

  // Хуки для загрузки данных
  const { fetchProfile, fetchPosts } = useDataFetching(
    id,
    user,
    setProfileData,
    setLoading,
    setErrorState,
    setPosts
  );

  // Обработчики событий
  const handleAvatarClick = () => {
    if (isOwnProfile) {
      showAvatarButton();
    }
  };

  const handleAvatarEditToggle = () => {
    toggleAvatarEdit();
    resetAvatar();
  };

  const handleProfileEditToggle = () => {
    if (profile) {
      resetForm({
        name: profile.name,
        surname: profile.surname,
        status: profile.status || '',
        birthday: profile.birthday,
        gender: profile.gender || '',
      });
    }
    toggleProfileEdit();
  };

  const handleCreatePostToggle = () => {
    toggleCreatePost();
    resetPostForm();
  };

  const handleFormSubmit = async () => {
    try {
      await handleProfileSave();
      toggleProfileEdit();
    } catch (err: any) {
      setErrorState(err.message);
    }
  };

  const handlePostSubmit = async () => {
    const success = await handleCreatePost();
    if (success) {
      toggleCreatePost();
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    const commentText = commentInputs[postId] || '';
    if (!commentText.trim()) return;
    
    const result = await handleAddComment(postId, commentText);
    
    if (result?.success) {
      clearCommentInput(postId);
      // Устанавливаем количество видимых комментариев, если комментарии еще не открыты
      if (!visibleComments[postId] || visibleComments[postId] === 0) {
        setVisibleComments((prev: { [postId: string]: number }) => ({ ...prev, [postId]: 3 }));
      }
    } else if (result?.error) {
      setCommentErrors((prev: { [postId: string]: string }) => ({ ...prev, [postId]: result.error }));
    }
  };

  const handleReplySubmit = async (postId: string, commentId: string) => {
    const replyText = replyInputs[commentId] || '';
    if (!replyText.trim()) return;
    
    const result = await handleAddReply(postId, commentId, replyText);
    
    if (result?.success) {
      clearReplyInput(commentId);
      toggleReplyForm(commentId);
    } else if (result?.error) {
      setReplyErrors((prev: { [commentId: string]: string }) => ({ ...prev, [commentId]: result.error }));
    }
  };

  const handleAvatarSubmit = async () => {
    try {
      await handleAvatarSave();
      toggleAvatarEdit();
    } catch (err: any) {
      setErrorState(err.message);
    }
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
      fetchPosts();
    }
  }, [fetchProfile, fetchPosts, authLoading, user]);

  // Обновление формы при изменении профиля
  useEffect(() => {
    if (profile && isEditingProfile) {
      resetForm({
        name: profile.name,
        surname: profile.surname,
        status: profile.status || '',
        birthday: profile.birthday,
        gender: profile.gender || '',
      });
    }
  }, [profile, isEditingProfile, resetForm]);

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !profile) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="min-h-screen bg-rose-50 p-6 sm:p-12 font-sans pt-20">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          isHoveringAvatar={isHoveringAvatar}
          setIsHoveringAvatar={setIsHoveringAvatar}
          handleAvatarClick={handleAvatarClick}
          handleProfileEditToggle={handleProfileEditToggle}
          isAvatarButtonVisible={isAvatarButtonVisible}
          handleAvatarEditToggle={handleAvatarEditToggle}
        />
        
        <PhotosFeed allPhotos={allPhotos} handleImageClick={handleImageClick} />
        
        <CreatePostButton isOwnProfile={isOwnProfile} onClick={handleCreatePostToggle} />
        
        <PostsFeed
          posts={posts}
          profile={profile}
          user={user}
          currentImageIndices={currentImageIndices}
          visibleComments={visibleComments}
          commentInputs={commentInputs}
          replyInputs={replyInputs}
          replyFormVisible={replyFormVisible}
          commentErrors={commentErrors}
          replyErrors={replyErrors}
          handleLikePost={handleLikePost}
          handleCommentChange={setCommentInput}
          handleReplyChange={setReplyInput}
          toggleReplyForm={toggleReplyForm}
          toggleComments={toggleComments}
          loadMoreComments={loadMoreComments}
          handlePrevPostImage={(postId) => handlePrevPostImage(postId, posts)}
          handleNextPostImage={(postId) => handleNextPostImage(postId, posts)}
          handleImageClick={handleImageClick}
          handleAddComment={handleCommentSubmit}
          handleAddReply={handleReplySubmit}
          allPhotos={allPhotos}
          setCurrentImageIndices={setCurrentImageIndices}
        />
      </div>

      <ImageModal
        selectedImage={selectedImage}
        allPhotos={allPhotos}
        currentImageIndex={currentImageIndex}
        handleCloseModal={handleCloseModal}
        handlePrevImage={() => handlePrevImage(allPhotos)}
        handleNextImage={() => handleNextImage(allPhotos)}
      />

      <AvatarEditor
        isEditingAvatar={isEditingAvatar}
        isOwnProfile={isOwnProfile}
        avatarFile={avatarFile}
        error={error}
        handleAvatarEditToggle={handleAvatarEditToggle}
        handleAvatarChange={handleAvatarChange}
        handleAvatarSave={handleAvatarSubmit}
      />

      <ProfileEditor
        isEditingProfile={isEditingProfile}
        isOwnProfile={isOwnProfile}
        formData={formData}
        formErrors={formErrors}
        error={error}
        handleProfileEditToggle={handleProfileEditToggle}
        handleFormChange={handleFormChange}
        handleProfileSave={handleFormSubmit}
      />

      <CreatePostForm
        isCreatingPost={isCreatingPost}
        isOwnProfile={isOwnProfile}
        newPost={newPost}
        postErrors={postErrors}
        error={error}
        handleCreatePostToggle={handleCreatePostToggle}
        handlePostChange={handlePostChange}
        handlePostImagesChange={handlePostImagesChange}
        removePostImage={removePostImage}
        handleCreatePost={handlePostSubmit}
      />
    </div>
  );
};

export default ProfilePage;