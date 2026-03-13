// Prefer Vite proxy in dev (relative `/api`). Allow override for deployments.
const API_URL = (import.meta as any).env?.VITE_API_URL ?? '/api';

export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

function authHeaders() {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return headers as Record<string, string>;
}

export const register = async (payload: { name: string; email: string; password: string }): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to register');
  return response.json();
};

export const login = async (payload: { email: string; password: string }): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to login');
  return response.json();
};

export const me = async (): Promise<{ user: AuthUser }> => {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error('Not authenticated');
  return response.json();
};

export const fetchPosts = async (): Promise<Post[]> => {
  const response = await fetch(`${API_URL}/posts`);
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
};

export const fetchPost = async (id: string): Promise<Post> => {
  const response = await fetch(`${API_URL}/posts/${id}`);
  if (!response.ok) throw new Error('Post not found');
  return response.json();
};

export const createPost = async (post: { title: string; content: string }): Promise<Post> => {
  const response = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(post),
  });
  if (!response.ok) throw new Error('Failed to create post');
  return response.json();
};

export const updatePost = async (id: string, post: { title: string; content: string }): Promise<Post> => {
  const response = await fetch(`${API_URL}/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(post),
  });
  if (!response.ok) throw new Error('Failed to update post');
  return response.json();
};

export const deletePost = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/posts/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error('Failed to delete post');
};
