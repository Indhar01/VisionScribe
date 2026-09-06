import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  ExternalLink, 
  MessageSquare, 
  FileSpreadsheet, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Plane,
  Flame,
  Zap,
  Plus,
  ArrowRight
} from 'lucide-react';
import { InspectionEntry, AerospaceProgram, SeverityLevel } from '../types/inspection';

interface InspectionHistoryProps {
  inspections: InspectionEntry[];
  onSelectInspection: (entry: InspectionEntry) => void;
  onOpenChat: (entry: InspectionEntry) => void;
  onOpenNCR: (entry: InspectionEntry) => void;
  onDeleteInspection: (id: string) => void;
  onCreateNew: () => void;
}

export const InspectionHistory: React.FC<InspectionHistoryProps> = ({
  inspections,
  onSelectInspection,
  onOpenChat,
  onOpenNCR,
  onDeleteInspection,
  onCreateNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Filtered entries
  const filtered = inspections.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.discrepancyText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.partNumber && item.partNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.facility.toLowerCase().includes(searchTerm.toLowerCase());

    const matchProgram = selectedProgram === 'all' || item.program === selectedProgram;
    const matchSeverity = selectedSeverity === 'all' || item.severity === selectedSeverity;

    return matchSearch && matchProgram && matchSeverity;
  });

  // Analytics Metrics
  const totalCount = inspections.length;
  const criticalCount = inspections.filter((i) => i.severity === 'critical').length;
  const openNcrCount = inspections.filter((i) => i.ncrStatus === 'open' || i.ncrStatus === 'containment').length;
  const avgFmea = totalCount > 0 
    ? Math.round(inspections.reduce((acc, curr) => acc + (curr.fmeaScore || 50), 0) / totalCount)
    : 0;

  return (
    <div className="space-y-4">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <div className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
          <p className="text-[10px] font-mono uppercase text-gray-500 font-bold">Total Logs</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-mono font-extrabold text-gray-900">{totalCount}</span>
            <span className="text-[10px] font-mono font-semibold text-blue-600">Isolated</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
          <p className="text-[10px] font-mono uppercase text-gray-500 font-bold">Critical Severity</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-xl font-mono font-extrabold ${criticalCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {criticalCount}
            </span>
            <span className="text-[10px] font-mono font-semibold text-red-600">Grounding Risk</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
          <p className="text-[10px] font-mono uppercase text-gray-500 font-bold">Open 8D NCRs</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-mono font-extrabold text-amber-600">{openNcrCount}</span>
            <span className="text-[10px] font-mono font-semibold text-amber-600">Containment</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
          <p className="text-[10px] font-mono uppercase text-gray-500 font-bold">Avg FMEA Score</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-mono font-extrabold text-blue-700">{avgFmea}</span>
            <span className="text-[10px] font-mono text-gray-400">RPN / 100</span>
          </div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by part number, title, discrepancy narrative, or facility..."
              className="w-full rounded border border-gray-300 bg-white pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none font-mono"
            />
          </div>

          {/* Program Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">All Programs</option>
              <option value="Airbus A350">Airbus A350</option>
              <option value="Rolls-Royce Trent XWB">Rolls-Royce Trent XWB</option>
              <option value="Bombardier Global 7500">Bombardier Global 7500</option>
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>

            <button
              onClick={onCreateNew}
              className="flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white transition-all uppercase tracking-tight shadow-sm whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Entry</span>
            </button>
          </div>

        </div>
      </div>

      {/* Entries List */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center space-y-2.5 shadow-sm">
          <p className="text-xs font-bold text-gray-800 uppercase">No inspection records found</p>
          <p className="text-[11px] text-gray-500">Try adjusting search filters or create a new inspection log.</p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 rounded bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white transition-all uppercase tracking-tight mt-1"
          >
            <Plus className="h-3.5 w-3.5" /> Create First Inspection
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isCrit = item.severity === 'critical';
            const isMaj = item.severity === 'major';
            return (
              <div
                key={item.id}
                className="rounded-lg border border-gray-200 bg-white hover:border-blue-400 p-4 transition-all space-y-3 shadow-sm group"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                      isCrit
                        ? 'bg-red-50 text-red-700 border-red-300'
                        : isMaj
                        ? 'bg-orange-50 text-orange-700 border-orange-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}>
                      {item.severity}
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-700">{item.program}</span>
                    <span className="text-gray-300">&bull;</span>
                    <span className="font-mono text-[11px] text-gray-500">P/N: {item.partNumber || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[11px] font-mono text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-gray-300">&bull;</span>
                    <span className="text-gray-700">FMEA: <strong className="text-blue-700">{item.fmeaScore || 50}</strong></span>
                  </div>
                </div>

                {/* Main Body */}
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                    {item.discrepancyText}
                  </p>
                </div>

                {/* Location & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs border-t border-gray-100">
                  <div className="flex items-center gap-2.5 text-gray-500">
                    <span className="flex items-center gap-1 text-[11px]">
                      <MapPin className="h-3 w-3 text-blue-600" />
                      <span className="text-gray-700 truncate max-w-xs">{item.facility}</span>
                    </span>
                    {item.blueprintLocation?.zone && (
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-semibold">
                        {item.blueprintLocation.zone}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectInspection(item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 uppercase tracking-tight transition-all"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Edit Log</span>
                    </button>

                    <button
                      onClick={() => onOpenChat(item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700 hover:bg-blue-100 uppercase tracking-tight transition-all"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>Copilot</span>
                    </button>

                    <button
                      onClick={() => onOpenNCR(item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded border border-amber-200 bg-amber-50 text-xs font-bold text-amber-800 hover:bg-amber-100 uppercase tracking-tight transition-all"
                    >
                      <FileSpreadsheet className="h-3 w-3" />
                      <span>8D NCR</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete inspection record ${item.id}?`)) {
                          onDeleteInspection(item.id);
                        }
                      }}
                      className="p-1 rounded border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all"
                      title="Delete Record"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
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
