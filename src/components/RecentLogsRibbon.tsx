import React from "react";
import { InspectionRecord } from "../types/inspection";
import { History, ChevronRight } from "lucide-react";

interface RecentLogsRibbonProps {
  inspections: InspectionRecord[];
  onSelectInspection: (inspection: InspectionRecord) => void;
  onViewAllHistory: () => void;
}

export const RecentLogsRibbon: React.FC<RecentLogsRibbonProps> = ({
  inspections,
  onSelectInspection,
  onViewAllHistory,
}) => {
  const getBadge = (severity: number = 1) => {
    if (severity <= 2) {
      return {
        bg: "bg-emerald-600 text-white",
        text: "OK",
      };
    }
    if (severity === 3) {
      return {
        bg: "bg-amber-600 text-white",
        text: "WARN",
      };
    }
    return {
      bg: "bg-rose-600 text-white",
      text: "FAIL",
    };
  };

  const displayList = inspections.slice(0, 6);

  return (
    <div className="h-20 bg-white border-t border-slate-200 px-4 sm:px-8 flex items-center space-x-4 sm:space-x-6 overflow-hidden flex-shrink-0 shadow-xs">
      <div className="flex-shrink-0 flex items-center space-x-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
          Recent Logs
        </span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest sm:hidden">
          Logs
        </span>
      </div>

      <div className="flex-1 flex items-center space-x-3 overflow-x-auto py-1 no-scrollbar">
        {displayList.length === 0 ? (
          <div className="text-xs text-slate-400 italic">
            No inspection logs saved yet. Submit optical telemetry above to begin tracking.
          </div>
        ) : (
          displayList.map((record, idx) => {
            const sev = record.ncr?.severityScore || 1;
            const badge = getBadge(sev);
            const isDispatched = record.status === "Dispatched" || Boolean(record.workOrder);
            const trackingId = record.workOrder?.trackingId;

            return (
              <button
                key={record.id}
                type="button"
                onClick={() => onSelectInspection(record)}
                className={`flex-shrink-0 w-52 sm:w-56 ${
                  isDispatched
                    ? "bg-blue-50/60 hover:bg-blue-100/60 border-blue-300"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                } border rounded-md p-2 flex items-center space-x-2.5 transition cursor-pointer text-left relative ${
                  idx > 2 ? "opacity-85 hover:opacity-100" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded text-white flex items-center justify-center text-[9px] font-black flex-shrink-0 ${badge.bg}`}
                >
                  {badge.text}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11px] font-bold text-slate-800 truncate uppercase">
                      {record.machineryPart}
                    </p>
                    {isDispatched && (
                      <span className="flex-shrink-0 text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-300 uppercase tracking-tight">
                        Dispatched
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-500 truncate flex items-center justify-between mt-0.5">
                    <span>
                      {new Date(record.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      • Sev {sev}/5
                    </span>
                    {trackingId && (
                      <span className="font-mono text-[9px] font-bold text-blue-700 bg-white px-1 rounded border border-blue-200">
                        {trackingId}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {inspections.length > 0 && (
        <button
          onClick={onViewAllHistory}
          className="flex-shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
        >
          <span className="hidden sm:inline">View All</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
