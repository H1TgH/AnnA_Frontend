import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/Auth';
import EmailConfirmPage from './pages/Email-confirmation';
import ProfilePage from './pages/Profile';
import ResetPasswordPage from './pages/Password-reset';
import Header from './components/Header';

interface UserInfo {
  id: string;
  name: string;
  surname: string;
  email: string;
  birthday: string;
  gender: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: UserInfo | null;
  setUser: React.Dispatch<React.SetStateAction<UserInfo | null>>;
  isLoading: boolean;
  checkAuth: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const showHeader = location.pathname !== '/';

  return (
    <div className="flex flex-col min-h-screen">
      {showHeader && <Header />}
      <main className={`flex-grow ${showHeader ? 'pt-16' : ''}`}>
        {children}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/users/me', {
        method: 'GET',
        credentials: 'include',
      });
      const userData = await response.json();
      console.log('User data from /api/v1/users/me:', userData);
      if (!response.ok) {
        throw new Error(userData.detail || 'Failed to fetch user');
      }
      setUser({
        id: userData.id,
        name: userData.name,
        surname: userData.surname,
        email: userData.email,
        birthday: userData.birthday,
        gender: userData.gender,
        avatar_url: userData.avatar_url,
      });
      document.cookie = `user_id=${userData.id};path=/;max-age=${30 * 60}`;
      return userData.id;
    } catch (err) {
      console.error('Auth check error:', err);
      document.cookie = 'access_token=;path=/;max-age=0';
      document.cookie = 'refresh_token=;path=/;max-age=0';
      document.cookie = 'user_id=;path=/;max-age=0';
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, checkAuth }}>
      <Router>
        <Layout>
          <Routes>
            <Route
              path="/"
              element={
                isLoading ? (
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
                      <p className="mt-4 text-lg text-gray-600">Загрузка...</p>
                    </div>
                  </div>
                ) : user ? (
                  <Navigate to={`/profile/${user.id}`} replace />
                ) : (
                  <AuthPage onLogin={checkAuth} />
                )
              }
            />
            <Route path="/email-confirmation" element={<EmailConfirmPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/password-reset" element={<ResetPasswordPage />} />
          </Routes>
        </Layout>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;