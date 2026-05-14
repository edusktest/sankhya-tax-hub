import { createContext, useContext, useState, ReactNode } from "react";

export type BIASkill = "Consultor Tributário" | "Assistente de ERP";

export interface BIAMessage {
  role: "bia" | "user";
  content: string;
  tag?: "alerta" | "insight" | "info";
  skill?: BIASkill;
}

interface BIAChatContextValue {
  messages: BIAMessage[];
  isOpen: boolean;
  thinking: boolean;
  setIsOpen: (v: boolean) => void;
  setThinking: (v: boolean) => void;
  addMessage: (msg: BIAMessage) => void;
  sendInsight: (content: string, tag?: BIAMessage["tag"], skill?: BIASkill) => void;
}

const BIAChatContext = createContext<BIAChatContextValue | null>(null);

const INITIAL_MESSAGES: BIAMessage[] = [
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

export function BIAChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<BIAMessage[]>(INITIAL_MESSAGES);
  const [isOpen, setIsOpen] = useState(true);
  const [thinking, setThinking] = useState(false);

  function addMessage(msg: BIAMessage) {
    setMessages((prev) => [...prev, msg]);
  }

  function sendInsight(content: string, tag: BIAMessage["tag"] = "insight", skill?: BIASkill) {
    setIsOpen(true);
    setMessages((prev) => [...prev, { role: "bia", content, tag, skill }]);
  }

  return (
    <BIAChatContext.Provider value={{ messages, isOpen, thinking, setIsOpen, setThinking, addMessage, sendInsight }}>
      {children}
    </BIAChatContext.Provider>
  );
}

export function useBIAChat() {
  const ctx = useContext(BIAChatContext);
  if (!ctx) throw new Error("useBIAChat must be used within BIAChatProvider");
  return ctx;
}
