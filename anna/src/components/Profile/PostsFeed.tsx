import React from 'react';
import { Post, UserProfile, formatDate } from '../types/Profile';

interface PostsFeedProps {
  posts: Post[];
  profile: UserProfile;
  user: UserProfile | null;
  currentImageIndices: { [postId: string]: number };
  visibleComments: { [postId: string]: number };
  commentInputs: { [postId: string]: string };
  replyInputs: { [commentId: string]: string };
  replyFormVisible: { [commentId: string]: boolean };
  commentErrors: { [postId: string]: string };
  replyErrors: { [commentId: string]: string };
  handleLikePost: (postId: string) => Promise<void>;
  handleCommentChange: (postId: string, value: string) => void;
  handleReplyChange: (commentId: string, value: string) => void;
  toggleReplyForm: (commentId: string) => void;
  toggleComments: (postId: string) => Promise<void>;
  loadMoreComments: (postId: string) => void;
  handlePrevPostImage: (postId: string) => void;
  handleNextPostImage: (postId: string) => void;
  handleImageClick: (imageUrl: string, index: number) => void;
  handleAddComment: (postId: string) => Promise<void>;
  handleAddReply: (postId: string, commentId: string) => Promise<void>;
  allPhotos: string[];
  setCurrentImageIndices: (indices: { [postId: string]: number }) => void;
}

const PostsFeed: React.FC<PostsFeedProps> = ({
  posts,
  profile,
  user,
  currentImageIndices,
  visibleComments,
  commentInputs,
  replyInputs,
  replyFormVisible,
  commentErrors,
  replyErrors,
  handleLikePost,
  handleCommentChange,
  handleReplyChange,
  toggleReplyForm,
  toggleComments,
  loadMoreComments,
  handlePrevPostImage,
  handleNextPostImage,
  handleImageClick,
  handleAddComment,
  handleAddReply,
  allPhotos,
  setCurrentImageIndices,
}) => {
  return (
    <div className="px-8 pb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        Посты
      </h2>
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 text-lg">Постов пока нет</p>
          <p className="text-gray-500 text-sm mt-2">Будьте первым, кто поделится чем-то интересным!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 animate-fade-in shadow-sm hover:shadow-md transition-all duration-300"
              role="article"
              aria-label={`Пост от ${formatDate(post.created_at)}`}
            >
              {post.text && (
                <p className="text-gray-800 mb-4 text-lg leading-relaxed">{post.text}</p>
              )}
              
              {post.images.length > 0 && (
                <div className="relative mb-4 group">
                  <img
                    src={post.images[currentImageIndices[post.id] || 0]}
                    alt={`Пост ${post.id} изображение ${(currentImageIndices[post.id] || 0) + 1}`}
                    className="w-full max-h-96 object-cover rounded-xl cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                    onClick={() => handleImageClick(post.images[currentImageIndices[post.id] || 0], allPhotos.indexOf(post.images[currentImageIndices[post.id] || 0]))}
                    role="button"
                    aria-label={`Открыть изображение поста ${post.id}`}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleImageClick(post.images[currentImageIndices[post.id] || 0], allPhotos.indexOf(post.images[currentImageIndices[post.id] || 0]))}
                  />
                  
                  {post.images.length > 1 && (
                    <>
                      <button
                        onClick={() => handlePrevPostImage(post.id)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 text-gray-700 p-2 rounded-full hover:bg-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 opacity-0 group-hover:opacity-100"
                        aria-label="Предыдущее изображение"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleNextPostImage(post.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 text-gray-700 p-2 rounded-full hover:bg-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 opacity-0 group-hover:opacity-100"
                        aria-label="Следующее изображение"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
                        {`${(currentImageIndices[post.id] || 0) + 1}/${post.images.length}`}
                      </div>
                      
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        {post.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndices({ ...currentImageIndices, [post.id]: index })}
                            className={`w-3 h-3 rounded-full transition-all duration-200 ${
                              index === (currentImageIndices[post.id] || 0) 
                                ? 'bg-white scale-125' 
                                : 'bg-white/50 hover:bg-white/80'
                            }`}
                            aria-label={`Перейти к изображению ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDate(post.created_at)}
                </span>
              </div>
              
              <div className="flex items-center gap-6 border-t border-gray-100 pt-4">
                <button
                  onClick={() => handleLikePost(post.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 ${
                    !user 
                      ? 'opacity-50 cursor-not-allowed text-gray-400' 
                      : post.is_liked || (post.likes && post.likes.includes(user?.id || ''))
                        ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' 
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  disabled={!user}
                  aria-label="Лайкнуть пост"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 transition-transform duration-200 ${
                      post.is_liked || (post.likes && post.likes.includes(user?.id || '')) ? 'scale-110' : ''
                    }`}
                    fill={post.is_liked || (post.likes && post.likes.includes(user?.id || '')) ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={post.is_liked || (post.likes && post.likes.includes(user?.id || '')) ? 0 : 2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="font-medium">{post.likes_count}</span>
                </button>
                
                <button
                  onClick={() => toggleComments(post.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200 ${
                    visibleComments[post.id] > 0 
                      ? 'text-rose-600 bg-rose-50' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label={visibleComments[post.id] > 0 ? 'Скрыть комментарии' : 'Показать комментарии'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="font-medium">{post.comments_count}</span>
                </button>
              </div>
              
              {visibleComments[post.id] > 0 && (
                <div className="mt-6 animate-fade-in border-t border-gray-100 pt-6">
                  {post.comments && post.comments.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Комментарии ({post.comments.length})
                      </h4>
                      
                      {post.comments.slice(0, visibleComments[post.id]).map((comment) => (
                        <div key={comment.id} className="animate-fade-in bg-gray-50 rounded-xl p-4" role="comment">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                                  <span className="text-rose-600 font-semibold text-sm">
                                    {comment.user_id === profile.id ? profile.name.charAt(0) : comment.user_id.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-gray-800 font-medium">
                                    {comment.user_id === profile.id ? `${profile.name} ${profile.surname}` : `Пользователь ${comment.user_id}`}
                                  </p>
                                  <p className="text-gray-500 text-xs">{formatDate(comment.created_at)}</p>
                                </div>
                              </div>
                              
                              <p className="text-gray-700 ml-11">{comment.text}</p>
                              
                              {user && (
                                <button
                                  onClick={() => toggleReplyForm(comment.id)}
                                  className="text-rose-600 text-sm hover:text-rose-700 hover:underline focus:outline-none focus:ring-2 focus:ring-rose-200 ml-11 mt-2 transition-colors duration-200"
                                  aria-label={`Ответить на комментарий ${comment.user_id}`}
                                >
                                  Ответить
                                </button>
                              )}
                              
                              {replyFormVisible[comment.id] && user && (
                                <div className="mt-3 ml-11 animate-scale-in">
                                  <textarea
                                    value={replyInputs[comment.id] || ''}
                                    onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                                    placeholder="Написать ответ..."
                                    className="w-full p-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100 resize-none transition-all duration-200"
                                    rows={2}
                                    maxLength={200}
                                    aria-label="Поле для ответа на комментарий"
                                  />
                                  {replyErrors[comment.id] && (
                                    <p className="text-red-500 text-sm mt-2">{replyErrors[comment.id]}</p>
                                  )}
                                  <div className="flex justify-end gap-3 mt-3">
                                    <button
                                      onClick={() => toggleReplyForm(comment.id)}
                                      className="text-gray-600 text-sm hover:text-gray-800 hover:underline focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors duration-200"
                                    >
                                      Отмена
                                    </button>
                                    <button
                                      onClick={() => handleAddReply(post.id, comment.id)}
                                      className="bg-rose-600 text-white text-sm py-2 px-4 rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={!replyInputs[comment.id]?.trim()}
                                    >
                                      Отправить
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              {comment.replies && comment.replies.length > 0 && (
                                <div className="ml-11 mt-3 space-y-3">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="animate-fade-in bg-white rounded-lg p-3 border border-gray-200" role="comment">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                          <span className="text-gray-600 font-semibold text-xs">
                                            {reply.user_id === profile.id ? profile.name.charAt(0) : reply.user_id.charAt(0)}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="text-gray-800 font-medium text-sm">
                                            {reply.user_id === profile.id ? `${profile.name} ${profile.surname}` : `Пользователь ${reply.user_id}`}
                                          </p>
                                          <p className="text-gray-500 text-xs">{formatDate(reply.created_at)}</p>
                                        </div>
                                      </div>
                                      <p className="text-gray-700 text-sm ml-8">{reply.text}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {post.comments && post.comments.length > visibleComments[post.id] && (
                        <button
                          onClick={() => loadMoreComments(post.id)}
                          className="w-full text-rose-600 text-sm hover:text-rose-700 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200 mt-4 py-3 rounded-lg border border-rose-200 transition-all duration-200"
                          aria-label="Показать больше комментариев"
                        >
                          Показать еще ({post.comments.length - visibleComments[post.id]}) комментариев
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-gray-600">Комментариев пока нет</p>
                      <p className="text-gray-500 text-sm mt-1">Будьте первым, кто оставит комментарий!</p>
                    </div>
                  )}
                  
                  {user && (
                    <div className="mt-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-rose-600 font-semibold">
                            {user.name ? user.name.charAt(0) : 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => handleCommentChange(post.id, e.target.value)}
                            placeholder="Написать комментарий..."
                            className="w-full p-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100 resize-none transition-all duration-200"
                            rows={3}
                            maxLength={200}
                            aria-label="Поле для комментария к посту"
                          />
                          {commentErrors[post.id] && (
                            <p className="text-red-500 text-sm mt-2">{commentErrors[post.id]}</p>
                          )}
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-gray-500 text-sm">
                              {commentInputs[post.id]?.length || 0}/200
                            </span>
                            <button
                              onClick={() => handleAddComment(post.id)}
                              className="bg-rose-600 text-white text-sm py-2 px-6 rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              disabled={!commentInputs[post.id]?.trim()}
                              aria-label="Отправить комментарий"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              Отправить
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostsFeed;