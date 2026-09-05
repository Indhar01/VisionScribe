import React, { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { RecentLogsRibbon } from "./components/RecentLogsRibbon";
import { LoginLanding } from "./components/LoginLanding";
import { InspectionForm } from "./components/InspectionForm";
import { NCRView } from "./components/NCRView";
import { InspectionChat } from "./components/InspectionChat";
import { InspectionHistory } from "./components/InspectionHistory";
import {
  InspectionRecord,
  NonConformanceReport,
  ChatMessage,
  WorkOrderTicket,
} from "./types/inspection";
import {
  subscribeToUserInspections,
  saveInspectionRecord,
  appendInspectionMessage,
  deleteInspectionRecord,
  voidInspectionRecord,
  dispatchWorkOrderForInspection,
} from "./services/inspectionService";
import { compressAndOptimizeTelemetryImage } from "./utils/imageRasterizer";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState<"inspect" | "history">("inspect");
  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("Ingesting optical telemetry...");
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Chat states
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore inspections for authenticated user
  useEffect(() => {
    if (!user) {
      setInspections([]);
      return;
    }

    setHistoryLoading(true);
    const unsubscribe = subscribeToUserInspections(
      user.uid,
      (records) => {
        setInspections(records);
        setHistoryLoading(false);
        // If an inspection is currently selected, keep its reference updated with latest messages
        if (selectedInspection) {
          const updated = records.find((r) => r.id === selectedInspection.id);
          if (updated) {
            setSelectedInspection(updated);
          }
        }
      },
      (err) => {
        console.error("History sync error:", err);
        setHistoryLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Handle running an optical inspection
  const handleAnalyze = async (payload: {
    image: string;
    mimeType: string;
    machineryPart: string;
    subsystem: string;
    notes: string;
  }) => {
    if (!user) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      setAnalysisStep("Compressing optical telemetry for ISO 9001/AS9100 archival compliance...");
      const { dataUrl: optimizedImage, mimeType: optimizedMime } =
        await compressAndOptimizeTelemetryImage(payload.image);

      // Get Firebase ID token for authenticated server-side inspection request
      const idToken = await user.getIdToken();

      // Call Express server-side endpoint which invokes Gemini 2.5 Flash / 2.0 Flash ladder
      const response = await fetch("/api/inspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          image: optimizedImage,
          mimeType: optimizedMime,
          machineryPart: payload.machineryPart,
          subsystem: payload.subsystem,
          notes: payload.notes,
          inspectorName: user.displayName || user.email || "Lead Quality Inspector",
        }),
      });

      setAnalysisStep("Synthesizing AS9100 / ISO 9001 Non-Conformance Report...");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Inspection failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.report) {
        throw new Error("Invalid response received from diagnostic engine.");
      }

      const ncrReport = data.report as NonConformanceReport;
      const inspectionId = `insp-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Construct Initial Record using optimized raster image
      const newRecord: InspectionRecord = {
        id: inspectionId,
        userId: user.uid,
        userEmail: user.email || undefined,
        machineryPart: payload.machineryPart,
        subsystem: payload.subsystem,
        initialNotes: payload.notes,
        imageUrl: optimizedImage,
        ncr: ncrReport,
        messages: [
          {
            id: `msg-welcome-${Date.now()}`,
            role: "assistant",
            content: `Non-Conformance Report ${ncrReport.reportNumber} generated for ${ncrReport.machineryPart}. Defect classified as "${ncrReport.defectClassification}" with a Severity Score of ${ncrReport.severityScore}/5 (${ncrReport.severityLabel}). Recommended disposition is ${ncrReport.disposition}.\n\nHow would you like to proceed? You may ask about non-destructive testing (NDT) validation, weld repair feasibility, or ASME containment procedures.`,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setAnalysisStep("Persisting inspection to Cloud Firestore isolated journal...");

      // Save to user's isolated Firestore collection: /users/{userId}/inspections/{id}
      await saveInspectionRecord(user.uid, newRecord);

      setSelectedInspection(newRecord);
      setActiveView("inspect");
    } catch (err: any) {
      console.error("Optical inspection analysis error:", err);
      setAnalysisError(err?.message || "Failed to analyze inspection. Please check your image and retry.");
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle sending multi-turn chat message
  const handleSendMessage = async (text: string) => {
    if (!user || !selectedInspection) return;

    setIsSendingChat(true);
    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. Persist user message to Firestore
      const updatedWithUser = await appendInspectionMessage(
        user.uid,
        selectedInspection.id,
        selectedInspection.messages || [],
        userMessage
      );

      // Optimistically update local view
      setSelectedInspection((prev) =>
        prev ? { ...prev, messages: updatedWithUser } : prev
      );

      // Get Firebase ID token for authenticated chat request
      const idToken = await user.getIdToken();

      // 2. Call backend /api/chat with full multi-turn context
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          reportSummary: selectedInspection.ncr,
          messages: updatedWithUser,
          userMessage: text,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to retrieve consultant reply.");
      }

      const data = await res.json();
      const replyContent = data.reply || "No response received from consultant.";

      const assistantMessage: ChatMessage = {
        id: `msg-asst-${Date.now()}`,
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toISOString(),
      };

      // 3. Persist assistant reply to Firestore
      const updatedWithAssistant = await appendInspectionMessage(
        user.uid,
        selectedInspection.id,
        updatedWithUser,
        assistantMessage
      );

      setSelectedInspection((prev) =>
        prev ? { ...prev, messages: updatedWithAssistant } : prev
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      throw err;
    } finally {
      setIsSendingChat(false);
    }
  };

  // Handle voiding inspection preserving AS9100 / ISO 9001 audit trail
  const handleVoidInspection = async (id: string, reason: string) => {
    if (!user) return;
    try {
      const inspectorId = user.displayName || user.email || "Certified Lead Inspector";
      await voidInspectionRecord(user.uid, id, reason, inspectorId);

      const updateRecordVoided = (r: InspectionRecord): InspectionRecord => ({
        ...r,
        status: "Voided",
        isVoided: true,
        voidReason: reason,
        voidedAt: new Date().toISOString(),
        voidedBy: inspectorId,
        updatedAt: new Date().toISOString(),
      });

      if (selectedInspection?.id === id) {
        setSelectedInspection((prev) => (prev ? updateRecordVoided(prev) : null));
      }

      setInspections((prev) =>
        prev.map((r) => (r.id === id ? updateRecordVoided(r) : r))
      );
    } catch (err: any) {
      console.error("Failed to void inspection:", err);
      setAnalysisError(err?.message || "Failed to void inspection record.");
    }
  };

  // Handle deleting inspection
  const handleDeleteInspection = async (id: string) => {
    if (!user) return;
    await deleteInspectionRecord(user.uid, id);
    if (selectedInspection?.id === id) {
      setSelectedInspection(null);
    }
  };

  // Handle verification of inspection (for low-confidence reports)
  const handleVerifyInspection = async (approved: boolean) => {
    if (!user || !selectedInspection) return;
    try {
      const verificationStatus = approved ? 'verified' : 'rejected';
      const updated: InspectionRecord = {
        ...selectedInspection,
        verificationStatus,
        verifiedBy: user.displayName || user.email || 'Inspector',
        verifiedAt: new Date().toISOString(),
        verificationNotes,
      };
      
      // Update in Firestore
      await saveInspectionRecord(user.uid, updated);
      setSelectedInspection(updated);
      setInspections((prev) =>
        prev.map((r) => (r.id === selectedInspection.id ? updated : r))
      );
      setVerificationNotes('');
    } catch (err) {
      console.error('Failed to verify inspection:', err);
      setAnalysisError('Failed to update verification status. Please try again.');
    }
  };

  // Handle 1-click Dispatch Maintenance Work Order
  const handleDispatchWorkOrder = async () => {
    if (!user || !selectedInspection) return;
    
    // Check verification status if confidence is low
    if ((selectedInspection.ncr.confidenceScore ?? 75) < 60 && selectedInspection.verificationStatus !== 'verified') {
      setAnalysisError('Cannot dispatch work order: This inspection requires verification due to low confidence score. Please review and approve/reject first.');
      return;
    }
    
    setIsDispatching(true);
    try {
      const woNumber = `WO-${Math.floor(1000 + Math.random() * 9000)}`;

      let priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
      let leadTime = "Next Scheduled Shift (24h)";
      if (selectedInspection.ncr.severityScore >= 5) {
        priority = "CRITICAL";
        leadTime = "< 1 Hour (Emergency LOTO)";
      } else if (selectedInspection.ncr.severityScore >= 4) {
        priority = "HIGH";
        leadTime = "< 2 Hours (Urgent Containment)";
      } else if (selectedInspection.ncr.severityScore === 3) {
        priority = "MEDIUM";
        leadTime = "< 8 Hours (Same-Day Maintenance)";
      } else {
        priority = "LOW";
        leadTime = "Next Scheduled Preventative Interval";
      }

      // Context-aware maintenance unit based on part and subsystem
      const sub = `${selectedInspection.subsystem} ${selectedInspection.machineryPart}`.toLowerCase();
      let assignedTeam = "Mechanical & Assembly Maintenance Crew";
      if (
        sub.includes("turbine") ||
        sub.includes("combustion") ||
        sub.includes("thermal") ||
        sub.includes("hot-gas")
      ) {
        assignedTeam = "Thermal & Hot-Gas Section Specialist Team";
      } else if (
        sub.includes("rotor") ||
        sub.includes("bearing") ||
        sub.includes("shaft") ||
        sub.includes("gear")
      ) {
        assignedTeam = "Rotating Machinery & Vibration Diagnostic Crew";
      } else if (
        sub.includes("hydraulic") ||
        sub.includes("fluid") ||
        sub.includes("fuel") ||
        sub.includes("valve")
      ) {
        assignedTeam = "Fluid Power & High-Pressure Hydraulic Unit";
      } else if (
        sub.includes("structural") ||
        sub.includes("airframe") ||
        sub.includes("weld") ||
        sub.includes("bracket")
      ) {
        assignedTeam = "Metallurgical & Structural NDT Unit";
      }

      const ticket: WorkOrderTicket = {
        trackingId: woNumber,
        dispatchedAt: new Date().toISOString(),
        dispatchedBy: user.displayName || user.email || "Lead Quality Inspector",
        assignedTeam,
        priority,
        estimatedLeadTime: leadTime,
        maintenanceNotes: `Dispatched from VisionScribe NCR ${selectedInspection.ncr.reportNumber} for ${selectedInspection.machineryPart}. Defect: ${selectedInspection.ncr.defectClassification}. Disposition: ${selectedInspection.ncr.disposition}.`,
        status: "DISPATCHED",
      };

      // 1. Persist to Firestore
      await dispatchWorkOrderForInspection(user.uid, selectedInspection.id, ticket);

      // 2. Update local state
      const updated: InspectionRecord = {
        ...selectedInspection,
        status: "Dispatched",
        workOrder: ticket,
        updatedAt: new Date().toISOString(),
      };
      setSelectedInspection(updated);
      setInspections((prev) =>
        prev.map((r) => (r.id === selectedInspection.id ? updated : r))
      );
    } catch (err) {
      console.error("Failed to dispatch work order:", err);
      setAnalysisError("Failed to dispatch maintenance work order. Please try again.");
    } finally {
      setIsDispatching(false);
    }
  };

  const handleStartNewInspection = () => {
    setSelectedInspection(null);
    setActiveView("inspect");
    setAnalysisError(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Initializing VisionScribe Engine...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        onNewInspection={handleStartNewInspection}
        hasActiveInspection={Boolean(selectedInspection)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        inspectionsCount={inspections.length}
      />

      {/* Main Workstation Layout */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Workstation Header Bar */}
        <Header
          user={user}
          activeView={activeView}
          setActiveView={setActiveView}
          onNewInspection={handleStartNewInspection}
          hasActiveInspection={Boolean(selectedInspection)}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          inspectionsCount={inspections.length}
          syncing={historyLoading}
        />

        {/* Workstation Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/70">
          <div className="max-w-7xl mx-auto w-full">
            {!user ? (
              <LoginLanding />
            ) : (
              <AnimatePresence mode="wait">
                {activeView === "history" ? (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <InspectionHistory
                      inspections={inspections}
                      onSelectInspection={(inspection) => {
                        setSelectedInspection(inspection);
                        setActiveView("inspect");
                      }}
                      onDeleteInspection={handleDeleteInspection}
                      onVoidInspection={handleVoidInspection}
                      onStartNewInspection={handleStartNewInspection}
                      isLoading={historyLoading}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="inspect"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="space-y-6"
                  >
                    {/* Active Session Top Toolbar when inspection is active */}
                    {selectedInspection && (
                      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200">
                        <button
                          id="btn-back-to-new-inspection"
                          onClick={handleStartNewInspection}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition shadow-2xs cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Start Another Inspection</span>
                        </button>

                        <div className="text-xs text-slate-500 font-mono">
                          ACTIVE REPORT:{" "}
                          <span className="text-blue-600 font-bold">
                            {selectedInspection.ncr.reportNumber}
                          </span>
                        </div>
                      </div>
                    )}

                    {analysisError && (
                      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span>{analysisError}</span>
                        </div>
                        <button
                          onClick={() => setAnalysisError(null)}
                          className="text-red-600 font-semibold hover:underline cursor-pointer text-[11px]"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    {!selectedInspection ? (
                      <InspectionForm
                        onAnalyze={handleAnalyze}
                        isAnalyzing={isAnalyzing}
                        analysisStep={analysisStep}
                      />
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Non-Conformance Report */}
                        <div className="lg:col-span-7 space-y-6">
                          <NCRView
                            ncr={selectedInspection.ncr}
                            imageUrl={selectedInspection.imageUrl}
                            initialNotes={selectedInspection.initialNotes}
                            onNewInspection={handleStartNewInspection}
                            record={selectedInspection}
                            onDispatchWorkOrder={handleDispatchWorkOrder}
                            isDispatching={isDispatching}
                          />
                        </div>

                        {/* Multi-Turn Engineering Consultation */}
                        <div className="lg:col-span-5">
                          <InspectionChat
                            ncr={selectedInspection.ncr}
                            messages={selectedInspection.messages || []}
                            onSendMessage={handleSendMessage}
                            isSending={isSendingChat}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </main>

        {/* Bottom Recent Logs Ribbon */}
        {user && (
          <RecentLogsRibbon
            inspections={inspections}
            onSelectInspection={(inspection) => {
              setSelectedInspection(inspection);
              setActiveView("inspect");
            }}
            onViewAllHistory={() => setActiveView("history")}
          />
        )}
      </div>
    </div>
  );
}
