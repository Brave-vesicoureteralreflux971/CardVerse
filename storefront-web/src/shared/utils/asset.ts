export function resolveAssetUrl(input?: string | null) {
  if (!input) {
    return '';
  }

  if (/^https?:\/\//i.test(input) || input.startsWith('data:')) {
    return input;
  }

  if (input.startsWith('/')) {
    return input;
  }

  return `/${input}`;
}
