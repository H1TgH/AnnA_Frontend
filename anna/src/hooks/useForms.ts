import { useState, useCallback } from 'react';

export const useProfileForm = (initialData: any) => {
  const [formData, setFormData] = useState(initialData);
  const [formErrors, setFormErrors] = useState({
    name: '',
    surname: '',
    status: '',
    birthday: '',
  });

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    setFormErrors((prev: any) => ({ ...prev, [name]: '' }));
  }, []);

  const resetForm = useCallback((data: any) => {
    setFormData(data);
    setFormErrors({ name: '', surname: '', status: '', birthday: '' });
  }, []);

  return {
    formData,
    formErrors,
    setFormData,
    setFormErrors,
    handleFormChange,
    resetForm,
  };
};

export const usePostForm = () => {
  const [newPost, setNewPost] = useState({
    content: '',
    images: [] as File[],
    imageUrls: [] as string[],
  });
  const [postErrors, setPostErrors] = useState({
    content: '',
    images: '',
  });

  const handlePostChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPost((prev) => ({ ...prev, [name]: value }));
    setPostErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const resetPostForm = useCallback(() => {
    setNewPost({ content: '', images: [], imageUrls: [] });
    setPostErrors({ content: '', images: '' });
  }, []);

  return {
    newPost,
    postErrors,
    setNewPost,
    setPostErrors,
    handlePostChange,
    resetPostForm,
  };
}; 