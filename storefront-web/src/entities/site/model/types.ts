export interface SiteBootstrap {
  siteName: string;
  siteUrl: string;
  siteNotice: string;
  siteKeywords: string;
  siteLogo: string;
  supportEmail: string;
  icpNo: string;
  cloudflareTurnstileEnabled: boolean;
  cloudflareTurnstileSiteKey: string;
}

let siteCache: SiteBootstrap | null = null;

export function getSiteCache() {
  return siteCache;
}

export function setSiteCache(value: SiteBootstrap) {
  siteCache = value;
}
