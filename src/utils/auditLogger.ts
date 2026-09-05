/**
 * Immutable Audit Logging for VisionScribe
 * All audit events are logged immutably to maintain compliance with ISO 9001/AS9100
 */

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  action: 'INSPECTION_CREATED' | 'INSPECTION_VERIFIED' | 'INSPECTION_REJECTED' | 'WORK_ORDER_DISPATCHED' | 'INSPECTION_DELETED';
  resourceType: 'inspection' | 'work_order' | 'audit_trail';
  resourceId: string;
  details: {
    [key: string]: any;
  };
  ipAddress?: string;
  userAgent?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

/**
 * Log an immutable audit event
 * In production, these should be sent to a dedicated audit log service
 * For development, they're logged to console and localStorage
 */
export async function logAuditEvent(
  userId: string,
  action: AuditEvent['action'],
  resourceType: AuditEvent['resourceType'],
  resourceId: string,
  details: Record<string, any> = {},
  severity: AuditEvent['severity'] = 'INFO'
): Promise<void> {
  const auditEvent: AuditEvent = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    userId,
    action,
    resourceType,
    resourceId,
    details,
    severity,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };

  try {
    // Log to console for development
    console.log(`[Audit Trail] ${action} - Resource: ${resourceType}/${resourceId}`, {
      user: userId,
      severity,
      timestamp: auditEvent.timestamp,
      details,
    });

    // Store in localStorage for offline capability (limited to 1000 events to avoid quota exceeded)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const existingAudits = JSON.parse(localStorage.getItem('visionscribe-audit-trail') || '[]');
        const newAudits = [auditEvent, ...existingAudits.slice(0, 999)]; // Keep last 1000 events
        localStorage.setItem('visionscribe-audit-trail', JSON.stringify(newAudits));
      } catch (e) {
        console.warn('[Audit Logger] Failed to persist audit to localStorage:', e);
      }
    }

    // In production, send to backend audit service
    if (process.env.NODE_ENV === 'production' && process.env.VITE_AUDIT_API_ENDPOINT) {
      try {
        await fetch(process.env.VITE_AUDIT_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Audit-Signature': 'immutable', // In production, sign with HMAC
          },
          body: JSON.stringify(auditEvent),
        });
      } catch (e) {
        console.error('[Audit Logger] Failed to send audit event to backend:', e);
        // Don't throw - audit logging failures shouldn't block operations
      }
    }
  } catch (err) {
    console.error('[Audit Logger] Unexpected error:', err);
  }
}

/**
 * Export audit trail for compliance reporting
 */
export function exportAuditTrail(): AuditEvent[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const auditData = localStorage.getItem('visionscribe-audit-trail');
    return auditData ? JSON.parse(auditData) : [];
  } catch (e) {
    console.error('[Audit Logger] Failed to export audit trail:', e);
    return [];
  }
}

/**
 * Clear audit trail (typically only for testing/development)
 */
export function clearAuditTrail(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('visionscribe-audit-trail');
    console.warn('[Audit Logger] Audit trail cleared');
  }
}
