import React from 'react';

interface CreatePostButtonProps {
  isOwnProfile: boolean;
  onClick: () => void;
}

const CreatePostButton: React.FC<CreatePostButtonProps> = ({ isOwnProfile, onClick }) => {
  if (!isOwnProfile) return null;

  return (
    <div className="px-8 pb-8">
      <button
        onClick={onClick}
        className="group bg-gradient-to-r from-rose-600 to-rose-700 text-white font-semibold py-4 px-8 rounded-2xl hover:from-rose-700 hover:to-rose-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-rose-200 shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto"
        aria-label="Создать новый пост"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Создать пост
      </button>
    </div>
  );
};

export default CreatePostButton; 