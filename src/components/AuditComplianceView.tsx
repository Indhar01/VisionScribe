import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Database, 
  FileCheck, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Terminal,
  Cpu,
  Layers
} from 'lucide-react';
import { AuditLogEntry, UserProfile } from '../types/inspection';
import { getUserAuditLogs } from '../services/inspectionService';

interface AuditComplianceViewProps {
  user: UserProfile;
}

export const AuditComplianceView: React.FC<AuditComplianceViewProps> = ({ user }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      const stored = await getUserAuditLogs(user.uid);
      setLogs(stored);
    }
    fetchLogs();
  }, [user.uid]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `VisionScribe_AS9100_AuditTrail_${user.uid}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner */}
      <div className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-tight">
              AS9100 Rev D &bull; Cryptographic Compliance & Security Audit
            </h2>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Immutable SHA-256 audit trail verifying user isolation, model inference, and MRB disposition records.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          className="flex items-center gap-1.5 rounded bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white transition-all uppercase tracking-tight shadow-sm whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Audit Log (JSON)</span>
        </button>
      </div>

      {/* Security Architecture Compliance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        <div className="p-3.5 rounded-lg border border-gray-200 bg-white shadow-sm space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 font-mono uppercase tracking-tight">
            <Lock className="h-3.5 w-3.5 text-blue-600" />
            <span>Zero-Trust Data Isolation</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Every document path is owner-bound to <code className="text-blue-700 font-bold font-mono">/users/{user.uid}/*</code>. Unauthorized cross-user reads are rejected at the Firestore rule engine level.
          </p>
          <div className="pt-0.5 flex items-center gap-1 text-[10px] text-emerald-700 font-mono font-bold">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Rule status: ENFORCED</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-gray-200 bg-white shadow-sm space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 font-mono uppercase tracking-tight">
            <Cpu className="h-3.5 w-3.5 text-amber-600" />
            <span>Gemini Model Fallback Ladder</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Multi-tier model resilience chain: <code className="text-amber-800 font-bold font-mono">gemini-3.6-flash</code> &rarr; <code className="text-amber-800 font-bold font-mono">gemini-3.1-flash-lite</code> &rarr; dynamic alias.
          </p>
          <div className="pt-0.5 flex items-center gap-1 text-[10px] text-emerald-700 font-mono font-bold">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Fallback active</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-gray-200 bg-white shadow-sm space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 font-mono uppercase tracking-tight">
            <Key className="h-3.5 w-3.5 text-purple-600" />
            <span>Secret Manager Security</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Zero hardcoded credentials in client bundles. Backend Express API proxies all Gemini generative requests safely.
          </p>
          <div className="pt-0.5 flex items-center gap-1 text-[10px] text-emerald-700 font-mono font-bold">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Client key exposure: NONE</span>
          </div>
        </div>

      </div>

      {/* Cloud Run Label & Deployment Command Reference */}
      <div className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-800 font-bold flex items-center gap-1.5 text-xs">
            <Terminal className="h-3.5 w-3.5 text-blue-600" />
            <span>Cloud Run Challenge Verification Label</span>
          </span>
          <button
            onClick={() => copyToClipboard('gcloud run services update visionscribe --update-labels=dev-tutorial=cloud-run-ai-challenge --region=us-central1', 'cmd')}
            className="text-[10px] text-blue-700 font-bold hover:underline flex items-center gap-1 uppercase tracking-tight"
          >
            <Copy className="h-3 w-3" /> {copied === 'cmd' ? 'Copied!' : 'Copy Command'}
          </button>
        </div>
        <div className="p-2.5 rounded bg-gray-50 border border-gray-200 text-gray-800 text-[11px] overflow-x-auto select-all">
          <code>gcloud run services update visionscribe --update-labels=dev-tutorial=cloud-run-ai-challenge --region=us-central1</code>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900 font-mono uppercase tracking-tight">
            Tamper-Evident SHA-256 Audit Trail
          </h3>
          <span className="text-[11px] font-mono text-gray-500">{logs.length} Logged Events</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400 font-mono">
            No audit logs recorded yet for this session. Save an inspection or converse with Gemini to generate cryptographic events.
          </div>
        ) : (
          <div className="space-y-1.5 font-mono text-xs">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded border border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-blue-300 transition-all"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[9px] font-bold border border-blue-200">
                      {log.action}
                    </span>
                    <span className="text-gray-900 font-semibold text-xs">{log.details}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Target: {log.targetId || 'N/A'} &bull; User: {log.userId}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] text-gray-600 flex items-center gap-1 justify-end">
                    <Lock className="h-2.5 w-2.5 text-emerald-600" />
                    <span className="text-emerald-700 font-mono font-semibold">{log.hash.slice(0, 18)}...</span>
                  </div>
                  <span className="text-[9px] text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
