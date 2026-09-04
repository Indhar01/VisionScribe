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
} from "lucide-react";

interface InspectionHistoryProps {
  inspections: InspectionRecord[];
  onSelectInspection: (inspection: InspectionRecord) => void;
  onDeleteInspection: (id: string) => Promise<void>;
  onStartNewInspection: () => void;
  isLoading: boolean;
}

export const InspectionHistory: React.FC<InspectionHistoryProps> = ({
  inspections,
  onSelectInspection,
  onDeleteInspection,
  onStartNewInspection,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDisposition, setFilterDisposition] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

            return (
              <div
                key={record.id}
                onClick={() => onSelectInspection(record)}
                className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-xl p-5 shadow-2xs transition flex flex-col justify-between cursor-pointer group relative overflow-hidden"
              >
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
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadge(
                          sevScore
                        )}`}
                      >
                        Sev {sevScore}/5
                      </span>
                    </div>
                  </div>

                  {/* Machinery Part */}
                  <h3 className="text-base font-bold text-slate-900 mt-2.5 group-hover:text-blue-600 transition truncate">
                    {record.machineryPart}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {record.subsystem}
                  </p>

                  {/* Defect Classification Pill */}
                  <div className="mt-2.5">
                    <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block truncate max-w-full">
                      {ncr?.defectClassification || "Surface Defect"}
                    </span>
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
                      {ncr?.defectDescription || record.initialNotes}
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
                    <button
                      type="button"
                      title="Delete Record"
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
    </div>
  );
};
