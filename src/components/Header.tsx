import React from "react";
import { User, signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import {
  Menu,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowRight,
  LogOut,
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
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  return (
    <header className="bg-[#F8F7F4] border-b border-[#1c1c1a]/10 px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between sticky top-0 z-20 transition-all">
      {/* Left: Navigation links matching Variation 3 */}
      <div className="flex items-center space-x-4 sm:space-x-8">
        {/* Mobile menu trigger */}
        <button
          id="btn-mobile-menu"
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded text-[#1c1c1a] hover:bg-[#1c1c1a]/5 md:hidden transition cursor-pointer"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="hidden md:flex items-center space-x-6">
          <button
            id="sidebar-btn-new-session"
            onClick={onNewInspection}
            className={`text-xs font-semibold tracking-wide transition cursor-pointer ${
              activeView === "inspect" && !hasActiveInspection
                ? "text-[#1c1c1a] underline decoration-[#2563eb] underline-offset-4"
                : "text-[#1c1c1a]/70 hover:text-[#1c1c1a]"
            }`}
          >
            New Session
          </button>
          <button
            id="sidebar-btn-history"
            onClick={() => setActiveView("history")}
            className={`text-xs font-semibold tracking-wide transition cursor-pointer flex items-center gap-1.5 ${
              activeView === "history"
                ? "text-[#1c1c1a] underline decoration-[#2563eb] underline-offset-4"
                : "text-[#1c1c1a]/70 hover:text-[#1c1c1a]"
            }`}
          >
            <span>History</span>
            <span className="font-mono-code text-[10px] bg-[#1c1c1a]/8 text-[#1c1c1a] px-1.5 py-0.2 rounded-xs">
              {inspectionsCount}
            </span>
          </button>
        </nav>
      </div>

      {/* Center: VisionScribe Brand Name in Cormorant Garamond */}
      <div className="text-center cursor-pointer" onClick={onNewInspection}>
        <h1 className="font-serif-display text-2xl sm:text-3xl italic tracking-tight font-semibold text-[#1c1c1a]">
          VisionScribe
        </h1>
      </div>

      {/* Right: System status & quick actions */}
      <div className="flex items-center space-x-3 sm:space-x-5 justify-end">
        <div className="hidden sm:flex items-center space-x-1.5 font-mono-code text-[10px] uppercase tracking-wider text-[#1c1c1a]/70">
          <span>System:</span>
          {syncing ? (
            <span className="flex items-center gap-1 text-[#2563eb] font-semibold">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Syncing</span>
            </span>
          ) : (
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online_Diagnostics</span>
            </span>
          )}
        </div>

        {user && hasActiveInspection && activeView === "inspect" && (
          <button
            id="btn-header-end-session"
            onClick={onNewInspection}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1c1c1a] text-[#1c1c1a] hover:bg-[#1c1c1a] hover:text-white font-mono-code text-[11px] uppercase tracking-wider transition cursor-pointer"
          >
            <span>New Session</span>
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
    </header>
  );
};

