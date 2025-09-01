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
  toggleComments: (postId: string) => void;
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
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Посты</h2>
      {posts.length === 0 ? (
        <p className="text-gray-600">Постов пока нет</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border-2 border-gray-200 rounded-2xl p-6 animate-fade-in"
              role="article"
              aria-label={`Пост от ${formatDate(post.created_at)}`}
            >
              {post.text && <p className="text-gray-800 mb-4">{post.text}</p>}
              {post.images.length > 0 && (
                <div className="relative">
                  <img
                    src={post.images[currentImageIndices[post.id] || 0]}
                    alt={`Пост ${post.id} изображение ${currentImageIndices[post.id] || 0 + 1}`}
                    className="w-full max-h-96 object-cover rounded-lg cursor-pointer"
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
                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-rose-600 text-white p-2 rounded-full hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
                        aria-label="Предыдущее изображение"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleNextPostImage(post.id)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-rose-600 text-white p-2 rounded-full hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
                        aria-label="Следующее изображение"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
                        {`${(currentImageIndices[post.id] || 0) + 1}/${post.images.length}`}
                      </div>
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        {post.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndices({ ...currentImageIndices, [post.id]: index })}
                            className={`w-2 h-2 rounded-full ${index === (currentImageIndices[post.id] || 0) ? 'bg-rose-600' : 'bg-gray-400'}`}
                            aria-label={`Перейти к изображению ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <p className="text-gray-500 text-sm mt-4">{formatDate(post.created_at)}</p>
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={() => handleLikePost(post.id)}
                  className={`flex items-center gap-2 text-rose-600 hover:bg-rose-100 p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!user}
                  aria-label="Лайкнуть пост"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill={post.likes.includes(user?.id || '') ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>{post.likes_count}</span>
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
                  aria-label={visibleComments[post.id] ? 'Скрыть комментарии' : 'Показать комментарии'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5v-2a2 2 0 012-2h10a2 2 0 012 2v2h-4m-6 0h6"
                    />
                  </svg>
                  <span>{post.comments_count}</span>
                </button>
              </div>
              {visibleComments[post.id] > 0 && (
                <div className="mt-4 animate-fade-in">
                  {post.comments.length > 0 ? (
                    <div className="space-y-4">
                      {post.comments.slice(0, visibleComments[post.id]).map((comment) => (
                        <div key={comment.id} className="animate-fade-in" role="comment">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <p className="text-gray-800 font-medium">
                                {comment.user_id === profile.id ? `${profile.name} ${profile.surname}` : comment.user_id}
                              </p>
                              <p className="text-gray-600">{comment.text}</p>
                              <p className="text-gray-500 text-sm">{formatDate(comment.created_at)}</p>
                              {user && (
                                <button
                                  onClick={() => toggleReplyForm(comment.id)}
                                  className="text-rose-600 text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-rose-200"
                                  aria-label={`Ответить на комментарий ${comment.user_id}`}
                                >
                                  Ответить
                                </button>
                              )}
                              {replyFormVisible[comment.id] && user && (
                                <div className="mt-2 ml-6 animate-scale-in">
                                  <textarea
                                    value={replyInputs[comment.id] || ''}
                                    onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                                    placeholder={`Ответить...`}
                                    className="w-full p-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                                    rows={2}
                                    maxLength={200}
                                    aria-label={`Поле для ответа на комментарий`}
                                  />
                                  {replyErrors[comment.id] && (
                                    <p className="text-red-500 text-sm mt-1">{replyErrors[comment.id]}</p>
                                  )}
                                  <div className="flex justify-end gap-2 mt-2">
                                    <button
                                      onClick={() => toggleReplyForm(comment.id)}
                                      className="text-gray-600 text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-gray-200"
                                    >
                                      Отмена
                                    </button>
                                    <button
                                      onClick={() => handleAddReply(post.id, comment.id)}
                                      className="bg-rose-600 text-white text-sm py-1 px-3 rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                                      disabled={!replyInputs[comment.id]?.trim()}
                                    >
                                      Отправить
                                    </button>
                                  </div>
                                </div>
                              )}
                              {comment.replies.length > 0 && (
                                <div className="ml-6 mt-2 space-y-2">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="animate-fade-in" role="comment">
                                      <p className="text-gray-800 font-medium">
                                        {reply.user_id === profile.id ? `${profile.name} ${profile.surname}` : reply.user_id}
                                      </p>
                                      <p className="text-gray-600">{reply.text}</p>
                                      <p className="text-gray-500 text-sm">{formatDate(reply.created_at)}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {post.comments.length > visibleComments[post.id] && (
                        <button
                          onClick={() => loadMoreComments(post.id)}
                          className="text-rose-600 text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-rose-200 mt-2"
                          aria-label="Показать больше комментариев"
                        >
                          Показать еще ({post.comments.length - visibleComments[post.id]})
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">Комментариев пока нет</p>
                  )}
                  {user && (
                    <div className="mt-4">
                      <textarea
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                        placeholder="Написать комментарий..."
                        className="w-full p-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:border-rose-300 focus:ring-rose-100"
                        rows={2}
                        maxLength={200}
                        aria-label="Поле для комментария к посту"
                      />
                      {commentErrors[post.id] && (
                        <p className="text-red-500 text-sm mt-1">{commentErrors[post.id]}</p>
                      )}
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="bg-rose-600 text-white text-sm py-1 px-3 rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                          disabled={!commentInputs[post.id]?.trim()}
                          aria-label="Отправить комментарий"
                        >
                          Отправить
                        </button>
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