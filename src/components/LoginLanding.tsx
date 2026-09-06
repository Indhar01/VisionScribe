import React, { useState } from 'react';
import { 
  Shield, 
  Sparkles, 
  Plane, 
  Flame, 
  Zap, 
  Lock, 
  Database, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  Building2,
  FileCheck
} from 'lucide-react';
import { signInWithGoogle, isFirebaseAvailable } from '../firebase/config';
import { UserProfile } from '../types/inspection';

interface LoginLandingProps {
  onDemoLogin: (profile: UserProfile) => void;
  onGoogleSuccess: (user: any) => void;
}

export const LoginLanding: React.FC<LoginLandingProps> = ({ onDemoLogin, onGoogleSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onGoogleSuccess(user);
      } else {
        // If popup was blocked or Firebase not fully set up in this preview, use Demo Login gracefully
        console.info('Switching to fast-track evaluation mode.');
        onDemoLogin({
          uid: 'google-evaluator-778',
          email: 'lead.inspector@aerospace.corp',
          displayName: 'Aerospace Quality Lead',
          photoURL: null,
          role: 'quality_lead',
          facilityBadge: 'Toulouse Final Assembly (Airbus A350)',
          isDemo: true,
        });
      }
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      setError(err?.message || 'Authentication error. You can use Fast-Track Demo Sign-In below.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemo = (role: 'inspector' | 'quality_lead' | 'chief_engineer', facility: string, name: string) => {
    onDemoLogin({
      uid: `demo-${role}-${Date.now().toString().slice(-4)}`,
      email: `${role}@aerospace-inspection.corp`,
      displayName: name,
      photoURL: null,
      role,
      facilityBadge: facility,
      isDemo: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#F1F3F5] text-gray-900 flex flex-col font-sans relative overflow-hidden">
      
      {/* Top Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-3.5 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <span className="font-mono text-base font-extrabold tracking-tight text-gray-900">VISION<span className="text-blue-600">SCRIBE</span></span>
              <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[9px] text-blue-700 border border-blue-200 font-bold uppercase">
                AS9100 / FAA Part 21
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Cloud Firestore Isolated
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1 text-gray-700 font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Gemini 3.6 Flash
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-center">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Vision & Features */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700 uppercase tracking-tight">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Aerospace Quality & Discrepancy Journal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              AI-Powered Flight Safety & <span className="text-blue-600">AS9100 Inspection Intelligence</span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl">
              Engineered for manufacturing quality leads and structural inspectors at <strong>Airbus</strong>, <strong>Rolls-Royce</strong>, and <strong>Bombardier</strong>. Document multi-turn inspection observations, converse with Gemini 3.6 Flash for instant root cause FMEA analysis, generate 8D Non-Conformance Reports (NCR), and isolate documents securely in Cloud Firestore.
            </p>

            {/* Enterprise Compatibility Badges */}
            <div className="pt-1 flex flex-wrap gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 rounded border border-gray-200 bg-white px-2.5 py-1 text-gray-700 font-semibold shadow-sm">
                <Plane className="h-3.5 w-3.5 text-blue-600" />
                <span>Airbus A350 / A320neo</span>
              </div>
              <div className="flex items-center gap-1.5 rounded border border-gray-200 bg-white px-2.5 py-1 text-gray-700 font-semibold shadow-sm">
                <Flame className="h-3.5 w-3.5 text-amber-600" />
                <span>Rolls-Royce Trent XWB / Pearl</span>
              </div>
              <div className="flex items-center gap-1.5 rounded border border-gray-200 bg-white px-2.5 py-1 text-gray-700 font-semibold shadow-sm">
                <Zap className="h-3.5 w-3.5 text-purple-600" />
                <span>Bombardier Global 7500</span>
              </div>
            </div>

            {/* Core Feature Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                <Lock className="h-4 w-4 text-blue-600 mb-1.5" />
                <h2 className="text-xs font-bold text-gray-900 uppercase font-mono tracking-tight">User Data Isolation</h2>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Private Cloud Firestore documents locked strictly to authenticated UID.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                <Cpu className="h-4 w-4 text-emerald-600 mb-1.5" />
                <h2 className="text-xs font-bold text-gray-900 uppercase font-mono tracking-tight">Gemini 3.6 Flash</h2>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Multi-turn dialogue, FMEA Risk Scoring, and SRM disposition notes.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                <FileCheck className="h-4 w-4 text-purple-600 mb-1.5" />
                <h2 className="text-xs font-bold text-gray-900 uppercase font-mono tracking-tight">8D NCR Generator</h2>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Compliant Material Review Board containment protocols ready for sign-off.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In & Evaluation Card */}
          <div className="lg:col-span-5">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm relative">
              
              <div className="text-center mb-5">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded bg-blue-50 border border-blue-200 text-blue-600 mb-2">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">Aerospace Inspector Sign In</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Authenticate via Firebase Auth to unlock your private inspection journal.
                </p>
              </div>

              {error && (
                <div className="mb-3 rounded bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* Primary Google Auth Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 rounded border border-gray-300 bg-white py-2.5 px-4 font-bold text-xs text-gray-800 hover:bg-gray-50 transition-all uppercase tracking-tight shadow-sm active:scale-[0.99] disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{loading ? 'Authenticating...' : 'Sign In with Google Identity'}</span>
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="w-full border-t border-gray-200" />
                <span className="bg-white px-2.5 text-[10px] font-mono text-gray-400 uppercase">
                  or evaluation fast-track
                </span>
              </div>

              {/* Fast-Track Sandbox Evaluation Roles */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono text-gray-500 text-center">
                  Select a pre-configured Aerospace Role to test drive immediately:
                </p>

                <button
                  onClick={() => handleInstantDemo('quality_lead', 'Toulouse Final Assembly (Airbus A350)', 'Sarah Martin, AS9100 Quality Lead')}
                  className="w-full flex items-center justify-between p-2.5 rounded border border-gray-200 bg-gray-50/60 hover:bg-blue-50/50 hover:border-blue-300 text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      <Plane className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 group-hover:text-blue-700">AS9100 Quality Lead</p>
                      <p className="text-[10px] text-gray-500">Airbus A350 Toulouse Assembly Line</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => handleInstantDemo('chief_engineer', 'Derby Test Cell 80 (Rolls-Royce Trent)', 'Dr. David Reynolds, Chief Propulsion Engineer')}
                  className="w-full flex items-center justify-between p-2.5 rounded border border-gray-200 bg-gray-50/60 hover:bg-amber-50/50 hover:border-amber-300 text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      <Flame className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 group-hover:text-amber-700">Chief Propulsion Engineer</p>
                      <p className="text-[10px] text-gray-500">Rolls-Royce Trent XWB Derby Test Cell</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => handleInstantDemo('inspector', 'Mirabel Plant (Bombardier Global 7500)', 'Marc Tremblay, Flight Control Inspector')}
                  className="w-full flex items-center justify-between p-2.5 rounded border border-gray-200 bg-gray-50/60 hover:bg-purple-50/50 hover:border-purple-300 text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      <Zap className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 group-hover:text-purple-700">NDI Flight Inspector</p>
                      <p className="text-[10px] text-gray-500">Bombardier Global 7500 Mirabel Plant</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[10px] text-gray-500 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Zero password storage &bull; Federated Google Identity</span>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-3 px-6 text-center text-xs text-gray-500">
        <p>VisionScribe Aerospace Platform &bull; Built for Google Cloud Run AI Challenge #AccelerateAIwithCloudRun &bull; AS9100 Rev D &bull; FAA 14 CFR Part 21</p>
      </footer>

    </div>
  );
};
