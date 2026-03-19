import type { Card } from '../../types';
import { api } from '../client';

export function listCards(query = '') {
  return api<Card[]>(`/admin/cards${query}`);
}

export function importCards(payload: unknown) {
  return api('/admin/cards/import', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateCard(id: string, payload: { cardSecret: string; status?: string }) {
  return api<Card>(`/admin/cards/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function removeCard(id: string) {
  return api(`/admin/cards/${id}`, { method: 'DELETE' });
}

export function batchDeleteCards(cardIds: string[]) {
  return api('/admin/cards/batch-delete', {
    method: 'POST',
    body: JSON.stringify({ cardIds }),
  });
}

export function patchCardStatus(id: string, status: string) {
  return api(`/admin/cards/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}
