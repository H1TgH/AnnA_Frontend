import React, { useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import ProfileHeader from '../components/Profile/ProfileHeader';
import ProfileEditor from '../components/Profile/ProfileEditor';
import AvatarEditor from '../components/Profile/AvatarEditor';
import PhotosFeed from '../components/Profile/PhotosFeed';
import PostsFeed from '../components/Profile/PostsFeed';
import ImageModal from '../components/Profile/ImageModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import CreatePostButton from '../components/CreatePostButton';
import CreatePostForm from '../components/Profile/CreatePostForm';
import { useProfile } from '../hooks/useProfile';
import { usePosts } from '../hooks/usePosts';
import { useUIState } from '../hooks/useUIState';
import { useComments } from '../hooks/useComments';
import { useImages } from '../hooks/useImages';
import { useAvatar } from '../hooks/useAvatar';
import { usePostActions } from '../hooks/usePostActions';
import { useProfileActions } from '../hooks/useProfileActions';
import { useDataFetching } from '../hooks/useDataFetching';
import { usePresence } from '../hooks/usePresence';
import { api, endpoints } from '../utils/api';

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading, setUser } = useAuth();
  const navigate = useNavigate();

  usePresence(user);

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
    handleImageSelect,
    handlePrevPostImage,
    handleNextPostImage,
    setCurrentImageIndices,
  } = useImages();

  const { avatarFile, handleAvatarChange, handleAvatarSave, resetAvatar } = useAvatar(
    isOwnProfile,
    updateProfile,
    setUser
  );

  const { handleProfileSave } = useProfileActions(
    profile,
    setErrorState,
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

  const { fetchProfile, fetchPosts } = useDataFetching(
    id,
    user,
    setProfileData,
    setLoading,
    setErrorState,
    setPosts
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const handleStartChat = async () => {
    if (!id || !user) return;
    try {
      const response = await api.get(`/conversation?receiver_id=${id}`);
      const { conversation_id } = response;
      navigate(`/chats?conversation_id=${conversation_id}`);
    } catch (err) {
      console.error('Ошибка при создании беседы:', err);
      setErrorState('Не удалось начать чат');
    }
  };

  const loadMorePosts = useCallback(async () => {
    if (isFetchingRef.current || !hasMoreRef.current) return;
    if (!posts || posts.length === 0) return;

    isFetchingRef.current = true;
    try {
      const lastPost = posts[posts.length - 1];
      const cursor = lastPost?.created_at;
      const fetched = await fetchPosts(cursor, 10);
      if (!fetched || fetched.length === 0 || fetched.length < 10) {
        hasMoreRef.current = false;
      }
    } catch (err) {
      console.error('Ошибка при загрузке следующей страницы постов:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [posts, fetchPosts]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      {
        root: null,
        rootMargin: '300px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [loadMorePosts]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
      fetchPosts();
    }
  }, [authLoading, user, fetchProfile, fetchPosts]);

  const handleCreatePostToggle = () => {
    toggleCreatePost();
    resetNewPost();
  };

  const handlePostChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewPostData('content', e.target.value);
  };

  const handlePostImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setNewPostData('images', [...newPost.images, ...files]);
  };

  const removePostImage = (index: number) => {
    setNewPostData(
      'images',
      newPost.images.filter((_, i) => i !== index)
    );
    setNewPostData(
      'imageUrls',
      newPost.imageUrls.filter((_, i) => i !== index)
    );
  };

  const handlePostSubmit = async () => {
    if (!newPost.content?.trim() && newPost.images.length === 0) {
      setPostErrors({ content: 'Добавьте текст или изображения', images: '' });
      return;
    }

    try {
      const uploadedUrls: string[] = [];

      for (const file of newPost.images) {
        const { upload_url, object_name } = await api.get(endpoints.posts.uploadUrl);
        await api.uploadFile(upload_url, file);
        uploadedUrls.push(object_name);
      }

      const newPostResponse = await api.post(endpoints.posts.create, {
        text: newPost.content,
        images: uploadedUrls,
      });

      addPost({
        id: newPostResponse.post_id,
        text: newPostResponse.text,
        images: newPostResponse.images,
        created_at: newPostResponse.created_at,
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
        comments: [],
        likes: [],
      });

      resetNewPost();
      toggleCreatePost();
    } catch (err: any) {
      console.error('Ошибка при создании поста:', err);
      setPostErrors({ content: err.message, images: '' });
    }
  };

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedImage) {
          handleCloseModal();
        } else if (isEditingProfile) {
          toggleProfileEdit();
        } else if (isEditingAvatar) {
          toggleAvatarEdit();
        } else if (isCreatingPost) {
          handleCreatePostToggle();
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [selectedImage, isEditingProfile, isEditingAvatar, isCreatingPost, handleCloseModal, toggleProfileEdit, toggleAvatarEdit, handleCreatePostToggle]);

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (error || !profile) return <ErrorDisplay error={error} />;

  return (
    <div className="min-h-screen bg-rose-50 p-6 sm:p-12 font-sans pt-20">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          isHoveringAvatar={isHoveringAvatar}
          setIsHoveringAvatar={setIsHoveringAvatar}
          handleAvatarClick={toggleAvatarEdit}
          handleProfileEditToggle={toggleProfileEdit}
          isAvatarButtonVisible={isAvatarButtonVisible}
          handleAvatarEditToggle={() => { toggleAvatarEdit(); resetAvatar(); }}
        />
        {!isOwnProfile && (
          <div className="p-4">
            <button
              onClick={handleStartChat}
              className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors duration-200"
            >
              Написать сообщение
            </button>
          </div>
        )}
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
          toggleComments={async (postId: string) => await toggleComments(postId, posts, setPosts)}
          loadMoreComments={loadMoreComments}
          handlePrevPostImage={(postId) => handlePrevPostImage(postId, posts)}
          handleNextPostImage={(postId) => handleNextPostImage(postId, posts)}
          handleImageClick={handleImageClick}
          handleAddComment={async (postId: string) => {
            const text = commentInputs[postId] || '';
            if (!text.trim()) return;
            const res = await handleAddComment(postId, text);
            if (res?.success) clearCommentInput(postId);
          }}
          handleAddReply={async (postId: string, commentId: string) => {
            const text = replyInputs[commentId] || '';
            if (!text.trim()) return;
            const res = await handleAddReply(postId, commentId, text);
            if (res?.success) clearReplyInput(commentId);
          }}
          allPhotos={allPhotos}
          setCurrentImageIndices={setCurrentImageIndices}
        />
      </div>
      <div ref={sentinelRef} />
      <ImageModal
        selectedImage={selectedImage}
        allPhotos={allPhotos}
        currentImageIndex={currentImageIndex}
        handleCloseModal={handleCloseModal}
        handlePrevImage={() => handlePrevImage(allPhotos)}
        handleNextImage={() => handleNextImage(allPhotos)}
        handleImageSelect={(index: number) => handleImageSelect(index, allPhotos)}
      />
      <AvatarEditor
        isEditingAvatar={isEditingAvatar}
        isOwnProfile={isOwnProfile}
        avatarFile={avatarFile}
        error={error}
        handleAvatarEditToggle={() => { toggleAvatarEdit(); resetAvatar(); }}
        handleAvatarChange={handleAvatarChange}
        handleAvatarSave={async () => { 
          const success = await handleAvatarSave(); 
          if (success) toggleAvatarEdit();
        }}
      />
      <ProfileEditor
        isEditingProfile={isEditingProfile}
        isOwnProfile={isOwnProfile}
        formData={{
          name: profile.name,
          surname: profile.surname,
          status: profile.status || '',
          birthday: profile.birthday || '',
          gender: profile.gender || '',
        }}
        formErrors={{ name: '', surname: '', status: '', birthday: '' }}
        error={error}
        handleProfileEditToggle={toggleProfileEdit}
        handleFormChange={(e) => {
          const { name, value } = e.target;
          updateProfile({ [name]: value });
        }}
        handleProfileSave={async () => { 
          const success = await handleProfileSave(); 
          if (success) toggleProfileEdit();
        }}
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