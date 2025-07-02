import { useState, useEffect } from "react";

type ConfirmationStatus = 'success' | 'failure' | 'loading';

const EmailConfirmationStatusPage: React.FC = () => {
  const [status, setStatus] = useState<ConfirmationStatus>('loading');
  const [message, setMessage] = useState<string>('Проверяем статус подтверждения...');

  useEffect(() => {
  const token = new URLSearchParams(window.location.search).get("token");

  if (token) {
    fetch(`http://localhost:8000/api/v1/public/confirm-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        alert(data.message); // покажи "Email confirmed"
      })
      .catch(() => {
        alert("Invalid or expired token");
      });
  }
}, []);

  const handleGoToAuthPage = () => {
    // In a Next.js app, you would use useRouter().push('/')
    // For this example, we simulate a redirect to the root path
    window.location.href = '/'; 
  };

  const icon = status === 'success' ? (
    <svg className="w-16 h-16 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  ) : status === 'failure' ? (
    <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  ) : (
    <svg className="animate-spin w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004 12c0 2.972 1.153 5.726 3.097 7.747L9 19m4-4a5 5 0 00-5 5v1m7-11l-2 2m2-2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  );

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
        <div className="flex flex-col justify-center p-6 text-center">
          <div className="flex flex-col items-center justify-center mb-6">
            {icon}
          </div>
          <h2 className={`text-3xl font-bold mb-4 ${status === 'success' ? 'text-rose-800' : status === 'failure' ? 'text-red-600' : 'text-gray-700'}`}>
            {status === 'success' ? 'Подтверждение успешно!' : status === 'failure' ? 'Ошибка подтверждения' : 'Пожалуйста, подождите...'}
          </h2>
          <p className="text-gray-600 text-base mb-8">
            {message}
          </p>
          <button
            onClick={handleGoToAuthPage}
            className="bg-rose-600 text-white font-bold py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 w-full"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationStatusPage;
