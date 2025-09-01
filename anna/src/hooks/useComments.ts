import { useState, useCallback } from 'react';

export const useComments = () => {
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});
  const [replyFormVisible, setReplyFormVisible] = useState<{ [commentId: string]: boolean }>({});
  const [commentErrors, setCommentErrors] = useState<{ [postId: string]: string }>({});
  const [replyErrors, setReplyErrors] = useState<{ [commentId: string]: string }>({});
  const [visibleComments, setVisibleComments] = useState<{ [postId: string]: number }>({});

  const setCommentInput = useCallback((postId: string, value: string) => {
    setCommentInputs((prev: { [postId: string]: string }) => ({ ...prev, [postId]: value }));
    setCommentErrors((prev: { [postId: string]: string }) => ({ ...prev, [postId]: '' }));
  }, []);

  const setReplyInput = useCallback((commentId: string, value: string) => {
    setReplyInputs((prev: { [commentId: string]: string }) => ({ ...prev, [commentId]: value }));
    setReplyErrors((prev: { [commentId: string]: string }) => ({ ...prev, [commentId]: '' }));
  }, []);

  const toggleReplyForm = useCallback((commentId: string) => {
    setReplyFormVisible((prev: { [commentId: string]: boolean }) => ({ ...prev, [commentId]: !prev[commentId] }));
    setReplyInputs((prev: { [commentId: string]: string }) => ({ ...prev, [commentId]: '' }));
    setReplyErrors((prev: { [commentId: string]: string }) => ({ ...prev, [commentId]: '' }));
  }, []);

  const toggleComments = useCallback((postId: string) => {
    setVisibleComments((prev: { [postId: string]: number }) => ({
      ...prev,
      [postId]: prev[postId] === undefined || prev[postId] === 0 ? 3 : 0,
    }));
  }, []);

  const loadMoreComments = useCallback((postId: string) => {
    setVisibleComments((prev: { [postId: string]: number }) => ({
      ...prev,
      [postId]: (prev[postId] || 3) + 3,
    }));
  }, []);

  const clearCommentInput = useCallback((postId: string) => {
    setCommentInputs((prev: { [postId: string]: string }) => ({ ...prev, [postId]: '' }));
    setCommentErrors((prev: { [postId: string]: string }) => ({ ...prev, [postId]: '' }));
  }, []);

  const clearReplyInput = useCallback((commentId: string) => {
    setReplyInputs((prev: { [commentId: string]: string }) => ({ ...prev, [commentId]: '' }));
    setReplyErrors((prev: { [commentId: string]: string }) => ({ ...prev, [commentId]: '' }));
  }, []);

  return {
    commentInputs,
    replyInputs,
    replyFormVisible,
    commentErrors,
    replyErrors,
    visibleComments,
    setCommentInput,
    setReplyInput,
    toggleReplyForm,
    toggleComments,
    loadMoreComments,
    clearCommentInput,
    clearReplyInput,
    setCommentErrors,
    setReplyErrors,
    setVisibleComments,
  };
}; 