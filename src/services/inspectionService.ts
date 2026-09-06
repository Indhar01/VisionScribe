import { 
  collection, 
  collectionGroup, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  limit, 
  orderBy, 
  onSnapshot, 
  deleteDoc 
} from 'firebase/firestore';
import { db, auth, isFirebaseAvailable, handleFirestoreError, OperationType } from '../firebase/config';
import { 
  InspectionEntry, 
  InteractionMessage, 
  AuditLogEntry, 
  GeminiAnalysis, 
  NCRData, 
  UserProfile, 
  UserRole,
  SupervisorReview,
  VerificationStatus,
  ConfidenceEvaluation
} from '../types/inspection';
import { sanitizeFirestorePayload } from '../utils/sanitize';
import { createAuditLog } from '../utils/auditLogger';
import { SAMPLE_AEROSPACE_DEFECTS } from '../data/sampleDefects';

const LOCAL_STORAGE_INSPECTIONS_KEY = 'visionscribe_inspections_cache';
const LOCAL_STORAGE_INTERACTIONS_KEY = 'visionscribe_interactions_cache';
const LOCAL_STORAGE_AUDIT_KEY = 'visionscribe_audit_cache';
const LOCAL_STORAGE_USER_PROFILE_KEY = 'visionscribe_user_profile_cache';

/**
 * Retrieves the Firebase Auth Bearer token for server-side API authentication.
 * Throws an explicit error if the user is unauthenticated or no valid token can be obtained.
 */
async function getAuthBearerHeader(): Promise<Record<string, string>> {
  if (!auth || !auth.currentUser) {
    throw new Error('Authentication required: You must be signed in with Google to perform live Gemini AI analysis.');
  }

  try {
    const token = await auth.currentUser.getIdToken();
    if (!token) {
      throw new Error('Failed to acquire valid authentication token. Please re-authenticate.');
    }
    return { Authorization: `Bearer ${token}` };
  } catch (err: any) {
    console.error('[getAuthBearerHeader] Token acquisition failed:', err);
    throw new Error(err?.message || 'Authentication error: Unable to verify your Google session token.');
  }
}

/**
 * ============================================================================
 * SELF-ESCALATION PREVENTION & OPERATOR PROMOTION MANUAL PATH:
 * ============================================================================
 * Per the Self-Escalation Prevention rule, a user cannot self-assign or promote
 * their own role via client-side operations.
 *
 * To manually promote an inspector to supervisor, an administrator must edit
 * the Firestore document directly in the Firebase Console at:
 *
 *   FIRESTORE PATH: /users/{userId}
 *   FIELD TO EDIT:  role = "supervisor"  (type: string)
 *
 * Security rules (firestore.rules) verify this role via:
 *   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'supervisor'
 * ============================================================================
 */
export async function initOrGetUserProfile(
  userId: string,
  email: string | null,
  displayName: string | null,
  photoURL: string | null = null,
  forceRole?: UserRole
): Promise<UserProfile> {
  const defaultProfile: UserProfile = {
    uid: userId,
    email,
    displayName: displayName || (email ? email.split('@')[0] : 'Inspector'),
    photoURL,
    role: forceRole || 'inspector', // All new accounts default strictly to 'inspector'
    facilityBadge: 'AS9100-FAL-SEC-4',
  };

  if (isFirebaseAvailable && db) {
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        const role = (data.role as UserRole) || 'inspector';
        return {
          uid: userId,
          email: data.email ?? email,
          displayName: data.displayName ?? displayName ?? (email ? email.split('@')[0] : 'Inspector'),
          photoURL: data.photoURL ?? photoURL,
          role: forceRole || role,
          facilityBadge: data.facilityBadge || 'AS9100-FAL-SEC-4',
        };
      } else {
        // Create user document with default 'inspector' role
        const initialDoc = {
          uid: userId,
          email,
          displayName: displayName || (email ? email.split('@')[0] : 'Inspector'),
          photoURL,
          role: 'inspector', // Strict default: inspector
          facilityBadge: 'AS9100-FAL-SEC-4',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, initialDoc);
        return defaultProfile;
      }
    } catch (err) {
      console.warn('Profile sync fallback to local cache:', err);
    }
  }

  return defaultProfile;
}

// Helper for local storage persistence fallback
function getLocalCache<T>(key: string, userId: string): T[] {
  try {
    const raw = localStorage.getItem(`${key}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalCache<T>(key: string, userId: string, data: T[]): void {
  try {
    localStorage.setItem(`${key}_${userId}`, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage error:', e);
  }
}

// 1. SAVE / UPDATE INSPECTION
export async function saveInspectionEntry(entry: InspectionEntry): Promise<void> {
  const sanitized = sanitizeFirestorePayload(entry);
  const userId = entry.userId;
  const inspectionPath = `users/${userId}/inspections/${entry.id}`;

  // Always save to local cache for instant zero-latency UI response
  const cached = getLocalCache<InspectionEntry>(LOCAL_STORAGE_INSPECTIONS_KEY, userId);
  const existingIdx = cached.findIndex((item) => item.id === entry.id);
  if (existingIdx >= 0) {
    cached[existingIdx] = sanitized;
  } else {
    cached.unshift(sanitized);
  }
  setLocalCache(LOCAL_STORAGE_INSPECTIONS_KEY, userId, cached);

  // Sync to Firestore if available
  if (isFirebaseAvailable && db) {
    try {
      await setDoc(doc(db, 'users', userId, 'inspections', entry.id), sanitized, { merge: true });
    } catch (err) {
      console.warn('Firestore write fallback:', err);
      handleFirestoreError(err, OperationType.WRITE, inspectionPath);
    }
  }

  // Generate audit log entry
  const audit = await createAuditLog(
    userId,
    existingIdx >= 0 ? 'UPDATE_INSPECTION' : 'CREATE_INSPECTION',
    `Inspection ${entry.id} (${entry.program} - ${entry.severity.toUpperCase()}) saved. Status: ${entry.ncrStatus}`,
    entry.id
  );
  await saveAuditLog(audit);
}

// 2. FETCH USER INSPECTIONS
export async function getUserInspections(userId: string): Promise<InspectionEntry[]> {
  if (isFirebaseAvailable && db) {
    const path = `users/${userId}/inspections`;
    try {
      // Scalability Standard: Explicit limit(50)
      const q = query(collection(db, 'users', userId, 'inspections'), orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const entries: InspectionEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as InspectionEntry);
      });
      if (entries.length > 0) {
        setLocalCache(LOCAL_STORAGE_INSPECTIONS_KEY, userId, entries);
        return entries;
      }
    } catch (err) {
      console.warn('Firestore fetch error, falling back to local storage cache:', err);
    }
  }
  return getLocalCache<InspectionEntry>(LOCAL_STORAGE_INSPECTIONS_KEY, userId);
}

// 3. DELETE INSPECTION
export async function deleteInspectionEntry(userId: string, inspectionId: string): Promise<void> {
  const cached = getLocalCache<InspectionEntry>(LOCAL_STORAGE_INSPECTIONS_KEY, userId);
  const filtered = cached.filter((item) => item.id !== inspectionId);
  setLocalCache(LOCAL_STORAGE_INSPECTIONS_KEY, userId, filtered);

  if (isFirebaseAvailable && db) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'inspections', inspectionId));
    } catch (err) {
      console.warn('Firestore delete error:', err);
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}/inspections/${inspectionId}`);
    }
  }

  const audit = await createAuditLog(userId, 'DELETE_INSPECTION', `Deleted inspection record ${inspectionId}`, inspectionId);
  await saveAuditLog(audit);
}

// 4. SAVE INTERACTION (MULTI-TURN CHAT)
export async function saveInteractionMessage(message: InteractionMessage): Promise<void> {
  const sanitized = sanitizeFirestorePayload(message);
  const userId = message.userId;

  const key = `${LOCAL_STORAGE_INTERACTIONS_KEY}_${message.inspectionId}`;
  const cached = getLocalCache<InteractionMessage>(key, userId);
  cached.push(sanitized);
  setLocalCache(key, userId, cached);

  if (isFirebaseAvailable && db) {
    try {
      await setDoc(doc(db, 'users', userId, 'interactions', message.id), sanitized);
    } catch (err) {
      console.warn('Firestore interaction write notice:', err);
    }
  }
}

// 5. FETCH INTERACTIONS
export async function getInspectionInteractions(userId: string, inspectionId: string): Promise<InteractionMessage[]> {
  const key = `${LOCAL_STORAGE_INTERACTIONS_KEY}_${inspectionId}`;
  if (isFirebaseAvailable && db) {
    try {
      // Scalability Standard: Explicit limit(100)
      const q = query(collection(db, 'users', userId, 'interactions'), orderBy('timestamp', 'asc'), limit(100));
      const snapshot = await getDocs(q);
      const msgs: InteractionMessage[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as InteractionMessage;
        if (item.inspectionId === inspectionId) {
          msgs.push(item);
        }
      });
      if (msgs.length > 0) {
        setLocalCache(key, userId, msgs);
        return msgs;
      }
    } catch (err) {
      console.warn('Firestore interactions query fallback:', err);
    }
  }
  return getLocalCache<InteractionMessage>(key, userId);
}

// 6. SAVE & FETCH AUDIT LOGS
export async function saveAuditLog(log: AuditLogEntry): Promise<void> {
  const sanitized = sanitizeFirestorePayload(log);
  const cached = getLocalCache<AuditLogEntry>(LOCAL_STORAGE_AUDIT_KEY, log.userId);
  cached.unshift(sanitized);
  setLocalCache(LOCAL_STORAGE_AUDIT_KEY, log.userId, cached.slice(0, 50));

  if (isFirebaseAvailable && db) {
    try {
      await setDoc(doc(db, 'users', log.userId, 'auditLogs', log.id), sanitized);
    } catch (err) {
      console.warn('Firestore audit write notice:', err);
    }
  }
}

export async function getUserAuditLogs(userId: string): Promise<AuditLogEntry[]> {
  if (isFirebaseAvailable && db) {
    try {
      // Scalability Standard: Explicit limit(50)
      const q = query(collection(db, 'users', userId, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const logs: AuditLogEntry[] = [];
      snapshot.forEach((d) => logs.push(d.data() as AuditLogEntry));
      if (logs.length > 0) {
        setLocalCache(LOCAL_STORAGE_AUDIT_KEY, userId, logs);
        return logs;
      }
    } catch (err) {
      console.warn('Firestore audit fetch fallback:', err);
    }
  }
  return getLocalCache<AuditLogEntry>(LOCAL_STORAGE_AUDIT_KEY, userId);
}

// 7. GEMINI SERVER API CALLS (WITH AUTHENTICATION HEADERS)

export async function requestGeminiReflection(payload: {
  title: string;
  program: string;
  facility: string;
  partNumber?: string;
  serialNumber?: string;
  severity: string;
  discrepancyText: string;
}): Promise<{ analysis: GeminiAnalysis; modelUsed: string }> {
  const authHeaders = await getAuthBearerHeader();
  const response = await fetch('/api/gemini/reflect', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Reflection request failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    analysis: data.analysis,
    modelUsed: data.modelUsed,
  };
}

export async function requestGeminiChat(
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  currentInspection?: Partial<InspectionEntry>
): Promise<{ reply: string; modelUsed: string }> {
  const authHeaders = await getAuthBearerHeader();
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ messages, currentInspection }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Chat request failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    reply: data.reply,
    modelUsed: data.modelUsed,
  };
}

export async function requestGeminiNCR(inspection: Partial<InspectionEntry>): Promise<{ ncr: NCRData; modelUsed: string }> {
  const authHeaders = await getAuthBearerHeader();
  const response = await fetch('/api/gemini/ncr-generate', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ inspection }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `NCR generation failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    ncr: data.ncr,
    modelUsed: data.modelUsed,
  };
}

// 8. SUPERVISOR REVIEW QUEUE (CROSS-USER COLLECTION GROUP QUERY WITH SCALABILITY LIMITS)

/**
 * Fetches all inspections across all users where verificationStatus is 'pending'
 * and confidenceScore < 60 (bounded by limit(50) per Scalability Standard).
 */
export async function getSupervisorReviewQueue(): Promise<InspectionEntry[]> {
  const queueEntries: InspectionEntry[] = [];

  if (isFirebaseAvailable && db) {
    try {
      // Scalability standard: Explicit limit(50) and indexed cross-user query
      const queueQuery = query(
        collectionGroup(db, 'inspections'),
        where('verificationStatus', '==', 'pending'),
        where('confidenceScore', '<', 60),
        limit(50)
      );

      const snapshot = await getDocs(queueQuery);
      snapshot.forEach((docSnap) => {
        queueEntries.push(docSnap.data() as InspectionEntry);
      });

      if (queueEntries.length > 0) {
        return queueEntries;
      }
    } catch (err) {
      console.warn('Supervisor collection group query notice (falling back to aggregated cache):', err);
    }
  }

  // Fallback / sandbox aggregation: Gather all cached records & sample defects
  const allCached: InspectionEntry[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_STORAGE_INSPECTIONS_KEY)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            allCached.push(...list);
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // If local storage is fresh/empty, seed from sample aerospace defects with pending & low confidence
  if (allCached.length === 0) {
    SAMPLE_AEROSPACE_DEFECTS.forEach((sample, idx) => {
      const sampleScore = sample.confidenceScore ?? (sample.severity === 'critical' ? 52 : sample.severity === 'major' ? 48 : 58);
      allCached.push({
        ...sample,
        id: `SAMPLE-QUEUE-00${idx + 1}`,
        userId: `inspector-station-0${idx + 1}`,
        userEmail: `inspector.0${idx + 1}@aerospace.mfg`,
        verificationStatus: sample.verificationStatus || 'pending',
        confidenceScore: sampleScore,
        confidenceEvaluation: sample.confidenceEvaluation || (sampleScore >= 80 ? 'HIGH' : sampleScore >= 60 ? 'MODERATE' : 'LOW'),
        createdAt: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
      } as InspectionEntry);
    });
  }

  // Strict filter: verificationStatus === 'pending' AND confidenceScore < 60
  const filtered = allCached.filter((entry) => {
    const status = entry.verificationStatus || 'pending';
    const score = entry.confidenceScore ?? 50;
    return status === 'pending' && score < 60;
  });

  return filtered.slice(0, 50);
}

/**
 * Execute Supervisor Review decision (Approve or Reject with MRB notes)
 */
export async function reviewInspectionEntry(
  entry: InspectionEntry,
  decision: 'approved' | 'rejected',
  notes: string,
  supervisor: UserProfile
): Promise<InspectionEntry> {
  const now = new Date().toISOString();
  const reviewData: SupervisorReview = {
    reviewedBy: supervisor.displayName || supervisor.email || supervisor.uid,
    reviewerEmail: supervisor.email || undefined,
    reviewedAt: now,
    decision,
    notes: notes.trim() || (decision === 'approved' ? 'Verified and approved by Quality Supervisor' : 'Returned for re-inspection'),
  };

  const updatedEntry: InspectionEntry = {
    ...entry,
    verificationStatus: decision,
    supervisorReview: reviewData,
    updatedAt: now,
  };

  // Save to user path
  await saveInspectionEntry(updatedEntry);

  // Write supervisor audit log
  const audit = await createAuditLog(
    supervisor.uid,
    `SUPERVISOR_${decision.toUpperCase()}_FINDING`,
    `Supervisor ${supervisor.displayName || supervisor.uid} ${decision.toUpperCase()} finding ${entry.id} (${entry.program}). Notes: ${reviewData.notes}`,
    entry.id
  );
  await saveAuditLog(audit);

  return updatedEntry;
}

