import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { InspectionRecord, ChatMessage, WorkOrderTicket } from "../types/inspection";
import { sanitizePayload } from "../utils/sanitize";
import { logAuditEvent } from "../utils/auditLogger";

/**
 * Returns the collection reference for a user's isolated inspections
 */
export function getUserInspectionsRef(userId: string) {
  if (!userId) throw new Error("userId is required for isolated Firestore queries");
  return collection(db, "users", userId, "inspections");
}

/**
 * Subscribe to the real-time list of historical inspections for the authenticated user,
 * bounded by a query limit (50 most recent) to prevent unbounded read latency and scale costs.
 */
export function subscribeToUserInspections(
  userId: string,
  onUpdate: (inspections: InspectionRecord[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const colRef = getUserInspectionsRef(userId);
  // Bounded query with server-side ordering and limit
  const q = query(colRef, orderBy("createdAt", "desc"), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: InspectionRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as InspectionRecord;
        records.push({
          ...data,
          id: docSnap.id,
        });
      });

      // Sort in memory by createdAt descending for reliable display
      records.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      });

      onUpdate(records);
    },
    (err) => {
      console.error("[Firestore] subscribeToUserInspections error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Persists a newly generated Non-Conformance Report and inspection telemetry
 * under the user's isolated path: /users/{userId}/inspections/{id}
 */
export async function saveInspectionRecord(
  userId: string,
  inspection: InspectionRecord
): Promise<void> {
  if (!userId) throw new Error("Authenticated userId is required to save inspection.");
  const docRef = doc(db, "users", userId, "inspections", inspection.id);
  const cleanData = sanitizePayload(inspection);
  await setDoc(docRef, cleanData);

  // Log audit event
  await logAuditEvent(
    userId,
    'INSPECTION_CREATED',
    'inspection',
    inspection.id,
    {
      machineryPart: inspection.machineryPart,
      subsystem: inspection.subsystem,
      ncrReportNumber: inspection.ncr.reportNumber,
      severityScore: inspection.ncr.severityScore,
      confidenceScore: inspection.ncr.confidenceScore,
      ataChapter: inspection.ncr.ataChapter,
    },
    inspection.ncr.severityScore >= 4 ? 'WARNING' : 'INFO'
  );
}

/**
 * Appends a new chat message to an existing inspection record's multi-turn thread
 */
export async function appendInspectionMessage(
  userId: string,
  inspectionId: string,
  currentMessages: ChatMessage[],
  newMessage: ChatMessage
): Promise<ChatMessage[]> {
  if (!userId || !inspectionId) {
    throw new Error("userId and inspectionId are required to append messages.");
  }

  const updatedMessages = [...currentMessages, newMessage];
  const docRef = doc(db, "users", userId, "inspections", inspectionId);

  const payload = sanitizePayload({
    messages: updatedMessages,
    updatedAt: new Date().toISOString(),
  });

  await updateDoc(docRef, payload);
  return updatedMessages;
}

/**
 * Deletes an inspection record from the user's isolated collection
 */
export async function deleteInspectionRecord(
  userId: string,
  inspectionId: string
): Promise<void> {
  if (!userId || !inspectionId) {
    throw new Error("userId and inspectionId are required to delete an inspection.");
  }

  const docRef = doc(db, "users", userId, "inspections", inspectionId);
  await deleteDoc(docRef);
}

/**
 * Voids an inspection record preserving AS9100 Rev D & ISO 9001:2015 audit immutability.
 * Rather than hard-deleting the evidence, it marks status as 'Voided', attaches an audit reason,
 * and maintains the historical trace.
 */
export async function voidInspectionRecord(
  userId: string,
  inspectionId: string,
  voidReason: string,
  voidedBy?: string
): Promise<void> {
  if (!userId || !inspectionId) {
    throw new Error("userId and inspectionId are required to void an inspection.");
  }

  const docRef = doc(db, "users", userId, "inspections", inspectionId);
  const payload = sanitizePayload({
    status: "Voided",
    isVoided: true,
    voidReason: voidReason || "Record superseded or cancelled under QA revision protocol.",
    voidedAt: new Date().toISOString(),
    voidedBy: voidedBy || "Certified Lead Inspector",
    updatedAt: new Date().toISOString(),
  });

  await updateDoc(docRef, payload);
}

/**
 * Dispatches a maintenance work order for an inspection record,
 * marking status as 'Dispatched' and persisting the ticket payload.
 */
export async function dispatchWorkOrderForInspection(
  userId: string,
  inspectionId: string,
  workOrder: WorkOrderTicket
): Promise<void> {
  if (!userId || !inspectionId) {
    throw new Error("userId and inspectionId are required to dispatch work order.");
  }

  const docRef = doc(db, "users", userId, "inspections", inspectionId);
  const payload = sanitizePayload({
    status: "Dispatched",
    workOrder,
    updatedAt: new Date().toISOString(),
  });

  await updateDoc(docRef, payload);

  // Log audit event for work order dispatch
  await logAuditEvent(
    userId,
    'WORK_ORDER_DISPATCHED',
    'work_order',
    workOrder.trackingId,
    {
      inspectionId,
      priority: workOrder.priority,
      assignedTeam: workOrder.assignedTeam,
      estimatedLeadTime: workOrder.estimatedLeadTime,
      dispatchedBy: workOrder.dispatchedBy,
    },
    workOrder.priority === 'CRITICAL' ? 'CRITICAL' : 'INFO'
  );
}
