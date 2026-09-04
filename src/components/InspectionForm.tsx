import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  X,
  Sparkles,
  AlertTriangle,
  Layers,
  Wrench,
  FileText,
  CheckCircle2,
  HelpCircle,
  Cpu,
} from "lucide-react";
import { SAMPLE_DEFECT_PRESETS } from "../data/sampleDefects";
import { SampleDefectPreset } from "../types/inspection";
import { rasterizeToPngBase64 } from "../utils/imageRasterizer";

interface InspectionFormProps {
  onAnalyze: (payload: {
    image: string;
    mimeType: string;
    machineryPart: string;
    subsystem: string;
    notes: string;
  }) => Promise<void>;
  isAnalyzing: boolean;
  analysisStep: string;
}

export const InspectionForm: React.FC<InspectionFormProps> = ({
  onAnalyze,
  isAnalyzing,
  analysisStep,
}) => {
  const [machineryPart, setMachineryPart] = useState("");
  const [subsystem, setSubsystem] = useState("");
  const [notes, setNotes] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFormError("Only optical telemetry image files (JPEG, PNG, WEBP) are supported.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setFormError("Selected image exceeds maximum 20MB payload limit.");
      return;
    }

    setFormError(null);
    setMimeType(file.type || "image/jpeg");
    setSelectedPresetId(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setImagePreview(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectPreset = (preset: SampleDefectPreset) => {
    setSelectedPresetId(preset.id);
    setMachineryPart(preset.partName);
    setSubsystem(preset.subsystem);
    setNotes(preset.notes);
    setImagePreview(preset.image);
    setMimeType("image/png");
    setFormError(null);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setSelectedPresetId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!imagePreview) {
      setFormError("Please upload an optical image of the machinery part or select an industrial defect preset.");
      return;
    }

    if (!machineryPart.trim()) {
      setFormError("Please specify the machinery part or component name.");
      return;
    }

    try {
      const { dataUrl: rasterizedImage, mimeType: verifiedMime } = await rasterizeToPngBase64(imagePreview);
      await onAnalyze({
        image: rasterizedImage,
        mimeType: verifiedMime,
        machineryPart: machineryPart.trim(),
        subsystem: subsystem.trim() || "General Mechanical Assembly",
        notes: notes.trim() || "Routine scheduled visual inspection; no additional notes provided.",
      });
    } catch (err: any) {
      setFormError(err?.message || "Inspection analysis failed. Please retry.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Imagery & Telemetry Input Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Card Header Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
              Imagery Analysis & Optical Telemetry
            </span>
          </div>
          <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded font-semibold">
            TELEMETRY: ISO 9001 / AS9100
          </span>
        </div>

        {formError && (
          <div className="m-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Form Validation:</span> {formError}
            </div>
          </div>
        )}

        {/* 1-Click Defect Presets Row */}
        <div className="px-5 pt-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Defect Telemetry Presets (1-Click Fill)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SAMPLE_DEFECT_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  id={`btn-preset-${preset.id}`}
                  onClick={() => handleSelectPreset(preset)}
                  disabled={isAnalyzing}
                  className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                    isSelected
                      ? "bg-blue-50/70 border-blue-500 text-slate-900 ring-1 ring-blue-500"
                      : "bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-blue-600">
                      {preset.category}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div className="font-semibold text-xs mt-1 text-slate-900 line-clamp-1">
                    {preset.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {preset.partName}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Zone */}
        <div className="p-5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Optical Defect Telemetry <span className="text-blue-600">*</span>
          </label>

          {imagePreview ? (
            <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50/50 p-2">
              <div className="relative max-h-72 w-full flex items-center justify-center bg-white rounded border border-slate-100 overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Defect Preview"
                  className="max-h-64 w-auto object-contain"
                />
                <button
                  type="button"
                  id="btn-remove-image"
                  onClick={handleClearImage}
                  disabled={isAnalyzing}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 shadow-xs transition cursor-pointer"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2 px-1 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-600">
                  {selectedPresetId ? "Preset Telemetry Loaded" : "Custom Defect Ingested"} ({mimeType})
                </span>
                <button
                  type="button"
                  id="btn-replace-image"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Replace Image
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition ${
                dragActive
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-slate-50"
              }`}
            >
              <div className="w-12 h-12 bg-slate-200/80 rounded-full flex items-center justify-center mb-3 text-slate-500">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>

              <p className="text-sm font-medium text-slate-700">
                Drag and drop high-resolution defect imagery here, or{" "}
                <button
                  type="button"
                  id="btn-browse-file"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPEG, PNG, WEBP optical imagery (up to 20MB)
              </p>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  id="btn-capture-camera"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-white transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  <span>Use Device Camera</span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
        </div>

        {/* Machinery Component & Notes Input */}
        <div className="p-5 border-t border-slate-100 bg-white space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Machinery Part / Component <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-machinery-part"
                  type="text"
                  required
                  disabled={isAnalyzing}
                  value={machineryPart}
                  onChange={(e) => setMachineryPart(e.target.value)}
                  placeholder="e.g. Centrifugal Impeller Hub"
                  className="w-full border border-slate-200 rounded-md p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white transition"
                />
                <Wrench className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Affected Subsystem / Location
              </label>
              <div className="relative">
                <input
                  id="input-subsystem"
                  type="text"
                  disabled={isAnalyzing}
                  value={subsystem}
                  onChange={(e) => setSubsystem(e.target.value)}
                  placeholder="e.g. Primary Slurry Drive Assembly"
                  className="w-full border border-slate-200 rounded-md p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white transition"
                />
                <Layers className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Inspector Field Observations & Operating Context
            </label>
            <div className="relative">
              <textarea
                id="input-inspection-notes"
                rows={3}
                disabled={isAnalyzing}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type observation details, thermal stress history, vibration data, or operating hours here..."
                className="w-full border border-slate-200 rounded-md p-3 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white transition"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Dark Slate AI Assessment Action Banner (Matching Design HTML) */}
      <div className="bg-slate-900 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-base sm:text-lg">
              Generate AI Assessment
            </h3>
            <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              AS9100 / ISO 9001
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">
            Gemini Multimodal Diagnostics will analyze optical contours, estimate root causes, and formulate non-conformance actions.
          </p>
        </div>

        {isAnalyzing ? (
          <div className="flex items-center gap-3 bg-slate-800 px-4 py-2.5 rounded-lg border border-slate-700">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-xs font-medium text-slate-200 animate-pulse">
              {analysisStep}
            </span>
          </div>
        ) : (
          <button
            type="button"
            id="btn-run-inspection"
            onClick={handleSubmit}
            className="bg-white text-slate-900 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 shadow-sm flex-shrink-0 cursor-pointer text-sm"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Process Report</span>
          </button>
        )}
      </div>
    </div>
  );
};
