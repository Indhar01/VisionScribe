import React from "react";
import { InspectionRecord } from "../types/inspection";
import { ChevronRight } from "lucide-react";

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
        bg: "bg-emerald-700 text-white",
        text: "PASS",
      };
    }
    if (severity === 3) {
      return {
        bg: "bg-amber-600 text-white",
        text: "WARN",
      };
    }
    return {
      bg: "bg-[#1c1c1a] text-white",
      text: "FAIL",
    };
  };

  const displayList = inspections.slice(0, 6);

  return (
    <div className="bg-white border-t border-[#1c1c1a]/10 px-4 sm:px-8 py-3 flex items-center space-x-4 sm:space-x-6 overflow-hidden flex-shrink-0">
      <div className="flex-shrink-0">
        <span className="label-mono block">
          Recent Records
        </span>
      </div>

      <div className="flex-1 flex items-center space-x-3 overflow-x-auto py-1 no-scrollbar">
        {displayList.length === 0 ? (
          <div className="text-xs text-[#1c1c1a]/50 italic">
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
                className={`flex-shrink-0 w-52 sm:w-60 bg-white hover:bg-[#fafafa] border ${
                  isDispatched ? "border-[#2563eb]/40" : "border-[#1c1c1a]/15"
                } rounded-xs p-2.5 flex items-center space-x-2.5 transition cursor-pointer text-left relative ${
                  idx > 3 ? "opacity-80 hover:opacity-100" : ""
                }`}
              >
                <div
                  className={`px-1.5 py-1 font-mono-code text-[9px] font-bold rounded-none flex items-center justify-center flex-shrink-0 ${badge.bg}`}
                >
                  {badge.text}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-[#1c1c1a] truncate">
                      {record.machineryPart}
                    </p>
                  </div>
                  <div className="font-mono-code text-[10px] text-[#1c1c1a]/60 truncate flex items-center justify-between mt-0.5">
                    <span>
                      {trackingId ? trackingId : `SEV ${sev}/5`}
                    </span>
                    {isDispatched && (
                      <span className="text-[#2563eb] font-semibold">
                        Dispatched
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
          className="flex-shrink-0 font-mono-code text-[11px] text-[#2563eb] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
        >
          <span>View Ledger</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

