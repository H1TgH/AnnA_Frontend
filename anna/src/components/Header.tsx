import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading, setUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogoClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Search query:', searchQuery); // Заглушка
  }, [searchQuery]);

  const handleProfileClick = useCallback(() => {
    if (user) {
      navigate(`/profile/${user.id}`);
      setIsDropdownOpen(false);
    }
  }, [user, navigate]);

  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/users/logout', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      console.log('Logout response:', data);
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to logout');
      }
    } catch (err: any) {
      console.error('Logout error:', err.message);
    } finally {
      // Очищаем cookies на фронте
      document.cookie = 'access_token=;path=/;max-age=0';
      document.cookie = 'refresh_token=;path=/;max-age=0';
      document.cookie = 'user_id=;path=/;max-age=0';
      // Сбрасываем состояние пользователя
      setUser(null);
      // Редирект на главную
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 0);
    }
  }, [navigate, setUser]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="bg-white shadow-md p-4 fixed top-0 left-0 right-0 z-50 font-sans">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
          <div className="w-10 h-10 bg-rose-200 border-2 border-rose-300 rounded-full flex items-center justify-center">
            <span className="text-rose-600 text-xl font-bold">A</span>
          </div>
          <h1 className="ml-2 text-2xl font-bold text-rose-600">AnnA</h1>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex-1 mx-4 max-w-md">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Поиск людей..."
              className="w-full p-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100 transition-all duration-200"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-rose-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </form>
        {isLoading ? (
          <div className="flex items-center">
            <svg
              className="animate-spin h-6 w-6 text-rose-600"
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
          </div>
        ) : !user ? (
          <div className="text-red-600 text-sm">Ошибка загрузки</div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-2 cursor-pointer" onClick={toggleDropdown}>
              <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-rose-200 overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-rose-600 text-sm font-bold">{user.name[0]}</span>
                  </div>
                )}
              </div>
              <span className="text-gray-800 font-medium">{`${user.name} ${user.surname}`}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                <button
                  onClick={handleProfileClick}
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-200 rounded-t-lg"
                >
                  Мой профиль
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-200 rounded-b-lg"
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;