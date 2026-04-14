import { useState } from "react";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const INITIAL_MESSAGE =
  "Olá! A apuração de Mai/2026 da empresa Sankhya Tecnologia em Sistemas S.A. possui 2 alertas de divergência entre o ERP e a Receita. Deseja analisar?";

interface Message {
  role: "bia" | "user";
  content: string;
}

export function BIAChat() {
  const [open, setOpen] = useState(false);
  const [messages] = useState<Message[]>([
    { role: "bia", content: INITIAL_MESSAGE },
  ]);
  const [input, setInput] = useState("");

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] rounded-xl border bg-card card-shadow flex flex-col overflow-hidden" style={{ height: 520 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">BIA</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-80">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b text-sm">
            <button className="flex-1 py-2 font-medium text-primary border-b-2 border-primary">Chat</button>
            <button className="flex-1 py-2 text-muted-foreground">Histórico</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "bia" ? "" : "flex justify-end"}>
                {m.role === "bia" ? (
                  <div>
                    <p className="text-primary font-bold text-sm mb-1">Olá,</p>
                    <p className="text-sm text-foreground leading-relaxed">{m.content}</p>
                  </div>
                ) : (
                  <div className="bg-muted rounded-lg px-3 py-2 max-w-[80%]">
                    <p className="text-sm">{m.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite seu comando"
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                A BIA utiliza inteligência artificial. Sempre revise as informações.
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="text-xs border-primary text-primary gap-1">
                  Escolher agente <ChevronDown className="h-3 w-3" />
                </Button>
                <Button size="sm" className="h-8 w-8 p-0 bg-primary text-primary-foreground">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
