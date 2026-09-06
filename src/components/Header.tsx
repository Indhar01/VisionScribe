import React from 'react';
import { Shield, Sparkles, Building2, UserCircle, LogOut, Radio } from 'lucide-react';
import { UserProfile, UserRole } from '../types/inspection';

interface HeaderProps {
  user: UserProfile;
  onLogout: () => void;
  onRoleChange: (role: UserRole) => void;
  isOnline: boolean;
  totalEntries: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onRoleChange,
  isOnline,
  totalEntries,
}) => {
  const roleNames: Record<UserRole, { label: string; badge: string; color: string }> = {
    inspector: { label: 'Quality Inspector (L1)', badge: 'NDI / Visual', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    supervisor: { label: 'Quality Supervisor', badge: 'MRB Triage Gate', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    quality_lead: { label: 'AS9100 Quality Lead', badge: 'MRB Authority', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    chief_engineer: { label: 'Chief Flight Engineer', badge: 'Sign-Off DER', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    auditor: { label: 'Regulatory Auditor', badge: 'FAA / EASA', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  return (
    <header className="sticky top-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm">
      
      {/* Brand & Suite Identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F172A] text-blue-400 font-bold shadow-sm">
          <Shield className="h-4.5 w-4.5 text-blue-400" />
        </div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight uppercase">
            AeroReflect Intelligence Suite
          </h1>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-green-50 text-green-700 text-[10px] font-bold border border-green-200 uppercase tracking-tight">
            Firestore Protected
          </span>
        </div>
      </div>

      {/* Enterprise Project Context & Telemetry */}
      <div className="hidden lg:flex items-center gap-3 text-xs">
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="font-semibold text-gray-700 uppercase tracking-wider text-[11px]">
            Project: XWB-A350-GEN2
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded border border-gray-200 text-gray-600 text-[11px] font-mono">
          <Building2 className="h-3 w-3 text-blue-600" />
          <span className="truncate max-w-[140px]">{user.facilityBadge || 'Toulouse / Derby'}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded border border-gray-200 text-gray-600 text-[11px] font-mono">
          <Radio className="h-3 w-3 text-emerald-600" />
          <span>Logs: <strong className="text-gray-900 font-bold">{totalEntries}</strong></span>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded border border-gray-200 text-gray-600 text-[11px]">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span className="font-medium text-gray-700">Gemini 3.6</span>
        </div>
      </div>

      {/* User Controls & RBAC */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Selector */}
        <select
          value={user.role}
          onChange={(e) => onRoleChange(e.target.value as UserRole)}
          className={`rounded border px-2 py-1 text-[11px] font-bold uppercase tracking-tight outline-none cursor-pointer transition-all ${roleNames[user.role].color}`}
          title="Switch RBAC Inspection Authority"
        >
          <option value="inspector">Inspector (L1)</option>
          <option value="supervisor">Quality Supervisor</option>
          <option value="quality_lead">AS9100 Lead (MRB)</option>
          <option value="chief_engineer">Chief Engineer</option>
          <option value="auditor">Auditor (FAA/EASA)</option>
        </select>

        {/* User Badge */}
        <div className="flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded border border-gray-200">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} className="h-5 w-5 rounded-full ring-1 ring-blue-500" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-[10px] font-bold">
              {(user.displayName || user.email || 'U').substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <p className="text-[11px] font-bold text-gray-900 leading-tight truncate max-w-[110px]">
              {user.displayName || user.email?.split('@')[0] || 'Quality Inspector'}
            </p>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={onLogout}
          className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Sign Out / Switch Session"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>

    </header>
  );
};
