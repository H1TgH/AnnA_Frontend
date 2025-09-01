import React, { useCallback } from 'react';

interface ProfileEditorProps {
  isEditingProfile: boolean;
  isOwnProfile: boolean;
  formData: {
    name: string;
    surname: string;
    status: string;
    birthday: string;
    gender: string;
  };
  formErrors: {
    name: string;
    surname: string;
    status: string;
    birthday: string;
  };
  error: string | null;
  handleProfileEditToggle: () => void;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleProfileSave: () => Promise<void>;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({
  isEditingProfile,
  isOwnProfile,
  formData,
  formErrors,
  error,
  handleProfileEditToggle,
  handleFormChange,
  handleProfileSave,
}) => {
  if (!isEditingProfile || !isOwnProfile) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full m-4 animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Редактировать профиль</h2>
          <button onClick={handleProfileEditToggle} className="text-gray-500 hover:text-gray-800 transition-colors">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="text-gray-700 font-medium text-sm">
              Имя
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleFormChange}
              className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
            />
            {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="surname" className="text-gray-700 font-medium text-sm">
              Фамилия
            </label>
            <input
              id="surname"
              name="surname"
              type="text"
              value={formData.surname}
              onChange={handleFormChange}
              className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
            />
            {formErrors.surname && <p className="text-red-500 text-sm mt-1">{formErrors.surname}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="status" className="text-gray-700 font-medium text-sm">
              Статус
            </label>
            <textarea
              id="status"
              name="status"
              value={formData.status}
              onChange={handleFormChange}
              maxLength={200}
              placeholder="Ваш статус (до 200 символов)"
              className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
            />
            {formErrors.status && <p className="text-red-500 text-sm mt-1">{formErrors.status}</p>}
          </div>
          <div>
            <label htmlFor="birthday" className="text-gray-700 font-medium text-sm">
              Дата рождения
            </label>
            <input
              id="birthday"
              name="birthday"
              type="date"
              value={formData.birthday}
              onChange={handleFormChange}
              className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
            />
            {formErrors.birthday && <p className="text-red-500 text-sm mt-1">{formErrors.birthday}</p>}
          </div>
          <div>
            <label htmlFor="gender" className="text-gray-700 font-medium text-sm">
              Пол
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleFormChange}
              className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
            >
              <option value="">Не указан</option>
              <option value="MALE">Мужской</option>
              <option value="FEMALE">Женский</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleProfileEditToggle}
            className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
          >
            Отмена
          </button>
          <button
            onClick={handleProfileSave}
            className="bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;