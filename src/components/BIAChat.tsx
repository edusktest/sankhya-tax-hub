import { useState, useRef, useEffect } from "react";
import { Send, ChevronRight, ChevronLeft, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  role: "bia" | "user";
  content: string;
  tag?: "alerta" | "insight" | "info";
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: "bia",
    content: "Olá, Eduardo! Monitorei o portal e tenho alguns insights para você hoje.",
    tag: "info",
  },
  {
    role: "bia",
    content:
      "Apuração CBS — Mai/2026: a Financeira Alpha S.A. tem 2 divergências entre o ERP e a Receita Federal. Recomendo revisar os créditos antes do envio.",
    tag: "alerta",
  },
  {
    role: "bia",
    content:
      "DeRE — D-1001: o evento da Gamma Seguros S.A. está em Processando há mais de 24h sem recibo. Verifique o Histórico de Eventos para acompanhar o retorno.",
    tag: "insight",
  },
  {
    role: "bia",
    content:
      "Configurações: Beta Factoring Ltda. e Delta Comercio ME não têm nenhum módulo habilitado no portal. Deseja ir para a tela de Empresas para configurá-las?",
    tag: "insight",
  },
];

const TAG_STYLES: Record<NonNullable<Message["tag"]>, string> = {
  alerta: "bg-warning/15 text-warning border border-warning/30",
  insight: "bg-primary/10 text-primary border border-primary/20",
  info: "bg-muted text-muted-foreground border border-border",
};

const TAG_LABELS: Record<NonNullable<Message["tag"]>, string> = {
  alerta: "Alerta",
  insight: "Insight",
  info: "Info",
};

export function BIAChat() {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      {
        role: "bia",
        content:
          "Entendido! Estou analisando sua solicitação sobre o Portal da Reforma Tributária. Em breve trarei os dados consolidados.",
        tag: "info",
      },
    ]);
    setInput("");
  }

  return (
    <div
      className={cn(
        "flex flex-col border-l bg-card shrink-0 transition-[width] duration-200 overflow-hidden",
        open ? "w-[340px]" : "w-12"
      )}
    >
      {/* Header */}
      {open ? (
        <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-primary text-primary-foreground shrink-0">
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">BIA</p>
            <p className="text-[10px] text-primary-foreground/70 leading-tight">
              Assistente de IA · Reforma Tributária
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="hover:bg-white/10 rounded p-1 transition-colors shrink-0"
            title="Recolher"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-2 py-3 border-b bg-primary text-primary-foreground shrink-0 hover:bg-primary/90 transition-colors w-full"
          title="Expandir assistente"
        >
          <Sparkles className="h-4 w-4" />
          <ChevronLeft className="h-3 w-3" />
        </button>
      )}

      {/* Collapsed label */}
      {!open && (
        <div
          className="flex-1 flex items-center justify-center cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <span
            className="text-[9px] font-semibold text-muted-foreground tracking-[0.2em] uppercase select-none"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Assistente IA
          </span>
        </div>
      )}

      {/* Messages */}
      {open && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              {m.role === "bia" ? (
                <div className="flex items-start gap-2 max-w-full">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {m.tag && (
                      <span
                        className={cn(
                          "inline-block text-[9px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 mb-1",
                          TAG_STYLES[m.tag]
                        )}
                      >
                        {TAG_LABELS[m.tag]}
                      </span>
                    )}
                    <div className="bg-muted/60 rounded-lg px-3 py-2">
                      <p className="text-[12px] text-foreground leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-[85%]">
                  <p className="text-[12px] leading-relaxed">{m.content}</p>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      {open && (
        <div className="border-t p-3 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Pergunte sobre o portal…"
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-primary"
            />
            <Button size="sm" className="h-8 w-8 p-0 shrink-0" onClick={sendMessage}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            A BIA utiliza IA. Sempre revise as informações.
          </p>
        </div>
      )}
    </div>
  );
}
