export type AerospaceProgram = 
  | 'Airbus A350'
  | 'Rolls-Royce Trent XWB'
  | 'Bombardier Global 7500'
  | 'Airbus A320neo'
  | 'Rolls-Royce Pearl 15'
  | 'General Aerospace';

export type SeverityLevel = 'minor' | 'major' | 'critical';

export type NCRStatus = 'draft' | 'open' | 'engineering_review' | 'disposition_approved' | 'closed';

export type UserRole = 'inspector' | 'supervisor' | 'quality_lead' | 'chief_engineer' | 'auditor';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type ConfidenceEvaluation = 'HIGH' | 'MODERATE' | 'LOW';

export interface SupervisorReview {
  reviewedBy: string;
  reviewerEmail?: string;
  reviewedAt: string;
  decision: 'approved' | 'rejected';
  notes?: string;
}

export interface DefectCoordinates {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  zone: string;
}

export interface GeminiAnalysis {
  executiveSummary: string;
  rootCauseHypothesis: string;
  fmeaScore: number;
  severityAssessment: string;
  containmentSteps: string[];
  dispositionRecommendation: string;
  suggestedReflections: string[];
}

export interface NCRData {
  ncrNumber: string;
  program: string;
  discrepancyClassification: string;
  d1_team?: string;
  d2_problemDescription?: string;
  d3_interimContainment?: string;
  immediateContainmentD3?: string;
  d4_rootCause?: string;
  rootCauseAnalysisD4?: string;
  d5_correctiveAction?: string;
  permanentCorrectiveActionD5?: string;
  d6_validationPlan?: string;
  d7_preventiveAction?: string;
  preventRecurrenceD7?: string;
  d8_recognition?: string;
  mrbDisposition?: string;
  signOffAuthority?: string;
  mrbAuthority?: string;
  signOffDate?: string;
  signedAt?: string;
  signedBy?: string;
}

export interface InspectionEntry {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  program: AerospaceProgram;
  facility: string;
  coordinates?: string;
  blueprintLocation?: DefectCoordinates;
  partNumber?: string;
  serialNumber?: string;
  severity: SeverityLevel;
  discrepancyText: string;
  geminiReflection?: string;
  analysis?: GeminiAnalysis;
  ncrReport?: NCRData;
  ncrStatus: NCRStatus;
  verificationStatus?: VerificationStatus;
  confidenceScore?: number; // INTEGER 0-100 constraint
  confidenceEvaluation?: ConfidenceEvaluation; // 'HIGH' | 'MODERATE' | 'LOW'
  supervisorReview?: SupervisorReview;
  fmeaScore?: number;
  imageUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InteractionMessage {
  id: string;
  inspectionId: string;
  userId: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  targetId?: string;
  details: string;
  hash: string;
  timestamp: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  facilityBadge: string;
  isDemo?: boolean;
}
