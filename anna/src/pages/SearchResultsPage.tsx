import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import UserStatusComponent from '../components/UserStatus';

interface UserResult {
  id: string;
  name: string;
  surname: string;
  avatar_url: string | null;
  birthday: string;
  gender: 'MALE' | 'FEMALE' | null;
  status?: string | null;
}

const PAGE_LIMIT = 25;

const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    sex: '',
    age_min: '',
    age_max: '',
    birthday: ''
  });

  const listRef = useRef<HTMLDivElement>(null);

  // Функция для вычисления возраста
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

  const fetchUsers = useCallback(async (reset = false) => {
    if (!hasMore && !reset) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      params.set('limit', PAGE_LIMIT.toString());
      if (!reset && cursor) params.set('cursor', cursor);
      if (filters.sex) params.set('sex', filters.sex);
      if (filters.age_min) params.set('age_min', filters.age_min);
      if (filters.age_max) params.set('age_max', filters.age_max);
      if (filters.birthday) params.set('birthday', filters.birthday);

      const response = await fetch(`http://localhost:8000/api/v1/search?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();

      setUsers(prev => reset ? data.users : [...prev, ...data.users]);
      setCursor(data.next_cursor);
      setHasMore(data.has_more);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters, cursor, hasMore]);

  useEffect(() => {
    setCursor(null);
    setHasMore(true);
    fetchUsers(true);
  }, [searchQuery, filters]);

  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 100 && !isLoading && hasMore) {
        fetchUsers();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchUsers, isLoading, hasMore]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchParams({ q: searchQuery });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      sex: '',
      age_min: '',
      age_max: '',
      birthday: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-100 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
            Найти людей
          </h1>
          <p className="text-gray-600 text-center">
            Ищите друзей и знакомых по всему миру
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Введите имя или фамилию..."
              className="w-full pl-12 pr-4 py-4 text-lg bg-white rounded-2xl border-2 border-rose-200 shadow-lg focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all duration-300 placeholder-gray-400"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-6 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl hover:from-rose-600 hover:to-rose-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Найти
            </button>
          </form>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:hidden">
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border-2 border-rose-200 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <span className="font-medium text-gray-700">
                {isFiltersOpen ? 'Скрыть фильтры' : 'Показать фильтры'}
                {hasActiveFilters && (
                  <span className="ml-1 px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full">
                    {Object.values(filters).filter(v => v !== '').length}
                  </span>
                )}
              </span>
            </button>
          </div>

          <aside className={`lg:w-80 ${isFiltersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl shadow-xl border border-rose-100 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <svg className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  Фильтры
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-rose-600 hover:text-rose-800 transition-colors duration-200 underline"
                  >
                    Очистить все
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Пол</label>
                  <select
                    name="sex"
                    value={filters.sex}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all duration-200 bg-white"
                  >
                    <option value="">Все</option>
                    <option value="MALE">Мужской</option>
                    <option value="FEMALE">Женский</option>
                    <option value="NULL">Не указан</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Возраст</label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        name="age_min"
                        value={filters.age_min}
                        onChange={handleFilterChange}
                        placeholder="От"
                        min="13"
                        max="100"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all duration-200"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        name="age_max"
                        value={filters.age_max}
                        onChange={handleFilterChange}
                        placeholder="До"
                        min="13"
                        max="100"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Дата рождения</label>
                  <input
                    type="date"
                    name="birthday"
                    value={filters.birthday}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all duration-200"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => fetchUsers(true)}
                  className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-rose-600 hover:to-rose-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Применить фильтры
                </button>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-h-screen">
            {!isLoading && users.length > 0 && (
              <div className="mb-6">
                <p className="text-gray-600 font-medium">
                  {searchQuery ? `Найдено пользователей для "${searchQuery}"` : 'Все пользователи'}
                  <span className="ml-2 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-semibold">
                    {users.length}+
                  </span>
                </p>
              </div>
            )}

            {users.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="h-16 w-16 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Ничего не найдено</h3>
                <p className="text-gray-600 mb-6">
                  Попробуйте изменить поисковый запрос или настроить фильтры
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all duration-300 transform hover:scale-105"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Очистить фильтры
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-6 grid-cols-1" ref={listRef}>
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="flex items-center gap-6 bg-white rounded-2xl shadow-md hover:shadow-lg border border-rose-100 p-4 transition-all duration-300 transform hover:scale-[1.01] cursor-pointer"
                >
                  {/* Аватар */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-200 to-rose-300 overflow-hidden flex-shrink-0 shadow-md">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={`${user.name} ${user.surname}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-rose-600 text-xl font-bold">
                          {user.name[0]}{user.surname[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Информация */}
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-rose-600 transition-colors duration-300">
                      {user.name} {user.surname}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {calculateAge(user.birthday)} лет
                    </p>
                    {user.gender && (
                      <p className="text-sm text-gray-600">
                        {user.gender === 'MALE' ? 'Мужчина' : 'Женщина'}
                      </p>
                    )}
                  </div>
                </div>

              ))}
            </div>

            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-rose-200 rounded-full animate-spin">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-rose-600 rounded-full animate-spin"></div>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && hasMore && users.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Прокрутите вниз, чтобы загрузить больше результатов</p>
              </div>
            )}

            {!hasMore && users.length > 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-full">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">Все результаты загружены</span>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;