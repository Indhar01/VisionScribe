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
  Check,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="p-4 rounded-xs bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Form Validation:</span> {formError}
          </div>
        </div>
      )}

      {/* Two-Pane Editorial Layout matching Variation 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left Pane: Component Telemetry & Imagery */}
        <div className="flex flex-col justify-between space-y-4">
          <div>
            <span className="label-mono block">[01] Configuration</span>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold italic text-[#1c1c1a] my-2">
              Component Telemetry
            </h2>

            {/* Presets Chips */}
            <div className="flex flex-wrap gap-2 my-3">
              {SAMPLE_DEFECT_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    id={`btn-preset-${preset.id}`}
                    onClick={() => handleSelectPreset(preset)}
                    disabled={isAnalyzing}
                    className={`font-mono-code text-[11px] px-3 py-1.5 border transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#1c1c1a] text-white border-[#1c1c1a]"
                        : "bg-white text-[#1c1c1a] border-[#1c1c1a]/15 hover:border-[#1c1c1a]/40"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-[#2563eb]" />}
                    <span>{preset.category}</span>
                  </button>
                );
              })}
            </div>

            {/* Dropzone */}
            <div className="my-4">
              {imagePreview ? (
                <div className="relative border border-[#1c1c1a]/15 bg-white p-3 rounded-xs">
                  <div className="relative max-h-64 w-full flex items-center justify-center bg-[#fafafa] border border-[#1c1c1a]/10 overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Defect Preview"
                      className="max-h-56 w-auto object-contain"
                    />
                    <button
                      type="button"
                      id="btn-remove-image"
                      onClick={handleClearImage}
                      disabled={isAnalyzing}
                      className="absolute top-2.5 right-2.5 p-1 rounded-full bg-white/90 hover:bg-red-50 text-[#1c1c1a] hover:text-red-600 border border-[#1c1c1a]/20 shadow-xs transition cursor-pointer"
                      title="Remove Image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-2.5 px-1 flex items-center justify-between text-xs text-[#1c1c1a]/70">
                    <span className="font-mono-code text-[11px]">
                      {selectedPresetId ? "PRESET LOADED" : "CUSTOM TELEMETRY"} ({mimeType})
                    </span>
                    <button
                      type="button"
                      id="btn-replace-image"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-[#2563eb] hover:underline cursor-pointer"
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
                  className={`flex flex-col items-center justify-center p-8 border-2 border-dashed transition rounded-xs bg-[#fafafa] ${
                    dragActive
                      ? "border-[#2563eb] bg-blue-50/40"
                      : "border-[#1c1c1a]/15 hover:border-[#1c1c1a]/30"
                  }`}
                >
                  <Upload className="w-6 h-6 text-[#1c1c1a]/40 mb-2" />
                  <p className="text-xs sm:text-sm font-medium text-[#1c1c1a]">
                    Submit high-resolution defect imagery.
                  </p>
                  <p className="text-[11px] text-[#1c1c1a]/50 mt-1 font-mono-code">
                    PNG, JPEG, WEBP • Max 20MB
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      id="btn-browse-file"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 border border-[#1c1c1a]/20 bg-white hover:bg-[#1c1c1a]/5 font-mono-code text-[11px] uppercase tracking-wider text-[#1c1c1a] transition cursor-pointer"
                    >
                      Select File
                    </button>
                    <button
                      type="button"
                      id="btn-capture-camera"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3.5 py-1.5 border border-[#1c1c1a]/20 bg-white hover:bg-[#1c1c1a]/5 font-mono-code text-[11px] uppercase tracking-wider text-[#1c1c1a] transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Initialize Camera</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden file inputs */}
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
          </div>

          {/* Form Card: Component Details */}
          <div className="bg-white p-6 border border-[#1c1c1a]/10 rounded-xs space-y-4">
            <div>
              <label className="label-mono block mb-1.5">
                Component Part / Machinery <span className="text-[#2563eb]">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-machinery-part"
                  type="text"
                  required
                  disabled={isAnalyzing}
                  value={machineryPart}
                  onChange={(e) => setMachineryPart(e.target.value)}
                  placeholder="e.g. Inconel 718 Turbine Rotor Blade"
                  className="w-full border-b border-[#1c1c1a]/20 pb-2 text-sm text-[#1c1c1a] placeholder-[#1c1c1a]/30 focus:border-[#2563eb] focus:outline-none bg-transparent transition"
                />
                <Wrench className="w-3.5 h-3.5 text-[#1c1c1a]/30 absolute right-1 bottom-2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="label-mono block mb-1.5">
                Affected Subsystem / Location
              </label>
              <div className="relative">
                <input
                  id="input-subsystem"
                  type="text"
                  disabled={isAnalyzing}
                  value={subsystem}
                  onChange={(e) => setSubsystem(e.target.value)}
                  placeholder="e.g. Primary High-Pressure Hot-Gas Path"
                  className="w-full border-b border-[#1c1c1a]/20 pb-2 text-sm text-[#1c1c1a] placeholder-[#1c1c1a]/30 focus:border-[#2563eb] focus:outline-none bg-transparent transition"
                />
                <Layers className="w-3.5 h-3.5 text-[#1c1c1a]/30 absolute right-1 bottom-2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Multimodal Reporting & Observations */}
        <div className="flex flex-col justify-between space-y-4">
          <div>
            <span className="label-mono block">[02] Analysis</span>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold italic text-[#1c1c1a] my-2">
              Multimodal Reporting
            </h2>

            <div className="bg-white p-6 border border-[#1c1c1a]/10 rounded-xs space-y-5">
              <p className="text-xs sm:text-sm text-[#1c1c1a]/70 leading-relaxed">
                Automated Gemini NCR generation facilitates compliance with{" "}
                <em className="text-[#1c1c1a] font-serif-display text-base">
                  AS9100 / ISO 9001
                </em>{" "}
                by identifying defect severity, estimating root-cause indicators, and formulating containment actions.
              </p>

              <div>
                <label className="label-mono block mb-2">
                  Field Observations & Operating Context
                </label>
                <div className="relative">
                  <textarea
                    id="input-inspection-notes"
                    rows={6}
                    disabled={isAnalyzing}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter visual observations, operating temperature, cyclic hours, vibration telemetry, or non-destructive testing cues..."
                    className="w-full border border-[#1c1c1a]/15 p-3 text-xs sm:text-sm text-[#1c1c1a] placeholder-[#1c1c1a]/30 focus:border-[#2563eb] focus:outline-none bg-[#fafafa] rounded-xs transition leading-relaxed"
                  />
                  <FileText className="w-4 h-4 text-[#1c1c1a]/30 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="pt-2">
                {isAnalyzing ? (
                  <div className="w-full bg-[#1c1c1a] text-white p-4 flex items-center justify-center gap-3 font-mono-code text-xs">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="tracking-widest uppercase">{analysisStep}</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    id="btn-run-inspection"
                    className="w-full bg-[#1c1c1a] text-white hover:bg-[#1c1c1a]/90 font-mono-code text-xs uppercase tracking-widest py-3.5 px-6 rounded-none cursor-pointer transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-[#2563eb]" />
                    <span>Process AI Report</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/70 border border-[#1c1c1a]/10 rounded-xs flex items-center justify-between text-[11px] font-mono-code text-[#1c1c1a]/60">
            <span>ISO 9001:2015 SECTION 8.7</span>
            <span>GEMINI MULTIMODAL V2</span>
          </div>
        </div>
      </div>
    </form>
  );
};

