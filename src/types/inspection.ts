export type DispositionType =
  | 'Scrap'
  | 'Rework'
  | 'Repair'
  | 'Use-As-Is'
  | 'Further Engineering Review';

export interface NonConformanceReport {
  reportNumber: string;
  machineryPart: string;
  affectedSubsystem: string;
  defectClassification: string;
  severityScore: number; // 1 to 5
  severityLabel: string;
  defectDescription: string;
  rootCauseHypothesis: string;
  recommendedAction: string;
  disposition: DispositionType;
  preventiveMeasures: string[];
  standardsReferenced: string[];
  safetyAdvisory?: string;
  inspectedAt: string;
  modelUsed?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface WorkOrderTicket {
  trackingId: string; // e.g., "WO-7842"
  dispatchedAt: string;
  dispatchedBy?: string;
  assignedTeam: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedLeadTime: string;
  maintenanceNotes?: string;
  status: 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface InspectionRecord {
  id: string;
  userId: string;
  userEmail?: string;
  machineryPart: string;
  subsystem: string;
  initialNotes: string;
  imageUrl: string;
  ncr: NonConformanceReport;
  messages: ChatMessage[];
  status?: 'Pending Review' | 'Dispatched' | 'Resolved';
  workOrder?: WorkOrderTicket;
  createdAt: string;
  updatedAt: string;
}

export interface SampleDefectPreset {
  id: string;
  title: string;
  partName: string;
  subsystem: string;
  category: string;
  notes: string;
  image: string;
}
