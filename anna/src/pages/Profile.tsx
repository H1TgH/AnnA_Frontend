import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { UserProfile, Post, calculateAge } from '../components/types/Profile';
import ProfileHeader from '../components/Profile/ProfileHeader';
import AvatarEditor from '../components/Profile/AvatarEditor';
import ProfileEditor from '../components/Profile/ProfileEditor';
import CreatePostForm from '../components/Profile/CreatePostForm';
import PhotosFeed from '../components/Profile/PhotosFeed';
import PostsFeed from '../components/Profile/PostsFeed';
import ImageModal from '../components/Profile/ImageModal';

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, setUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState<boolean>(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState<boolean>(false);
  const [isAvatarButtonVisible, setIsAvatarButtonVisible] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    status: '',
    birthday: '',
    gender: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    surname: '',
    status: '',
    birthday: '',
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [newPost, setNewPost] = useState({
    content: '',
    images: [] as File[],
    imageUrls: [] as string[],
  });
  const [postErrors, setPostErrors] = useState({
    content: '',
    images: '',
  });
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});
  const [replyFormVisible, setReplyFormVisible] = useState<{ [commentId: string]: boolean }>({});
  const [commentErrors, setCommentErrors] = useState<{ [postId: string]: string }>({});
  const [replyErrors, setReplyErrors] = useState<{ [commentId: string]: string }>({});
  const [visibleComments, setVisibleComments] = useState<{ [postId: string]: number }>({});
  const [currentImageIndices, setCurrentImageIndices] = useState<{ [postId: string]: number }>({});

  const allPhotos = useMemo(() => {
    return posts.reduce((acc: string[], post) => [...acc, ...post.images], []);
  }, [posts]);

  const fetchProfile = useCallback(async () => {
    if (!id || !user) {
      setError('Пользователь не авторизован или ID профиля не указан');
      navigate('/', { replace: true });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const isOwn = id === user.id;
      setIsOwnProfile(isOwn);

      if (isOwn) {
        setProfile({ ...user, status: user.status || null, gender: user.gender || null });
      } else {
        const response = await fetch(`http://localhost:8000/api/v1/users/${id}`, {
          method: 'GET',
          credentials: 'include',
        });
        const profileData = await response.json();
        if (!response.ok) throw new Error(profileData.detail || 'Пользователь не найден');
        setProfile({
          id: profileData.id,
          name: profileData.name,
          surname: profileData.surname,
          email: profileData.email || '',
          birthday: profileData.birthday,
          gender: profileData.gender || null,
          avatar_url: profileData.avatar_url,
          status: profileData.status || null,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки профиля');
      navigate('/', { replace: true });
    } finally {
      setIsLoading(false);
    }
  }, [id, user, navigate]);

  const fetchPosts = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`http://localhost:8000/api/v1/posts/${id}?limit=10`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Ошибка загрузки постов');
      setPosts(data.posts.map((post: any) => ({
        id: post.id,
        text: post.text,
        images: post.images,
        created_at: post.created_at,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        comments: post.comments || [],
        likes: post.likes || [],
      })));
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки постов');
    }
  }, [id]);

  const handleAvatarClick = useCallback(() => {
    if (isOwnProfile) {
      setIsAvatarButtonVisible(true);
    }
  }, [isOwnProfile]);

  const handleAvatarEditToggle = useCallback(() => {
    setIsEditingAvatar((prev) => !prev);
    setAvatarFile(null);
    setIsAvatarButtonVisible(false);
  }, []);

  const handleProfileEditToggle = useCallback(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        surname: profile.surname,
        status: profile.status || '',
        birthday: profile.birthday,
        gender: profile.gender || '',
      });
      setFormErrors({ name: '', surname: '', status: '', birthday: '' });
    }
    setIsEditingProfile((prev) => !prev);
  }, [profile]);

  const handleCreatePostToggle = useCallback(() => {
    setIsCreatingPost((prev) => !prev);
    setNewPost({ content: '', images: [], imageUrls: [] });
    setPostErrors({ content: '', images: '' });
  }, []);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatarFile(file);
  }, []);

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const handlePostChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPost((prev) => ({ ...prev, [name]: value }));
    setPostErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const handlePostImagesChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = Array.from(files).slice(0, 10 - newPost.images.length);
    try {
      const uploadUrls = await Promise.all(
        newImages.map(async () => {
          const response = await fetch('http://localhost:8000/api/v1/posts/upload-url', {
            method: 'GET',
            credentials: 'include',
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.detail || 'Ошибка получения URL для загрузки');
          return data;
        })
      );

      const uploadedUrls: string[] = [];
      for (let i = 0; i < newImages.length; i++) {
        await fetch(uploadUrls[i].upload_url, {
          method: 'PUT',
          body: newImages[i],
        });
        uploadedUrls.push(uploadUrls[i].object_name);
      }

      setNewPost((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
        imageUrls: [...prev.imageUrls, ...uploadedUrls],
      }));
      setPostErrors((prev) => ({ ...prev, images: '' }));
    } catch (err: any) {
      setPostErrors((prev) => ({ ...prev, images: err.message || 'Ошибка загрузки изображений' }));
    }
  }, [newPost.images, newPost.imageUrls]);

  const removePostImage = useCallback((index: number) => {
    setNewPost((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  }, []);

  const handleCommentChange = useCallback((postId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
    setCommentErrors((prev) => ({ ...prev, [postId]: '' }));
  }, []);

  const handleReplyChange = useCallback((commentId: string, value: string) => {
    setReplyInputs((prev) => ({ ...prev, [commentId]: value }));
    setReplyErrors((prev) => ({ ...prev, [commentId]: '' }));
  }, []);

  const toggleReplyForm = useCallback((commentId: string) => {
    setReplyFormVisible((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
    setReplyInputs((prev) => ({ ...prev, [commentId]: '' }));
    setReplyErrors((prev) => ({ ...prev, [commentId]: '' }));
  }, []);

  const toggleComments = useCallback((postId: string) => {
    setVisibleComments((prev) => ({
      ...prev,
      [postId]: prev[postId] === undefined || prev[postId] === 0 ? 3 : 0,
    }));
  }, []);

  const loadMoreComments = useCallback((postId: string) => {
    setVisibleComments((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 3) + 3,
    }));
  }, []);

  const handlePrevPostImage = useCallback((postId: string) => {
    setCurrentImageIndices((prev) => {
      const currentIndex = prev[postId] || 0;
      const post = posts.find((p) => p.id === postId);
      const nextIndex = currentIndex > 0 ? currentIndex - 1 : (post?.images.length || 1) - 1;
      return { ...prev, [postId]: nextIndex };
    });
  }, [posts]);

  const handleNextPostImage = useCallback((postId: string) => {
    setCurrentImageIndices((prev) => {
      const currentIndex = prev[postId] || 0;
      const post = posts.find((p) => p.id === postId);
      const nextIndex = currentIndex < (post?.images.length || 1) - 1 ? currentIndex + 1 : 0;
      return { ...prev, [postId]: nextIndex };
    });
  }, [posts]);

  const validateForm = useCallback(() => {
    const errors = { name: '', surname: '', status: '', birthday: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Имя обязательно';
      isValid = false;
    } else if (formData.name.length > 50) {
      errors.name = 'Имя не должно превышать 50 символов';
      isValid = false;
    }

    if (!formData.surname.trim()) {
      errors.surname = 'Фамилия обязательна';
      isValid = false;
    } else if (formData.surname.length > 50) {
      errors.surname = 'Фамилия не должна превышать 50 символов';
      isValid = false;
    }

    if (formData.status.length > 200) {
      errors.status = 'Статус не должен превышать 200 символов';
      isValid = false;
    }

    if (!formData.birthday) {
      errors.birthday = 'Дата рождения обязательна';
      isValid = false;
    } else {
      const age = calculateAge(formData.birthday);
      if (age < 13) {
        errors.birthday = 'Пользователь должен быть старше 13 лет';
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  }, [formData]);

  const validatePost = useCallback(() => {
    const errors = { content: '', images: '' };
    let isValid = true;

    if (newPost.content.length > 500) {
      errors.content = 'Текст не должен превышать 500 символов';
      isValid = false;
    }

    if (newPost.images.length > 10) {
      errors.images = 'Максимум 10 изображений';
      isValid = false;
    }

    if (!newPost.content.trim() && newPost.images.length === 0) {
      errors.content = 'Добавьте текст или изображения';
      isValid = false;
    }

    setPostErrors(errors);
    return isValid;
  }, [newPost]);

  const validateComment = useCallback((text: string) => {
    if (!text.trim()) return 'Комментарий не может быть пустым';
    if (text.length > 200) return 'Комментарий не должен превышать 200 символов';
    return '';
  }, []);

  const handleAvatarSave = useCallback(async () => {
    if (!avatarFile || !isOwnProfile) return;
    try {
      const uploadResponse = await fetch('http://localhost:8000/api/v1/users/avatar/upload-url', {
        method: 'GET',
        credentials: 'include',
      });
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadData.detail || 'Ошибка получения URL для загрузки');

      await fetch(uploadData.upload_url, {
        method: 'PUT',
        body: avatarFile,
      });

      const saveResponse = await fetch('http://localhost:8000/api/v1/users/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ object_name: uploadData.object_name }),
      });
      const saveData = await saveResponse.json();
      if (!saveResponse.ok) throw new Error(saveData.detail || 'Ошибка сохранения аватара');

      const newAvatarUrl = saveData.avatar_url || uploadData.object_name;
      setProfile((prev) => (prev ? { ...prev, avatar_url: newAvatarUrl } : prev));
      setUser((prev) => (prev ? { ...prev, avatar_url: newAvatarUrl } : prev));
      setIsEditingAvatar(false);
      setAvatarFile(null);
      setIsAvatarButtonVisible(false);
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения аватара');
    }
  }, [avatarFile, isOwnProfile, setUser]);

  const handleProfileSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      const updateData = {
        name: formData.name,
        surname: formData.surname,
        status: formData.status || null,
        birthday: formData.birthday,
        gender: formData.gender || null,
      };
      const response = await fetch('http://localhost:8000/api/v1/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Ошибка обновления профиля');

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: data.name,
              surname: data.surname,
              status: data.status || null,
              birthday: data.birthday,
              gender: data.gender || null,
              avatar_url: data.avatar_url || prev.avatar_url,
            }
          : prev
      );
      setUser((prev) =>
        prev
          ? {
              ...prev,
              name: data.name,
              surname: data.surname,
              status: data.status || null,
              birthday: data.birthday,
              gender: data.gender || null,
              avatar_url: data.avatar_url || prev.avatar_url,
            }
          : prev
      );
      setIsEditingProfile(false);
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения профиля');
    }
  }, [formData, validateForm, setUser]);

  const handleCreatePost = useCallback(async () => {
    if (!validatePost()) return;

    try {
      const postData = {
        text: newPost.content.trim() || null,
        images: newPost.imageUrls,
      };
      const response = await fetch('http://localhost:8000/api/v1/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(postData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Ошибка создания поста');

      setPosts((prev) => [
        {
          id: data.post_id,
          text: data.text,
          images: data.images,
          created_at: data.created_at,
          likes_count: 0,
          comments_count: 0,
          comments: [],
          likes: [],
        },
        ...prev,
      ]);
      setNewPost({ content: '', images: [], imageUrls: [] });
      setIsCreatingPost(false);
    } catch (err: any) {
      setError(err.message || 'Ошибка создания поста');
    }
  }, [newPost, validatePost]);

  const handleLikePost = useCallback(
    async (postId: string) => {
      if (!user) {
        setError('Авторизуйтесь, чтобы лайкать посты');
        return;
      }
      try {
        const response = await fetch(`http://localhost:8000/api/v1/posts/like/${postId}`, {
          method: 'POST',
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Ошибка при добавлении лайка');

        setPosts((prev) =>
          prev.map((post) =>
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
          const response = await fetch(`http://localhost:8000/api/v1/posts/like/${postId}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.detail || 'Ошибка при удалении лайка');
          setPosts((prev) =>
            prev.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    likes_count: post.likes_count - 1,
                    likes: post.likes.filter((id) => id !== user.id),
                  }
                : post
            )
          );
        } else {
          setError(err.message || 'Ошибка при изменении лайка');
        }
      }
    },
    [user]
  );

  const handleAddComment = useCallback(
    async (postId: string) => {
      if (!user) {
        setError('Авторизуйтесь, чтобы комментировать');
        return;
      }
      const commentText = commentInputs[postId] || '';
      const error = validateComment(commentText);
      if (error) {
        setCommentErrors((prev) => ({ ...prev, [postId]: error }));
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/v1/posts/comment/${postId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ text: commentText, parent_id: null }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Ошибка добавления комментария');

        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: [
                    {
                      id: data.id,
                      user_id: data.user_id,
                      text: data.text,
                      created_at: data.created_at,
                      replies: [],
                    },
                    ...post.comments,
                  ],
                  comments_count: post.comments_count + 1,
                }
              : post
          )
        );
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
        setCommentErrors((prev) => ({ ...prev, [postId]: '' }));
        setVisibleComments((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      } catch (err: any) {
        setCommentErrors((prev) => ({ ...prev, [postId]: err.message || 'Ошибка добавления комментария' }));
      }
    },
    [user, commentInputs, validateComment]
  );

  const handleAddReply = useCallback(
    async (postId: string, commentId: string) => {
      if (!user) {
        setError('Авторизуйтесь, чтобы отвечать на комментарии');
        return;
      }
      const replyText = replyInputs[commentId] || '';
      const error = validateComment(replyText);
      if (error) {
        setReplyErrors((prev) => ({ ...prev, [commentId]: error }));
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/v1/posts/comment/${postId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ text: replyText, parent_id: commentId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Ошибка добавления ответа');

        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: post.comments.map((comment) =>
                    comment.id === commentId
                      ? {
                          ...comment,
                          replies: [
                            {
                              id: data.id,
                              user_id: data.user_id,
                              text: data.text,
                              created_at: data.created_at,
                              replies: [],
                            },
                            ...comment.replies,
                          ],
                        }
                      : comment
                  ),
                  comments_count: post.comments_count + 1,
                }
              : post
          )
        );
        setReplyInputs((prev) => ({ ...prev, [commentId]: '' }));
        setReplyErrors((prev) => ({ ...prev, [commentId]: '' }));
        setReplyFormVisible((prev) => ({ ...prev, [commentId]: false }));
      } catch (err: any) {
        setReplyErrors((prev) => ({ ...prev, [commentId]: err.message || 'Ошибка добавления ответа' }));
      }
    },
    [user, replyInputs, validateComment]
  );

  const handleImageClick = useCallback((imageUrl: string, index: number) => {
    setSelectedImage(imageUrl);
    setCurrentImageIndex(index);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedImage(null);
    setCurrentImageIndex(0);
  }, []);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1));
    setSelectedImage(allPhotos[currentImageIndex > 0 ? currentImageIndex - 1 : allPhotos.length - 1]);
  }, [allPhotos, currentImageIndex]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0));
    setSelectedImage(allPhotos[currentImageIndex < allPhotos.length - 1 ? currentImageIndex + 1 : 0]);
  }, [allPhotos, currentImageIndex]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
      fetchPosts();
    }
  }, [fetchProfile, fetchPosts, authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-xl">
          <svg
            className="animate-spin h-12 w-12 text-rose-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-lg text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-lg w-full text-center">
          <p className="text-red-500 text-lg">{error || 'Профиль не найден'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
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
        {isOwnProfile && (
          <div className="px-8 pb-8">
            <button
              onClick={handleCreatePostToggle}
              className="bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-rose-200"
              aria-label="Создать новый пост"
            >
              Создать пост
            </button>
          </div>
        )}
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
          handleCommentChange={handleCommentChange}
          handleReplyChange={handleReplyChange}
          toggleReplyForm={toggleReplyForm}
          toggleComments={toggleComments}
          loadMoreComments={loadMoreComments}
          handlePrevPostImage={handlePrevPostImage}
          handleNextPostImage={handleNextPostImage}
          handleImageClick={handleImageClick}
          handleAddComment={handleAddComment}
          handleAddReply={handleAddReply}
          allPhotos={allPhotos}
          setCurrentImageIndices={setCurrentImageIndices}
        />
      </div>
      <ImageModal
        selectedImage={selectedImage}
        allPhotos={allPhotos}
        currentImageIndex={currentImageIndex}
        handleCloseModal={handleCloseModal}
        handlePrevImage={handlePrevImage}
        handleNextImage={handleNextImage}
      />
      <AvatarEditor
        isEditingAvatar={isEditingAvatar}
        isOwnProfile={isOwnProfile}
        avatarFile={avatarFile}
        error={error}
        handleAvatarEditToggle={handleAvatarEditToggle}
        handleAvatarChange={handleAvatarChange}
        handleAvatarSave={handleAvatarSave}
      />
      <ProfileEditor
        isEditingProfile={isEditingProfile}
        isOwnProfile={isOwnProfile}
        formData={formData}
        formErrors={formErrors}
        error={error}
        handleProfileEditToggle={handleProfileEditToggle}
        handleFormChange={handleFormChange}
        handleProfileSave={handleProfileSave}
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
        handleCreatePost={handleCreatePost}
      />
    </div>
  );
};

export default ProfilePage;