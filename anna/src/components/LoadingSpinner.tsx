import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center">
      <div className="text-center">
        {/* Анимированный спиннер */}
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-rose-200 rounded-full animate-spin">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-rose-600 rounded-full animate-spin"></div>
          </div>
          
          {/* Центральная иконка */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-rose-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        
        {/* Текст загрузки */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Загрузка</h2>
        <p className="text-gray-600 mb-4">Пожалуйста, подождите...</p>
        
        {/* Анимированные точки */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-rose-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* Дополнительная информация */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Подготавливаем ваш профиль</p>
          <p className="mt-1">Это может занять несколько секунд</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 