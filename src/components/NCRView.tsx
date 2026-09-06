import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Sparkles, 
  CheckCircle2, 
  Printer, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Send, 
  Plane,
  Stamp,
  UserCheck
} from 'lucide-react';
import { InspectionEntry, NCRData, UserProfile } from '../types/inspection';
import { requestGeminiNCR, saveInspectionEntry } from '../services/inspectionService';
import { generateDemoNCR } from '../utils/mockAiResponses';

interface NCRViewProps {
  user: UserProfile;
  inspection: InspectionEntry;
  onUpdateInspection: (updated: InspectionEntry) => void;
}

export const NCRView: React.FC<NCRViewProps> = ({
  user,
  inspection,
  onUpdateInspection,
}) => {
  const [loadingNCR, setLoadingNCR] = useState(false);
  const [ncr, setNcr] = useState<NCRData | null>(inspection.ncrData || null);
  const [status, setStatus] = useState(inspection.ncrStatus || 'open');
  const [signOffNote, setSignOffNote] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleGenerateNCR = async () => {
    setLoadingNCR(true);
    setStatusMsg(null);
    try {
      if (user.isDemo) {
        // Safe offline simulated NCR (never calls server.ts or real Gemini API)
        const demoResult = generateDemoNCR(inspection);
        setNcr(demoResult.ncr);
        setStatus('containment');

        const updated: InspectionEntry = {
          ...inspection,
          ncrData: demoResult.ncr,
          ncrStatus: 'containment',
          updatedAt: new Date().toISOString(),
        };
        await saveInspectionEntry(updated);
        onUpdateInspection(updated);
        setStatusMsg(`[Demo Mode] Simulated 8D NCR generated. (Sign in with Google to generate with live Gemini 3.6 Flash).`);
        return;
      }

      const result = await requestGeminiNCR(inspection);
      setNcr(result.ncr);
      setStatus('containment');

      const updated: InspectionEntry = {
        ...inspection,
        ncrData: result.ncr,
        ncrStatus: 'containment',
        updatedAt: new Date().toISOString(),
      };
      await saveInspectionEntry(updated);
      onUpdateInspection(updated);
      setStatusMsg(`AS9100 8D Non-Conformance Report generated successfully via Gemini 3.6 Flash [${result.modelUsed}].`);
    } catch (err: any) {
      console.error('NCR error:', err);
      setStatusMsg(err?.message || 'Failed to generate 8D NCR.');
    } finally {
      setLoadingNCR(false);
    }
  };

  const handleSignOff = async (newStatus: 'investigating' | 'closed') => {
    if (!ncr) return;
    const now = new Date().toISOString();
    const updatedNcr: NCRData = {
      ...ncr,
      signOffDate: now,
      mrbAuthority: user.displayName || user.email || 'Authorized MRB Engineer',
    };

    const updated: InspectionEntry = {
      ...inspection,
      ncrData: updatedNcr,
      ncrStatus: newStatus,
      updatedAt: now,
    };

    await saveInspectionEntry(updated);
    setNcr(updatedNcr);
    setStatus(newStatus);
    onUpdateInspection(updated);
    setStatusMsg(`NCR status updated to ${newStatus.toUpperCase()} with formal MRB signature.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-blue-600" />
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-tight">
              AS9100 Rev D &bull; 8D Non-Conformance Report (NCR)
            </h2>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5 font-mono">
            Document No: <span className="text-blue-700 font-bold">{ncr?.ncrNumber || `NCR-${inspection.id}`}</span> &bull; Program: <span className="text-gray-800 font-semibold">{inspection.program}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!ncr ? (
            <button
              onClick={handleGenerateNCR}
              disabled={loadingNCR}
              className="flex items-center gap-1.5 rounded bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white transition-all uppercase tracking-tight shadow-sm disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{loadingNCR ? 'Drafting 8D Protocols...' : 'Generate 8D NCR via Gemini 3.6'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 uppercase tracking-tight transition-all"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print / PDF</span>
              </button>

              {status !== 'closed' && (
                <button
                  onClick={() => handleSignOff('closed')}
                  className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white transition-all uppercase tracking-tight shadow-sm"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Execute MRB Sign-Off</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="font-medium text-[11px]">{statusMsg}</span>
        </div>
      )}

      {/* 8D Report Container */}
      {!ncr ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center space-y-3 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase">No 8D Report Generated Yet</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            Click <strong>Generate 8D NCR</strong> to trigger Gemini 3.6 Flash synthesizing a complete AS9100 Rev D eight-discipline containment and corrective action plan for <strong>{inspection.title}</strong>.
          </p>
          <button
            onClick={handleGenerateNCR}
            disabled={loadingNCR}
            className="inline-flex items-center gap-1.5 rounded bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-all uppercase tracking-tight shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{loadingNCR ? 'Drafting 8D Report...' : 'Generate 8D Report Now'}</span>
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-300 bg-white p-6 space-y-4 shadow-sm relative font-sans">
          
          {/* Engineering Header Table */}
          <div className="border-b border-gray-200 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-mono text-base font-extrabold text-gray-900">AS9100 REV D NON-CONFORMANCE REPORT</span>
                <p className="font-mono text-[11px] text-gray-500 mt-0.5">
                  MFR FACILITY: {inspection.facility} &bull; PART: {inspection.partNumber || 'N/A'} (S/N: {inspection.serialNumber || 'N/A'})
                </p>
              </div>

              <div className="text-right font-mono">
                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  status === 'closed'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  STATUS: {status.toUpperCase()}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Created: {new Date(inspection.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* 8D Disciplines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* D1 */}
            <div className="p-3 rounded border border-gray-200 bg-gray-50/50">
              <div className="font-mono text-[10px] uppercase tracking-wider text-blue-700 font-bold mb-0.5">
                D1 &bull; Champion & Cross-Functional Team
              </div>
              <p className="text-xs text-gray-800 leading-relaxed">{ncr.d1_team}</p>
            </div>

            {/* D2 */}
            <div className="p-3 rounded border border-gray-200 bg-gray-50/50">
              <div className="font-mono text-[10px] uppercase tracking-wider text-blue-700 font-bold mb-0.5">
                D2 &bull; Detailed Problem Description
              </div>
              <p className="text-xs text-gray-800 leading-relaxed">{ncr.d2_problemDescription}</p>
            </div>

            {/* D3 */}
            <div className="p-3 rounded border border-amber-200 bg-amber-50/40">
              <div className="font-mono text-[10px] uppercase tracking-wider text-amber-800 font-bold mb-0.5">
                D3 &bull; Immediate Containment Actions
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">{ncr.d3_interimContainment}</p>
            </div>

            {/* D4 */}
            <div className="p-3 rounded border border-red-200 bg-red-50/40">
              <div className="font-mono text-[10px] uppercase tracking-wider text-red-800 font-bold mb-0.5">
                D4 &bull; Root Cause Analysis (5-Why / Ishikawa)
              </div>
              <p className="text-xs text-red-950 leading-relaxed">{ncr.d4_rootCause}</p>
            </div>

            {/* D5 */}
            <div className="p-3 rounded border border-emerald-200 bg-emerald-50/40">
              <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-800 font-bold mb-0.5">
                D5 &bull; Permanent Corrective Actions (PCA)
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">{ncr.d5_correctiveAction}</p>
            </div>

            {/* D6 */}
            <div className="p-3 rounded border border-gray-200 bg-gray-50/50">
              <div className="font-mono text-[10px] uppercase tracking-wider text-gray-700 font-bold mb-0.5">
                D6 &bull; Validation & Verification Plan
              </div>
              <p className="text-xs text-gray-800 leading-relaxed">{ncr.d6_validationPlan}</p>
            </div>

            {/* D7 */}
            <div className="p-3 rounded border border-gray-200 bg-gray-50/50">
              <div className="font-mono text-[10px] uppercase tracking-wider text-gray-700 font-bold mb-0.5">
                D7 &bull; Systemic Preventive Measures
              </div>
              <p className="text-xs text-gray-800 leading-relaxed">{ncr.d7_preventiveAction}</p>
            </div>

            {/* D8 */}
            <div className="p-3 rounded border border-purple-200 bg-purple-50/40">
              <div className="font-mono text-[10px] uppercase tracking-wider text-purple-800 font-bold mb-0.5">
                D8 &bull; Closure & Team Recognition
              </div>
              <p className="text-xs text-purple-950 leading-relaxed">{ncr.d8_recognition}</p>
            </div>

          </div>

          {/* MRB Sign-off Stamp Block */}
          <div className="border-t border-gray-200 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Stamp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 font-mono uppercase">
                  MATERIAL REVIEW BOARD (MRB) AUTHORITY
                </p>
                <p className="text-[10px] text-gray-500 font-mono">
                  Sign-off by: <span className="text-blue-700 font-bold">{ncr.mrbAuthority || user.displayName || 'Quality Engineering Lead'}</span>
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-[10px] text-gray-400">
              <span>FAA 14 CFR Part 21 &bull; AS9100 Rev D Compliance Audit Trail Locked</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
