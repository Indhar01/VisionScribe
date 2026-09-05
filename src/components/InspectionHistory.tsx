import React, { useState } from "react";
import { InspectionRecord, DispositionType } from "../types/inspection";
import {
  Search,
  Filter,
  Calendar,
  Layers,
  ArrowUpRight,
  Trash2,
  AlertOctagon,
  FileCheck2,
  CheckCircle2,
  Clock,
  Plus,
  Ban,
  ShieldAlert,
  X,
} from "lucide-react";

interface InspectionHistoryProps {
  inspections: InspectionRecord[];
  onSelectInspection: (inspection: InspectionRecord) => void;
  onDeleteInspection: (id: string) => Promise<void>;
  onVoidInspection?: (id: string, reason: string) => Promise<void>;
  onStartNewInspection: () => void;
  isLoading: boolean;
}

export const InspectionHistory: React.FC<InspectionHistoryProps> = ({
  inspections,
  onSelectInspection,
  onDeleteInspection,
  onVoidInspection,
  onStartNewInspection,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDisposition, setFilterDisposition] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Voiding modal state
  const [voidRecord, setVoidRecord] = useState<InspectionRecord | null>(null);
  const [voidReason, setVoidReason] = useState<string>(
    "Component re-inspected under secondary NDT; report superseded."
  );
  const [isVoiding, setIsVoiding] = useState(false);

  const getSeverityBadge = (score: number) => {
    switch (score) {
      case 1:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case 2:
        return "bg-amber-50 text-amber-700 border-amber-200";
      case 3:
        return "bg-orange-50 text-orange-700 border-orange-200";
      case 4:
        return "bg-red-50 text-red-700 border-red-200";
      case 5:
      default:
        return "bg-rose-50 text-rose-700 border-rose-200";
    }
  };

  const getDispositionBadge = (disp: DispositionType) => {
    switch (disp) {
      case "Scrap":
        return "bg-red-50 text-red-700 border-red-200";
      case "Rework":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Repair":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Use-As-Is":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const filtered = inspections.filter((item) => {
    const matchesSearch =
      item.machineryPart.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subsystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ncr?.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ncr?.defectClassification.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDisp =
      filterDisposition === "ALL" || item.ncr?.disposition === filterDisposition;

    return matchesSearch && matchesDisp;
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this inspection record?")) {
      return;
    }

    try {
      setDeletingId(id);
      await onDeleteInspection(id);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenVoidModal = (e: React.MouseEvent, record: InspectionRecord) => {
    e.stopPropagation();
    setVoidRecord(record);
    setVoidReason("Component re-inspected under secondary NDT; report superseded.");
  };

  const handleConfirmVoid = async () => {
    if (!voidRecord || !onVoidInspection) return;
    try {
      setIsVoiding(true);
      await onVoidInspection(voidRecord.id, voidReason);
      setVoidRecord(null);
    } catch (err) {
      console.error("Void error:", err);
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Total Reports
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {inspections.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Isolated in Firestore</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Critical Alerts
          </div>
          <div className="text-2xl font-black text-red-600 mt-1">
            {inspections.filter((i) => (i.ncr?.severityScore || 0) >= 4).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Severity 4 & 5</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Scrap / Rework
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {
              inspections.filter(
                (i) => i.ncr?.disposition === "Scrap" || i.ncr?.disposition === "Rework"
              ).length
            }
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Actionable Dispositions</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Avg Severity
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {inspections.length > 0
              ? (
                  inspections.reduce((acc, i) => acc + (i.ncr?.severityScore || 1), 0) /
                  inspections.length
                ).toFixed(1)
              : "0.0"}
            <span className="text-xs font-normal text-slate-400"> / 5</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Quality Health Metric</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            id="input-search-history"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search part, report #, or defect..."
            className="w-full bg-slate-50/60 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-blue-600" />
            <span>Disposition:</span>
          </span>
          {["ALL", "Scrap", "Rework", "Repair", "Use-As-Is"].map((disp) => (
            <button
              key={disp}
              type="button"
              onClick={() => setFilterDisposition(disp)}
              className={`text-xs px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                filterDisposition === disp
                  ? "bg-blue-600 text-white font-semibold shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {disp}
            </button>
          ))}
        </div>
      </div>

      {/* History Grid */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-medium">
            Fetching isolated Firestore records...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto mb-3">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {inspections.length === 0
              ? "No Inspection Journal Entries Yet"
              : "No Reports Match Filter Criteria"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            {inspections.length === 0
              ? "Start an optical inspection session to generate and persist ISO 9001 non-conformance reports."
              : "Try adjusting your search keywords or clearing the disposition filter."}
          </p>
          {inspections.length === 0 && (
            <button
              type="button"
              onClick={onStartNewInspection}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Launch First Inspection Session</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((record) => {
            const isDeleting = deletingId === record.id;
            const ncr = record.ncr;
            const sevScore = ncr?.severityScore || 1;
            const isVoided = Boolean(record.isVoided || record.status === "Voided");

            return (
              <div
                key={record.id}
                onClick={() => onSelectInspection(record)}
                className={`bg-white border rounded-xl p-5 shadow-2xs transition flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                  isVoided
                    ? "border-rose-300 bg-rose-50/20 opacity-90"
                    : "border-slate-200 hover:border-blue-400 hover:shadow-md"
                }`}
              >
                {/* Diagonal Void Watermark / Stamp if Voided */}
                {isVoided && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 border border-rose-300 text-rose-700 text-[9px] font-black uppercase tracking-wider z-10">
                    <Ban className="w-3 h-3 text-rose-600" />
                    <span>VOIDED (AUDIT)</span>
                  </div>
                )}

                <div>
                  {/* Top Bar: Report # & Severity */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-blue-700 font-mono bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {ncr?.reportNumber || "NCR-GEN"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(record.status === "Dispatched" || record.workOrder) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-300 bg-blue-50 text-blue-800 uppercase tracking-tight">
                          {record.workOrder?.trackingId || "Dispatched"}
                        </span>
                      )}
                      {!isVoided && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadge(
                            sevScore
                          )}`}
                        >
                          Sev {sevScore}/5
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Machinery Part */}
                  <h3 className="text-base font-bold text-slate-900 mt-2.5 group-hover:text-blue-600 transition truncate">
                    {record.machineryPart}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {record.subsystem}
                  </p>

                  {/* Defect Classification Pill & ATA Chapter / Confidence */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block truncate max-w-full">
                      {ncr?.defectClassification || "Surface Defect"}
                    </span>
                    {ncr?.ataChapter && (
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                        {ncr.ataChapter}
                      </span>
                    )}
                    {ncr?.confidenceScore && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {ncr.confidenceScore}% Conf
                      </span>
                    )}
                  </div>

                  {/* Defect preview image & summary snippet */}
                  <div className="mt-3 flex gap-3 items-center">
                    <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      <img
                        src={record.imageUrl}
                        alt={record.machineryPart}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {isVoided && record.voidReason ? (
                        <span className="text-rose-700 font-medium italic">
                          [Void Reason]: {record.voidReason}
                        </span>
                      ) : (
                        ncr?.defectDescription || record.initialNotes
                      )}
                    </p>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    {ncr?.disposition && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getDispositionBadge(
                          ncr.disposition
                        )}`}
                      >
                        {ncr.disposition}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(record.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* AS9100 Rev D Void Button */}
                    {!isVoided && onVoidInspection && (
                      <button
                        type="button"
                        title="Void record with formal AS9100 / ISO audit trail"
                        onClick={(e) => handleOpenVoidModal(e, record)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Hard Delete Button */}
                    <button
                      type="button"
                      title="Permanently Delete Record"
                      onClick={(e) => handleDelete(e, record.id)}
                      disabled={isDeleting}
                      className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      {isDeleting ? (
                        <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="p-1 text-slate-400 group-hover:text-blue-600 transition">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AS9100 Rev D Audit Void Dialog Modal */}
      {voidRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          onClick={() => setVoidRecord(null)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">
                  AS9100 Audit Void Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVoidRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <span className="font-bold">AS9100 Rev D / ISO 9001 Immutability:</span> Voiding preserves the report in your secure audit journal while tagging it as invalid for production dispatch.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Quality Invalidation:
              </label>
              <textarea
                rows={3}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Specify why this inspection report is being voided..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-transparent font-medium"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() =>
                    setVoidReason("Superseded by subsequent laser / NDT scan.")
                  }
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Superseded
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setVoidReason("Optical artifact due to lighting glare; re-tested OK.")
                  }
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Lighting Artifact
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setVoidReason("Engineering disposition overridden per Chief Metallurgist.")
                  }
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Chief Metallurgist Override
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setVoidRecord(null)}
                disabled={isVoiding}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                disabled={isVoiding || !voidReason.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isVoiding ? "Voiding Record..." : "Confirm Quality Void"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
