import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  User, 
  Cpu, 
  HelpCircle, 
  CheckCircle2, 
  Layers, 
  Plane, 
  ShieldAlert,
  CornerDownLeft,
  Flame,
  Zap,
  ArrowRight
} from 'lucide-react';
import { 
  InspectionEntry, 
  InteractionMessage, 
  UserProfile 
} from '../types/inspection';
import { 
  requestGeminiChat, 
  saveInteractionMessage, 
  getInspectionInteractions 
} from '../services/inspectionService';
import { generateDemoChatReply } from '../utils/mockAiResponses';

interface InspectionChatProps {
  user: UserProfile;
  inspection: InspectionEntry;
  onClose?: () => void;
}

export const InspectionChat: React.FC<InspectionChatProps> = ({
  user,
  inspection,
  onClose,
}) => {
  const [messages, setMessages] = useState<InteractionMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load past interactions for this inspection
  useEffect(() => {
    let isMounted = true;
    async function loadChat() {
      const stored = await getInspectionInteractions(user.uid, inspection.id);
      if (isMounted) {
        if (stored.length > 0) {
          setMessages(stored);
        } else {
          // Initialize with greeting & context
          const initialGreeting: InteractionMessage = {
            id: `INT-INIT-${Date.now()}`,
            inspectionId: inspection.id,
            userId: user.uid,
            role: 'model',
            content: `Hello Inspector. I am VisionScribe, your Aerospace Engineering AI Copilot. I have loaded active inspection record **${inspection.title}** (${inspection.program}, Severity: **${inspection.severity.toUpperCase()}**).\n\nHow would you like to proceed? We can explore **5-Why Root Cause**, draft **SRM Concession language**, or review **OEM Containment Protocols**.`,
            timestamp: new Date().toISOString(),
          };
          setMessages([initialGreeting]);
          saveInteractionMessage(initialGreeting);
        }
      }
    }
    loadChat();
    return () => {
      isMounted = false;
    };
  }, [inspection.id, user.uid]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || sending) return;

    const userMsg: InteractionMessage = {
      id: `INT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      inspectionId: inspection.id,
      userId: user.uid,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setSending(true);

    try {
      await saveInteractionMessage(userMsg);

      if (user.isDemo) {
        // Safe offline simulated reply (never calls server.ts or real Gemini API)
        const demoReply = generateDemoChatReply(textToSend, inspection);
        const aiMsg: InteractionMessage = {
          id: `INT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          inspectionId: inspection.id,
          userId: user.uid,
          role: 'model',
          content: demoReply.reply,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        await saveInteractionMessage(aiMsg);
        return;
      }

      // Map to Gemini history format
      const chatHistory = newMessages.map((m) => ({
        role: (m.role === 'model' ? 'model' : 'user') as 'user' | 'model',
        content: m.content,
      }));

      const result = await requestGeminiChat(chatHistory, inspection);

      const aiMsg: InteractionMessage = {
        id: `INT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        inspectionId: inspection.id,
        userId: user.uid,
        role: 'model',
        content: result.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      await saveInteractionMessage(aiMsg);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: InteractionMessage = {
        id: `INT-ERR-${Date.now()}`,
        inspectionId: inspection.id,
        userId: user.uid,
        role: 'model',
        content: `Engineering Assistant Notice: Encountered temporary processing exception (${err?.message || 'Error'}). Please try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const quickPrompts = [
    'What are the AS9100 Rev D containment requirements for this finding?',
    'Perform a 5-Why root cause breakdown on this assembly failure.',
    'Draft an engineering concession proposal for Material Review Board (MRB) approval.',
    'What Non-Destructive Inspection (NDI) technique should we verify on adjacent serial units?',
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm flex flex-col h-[650px] overflow-hidden">
      
      {/* Header with Active Inspection Context */}
      <div className="border-b border-gray-200 bg-gray-50/90 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-blue-600 text-white font-bold shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-tight">Gemini 3.6 Flash Engineering Copilot</h3>
              <span className="rounded bg-blue-50 px-1.5 py-0.2 font-mono text-[9px] text-blue-700 border border-blue-200 font-bold uppercase">
                Multi-Turn Active
              </span>
            </div>
            <p className="text-[10px] text-gray-500 truncate max-w-lg font-mono">
              Context: <span className="text-gray-800 font-semibold">{inspection.title}</span> ({inspection.program})
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-[10px] font-mono font-bold uppercase text-gray-600 hover:text-gray-900 px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 transition-all"
          >
            Back to Journal
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAFA]">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 h-7 w-7 rounded flex items-center justify-center font-bold text-xs ${
                isUser 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-300 text-gray-700 shadow-xs'
              }`}>
                {isUser ? <User className="h-3.5 w-3.5" /> : <Cpu className="h-3.5 w-3.5 text-blue-600" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-3 text-xs leading-relaxed ${
                isUser
                  ? 'bg-blue-600 text-white shadow-xs rounded-tr-none'
                  : 'bg-white border border-gray-200 text-gray-900 rounded-tl-none font-mono text-[11px] whitespace-pre-wrap shadow-xs'
              }`}>
                <div className={`flex items-center justify-between gap-4 mb-1 text-[9px] font-mono ${
                  isUser ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  <span className="font-bold">{isUser ? user.displayName || 'Inspector' : 'VisionScribe AI'}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div>{msg.content}</div>
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="flex items-start gap-2.5">
            <div className="h-7 w-7 rounded bg-white border border-gray-300 text-blue-600 flex items-center justify-center shadow-xs">
              <Cpu className="h-3.5 w-3.5 animate-spin" />
            </div>
            <div className="rounded-lg rounded-tl-none bg-white border border-gray-200 p-2.5 text-xs text-gray-500 font-mono flex items-center gap-2 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
              <span className="text-[11px]">Gemini 3.6 Flash reasoning over AS9100 quality guidelines...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="border-t border-gray-200 bg-white p-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-[9px] font-mono font-bold uppercase text-gray-400 flex-shrink-0">Quick Prompts:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={sending}
              className="text-[10px] font-mono text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-300 px-2 py-0.5 rounded flex-shrink-0 transition-all text-left truncate max-w-xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="border-t border-gray-200 bg-white p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Gemini regarding repair dispositions, FMEA scoring, or FAA regulations..."
            className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="flex h-9 w-9 items-center justify-center rounded bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-xs disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
};
