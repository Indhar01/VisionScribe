/**
 * Strict Undefined-Stripping & Payload Hygiene
 * Guarantees zero crashes from undefined Firestore properties
 */
export function sanitizeFirestorePayload<T extends Record<string, any>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? sanitizeFirestorePayload(item) : item)) as unknown as T;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object') {
      cleaned[key] = sanitizeFirestorePayload(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned as T;
}
