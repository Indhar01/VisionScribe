import { GeminiAnalysis, NCRData, InspectionEntry } from '../types/inspection';

/**
 * Deterministic, domain-accurate aerospace mock response generator for Demo Mode.
 * This completely isolates Demo mode from the live Gemini API and server.ts, ensuring
 * that unauthenticated users never reach the backend server or consume API quotas.
 */

export function generateDemoReflection(payload: {
  title: string;
  program: string;
  facility: string;
  partNumber?: string;
  serialNumber?: string;
  severity: string;
  discrepancyText: string;
}): { analysis: GeminiAnalysis; modelUsed: string } {
  const fmea = payload.severity === 'critical' ? 92 : payload.severity === 'major' ? 76 : 42;
  
  return {
    modelUsed: 'client-offline-demo-evaluator',
    analysis: {
      executiveSummary: `[DEMO MODE] AS9100 manufacturing evaluation for ${payload.program} (${payload.facility}). Discrepancy observed: "${payload.discrepancyText.slice(0, 80)}..."`,
      rootCauseHypothesis: `Hypothesis: Micro-structural anomaly or tool clamping pressure variation exceeding nominal torque tolerances for Part ${payload.partNumber || 'N/A'}.`,
      fmeaScore: fmea,
      severityAssessment: `${payload.severity.toUpperCase()} RISK: Structural non-conformance requiring engineering disposition per AS9100 Rev D standards.`,
      containmentSteps: [
        `[Demo Gate 1] Quarantine serial unit ${payload.serialNumber || 'N/A'} immediately at ${payload.facility}.`,
        `[Demo Gate 2] Halt current manufacturing lot pending Material Review Board (MRB) ultrasonic validation.`,
        `[Demo Gate 3] Inspect adjacent 5 assembly fixtures for alignment deviation.`
      ],
      dispositionRecommendation: `Concession proposal: Perform calibrated non-destructive re-inspection (NDI) and submit 8D disposition packet to Program Engineering Lead.`,
      suggestedReflections: [
        `Were automated robotic torque logs cross-checked against baseline calibration?`,
        `Has ambient humidity telemetry remained within pre-preg specification limits during assembly?`
      ]
    }
  };
}

export function generateDemoChatReply(
  userQuery: string,
  inspection?: Partial<InspectionEntry>
): { reply: string; modelUsed: string } {
  const program = inspection?.program || 'Aerospace Program';
  const part = inspection?.partNumber || 'Assembly Unit';

  return {
    modelUsed: 'client-offline-demo-evaluator',
    reply: `[DEMO MODE - Engineering Copilot]\n\nRegarding your inquiry on **${program} (${part})**:\n\n* **AS9100 Standard Alignment:** Under AS9100 Rev D Section 8.7 (Control of Nonconforming Outputs), immediate containment must be logged with timestamped traceability.\n* **Root Cause Guidance:** Investigate potential 5-Why factors spanning tooling calibration, environmental telemetry, and operator torque sign-offs.\n* **Next Actions:** Review the Supervisor Review Queue or generate an 8D NCR to establish containment and preventive corrective actions (CAPA).\n\n*(Note: To execute live multi-turn queries with Gemini 3.6 Flash, please authenticate with your Google account).*`
  };
}

export function generateDemoNCR(inspection: Partial<InspectionEntry>): { ncr: NCRData; modelUsed: string } {
  const inspId = inspection.id || `INSP-${Date.now()}`;
  
  return {
    modelUsed: 'client-offline-demo-evaluator',
    ncr: {
      ncrNumber: `NCR-DEMO-${inspId.slice(-6)}`,
      program: inspection.program || 'Aerospace Program',
      discrepancyClassification: inspection.severity === 'critical' ? 'Critical Safety Flight Non-Conformance' : 'Major Manufacturing Discrepancy',
      d1_team: 'AS9100 Rev D Lead Auditor, Stress Engineering MRB Lead, Composite Manufacturing Specialist',
      d2_problemDescription: inspection.discrepancyText || 'Non-conforming airframe discrepancy identified during standard quality gate audit.',
      d3_interimContainment: `1. Physical segregation of serial unit ${inspection.serialNumber || 'MSN-0418'} into MRB quarantine area.\n2. Issued immediate stop-movement hold on production lot.\n3. Conducted 100% NDI inspection across all sister assembly fixtures.`,
      immediateContainmentD3: `1. Physical segregation of serial unit ${inspection.serialNumber || 'MSN-0418'} into MRB quarantine area.\n2. Issued immediate stop-movement hold on production lot.`,
      d4_rootCause: `1. 5-Why: Discrepancy observed on component.\n2. Automated tooling applied excessive localized compressive shear.\n3. Pressure transducer drift went undetected during previous shift.\n4. Preventive maintenance cycle exceeded by 4 operating hours.\n5. Root Cause: Absence of hardware interlock preventing tool start upon calibration timer expiration.`,
      rootCauseAnalysisD4: `Root Cause: Absence of hardware interlock preventing tool start upon calibration timer expiration.`,
      d5_correctiveAction: `1. Installed optical pressure transducers with dual-channel telemetry.\n2. Recalibrated robotic positioning actuators.\n3. Updated standard operating procedure SOP-QA-441.`,
      permanentCorrectiveActionD5: `1. Installed optical pressure transducers.\n2. Recalibrated robotic positioning actuators.`,
      d6_validationPlan: 'Perform 100-cycle continuous load test under simulated flight load conditions with zero acoustic emission drift.',
      d7_preventiveAction: `Implemented automated software lock requiring active daily calibration certificate verification before robotic drill cycle can be initiated.`,
      preventRecurrenceD7: `Implemented automated software lock requiring active daily calibration certificate verification.`,
      d8_recognition: 'Quality Circle commendation for rapid non-destructive detection preventing escape to flight line.',
      mrbDisposition: 'Concession with high-modulus stepped-scarf autoclave bonded repair per SRM 51-70-00.',
      signOffAuthority: 'Lead Quality Engineer / MRB Representative (Demo Mode)',
      mrbAuthority: 'Authorized MRB Quality Lead (Demo Mode)',
    }
  };
}
