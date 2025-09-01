const API_BASE = 'http://localhost:8000/api/v1';

export const api = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Ошибка запроса');
    return data;
  },

  async post(endpoint: string, body?: any) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Ошибка запроса');
    return data;
  },

  async patch(endpoint: string, body: any) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Ошибка запроса');
    return data;
  },

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Ошибка запроса');
    return data;
  },

  async uploadFile(uploadUrl: string, file: File) {
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
    });
  },
};

export const endpoints = {
  users: {
    profile: (id: string) => `/users/${id}`,
    me: '/users/me',
    avatar: {
      uploadUrl: '/users/avatar/upload-url',
      save: '/users/avatar',
    },
  },
  posts: {
    userPosts: (id: string) => `/posts/${id}?limit=10`,
    create: '/posts',
    like: (id: string) => `/posts/like/${id}`,
    comment: (id: string) => `/posts/comment/${id}`,
    uploadUrl: '/posts/upload-url',
  },
}; 