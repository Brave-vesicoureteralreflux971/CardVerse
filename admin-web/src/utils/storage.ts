export const STORAGE_KEYS = {
  token: 'CardVerse-admin-token',
  login: 'CardVerse-admin-login',
  theme: 'CardVerse-admin-theme',
} as const

export function getStorage(key: string) {
  return localStorage.getItem(key)
}

export function setStorage(key: string, value: string) {
  localStorage.setItem(key, value)
}

export function removeStorage(key: string) {
  localStorage.removeItem(key)
}
