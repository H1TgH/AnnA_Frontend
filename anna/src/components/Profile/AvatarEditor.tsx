import React, { useCallback } from 'react';

interface AvatarEditorProps {
  isEditingAvatar: boolean;
  isOwnProfile: boolean;
  avatarFile: File | null;
  error: string | null;
  handleAvatarEditToggle: () => void;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAvatarSave: () => Promise<void>;
}

const AvatarEditor: React.FC<AvatarEditorProps> = ({
  isEditingAvatar,
  isOwnProfile,
  avatarFile,
  error,
  handleAvatarEditToggle,
  handleAvatarChange,
  handleAvatarSave,
}) => {
  if (!isEditingAvatar || !isOwnProfile) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full m-4 animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Изменить аватар</h2>
          <button onClick={handleAvatarEditToggle} className="text-gray-500 hover:text-gray-800 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex flex-col gap-1">
          <label htmlFor="avatar" className="text-gray-700 font-medium text-sm">
            Новый аватар
          </label>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="text-gray-700 text-sm"
          />
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleAvatarEditToggle}
            className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
          >
            Отмена
          </button>
          <button
            onClick={handleAvatarSave}
            disabled={!avatarFile}
            className="bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:bg-gray-400"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarEditor;