import { useState, useRef, useEffect } from "react";
import { Send, ChevronRight, ChevronLeft, Sparkles, Bot, BrainCircuit, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBIAChat } from "@/context/BIAChatContext";
import { useNavigate } from "react-router-dom";

const TAG_STYLES = {
  alerta: "bg-amber-400/20 text-amber-200 border border-amber-400/30",
  insight: "bg-white/20 text-white border border-white/25",
  info: "bg-white/10 text-white/80 border border-white/20",
} as const;

const TAG_LABELS = {
  alerta: "Alerta",
  insight: "Insight",
  info: "Info",
} as const;

function ThinkingBubble() {
  return (
    <div className="flex items-start gap-2">
      <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms",   animationDuration: "900ms" }} />
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "180ms", animationDuration: "900ms" }} />
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "360ms", animationDuration: "900ms" }} />
      </div>
    </div>
  );
}

export function BIAChat() {
  const {
    messages, isOpen, thinking, pendingAction,
    setIsOpen, setThinking, addMessage, sendInsight, setPendingAction,
  } = useBIAChat();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const activeQuickReplies = pendingAction
    ? [...messages].reverse().find((m) => m.role === "bia" && m.quickReplies?.length)?.quickReplies
    : null;

  function handleQuickReply(label: string, value: string, url?: string) {
    addMessage({ role: "user", content: label });
    if (url) {
      setPendingAction(null);
      navigate(url);
      return;
    }
    if (pendingAction) pendingAction(value);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    addMessage({ role: "user", content: text });
    setIsOpen(true);

    if (pendingAction) {
      pendingAction(text);
      return;
    }

    setThinking(true);
    await new Promise((r) => setTimeout(r, 1600));
    setThinking(false);
    sendInsight(
      "Entendido! Estou analisando sua solicitação sobre o Portal da Reforma Tributária. Em breve trarei os dados consolidados.",
      "info"
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col border-r border-emerald-900 bg-emerald-800 shrink-0 transition-[width] duration-200 overflow-hidden",
        isOpen ? "w-[340px]" : "w-12"
      )}
    >
      {/* Header — open */}
      {isOpen ? (
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-emerald-900 bg-emerald-900 text-white shrink-0">
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">BIA</p>
            <p className="text-[10px] text-white/60 leading-tight">Assistente de IA · Reforma Tributária</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/10 rounded p-1 transition-colors shrink-0"
            title="Recolher"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Header — collapsed */
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center gap-2 py-3 border-b border-emerald-900 bg-emerald-900 text-white shrink-0 hover:bg-emerald-800 transition-colors w-full"
          title="Expandir assistente"
        >
          <Sparkles className="h-4 w-4" />
          <ChevronRight className="h-3 w-3" />
        </button>
      )}

      {/* Collapsed label */}
      {!isOpen && (
        <div
          className="flex-1 flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setIsOpen(true)}
        >
          <span
            className="text-[9px] font-semibold text-white/50 tracking-[0.2em] uppercase select-none"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Assistente IA
          </span>
        </div>
      )}

      {/* Messages */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              {m.role === "bia" ? (
                <div className="flex items-start gap-2 max-w-full">
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {m.skill && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 mb-0.5 mr-1 bg-white/15 text-white border border-white/25">
                        {m.skill === "Consultor Tributário"
                          ? <BrainCircuit className="h-2.5 w-2.5" />
                          : <Wrench className="h-2.5 w-2.5" />}
                        {m.skill}
                      </span>
                    )}
                    {m.tag && (
                      <span className={cn("inline-block text-[9px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 mb-1", TAG_STYLES[m.tag])}>
                        {TAG_LABELS[m.tag]}
                      </span>
                    )}
                    <div className="bg-white rounded-lg px-3 py-2">
                      <p className="text-[12px] text-gray-800 leading-relaxed whitespace-pre-line">{m.content}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-600 text-white rounded-lg px-3 py-2 max-w-[85%]">
                  <p className="text-[12px] leading-relaxed">{m.content}</p>
                </div>
              )}
            </div>
          ))}

          {thinking && <ThinkingBubble />}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Quick reply buttons */}
      {isOpen && activeQuickReplies && activeQuickReplies.length > 0 && (
        <div className="border-t border-emerald-700 px-3 pt-2 pb-1 flex flex-wrap gap-1.5 shrink-0 bg-emerald-900/60">
          {activeQuickReplies.map((r) => (
            <button
              key={r.value}
              onClick={() => handleQuickReply(r.label, r.value, r.url)}
              disabled={thinking}
              className="inline-flex items-center px-3 py-1 rounded-full border border-white/30 text-[11px] text-white bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      {isOpen && (
        <div className="border-t border-emerald-700 p-3 space-y-2 shrink-0 bg-emerald-900/60">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !thinking && sendMessage()}
              placeholder={pendingAction ? "Digite sua resposta…" : "Pergunte sobre o portal…"}
              disabled={thinking}
              className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-[12px] text-white placeholder:text-white/45 outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={thinking || !input.trim()}
              className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-white/40 text-center">
            A BIA utiliza IA. Sempre revise as informações.
          </p>
        </div>
      )}
    </div>
  );
}
