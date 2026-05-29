import { useState, useRef, useEffect } from "react";
import { Send, ChevronRight, ChevronLeft, Sparkles, Bot, BrainCircuit, Wrench, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBIAChat } from "@/context/BIAChatContext";
import { useNavigate } from "react-router-dom";
import { ERoutes } from "@/routes/interface";

const SKILL_OPTIONS = [
  { id: "dere",               label: "DeRE",                          prompt: "Enviar eventos pendentes da DeRE" },
  { id: "aliquota-integral",  label: "Alíquota Integral",             prompt: "Configurar tributação com alíquota integral" },
  { id: "excecoes-tributacao",label: "Exceções da Tributação Integral",prompt: "Configurar exceções da Tributação Integral de IBS/CBS para NCM/NBS específicos" },
] as const;

const DERE_TRIGGER = "Enviar eventos pendentes da DeRE";

const TAG_STYLES = {
  alerta: "bg-amber-50 text-amber-700 border border-amber-200",
  insight: "bg-primary/8 text-primary border border-primary/20",
  info: "bg-slate-50 text-slate-500 border border-slate-200",
} as const;

const TAG_LABELS = { alerta: "Alerta", insight: "Insight", info: "Info" } as const;

function ThinkingBubble() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="h-3 w-3 text-primary" />
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1.5 shadow-sm border border-primary/10">
        <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms",   animationDuration: "900ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "180ms", animationDuration: "900ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "360ms", animationDuration: "900ms" }} />
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
  const [showSkillMenu, setShowSkillMenu] = useState(false);
  const skillMenuRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (skillMenuRef.current && !skillMenuRef.current.contains(e.target as Node)) {
        setShowSkillMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeQuickReplies = pendingAction
    ? [...messages].reverse().find((m) => m.role === "bia" && m.quickReplies?.length)?.quickReplies
    : null;

  function handleQuickReply(label: string, value: string, url?: string) {
    addMessage({ role: "user", content: label });
    if (url) { setPendingAction(null); navigate(url); return; }
    if (pendingAction) pendingAction(value);
  }

  function handleSkillSelect(skill: typeof SKILL_OPTIONS[number]) {
    setShowSkillMenu(false);
    if (skill.id === "dere") {
      setInput(DERE_TRIGGER);
    } else {
      setInput(skill.prompt);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    addMessage({ role: "user", content: text });
    setIsOpen(true);

    // Skill flows — delegate to context-based handlers via pendingAction chain
    if (text === DERE_TRIGGER) {
      navigate(ERoutes.APURACAO_DERE);
      setThinking(true);
      await new Promise((r) => setTimeout(r, 500));
      setThinking(false);
      addMessage({
        role: "bia",
        content: "Qual evento você quer enviar?",
        tag: "insight",
        skill: "Consultor Tributário",
        quickReplies: [
          { label: "D-1001", value: "d1001" },
          { label: "D-1011", value: "d1011" },
        ],
      });
      return;
    }

    if (text === SKILL_OPTIONS[1].prompt) {
      navigate(ERoutes.TRIBUTACAO_INTEGRAL);
      setThinking(true);
      await new Promise((r) => setTimeout(r, 500));
      setThinking(false);
      addMessage({
        role: "bia",
        content: "Encontrei 12 empresas com produtos vendidos nos últimos 90 dias sem alíquota integral de IBS e CBS configurada. Deseja configurar agora?",
        tag: "insight",
        skill: "Consultor Tributário",
        quickReplies: [
          { label: "Sim", value: "sim" },
          { label: "Não", value: "nao" },
        ],
      });
      return;
    }

    if (text === SKILL_OPTIONS[2].prompt) {
      navigate(ERoutes.CONFIG_ASSISTENTE_EXCECOES, {
        state: { fromBIA: true, selectAll: true },
      });
      setThinking(true);
      await new Promise((r) => setTimeout(r, 1200));
      setThinking(false);
      addMessage({
        role: "bia",
        content: "Encontrei 35 NCM/NBS vendidas nos últimos 90 dias com exceções de alíquota integral de IBS e CBS que não foram configuradas. Verifiquei as NCM que deseja configurar e me avise para continuar",
        tag: "insight",
        skill: "Consultor Tributário",
        quickReplies: [{ label: "Continuar", value: "continuar" }],
      });
      return;
    }

    if (pendingAction) { pendingAction(text); return; }
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
        "flex flex-col shrink-0 transition-[width] duration-200 overflow-hidden",
        "border-r border-primary/15 bg-[hsl(152_40%_97%)]",
        isOpen ? "w-[340px]" : "w-12"
      )}
    >
      {/* ── Header open ─────────────────────────────────────────── */}
      {isOpen ? (
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-primary text-white shrink-0">
          <div className="h-8 w-8 rounded-full bg-white/20 border border-white/25 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold leading-tight tracking-tight">BIA</p>
            <p className="text-[10px] text-white/65 leading-tight">Assistente de IA · Reforma Tributária</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/15 rounded-md p-1.5 transition-colors ml-1"
              title="Recolher"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* ── Header collapsed ─────────────────────────────────── */
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center gap-1.5 pt-3 pb-2 bg-primary text-white shrink-0 hover:bg-primary/90 transition-colors w-full border-b border-primary/20"
          title="Expandir assistente"
        >
          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <ChevronRight className="h-3 w-3 text-white/70" />
        </button>
      )}

      {/* ── Collapsed label ───────────────────────────────────── */}
      {!isOpen && (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/5 transition-colors py-4"
          onClick={() => setIsOpen(true)}
        >
          <span
            className="text-[9px] font-bold text-primary/50 tracking-[0.25em] uppercase select-none"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            BIA
          </span>
        </div>
      )}

      {/* ── Messages ──────────────────────────────────────────── */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              {m.role === "bia" ? (
                <div className="flex items-start gap-2 max-w-full">
                  {/* Avatar */}
                  <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Chips */}
                    <div className="flex flex-wrap gap-1 mb-1">
                      {m.skill && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
                          {m.skill === "Consultor Tributário" ? <BrainCircuit className="h-2.5 w-2.5" /> : <Wrench className="h-2.5 w-2.5" />}
                          {m.skill}
                        </span>
                      )}
                      {m.tag && (
                        <span className={cn("inline-flex items-center text-[9px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5", TAG_STYLES[m.tag])}>
                          {TAG_LABELS[m.tag]}
                        </span>
                      )}
                    </div>

                    {/* Bubble */}
                    <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm border border-primary/10">
                      <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-line">{m.content}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* User bubble */
                <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%] shadow-sm">
                  <p className="text-[12px] leading-relaxed">{m.content}</p>
                </div>
              )}
            </div>
          ))}

          {thinking && <ThinkingBubble />}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ── Quick replies ─────────────────────────────────────── */}
      {isOpen && activeQuickReplies && activeQuickReplies.length > 0 && (
        <div className="border-t border-primary/10 px-3 pt-2 pb-1.5 flex flex-wrap gap-1.5 shrink-0 bg-white/60">
          {activeQuickReplies.map((r) => (
            <button
              key={r.value}
              onClick={() => handleQuickReply(r.label, r.value, r.url)}
              disabled={thinking}
              className="inline-flex items-center px-3 py-1 rounded-full border border-primary/25 text-[11px] text-primary bg-primary/5 hover:bg-primary/10 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ─────────────────────────────────────────────── */}
      {isOpen && (
        <div className="border-t border-primary/10 p-3 space-y-2 shrink-0 bg-white/60">
          <div className="flex items-center gap-2">
            {/* + Skills button */}
            <div className="relative shrink-0" ref={skillMenuRef}>
              <button
                onClick={() => setShowSkillMenu((v) => !v)}
                disabled={thinking}
                className={cn(
                  "h-8 w-8 rounded-xl flex items-center justify-center transition-colors",
                  showSkillMenu
                    ? "bg-primary/15 text-primary"
                    : "text-primary/50 hover:bg-primary/10 hover:text-primary"
                )}
                title="Skills"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>

              {showSkillMenu && (
                <div className="absolute bottom-full left-0 mb-1.5 w-56 rounded-xl border border-border bg-card shadow-lg z-50 py-1 overflow-hidden">
                  <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Skills
                  </p>
                  {SKILL_OPTIONS.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => handleSkillSelect(skill)}
                      className="w-full px-3 py-1.5 text-left text-[12px] text-foreground hover:bg-accent transition-colors"
                    >
                      {skill.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !thinking && sendMessage()}
              placeholder={pendingAction ? "Digite sua resposta…" : "Pergunte sobre o portal…"}
              disabled={thinking}
              className="flex-1 rounded-xl border border-primary/20 bg-white px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/55 outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/35 disabled:opacity-50 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={thinking || !input.trim()}
              className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center">
            A BIA utiliza IA. Sempre revise as informações.
          </p>
        </div>
      )}
    </div>
  );
}
