export type UnauthorizedHandler = () => void;

let authToken = '';
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setApiToken(token: string) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;
}

function normalizeErrorMessage(input: unknown): string {
  if (Array.isArray(input)) {
    return input
      .map((item) => normalizeErrorMessage(item))
      .filter(Boolean)
      .join('；');
  }

  if (input && typeof input === 'object') {
    const record = input as Record<string, unknown>;
    if ('message' in record) {
      return normalizeErrorMessage(record.message);
    }
    if ('error' in record) {
      return normalizeErrorMessage(record.error);
    }
    return Object.values(record)
      .map((item) => normalizeErrorMessage(item))
      .filter(Boolean)
      .join('；');
  }

  if (typeof input === 'string') {
    return input.trim();
  }

  if (input === null || input === undefined) {
    return '';
  }

  return String(input);
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }

    const message = normalizeErrorMessage(data) || '请求失败';
    throw new Error(message);
  }

  return data as T;
}

