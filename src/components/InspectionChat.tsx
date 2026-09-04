import React, { useState, useRef, useEffect } from "react";
import {
  ChatMessage,
  NonConformanceReport,
} from "../types/inspection";
import {
  MessageSquare,
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

interface InspectionChatProps {
  ncr: NonConformanceReport;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isSending: boolean;
}

const QUICK_PROMPTS = [
  "What NDT method should we use to measure crack depth?",
  "Is weld overlay repair permissible under ASME code?",
  "What is the step-by-step LOTO containment procedure?",
  "Draft a supplier non-conformance notification letter.",
];

export const InspectionChat: React.FC<InspectionChatProps> = ({
  ncr,
  messages,
  onSendMessage,
  isSending,
}) => {
  const [inputText, setInputText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const query = inputText.trim();
    setInputText("");
    setErrorMsg(null);

    try {
      await onSendMessage(query);
    } catch (err: any) {
      console.error("Chat message error:", err);
      setErrorMsg(err?.message || "Failed to submit message to engineering consultant.");
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputText(prompt);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[580px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>Interactive Engineering Consultation</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-1.5 py-0.5 rounded font-semibold">
                Multi-Turn
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Grounded in {ncr.reportNumber} • {ncr.machineryPart}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>NDT & Metallurgy Assistant</span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">
              Consult with the VisionScribe Diagnostics Specialist
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Ask technical follow-up questions regarding Non-Destructive Testing (NDT) procedures,
              metallurgical root cause analysis, or repair protocols for this specific non-conformance.
            </p>

            {/* Quick Prompts */}
            <div className="w-full mt-6 space-y-2 text-left">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-blue-600" />
                <span>Suggested Technical Queries</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePromptClick(prompt)}
                    className="text-left text-xs px-3 py-2 rounded-md bg-white hover:bg-blue-50/50 border border-slate-200 text-slate-700 hover:text-blue-700 transition cursor-pointer shadow-2xs"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-200 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isUser
                      ? "bg-blue-600 text-white font-medium rounded-tr-none"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none whitespace-pre-line"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                    <span className="font-bold uppercase tracking-wider">
                      {isUser ? "Lead Quality Inspector" : "VisionScribe Specialist"}
                    </span>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div>{msg.content}</div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-300">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 border border-blue-200">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none p-3.5 text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing metallurgical tolerances & formulating engineering guidance...</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips row when messages exist */}
      {messages.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs text-slate-500 no-scrollbar">
          <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 whitespace-nowrap">
            Suggested:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePromptClick(prompt)}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 whitespace-nowrap transition text-xs cursor-pointer shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          id="input-chat-query"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isSending}
          placeholder="Ask about NDT methods, welding procedures, ASME/ISO standards..."
          className="flex-1 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white transition"
        />
        <button
          type="submit"
          id="btn-send-chat"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0 shadow-xs"
          title="Send consultation query"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
