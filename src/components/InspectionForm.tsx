import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  MapPin, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  FileText, 
  Layers, 
  Crosshair, 
  Zap, 
  Clock,
  Radio,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  AerospaceProgram, 
  SeverityLevel, 
  InspectionEntry, 
  DefectCoordinates, 
  UserProfile, 
  GeminiAnalysis 
} from '../types/inspection';
import { requestGeminiReflection, saveInspectionEntry } from '../services/inspectionService';
import { generateDemoReflection } from '../utils/mockAiResponses';
import { BlueprintVisualizer } from './BlueprintVisualizer';
import { SAMPLE_AEROSPACE_DEFECTS } from '../data/sampleDefects';

interface InspectionFormProps {
  user: UserProfile;
  initialEntry?: InspectionEntry | null;
  onSaved: (entry: InspectionEntry) => void;
  onOpenChat: (entry: InspectionEntry) => void;
}

export const InspectionForm: React.FC<InspectionFormProps> = ({
  user,
  initialEntry,
  onSaved,
  onOpenChat,
}) => {
  const [title, setTitle] = useState('');
  const [program, setProgram] = useState<AerospaceProgram>('Airbus A350');
  const [facility, setFacility] = useState('Toulouse Final Assembly Line (Clément Ader)');
  const [coordinates, setCoordinates] = useState('43.6291° N, 1.3638° E');
  const [partNumber, setPartNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('major');
  const [discrepancyText, setDiscrepancyText] = useState('');
  const [blueprintLocation, setBlueprintLocation] = useState<DefectCoordinates>({ x: 38, y: 44, zone: 'Port Wing Center Spar - Rib 14' });
  const [analysis, setAnalysis] = useState<GeminiAnalysis | undefined>(undefined);
  const [tags, setTags] = useState<string[]>(['AS9100', 'Airframe']);

  const [loadingReflection, setLoadingReflection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize or populate from initialEntry
  useEffect(() => {
    if (initialEntry) {
      setTitle(initialEntry.title || '');
      setProgram(initialEntry.program || 'Airbus A350');
      setFacility(initialEntry.facility || 'Toulouse Final Assembly Line (Clément Ader)');
      setCoordinates(initialEntry.coordinates || '43.6291° N, 1.3638° E');
      setPartNumber(initialEntry.partNumber || '');
      setSerialNumber(initialEntry.serialNumber || '');
      setSeverity(initialEntry.severity || 'major');
      setDiscrepancyText(initialEntry.discrepancyText || '');
      setBlueprintLocation(initialEntry.blueprintLocation || { x: 38, y: 44, zone: 'Airframe Wing' });
      setAnalysis(initialEntry.analysis);
      setTags(initialEntry.tags || ['AS9100']);
    } else {
      // Default to fresh form
      resetForm();
    }
  }, [initialEntry]);

  const resetForm = () => {
    setTitle('');
    setProgram('Airbus A350');
    setFacility('Toulouse Final Assembly Line (Clément Ader)');
    setCoordinates('43.6291° N, 1.3638° E');
    setPartNumber('');
    setSerialNumber('');
    setSeverity('major');
    setDiscrepancyText('');
    setBlueprintLocation({ x: 38, y: 44, zone: 'Port Wing Center Spar - Rib 14' });
    setAnalysis(undefined);
    setTags(['AS9100', 'NDI Scan']);
  };

  // Facility coordinate helper
  const handleFacilityChange = (fac: string) => {
    setFacility(fac);
    if (fac.includes('Toulouse')) setCoordinates('43.6291° N, 1.3638° E');
    else if (fac.includes('Derby')) setCoordinates('52.8833° N, 1.4833° W');
    else if (fac.includes('Mirabel')) setCoordinates('45.6811° N, 74.0389° W');
    else if (fac.includes('Hamburg')) setCoordinates('53.5358° N, 9.8358° E');
    else if (fac.includes('Dahlewitz')) setCoordinates('52.3167° N, 13.4333° E');
  };

  // GPS Pin current location
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lon = pos.coords.longitude.toFixed(4);
          setCoordinates(`${lat}° N, ${lon}° E`);
          setStatusMessage({ type: 'success', text: `GPS coordinates pinned: ${lat}, ${lon}` });
        },
        (err) => {
          console.warn('Geo error:', err);
          setStatusMessage({ type: 'error', text: 'Geolocation unavailable. Using facility default coordinates.' });
        }
      );
    }
  };

  // Load Preset
  const handleLoadSample = (index: number) => {
    const sample = SAMPLE_AEROSPACE_DEFECTS[index];
    if (sample) {
      setTitle(sample.title);
      setProgram(sample.program);
      setFacility(sample.facility);
      setCoordinates(sample.coordinates || '43.6291° N, 1.3638° E');
      setPartNumber(sample.partNumber || '');
      setSerialNumber(sample.serialNumber || '');
      setSeverity(sample.severity);
      setDiscrepancyText(sample.discrepancyText);
      setBlueprintLocation(sample.blueprintLocation || { x: 40, y: 40, zone: 'Main Structure' });
      setAnalysis(sample.analysis);
      setTags(sample.tags || ['Aerospace']);
      setStatusMessage({ type: 'success', text: `Loaded enterprise preset: ${sample.program}` });
    }
  };

  // Trigger Gemini Reflection
  const handleGeminiReflection = async () => {
    if (!discrepancyText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter discrepancy observation text before requesting AI reflection.' });
      return;
    }

    setLoadingReflection(true);
    setStatusMessage(null);
    try {
      if (user.isDemo) {
        // Safe client-side demo evaluator path (never calls server.ts or real Gemini API)
        const demoResult = generateDemoReflection({
          title: title || `${program} Inspection Finding`,
          program,
          facility,
          partNumber,
          serialNumber,
          severity,
          discrepancyText,
        });
        setAnalysis(demoResult.analysis);
        setStatusMessage({ 
          type: 'success', 
          text: `[Demo Mode] Simulated AS9100 assessment generated. (Sign in with Google to query live Gemini 3.6 Flash).` 
        });
        return;
      }

      const result = await requestGeminiReflection({
        title: title || `${program} Inspection Finding`,
        program,
        facility,
        partNumber,
        serialNumber,
        severity,
        discrepancyText,
      });

      setAnalysis(result.analysis);
      setStatusMessage({ 
        type: 'success', 
        text: `Gemini 3.6 Flash analysis generated via model [${result.modelUsed}]. FMEA RPN: ${result.analysis.fmeaScore}/100` 
      });
    } catch (err: any) {
      console.error('Reflection error:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to complete Gemini reflection.' });
    } finally {
      setLoadingReflection(false);
    }
  };

  // Save to Firestore & local storage
  const handleSave = async () => {
    if (!title.trim() || !discrepancyText.trim()) {
      setStatusMessage({ type: 'error', text: 'Title and Discrepancy observation are mandatory fields.' });
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    try {
      const now = new Date().toISOString();
      const entryId = initialEntry?.id || `INSP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const entry: InspectionEntry = {
        id: entryId,
        userId: user.uid,
        userEmail: user.email || 'inspector@aerospace.corp',
        title,
        program,
        facility,
        coordinates,
        blueprintLocation,
        partNumber: partNumber || 'N/A',
        serialNumber: serialNumber || 'N/A',
        severity,
        discrepancyText,
        analysis,
        ncrStatus: initialEntry?.ncrStatus || (severity === 'critical' ? 'open' : 'draft'),
        fmeaScore: analysis?.fmeaScore || (severity === 'critical' ? 88 : severity === 'major' ? 65 : 35),
        tags,
        createdAt: initialEntry?.createdAt || now,
        updatedAt: now,
      };

      await saveInspectionEntry(entry);

      // Trigger subtle celebration on save
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#38bdf8', '#0284c7', '#10b981'],
        });
      } catch {
        // ignore confetti errors
      }

      setStatusMessage({ type: 'success', text: `Inspection ${entryId} securely saved to Cloud Firestore.` });
      onSaved(entry);
    } catch (err: any) {
      console.error('Save error:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to save entry.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner & Quick Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span>{initialEntry ? 'Edit Aerospace Inspection Finding' : 'New AS9100 Aerospace Inspection Journal'}</span>
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Log manufacturing discrepancies, pinpoint airframe coordinates, and generate Gemini 3.6 Flash reflections.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase font-bold text-gray-400 hidden sm:inline">Fill Preset:</span>
          <button
            onClick={() => handleLoadSample(0)}
            className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-[11px] font-mono font-bold transition-all"
            title="Load Airbus A350 Wing Delamination"
          >
            A350
          </button>
          <button
            onClick={() => handleLoadSample(1)}
            className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 text-[11px] font-mono font-bold transition-all"
            title="Load Rolls-Royce Trent XWB Turbine Spallation"
          >
            Trent XWB
          </button>
          <button
            onClick={() => handleLoadSample(2)}
            className="px-2.5 py-1 rounded bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 text-[11px] font-mono font-bold transition-all"
            title="Load Bombardier Global 7500 Hydraulics Split"
          >
            Global 7500
          </button>
        </div>
      </div>

      {/* Status Feedback Toast */}
      {statusMessage && (
        <div className={`p-2.5 rounded border text-xs flex items-center gap-2 transition-all ${
          statusMessage.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" /> : <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />}
          <span className="font-medium text-[11px]">{statusMessage.text}</span>
        </div>
      )}

      {/* Primary Form Fields Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Discrepancy Observation & Metadata (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3.5 shadow-sm">
            
            {/* Title */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1 font-bold">
                Inspection Finding Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CFRP Main Wing Spar Inter-laminar Delamination at Rib-14"
                className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Aerospace Program & Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1 font-bold">
                  Aerospace Program
                </label>
                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value as AerospaceProgram)}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Airbus A350">Airbus A350 XWB</option>
                  <option value="Rolls-Royce Trent XWB">Rolls-Royce Trent XWB</option>
                  <option value="Bombardier Global 7500">Bombardier Global 7500</option>
                  <option value="Airbus A320neo">Airbus A320neo</option>
                  <option value="Rolls-Royce Pearl 15">Rolls-Royce Pearl 15</option>
                  <option value="General Aerospace">General Aerospace Defense</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1 font-bold">
                  Discrepancy Severity
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSeverity('minor')}
                    className={`py-1.5 px-2 rounded text-[10px] font-mono font-bold transition-all border uppercase ${
                      severity === 'minor'
                        ? 'bg-amber-100 text-amber-900 border-amber-400'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    MINOR
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('major')}
                    className={`py-1.5 px-2 rounded text-[10px] font-mono font-bold transition-all border uppercase ${
                      severity === 'major'
                        ? 'bg-orange-100 text-orange-900 border-orange-400'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    MAJOR
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('critical')}
                    className={`py-1.5 px-2 rounded text-[10px] font-mono font-bold transition-all border uppercase ${
                      severity === 'critical'
                        ? 'bg-red-100 text-red-900 border-red-500 font-extrabold'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    CRITICAL
                  </button>
                </div>
              </div>
            </div>

            {/* Facility & GPS Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1 font-bold">
                  Manufacturing / Test Facility
                </label>
                <select
                  value={facility}
                  onChange={(e) => handleFacilityChange(e.target.value)}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Toulouse Final Assembly Line (Clément Ader)">Toulouse Assembly Line (Airbus)</option>
                  <option value="Derby Test Bed 80 (Sinfin A)">Derby Test Bed 80 (Rolls-Royce)</option>
                  <option value="Montreal Mirabel Manufacturing Center">Montreal Mirabel Plant (Bombardier)</option>
                  <option value="Hamburg Finkenwerder Delivery Center">Hamburg Finkenwerder (Airbus)</option>
                  <option value="Dahlewitz Test Facility (Germany)">Dahlewitz Test Facility (Rolls-Royce)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1 font-bold flex items-center justify-between">
                  <span>GPS Coordinates</span>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="text-[9px] text-blue-600 hover:underline flex items-center gap-1 font-mono font-bold uppercase"
                  >
                    <MapPin className="h-2.5 w-2.5" /> Pin GPS
                  </button>
                </label>
                <input
                  type="text"
                  value={coordinates}
                  onChange={(e) => setCoordinates(e.target.value)}
                  placeholder="e.g. 43.6291° N, 1.3638° E"
                  className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-mono text-blue-700 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Part Number & Serial Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1 font-bold">
                  Part Number (P/N)
                </label>
                <input
                  type="text"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="e.g. A350-57-2201-901"
                  className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-mono text-gray-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1 font-bold">
                  Serial Number (S/N or MSN)
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. MSN-0418-SP"
                  className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-mono text-gray-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Discrepancy Narrative Observation */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1 font-bold flex items-center justify-between">
                <span>Discrepancy Observation & Quality Log *</span>
                <span className="text-[9px] text-gray-400 font-mono">Supports NDT scans & visual metrics</span>
              </label>
              <textarea
                rows={4}
                value={discrepancyText}
                onChange={(e) => setDiscrepancyText(e.target.value)}
                placeholder="Describe detailed inspection findings: dimensions, NDT ultrasonic signal attenuation, metallurgical coating observations, torque deltas, or regulatory standard violations..."
                className="w-full rounded border border-gray-300 bg-white p-2.5 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed font-mono"
              />
            </div>

            {/* Action Buttons: AI Reflection & Save */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={handleGeminiReflection}
                disabled={loadingReflection}
                className="flex items-center gap-1.5 rounded bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white transition-all uppercase tracking-tight shadow-sm disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{loadingReflection ? 'Analyzing via Gemini 3.6 Flash...' : 'Process Gemini 3.6 Reflection'}</span>
              </button>

              <div className="flex items-center gap-2">
                {initialEntry && (
                  <button
                    type="button"
                    onClick={() => onOpenChat(initialEntry)}
                    className="flex items-center gap-1 rounded border border-gray-300 bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200 uppercase tracking-tight transition-all"
                  >
                    <span>Copilot Chat</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded bg-gray-900 hover:bg-black px-4 py-1.5 text-xs font-bold text-white transition-all uppercase tracking-tight shadow-sm disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{saving ? 'Saving...' : 'Save Entry'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Interactive Blueprint Hotspot & AI Analysis Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Blueprint Pin Locator */}
          <BlueprintVisualizer
            program={program}
            selectedLocation={blueprintLocation}
            onSelectLocation={(loc) => setBlueprintLocation(loc)}
          />

          {/* Gemini AI Reflection & FMEA Card */}
          {analysis && (
            <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm space-y-3">
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <h3 className="text-xs font-bold text-gray-900 font-mono uppercase tracking-wider">
                    Gemini 3.6 Flash Assessment
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-bold">
                  FMEA RPN: {analysis.fmeaScore}/100
                </span>
              </div>

              {/* Executive Summary */}
              <div className="text-xs space-y-2.5">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 font-bold">
                    Executive Technical Summary
                  </span>
                  <p className="text-gray-800 mt-0.5 leading-relaxed text-[11px]">{analysis.executiveSummary}</p>
                </div>

                {/* Root Cause Hypothesis */}
                <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-amber-800 font-bold flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3 text-amber-600" /> Root Cause Hypothesis (8D D4)
                  </span>
                  <p className="text-amber-950 mt-0.5 text-[11px] leading-relaxed">{analysis.rootCauseHypothesis}</p>
                </div>

                {/* Containment Steps */}
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 font-bold">
                    Immediate Containment Protocols (D3)
                  </span>
                  <ul className="mt-1 space-y-1">
                    {analysis.containmentSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px] text-gray-700">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* MRB Disposition Recommendation */}
                <div className="pt-2 border-t border-gray-100">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-blue-700 font-bold">
                    Material Review Board (MRB) Recommendation
                  </span>
                  <p className="text-gray-900 mt-1 font-mono text-[10px] bg-gray-50 p-2 rounded border border-gray-200">
                    {analysis.dispositionRecommendation}
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
