import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, isFirebaseAvailable, logOut } from './firebase/config';
import { 
  UserProfile, 
  InspectionEntry, 
  AerospaceProgram, 
  UserRole 
} from './types/inspection';
import { getUserInspections, deleteInspectionEntry, saveInspectionEntry, initOrGetUserProfile, getSupervisorReviewQueue } from './services/inspectionService';
import { SAMPLE_AEROSPACE_DEFECTS } from './data/sampleDefects';

// Components
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { LoginLanding } from './components/LoginLanding';
import { InspectionForm } from './components/InspectionForm';
import { InspectionChat } from './components/InspectionChat';
import { NCRView } from './components/NCRView';
import { InspectionHistory } from './components/InspectionHistory';
import { BlueprintVisualizer } from './components/BlueprintVisualizer';
import { AuditComplianceView } from './components/AuditComplianceView';
import { SupervisorReviewQueue } from './components/SupervisorReviewQueue';

export function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('journal');
  const [inspections, setInspections] = useState<InspectionEntry[]>([]);
  const [activeInspection, setActiveInspection] = useState<InspectionEntry | null>(null);
  const [pendingReviewCount, setPendingReviewCount] = useState<number>(0);

  // Auth state listener with role profile initialization
  useEffect(() => {
    let unsubscribe = () => {};
    if (isFirebaseAvailable && auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser: User | null) => {
        if (fbUser) {
          // Initializes user profile document under /users/{userId} with strict default 'inspector' role
          const profile = await initOrGetUserProfile(
            fbUser.uid,
            fbUser.email,
            fbUser.displayName,
            fbUser.photoURL
          );
          setUser({
            ...profile,
            isDemo: false,
          });
        }
        setLoadingAuth(false);
      });
    } else {
      setLoadingAuth(false);
    }
    return () => unsubscribe();
  }, []);

  // Track supervisor queue count
  const refreshReviewCount = async () => {
    try {
      const queue = await getSupervisorReviewQueue();
      setPendingReviewCount(queue.length);
    } catch {
      // ignore
    }
  };

  // Fetch inspections whenever user changes
  useEffect(() => {
    async function loadData() {
      if (user) {
        const list = await getUserInspections(user.uid);
        if (list.length === 0) {
          // Pre-populate with sample enterprise inspections for immediate rich test drive
          const now = new Date().toISOString();
          const seeded: InspectionEntry[] = SAMPLE_AEROSPACE_DEFECTS.map((sample, idx) => ({
            ...sample,
            id: `INSP-SEEDED-${idx + 1}-${Date.now().toString().slice(-4)}`,
            userId: user.uid,
            userEmail: user.email || 'inspector@aerospace.corp',
            verificationStatus: sample.verificationStatus || (idx === 0 || idx === 1 ? 'pending' : 'approved'),
            confidenceScore: sample.confidenceScore ?? (idx === 0 ? 52 : idx === 1 ? 48 : 89),
            confidenceEvaluation: sample.confidenceEvaluation || (idx <= 1 ? 'LOW' : 'HIGH'),
            createdAt: now,
            updatedAt: now,
          }));
          for (const s of seeded) {
            await saveInspectionEntry(s);
          }
          setInspections(seeded);
          setActiveInspection(seeded[0]);
        } else {
          setInspections(list);
          if (!activeInspection && list.length > 0) {
            setActiveInspection(list[0]);
          }
        }
        refreshReviewCount();
      }
    }
    loadData();
  }, [user?.uid]);

  // Handle Demo Login
  const handleDemoLogin = async (profile: UserProfile) => {
    const initialized = await initOrGetUserProfile(
      profile.uid,
      profile.email,
      profile.displayName,
      profile.photoURL,
      profile.role
    );
    setUser({ ...initialized, isDemo: true });
  };

  // Handle Google Auth Success
  const handleGoogleSuccess = async (fbUser: any) => {
    const profile = await initOrGetUserProfile(
      fbUser.uid,
      fbUser.email,
      fbUser.displayName,
      fbUser.photoURL
    );
    setUser({ ...profile, isDemo: false });
  };

  // Handle Logout
  const handleLogout = async () => {
    await logOut();
    setUser(null);
    setActiveInspection(null);
  };

  // Role Switcher
  const handleRoleChange = (role: UserRole) => {
    if (!user) return;
    setUser({ ...user, role });
  };

  // Preset quick-loader from sidebar
  const handleLoadPresetFromSidebar = (prog: AerospaceProgram) => {
    const match = SAMPLE_AEROSPACE_DEFECTS.find((d) => d.program === prog);
    if (match && user) {
      const newEntry: InspectionEntry = {
        ...match,
        id: `INSP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        userId: user.uid,
        userEmail: user.email || 'inspector@aerospace.corp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setActiveInspection(newEntry);
      setActiveTab('journal');
    }
  };

  // Inspection saved callback
  const handleInspectionSaved = (entry: InspectionEntry) => {
    setInspections((prev) => {
      const idx = prev.findIndex((i) => i.id === entry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy;
      }
      return [entry, ...prev];
    });
    setActiveInspection(entry);
  };

  // Delete callback
  const handleDeleteInspection = async (id: string) => {
    if (!user) return;
    await deleteInspectionEntry(user.uid, id);
    setInspections((prev) => prev.filter((i) => i.id !== id));
    if (activeInspection?.id === id) {
      setActiveInspection(null);
    }
  };

  // Open Chat tab for specific entry
  const handleOpenChat = (entry: InspectionEntry) => {
    setActiveInspection(entry);
    setActiveTab('chat');
  };

  // Open NCR tab for specific entry
  const handleOpenNCR = (entry: InspectionEntry) => {
    setActiveInspection(entry);
    setActiveTab('ncr');
  };

  // Select inspection from history
  const handleSelectFromHistory = (entry: InspectionEntry) => {
    setActiveInspection(entry);
    setActiveTab('journal');
  };

  // If loading auth state
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#F1F3F5] flex flex-col items-center justify-center text-slate-800 font-mono text-xs">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-bold uppercase tracking-wider text-slate-600">Initializing AeroReflect Intelligence Suite...</p>
      </div>
    );
  }

  // If not logged in, display Landing & Auth
  if (!user) {
    return <LoginLanding onDemoLogin={handleDemoLogin} onGoogleSuccess={handleGoogleSuccess} />;
  }

  const openNcrCount = inspections.filter((i) => i.ncrStatus === 'open' || i.ncrStatus === 'containment').length;

  return (
    <div className="min-h-screen bg-[#F1F3F5] text-[#1A1C1E] flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Top High-Density Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        onRoleChange={handleRoleChange}
        isOnline={true}
        totalEntries={inspections.length}
      />

      {/* Main High-Density Workspace Layout */}
      <div className="mx-auto flex-1 w-full max-w-7xl px-4 sm:px-6 py-4 flex flex-col lg:flex-row gap-4">
        
        {/* Left Navigation Console */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLoadPreset={handleLoadPresetFromSidebar}
          openNcrCount={openNcrCount}
          userRole={user.role}
          pendingReviewCount={pendingReviewCount}
        />

        {/* Dynamic Center Stage Content View */}
        <main className="flex-1 min-w-0">
          
          {/* TAB 1: JOURNAL & INSPECTION COMPOSER */}
          {activeTab === 'journal' && (
            <InspectionForm
              user={user}
              initialEntry={activeInspection}
              onSaved={handleInspectionSaved}
              onOpenChat={handleOpenChat}
            />
          )}

          {/* TAB 2: MULTI-TURN COPILOT CHAT */}
          {activeTab === 'chat' && (
            <InspectionChat
              user={user}
              inspection={
                activeInspection ||
                inspections[0] || {
                  id: 'INSP-DEFAULT',
                  userId: user.uid,
                  title: 'Airbus A350 Wing Inspection',
                  program: 'Airbus A350',
                  facility: 'Toulouse Assembly Line',
                  severity: 'major',
                  discrepancyText: 'CFRP skin delamination detected via ultrasonic inspection.',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              }
              onClose={() => setActiveTab('journal')}
            />
          )}

          {/* TAB 3: SUPERVISOR REVIEW QUEUE (CROSS-USER PENDING < 60 TRIAGE) */}
          {activeTab === 'review' && (
            <SupervisorReviewQueue
              user={user}
              onSelectInspection={handleSelectFromHistory}
              onOpenChat={handleOpenChat}
              onNavigateToJournal={() => setActiveTab('journal')}
              onRoleSwitchForDemo={(role) => setUser({ ...user, role })}
            />
          )}

          {/* TAB 4: 8D NCR REPORTS */}
          {activeTab === 'ncr' && (
            <NCRView
              user={user}
              inspection={
                activeInspection ||
                inspections[0] || {
                  id: 'INSP-DEFAULT',
                  userId: user.uid,
                  title: 'General Airframe Finding',
                  program: 'Airbus A350',
                  facility: 'Toulouse Assembly Line',
                  severity: 'major',
                  discrepancyText: 'Material out of specification.',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              }
              onUpdateInspection={handleInspectionSaved}
            />
          )}

          {/* TAB 4: INSPECTION HISTORY & TIMELINE */}
          {activeTab === 'history' && (
            <InspectionHistory
              inspections={inspections}
              onSelectInspection={handleSelectFromHistory}
              onOpenChat={handleOpenChat}
              onOpenNCR={handleOpenNCR}
              onDeleteInspection={handleDeleteInspection}
              onCreateNew={() => {
                setActiveInspection(null);
                setActiveTab('journal');
              }}
            />
          )}

          {/* TAB 5: BLUEPRINT COORDINATE HOTSPOT MAP */}
          {activeTab === 'blueprint' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                  Fleet Blueprint Hotspot & Airframe Coordinate Locator
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Pin defect hotspots across Airbus A350, Rolls-Royce Trent XWB, and Bombardier Global 7500. Click schematic to pinpoint coordinates.
                </p>
              </div>

              <BlueprintVisualizer
                program={activeInspection?.program || 'Airbus A350'}
                selectedLocation={activeInspection?.blueprintLocation}
                existingInspections={inspections}
              />
            </div>
          )}

          {/* TAB 6: COMPLIANCE & CRYPTOGRAPHIC AUDIT TRAIL */}
          {activeTab === 'compliance' && <AuditComplianceView user={user} />}

        </main>

      </div>

      {/* High-Density Telemetry Dark Footer */}
      <footer className="h-8 bg-[#0F172A] border-t border-white/10 flex items-center justify-between px-6 shrink-0 text-white select-none">
        <div className="flex items-center gap-4">
          <span className="text-[9px] text-gray-400 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            DB_STATUS: CONNECTED (US-CENTRAL1)
          </span>
          <span className="text-[9px] text-gray-400 font-mono hidden sm:inline">
            GEMINI_LLM: 3.6_FLASH_STABLE
          </span>
          <span className="text-[9px] text-gray-400 font-mono hidden md:inline">
            AS9100_REV_D: COMPLIANT
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] text-blue-400 font-mono font-bold tracking-wider">
            #AccelerateAIwithCloudRun
          </span>
        </div>
      </footer>

    </div>
  );
}

export default App;
