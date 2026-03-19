export function toBigIntId(value: string | number | bigint): bigint {
  if (typeof value === 'bigint') {
    return value;
  }

  return BigInt(value);
}
