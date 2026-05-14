import { useState, useEffect, useRef } from "react";
import { Send, Sparkles } from "lucide-react";
import { useBIAChat } from "@/context/BIAChatContext";
import type { BIASkill } from "@/context/BIAChatContext";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Quero saber quais empresas preciso habilitar a DeRE",
  "Quero saber a data de entrega da DeRE",
  "Quero saber quais eventos estão com erro",
];

// ── Skill routing ─────────────────────────────────────────────────
const TAX_KEYS = ["data", "prazo", "entrega", "alíquota", "tributação", "reforma", "cbs", "ibs", " is ", "dere", "fiscal", "apuração", "d-1001", "d-1011", "legislação", "lei", "percentual"];
const ERP_KEYS = ["empresa", "habilitar", "módulo", "configurar", "cadastro", "filial", "cnpj", "sankhya", "integração", "erp", "sistema", "parametrizar"];

function detectSkill(msg: string): BIASkill {
  const lower = msg.toLowerCase();
  const taxScore = TAX_KEYS.filter((k) => lower.includes(k)).length;
  const erpScore = ERP_KEYS.filter((k) => lower.includes(k)).length;
  return taxScore >= erpScore ? "Consultor Tributário" : "Assistente de ERP";
}

function buildResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("habilitar") || (lower.includes("empresa") && lower.includes("dere")))
    return "Identifico 5 empresas sem o módulo DeRE habilitado: Alpha Filial SP, Beta Factoring Ltda., Gamma Seguros S.A., Delta Comercio ME e Empresa Teste. Deseja ir para a tela de Empresas para configurá-las?";
  if (lower.includes("data") || lower.includes("prazo") || lower.includes("entrega"))
    return "O prazo de entrega da DeRE para o período de Mai/2026 é 30/06/2026. A Gamma Seguros S.A. tem um D-1001 em processamento há mais de 24h — recomendo acompanhar antes do envio final.";
  if (lower.includes("erro") || lower.includes("event"))
    return "Encontrei 2 ocorrências com problema: D-1001 da Gamma Seguros S.A. (em Processando há +24h sem recibo) e 1 D-1011 não enviado. Verifique o Histórico de Eventos para detalhes.";
  return `Entendido! Analisando "${msg}" no contexto do Portal da Reforma Tributária. Em breve trarei os dados consolidados.`;
}

// ── Component ─────────────────────────────────────────────────────
export function HomeQueryBox() {
  const { addMessage, sendInsight, setThinking, thinking } = useBIAChat();
  const [value, setValue] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycling placeholder animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIdx((i) => (i + 1) % SUGGESTIONS.length);
        setPlaceholderVisible(true);
      }, 400);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  async function handleSend() {
    const text = value.trim();
    if (!text || thinking) return;
    setValue("");
    const skill = detectSkill(text);
    const response = buildResponse(text);
    addMessage({ role: "user", content: text });
    setThinking(true);
    await new Promise((r) => setTimeout(r, 1600));
    setThinking(false);
    sendInsight(response, "insight", skill);
  }

  function handleSuggestionClick(suggestion: string) {
    setValue(suggestion);
    inputRef.current?.focus();
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <span className="text-[14px] font-semibold text-primary">
          O que você está pensando?
        </span>
        <span className="ml-auto text-[10px] font-semibold text-primary-foreground bg-primary rounded px-2 py-0.5 tracking-wide">
          IA
        </span>
      </div>

      {/* Input com placeholder animado */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={thinking}
            className="w-full h-10 rounded-lg border border-primary/30 bg-white/80 pl-3 pr-3 text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-shadow disabled:opacity-60"
          />
          {value.length === 0 && (
            <span
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground/70 truncate max-w-[90%] transition-opacity duration-500",
                placeholderVisible ? "opacity-100" : "opacity-0"
              )}
            >
              {SUGGESTIONS[placeholderIdx]}
            </span>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={!value.trim() || thinking}
          className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Chips de sugestão */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSuggestionClick(s)}
            disabled={thinking}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 px-3 py-1 text-[12px] text-primary hover:bg-primary/15 hover:border-primary/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-[10px]">▸</span>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
