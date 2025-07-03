import { useState, useCallback, ChangeEvent, FormEvent, ReactNode } from "react";
import { Lock, CheckCircle, ArrowLeft, Key, Loader2 } from 'lucide-react';

interface FormData {
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

const initialFormData: FormData = {
  newPassword: '',
  confirmPassword: '',
};

// --- Helper Components ---

interface InputProps {
  id: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  label: string;
  Icon: React.ElementType;
}

const StyledInput: React.FC<InputProps> = ({ id, name, type, value, onChange, placeholder, error, label, Icon }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-gray-700 font-medium text-sm flex items-center gap-2">
      <Icon className="w-4 h-4 text-rose-500" />
      {label}
    </label>
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`p-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${error
          ? 'border-red-400 ring-red-200 focus:border-red-500'
          : 'border-gray-200 focus:border-rose-300 focus:ring-rose-100'
        } text-gray-800 placeholder-gray-400`}
    />
    {error && (
      <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>
    )}
  </div>
);

interface ButtonProps {
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}

const PrimaryButton: React.FC<ButtonProps> = ({ children, type = "submit", onClick, disabled }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`w-full bg-rose-600 text-white font-bold py-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 mt-3 ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-rose-700 shadow-md'}`}
  >
    {children}
  </button>
);

const SecondaryButton: React.FC<ButtonProps> = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-center gap-2 text-gray-600 font-semibold py-3 rounded-lg border-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 mt-3"
  >
    {children}
  </button>
);

// --- Main Component ---

const ResetPasswordPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Extract token from URL parameters
  const token = new URLSearchParams(window.location.search).get('token') || '';

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prevData) => ({ ...prevData, [name]: value }));
      // Clear specific error when user starts typing
      setErrors((prevErrors) => ({ ...prevErrors, [name]: undefined, general: undefined }));
    },
    []
  );

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    const { newPassword, confirmPassword } = formData;

    if (!newPassword) {
      newErrors.newPassword = 'Новый пароль обязателен.';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Пароль должен быть не менее 8 символов.';
    }

    if (!confirmPassword) {
        newErrors.confirmPassword = 'Подтверждение пароля обязательно.';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setErrors({});

      if (!validateForm()) {
        return;
      }

      if (!token) {
        setErrors({ general: 'Ошибка: Токен сброса пароля отсутствует. Пожалуйста, используйте ссылку из письма.' });
        return;
      }

      setIsLoading(true);

      const payload = {
        new_password: formData.newPassword,
      };

      try {
        const res = await fetch(`http://localhost:8000/api/v1/users/update-password?token=${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Произошла ошибка при сбросе пароля.');
        }

        setIsSuccess(true);
      } catch (error: any) {
        setErrors({ general: error.message || 'Произошла ошибка при сбросе пароля. Попробуйте позже.' });
      } finally {
        setIsLoading(false);
      }
    },
    [formData, validateForm, token]
  );

  const handleGoToLogin = () => {
    // In a real app, redirect to the login page
    console.log("Redirecting to login...");
    window.location.href = "/login";
  };

  const renderContent = () => {
    if (isSuccess) {
      return (
        <div className="flex flex-col gap-6 items-center text-center p-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <h2 className="text-3xl font-bold text-gray-800">Пароль успешно изменен!</h2>
          <p className="text-gray-600 text-base">
            Ваш пароль был сброшен. Теперь вы можете войти в систему, используя новый пароль.
          </p>
          <PrimaryButton
            type="button"
            onClick={handleGoToLogin}
          >
            Перейти ко входу
          </PrimaryButton>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Установка нового пароля</h2>
        <p className="text-gray-600 text-sm mb-4">
          Введите новый пароль для вашего аккаунта. Убедитесь, что он надежный и вы его запомните.
        </p>

        {errors.general && (
          <div className="p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-lg border border-red-200" role="alert">
            {errors.general}
          </div>
        )}

        <StyledInput
          id="newPassword"
          name="newPassword"
          type="password"
          label="Новый пароль"
          placeholder="Минимум 8 символов"
          value={formData.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          Icon={Key}
        />

        <StyledInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Подтверждение пароля"
          placeholder="Повторите новый пароль"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          Icon={Lock}
        />

        <PrimaryButton disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Сохранение...
            </span>
          ) : (
            'Установить новый пароль'
          )}
        </PrimaryButton>

        <SecondaryButton onClick={handleGoToLogin}>
          <ArrowLeft className="w-4 h-4" />
          Вернуться ко входу
        </SecondaryButton>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Main Card Container */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2">

        {/* Left Side - Branding (Matching AuthPage style) */}
        <div className="flex flex-col items-center justify-center p-10 bg-rose-100 text-center">
          <div className="w-24 h-24 mb-6">
            {/* Logo Placeholder */}
            <div className="bg-rose-200 border-4 border-dashed border-rose-300 rounded-full w-full h-full flex items-center justify-center">
              <span className="text-rose-600 text-4xl font-bold">A</span>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-rose-800 mb-4 leading-tight">
            AnnA
          </h1>
          <p className="text-rose-700 text-base leading-relaxed max-w-sm">
            Безопасность вашего аккаунта — наш приоритет.
          </p>
          
          {/* Illustration Placeholder */}
          <div className="mt-8 w-full max-w-xs">
            <div className="bg-rose-200 rounded-2xl w-full h-48 border-4 border-dashed border-rose-300 flex items-center justify-center">
              <Lock className="w-16 h-16 text-rose-600" />
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex flex-col justify-center p-8 md:p-10">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;