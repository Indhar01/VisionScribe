import React, { useState } from "react";
import { InspectionRecord, DispositionType } from "../types/inspection";
import {
  Search,
  Filter,
  ArrowUpRight,
  Trash2,
  FileCheck2,
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
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case 2:
        return "bg-amber-50 text-amber-800 border-amber-200";
      case 3:
        return "bg-orange-50 text-orange-800 border-orange-200";
      case 4:
        return "bg-rose-50 text-rose-800 border-rose-200";
      case 5:
      default:
        return "bg-[#1c1c1a] text-white border-[#1c1c1a]";
    }
  };

  const getDispositionBadge = (disp: DispositionType) => {
    switch (disp) {
      case "Scrap":
        return "bg-red-50 text-red-800 border-red-200";
      case "Rework":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Repair":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "Use-As-Is":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
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
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1c1c1a]/10">
        <div>
          <span className="label-mono block mb-1">
            Section 02 // Historical Records
          </span>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold italic text-[#1c1c1a]">
            Inspection Journal Ledger
          </h2>
        </div>
        <button
          type="button"
          onClick={onStartNewInspection}
          className="px-4 py-2 bg-[#1c1c1a] hover:bg-[#1c1c1a]/90 text-white font-mono-code text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#2563eb]" />
          <span>New Inspection</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#1c1c1a]/10 p-4">
          <span className="label-mono block">
            Total Reports
          </span>
          <div className="text-2xl font-mono-code font-bold text-[#1c1c1a] mt-1">
            {inspections.length}
          </div>
          <div className="font-mono-code text-[10px] text-[#1c1c1a]/50 mt-0.5">Isolated in Firestore</div>
        </div>

        <div className="bg-white border border-[#1c1c1a]/10 p-4">
          <span className="label-mono block">
            Critical Alerts
          </span>
          <div className="text-2xl font-mono-code font-bold text-rose-700 mt-1">
            {inspections.filter((i) => (i.ncr?.severityScore || 0) >= 4).length}
          </div>
          <div className="font-mono-code text-[10px] text-[#1c1c1a]/50 mt-0.5">Severity 4 & 5</div>
        </div>

        <div className="bg-white border border-[#1c1c1a]/10 p-4">
          <span className="label-mono block">
            Scrap / Rework
          </span>
          <div className="text-2xl font-mono-code font-bold text-amber-700 mt-1">
            {
              inspections.filter(
                (i) => i.ncr?.disposition === "Scrap" || i.ncr?.disposition === "Rework"
              ).length
            }
          </div>
          <div className="font-mono-code text-[10px] text-[#1c1c1a]/50 mt-0.5">Actionable Dispositions</div>
        </div>

        <div className="bg-white border border-[#1c1c1a]/10 p-4">
          <span className="label-mono block">
            Avg Severity
          </span>
          <div className="text-2xl font-mono-code font-bold text-[#2563eb] mt-1">
            {inspections.length > 0
              ? (
                  inspections.reduce((acc, i) => acc + (i.ncr?.severityScore || 1), 0) /
                  inspections.length
                ).toFixed(1)
              : "0.0"}
            <span className="text-xs font-normal text-[#1c1c1a]/40"> / 5</span>
          </div>
          <div className="font-mono-code text-[10px] text-[#1c1c1a]/50 mt-0.5">Quality Health Index</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#1c1c1a]/10 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#1c1c1a]/40 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            id="input-search-history"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search part, report #, or defect..."
            className="w-full bg-[#fafafa] border border-[#1c1c1a]/15 pl-9 pr-4 py-1.5 font-mono-code text-xs text-[#1c1c1a] placeholder-[#1c1c1a]/40 focus:outline-none focus:border-[#2563eb] transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          <span className="label-mono mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#2563eb]" />
            <span>Disposition:</span>
          </span>
          {["ALL", "Scrap", "Rework", "Repair", "Use-As-Is"].map((disp) => (
            <button
              key={disp}
              type="button"
              onClick={() => setFilterDisposition(disp)}
              className={`text-xs px-2.5 py-1 font-mono-code transition whitespace-nowrap cursor-pointer ${
                filterDisposition === disp
                  ? "bg-[#1c1c1a] text-white font-semibold"
                  : "bg-white border border-[#1c1c1a]/15 text-[#1c1c1a]/70 hover:bg-[#fafafa]"
              }`}
            >
              {disp}
            </button>
          ))}
        </div>
      </div>

      {/* History Grid */}
      {isLoading ? (
        <div className="bg-white border border-[#1c1c1a]/10 p-12 text-center">
          <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-mono-code text-xs text-[#1c1c1a]/70">
            Fetching isolated Firestore records...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#1c1c1a]/10 p-12 text-center">
          <div className="w-12 h-12 bg-[#fafafa] border border-[#1c1c1a]/15 flex items-center justify-center text-[#2563eb] mx-auto mb-3">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h3 className="font-serif-display text-xl font-semibold italic text-[#1c1c1a]">
            {inspections.length === 0
              ? "No Inspection Journal Entries Yet"
              : "No Reports Match Filter Criteria"}
          </h3>
          <p className="text-xs text-[#1c1c1a]/60 max-w-sm mx-auto mt-1 leading-relaxed">
            {inspections.length === 0
              ? "Start an optical inspection session to generate and persist ISO 9001 non-conformance reports."
              : "Try adjusting your search keywords or clearing the disposition filter."}
          </p>
          {inspections.length === 0 && (
            <button
              type="button"
              onClick={onStartNewInspection}
              className="mt-4 px-4 py-2 bg-[#1c1c1a] hover:bg-[#1c1c1a]/90 text-white font-mono-code text-xs uppercase tracking-wider transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#2563eb]" />
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
                className={`bg-white border p-5 transition flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                  isVoided
                    ? "border-rose-300 bg-rose-50/20 opacity-90"
                    : "border-[#1c1c1a]/15 hover:border-[#1c1c1a] hover:shadow-xs"
                }`}
              >
                {/* Diagonal Void Watermark / Stamp if Voided */}
                {isVoided && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 border border-rose-300 text-rose-700 font-mono-code text-[9px] font-bold uppercase tracking-wider z-10">
                    <Ban className="w-3 h-3 text-rose-600" />
                    <span>VOIDED</span>
                  </div>
                )}

                <div>
                  {/* Top Bar: Report # & Severity */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-code text-[11px] font-semibold text-[#2563eb] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-xs">
                      {ncr?.reportNumber || "NCR-GEN"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(record.status === "Dispatched" || record.workOrder) && (
                        <span className="font-mono-code text-[9px] font-bold px-1.5 py-0.5 border border-[#2563eb]/40 bg-blue-50 text-[#2563eb] uppercase tracking-tight">
                          {record.workOrder?.trackingId || "Dispatched"}
                        </span>
                      )}
                      {!isVoided && (
                        <span
                          className={`font-mono-code text-[10px] font-bold px-2 py-0.5 border uppercase tracking-wider ${getSeverityBadge(
                            sevScore
                          )}`}
                        >
                          Sev {sevScore}/5
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Machinery Part */}
                  <h3 className="font-serif-display text-lg font-semibold italic text-[#1c1c1a] mt-2.5 group-hover:text-[#2563eb] transition truncate">
                    {record.machineryPart}
                  </h3>
                  <p className="font-mono-code text-xs text-[#1c1c1a]/60 mt-0.5 truncate">
                    {record.subsystem}
                  </p>

                  {/* Defect Classification Pill & ATA Chapter / Confidence */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono-code text-[10px] font-medium text-[#1c1c1a] bg-[#fafafa] px-2 py-0.5 border border-[#1c1c1a]/15 inline-block truncate max-w-full">
                      {ncr?.defectClassification || "Surface Defect"}
                    </span>
                    {ncr?.ataChapter && (
                      <span className="font-mono-code text-[10px] text-[#1c1c1a]/70 bg-[#fafafa] px-1.5 py-0.5 border border-[#1c1c1a]/15">
                        {ncr.ataChapter}
                      </span>
                    )}
                    {ncr?.confidenceScore && (
                      <span className="font-mono-code text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
                        {ncr.confidenceScore}% Conf
                      </span>
                    )}
                  </div>

                  {/* Defect preview image & summary snippet */}
                  <div className="mt-3 flex gap-3 items-center">
                    <div className="w-14 h-14 bg-[#fafafa] border border-[#1c1c1a]/15 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      <img
                        src={record.imageUrl}
                        alt={record.machineryPart}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-[#1c1c1a]/70 line-clamp-2 leading-relaxed">
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
                <div className="mt-4 pt-3 border-t border-[#1c1c1a]/10 flex items-center justify-between text-xs text-[#1c1c1a]/60">
                  <div className="flex items-center gap-2">
                    {ncr?.disposition && (
                      <span
                        className={`font-mono-code text-[9px] font-bold px-1.5 py-0.5 border uppercase ${getDispositionBadge(
                          ncr.disposition
                        )}`}
                      >
                        {ncr.disposition}
                      </span>
                    )}
                    <span className="font-mono-code text-[10px] text-[#1c1c1a]/50">
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
                        className="p-1.5 text-[#1c1c1a]/40 hover:text-rose-600 transition cursor-pointer"
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
                      className="p-1.5 text-[#1c1c1a]/40 hover:text-red-600 transition cursor-pointer"
                    >
                      {isDeleting ? (
                        <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="p-1 text-[#1c1c1a]/40 group-hover:text-[#2563eb] transition">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c1a]/60 backdrop-blur-xs p-4"
          onClick={() => setVoidRecord(null)}
        >
          <div
            className="bg-white max-w-md w-full p-6 border border-[#1c1c1a]/20 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-serif-display text-lg font-semibold italic text-[#1c1c1a]">
                  AS9100 Audit Void Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVoidRecord(null)}
                className="p-1 text-[#1c1c1a]/40 hover:text-[#1c1c1a] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed font-mono-code">
              <span className="font-bold">AS9100 Rev D / ISO 9001 Immutability:</span> Voiding preserves the report in your secure audit journal while tagging it as invalid for production dispatch.
            </div>

            <div>
              <label className="label-mono block mb-1">
                Reason for Quality Invalidation:
              </label>
              <textarea
                rows={3}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Specify why this inspection report is being voided..."
                className="w-full text-xs p-2.5 border border-[#1c1c1a]/20 focus:border-[#2563eb] outline-none font-medium bg-white"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() =>
                    setVoidReason("Superseded by subsequent laser / NDT scan.")
                  }
                  className="font-mono-code text-[10px] px-2 py-0.5 bg-[#fafafa] border border-[#1c1c1a]/15 text-[#1c1c1a] hover:bg-white cursor-pointer"
                >
                  Superseded
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setVoidReason("Optical artifact due to lighting glare; re-tested OK.")
                  }
                  className="font-mono-code text-[10px] px-2 py-0.5 bg-[#fafafa] border border-[#1c1c1a]/15 text-[#1c1c1a] hover:bg-white cursor-pointer"
                >
                  Lighting Artifact
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setVoidReason("Engineering disposition overridden per Chief Metallurgist.")
                  }
                  className="font-mono-code text-[10px] px-2 py-0.5 bg-[#fafafa] border border-[#1c1c1a]/15 text-[#1c1c1a] hover:bg-white cursor-pointer"
                >
                  Chief Metallurgist Override
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1c1c1a]/10">
              <button
                type="button"
                onClick={() => setVoidRecord(null)}
                disabled={isVoiding}
                className="px-3.5 py-2 font-mono-code text-xs text-[#1c1c1a]/70 hover:bg-[#fafafa] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                disabled={isVoiding || !voidReason.trim()}
                className="px-4 py-2 font-mono-code text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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

