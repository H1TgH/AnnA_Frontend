import { calculateAge } from '../components/types/Profile';

export const validateProfileForm = (formData: {
  name: string;
  surname: string;
  status: string;
  birthday: string;
}) => {
  const errors: { [key: string]: string } = {};
  let isValid = true;

  if (!formData.name.trim()) {
    errors.name = 'Имя обязательно';
    isValid = false;
  } else if (formData.name.length > 50) {
    errors.name = 'Имя не должно превышать 50 символов';
    isValid = false;
  }

  if (!formData.surname.trim()) {
    errors.surname = 'Фамилия обязательна';
    isValid = false;
  } else if (formData.surname.length > 50) {
    errors.surname = 'Фамилия не должна превышать 50 символов';
    isValid = false;
  }

  if (formData.status.length > 200) {
    errors.status = 'Статус не должен превышать 200 символов';
    isValid = false;
  }

  if (!formData.birthday) {
    errors.birthday = 'Дата рождения обязательна';
    isValid = false;
  } else {
    const age = calculateAge(formData.birthday);
    if (age < 13) {
      errors.birthday = 'Пользователь должен быть старше 13 лет';
      isValid = false;
    }
  }

  return { errors, isValid };
};

export const validatePost = (content: string, images: File[]) => {
  const errors: { [key: string]: string } = {};
  let isValid = true;

  if (content.length > 500) {
    errors.content = 'Текст не должен превышать 500 символов';
    isValid = false;
  }

  if (images.length > 10) {
    errors.images = 'Максимум 10 изображений';
    isValid = false;
  }

  if (!content.trim() && images.length === 0) {
    errors.content = 'Добавьте текст или изображения';
    isValid = false;
  }

  return { errors, isValid };
};

export const validateComment = (text: string) => {
  if (!text.trim()) return 'Комментарий не может быть пустым';
  if (text.length > 200) return 'Комментарий не должен превышать 200 символов';
  return '';
}; 