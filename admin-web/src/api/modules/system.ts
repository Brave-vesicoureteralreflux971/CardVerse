import type { SystemConfig, SystemConfigInput } from '../../types';
import { api } from '../client';

export function listSystemConfigs() {
  return api<SystemConfig[]>('/admin/system/configs');
}

export function saveSystemConfig(payload: SystemConfigInput) {
  return api('/admin/system/configs', { method: 'POST', body: JSON.stringify(payload) });
}

export function saveSystemConfigBatch(items: SystemConfigInput[]) {
  return api<SystemConfig[]>('/admin/system/configs/batch', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}
