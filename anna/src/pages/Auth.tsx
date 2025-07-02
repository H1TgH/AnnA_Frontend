import { useState, useCallback, useMemo, ChangeEvent, FormEvent } from "react";

// Определение типа View
type View = 'welcome' | 'login' | 'register-step1' | 'register-step2' | 'email-confirmation';

// Интерфейс для данных формы
interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
}

// Интерфейс для ошибок формы
interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  general?: string; // Для общих ошибок (например, от сервера)
}

const initialFormData: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  dob: '',
  gender: '',
};

const initialFormErrors: FormErrors = {
  email: undefined,
  password: undefined,
  confirmPassword: undefined,
  firstName: undefined,
  lastName: undefined,
  dob: undefined,
  gender: undefined,
  general: undefined,
};

const AuthPage: React.FC = () => {
  const [view, setView] = useState<View>('welcome');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>(initialFormErrors);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prevData) => ({ ...prevData, [name]: value }));
      setErrors((prevErrors) => ({ ...prevErrors, [name]: undefined, general: undefined }));
    },
    []
  );

  const validateStep1 = useCallback(() => {
    const newErrors: FormErrors = {};
    if (!formData.email) {
      newErrors.email = 'Почта обязательна.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректную почту.';
    }
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен быть не менее 8 символов.';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const validateStep2 = useCallback(() => {
    const newErrors: FormErrors = {};
    if (!formData.firstName) {
      newErrors.firstName = 'Имя обязательно.';
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Фамилия обязательна.';
    }
    if (!formData.dob) {
      newErrors.dob = 'Дата рождения обязательна.';
    }
    if (!formData.gender) {
      newErrors.gender = 'Пол обязателен.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNextStep = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (view === 'register-step1' && validateStep1()) {
        setView('register-step2');
      }
    },
    [view, validateStep1]
  );

  const handleRegisterSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (validateStep2()) {
        const payload = {
          email: formData.email,
          password: formData.password,
          name: formData.firstName,
          surname: formData.lastName,
          birthday: formData.dob,
          gender: formData.gender ? formData.gender.toUpperCase() : null,
        };
        console.log("Register payload:", payload);
        try {
          const response = await fetch('http://localhost:8000/api/v1/public/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await response.json();
          console.log("Register response:", data);
          if (!response.ok) {
            throw new Error(data.detail || 'Registration failed');
          }
          setView('email-confirmation');
        } catch (error: any) {
          console.error("Registration error:", error.message);
          setErrors({ general: error.message || 'Ошибка регистрации' });
        }
      }
    },
    [validateStep2, formData]
  );

  const handleLoginSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const newErrors: FormErrors = {};
      if (!formData.email) {
        newErrors.email = 'Почта обязательна.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Введите корректную почту.';
      }
      if (!formData.password) {
        newErrors.password = 'Пароль обязателен.';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      const payload = {
        email: formData.email,
        password: formData.password,
      };
      console.log("Login payload:", payload);
      try {
        const response = await fetch('http://localhost:8000/api/v1/public/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        console.log("Login response:", data);
        if (!response.ok) {
          throw new Error(data.detail || 'Login failed');
        }
        // Сохраняем токен в localStorage
        localStorage.setItem('access_token', data.access_token);
        setFormData(initialFormData);
        setErrors(initialFormErrors);
        setView('welcome');
        // Временное уведомление в UI
        setErrors({ general: 'Вход выполнен успешно!' });
        // TODO: Перенаправить на защищённую страницу (например, /dashboard)
        setTimeout(() => {
          window.location.href = '/profile'; // Заменить на твой маршрут
        }, 2000);
      } catch (error: any) {
        console.error("Login error:", error.message);
        setErrors({ general: error.message || 'Ошибка входа' });
      }
    },
    [formData]
  );

  const handleConfirmEmail = useCallback(async () => {
    const token = new URLSearchParams(window.location.search).get('token');
    console.log("Extracted token:", token);
    if (!token) {
      setErrors({ general: 'Токен подтверждения отсутствует' });
      return;
    }

    try {
      // Используем GET, так как бэкенд ожидает query-параметр
      const response = await fetch(`http://localhost:8000/api/v1/public/confirm-email?token=${token}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log("Confirm email response:", data);
      if (!response.ok) {
        throw new Error(data.detail || 'Email confirmation failed');
      }
      setFormData(initialFormData);
      setErrors({ general: 'Почта успешно подтверждена!' });
      setView('welcome');
      // TODO: Перенаправить на страницу логина или другую
    } catch (error: any) {
      console.error("Confirmation error:", error.message);
      setErrors({ general: error.message || 'Ошибка подтверждения почты' });
    }
  }, []);

  const renderForm = useMemo(() => {
    switch (view) {
      case 'login':
        return (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Вход</h2>
            <p className="text-gray-600 text-sm mb-4">
              Добро пожаловать обратно! Пожалуйста, войдите в свой аккаунт.
            </p>
            {errors.general && (
              <p className={`text-sm mb-4 ${errors.general.includes('успешно') ? 'text-green-500' : 'text-red-500'}`}>
                {errors.general}
              </p>
            )}
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-gray-700 font-medium text-sm">
                Почта
              </label>
              <input
                id="email"
                name="email"
                type="text"
                value={formData.email}
                onChange={handleChange}
                placeholder="Введите почту"
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.email
                    ? 'border-red-400 ring-red-200'
                    : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-gray-700 font-medium text-sm">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Введите пароль"
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.password
                    ? 'border-red-400 ring-red-200'
                    : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                }`}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
            <button
              type="submit"
              className="bg-rose-600 text-white font-bold py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 mt-3"
            >
              Войти
            </button>
            <a
              href="#"
              className="text-center text-rose-600 font-semibold text-sm hover:underline mt-2"
            >
              Забыли пароль?
            </a>
            <button
              type="button"
              onClick={() => setView('welcome')}
              className="text-gray-600 font-semibold py-2 rounded-lg border-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 mt-3"
            >
              Назад
            </button>
          </form>
        );
      case 'register-step1':
        return (
          <form onSubmit={handleNextStep} className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Создать аккаунт
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Присоединяйтесь к нашему сообществу! Введите свои данные для
              регистрации.
            </p>
            {errors.general && (
              <p className="text-red-500 text-sm mb-4">{errors.general}</p>
            )}
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-gray-700 font-medium text-sm">
                Почта
              </label>
              <input
                id="email"
                name="email"
                type="text"
                value={formData.email}
                onChange={handleChange}
                placeholder="Введите почту"
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.email
                    ? 'border-red-400 ring-red-200'
                    : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-gray-700 font-medium text-sm">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Придумайте пароль"
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.password
                    ? 'border-red-400 ring-red-200'
                    : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                }`}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="confirmPassword"
                className="text-gray-700 font-medium text-sm"
              >
                Подтверждение пароля
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Повторите пароль"
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.confirmPassword
                    ? 'border-red-400 ring-red-200'
                    : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="bg-rose-600 text-white font-bold py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 mt-3"
            >
              Далее
            </button>
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-500">или</span>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-white text-gray-700 font-bold py-3 rounded-lg border-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.0003 12.7273V15.0003H19.5003C19.3173 16.4083 18.5883 17.6453 17.5003 18.5003V21.5003H21.5003C23.8333 19.3333 25.0003 16.1663 25.0003 12.0003C25.0003 11.2723 24.9393 10.5633 24.8283 9.87531H12.0003V12.7273Z"
                  fill="#4285F4"
                />
                <path
                  d="M12.0003 25.0003C15.2723 25.0003 18.0913 23.9093 20.2723 22.0003L17.5003 18.5003C16.0913 19.5913 14.2723 20.2723 12.0003 20.2723C9.00031 20.2723 6.54531 18.3633 5.63631 15.7273H2.50031V18.7273C4.36331 22.3633 7.81831 25.0003 12.0003 25.0003Z"
                  fill="#34A853"
                />
                <path
                  d="M5.63631 15.7273C5.45431 15.1823 5.36331 14.5913 5.36331 14.0003C5.36331 13.4093 5.45431 12.8183 5.63631 12.2723V9.27231H2.50031C1.81831 10.5913 1.50031 12.2723 1.50031 14.0003C1.50031 15.7273 1.81831 17.4093 2.50031 18.7273L5.63631 15.7273Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.0003 7.72731C13.6363 7.72731 15.0913 8.36331 16.2723 9.27231L19.0003 6.50031C17.2723 4.81831 14.8183 4.00031 12.0003 4.00031C7.81831 4.00031 4.36331 6.63631 2.50031 10.2723L5.63631 13.2723C6.54531 10.6363 9.00031 8.72731 12.0003 7.72731Z"
                  fill="#EA4335"
                />
              </svg>
              Продолжить с Google
            </button>
            <button
              type="button"
              onClick={() => setView('welcome')}
              className="text-gray-600 font-semibold py-2 rounded-lg border-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 mt-3"
            >
              Назад
            </button>
          </form>
        );
      case 'register-step2':
        return (
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Расскажите о себе
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Пожалуйста, введите немного информации о себе.
            </p>
            {errors.general && (
              <p className="text-red-500 text-sm mb-4">{errors.general}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="firstName"
                  className="text-gray-700 font-medium text-sm"
                >
                  Имя
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Введите ваше имя"
                  className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.firstName
                      ? 'border-red-400 ring-red-200'
                      : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="lastName"
                  className="text-gray-700 font-medium text-sm"
                >
                  Фамилия
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Введите вашу фамилию"
                  className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.lastName
                      ? 'border-red-400 ring-red-200'
                      : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="dob" className="text-gray-700 font-medium text-sm">
                Дата рождения
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.dob
                    ? 'border-red-400 ring-red-200'
                    : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                }`}
              />
              {errors.dob && (
                <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="gender" className="text-gray-700 font-medium text-sm">
                Пол
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`p-3 rounded-lg border-2 bg-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.gender
                    ? 'border-red-400 ring-red-200'
                    : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                }`}
              >
                <option value="">Не указано</option>
                <option value="MALE">Мужской</option>
                <option value="FEMALE">Женский</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
              )}
            </div>
            <button
              type="submit"
              className="bg-rose-600 text-white font-bold py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 mt-3"
            >
              Завершить регистрацию
            </button>
            <button
              type="button"
              onClick={() => setView('register-step1')}
              className="text-gray-600 font-semibold py-2 rounded-lg border-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 mt-3"
            >
              Назад
            </button>
          </form>
        );
      case 'email-confirmation':
        return (
          <div className="flex flex-col gap-6 p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Подтверждение почты
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              На адрес <span className="font-semibold">{formData.email}</span> было отправлено письмо с кодом подтверждения.
              Пожалуйста, проверьте вашу почту и подтвердите регистрацию.
            </p>
            {errors.general && (
              <p className={`text-sm mb-4 ${errors.general.includes('успешно') ? 'text-green-500' : 'text-red-500'}`}>
                {errors.general}
              </p>
            )}
            <button
              onClick={handleConfirmEmail}
              className="bg-rose-600 text-white font-bold py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200"
            >
              Я подтвердил(а) почту
            </button>
            <button
              type="button"
              onClick={() => setView('register-step2')}
              className="text-gray-600 font-semibold py-2 rounded-lg border-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 mt-3"
            >
              Назад
            </button>
          </div>
        );
      case 'welcome':
      default:
        return (
          <div className="flex flex-col gap-6">
            <h2 className="text-4xl font-extrabold text-gray-800 leading-tight">
              Добро пожаловать в{' '}
              <span className="text-rose-600">AnnA</span>
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              Присоединяйтесь к нашему сообществу, чтобы общаться с друзьями,
              делиться моментами и находить новые интересы.
            </p>
            {errors.general && (
              <p className={`text-sm mb-4 ${errors.general.includes('успешно') ? 'text-green-500' : 'text-red-500'}`}>
                {errors.general}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button
                onClick={() => setView('register-step1')}
                className="flex-1 bg-rose-600 text-white font-bold text-base py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 shadow-md focus:outline-none focus:ring-4 focus:ring-rose-200"
              >
                Создать аккаунт
              </button>
              <button
                onClick={() => setView('login')}
                className="flex-1 bg-white text-rose-600 font-bold text-base py-3 rounded-lg border-2 border-rose-300 hover:bg-rose-50 transition-colors duration-200 shadow-md focus:outline-none focus:ring-4 focus:ring-rose-200"
              >
                Войти
              </button>
            </div>
          </div>
        );
    }
  }, [
    view,
    formData,
    errors,
    handleChange,
    handleNextStep,
    handleRegisterSubmit,
    handleLoginSubmit,
    handleConfirmEmail,
  ]);

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col items-center justify-center p-6 bg-rose-100 rounded-xl text-center">
          <div className="w-24 h-24 mb-6">
            <div className="bg-rose-200 border-4 border-dashed border-rose-300 rounded-full w-full h-full flex items-center justify-center">
              <span className="text-rose-600 text-4xl font-bold">A</span>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-rose-800 mb-4 leading-tight">
            AnnA
          </h1>
          <p className="text-rose-700 text-base leading-relaxed max-w-sm">
            Ваше место для общения, обмена и вдохновения.
          </p>
          <div className="mt-8">
            <div className="bg-rose-200 rounded-2xl w-full h-48 border-4 border-dashed border-rose-300 flex items-center justify-center">
              <span className="text-rose-600 text-base font-semibold">
                Illustration Placeholder
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center p-6">{renderForm}</div>
      </div>
    </div>
  );
};

export default AuthPage;