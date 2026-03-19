import { createHash, randomBytes } from 'crypto';

export function generateOrderNo(): string {
  const now = new Date();
  const datePart = now
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);
  const randomPart = randomBytes(4).toString('hex').toUpperCase();

  return `FK${datePart}${randomPart}`;
}

export function generateQueryPassword(): string {
  return randomBytes(4).toString('hex');
}

export function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
