import React, { useState } from 'react';
import { Crosshair, MapPin, Layers, Info, Check, ShieldAlert, Cpu } from 'lucide-react';
import { AerospaceProgram, DefectCoordinates, InspectionEntry } from '../types/inspection';

interface BlueprintVisualizerProps {
  program: AerospaceProgram;
  selectedLocation?: DefectCoordinates;
  onSelectLocation?: (location: DefectCoordinates) => void;
  existingInspections?: InspectionEntry[];
  readOnly?: boolean;
}

export const BlueprintVisualizer: React.FC<BlueprintVisualizerProps> = ({
  program,
  selectedLocation,
  onSelectLocation,
  existingInspections = [],
  readOnly = false,
}) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Map click to coordinate
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly || !onSelectLocation) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    let zone = 'General Airframe Zone';
    if (program.includes('Trent') || program.includes('Pearl')) {
      if (x < 30) zone = 'Fan Rotor & Containment Casing';
      else if (x < 55) zone = 'High-Pressure Compressor (HPC) Core';
      else if (x < 75) zone = 'High-Pressure Turbine (HPT) Stage 1/2';
      else zone = 'Exhaust Mixer & Afterbody';
    } else {
      if (x < 30) zone = 'Nosecone & Forward Avionics Bay';
      else if (x > 75) zone = 'Empennage / Horizontal Stabilizer';
      else if (y < 40) zone = 'Port Main Wing Spar & Flap Track';
      else if (y > 60) zone = 'Starboard Main Wing Spar & Slat';
      else zone = 'Center Wing Box & Main Fuselage Frame';
    }

    onSelectLocation({ x, y, zone });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Crosshair className="h-4 w-4 text-blue-600" />
          <h4 className="text-xs font-bold text-gray-900 font-mono uppercase tracking-tight">
            {program} Blueprint Coordinate Locator
          </h4>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
          {!readOnly && (
            <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-tight">
              Click schematic to pin
            </span>
          )}
          {selectedLocation && (
            <span className="text-gray-800 font-semibold">
              ({selectedLocation.x}%, {selectedLocation.y}%) - {selectedLocation.zone}
            </span>
          )}
        </div>
      </div>

      {/* Interactive Blueprint Schematic Container */}
      <div className="relative rounded border border-gray-300 bg-slate-950 p-3 overflow-hidden select-none">
        
        {/* Technical Coordinate Overlay Lines */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

        <svg
          viewBox="0 0 800 400"
          className={`w-full h-auto max-h-[300px] transition-all ${readOnly ? '' : 'cursor-crosshair'}`}
          onClick={handleSvgClick}
        >
          <defs>
            <linearGradient id="blueprintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </linearGradient>
            <radialGradient id="pulseGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Airframe or Turbofan Schematic Paths based on Program */}
          {program.includes('Trent') || program.includes('Pearl') ? (
            /* Turbofan Engine Cross Section Blueprint */
            <g id="engine-schematic" stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.85">
              {/* Outer Nacelle Cowling */}
              <path d="M 60 120 C 140 100, 650 100, 740 140 L 740 260 C 650 300, 140 300, 60 280 Z" strokeDasharray="4 2" fill="url(#blueprintGrad)" />
              {/* Fan Spinner & Blade Rotor */}
              <path d="M 60 200 L 140 130 L 160 130 L 130 200 L 160 270 L 140 270 Z" fill="#0369a1" fillOpacity="0.4" />
              <circle cx="80" cy="200" r="18" fill="#38bdf8" fillOpacity="0.6" />
              {/* Core Shaft & Compressor Spools */}
              <rect x="180" y="170" width="180" height="60" rx="4" fill="#0c4a6e" fillOpacity="0.5" />
              <line x1="180" y1="185" x2="360" y2="185" stroke="#7dd3fc" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="180" y1="215" x2="360" y2="215" stroke="#7dd3fc" strokeWidth="1" strokeDasharray="3 3" />
              {/* Combustor Annulus */}
              <ellipse cx="420" cy="200" rx="45" ry="32" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" />
              {/* High Pressure Turbine Stage 1/2 */}
              <rect x="500" y="160" width="60" height="80" rx="3" fill="#ef4444" fillOpacity="0.25" stroke="#ef4444" />
              <line x1="530" y1="160" x2="530" y2="240" stroke="#f87171" strokeWidth="1" />
              {/* Low Pressure Turbine */}
              <rect x="580" y="150" width="70" height="100" rx="3" fill="#0284c7" fillOpacity="0.3" />
              {/* Core Exhaust Nozzle */}
              <path d="M 660 160 L 730 180 L 730 220 L 660 240 Z" fill="#0369a1" fillOpacity="0.4" />
              {/* Dimension Scale Lines */}
              <line x1="60" y1="340" x2="740" y2="340" stroke="#94a3b8" strokeWidth="1" />
              <line x1="60" y1="335" x2="60" y2="345" stroke="#94a3b8" strokeWidth="1" />
              <line x1="740" y1="335" x2="740" y2="345" stroke="#94a3b8" strokeWidth="1" />
              <text x="400" y="360" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="JetBrains Mono">
                TURBOFAN PROPULSION CORE LENGTH: 4,490 MM
              </text>
            </g>
          ) : (
            /* Commercial Aircraft Airframe Blueprint (Airbus / Bombardier) */
            <g id="airframe-schematic" stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.85">
              {/* Fuselage Profile */}
              <path d="M 80 200 C 140 180, 680 180, 720 200 C 680 220, 140 220, 80 200 Z" fill="url(#blueprintGrad)" />
              {/* Nose Radome */}
              <path d="M 80 200 Q 110 185 140 185 L 140 215 Q 110 215 80 200 Z" fill="#0284c7" fillOpacity="0.3" />
              {/* Port Wing (Top) */}
              <path d="M 320 185 L 420 50 L 460 50 L 440 185 Z" fill="#0c4a6e" fillOpacity="0.4" />
              {/* Starboard Wing (Bottom) */}
              <path d="M 320 215 L 420 350 L 460 350 L 440 215 Z" fill="#0c4a6e" fillOpacity="0.4" />
              {/* Engines on Wings */}
              <rect x="360" y="80" width="40" height="20" rx="3" fill="#0284c7" stroke="#38bdf8" />
              <rect x="360" y="300" width="40" height="20" rx="3" fill="#0284c7" stroke="#38bdf8" />
              {/* Horizontal Stabilizers & Tail Fin */}
              <path d="M 660 190 L 720 120 L 740 120 L 710 190 Z" fill="#0369a1" fillOpacity="0.4" />
              <path d="M 660 210 L 720 280 L 740 280 L 710 210 Z" fill="#0369a1" fillOpacity="0.4" />
              {/* Fuselage Stringers */}
              <line x1="180" y1="200" x2="650" y2="200" stroke="#7dd3fc" strokeWidth="1" strokeDasharray="5 5" />
              {/* Dimension Lines */}
              <line x1="80" y1="380" x2="720" y2="380" stroke="#94a3b8" strokeWidth="1" />
              <text x="400" y="395" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="JetBrains Mono">
                AIRFRAME SPAN / DATUM REFERENCE WL 100.00
              </text>
            </g>
          )}

          {/* Existing Inspection Pins on the Blueprint */}
          {existingInspections.map((entry, idx) => {
            if (!entry.blueprintLocation) return null;
            const px = (entry.blueprintLocation.x / 100) * 800;
            const py = (entry.blueprintLocation.y / 100) * 400;
            const isCrit = entry.severity === 'critical';
            return (
              <g key={entry.id || idx} className="transition-transform hover:scale-125 cursor-pointer">
                <circle cx={px} cy={py} r="12" fill={isCrit ? '#ef4444' : '#f59e0b'} fillOpacity="0.3" />
                <circle cx={px} cy={py} r="5" fill={isCrit ? '#ef4444' : '#f59e0b'} />
                <text x={px + 8} y={py - 8} fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                  {entry.severity.toUpperCase().slice(0, 3)}
                </text>
              </g>
            );
          })}

          {/* Currently Selected Active Pin */}
          {selectedLocation && (
            <g>
              <circle cx={(selectedLocation.x / 100) * 800} cy={(selectedLocation.y / 100) * 400} r="20" fill="url(#pulseGlow)" className="animate-pulse" />
              <circle cx={(selectedLocation.x / 100) * 800} cy={(selectedLocation.y / 100) * 400} r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
              {/* Target Crosshairs */}
              <line
                x1={(selectedLocation.x / 100) * 800 - 15}
                y1={(selectedLocation.y / 100) * 400}
                x2={(selectedLocation.x / 100) * 800 + 15}
                y2={(selectedLocation.y / 100) * 400}
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <line
                x1={(selectedLocation.x / 100) * 800}
                y1={(selectedLocation.y / 100) * 400 - 15}
                x2={(selectedLocation.x / 100) * 800}
                y2={(selectedLocation.y / 100) * 400 + 15}
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

      </div>
    </div>
  );
};
