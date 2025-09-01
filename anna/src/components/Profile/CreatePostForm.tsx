import React, { useCallback } from 'react';

interface CreatePostFormProps {
  isCreatingPost: boolean;
  isOwnProfile: boolean;
  newPost: {
    content: string;
    images: File[];
    imageUrls: string[];
  };
  postErrors: {
    content: string;
    images: string;
  };
  error: string | null;
  handleCreatePostToggle: () => void;
  handlePostChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  handlePostImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removePostImage: (index: number) => void;
  handleCreatePost: () => Promise<void>;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({
  isCreatingPost,
  isOwnProfile,
  newPost,
  postErrors,
  error,
  handleCreatePostToggle,
  handlePostChange,
  handlePostImagesChange,
  removePostImage,
  handleCreatePost,
}) => {
  if (!isCreatingPost || !isOwnProfile) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full m-4 animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Создать пост</h2>
          <button onClick={handleCreatePostToggle} className="text-gray-500 hover:text-gray-800 transition-colors">
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
        <div className="space-y-4">
          <div>
            <label htmlFor="content" className="text-gray-700 font-medium text-sm">
              Текст поста
            </label>
            <textarea
              id="content"
              name="content"
              value={newPost.content}
              onChange={handlePostChange}
              maxLength={500}
              placeholder="Что у вас нового? (до 500 символов)"
              className="w-full p-2 mt-1 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
              rows={4}
              aria-label="Текст поста"
            />
            {postErrors.content && <p className="text-red-500 text-sm mt-1">{postErrors.content}</p>}
          </div>
          <div>
            <label htmlFor="images" className="text-gray-700 font-medium text-sm">
              Изображения (до 10)
            </label>
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePostImagesChange}
              className="text-gray-700 text-sm mt-1"
              disabled={newPost.images.length >= 10}
              aria-label="Загрузить изображения для поста"
            />
            {postErrors.images && <p className="text-red-500 text-sm mt-1">{postErrors.images}</p>}
            {newPost.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {newPost.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Предпросмотр изображения ${index + 1}`}
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePostImage(index)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 text-xs hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                      aria-label={`Удалить изображение ${index + 1}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleCreatePostToggle}
            className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
          >
            Отмена
          </button>
          <button
            onClick={handleCreatePost}
            disabled={!newPost.content.trim() && newPost.images.length === 0}
            className="bg-rose-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:bg-gray-400"
          >
            Опубликовать
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostForm;