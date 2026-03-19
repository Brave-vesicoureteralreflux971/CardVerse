import { api } from '../client';

export function loginAdmin(payload: { username: string; password: string }) {
  return api<{ token: string }>('/admin/auth/login', { method: 'POST', body: JSON.stringify(payload) });
}

export function getAdminProfile() {
  return api<Record<string, unknown>>('/admin/auth/profile');
}
