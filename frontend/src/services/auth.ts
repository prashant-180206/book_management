import { apiRequest } from './api';

export type User = { id: number; email: string; role: 'admin' | 'reader' };
export type Session = { access_token: string; user: User };

export function login(email: string, password: string) {
  return apiRequest<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}
