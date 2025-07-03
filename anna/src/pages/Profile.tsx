import { useState, useCallback, useEffect, ChangeEvent, FormEvent } from "react";

// Define types for the user data and content
interface UserProfile {
  id: string;
  name: string;
  username: string;
  bio: string;
  location: string;
  profilePicUrl: string;
  coverPhotoUrl: string;
  followers: number;
  following: number;
}

interface Friend {
  id: string;
  name: string;
  profilePicUrl: string;
}

// Mock data to simulate API response
const mockUserProfile: UserProfile = {
  id: 'user-123',
  name: 'Анна Иванова',
  username: 'anna_ivanova',
  bio: 'Люблю путешествовать, фотографировать и делиться впечатлениями. Живу в мире кода и креатива.',
  location: 'Москва, Россия',
  profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&auto=format&fit=crop',
  coverPhotoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&h=400&auto=format&fit=crop',
  followers: 1250,
  following: 345,
};

const mockFriends: Friend[] = [
  { id: 'friend-1', name: 'Иван Петров', profilePicUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=128&h=128&auto=format&fit=crop' },
  { id: 'friend-2', name: 'Мария Смирнова', profilePicUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=128&h=128&auto=format&fit=crop' },
  { id: 'friend-3', name: 'Дмитрий Козлов', profilePicUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7247f67?q=80&w=128&h=128&auto=format&fit=crop' },
  { id: 'friend-4', name: 'Елена Новикова', profilePicUrl: 'https://images.unsplash.com/photo-1508214751196-cadf41b1d85b?q=80&w=128&h=128&auto=format&fit=crop' },
  { id: 'friend-5', name: 'Алексей Соколов', profilePicUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=128&h=128&auto=format&fit=crop' },
];

const UserProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);

  // Fetch user data and friends
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // TODO: Replace with real API calls
        // const token = localStorage.getItem('access_token');
        // if (!token) throw new Error('No access token found');
        // const response = await fetch('http://localhost:8000/api/v1/users/me', {
        //   headers: { Authorization: `Bearer ${token}` },
        // });
        // const userData = await response.json();
        // if (!response.ok) throw new Error(userData.detail || 'Failed to fetch profile');
        // const friendsResponse = await fetch('http://localhost:8000/api/v1/users/friends', {
        //   headers: { Authorization: `Bearer ${token}` },
        // });
        // const friendsData = await friendsResponse.json();
        // if (!friendsResponse.ok) throw new Error(friendsData.detail || 'Failed to fetch friends');

        // Mock data for now
        setTimeout(() => {
          setUser(mockUserProfile);
          setEditFormData(mockUserProfile);
          setFriends(mockFriends);
          setIsLoading(false);
        }, 1000);
      } catch (err: any) {
        console.error('Fetch error:', err.message);
        setError(err.message || 'Ошибка загрузки данных профиля');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEditToggle = useCallback(() => {
    setIsEditing((prev) => !prev);
    if (isEditing && user) {
      setEditFormData(user);
      setProfilePicPreview(null);
    }
  }, [isEditing, user]);

  const handleFormChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData((prevData) => ({ ...prevData, [name]: value }));
  }, []);

  const handleProfilePicChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicPreview(reader.result as string);
        setEditFormData((prevData) => ({ ...prevData, profilePicUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSaveProfile = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // Basic validation
      if (!editFormData.name?.trim()) {
        setError('Имя обязательно');
        return;
      }
      if (!editFormData.username?.trim()) {
        setError('Имя пользователя обязательно');
        return;
      }

      try {
        // TODO: Replace with real API call
        // const token = localStorage.getItem('access_token');
        // const response = await fetch('http://localhost:8000/api/v1/users/me', {
        //   method: 'PATCH',
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify(editFormData),
        // });
        // const data = await response.json();
        // if (!response.ok) throw new Error(data.detail || 'Failed to update profile');

        console.log('Saving profile data:', editFormData);
        setUser((prevUser) => ({
          ...prevUser!,
          ...editFormData,
        }));
        setIsEditing(false);
        setProfilePicPreview(null);
        setError(null);
      } catch (err: any) {
        console.error('Save profile error:', err.message);
        setError(err.message || 'Ошибка сохранения профиля');
      }
    },
    [editFormData]
  );

  if (isLoading) {
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

  if (!user || error) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-xl">
          <p className="text-lg text-red-600">{error || 'Профиль пользователя не найден.'}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="mt-4 bg-rose-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-rose-700 transition-colors duration-200"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50 p-6 sm:p-12 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Profile Header */}
        <div className="relative">
          <div className="w-full h-48 sm:h-64 bg-gray-200 border-b-4 border-rose-100">
            {user.coverPhotoUrl ? (
              <img src={user.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-rose-100 flex items-center justify-center text-rose-400 font-semibold text-lg">
                Cover Photo Placeholder
              </div>
            )}
          </div>
          <div className="absolute -bottom-16 left-8 sm:left-12">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white p-1 shadow-lg border-4 border-white">
              {user.profilePicUrl ? (
                <img src={user.profilePicUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="bg-gray-200 border-2 border-dashed rounded-full w-full h-full flex items-center justify-center">
                  <span className="text-rose-600 text-2xl font-bold">{user.name[0]}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info & Actions */}
        <div className="pt-20 sm:pt-24 px-8 sm:px-12 pb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">{user.name}</h1>
            <p className="text-gray-600 text-lg font-medium mt-1">@{user.username}</p>
            <p className="text-gray-700 mt-4 max-w-2xl leading-relaxed">{user.bio}</p>
            <div className="flex items-center text-gray-500 mt-3 text-sm font-medium">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-rose-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>{user.location}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={handleEditToggle}
              className="bg-rose-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-rose-700 transition-colors duration-200 shadow-lg focus:outline-none focus:ring-4 focus:ring-rose-200"
            >
              Редактировать профиль
            </button>
            <button className="bg-white text-rose-600 font-bold py-3 px-8 rounded-xl border-2 border-rose-300 hover:bg-rose-50 transition-colors duration-200 shadow-lg focus:outline-none focus:ring-4 focus:ring-rose-200">
              Подписаться
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 px-8 sm:px-12 pb-8 text-center border-b border-gray-200">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-gray-900">{user.followers}</span>
            <span className="text-gray-600 text-sm font-medium mt-1">Подписчиков</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-gray-900">{user.following}</span>
            <span className="text-gray-600 text-sm font-medium mt-1">Подписок</span>
          </div>
        </div>

        {/* Friends Content */}
        <div className="p-8 sm:p-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Друзья</h3>
          {friends.length === 0 ? (
            <p className="text-gray-600 text-lg">Друзья отсутствуют.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md"
                >
                  <img
                    src={friend.profilePicUrl}
                    alt={friend.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-rose-200"
                  />
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-gray-800">{friend.name}</p>
                    <p className="text-sm text-gray-500">@{friend.name.toLowerCase().replace(/\s/g, '_')}</p>
                  </div>
                  <button className="bg-rose-100 text-rose-700 font-bold text-sm py-2 px-4 rounded-lg hover:bg-rose-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-rose-200">
                    Профиль
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full m-4 animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Редактировать профиль</h2>
              <button onClick={handleEditToggle} className="text-gray-500 hover:text-gray-800 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
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
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex flex-col gap-1">
                <label htmlFor="profilePic" className="text-gray-700 font-medium text-sm">
                  Аватарка
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-rose-200 overflow-hidden">
                    {profilePicPreview || editFormData.profilePicUrl ? (
                      <img
                        src={profilePicPreview || editFormData.profilePicUrl}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-rose-600 text-2xl font-bold">{editFormData.name?.[0] || 'A'}</span>
                      </div>
                    )}
                  </div>
                  <input
                    id="profilePic"
                    name="profilePic"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="text-gray-700 text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-gray-700 font-medium text-sm">
                  Имя
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={editFormData.name || ''}
                  onChange={handleFormChange}
                  placeholder="Введите ваше имя"
                  className="p-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100 transition-all duration-200"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="username" className="text-gray-700 font-medium text-sm">
                  Имя пользователя
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={editFormData.username || ''}
                  onChange={handleFormChange}
                  placeholder="Введите имя пользователя"
                  className="p-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100 transition-all duration-200"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="bio" className="text-gray-700 font-medium text-sm">
                  О себе
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={editFormData.bio || ''}
                  onChange={handleFormChange}
                  placeholder="Расскажите о себе..."
                  rows={4}
                  className="p-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100 transition-all duration-200 resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="location" className="text-gray-700 font-medium text-sm">
                  Местоположение
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={editFormData.location || ''}
                  onChange={handleFormChange}
                  placeholder="Введите ваше местоположение"
                  className="p-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100 transition-all duration-200"
                />
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;