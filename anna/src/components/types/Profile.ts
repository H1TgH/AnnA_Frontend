export interface UserProfile {
  id: string;
  name: string;
  surname: string;
  email: string;
  birthday: string;
  gender: string | null;
  avatar_url: string | null;
  status: string | null;
}

export interface Comment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  replies: Comment[];
}

export interface Post {
  id: string;
  text: string | null;
  images: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  comments: Comment[];
  likes: string[];
  is_liked?: boolean;
}

export const calculateAge = (birthday: string): number => {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};