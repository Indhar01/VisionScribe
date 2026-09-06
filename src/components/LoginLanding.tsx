import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import {
  FileCheck2,
  Cpu,
  Database,
  Lock,
  ArrowRight,
  AlertCircle,
  ScanEye,
} from "lucide-react";

export const LoginLanding: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Authentication error:", error);
      setAuthError(
        error?.message || "Failed to sign in with Google. Please verify popups are enabled and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Main Editorial Polish Card */}
        <div className="bg-white border border-[#1c1c1a]/15 p-8 sm:p-12 relative overflow-hidden text-[#1c1c1a]">
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#fafafa] border border-[#1c1c1a]/15 text-[#1c1c1a] label-mono mb-6">
              <ScanEye className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>AS9100 / ISO 9001 Optical Diagnostics</span>
            </div>

            <h1 className="font-serif-display text-3xl sm:text-5xl font-semibold italic text-[#1c1c1a] tracking-tight">
              VisionScribe Inspection Journal
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#1c1c1a]/70 leading-relaxed">
              Automated visual non-destructive evaluation for mechanical parts,
              aerospace components, and industrial machinery. Ingest defect imagery to generate
              rigorous Non-Conformance Reports (NCR) with AI-powered multi-turn engineering consultation.
            </p>

            {/* Error banner */}
            {authError && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-800 font-mono-code text-xs text-left flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Sign-In Notice</div>
                  <p className="mt-1 text-[#1c1c1a]/70">{authError}</p>
                </div>
              </div>
            )}

            {/* Sign In CTA */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                id="btn-google-sign-in"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-[#1c1c1a] hover:bg-[#1c1c1a]/90 text-white font-mono-code text-xs uppercase tracking-wider transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in via Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#ffffff"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#ffffff"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#ffffff"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#ffffff"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Authenticate with Google</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#2563eb]" />
                  </>
                )}
              </button>
            </div>

            {/* Architecture Highlights Grid */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-left border-t border-[#1c1c1a]/10 pt-8">
              <div className="p-4 bg-[#fafafa] border border-[#1c1c1a]/10">
                <div className="w-7 h-7 bg-white border border-[#1c1c1a]/15 text-[#2563eb] flex items-center justify-center mb-3">
                  <FileCheck2 className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-serif-display text-base font-semibold italic text-[#1c1c1a]">
                  Structured NCR Reports
                </h3>
                <p className="mt-1 text-xs text-[#1c1c1a]/70 leading-normal">
                  Standardized 1-5 severity metric, root cause hypotheses, corrective action plans, and disposition (Scrap/Rework/Repair).
                </p>
              </div>

              <div className="p-4 bg-[#fafafa] border border-[#1c1c1a]/10">
                <div className="w-7 h-7 bg-white border border-[#1c1c1a]/15 text-emerald-700 flex items-center justify-center mb-3">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-serif-display text-base font-semibold italic text-[#1c1c1a]">
                  Isolated Cloud Firestore
                </h3>
                <p className="mt-1 text-xs text-[#1c1c1a]/70 leading-normal">
                  Per-user security isolation at <code className="font-mono-code text-[11px] text-[#2563eb]">/users/&#123;userId&#125;/inspections</code> with zero cross-tenant leakage.
                </p>
              </div>

              <div className="p-4 bg-[#fafafa] border border-[#1c1c1a]/10">
                <div className="w-7 h-7 bg-white border border-[#1c1c1a]/15 text-[#2563eb] flex items-center justify-center mb-3">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-serif-display text-base font-semibold italic text-[#1c1c1a]">
                  Resilient Gemini Engine
                </h3>
                <p className="mt-1 text-xs text-[#1c1c1a]/70 leading-normal">
                  High-capacity multimodal pipeline with automatic multi-model fallback ladder (Gemini 2.5 Flash → 2.0 Flash).
                </p>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="mt-8 flex items-center justify-center gap-2 label-mono">
              <Lock className="w-3.5 h-3.5 text-[#1c1c1a]/40" />
              <span>Zero-hardcoded secrets • Server-side API key proxy • Strict Auth token validation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

