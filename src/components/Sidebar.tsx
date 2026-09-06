import React from "react";
import { User, signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import {
  Plus,
  History,
  FileCheck2,
  LogOut,
  Sparkles,
  Layers,
  X,
} from "lucide-react";

interface SidebarProps {
  user: User | null;
  activeView: "inspect" | "history";
  setActiveView: (view: "inspect" | "history") => void;
  onNewInspection: () => void;
  hasActiveInspection: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  inspectionsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeView,
  setActiveView,
  onNewInspection,
  hasActiveInspection,
  isOpenMobile,
  onCloseMobile,
  inspectionsCount,
}) => {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "VI";
  };

  const sidebarContent = (
    <div className="w-72 bg-[#F8F7F4] text-[#1c1c1a] flex flex-col h-full border-r border-[#1c1c1a]/10 select-none p-6 justify-between">
      {/* Brand & Section 01 */}
      <div>
        <div className="pb-6 mb-6 border-b border-[#1c1c1a]/10 flex items-center justify-between">
          <div>
            <h1 className="font-serif-display text-2xl font-bold italic tracking-tight text-[#1c1c1a]">
              VisionScribe
            </h1>
            <span className="label-mono mt-0.5 block">Quality Telemetry</span>
          </div>
          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded hover:bg-[#1c1c1a]/5 text-[#1c1c1a]/70 md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Section 01 */}
        <div className="space-y-1 mb-8">
          <span className="label-mono mb-2 block">[01] Inspection</span>

          <button
            id="sidebar-btn-new-session"
            onClick={() => {
              onNewInspection();
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xs text-xs font-semibold tracking-wide transition cursor-pointer border ${
              activeView === "inspect" && !hasActiveInspection
                ? "bg-[#1c1c1a] text-white border-[#1c1c1a]"
                : "border-transparent text-[#1c1c1a]/80 hover:bg-[#1c1c1a]/5 hover:text-[#1c1c1a]"
            }`}
          >
            <span>New Session</span>
            <Plus className="w-3.5 h-3.5" />
          </button>

          {hasActiveInspection && (
            <button
              id="sidebar-btn-active-ncr"
              onClick={() => {
                setActiveView("inspect");
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xs text-xs font-semibold tracking-wide transition cursor-pointer border ${
                activeView === "inspect"
                  ? "bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]/30"
                  : "border-transparent text-[#1c1c1a]/80 hover:bg-[#1c1c1a]/5"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>Active N.C.R.</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-pulse" />
            </button>
          )}

          <button
            id="sidebar-btn-history"
            onClick={() => {
              setActiveView("history");
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xs text-xs font-semibold tracking-wide transition cursor-pointer border ${
              activeView === "history"
                ? "bg-[#1c1c1a] text-white border-[#1c1c1a]"
                : "border-transparent text-[#1c1c1a]/80 hover:bg-[#1c1c1a]/5 hover:text-[#1c1c1a]"
            }`}
          >
            <div className="flex items-center space-x-2">
              <History className="w-3.5 h-3.5" />
              <span>History Log</span>
            </div>
            <span className="font-mono-code text-[10px] px-1.5 py-0.2 rounded-xs bg-[#1c1c1a]/10 text-inherit">
              {inspectionsCount}
            </span>
          </button>
        </div>

        {/* Navigation Section 02 - Compliance */}
        <div className="space-y-2">
          <span className="label-mono mb-2 block">[02] Compliance</span>

          <div className="flex items-center justify-between px-3.5 py-2 rounded-xs text-xs text-[#1c1c1a]/70 border border-[#1c1c1a]/8 bg-white/60">
            <div className="flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5 text-[#1c1c1a]/50" />
              <span>AS9100 / ISO 9001</span>
            </div>
            <span className="font-mono-code text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-xs border border-emerald-200 uppercase font-semibold">
              Compliant
            </span>
          </div>

          <div className="flex items-center justify-between px-3.5 py-2 rounded-xs text-xs text-[#1c1c1a]/70 border border-[#1c1c1a]/8 bg-white/60">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>Gemini Engine</span>
            </div>
            <span className="font-mono-code text-[9px] bg-blue-50 text-[#2563eb] px-1.5 py-0.5 rounded-xs border border-blue-200 uppercase font-semibold">
              Online
            </span>
          </div>
        </div>
      </div>

      {/* User Profile Block */}
      {user ? (
        <div className="pt-4 border-t border-[#1c1c1a]/10 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "Inspector"}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-[#1c1c1a]/15 object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#1c1c1a] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {getInitials(user.displayName, user.email)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#1c1c1a] truncate">
                {user.displayName || user.email?.split("@")[0] || "INSPECTOR"}
              </p>
              <p className="font-mono-code text-[10px] text-[#1c1c1a]/60 truncate">
                {user.email || "inspector@plant.org"}
              </p>
            </div>
          </div>

          <button
            id="btn-sidebar-sign-out"
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 rounded text-[#1c1c1a]/60 hover:text-red-600 hover:bg-red-50 transition cursor-pointer flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="pt-4 border-t border-[#1c1c1a]/10 text-center">
          <span className="label-mono">Authentication Required</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-[#1c1c1a]/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 flex h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};

