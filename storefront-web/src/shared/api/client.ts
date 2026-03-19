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
  }

  if (typeof input === 'string') {
    return input.trim();
  }

  return '请求失败';
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(normalizeErrorMessage(data));
  }

  return data as T;
}

