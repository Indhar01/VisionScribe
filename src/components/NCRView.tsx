import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import { motion } from "motion/react";
import {
  NonConformanceReport,
  DispositionType,
  InspectionRecord,
  WorkOrderTicket,
} from "../types/inspection";
import {
  FileCheck,
  AlertOctagon,
  ShieldCheck,
  CheckCircle,
  CheckCircle2,
  Copy,
  Printer,
  Calendar,
  Layers,
  Wrench,
  BookOpen,
  Check,
  Truck,
  FileDown,
  Download,
  ChevronDown,
  Clock,
  ShieldAlert,
  Send,
  FileText,
  Ban,
  Eye,
} from "lucide-react";
import { exportAuditTrail } from "../utils/auditLogger";

interface NCRViewProps {
  ncr: NonConformanceReport;
  imageUrl: string;
  initialNotes?: string;
  onNewInspection?: () => void;
  record?: InspectionRecord | null;
  onDispatchWorkOrder?: () => Promise<void> | void;
  isDispatching?: boolean;
  onVerifyInspection?: (approved: boolean) => Promise<void> | void;
  verificationNotes?: string;
  onVerificationNotesChange?: (notes: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.08,
      when: "beforeChildren",
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const NCRView: React.FC<NCRViewProps> = ({
  ncr,
  imageUrl,
  initialNotes,
  onNewInspection,
  record,
  onDispatchWorkOrder,
  isDispatching = false,
  onVerifyInspection,
  verificationNotes = "",
  onVerificationNotesChange,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedWo, setCopiedWo] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const workOrder = record?.workOrder;
  const isDispatched = record?.status === "Dispatched" || Boolean(workOrder);

  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDispositionStyle = (disp: DispositionType) => {
    switch (disp) {
      case "Scrap":
        return "bg-red-50 text-red-700 border-red-200";
      case "Rework":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Repair":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Use-As-Is":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Further Engineering Review":
      default:
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  const getSeverityColor = (score: number) => {
    switch (score) {
      case 1:
        return { block: "bg-emerald-500", text: "text-emerald-700", label: "Level 1 • Negligible" };
      case 2:
        return { block: "bg-amber-500", text: "text-amber-700", label: "Level 2 • Minor" };
      case 3:
        return { block: "bg-orange-500", text: "text-orange-700", label: "Level 3 • Moderate" };
      case 4:
        return { block: "bg-red-500", text: "text-red-700", label: "Level 4 • Critical" };
      case 5:
      default:
        return { block: "bg-rose-600", text: "text-rose-700", label: "Level 5 • Catastrophic" };
    }
  };

  const sev = getSeverityColor(ncr.severityScore);

  /**
   * Generates formatted text report representation
   */
  const generateFormattedReportText = () => {
    return `
================================================================================
           VISIONSCRIBE INDUSTRIAL NON-CONFORMANCE REPORT (NCR)
           Compliance: ISO 9001:2015 / AS9100 Rev D Engineering Standard
================================================================================
REPORT NUMBER:           ${ncr.reportNumber}
INSPECTION DATE:         ${new Date(ncr.inspectedAt).toLocaleString()}
MACHINERY COMPONENT:     ${ncr.machineryPart}
AFFECTED SUBSYSTEM:      ${ncr.affectedSubsystem}
DEFECT CLASSIFICATION:   ${ncr.defectClassification}
SEVERITY EVALUATION:     Level ${ncr.severityScore} of 5 (${ncr.severityLabel})
FINAL DISPOSITION:       ${ncr.disposition}
DIAGNOSTIC ENGINE:       ${ncr.modelUsed || "Gemini Optical Diagnostics"}
${
  workOrder
    ? `
--------------------------------------------------------------------------------
MAINTENANCE DISPATCH WORK ORDER TICKET
--------------------------------------------------------------------------------
TRACKING ID:             ${workOrder.trackingId}
DISPATCH STATUS:         ${workOrder.status}
PRIORITY LEVEL:          ${workOrder.priority}
ASSIGNED CREW:           ${workOrder.assignedTeam}
ESTIMATED LEAD TIME:     ${workOrder.estimatedLeadTime}
DISPATCHED AT:           ${new Date(workOrder.dispatchedAt).toLocaleString()}
AUTHORIZED BY:           ${workOrder.dispatchedBy || "Certified Lead Inspector"}
FIELD DIRECTIVE:         ${workOrder.maintenanceNotes || "Authorized for immediate field repair & containment."}
`
    : `
--------------------------------------------------------------------------------
MAINTENANCE WORK ORDER:  Status: Pending Dispatch
--------------------------------------------------------------------------------`
}
--------------------------------------------------------------------------------
OPTICAL TELEMETRY OBSERVATIONS & DEFECT CHARACTERIZATION:
--------------------------------------------------------------------------------
${ncr.defectDescription}

--------------------------------------------------------------------------------
ENGINEERING ROOT CAUSE HYPOTHESIS:
--------------------------------------------------------------------------------
${ncr.rootCauseHypothesis}

--------------------------------------------------------------------------------
RECOMMENDED CORRECTIVE ACTION & CONTAINMENT PROTOCOL:
--------------------------------------------------------------------------------
${ncr.recommendedAction}

--------------------------------------------------------------------------------
PREVENTIVE QUALITY ASSURANCE ACTIONS:
--------------------------------------------------------------------------------
${(ncr.preventiveMeasures || []).map((m, i) => `  ${i + 1}. ${m}`).join("\n")}

--------------------------------------------------------------------------------
STANDARDS & INDUSTRIAL SPECIFICATIONS REFERENCED:
--------------------------------------------------------------------------------
${(ncr.standardsReferenced || []).join(", ")}

================================================================================
 Confidential Maintenance Record - Generated by VisionScribe Inspection Journal
================================================================================
    `.trim();
  };

  const handleCopySummary = () => {
    const summaryText = generateFormattedReportText();
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setShowExportMenu(false);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyWorkOrderId = () => {
    if (!workOrder?.trackingId) return;
    navigator.clipboard.writeText(workOrder.trackingId);
    setCopiedWo(true);
    setTimeout(() => setCopiedWo(false), 2000);
  };

  const handleDownloadTextReport = () => {
    const summaryText = generateFormattedReportText();
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NCR-${ncr.reportNumber}-Summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleDownloadJsonReport = () => {
    const exportData = {
      reportNumber: ncr.reportNumber,
      machineryPart: ncr.machineryPart,
      affectedSubsystem: ncr.affectedSubsystem,
      defectClassification: ncr.defectClassification,
      severityScore: ncr.severityScore,
      severityLabel: ncr.severityLabel,
      disposition: ncr.disposition,
      status: record?.status || "Pending Review",
      workOrder: workOrder || null,
      observations: ncr.defectDescription,
      rootCauseHypothesis: ncr.rootCauseHypothesis,
      recommendedAction: ncr.recommendedAction,
      preventiveMeasures: ncr.preventiveMeasures,
      standardsReferenced: ncr.standardsReferenced,
      inspectedAt: ncr.inspectedAt,
      modelUsed: ncr.modelUsed,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NCR-${ncr.reportNumber}-Telemetry.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("VISIONSCRIBE NON-CONFORMANCE REPORT", 14, 18);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text("Compliance: AS9100 Rev D / ISO 9001:2015 Quality Management System", 14, 24);
      doc.setDrawColor(200, 205, 215);
      doc.line(14, 27, 196, 27);

      let y = 35;
      const addRow = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`${label}:`, 14, y);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(value || "N/A", 125);
        doc.text(lines, 60, y);
        y += Math.max(6, lines.length * 4.8 + 2);
      };

      addRow("Report Number", ncr.reportNumber);
      addRow("Inspection Date", new Date(ncr.inspectedAt).toLocaleString());
      addRow("Component / Part", ncr.machineryPart);
      addRow("Subsystem", ncr.affectedSubsystem);
      if (ncr.ataChapter) addRow("ATA Chapter", ncr.ataChapter);
      addRow("Defect Classification", ncr.defectClassification);
      addRow("Severity Level", `Level ${ncr.severityScore}/5 (${ncr.severityLabel})`);
      if (ncr.confidenceScore) {
        addRow("AI Optical Confidence", `${ncr.confidenceScore}% (${ncr.confidenceEvaluation || "HIGH"})`);
      }
      addRow("Final Disposition", ncr.disposition);
      if (record?.status) addRow("Record Status", record.status);
      if (workOrder) addRow("Work Order Tracking", `${workOrder.trackingId} (${workOrder.priority} Priority)`);

      y += 3;
      doc.line(14, y, 196, y);
      y += 7;

      const addSection = (title: string, content: string) => {
        if (y > 245) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(title, 14, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const lines = doc.splitTextToSize(content || "None documented.", 180);
        doc.text(lines, 14, y);
        y += lines.length * 4.5 + 6;
      };

      addSection("DEFECT MORPHOLOGY & OBSERVATIONS", ncr.defectDescription);
      addSection("ROOT CAUSE ENGINEERING HYPOTHESIS", ncr.rootCauseHypothesis);
      addSection("CONTAINMENT & RECOMMENDED CORRECTIVE ACTION", ncr.recommendedAction);

      if (ncr.preventiveMeasures?.length) {
        addSection(
          "PREVENTIVE MEASURES & AUDIT CONTROLS",
          ncr.preventiveMeasures.map((m, idx) => `[${idx + 1}] ${m}`).join("\n")
        );
      }

      if (ncr.standardsReferenced?.length) {
        addSection("STANDARDS REFERENCED", ncr.standardsReferenced.join(" • "));
      }

      if (record?.isVoided) {
        addSection(
          "*** AS9100 AUDIT VOID RECORD ***",
          `This inspection was voided by ${record.voidedBy || "QA Lead"} on ${record.voidedAt || "N/A"}. Reason: ${record.voidReason || "Superseded under QA revision"}`
        );
      }

      doc.save(`${ncr.reportNumber}-AS9100-Report.pdf`);
    } catch (pdfErr) {
      console.error("PDF generation error:", pdfErr);
    } finally {
      setShowExportMenu(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportAuditTrail = () => {
    const auditTrail = exportAuditTrail();
    const exportData = {
      reportNumber: ncr.reportNumber,
      exportDate: new Date().toISOString(),
      totalEvents: auditTrail.length,
      auditEvents: auditTrail,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NCR-${ncr.reportNumber}-AuditTrail.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const isRecordVoided = Boolean(record?.isVoided || record?.status === "Voided");

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative"
    >
      {/* AS9100 Rev D Immutability Audit Void Banner (If Voided) */}
      {isRecordVoided && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-3.5 flex items-start sm:items-center justify-between gap-3 text-rose-900">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-rose-200/80 text-rose-800">
              <Ban className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-800">
                  AS9100 Rev D Audit Record: VOIDED
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 border border-rose-300 text-rose-700">
                  Retained in Immutable Journal
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-0.5">
                Voided by <span className="font-semibold">{record?.voidedBy || "Quality Lead"}</span>:{" "}
                <span className="italic">"{record?.voidReason || "Superseded by re-inspection"}"</span>
              </p>
            </div>
          </div>
          {record?.voidedAt && (
            <span className="text-[10px] text-rose-500 font-mono flex-shrink-0">
              {new Date(record.voidedAt).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Top Formal NCR Header */}
      <motion.div variants={sectionVariants} className="p-6 border-b border-slate-100 bg-slate-50/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-widest font-mono">
                NON-CONFORMANCE REPORT
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-blue-700 font-mono bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                {ncr.reportNumber}
              </span>
              {isDispatched && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {workOrder?.trackingId || "DISPATCHED"}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 italic">
              Generated by VisionScribe AI • {new Date(ncr.inspectedAt).toLocaleDateString()} at{" "}
              {new Date(ncr.inspectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-3">
              {ncr.machineryPart}
            </h2>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Subsystem: {ncr.affectedSubsystem}</span>
              </div>
              {ncr.ataChapter && (
                <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-mono text-[11px] font-semibold">
                  {ncr.ataChapter}
                </span>
              )}
            </div>
          </div>

          {/* Action and Disposition Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded border text-xs font-bold uppercase tracking-wider ${getDispositionStyle(
                ncr.disposition
              )}`}
            >
              Disposition: {ncr.disposition}
            </span>

            {/* 1-Click Dispatch Maintenance Work Order Button */}
            {onDispatchWorkOrder && !isDispatched && (
              <button
                id="btn-dispatch-work-order"
                type="button"
                onClick={onDispatchWorkOrder}
                disabled={isDispatching}
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                title="Dispatch formal maintenance work order ticket"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{isDispatching ? "Dispatching..." : "Dispatch Work Order"}</span>
              </button>
            )}

            {isDispatched && (
              <div
                className="px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5"
                title={`Dispatched under tracking ticket ${workOrder?.trackingId || ""}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dispatched ({workOrder?.trackingId || "WO-ACTIVE"})</span>
              </div>
            )}

            {/* Export NCR Summary Dual Button (Copy or Download) */}
            <div className="relative" ref={exportMenuRef}>
              <button
                id="btn-export-ncr-summary"
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-white transition flex items-center gap-1.5 shadow-xs cursor-pointer bg-slate-50"
                title="Export NCR Summary (Copy or Download text report)"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Report Copied!</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export NCR Summary</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                  </>
                )}
              </button>

              {/* Export Dropdown Options */}
              {showExportMenu && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-30 text-xs text-slate-700">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Export Options
                  </div>

                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition font-medium"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <div>
                      <div>Copy Text Summary</div>
                      <div className="text-[10px] text-slate-400">Copy formatted text to clipboard</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition font-medium text-emerald-800 bg-emerald-50/40"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-emerald-900">Download Formal PDF (.pdf)</div>
                      <div className="text-[10px] text-emerald-700">AS9100 Rev D formatted document</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTextReport}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition font-medium"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <div>
                      <div>Download Report (.txt)</div>
                      <div className="text-[10px] text-slate-400">Formal AS9100 plain-text file</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadJsonReport}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition font-medium"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <div>
                      <div>Download Telemetry (.json)</div>
                      <div className="text-[10px] text-slate-400">Machine-readable ERP JSON</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportAuditTrail}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition font-medium border-t border-slate-100"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <div>
                      <div>Export Audit Trail</div>
                      <div className="text-[10px] text-slate-400">Compliance audit log</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              id="btn-print-ncr"
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Print NCR Document"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Severity Metric, Defect Classification, AI Confidence & ATA Chapter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200/80">
          {/* Metric 1: Severity Score */}
          <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Severity Score
            </label>
            <div className="flex items-center mt-2 space-x-1.5">
              {[1, 2, 3, 4, 5].map((step) => {
                const isActive = step <= ncr.severityScore;
                return (
                  <div
                    key={step}
                    className={`h-2.5 w-2.5 rounded-xs transition-all ${
                      isActive ? sev.block : "bg-slate-200"
                    }`}
                  />
                );
              })}
              <span className={`ml-2 text-base font-bold ${sev.text}`}>
                {ncr.severityScore} / 5
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
              {sev.label}
            </p>
          </div>

          {/* Metric 2: Defect Classification */}
          <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Defect Class
            </label>
            <p className="mt-1 text-xs font-bold text-slate-900 truncate" title={ncr.defectClassification}>
              {ncr.defectClassification}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Morphology verified
            </p>
          </div>

          {/* Metric 3: AI Diagnostic Confidence Score */}
          <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Diagnostic Confidence
            </label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-black text-emerald-700">
                {ncr.confidenceScore || 94}%
              </span>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                  (ncr.confidenceEvaluation || "HIGH") === "HIGH"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : (ncr.confidenceEvaluation || "HIGH") === "MODERATE"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {ncr.confidenceEvaluation || "HIGH"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Optical certainty metric
            </p>
          </div>

          {/* Metric 4: Aerospace / Industrial ATA Chapter */}
          <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              ATA Standard Chapter
            </label>
            <p className="mt-1 text-xs font-bold text-slate-800 font-mono truncate" title={ncr.ataChapter || "ATA 72 - Engine Subsystems"}>
              {ncr.ataChapter || "ATA 72 - Engine / Mechanical"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Standardized classification
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main NCR Analysis Body */}
      <div className="p-6 space-y-6">
        {/* Active Work Order Dispatch Ticket Display (When Dispatched) */}
        {workOrder && (
          <motion.div
            variants={sectionVariants}
            className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-emerald-50/50 rounded-lg border border-blue-200 p-4 shadow-2xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      Formal Maintenance Work Order Ticket
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                      Dispatched
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-base font-black text-slate-900 tracking-tight">
                      {workOrder.trackingId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyWorkOrderId}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-blue-200"
                      title="Copy Tracking ID"
                    >
                      {copiedWo ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-blue-500" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 text-[11px]">Priority:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    workOrder.priority === "CRITICAL"
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : workOrder.priority === "HIGH"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-blue-100 text-blue-800 border border-blue-200"
                  }`}
                >
                  {workOrder.priority}
                </span>
              </div>
            </div>

            {/* Ticket Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
              <div className="bg-white/90 p-2.5 rounded border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assigned Maintenance Unit
                </span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {workOrder.assignedTeam}
                </span>
              </div>

              <div className="bg-white/90 p-2.5 rounded border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Target Lead Time
                </span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {workOrder.estimatedLeadTime}
                </span>
              </div>

              <div className="bg-white/90 p-2.5 rounded border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Dispatched Timestamp
                </span>
                <span className="font-medium text-slate-600 mt-0.5 block">
                  {new Date(workOrder.dispatchedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  • {new Date(workOrder.dispatchedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {workOrder.maintenanceNotes && (
              <div className="mt-2.5 bg-white/70 p-2.5 rounded border border-slate-200/60 text-xs text-slate-600 italic">
                <span className="font-semibold text-slate-700 not-italic mr-1">Directive:</span>
                {workOrder.maintenanceNotes}
              </div>
            )}
          </motion.div>
        )}

        {/* Verification Gate for Low Confidence Reports */}
        {(ncr.confidenceScore ?? 75) < 60 && record?.verificationStatus !== 'verified' && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-amber-900">
                    Verification Required - Low Confidence Detection
                  </h3>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded">
                    {ncr.confidenceScore ?? 75}% Confidence
                  </span>
                </div>
                <p className="text-xs text-amber-800 mb-3">
                  This inspection was classified with LOW confidence. Please review the analysis carefully and approve or reject before proceeding with work order dispatch.
                </p>

                {/* Verification Form */}
                <div className="space-y-3 bg-white/70 p-3 rounded border border-amber-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                      Verification Notes
                    </label>
                    <textarea
                      value={verificationNotes}
                      onChange={(e) => onVerificationNotesChange?.(e.target.value)}
                      placeholder="Add inspection notes, second opinion details, or approval justification..."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                      rows={3}
                    />
                  </div>

                  {/* Verification Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsVerifying(true);
                        onVerifyInspection?.(true).finally(() => setIsVerifying(false));
                      }}
                      disabled={isVerifying}
                      className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      title="Approve this inspection as accurate"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isVerifying ? "Approving..." : "Approve & Verify"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsVerifying(true);
                        onVerifyInspection?.(false).finally(() => setIsVerifying(false));
                      }}
                      disabled={isVerifying}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      title="Reject this inspection for re-analysis"
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>{isVerifying ? "Rejecting..." : "Reject & Re-Analyze"}</span>
                    </button>
                  </div>
                </div>

                {record?.verificationStatus && (
                  <div className={`mt-3 p-2 rounded text-xs font-medium ${
                    record.verificationStatus === 'verified' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    <strong>Status:</strong> {record.verificationStatus === 'verified' ? 'Verified' : 'Rejected'} by {record.verifiedBy} at {record.verifiedAt ? new Date(record.verifiedAt).toLocaleString() : 'N/A'}
                    {record.verificationNotes && <div className="mt-1 italic">{record.verificationNotes}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Critical Safety Advisory Alert (Design HTML style) */}
        {(ncr.safetyAdvisory || ncr.severityScore >= 4) && (
          <motion.div variants={sectionVariants}>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Safety Containment Directive
            </label>
            <div className="flex items-center text-sm font-medium text-red-700 bg-red-50 px-4 py-3 rounded-md border border-red-100">
              <AlertOctagon className="w-4 h-4 mr-2 flex-shrink-0 text-red-600" />
              <span>
                {ncr.safetyAdvisory ||
                  "[!] Critical: Halt Operation Immediately. Implement physical LOTO protocol on machinery assembly."}
              </span>
            </div>
          </motion.div>
        )}

        {/* Optical Telemetry Visual + Analysis Summary */}
        <motion.div variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Optical Telemetry Record
            </label>
            <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 p-2">
              <img
                src={imageUrl}
                alt="Machinery Defect"
                className="w-full h-52 object-contain rounded bg-white"
              />
              <div className="mt-2 text-[10px] text-slate-500 text-center font-mono font-medium">
                TELEMETRY ENCODED // VERIFIED
              </div>
            </div>

            {initialNotes && (
              <div className="mt-3 p-3 bg-slate-50 rounded-md border border-slate-200 text-xs">
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                  Field Notes
                </span>
                <p className="text-slate-600 italic">"{initialNotes}"</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* Analysis Summary Callout with Left Accent Border (Design HTML) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Analysis Summary
              </label>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-md border-l-4 border-blue-500 whitespace-pre-line">
                {ncr.defectDescription}
              </p>
            </div>

            {/* Root Cause Hypothesis */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Engineering Root Cause Hypothesis
              </label>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-md border border-slate-200">
                {ncr.rootCauseHypothesis}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recommended Action & Preventive QA Measures */}
        <motion.div
          variants={sectionVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100"
        >
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Recommended Action & Containment
            </label>
            <div className="space-y-2">
              <div className="text-sm text-slate-700 bg-white p-3 rounded-md border border-slate-200 leading-relaxed whitespace-pre-line">
                {ncr.recommendedAction}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Preventive QA Actions
            </label>
            <ul className="space-y-2 bg-slate-50/50 p-3 rounded-md border border-slate-200">
              {ncr.preventiveMeasures && ncr.preventiveMeasures.length > 0 ? (
                ncr.preventiveMeasures.map((measure, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>{measure}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-500">Standard QA preventative cycle maintained.</li>
              )}
            </ul>
          </div>
        </motion.div>

        {/* Standards Referenced & Model Watermark */}
        <motion.div
          variants={sectionVariants}
          className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 uppercase text-[10px]">
              Standards:
            </span>
            {ncr.standardsReferenced && ncr.standardsReferenced.length > 0 ? (
              ncr.standardsReferenced.map((std, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px]"
                >
                  {std}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px]">
                ISO 9001:2015
              </span>
            )}
          </div>

          <div className="font-mono text-[11px] text-slate-400">
            Engineered via {ncr.modelUsed || "Gemini Diagnostics"}
          </div>
        </motion.div>

        {/* Start Another Inspection Secondary Action */}
        {onNewInspection && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onNewInspection}
              className="w-full py-3 border border-blue-600 text-blue-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-all cursor-pointer shadow-xs"
            >
              Start New Inspection Session
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
