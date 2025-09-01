import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center animate-bounce-in">
        {/* Иконка ошибки */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        
        {/* Заголовок */}
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Произошла ошибка</h1>
        
        {/* Описание ошибки */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {error}
        </p>
        
        {/* Кнопка обновления */}
        <button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-2xl hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-200 shadow-lg hover:shadow-xl font-semibold flex items-center gap-3 mx-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Обновить страницу
        </button>
        
        {/* Дополнительная помощь */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Если проблема повторяется:</p>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            <p>• Проверьте подключение к интернету</p>
            <p>• Попробуйте обновить страницу</p>
            <p>• Обратитесь в службу поддержки</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay; 