import React from 'react';
import { 
  FileEdit, 
  MessageSquareText, 
  FileSpreadsheet, 
  History, 
  Crosshair, 
  ShieldCheck, 
  Plane, 
  Flame, 
  Sparkles,
  Zap,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { AerospaceProgram, UserRole } from '../types/inspection';

export type ActiveTab = 'journal' | 'chat' | 'ncr' | 'history' | 'blueprint' | 'compliance' | 'review';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLoadPreset: (program: AerospaceProgram) => void;
  openNcrCount: number;
  unreadChatCount?: number;
  userRole?: UserRole;
  pendingReviewCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onLoadPreset,
  openNcrCount,
  userRole = 'inspector',
  pendingReviewCount = 0,
}) => {
  const isSupervisor = userRole === 'supervisor';

  const navItems = [
    {
      id: 'journal' as ActiveTab,
      label: 'New Inspection Log',
      description: 'Write entry & AI reflection',
      icon: FileEdit,
      badge: null,
    },
    {
      id: 'chat' as ActiveTab,
      label: 'Gemini Copilot Chat',
      description: 'Multi-turn engineering dialogue',
      icon: MessageSquareText,
      badge: 'AI 3.6',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'review' as ActiveTab,
      label: 'Supervisor Queue',
      description: 'Cross-user pending triage',
      icon: ShieldAlert,
      badge: pendingReviewCount > 0 ? `${pendingReviewCount} Flagged` : isSupervisor ? 'Active' : 'Locked',
      badgeColor: pendingReviewCount > 0 
        ? 'bg-red-50 text-red-700 border-red-300' 
        : isSupervisor 
        ? 'bg-blue-50 text-blue-700 border-blue-200' 
        : 'bg-gray-100 text-gray-500 border-gray-200',
    },
    {
      id: 'ncr' as ActiveTab,
      label: '8D NCR Reports',
      description: 'AS9100 / FAA disposition',
      icon: FileSpreadsheet,
      badge: openNcrCount > 0 ? `${openNcrCount} Open` : null,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'history' as ActiveTab,
      label: 'Inspection History',
      description: 'Isolated user log archive',
      icon: History,
      badge: null,
    },
    {
      id: 'blueprint' as ActiveTab,
      label: 'Defect Blueprint Map',
      description: 'Airframe coordinate hotspots',
      icon: Crosshair,
      badge: 'GPS Pin',
      badgeColor: 'bg-gray-100 text-gray-700 border-gray-300',
    },
    {
      id: 'compliance' as ActiveTab,
      label: 'Audit & Compliance',
      description: 'Cryptographic SHA-256 trail',
      icon: ShieldCheck,
      badge: 'AS9100',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  const presets: { program: AerospaceProgram; label: string; company: string; icon: any; color: string }[] = [
    { program: 'Airbus A350', label: 'A350 CFRP Wing Delamination', company: 'Airbus Toulouse', icon: Plane, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { program: 'Rolls-Royce Trent XWB', label: 'Trent XWB Blade TBC Spallation', company: 'Rolls-Royce Derby', icon: Flame, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { program: 'Bombardier Global 7500', label: 'Global 7500 Rudder Hydraulic Split', company: 'Bombardier Mirabel', icon: Zap, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  ];

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4">
      
      {/* Primary Navigation Console */}
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
        <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold flex items-center justify-between border-b border-gray-100 mb-1">
          <span>Inspection Console</span>
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
        </div>

        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-all group ${
                  isActive
                    ? 'bg-blue-50/80 text-blue-900 border-l-4 border-l-blue-600 font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                <div className={`p-1.5 rounded transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:text-blue-600 group-hover:bg-gray-200'
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border uppercase ${
                        item.badgeColor || 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{item.description}</p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Enterprise Rapid Test Drive Presets */}
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-tight mb-1">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Test Scenarios</span>
        </div>
        <p className="text-[10px] text-gray-500 mb-2.5 leading-tight">
          Load verified inspection datasets for OEM evaluation:
        </p>

        <div className="space-y-1.5">
          {presets.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.program}
                onClick={() => onLoadPreset(preset.program)}
                className="w-full text-left p-2 rounded border border-gray-200 bg-gray-50/70 hover:bg-white hover:border-blue-400 transition-all group flex items-start gap-2"
              >
                <div className={`mt-0.5 p-1 rounded border ${preset.color}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold text-gray-500 uppercase">{preset.company}</span>
                    <span className="text-[9px] text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform uppercase">Load &rarr;</span>
                  </div>
                  <p className="text-[11px] font-medium text-gray-800 truncate mt-0.5">{preset.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Zero-Trust Isolation Status */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
        <div className="flex items-center gap-1.5 text-gray-800 font-bold mb-1 text-[11px] uppercase tracking-tight">
          <Lock className="h-3 w-3 text-emerald-600" />
          <span>User-Isolated Firestore</span>
        </div>
        <p className="text-[10px] text-gray-500 leading-tight">
          Isolated strictly under <code className="text-blue-700 font-mono text-[9px] font-bold">/users/{`{uid}`}/*</code> with SHA-256 audit log.
        </p>
      </div>

    </aside>
  );
};
