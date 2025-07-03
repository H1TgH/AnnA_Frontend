import { useState, useCallback, useMemo, useEffect, ChangeEvent, FormEvent } from "react";

// View type
 type View = "welcome" | "login" | "register-step1" | "register-step2" | "email-confirmation";

// Interfaces
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

const AuthPage: React.FC = () => {
  const [view, setView] = useState<View>("welcome");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>(initialFormErrors);

  // Forgot-password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>("");
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);

  /* ==============================
          COMMON HANDLERS
  ============================== */
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
  }, []);

  /* ==============================
         VALIDATIONS (omitted)
  ============================== */
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
    if (!formData.gender) newErrors.gender = "Пол обязателен.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /* ==============================
             VIEW HANDLERS
  ============================== */
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
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Registration failed");
        setView("email-confirmation");
      } catch (err: any) {
        setErrors({ general: err.message || "Ошибка регистрации" });
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

      try {
        const res = await fetch("http://localhost:8000/api/v1/public/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Login failed");
        localStorage.setItem("access_token", data.access_token);
        setErrors({ general: "Вход выполнен успешно!" });
        setTimeout(() => (window.location.href = "/profile"), 2000);
      } catch (err: any) {
        setErrors({ general: err.message || "Ошибка входа" });
      }
    },
    [formData]
  );

  /* ==============================
        FORGOT PASSWORD LOGIC
  ============================== */
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
      try {
        const res = await fetch("http://localhost:8000/api/v1/users/password-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotPasswordEmail }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Ошибка запроса");
        }
        setForgotPasswordMessage("Ссылка для сброса пароля отправлена на ваш email.");
      } catch (err: any) {
        setForgotPasswordError(err.message || "Ошибка при запросе");
      }
    },
    [forgotPasswordEmail]
  );

  /* ==============================
             RENDER FORMS
  ============================== */
  const renderForm = useMemo(() => {
    switch (view) {
      case "login":
        return (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Вход</h2>
            <p className="text-gray-600 text-sm mb-4">Добро пожаловать обратно! Пожалуйста, войдите в свой аккаунт.</p>
            {errors.general && <p className={`text-sm mb-4 ${errors.general.includes("успешно") ? "text-green-500" : "text-red-500"}`}>{errors.general}</p>}
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-gray-700 font-medium text-sm">Почта</label>
              <input id="email" name="email" type="text" value={formData.email} onChange={handleChange} placeholder="Введите почту" className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.email ? "border-red-400 ring-red-200" : "border-gray-200 focus:border-rose-300 focus:ring-rose-100"}`} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-gray-700 font-medium text-sm">Пароль</label>
              <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Введите пароль" className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.password ? "border-red-400 ring-red-200" : "border-gray-200 focus:border-rose-300 focus:ring-rose-100"}`} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <button type="submit" className="bg-rose-600 text-white font-bold py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 mt-3">Войти</button>
            <button type="button" onClick={handleForgotPasswordToggle} className="text-center text-rose-600 font-semibold text-sm hover:underline mt-2">Забыли пароль?</button>
            <button type="button" onClick={() => setView("welcome")} className="text-gray-600 font-semibold py-2 rounded-lg border-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 mt-3">Назад</button>
          </form>
        );

      /* Other cases remain unchanged (register steps, email confirmation, welcome) */
      case "register-step1":
        /* ... (omitted for brevity, identical to previous) */
        return null;
      case "register-step2":
        return null;
      case "email-confirmation":
        return null;
      default:
        return (
          <div className="flex flex-col gap-6">
            <h2 className="text-4xl font-extrabold text-gray-800 leading-tight">Добро пожаловать в <span className="text-rose-600">AnnA</span></h2>
            <p className="text-gray-600 text-base leading-relaxed">Присоединяйтесь к нашему сообществу, чтобы общаться с друзьями, делиться моментами и находить новые интересы.</p>
            {errors.general && <p className={`text-sm mb-4 ${errors.general.includes("успешно") ? "text-green-500" : "text-red-500"}`}>{errors.general}</p>}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button onClick={() => setView("register-step1")} className="flex-1 bg-rose-600 text-white font-bold text-base py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 shadow-md focus:outline-none focus:ring-4 focus:ring-rose-200">Создать аккаунт</button>
              <button onClick={() => setView("login")} className="flex-1 bg-white text-rose-600 font-bold text-base py-3 rounded-lg border-2 border-rose-300 hover:bg-rose-50 transition-colors duration-200 shadow-md focus:outline-none focus:ring-4 focus:ring-rose-200">Войти</button>
            </div>
          </div>
        );
    }
  }, [view, formData, errors, handleChange, handleLoginSubmit, handleForgotPasswordToggle]);

  /* ==============================
                JSX
  ============================== */
  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left panel */}
        <div className="flex flex-col items-center justify-center p-6 bg-rose-100 rounded-xl text-center">
          <div className="w-24 h-24 mb-6">
            <div className="bg-rose-200 border-4 border-dashed border-rose-300 rounded-full w-full h-full flex items-center justify-center">
              <span className="text-rose-600 text-4xl font-bold">A</span>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-rose-800 mb-4 leading-tight">AnnA</h1>
          <p className="text-rose-700 text-base leading-relaxed max-w-sm">Ваше место для общения, обмена и вдохновения.</p>
          <div className="mt-8">
            <div className="bg-rose-200 rounded-2xl w-full h-48 border-4 border-dashed border-rose-300 flex items-center justify-center">
              <span className="text-rose-600 text-base font-semibold">Illustration Placeholder</span>
            </div>
          </div>
        </div>

        {/* Right panel – dynamic form */}
        <div className="flex flex-col justify-center p-6">{renderForm}</div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Сброс пароля</h2>
              <button onClick={handleForgotPasswordToggle} className="text-gray-500 hover:text-gray-800 transition-colors">
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
                <input id="forgotEmail" name="forgotEmail" type="email" value={forgotPasswordEmail} onChange={handleForgotPasswordEmailChange} placeholder="Введите ваш email" className="p-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100 transition-all duration-200" />
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button type="button" onClick={handleForgotPasswordToggle} className="bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200">Отмена</button>
                <button type="submit" className="bg-rose-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200">Отправить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
