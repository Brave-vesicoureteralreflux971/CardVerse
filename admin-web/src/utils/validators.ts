export function requireText(value: string | null | undefined, message: string) {
  if (!String(value ?? '').trim()) {
    throw new Error(message);
  }
}

export function requireSelection(value: string | number | null | undefined, message: string) {
  if (value === '' || value === null || value === undefined) {
    throw new Error(message);
  }
}

export function requirePositiveNumber(value: number | string | null | undefined, message: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(message);
  }
}

export function requireEmail(value: string | null | undefined, message: string) {
  requireText(value, message);
  const email = String(value).trim();
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email)) {
    throw new Error(message);
  }
}

export function requireJsonText(value: string | null | undefined, message: string) {
  requireText(value, message);
  try {
    JSON.parse(String(value));
  } catch {
    throw new Error(message);
  }
}
