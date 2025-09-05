import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface UserResult {
  id: string;
  name: string;
  surname: string;
  avatar_url: string | null;
  birthday: string;
  gender: 'MALE' | 'FEMALE' | null;
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

  const [filters, setFilters] = useState({
    sex: '',
    age_min: '',
    age_max: '',
    birthday: ''
  });

  const listRef = useRef<HTMLDivElement>(null);

  // Функция fetch
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

  // Перезапрос при изменении запроса или фильтров
  useEffect(() => {
    setCursor(null);
    setHasMore(true);
    fetchUsers(true);
  }, [searchQuery, filters, fetchUsers]);

  // Бесконечный скролл
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Фильтры */}
      <aside className="w-72 p-6 bg-white shadow-md border-r sticky top-20 h-fit">
        <h2 className="text-xl font-bold mb-4">Фильтры</h2>
        <form className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 font-medium">Пол</label>
            <select
              name="sex"
              value={filters.sex}
              onChange={handleFilterChange}
              className="w-full border px-2 py-1 rounded"
            >
              <option value="">Все</option>
              <option value="MALE">Мужской</option>
              <option value="FEMALE">Женский</option>
              <option value="NULL">Не указан</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Возраст от</label>
            <input
              type="number"
              name="age_min"
              value={filters.age_min}
              onChange={handleFilterChange}
              className="w-full border px-2 py-1 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Возраст до</label>
            <input
              type="number"
              name="age_max"
              value={filters.age_max}
              onChange={handleFilterChange}
              className="w-full border px-2 py-1 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Дата рождения</label>
            <input
              type="date"
              name="birthday"
              value={filters.birthday}
              onChange={handleFilterChange}
              className="w-full border px-2 py-1 rounded"
            />
          </div>

          <button
            type="button"
            onClick={() => fetchUsers(true)}
            className="mt-2 bg-rose-600 text-white py-2 rounded hover:bg-rose-700 transition"
          >
            Применить
          </button>
        </form>
      </aside>

      {/* Результаты поиска */}
      <main className="flex-1 p-6" ref={listRef}>
        <form onSubmit={handleSearchSubmit} className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск людей..."
            className="w-full p-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100 transition-all duration-200"
          />
        </form>

        {users.length === 0 && !isLoading && <div>Ничего не найдено</div>}

        <ul className="flex flex-col gap-6">
          {users.map(u => (
            <li key={u.id} className="flex items-center gap-4 p-4 bg-white rounded shadow hover:shadow-md transition">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-rose-600 font-bold">{u.name[0]}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium">{u.name} {u.surname}</p>
              </div>
            </li>
          ))}
        </ul>

        {isLoading && <div className="mt-4 text-center">Загрузка...</div>}
      </main>
    </div>
  );
};

export default SearchResultsPage;
