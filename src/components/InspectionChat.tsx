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
    <div className="bg-white border border-[#1c1c1a]/15 flex flex-col h-[580px]">
      {/* Header */}
      <div className="p-4 border-b border-[#1c1c1a]/10 bg-[#fafafa] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563eb]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif-display font-semibold italic text-base text-[#1c1c1a] flex items-center gap-2">
              <span>Interactive Engineering Consultation</span>
              <span className="font-mono-code text-[10px] bg-[#1c1c1a] text-white px-1.5 py-0.2 font-normal not-italic">
                Multi-Turn
              </span>
            </h3>
            <p className="font-mono-code text-[11px] text-[#1c1c1a]/60">
              Grounded in {ncr.reportNumber} • {ncr.machineryPart}
            </p>
          </div>
        </div>

        <div className="text-xs text-[#1c1c1a]/60 hidden sm:flex items-center gap-1.5 font-mono-code">
          <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
          <span>NDT & Metallurgy Assistant</span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#f8f7f4]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-4">
            <div className="w-12 h-12 bg-white border border-[#1c1c1a]/15 flex items-center justify-center text-[#2563eb] mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="font-serif-display text-xl font-semibold italic text-[#1c1c1a]">
              Consult with VisionScribe Specialist
            </h4>
            <p className="text-xs text-[#1c1c1a]/70 mt-1 leading-relaxed">
              Ask technical follow-up questions regarding Non-Destructive Testing (NDT) procedures,
              metallurgical root cause analysis, or repair protocols for this specific non-conformance.
            </p>

            {/* Quick Prompts */}
            <div className="w-full mt-6 space-y-2 text-left">
              <div className="label-mono flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-[#2563eb]" />
                <span>Suggested Technical Queries</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePromptClick(prompt)}
                    className="text-left font-mono-code text-xs px-3 py-2 bg-white hover:bg-[#fafafa] border border-[#1c1c1a]/15 text-[#1c1c1a] hover:border-[#1c1c1a] transition cursor-pointer"
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
                  <div className="w-7 h-7 bg-white text-[#2563eb] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#1c1c1a]/15">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 text-xs sm:text-sm leading-relaxed border ${
                    isUser
                      ? "bg-[#1c1c1a] text-white border-[#1c1c1a]"
                      : "bg-white border-[#1c1c1a]/15 text-[#1c1c1a] whitespace-pre-line"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 font-mono-code text-[10px] opacity-75">
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
                  <div className={isUser ? "text-slate-100" : "text-[#1c1c1a]"}>{msg.content}</div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 bg-[#1c1c1a] text-white flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#1c1c1a]">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 bg-white text-[#2563eb] flex items-center justify-center flex-shrink-0 border border-[#1c1c1a]/15">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-[#1c1c1a]/15 p-3.5 font-mono-code text-xs text-[#1c1c1a]/70 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
              <span>Analyzing metallurgical tolerances & formulating engineering guidance...</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 font-mono-code text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips row when messages exist */}
      {messages.length > 0 && (
        <div className="px-4 py-2 bg-[#fafafa] border-t border-[#1c1c1a]/10 flex items-center gap-2 overflow-x-auto text-xs text-[#1c1c1a]/70 no-scrollbar">
          <span className="label-mono whitespace-nowrap">
            Suggested:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePromptClick(prompt)}
              className="px-2.5 py-1 font-mono-code bg-white hover:bg-[#fafafa] text-[#1c1c1a] hover:border-[#1c1c1a] border border-[#1c1c1a]/15 whitespace-nowrap transition text-xs cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-white border-t border-[#1c1c1a]/10 flex items-center gap-2"
      >
        <input
          type="text"
          id="input-chat-query"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isSending}
          placeholder="Ask about NDT methods, welding procedures, ASME/ISO standards..."
          className="flex-1 border border-[#1c1c1a]/20 px-3.5 py-2 font-mono-code text-xs text-[#1c1c1a] placeholder-[#1c1c1a]/40 focus:border-[#2563eb] focus:outline-none bg-white transition"
        />
        <button
          type="submit"
          id="btn-send-chat"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 bg-[#1c1c1a] hover:bg-[#1c1c1a]/90 text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
          title="Send consultation query"
        >
          <Send className="w-4 h-4 text-[#2563eb]" />
        </button>
      </form>
    </div>
  );
};

