import React from 'react';

interface CreatePostFormProps {
  isCreatingPost: boolean;
  isOwnProfile: boolean;
  newPost: any;
  postErrors: any;
  error: string | null;
  handleCreatePostToggle: () => void;
  handlePostChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handlePostImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full m-4 animate-scale-in">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Создать пост
          </h2>
          <button 
            onClick={handleCreatePostToggle} 
            className="text-gray-500 hover:text-gray-800 transition-colors p-2 hover:bg-gray-100 rounded-full"
            aria-label="Закрыть форму создания поста"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}
        
        <div className="space-y-6">
          <div>
            <label htmlFor="post-content" className="block text-lg font-semibold text-gray-800 mb-3">
              Что у вас нового?
            </label>
            <textarea
              id="post-content"
              value={newPost.content}
              onChange={handlePostChange}
              placeholder="Поделитесь своими мыслями, новостями или просто тем, что вас вдохновляет..."
              className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:border-rose-300 focus:ring-rose-100 resize-none transition-all duration-200 text-lg leading-relaxed"
              rows={6}
              maxLength={1000}
              aria-label="Содержание поста"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-500 text-sm">
                {newPost.content.length}/1000 символов
              </span>
              {postErrors.content && (
                <p className="text-red-500 text-sm">{postErrors.content}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Добавить изображения
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-rose-400 transition-colors duration-200">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePostImagesChange}
                className="hidden"
                id="post-images"
                aria-label="Выбрать изображения для поста"
              />
              <label htmlFor="post-images" className="cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 text-lg mb-2">Нажмите для выбора изображений</p>
                <p className="text-gray-500 text-sm">или перетащите их сюда</p>
              </label>
            </div>
            
            {postErrors.images && (
              <p className="text-red-500 text-sm mt-2">{postErrors.images}</p>
            )}
          </div>
          
          {newPost.images.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Выбранные изображения:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {newPost.images.map((file: File, index: number) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Изображение ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => removePostImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                      aria-label={`Удалить изображение ${index + 1}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleCreatePostToggle}
              className="px-8 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
            >
              Отмена
            </button>
            <button
              onClick={handleCreatePost}
              className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-8 py-3 rounded-xl hover:from-rose-700 hover:to-rose-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={!newPost.content.trim() && newPost.images.length === 0}
              aria-label="Опубликовать пост"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Опубликовать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostForm;