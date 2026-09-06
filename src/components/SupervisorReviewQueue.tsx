import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  AlertTriangle, 
  UserCheck, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Layers, 
  RefreshCw,
  ExternalLink,
  MessageSquare,
  FileCheck,
  ShieldCheck,
  HelpCircle,
  Activity
} from 'lucide-react';
import { InspectionEntry, UserProfile } from '../types/inspection';
import { getSupervisorReviewQueue, reviewInspectionEntry } from '../services/inspectionService';

interface SupervisorReviewQueueProps {
  user: UserProfile;
  onSelectInspection: (entry: InspectionEntry) => void;
  onOpenChat: (entry: InspectionEntry) => void;
  onNavigateToJournal: () => void;
  onRoleSwitchForDemo?: (role: 'inspector' | 'supervisor') => void;
}

export const SupervisorReviewQueue: React.FC<SupervisorReviewQueueProps> = ({
  user,
  onSelectInspection,
  onOpenChat,
  onNavigateToJournal,
  onRoleSwitchForDemo,
}) => {
  const [queue, setQueue] = useState<InspectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSupervisor = user.role === 'supervisor';

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const items = await getSupervisorReviewQueue();
      setQueue(items);
    } catch (err: any) {
      console.error('Failed to load supervisor review queue:', err);
      setStatusFeedback({ type: 'error', text: 'Failed to retrieve cross-user review queue from Firestore.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSupervisor) {
      fetchQueue();
    }
  }, [user.role, isSupervisor]);

  const handleDecision = async (entry: InspectionEntry, decision: 'approved' | 'rejected') => {
    setProcessingId(entry.id);
    setStatusFeedback(null);
    try {
      const notes = reviewNotes[entry.id] || '';
      await reviewInspectionEntry(entry, decision, notes, user);
      
      // Update local state by removing resolved item from pending queue
      setQueue((prev) => prev.filter((item) => item.id !== entry.id));
      
      setStatusFeedback({
        type: 'success',
        text: `Inspection ${entry.id} (${entry.program}) successfully ${decision.toUpperCase()} by ${user.displayName || 'Supervisor'}.`,
      });
    } catch (err: any) {
      console.error('Supervisor decision error:', err);
      setStatusFeedback({ type: 'error', text: err?.message || 'Failed to apply supervisor disposition.' });
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered Queue
  const filteredQueue = queue.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.discrepancyText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.partNumber && item.partNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.userEmail && item.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchProgram = selectedProgram === 'all' || item.program === selectedProgram;
    const matchSeverity = selectedSeverity === 'all' || item.severity === selectedSeverity;

    return matchSearch && matchProgram && matchSeverity;
  });

  // Metrics
  const totalInQueue = queue.length;
  const criticalInQueue = queue.filter((i) => i.severity === 'critical').length;
  const avgConfidence = totalInQueue > 0
    ? Math.round(queue.reduce((acc, curr) => acc + (curr.confidenceScore ?? 50), 0) / totalInQueue)
    : 0;

  // 1. NON-SUPERVISOR ACCESS RESTRICTION (USABILITY & ZERO-TRUST STANDARD)
  if (!isSupervisor) {
    return (
      <div className="space-y-4">
        {/* Access Denied Card */}
        <div className="rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 border border-red-200 text-red-600">
            <Lock className="h-7 w-7" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-red-600 bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
              403 Forbidden &bull; Role Authorization Guard
            </span>
            <h2 className="text-base sm:text-lg font-serif font-bold text-gray-900 tracking-tight">
              Supervisor Role Authorization Required
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed font-sans">
              The <strong>Supervisor Review Queue</strong> aggregates cross-user findings with pending verification and confidence scores under 60. Your current profile role is assigned as: <strong className="font-mono text-gray-900 uppercase">[{user.role}]</strong>.
            </p>
          </div>

          {/* Self-Escalation Prevention Info Notice */}
          <div className="max-w-lg mx-auto p-3.5 rounded-lg border border-amber-200 bg-amber-50/70 text-left text-xs text-amber-950 space-y-2 font-mono">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-900">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-700 flex-shrink-0" />
              <span>Self-Escalation Prevention Enforced</span>
            </div>
            <p className="text-[10px] text-amber-900/90 leading-relaxed">
              Per security policy, inspectors cannot self-promote. An operator must update Firestore directly at:
            </p>
            <div className="p-2 rounded bg-white/80 border border-amber-300 font-mono text-[10px] text-gray-800 break-all">
              Path: <strong>/users/{user.uid}</strong> &rarr; field: <strong className="text-blue-700">"role": "supervisor"</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateToJournal}
              className="inline-flex items-center gap-1.5 rounded bg-gray-900 hover:bg-black px-4 py-2 text-xs font-bold text-white transition-all uppercase tracking-tight shadow-sm"
            >
              <span>Return to My Inspection Journal</span>
            </button>

            {onRoleSwitchForDemo && (
              <button
                onClick={() => onRoleSwitchForDemo('supervisor')}
                className="inline-flex items-center gap-1.5 rounded border border-blue-300 bg-blue-50 hover:bg-blue-100 px-4 py-2 text-xs font-bold text-blue-700 transition-all uppercase tracking-tight font-mono"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Simulate Operator Promotion (Demo Mode)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. SUPERVISOR AUTHORIZED QUEUE VIEW
  return (
    <div className="space-y-4 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-tight font-mono">
              Supervisor Review Queue &bull; AS9100 Cross-User Gate
            </h2>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Cross-station quality triage for findings with <strong className="text-blue-700">verificationStatus = 'pending'</strong> and <strong className="text-amber-700">confidenceScore &lt; 60</strong> (bounded at limit 50).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-gray-700 hover:bg-gray-50 uppercase tracking-tight transition-all shadow-sm"
            title="Refresh review queue"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {statusFeedback && (
        <div className={`p-2.5 rounded border text-xs flex items-center gap-2 transition-all ${
          statusFeedback.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {statusFeedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
          )}
          <span className="font-medium text-[11px]">{statusFeedback.text}</span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
          <p className="text-[10px] font-mono uppercase text-gray-500 font-bold">Pending Triage</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-mono font-extrabold text-blue-700">{totalInQueue}</span>
            <span className="text-[10px] font-mono font-semibold text-amber-600">&lt; 60 Conf</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
          <p className="text-[10px] font-mono uppercase text-gray-500 font-bold">Critical Flight Risk</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-xl font-mono font-extrabold ${criticalInQueue > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {criticalInQueue}
            </span>
            <span className="text-[10px] font-mono font-semibold text-red-600">Priority 1</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
          <p className="text-[10px] font-mono uppercase text-gray-500 font-bold">Avg Confidence</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-mono font-extrabold text-amber-700">{avgConfidence}</span>
            <span className="text-[10px] font-mono text-gray-400">Score / 100</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
          <p className="text-[10px] font-mono uppercase text-gray-500 font-bold">Query Scalability</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-mono font-extrabold text-gray-900">50</span>
            <span className="text-[10px] font-mono text-blue-600">Indexed Limit</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter queue by part number, title, observation, inspector, or facility..."
              className="w-full rounded border border-gray-300 bg-white pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none font-mono"
            >
              <option value="all">All Programs</option>
              <option value="Airbus A350">Airbus A350</option>
              <option value="Rolls-Royce Trent XWB">Rolls-Royce Trent XWB</option>
              <option value="Bombardier Global 7500">Bombardier Global 7500</option>
              <option value="Airbus A320neo">Airbus A320neo</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none font-mono"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Items List */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm space-y-2">
          <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-mono font-bold text-gray-700 uppercase">Executing Cross-User CollectionGroup Query...</p>
          <p className="text-[11px] text-gray-400 font-mono">Applying where(verificationStatus == 'pending') & where(confidenceScore &lt; 60)</p>
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase font-mono">Supervisor Review Queue Clear</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            All manufacturing inspection findings currently meet the verification threshold (confidence score &ge; 60 or verified). No low-confidence pending findings require supervisor intervention.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueue.map((item) => {
            const isCrit = item.severity === 'critical';
            const isMaj = item.severity === 'major';
            const score = item.confidenceScore ?? 50;
            const evalLabel = item.confidenceEvaluation || (score >= 80 ? 'HIGH' : score >= 60 ? 'MODERATE' : 'LOW');
            const isProcessing = processingId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-lg border border-gray-200 bg-white hover:border-blue-400 p-4 transition-all shadow-sm space-y-3"
              >
                {/* Header Row: Severity, Program, Confidence Score Pill */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                      isCrit
                        ? 'bg-red-50 text-red-700 border-red-300'
                        : isMaj
                        ? 'bg-orange-50 text-orange-700 border-orange-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}>
                      {item.severity}
                    </span>

                    <span className="font-mono text-xs font-bold text-blue-700">{item.program}</span>
                    <span className="text-gray-300">&bull;</span>
                    <span className="font-mono text-[11px] text-gray-600 font-semibold">P/N: {item.partNumber || 'N/A'}</span>
                    <span className="text-gray-300">&bull;</span>
                    <span className="font-mono text-[11px] text-gray-500">S/N: {item.serialNumber || 'N/A'}</span>
                  </div>

                  {/* Strict Schema Constraint Confidence Badge */}
                  <div className="flex items-center gap-2 font-mono">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border flex items-center gap-1 ${
                      score < 50
                        ? 'bg-red-50 text-red-700 border-red-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      <AlertTriangle className="h-3 w-3" />
                      <span>CONFIDENCE: {score}/100 [{evalLabel}]</span>
                    </span>

                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Finding Details */}
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-3 leading-relaxed font-mono">
                    {item.discrepancyText}
                  </p>
                </div>

                {/* Inspector Station & Facility Traceability */}
                <div className="p-2.5 rounded bg-gray-50 border border-gray-200 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 uppercase">Station / User:</span>
                    <span className="text-blue-700 font-semibold truncate max-w-xs">{item.userEmail || item.userId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 uppercase">Facility:</span>
                    <span className="text-gray-800 font-semibold">{item.facility}</span>
                    {item.blueprintLocation?.zone && (
                      <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {item.blueprintLocation.zone}
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Root Cause Assessment if available */}
                {item.analysis && (
                  <div className="p-2.5 rounded bg-blue-50/50 border border-blue-200 text-xs space-y-1 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase font-bold text-blue-700 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Gemini 3.6 Flash Assessment
                      </span>
                      <span className="font-mono text-[10px] text-blue-600 font-bold">FMEA: {item.analysis.fmeaScore}/100</span>
                    </div>
                    <p className="text-gray-800 text-[11px] leading-relaxed">
                      {item.analysis.executiveSummary}
                    </p>
                  </div>
                )}

                {/* Supervisor Disposition & Action Controls */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={reviewNotes[item.id] || ''}
                      onChange={(e) => setReviewNotes({ ...reviewNotes, [item.id]: e.target.value })}
                      placeholder="Enter supervisor disposition notes or NDT recalibration instructions..."
                      className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none font-mono"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecision(item, 'approved')}
                        disabled={isProcessing}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 rounded bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white transition-all uppercase tracking-tight shadow-sm disabled:opacity-50 whitespace-nowrap"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{isProcessing ? 'Verifying...' : 'Approve Finding'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDecision(item, 'rejected')}
                        disabled={isProcessing}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 rounded bg-red-600 hover:bg-red-700 px-3.5 py-1.5 text-xs font-bold text-white transition-all uppercase tracking-tight shadow-sm disabled:opacity-50 whitespace-nowrap"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject / Re-scan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectInspection(item)}
                        className="p-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all"
                        title="Open Full Inspection Form"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenChat(item)}
                        className="p-1.5 rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all"
                        title="Consult Gemini Copilot"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
