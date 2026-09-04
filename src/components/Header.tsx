import React from "react";
import { User } from "firebase/auth";
import {
  Menu,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface HeaderProps {
  user: User | null;
  activeView: "inspect" | "history";
  setActiveView: (view: "inspect" | "history") => void;
  onNewInspection: () => void;
  hasActiveInspection: boolean;
  onToggleMobileMenu?: () => void;
  inspectionsCount: number;
  syncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeView,
  setActiveView,
  onNewInspection,
  hasActiveInspection,
  onToggleMobileMenu,
  inspectionsCount,
  syncing,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shadow-xs sticky top-0 z-20">
      {/* Left: View title + System status indicator */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Mobile menu trigger */}
        <button
          id="btn-mobile-menu"
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden transition cursor-pointer"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 underline decoration-blue-500 underline-offset-8">
            {activeView === "inspect"
              ? hasActiveInspection
                ? "Active Non-Conformance Report"
                : "Active Inspection Session"
              : "Quality Inspection Journal"}
          </h1>

          <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-200 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
            <span>System Online</span>
          </div>
        </div>
      </div>

      {/* Right: Sync telemetry and action button */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="hidden sm:flex items-center text-xs font-medium text-slate-600">
          {syncing ? (
            <span className="flex items-center gap-1.5 text-blue-600">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing telemetry...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{inspectionsCount} Journal Records</span>
            </span>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-2">
            {hasActiveInspection && activeView === "inspect" ? (
              <button
                id="btn-header-end-session"
                onClick={onNewInspection}
                className="bg-blue-600 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>End Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                id="btn-header-new-session"
                onClick={onNewInspection}
                className="bg-blue-600 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Session</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
