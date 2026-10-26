// Devuelve un rango inclusivo o null si el pedido no es válido.
export function byteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!match || (!match[1] && !match[2]) || size < 1) return null;
  const left = match[1] ? Number(match[1]) : null, right = match[2] ? Number(match[2]) : null;
  if ([left, right].some(n => n !== null && (!Number.isSafeInteger(n) || n < 0))) return null;
  if (left === null) return right > 0 ? { start: Math.max(0, size - right), end: size - 1 } : null;
  const end = right === null ? size - 1 : Math.min(right, size - 1);
  return left < size && end >= left ? { start: left, end } : null;
}
