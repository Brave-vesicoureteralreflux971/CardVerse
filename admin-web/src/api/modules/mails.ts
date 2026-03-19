import type { MailTemplate } from '../../types';
import { api } from '../client';

export function listMailTemplates() {
  return api<MailTemplate[]>('/admin/mail-templates');
}

export function sendTestMail(payload: { toEmail: string; subject: string; content: string }) {
  return api('/admin/mail-templates/test-send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createMailTemplate(payload: unknown) {
  return api('/admin/mail-templates', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateMailTemplate(id: string, payload: unknown) {
  return api(`/admin/mail-templates/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function removeMailTemplate(id: string) {
  return api(`/admin/mail-templates/${id}`, { method: 'DELETE' });
}

export function retryMailLog(id: string) {
  return api(`/admin/mail-templates/logs/${id}/retry`, { method: 'POST' });
}
