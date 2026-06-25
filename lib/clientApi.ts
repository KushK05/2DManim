'use client';

export type User = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  credits: number;
  plan: 'free' | 'pro' | 'unlimited';
  createdAt: string;
  updatedAt: string;
};

export type Generation = {
  id: string;
  _id: string;
  prompt: string;
  model: string;
  status: string;
  manimCode: string | null;
  videoUrl: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  chatId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  jobId?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('accessToken');
}

export function setTokens(auth: AuthResponse) {
  window.localStorage.setItem('accessToken', auth.accessToken);
  window.localStorage.setItem('refreshToken', auth.refreshToken);
}

export function clearTokens() {
  window.localStorage.removeItem('accessToken');
  window.localStorage.removeItem('refreshToken');
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }

  return data as T;
}
