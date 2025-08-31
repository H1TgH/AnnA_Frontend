import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

interface UserProfile {
  id: string;
  name: string;
  surname: string;
  email: string;
  birthday: string;
  gender: string | null;
  avatar_url: string | null;
  status: string | null;
}

interface Comment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  replies: Comment[];
}

interface Post {
  id: string;
  text: string | null;
  images: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  comments: Comment[];
  likes: string[];
}

const calculateAge = (birthday: string): number => {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

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

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
      fetchPosts();
    }
  }, [fetchProfile, fetchPosts, authLoading, user]);

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

  const allPhotos = useMemo(() => {
    return posts.reduce((acc: string[], post) => [...acc, ...post.images], []);
  }, [posts]);

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
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-rose-400 to-rose-600 relative">
          <div className="absolute -bottom-16 left-8 transform translate-y-0">
            <div
              className={`w-32 h-32 rounded-full bg-gray-200 border-4 border-white overflow-hidden relative ${isOwnProfile ? 'cursor-pointer' : ''}`}
              onClick={handleAvatarClick}
              onMouseEnter={() => isOwnProfile && setIsHoveringAvatar(true)}
              onMouseLeave={() => isOwnProfile && setIsHoveringAvatar(false)}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-300">
                  <span className="text-rose-600 text-4xl font-bold">{profile.name[0]}</span>
                </div>
              )}
              {isOwnProfile && isHoveringAvatar && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Profile Info */}
        <div className="pt-20 pb-8 px-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{`${profile.name} ${profile.surname}`}</h1>
              {profile.status && (
                <p className="text-gray-600 italic mt-2 max-w-md">{profile.status}</p>
              )}
            </div>
            {isOwnProfile && (
              <button
                onClick={handleProfileEditToggle}
                className="bg-rose-600 text-white p-2 rounded-full hover:bg-rose-700 transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-rose-200"
                title="Редактировать профиль"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>
                {profile.gender === 'MALE' ? 'Мужской' : profile.gender === 'FEMALE' ? 'Женский' : 'Не указан'}
              </span>
            </div>
            <div className="flex items-center text-gray-600 mt-2 sm:mt-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Возраст: {calculateAge(profile.birthday)}</span>
            </div>
          </div>
          {isOwnProfile && isAvatarButtonVisible && (
            <div className="mt-4">
              <button
                onClick={handleAvatarEditToggle}
                className="bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-rose-200"
              >
                Изменить аватар
              </button>
            </div>
          )}
        </div>
        {/* Photos Feed */}
        {allPhotos.length > 0 && (
          <div className="px-8 pb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Фотографии</h2>
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-rose-200 scrollbar-track-gray-100">
              {allPhotos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Фотография ${index + 1}`}
                  className="h-24 w-24 object-cover rounded-lg cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
                  onClick={() => handleImageClick(photo, index)}
                  role="button"
                  aria-label={`Открыть фотографию ${index + 1}`}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleImageClick(photo, index)}
                />
              ))}
            </div>
          </div>
        )}
        {/* Create Post Button */}
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
        {/* Posts Feed */}
        <div className="px-8 pb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Посты</h2>
          {posts.length === 0 ? (
            <p className="text-gray-600">Постов пока нет</p>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white border-2 border-gray-200 rounded-2xl p-6 animate-fade-in"
                  role="article"
                  aria-label={`Пост от ${formatDate(post.created_at)}`}
                >
                  {post.text && <p className="text-gray-800 mb-4">{post.text}</p>}
                  {post.images.length > 0 && (
                    <div className="relative">
                      <img
                        src={post.images[currentImageIndices[post.id] || 0]}
                        alt={`Пост ${post.id} изображение ${currentImageIndices[post.id] || 0 + 1}`}
                        className="w-full max-h-96 object-cover rounded-lg cursor-pointer"
                        onClick={() => handleImageClick(post.images[currentImageIndices[post.id] || 0], allPhotos.indexOf(post.images[currentImageIndices[post.id] || 0]))}
                        role="button"
                        aria-label={`Открыть изображение поста ${post.id}`}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleImageClick(post.images[currentImageIndices[post.id] || 0], allPhotos.indexOf(post.images[currentImageIndices[post.id] || 0]))}
                      />
                      {post.images.length > 1 && (
                        <>
                          <button
                            onClick={() => handlePrevPostImage(post.id)}
                            className="absolute left-0 top-1/2 -translate-y-1/2 bg-rose-600 text-white p-2 rounded-full hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
                            aria-label="Предыдущее изображение"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleNextPostImage(post.id)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 bg-rose-600 text-white p-2 rounded-full hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
                            aria-label="Следующее изображение"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
                            {`${(currentImageIndices[post.id] || 0) + 1}/${post.images.length}`}
                          </div>
                          <div className="absolute bottom-2 right-2 flex gap-1">
                            {post.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndices((prev) => ({ ...prev, [post.id]: index }))}
                                className={`w-2 h-2 rounded-full ${index === (currentImageIndices[post.id] || 0) ? 'bg-rose-600' : 'bg-gray-400'}`}
                                aria-label={`Перейти к изображению ${index + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <p className="text-gray-500 text-sm mt-4">{formatDate(post.created_at)}</p>
                  {/* Likes and Comments */}
                  <div className="mt-4 flex items-center gap-4">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-2 text-rose-600 hover:bg-rose-100 p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!user}
                      aria-label="Лайкнуть пост"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill={post.likes.includes(user?.id || '') ? 'currentColor' : 'none'}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span>{post.likes_count}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
                      aria-label={visibleComments[post.id] ? 'Скрыть комментарии' : 'Показать комментарии'}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5v-2a2 2 0 012-2h10a2 2 0 012 2v2h-4m-6 0h6"
                        />
                      </svg>
                      <span>{post.comments_count}</span>
                    </button>
                  </div>
                  {/* Comments Section */}
                  {visibleComments[post.id] > 0 && (
                    <div className="mt-4 animate-fade-in">
                      {post.comments.length > 0 ? (
                        <div className="space-y-4">
                          {post.comments.slice(0, visibleComments[post.id]).map((comment) => (
                            <div key={comment.id} className="animate-fade-in" role="comment">
                              <div className="flex items-start gap-2">
                                <div className="flex-1">
                                  <p className="text-gray-800 font-medium">{comment.user_id === profile.id ? `${profile.name} ${profile.surname}` : comment.user_id}</p>
                                  <p className="text-gray-600">{comment.text}</p>
                                  <p className="text-gray-500 text-sm">{formatDate(comment.created_at)}</p>
                                  {user && (
                                    <button
                                      onClick={() => toggleReplyForm(comment.id)}
                                      className="text-rose-600 text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-rose-200"
                                      aria-label={`Ответить на комментарий ${comment.user_id}`}
                                    >
                                      Ответить
                                    </button>
                                  )}
                                  {replyFormVisible[comment.id] && user && (
                                    <div className="mt-2 ml-6 animate-scale-in">
                                      <textarea
                                        value={replyInputs[comment.id] || ''}
                                        onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                                        placeholder={`Ответить...`}
                                        className="w-full p-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                                        rows={2}
                                        maxLength={200}
                                        aria-label={`Поле для ответа на комментарий`}
                                      />
                                      {replyErrors[comment.id] && (
                                        <p className="text-red-500 text-sm mt-1">{replyErrors[comment.id]}</p>
                                      )}
                                      <div className="flex justify-end gap-2 mt-2">
                                        <button
                                          onClick={() => toggleReplyForm(comment.id)}
                                          className="text-gray-600 text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        >
                                          Отмена
                                        </button>
                                        <button
                                          onClick={() => handleAddReply(post.id, comment.id)}
                                          className="bg-rose-600 text-white text-sm py-1 px-3 rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                                          disabled={!replyInputs[comment.id]?.trim()}
                                        >
                                          Отправить
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  {comment.replies.length > 0 && (
                                    <div className="ml-6 mt-2 space-y-2">
                                      {comment.replies.map((reply) => (
                                        <div key={reply.id} className="animate-fade-in" role="comment">
                                          <p className="text-gray-800 font-medium">{reply.user_id === profile.id ? `${profile.name} ${profile.surname}` : reply.user_id}</p>
                                          <p className="text-gray-600">{reply.text}</p>
                                          <p className="text-gray-500 text-sm">{formatDate(reply.created_at)}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {post.comments.length > visibleComments[post.id] && (
                            <button
                              onClick={() => loadMoreComments(post.id)}
                              className="text-rose-600 text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-rose-200 mt-2"
                              aria-label="Показать больше комментариев"
                            >
                              Показать еще ({post.comments.length - visibleComments[post.id]})
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-600">Комментариев пока нет</p>
                      )}
                      {user && (
                        <div className="mt-4">
                          <textarea
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => handleCommentChange(post.id, e.target.value)}
                            placeholder="Написать комментарий..."
                            className="w-full p-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                            rows={2}
                            maxLength={200}
                            aria-label="Поле для комментария к посту"
                          />
                          {commentErrors[post.id] && (
                            <p className="text-red-500 text-sm mt-1">{commentErrors[post.id]}</p>
                          )}
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleAddComment(post.id)}
                              className="bg-rose-600 text-white text-sm py-1 px-3 rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                              disabled={!commentInputs[post.id]?.trim()}
                              aria-label="Отправить комментарий"
                            >
                              Отправить
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр изображения"
        >
          <div className="bg-white rounded-2xl p-4 max-w-3xl w-full animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Фотография</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-800 transition-colors"
                aria-label="Закрыть просмотр изображения"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative">
              <img
                src={selectedImage}
                alt="Увеличенное изображение"
                className="w-full max-h-[80vh] object-contain rounded-lg"
              />
              {allPhotos.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-rose-600 text-white p-3 rounded-full hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
                    aria-label="Предыдущее изображение"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-rose-600 text-white p-3 rounded-full hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
                    aria-label="Следующее изображение"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isEditingAvatar && isOwnProfile && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full m-4 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Изменить аватар</h2>
              <button onClick={handleAvatarEditToggle} className="text-gray-500 hover:text-gray-800 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="flex flex-col gap-1">
              <label htmlFor="avatar" className="text-gray-700 font-medium text-sm">
                Новый аватар
              </label>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="text-gray-700 text-sm"
              />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={handleAvatarEditToggle}
                className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
              >
                Отмена
              </button>
              <button
                onClick={handleAvatarSave}
                disabled={!avatarFile}
                className="bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:bg-gray-400"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditingProfile && isOwnProfile && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full m-4 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Редактировать профиль</h2>
              <button onClick={handleProfileEditToggle} className="text-gray-500 hover:text-gray-800 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="text-gray-700 font-medium text-sm">
                  Имя
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="surname" className="text-gray-700 font-medium text-sm">
                  Фамилия
                </label>
                <input
                  id="surname"
                  name="surname"
                  type="text"
                  value={formData.surname}
                  onChange={handleFormChange}
                  className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                />
                {formErrors.surname && <p className="text-red-500 text-sm mt-1">{formErrors.surname}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="status" className="text-gray-700 font-medium text-sm">
                  Статус
                </label>
                <textarea
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  maxLength={200}
                  placeholder="Ваш статус (до 200 символов)"
                  className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                />
                {formErrors.status && <p className="text-red-500 text-sm mt-1">{formErrors.status}</p>}
              </div>
              <div>
                <label htmlFor="birthday" className="text-gray-700 font-medium text-sm">
                  Дата рождения
                </label>
                <input
                  id="birthday"
                  name="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={handleFormChange}
                  className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                />
                {formErrors.birthday && <p className="text-red-500 text-sm mt-1">{formErrors.birthday}</p>}
              </div>
              <div>
                <label htmlFor="gender" className="text-gray-700 font-medium text-sm">
                  Пол
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleFormChange}
                  className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                >
                  <option value="">Не указан</option>
                  <option value="MALE">Мужской</option>
                  <option value="FEMALE">Женский</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={handleProfileEditToggle}
                className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
              >
                Отмена
              </button>
              <button
                onClick={handleProfileSave}
                className="bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreatingPost && isOwnProfile && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full m-4 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Создать пост</h2>
              <button onClick={handleCreatePostToggle} className="text-gray-500 hover:text-gray-800 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="space-y-4">
              <div>
                <label htmlFor="content" className="text-gray-700 font-medium text-sm">
                  Текст поста
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={newPost.content}
                  onChange={handlePostChange}
                  maxLength={500}
                  placeholder="Что у вас нового? (до 500 символов)"
                  className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                  rows={4}
                  aria-label="Текст поста"
                />
                {postErrors.content && <p className="text-red-500 text-sm mt-1">{postErrors.content}</p>}
              </div>
              <div>
                <label htmlFor="images" className="text-gray-700 font-medium text-sm">
                  Изображения (до 10)
                </label>
                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePostImagesChange}
                  className="text-gray-700 text-sm mt-1"
                  disabled={newPost.images.length >= 10}
                  aria-label="Загрузить изображения для поста"
                />
                {postErrors.images && <p className="text-red-500 text-sm mt-1">{postErrors.images}</p>}
                {newPost.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newPost.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Предпросмотр изображения ${index + 1}`}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removePostImage(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 text-xs hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                          aria-label={`Удалить изображение ${index + 1}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={handleCreatePostToggle}
                className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
              >
                Отмена
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPost.content.trim() && newPost.images.length === 0}
                className="bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:bg-gray-400"
              >
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;