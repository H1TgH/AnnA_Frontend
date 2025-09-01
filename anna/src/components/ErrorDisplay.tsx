import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ErrorDisplayProps {
  error: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white rounded-2xl shadow-xl p-12 max-w-lg w-full text-center">
        <p className="text-red-500 text-lg">{error || 'Профиль не найден'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200"
        >
          Вернуться на главную
        </button>
      </div>
    </div>
  );
};

export default ErrorDisplay; 