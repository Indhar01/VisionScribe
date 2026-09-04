import React from "react";
import { User, signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import {
  PlusCircle,
  History,
  FileCheck2,
  ShieldCheck,
  LogOut,
  Sliders,
  Sparkles,
  Layers,
  ChevronRight,
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
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shadow-xl select-none">
      {/* Brand Identity */}
      <div className="p-6 flex items-center space-x-3 border-b border-slate-850">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0">
          V
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xl font-bold tracking-tight text-white block truncate">
            VisionScribe
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
            Quality Telemetry
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Inspection
        </div>

        <button
          id="sidebar-btn-new-session"
          onClick={() => {
            onNewInspection();
            if (onCloseMobile) onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            activeView === "inspect" && !hasActiveInspection
              ? "bg-slate-800 text-white font-semibold"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 border-2 border-white/80 rounded-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-xs" />
            </div>
            <span>New Session</span>
          </div>
          <PlusCircle className="w-4 h-4 text-slate-400" />
        </button>

        {hasActiveInspection && (
          <button
            id="sidebar-btn-active-ncr"
            onClick={() => {
              setActiveView("inspect");
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeView === "inspect"
                ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileCheck2 className="w-4 h-4 text-blue-400" />
              <span>Active N.C.R.</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          </button>
        )}

        <button
          id="sidebar-btn-history"
          onClick={() => {
            setActiveView("history");
            if (onCloseMobile) onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            activeView === "history"
              ? "bg-slate-800 text-white font-semibold"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <div className="flex items-center space-x-3">
            <History className="w-4 h-4 text-slate-400" />
            <span>History Log</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {inspectionsCount}
          </span>
        </button>

        <div className="pt-6 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Management
        </div>

        <div className="flex items-center justify-between px-3 py-2.5 rounded-md text-sm text-slate-400 hover:bg-slate-850 transition cursor-default">
          <div className="flex items-center space-x-3">
            <Layers className="w-4 h-4 text-slate-500" />
            <span>AS9100 / ISO 9001</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded border border-slate-700">
            Compliant
          </span>
        </div>

        <div className="flex items-center justify-between px-3 py-2.5 rounded-md text-sm text-slate-400 hover:bg-slate-850 transition cursor-default">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <span>Gemini Diagnostics</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded border border-slate-700">
            Online
          </span>
        </div>
      </div>

      {/* User Profile Bar */}
      {user ? (
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-800">
            <div className="flex items-center space-x-3 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Inspector"}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                  {getInitials(user.displayName, user.email)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">
                  {user.displayName || user.email?.split("@")[0] || "Quality Inspector"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user.email || "Inspector #4029"}
                </p>
              </div>
            </div>

            <button
              id="btn-sidebar-sign-out"
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Authentication Required
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
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 flex h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
