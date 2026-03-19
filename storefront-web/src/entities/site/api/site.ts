import { api } from '@/shared/api/client';
import type { SiteBootstrap } from '../model/types';

export function fetchSiteBootstrap() {
  return api<SiteBootstrap>('/site/bootstrap');
}

