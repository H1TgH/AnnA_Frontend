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
        className="bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-rose-200"
        aria-label="Создать новый пост"
      >
        Создать пост
      </button>
    </div>
  );
};

export default CreatePostButton; 