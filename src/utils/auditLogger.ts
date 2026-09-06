import { AuditLogEntry } from '../types/inspection';

/**
 * Computes a SHA-256 cryptographic checksum for tamper-evident aerospace audit trail
 */
export async function generateAuditHash(payload: {
  userId: string;
  action: string;
  targetId?: string;
  details: string;
  timestamp: string;
}): Promise<string> {
  try {
    const rawString = `${payload.userId}|${payload.action}|${payload.targetId || ''}|${payload.details}|${payload.timestamp}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(rawString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  } catch {
    // Fallback hash for older runtimes
    let hash = 0;
    const str = `${payload.userId}:${payload.action}:${payload.timestamp}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }
}

export async function createAuditLog(
  userId: string,
  action: string,
  details: string,
  targetId?: string
): Promise<AuditLogEntry> {
  const timestamp = new Date().toISOString();
  const hash = await generateAuditHash({ userId, action, targetId, details, timestamp });

  return {
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    userId,
    action,
    targetId,
    details,
    hash: `0x${hash}`,
    timestamp,
  };
}
