import type { SiteBootstrap } from '@/entities/site/model/types'

export function applySiteDocumentMeta(site: SiteBootstrap) {
  if (typeof document === 'undefined') {
    return
  }

  document.title = site.siteName || 'CardVerse Store'

  let keywordsMeta = document.querySelector('meta[name="keywords"]')
  if (!keywordsMeta) {
    keywordsMeta = document.createElement('meta')
    keywordsMeta.setAttribute('name', 'keywords')
    document.head.appendChild(keywordsMeta)
  }

  keywordsMeta.setAttribute('content', site.siteKeywords || '')
}
