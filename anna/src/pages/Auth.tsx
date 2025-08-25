import { useState, useCallback, useMemo, useEffect, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

type View = "welcome" | "login" | "register-step1" | "register-step2" | "email-confirmation";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  general?: string;
}

interface AuthPageProps {
  onLogin: () => Promise<string | null>;
}

const initialFormData: FormData = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
};

const initialFormErrors: FormErrors = {};

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("welcome");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>(initialFormErrors);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>("");
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
  }, []);

  const validateStep1 = useCallback(() => {
    const newErrors: FormErrors = {};
    if (!formData.email) newErrors.email = "Почта обязательна.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Введите корректную почту.";
    if (!formData.password) newErrors.password = "Пароль обязателен.";
    else if (formData.password.length < 8) newErrors.password = "Пароль должен быть не менее 8 символов.";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Пароли не совпадают.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const validateStep2 = useCallback(() => {
    const newErrors: FormErrors = {};
    if (!formData.firstName) newErrors.firstName = "Имя обязательно.";
    if (!formData.lastName) newErrors.lastName = "Фамилия обязательна.";
    if (!formData.dob) newErrors.dob = "Дата рождения обязательна.";
    else {
      const today = new Date();
      const birthDate = new Date(formData.dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 13) newErrors.dob = "Вы должны быть старше 13 лет.";
      if (age > 100) newErrors.dob = "Проверьте корректность даты рождения.";
    }
    if (!formData.gender) newErrors.gender = "Пол обязателен.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNextStep = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (view === "register-step1" && validateStep1()) setView("register-step2");
    },
    [view, validateStep1]
  );

  const handleRegisterSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!validateStep2()) return;
      setIsSubmitting(true);
      try {
        const payload = {
          email: formData.email,
          password: formData.password,
          name: formData.firstName,
          surname: formData.lastName,
          birthday: formData.dob,
          gender: formData.gender ? formData.gender.toUpperCase() : null,
        };
        const res = await fetch("http://localhost:8000/api/v1/public/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Registration failed");
        setView("email-confirmation");
      } catch (err: any) {
        setErrors({ general: err.message || "Ошибка регистрации" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateStep2, formData]
  );

  const handleLoginSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const newErrors: FormErrors = {};
      if (!formData.email) newErrors.email = "Почта обязательна.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Введите корректную почту.";
      if (!formData.password) newErrors.password = "Пароль обязателен.";
      if (Object.keys(newErrors).length) return setErrors(newErrors);

      setIsSubmitting(true);
      try {
        const res = await fetch("http://localhost:8000/api/v1/public/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
          credentials: 'include',
        });
        const data = await res.json();
        console.log('Login response:', data);
        if (!res.ok) throw new Error(data.detail || "Login failed");

        setErrors({ general: "Вход выполнен успешно!" });
        const userId = await onLogin();
        if (userId) {
          console.log('Navigating to:', `/profile/${userId}`);
          navigate(`/profile/${userId}`);
        } else {
          setErrors({ general: "Ошибка: не удалось получить данные пользователя" });
        }
      } catch (err: any) {
        setErrors({ general: err.message || "Ошибка входа" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onLogin, navigate]
  );

  const handleForgotPasswordToggle = useCallback(() => {
    setIsForgotPasswordOpen((prev) => !prev);
    setForgotPasswordEmail("");
    setForgotPasswordError(null);
    setForgotPasswordMessage(null);
  }, []);

  const handleForgotPasswordEmailChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setForgotPasswordEmail(e.target.value);
    setForgotPasswordError(null);
    setForgotPasswordMessage(null);
  }, []);

  const handleForgotPasswordSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!forgotPasswordEmail.trim()) return setForgotPasswordError("Введите email");
      setIsSubmitting(true);
      try {
        const res = await fetch("http://localhost:8000/api/v1/users/password-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotPasswordEmail }),
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Ошибка запроса");
        }
        setForgotPasswordMessage("Ссылка для сброса пароля отправлена на ваш email.");
      } catch (err: any) {
        setForgotPasswordError(err.message || "Ошибка при запросе");
      } finally {
        setIsSubmitting(false);
      }
    },
    [forgotPasswordEmail]
  );

  const renderForm = useMemo(() => {
    switch (view) {
      case "login":
        return (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <h2 className="text-4xl font-bold text-gray-800 mb-3">Вход</h2>
            <p className="text-gray-600 text-sm mb-4">Добро пожаловать обратно! Пожалуйста, войдите в свой аккаунт.</p>
            {errors.general && <p className={`text-sm mb-4 ${errors.general.includes("успешно") ? "text-green-500" : "text-red-500"}`}>{errors.general}</p>}
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-gray-700 font-medium text-sm">Почта</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Введите почту"
                aria-label="Электронная почта"
                aria-describedby="email-error"
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.email ? "border-red-400 ring-red-200" : "border-gray-200 focus:border-rose-300 focus:ring-rose-100"}`}
              />
              {errors.email && <p id="email-error" className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-gray-700 font-medium text-sm">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Минимум 8 символов"
                aria-label="Пароль"
                aria-describedby="password-error"
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.password ? "border-red-400 ring-red-200" : "border-gray-200 focus:border-rose-300 focus:ring-rose-100"}`}
              />
              {errors.password && <p id="password-error" className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-rose-700 text-white font-bold py-3 rounded-lg hover:bg-rose-800 hover:shadow-lg active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 mt-3 flex items-center justify-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Войти'
              )}
            </button>
            <button type="button" onClick={handleForgotPasswordToggle} className="text-center text-rose-600 font-semibold text-sm hover:underline mt-2">Забыли пароль?</button>
            <button type="button" onClick={() => setView("welcome")} className="text-gray-600 font-semibold py-2 rounded-lg border-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 mt-3">Назад</button>
          </form>
        );

      case "register-step1":
        return (
          <form onSubmit={handleNextStep} className="flex flex-col gap-4">
            <h2 className="text-4xl font-bold text-gray-800 mb-3">Создание аккаунта</h2>
            <p className="text-gray-600 text-sm mb-4">Введите данные для регистрации.</p>
            {errors.general && <p className="text-red-500 text-sm mb-4">{errors.general}</p>}
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-gray-700 font-medium text-sm">Почта</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Введите почту"
                aria-label="Электронная почта"
                aria-describedby="email-error"
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.email ? "border-red-400 ring-red-200" : "border-gray-200 focus:border-rose-300 focus:ring-rose-100"}`}
              />
              {errors.email && <p id="email-error" className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-gray-700 font-medium text-sm">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Минимум 8 символов"
                aria-label="Пароль"
                aria-describedby="password-error"
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.password ? "border-red-400 ring-red-200" : "border-gray-200 focus:border-rose-300 focus:ring-rose-100"}`}
              />
              {errors.password && <p id="password-error" className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="confirmPassword" className="text-gray-700 font-medium text-sm">Подтверждение пароля</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Повторите пароль"
                aria-label="Подтверждение пароля"
                aria-describedby="confirmPassword-error"
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.confirmPassword ? "border-red-400 ring-red-200" : "border-gray-200 focus:border-rose-300 focus:ring-rose-100"}`}
              />
              {errors.confirmPassword && <p id="confirmPassword-error" className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-rose-700 text-white font-bold py-3 rounded-lg hover:bg-rose-800 hover:shadow-lg active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 mt-3 flex items-center justify-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Далее'
              )}
            </button>
            <button
              type="button"
              onClick={() => setView("welcome")}
              className="text-gray-600 font-semibold py-2 rounded-lg border-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 mt-3"
            >
              Назад
            </button>
          </form>
        );

      case "register-step2":
        return (
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
            <h2 className="text-4xl font-bold text-gray-800 mb-3">Завершение регистрации</h2>
            <p className="text-gray-600 text-sm mb-4">Заполните личные данные.</p>
            {errors.general && <p className="text-red-500 text-sm mb-4">{errors.general}</p>}
            <div className="flex flex-col gap-1">
              <label htmlFor="firstName" className="text-gray-700 font-medium text-sm">Имя</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Введите ваше имя"
                aria-label="Имя"
                aria-describedby="firstName-error"
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.firstName ? "border-red-400 ring-red-200" : "border-gray-200 focus:border-rose-300 focus:ring-rose-100"}`}
              />
              {errors.firstName && <p id="firstName-error" className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="lastName" className="text-gray-700 font-medium text-sm">Фамилия</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Введите вашу фамилию"
                aria-label="Фамилия"
                aria-describedby="lastName-error"
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.lastName ? "border-red-400 ring-red-200" : "border-gray-200 focus:border-rose-300 focus:ring-rose-100"}`}
              />
              {errors.lastName && <p id="lastName-error" className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="dob" className="text-gray-700 font-medium text-sm">Дата рождения</label>
              <input
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                min="1900-01-01"
                aria-label="Дата рождения"
                aria-describedby="dob-error"
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.dob ? "border-red-400 ring-red-200" : "border-gray-200 focus:border-rose-300 focus:ring-rose-100"}`}
              />
              {errors.dob && <p id="dob-error" className="text-red-500 text-xs mt-1">{errors.dob}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="gender" className="text-gray-700 font-medium text-sm">Пол</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                aria-label="Пол"
                aria-describedby="gender-error"
                className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.gender ? "border-red-400 ring-red-200" : "border-gray-200 focus:border-rose-300 focus:ring-rose-100"}`}
              >
                <option value="">Выберите пол</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
              {errors.gender && <p id="gender-error" className="text-red-500 text-xs mt-1">{errors.gender}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-rose-700 text-white font-bold py-3 rounded-lg hover:bg-rose-800 hover:shadow-lg active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 mt-3 flex items-center justify-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Зарегистрироваться'
              )}
            </button>
            <button
              type="button"
              onClick={() => setView("register-step1")}
              className="text-gray-600 font-semibold py-2 rounded-lg border-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 mt-3"
            >
              Назад
            </button>
          </form>
        );

      case "email-confirmation":
        return (
          <div className="flex flex-col gap-6 items-center text-center">
            <h2 className="text-4xl font-bold text-gray-800">Подтверждение почты</h2>
            <p className="text-gray-600 text-base">
              Мы отправили письмо на <span className="font-semibold">{formData.email}</span>. Пожалуйста, проверьте вашу почту и перейдите по ссылке для подтверждения аккаунта.
            </p>
            <button
              type="button"
              onClick={() => setView("welcome")}
              className="bg-rose-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-rose-800 hover:shadow-lg active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 mt-3"
            >
              Вернуться на главную
            </button>
          </div>
        );

      default:
        return (
          <div className="flex flex-col gap-6">
            <h2 className="text-4xl font-extrabold text-gray-800 leading-tight">Добро пожаловать в <span className="text-rose-600">AnnA</span></h2>
            <p className="text-gray-600 text-base leading-relaxed">Присоединяйтесь к нашему сообществу, чтобы общаться с друзьями, делиться моментами и находить новые интересы.</p>
            {errors.general && <p className={`text-sm mb-4 ${errors.general.includes("успешно") ? "text-green-500" : "text-red-500"}`}>{errors.general}</p>}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button
                onClick={() => setView("register-step1")}
                className="flex-1 bg-rose-700 text-white font-bold text-base py-3 rounded-lg hover:bg-rose-800 hover:shadow-lg active:scale-95 transition-all duration-200 shadow-md focus:outline-none focus:ring-4 focus:ring-rose-200"
              >
                Создать аккаунт
              </button>
              <button
                onClick={() => setView("login")}
                className="flex-1 bg-white text-rose-600 font-bold text-base py-3 rounded-lg border-2 border-rose-300 hover:bg-rose-50 hover:shadow-lg active:scale-95 transition-all duration-200 shadow-md focus:outline-none focus:ring-4 focus:ring-rose-200"
              >
                Войти
              </button>
            </div>
          </div>
        );
    }
  }, [view, formData, errors, handleChange, handleLoginSubmit, handleForgotPasswordToggle, handleNextStep, handleRegisterSubmit, isSubmitting]);

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl text-center">
          <div className="flex items-center justify-center w-24 h-24 bg-gray-300 rounded-full mb-6">
            <span className="text-rose-600 text-4xl font-bold">A</span>
          </div>
          <h1 className="text-4xl font-extrabold text-rose-800 mb-4 leading-tight">AnnA</h1>
          <p className="text-rose-700 text-base leading-relaxed max-w-sm">Ваше место для общения, обмена и вдохновения.</p>
        </div>
        <div key={view} className="flex flex-col justify-center p-6 animate-fade-in">{renderForm}</div>
      </div>
      {isForgotPasswordOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
              <h2 id="forgot-password-title" className="text-3xl font-bold text-gray-800">Сброс пароля</h2>
              <button
                onClick={handleForgotPasswordToggle}
                aria-label="Закрыть модальное окно"
                className="text-gray-500 hover:text-gray-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {forgotPasswordError && <p className="text-red-500 text-sm mb-4">{forgotPasswordError}</p>}
            {forgotPasswordMessage && <p className="text-green-500 text-sm mb-4">{forgotPasswordMessage}</p>}
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
              <div className="flex flex-col gap-1">
                <label htmlFor="forgotEmail" className="text-gray-700 font-medium text-sm">Email</label>
                <input
                  id="forgotEmail"
                  name="forgotEmail"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={handleForgotPasswordEmailChange}
                  placeholder="Введите ваш email"
                  aria-label="Электронная почта для сброса пароля"
                  aria-describedby="forgotEmail-error"
                  className="p-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100 transition-all duration-200"
                />
                {forgotPasswordError && <p id="forgotEmail-error" className="text-red-500 text-sm mt-1">{forgotPasswordError}</p>}
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={handleForgotPasswordToggle}
                  className="bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`bg-rose-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-rose-800 hover:shadow-lg active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 flex items-center justify-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Отправить'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;