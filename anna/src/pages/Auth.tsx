import { useState, useCallback, useMemo, ChangeEvent, FormEvent } from "react";

// Определение типа View
type View = 'welcome' | 'login' | 'register-step1' | 'register-step2';

// Интерфейс для данных формы
interface FormData {
  emailOrPhone: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
}

// Интерфейс для ошибок формы
interface FormErrors {
  emailOrPhone?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
}

const initialFormData: FormData = {
  emailOrPhone: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  dob: '',
  gender: '',
};

const initialFormErrors: FormErrors = {
  emailOrPhone: undefined,
  password: undefined,
  confirmPassword: undefined,
  firstName: undefined,
  lastName: undefined,
  dob: undefined,
  gender: undefined,
};

const AuthPage: React.FC = () => {
  const [view, setView] = useState<View>('welcome');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>(initialFormErrors);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prevData) => ({ ...prevData, [name]: value }));
      setErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
    },
    []
  );

  const validateStep1 = useCallback(() => {
    const newErrors: FormErrors = {};
    if (!formData.emailOrPhone) {
      newErrors.emailOrPhone = 'Почта или номер телефона обязательны.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$|^\+?\d{10,15}$/.test(formData.emailOrPhone)
    ) {
      newErrors.emailOrPhone = 'Введите корректную почту или номер телефона.';
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
      if (view === 'register-step1') {
        if (validateStep1()) {
          setView('register-step2');
        }
      }
    },
    [view, validateStep1]
  );

  const handleRegisterSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (validateStep2()) {
        console.log('Registration data submitted:', formData);
        alert('Регистрация успешна! (Данные отправлены в консоль)');
        setFormData(initialFormData);
        setView('welcome');
      }
    },
    [formData, validateStep2]
  );

  const handleLoginSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const newErrors: FormErrors = {};
      if (!formData.emailOrPhone) {
        newErrors.emailOrPhone = 'Почта или номер телефона обязательны.';
      }
      if (!formData.password) {
        newErrors.password = 'Пароль обязателен.';
      }
      setErrors(newErrors);

      if (Object.keys(newErrors).length === 0) {
        console.log('Login data submitted:', {
          emailOrPhone: formData.emailOrPhone,
          password: formData.password,
        });
        alert('Вход выполнен! (Данные отправлены в консоль)');
        setFormData(initialFormData);
        setView('welcome');
      }
    },
    [formData]
  );

  const renderForm = useMemo(() => {
    switch (view) {
      case 'login':
        return (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-6">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Вход</h2>
            <p className="text-gray-600 mb-6">
              Добро пожаловать обратно! Пожалуйста, войдите в свой аккаунт.
            </p>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="emailOrPhone"
                className="text-gray-700 font-medium"
              >
                Почта или номер телефона
              </label>
              <input
                id="emailOrPhone"
                name="emailOrPhone"
                type="text"
                value={formData.emailOrPhone}
                onChange={handleChange}
                placeholder="Введите почту или номер телефона"
                className={`p-4 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.emailOrPhone
                    ? 'border-red-400 ring-red-200'
                    : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                }`}
              />
              {errors.emailOrPhone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.emailOrPhone}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-gray-700 font-medium">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Введите пароль"
                className={`p-4 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.password
                    ? 'border-red-400 ring-red-200'
                    : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                }`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            <button
              type="submit"
              className="bg-rose-600 text-white font-bold py-4 rounded-xl hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 mt-4"
            >
              Войти
            </button>
            <a
              href="#"
              className="text-center text-rose-600 font-semibold hover:underline mt-2"
            >
              Забыли пароль?
            </a>
            <button
              type="button"
              onClick={() => setView('welcome')}
              className="text-gray-600 font-semibold py-3 rounded-xl border-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 mt-4"
            >
              Назад
            </button>
          </form>
        );
      case 'register-step1':
        return (
          <form onSubmit={handleNextStep} className="flex flex-col gap-6">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Создать аккаунт
            </h2>
            <p className="text-gray-600 mb-6">
              Присоединяйтесь к нашему сообществу! Введите свои данные для
              регистрации.
            </p>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="emailOrPhone"
                className="text-gray-700 font-medium"
              >
                Почта или номер телефона
              </label>
              <input
                id="emailOrPhone"
                name="emailOrPhone"
                type="text"
                value={formData.emailOrPhone}
                onChange={handleChange}
                placeholder="Введите почту или номер телефона"
                className={`p-4 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.emailOrPhone
                    ? 'border-red-400 ring-red-200'
                    : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                }`}
              />
              {errors.emailOrPhone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.emailOrPhone}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-gray-700 font-medium">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Придумайте пароль"
                className={`p-4 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.password
                    ? 'border-red-400 ring-red-200'
                    : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                }`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="confirmPassword"
                className="text-gray-700 font-medium"
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
                className={`p-4 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.confirmPassword
                    ? 'border-red-400 ring-red-200'
                    : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="bg-rose-600 text-white font-bold py-4 rounded-xl hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 mt-4"
            >
              Далее
            </button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">или</span>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center justify-center gap-3 bg-white text-gray-700 font-bold py-4 rounded-xl border-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
            >
              <svg
                className="w-6 h-6"
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
              className="text-gray-600 font-semibold py-3 rounded-xl border-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 mt-4"
            >
              Назад
            </button>
          </form>
        );
      case 'register-step2':
        return (
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-6">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Расскажите о себе
            </h2>
            <p className="text-gray-600 mb-6">
              Пожалуйста, введите немного информации о себе.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="firstName"
                  className="text-gray-700 font-medium"
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
                  className={`p-4 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.firstName
                      ? 'border-red-400 ring-red-200'
                      : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="lastName"
                  className="text-gray-700 font-medium"
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
                  className={`p-4 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.lastName
                      ? 'border-red-400 ring-red-200'
                      : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="dob" className="text-gray-700 font-medium">
                Дата рождения
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                className={`p-4 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.dob
                    ? 'border-red-400 ring-red-200'
                    : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                }`}
              />
              {errors.dob && (
                <p className="text-red-500 text-sm mt-1">{errors.dob}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="gender" className="text-gray-700 font-medium">
                Пол
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`p-4 rounded-xl border-2 bg-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.gender
                    ? 'border-red-400 ring-red-200'
                    : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
                }`}
              >
                <option value="" disabled>
                  Выберите пол
                </option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
                <option value="other">Другой</option>
                <option value="prefer_not_to_say">Не хочу указывать</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
              )}
            </div>
            <button
              type="submit"
              className="bg-rose-600 text-white font-bold py-4 rounded-xl hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 mt-4"
            >
              Завершить регистрацию
            </button>
            <button
              type="button"
              onClick={() => setView('register-step1')}
              className="text-gray-600 font-semibold py-3 rounded-xl border-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 mt-4"
            >
              Назад
            </button>
          </form>
        );
      case 'welcome':
      default:
        return (
          <div className="flex flex-col gap-8">
            <h2 className="text-5xl font-extrabold text-gray-800 leading-tight">
              Добро пожаловать в{' '}
              <span className="text-rose-600">AnnA</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Присоединяйтесь к нашему сообществу, чтобы общаться с друзьями,
              делиться моментами и находить новые интересы.
            </p>
            <div className="flex flex-col md:flex-row gap-6 mt-6">
              <button
                onClick={() => setView('register-step1')}
                className="flex-1 bg-rose-600 text-white font-bold text-lg py-5 rounded-2xl hover:bg-rose-700 transition-colors duration-200 shadow-lg focus:outline-none focus:ring-4 focus:ring-rose-200"
              >
                Создать аккаунт
              </button>
              <button
                onClick={() => setView('login')}
                className="flex-1 bg-white text-rose-600 font-bold text-lg py-5 rounded-2xl border-2 border-rose-300 hover:bg-rose-50 transition-colors duration-200 shadow-lg focus:outline-none focus:ring-4 focus:ring-rose-200"
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
  ]);

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-8 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col items-center justify-center p-8 bg-rose-100 rounded-2xl text-center h-full">
          <div className="w-32 h-32 mb-8">
            <div className="bg-rose-200 border-4 border-dashed border-rose-300 rounded-full w-full h-full flex items-center justify-center">
              <span className="text-rose-600 text-6xl font-bold">A</span>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold text-rose-800 mb-6 leading-tight">
            AnnA
          </h1>
          <p className="text-rose-700 text-lg leading-relaxed max-w-md">
            Ваше место для общения, обмена и вдохновения.
          </p>
          <div className="mt-12">
            <div className="bg-rose-200 rounded-3xl w-full h-64 border-4 border-dashed border-rose-300 flex items-center justify-center">
              <span className="text-rose-600 text-xl font-semibold">
                Illustration Placeholder
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center p-8">{renderForm}</div>
      </div>
    </div>
  );
};

export default AuthPage;