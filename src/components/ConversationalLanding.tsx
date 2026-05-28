import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, Sparkles, Bot, Gem, AlertTriangle, ChevronRight, LayoutDashboard } from "lucide-react";
import { useBIAChat } from "@/context/BIAChatContext";
import type { BIASkill } from "@/context/BIAChatContext";
import { cn } from "@/lib/utils";
import { ERoutes } from "@/routes/interface";

// ── Skill detection ───────────────────────────────────────────────
const TAX_KEYS = ["prazo", "entrega", "alíquota", "tributação", "reforma", "cbs", "ibs", "dere", "fiscal", "apuração", "legislação", "ncm", "isenção", "imposto"];
const ERP_KEYS = ["empresa", "habilitar", "módulo", "configurar", "cadastro", "filial", "cnpj", "sankhya", "integração", "erp", "parametrizar"];

function detectSkill(msg: string): BIASkill {
  const lower = msg.toLowerCase();
  const taxScore = TAX_KEYS.filter((k) => lower.includes(k)).length;
  const erpScore = ERP_KEYS.filter((k) => lower.includes(k)).length;
  return taxScore >= erpScore ? "Consultor Tributário" : "Assistente de ERP";
}

// ── Responses ─────────────────────────────────────────────────────
const HOME_RESPONSES = [
  { keywords: ["atenção", "pendente", "empresa", "problema"], reply: "Identifiquei 3 pontos críticos: Beta Factoring Ltda. e Delta Comercio ME sem módulos habilitados, e Gamma Seguros S.A. com evento D-1001 em Processando há +24h." },
  { keywords: ["status", "apuração", "geral", "resumo"], reply: "CBS: 2 em andamento, 1 concluído. IBS: 2 em andamento, 1 concluído. IS: sem apurações no período. DeRE: D-1001 com 1 erro, D-1011 com 1 não enviado." },
  { keywords: ["erro", "evento", "pendência", "crítico"], reply: "Encontrei 2 ocorrências com problema: D-1001 da Gamma Seguros S.A. (em Processando há +24h sem recibo) e 1 D-1011 não enviado por falta de Plano Referencial." },
];
const HOME_FALLBACK = "Analisando o portal. Em breve trarei os dados consolidados sobre suas apurações e configurações.";

function buildResponse(msg: string): string {
  const lower = msg.toLowerCase();
  const match = HOME_RESPONSES.find((r) => r.keywords.some((k) => lower.includes(k)));
  return match ? match.reply : HOME_FALLBACK.replace("Em breve", `Analisando "${msg}". Em breve`);
}

// ── Digital Workers ───────────────────────────────────────────────
interface DigitalWorker {
  id: string;
  name: string;
  pendingCount: number;
  triggerMessage: string;
  biaResponse: string;
  skill: BIASkill;
}

const DIGITAL_WORKERS: DigitalWorker[] = [
  {
    id: "aliquotas",
    name: "Assistente de Configuração de Alíquotas de IBS e CBS",
    pendingCount: 2,
    triggerMessage: "Quais são as aprovações pendentes do Assistente de Configuração de Alíquotas?",
    biaResponse:
      "O Assistente de Alíquotas tem 2 aprovações pendentes:\n\n1. NCM 3004 (Medicamentos) — Regra de isenção total CBS/IBS aguarda confirmação. A ANVISA registrou atualização no código de classe tributária.\n\n2. NCM 0401 (Leite integral) — Desambiguação necessária entre Cesta Básica Nacional (isenção total) e produto lácteo genérico (redução 60%). Deseja revisar e aprovar agora?",
    skill: "Consultor Tributário",
  },
  {
    id: "dere",
    name: "Assistente de DeRE",
    pendingCount: 1,
    triggerMessage: "Quais são as aprovações pendentes do Assistente de DeRE?",
    biaResponse:
      "O Assistente de DeRE tem 1 aprovação pendente:\n\nPlano Referencial — Gamma Seguros S.A. (Mai/2026) — O Plano Referencial precisa de validação antes do envio do D-1011. O evento D-1001 está em Processando há +24h sem recibo de protocolo. Deseja revisar agora?",
    skill: "Consultor Tributário",
  },
  {
    id: "cbs",
    name: "Assistente de Apuração de CBS",
    pendingCount: 0,
    triggerMessage: "Qual o status do Assistente de Apuração de CBS?",
    biaResponse:
      "Assistente de Apuração de CBS está operando normalmente. Todas as apurações de Mai/2026 estão dentro do prazo e sem divergências críticas. A Financeira Alpha S.A. tem 2 alertas de NCM, mas nenhum bloqueio para envio.",
    skill: "Consultor Tributário",
  },
  {
    id: "ibs",
    name: "Assistente de Apuração de IBS",
    pendingCount: 0,
    triggerMessage: "Qual o status do Assistente de Apuração de IBS?",
    biaResponse:
      "Assistente de Apuração de IBS está operando normalmente. 3 apurações de Mai/2026 processadas sem erros. Saldo líquido estimado credor: R$ 12.400,00. Nenhuma ação pendente.",
    skill: "Consultor Tributário",
  },
];

// ── Suggestion chips ──────────────────────────────────────────────
const SUGGESTIONS = [
  "Quais empresas precisam de atenção este mês?",
  "Qual o status geral das apurações?",
  "Há eventos com erro ou pendências críticas?",
];

// ── Worker Card ───────────────────────────────────────────────────
function WorkerCard({
  worker,
  onActivate,
}: {
  worker: DigitalWorker;
  onActivate: (w: DigitalWorker) => void;
}) {
  const hasPending = worker.pendingCount > 0;
  return (
    <button
      onClick={() => onActivate(worker)}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all hover:shadow-sm active:scale-[0.98] group w-full",
        hasPending
          ? "border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100/70"
          : "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300 hover:bg-emerald-50"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
          hasPending ? "bg-amber-200/70" : "bg-emerald-200/70"
        )}
      >
        <Bot
          className={cn(hasPending ? "text-amber-700" : "text-emerald-700")}
          style={{ height: "14px", width: "14px" }}
        />
      </div>

      {/* Name */}
      <p
        className={cn(
          "text-[12px] font-medium leading-tight flex-1 truncate",
          hasPending ? "text-amber-900" : "text-emerald-900"
        )}
      >
        {worker.name}
      </p>

      {/* Status badge */}
      <div
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 shrink-0 text-[11px] font-medium whitespace-nowrap",
          hasPending
            ? "bg-amber-200/80 text-amber-800"
            : "bg-emerald-200/70 text-emerald-800"
        )}
      >
        {hasPending ? (
          <>
            <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
            {worker.pendingCount} pendente{worker.pendingCount > 1 ? "s" : ""}
          </>
        ) : (
          <>
            <Gem className="h-2.5 w-2.5 shrink-0" />
            Tudo certo
          </>
        )}
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────
export function ConversationalLanding() {
  const { addMessage, setThinking, sendInsight, setPendingAction, skipToLayout } = useBIAChat();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [value]);

  async function handleSend(text: string, skill?: BIASkill, customResponse?: string) {
    if (!text.trim()) return;
    setValue("");

    const resolvedSkill = skill ?? detectSkill(text);
    const response = customResponse ?? buildResponse(text);

    addMessage({ role: "user", content: text });
    setThinking(true);
    await new Promise((r) => setTimeout(r, 1600));
    setThinking(false);
    sendInsight(response, "insight", resolvedSkill);
  }

  async function handleWorkerActivate(worker: DigitalWorker) {
    if (worker.id === "aliquotas") {
      navigate(ERoutes.CONFIG_ASSISTENTE_EXCECOES, { state: { initialScreen: 2 } });
      return;
    }
    await handleSend(worker.triggerMessage, worker.skill, worker.biaResponse);
  }

  function handleInputSend() {
    handleSend(value.trim());
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {/* Top-right action */}
      <div className="absolute top-3 right-4 z-10">
        <button
          onClick={skipToLayout}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent hover:border-primary/30 transition-colors shadow-sm"
        >
          <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
          Voltar para layout EIP
        </button>
      </div>

      {/* Scrollable main area */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-4 pb-10 pt-10">
          {/* Portal title */}
          <div className="flex items-center gap-2 mb-7">
            <span className="font-bold text-[15px] text-foreground tracking-tight">Sankhya</span>
            <span className="text-muted-foreground/40 select-none">|</span>
            <span className="text-muted-foreground text-[13px]">Portal da Reforma Tributária</span>
          </div>

          {/* BIA avatar */}
          <div className="relative mb-5">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">IA</span>
            </div>
          </div>

          <h1 className="text-3xl font-semibold text-foreground mb-1 text-center">
            Olá, Avelino!
          </h1>
          <p className="text-lg text-muted-foreground mb-8 text-center">
            O que você está pensando?
          </p>

          {/* Input box */}
          <div className="w-full max-w-2xl">
            <div
              className={cn(
                "flex items-end gap-3 rounded-2xl border border-input bg-card shadow-sm px-4 py-3",
                "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all"
              )}
            >
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleInputSend();
                  }
                }}
                placeholder="Pergunte sobre apurações, configurações ou a reforma tributária..."
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none text-[14px] text-foreground placeholder:text-muted-foreground/55 leading-relaxed"
                style={{ maxHeight: "128px" }}
              />
              <button
                onClick={handleInputSend}
                disabled={!value.trim()}
                className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setValue(s)}
                  className="rounded-full border border-border px-4 py-1.5 text-[13px] text-foreground/65 hover:bg-accent hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Digital Workers */}
          <div className="w-full max-w-2xl mt-10">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                Digital Workers
              </span>
              <span className="ml-auto text-[11px] text-muted-foreground/60">
                {DIGITAL_WORKERS.filter((w) => w.pendingCount > 0).length} com pendências
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {DIGITAL_WORKERS.map((worker) => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  onActivate={handleWorkerActivate}
                />
              ))}
            </div>
          </div>

          <p className="text-center text-[11px] text-muted-foreground/40 mt-8">
            BIA · Assistente de IA · Reforma Tributária
          </p>
        </div>
      </div>
    </div>
  );
}
