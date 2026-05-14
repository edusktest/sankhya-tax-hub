import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, ChevronUp } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useBIAChat } from "@/context/BIAChatContext";
import type { BIASkill } from "@/context/BIAChatContext";
import { cn } from "@/lib/utils";

// ── Skill routing ─────────────────────────────────────────────────
const TAX_KEYS = ["prazo", "entrega", "alíquota", "tributação", "reforma", "cbs", "ibs", "dere", "fiscal", "apuração", "d-1001", "d-1011", "legislação", "lei", "percentual", "ncm", "cclass", "isenção", "redução", "imposto"];
const ERP_KEYS = ["empresa", "habilitar", "módulo", "configurar", "cadastro", "filial", "cnpj", "sankhya", "integração", "erp", "sistema", "parametrizar"];

function detectSkill(msg: string): BIASkill {
  const lower = msg.toLowerCase();
  const taxScore = TAX_KEYS.filter((k) => lower.includes(k)).length;
  const erpScore = ERP_KEYS.filter((k) => lower.includes(k)).length;
  return taxScore >= erpScore ? "Consultor Tributário" : "Assistente de ERP";
}

// ── Per-page context ──────────────────────────────────────────────
type KeywordResponse = { keywords: string[]; reply: string };

type PageContext = {
  suggestions: [string, string, string];
  responses: KeywordResponse[];
  fallback: string;
};

const PAGE_CONTEXTS: Record<string, PageContext> = {
  "/home": {
    suggestions: [
      "Quais empresas precisam de atenção este mês?",
      "Qual o status geral das apurações?",
      "Há eventos com erro ou pendências críticas?",
    ],
    responses: [
      { keywords: ["atenção", "pendente", "empresa", "problema"], reply: "Identifiquei 3 pontos críticos: Beta Factoring Ltda. e Delta Comercio ME sem módulos habilitados, e Gamma Seguros S.A. com evento D-1001 em Processando há +24h." },
      { keywords: ["status", "apuração", "geral", "resumo"], reply: "CBS: 2 em andamento, 1 concluído. IBS: 2 em andamento, 1 concluído. IS: sem apurações no período. DeRE: D-1001 com 1 erro, D-1011 com 1 não enviado." },
      { keywords: ["erro", "evento", "pendência", "crítico"], reply: "Encontrei 2 ocorrências com problema: D-1001 da Gamma Seguros S.A. (em Processando há +24h sem recibo) e 1 D-1011 não enviado por falta de Plano Referencial." },
    ],
    fallback: "Analisando o painel geral do Portal. Em breve trarei os dados consolidados.",
  },

  "/apuracao-cbs": {
    suggestions: [
      "Quais apurações CBS têm divergências?",
      "Qual o prazo de entrega da CBS para Mai/2026?",
      "Como estão os créditos da Financeira Alpha?",
    ],
    responses: [
      { keywords: ["divergência", "erro", "alerta", "problema"], reply: "A Financeira Alpha S.A. tem 2 divergências entre o ERP e a Receita Federal na CBS de Mai/2026. Recomendo revisar os créditos de PIS/COFINS migrados antes do envio." },
      { keywords: ["prazo", "data", "entrega", "quando"], reply: "O prazo de entrega da CBS para Mai/2026 é 30/06/2026. Recomendo antecipar a revisão dado o alerta de divergências na Financeira Alpha." },
      { keywords: ["crédito", "alpha", "saldo"], reply: "A Financeira Alpha S.A. acumulou R$ 48.320,00 em créditos de CBS neste período. Há 2 NCMs sem cClass confirmado que podem impactar o saldo final." },
    ],
    fallback: "Analisando a apuração CBS. Em breve trarei os dados consolidados.",
  },

  "/apuracao-ibs": {
    suggestions: [
      "Quais apurações IBS estão com alerta?",
      "Qual o prazo de entrega do IBS para Mai/2026?",
      "Como está o saldo de IBS no período?",
    ],
    responses: [
      { keywords: ["alerta", "divergência", "erro", "problema"], reply: "A Financeira Alpha S.A. tem 2 divergências no IBS de Mai/2026. As operações intermunicipais da Alpha Filial SP precisam de revisão na alíquota municipal." },
      { keywords: ["prazo", "data", "entrega", "quando"], reply: "O prazo de entrega do IBS para Mai/2026 é 30/06/2026." },
      { keywords: ["saldo", "devedor", "credor", "resultado"], reply: "Resumo IBS Mai/2026: 2 apurações com resultado Credor, 1 Devedor. Saldo líquido estimado credor: R$ 12.400,00." },
    ],
    fallback: "Analisando a apuração IBS. Em breve trarei os dados consolidados.",
  },

  "/apuracao-is": {
    suggestions: [
      "Quais produtos estão sujeitos ao Imposto Seletivo?",
      "Há apurações IS abertas no período?",
      "Qual a alíquota IS para bebidas alcoólicas?",
    ],
    responses: [
      { keywords: ["produto", "sujeito", "incide", "enquadra"], reply: "O IS incide sobre tabaco, bebidas alcoólicas, açucaradas, veículos e nocivos à saúde. Nenhum produto das empresas selecionadas está enquadrado no período atual." },
      { keywords: ["aberta", "andamento", "período", "tem", "há"], reply: "Não identifiquei apurações IS abertas para Mai/2026. O IS só será necessário para empresas com produtos do Anexo VIII da LC 214/2025." },
      { keywords: ["alíquota", "bebida", "taxa", "percentual", "alcoólica"], reply: "A alíquota IS para bebidas alcoólicas é 10% sobre a receita bruta (LC 214/2025 Art. 215). Consulte o Anexo VIII para a tabela completa por categoria." },
    ],
    fallback: "Analisando dados do Imposto Seletivo. Em breve trarei os dados consolidados.",
  },

  "/apuracao-dere": {
    suggestions: [
      "Quais empresas preciso habilitar para a DeRE?",
      "Qual a data de entrega da DeRE para Mai/2026?",
      "Quais eventos DeRE estão com erro?",
    ],
    responses: [
      { keywords: ["habilitar", "empresa", "módulo"], reply: "Identifico 5 empresas sem o módulo DeRE habilitado: Alpha Filial SP, Beta Factoring Ltda., Gamma Seguros S.A., Delta Comercio ME e Empresa Teste. Deseja ir para a tela de Empresas para configurá-las?" },
      { keywords: ["data", "prazo", "entrega", "quando"], reply: "O prazo de entrega da DeRE para Mai/2026 é 30/06/2026. A Gamma Seguros S.A. tem um D-1001 em processamento há mais de 24h — recomendo acompanhar antes do envio final." },
      { keywords: ["erro", "evento", "problema", "rejeitado"], reply: "Encontrei 2 ocorrências: D-1001 da Gamma Seguros S.A. (em Processando há +24h sem recibo) e 1 D-1011 não enviado. Verifique o Histórico de Eventos para detalhes." },
    ],
    fallback: "Analisando a DeRE. Em breve trarei os dados consolidados.",
  },

  "/gestao-eventos": {
    suggestions: [
      "Quais eventos estão com erro hoje?",
      "Como reenviar um evento rejeitado?",
      "Qual o status dos eventos da Gamma Seguros?",
    ],
    responses: [
      { keywords: ["erro", "rejeitado", "falha", "problema"], reply: "2 eventos com problema: D-1001 da Gamma Seguros S.A. (Processando há +24h sem recibo) e 1 D-1011 não enviado por falta de Plano Referencial." },
      { keywords: ["reenviar", "como", "reprocessar", "corrigir"], reply: "Para reenviar: acesse o Histórico de Eventos, localize o evento com status Erro e clique em Reenviar. O sistema recalcula e submete novamente à SEFAZ/RFB." },
      { keywords: ["gamma", "status", "seguros"], reply: "Gamma Seguros S.A.: D-1001 em Processando há +24h sem recibo de protocolo. D-1011 Mai/2026 não enviado — Plano Referencial ausente." },
    ],
    fallback: "Analisando os eventos. Em breve trarei os dados consolidados.",
  },

  "/configuracoes/empresas": {
    suggestions: [
      "Quais empresas não têm módulos habilitados?",
      "Como habilitar a DeRE para uma empresa?",
      "Quais empresas são do Simples Nacional?",
    ],
    responses: [
      { keywords: ["sem módulo", "não habilit", "pendente", "faltando", "sem nenhum"], reply: "4 empresas com pendências: Beta Factoring Ltda., Delta Comercio ME e Empresa Teste sem nenhum módulo, e Alpha Filial SP sem DeRE. Deseja navegar para configurá-las?" },
      { keywords: ["habilitar", "como", "dere", "ativar"], reply: "Para habilitar a DeRE: acesse a empresa → aba Módulos → ative 'DeRE'. A empresa precisa ter ao menos um documento fiscal configurado (NF-e, NFS-e, CT-e ou NFCom)." },
      { keywords: ["simples", "mei", "regime", "optante"], reply: "Somente Delta Comercio ME é optante pelo Simples Nacional. Empresas do Simples estão fora do escopo das apurações CBS/IBS e DeRE neste portal." },
    ],
    fallback: "Analisando a configuração das empresas. Em breve trarei os dados.",
  },

  "/tributacao-integral": {
    suggestions: [
      "O que é tributação integral IBS/CBS?",
      "Quais empresas ainda não configuraram?",
      "Qual a alíquota padrão da reforma tributária?",
    ],
    responses: [
      { keywords: ["o que é", "explica", "conceito", "como funciona"], reply: "Tributação Integral aplica as alíquotas-padrão do IBS e CBS sem reduções ou isenções específicas. É o regime padrão para empresas que não se enquadram nos Anexos de benefício da LC 214/2025." },
      { keywords: ["quais", "empresa", "configurar", "pendente", "faltando"], reply: "2 de 3 empresas habilitadas ainda não configuraram a tributação integral: Beta Factoring Ltda. e Financeira Alpha S.A. Deseja iniciar a configuração?" },
      { keywords: ["alíquota", "padrão", "taxa", "percentual"], reply: "Alíquota padrão combinada CBS+IBS em 2026: 10,6% (CBS 0,9% + IBS 9,7%). Em vigência plena a partir de 2033 chegará a 26,5%, conforme o cronograma da LC 214/2025." },
    ],
    fallback: "Analisando a configuração de tributação integral. Em breve trarei os dados.",
  },

  "/tributacao-personalizada": {
    suggestions: [
      "Quais NCMs posso configurar de forma personalizada?",
      "Qual a redução de IBS/CBS para medicamentos?",
      "Como funciona a isenção da cesta básica?",
    ],
    responses: [
      { keywords: ["ncm", "código", "personaliz", "quais"], reply: "Você pode configurar tributação personalizada para NCMs listados nos Anexos I–XVIII da LC 214/2025. Maior impacto: saúde (isenção total), alimentos básicos (60% de redução) e higiene feminina (50–100%)." },
      { keywords: ["medicamento", "saúde", "remédio", "isenção"], reply: "Medicamentos enquadrados no Art. 147 I da LC 214/2025 têm isenção total de CBS e IBS (100% de redução), incluindo registros na ANVISA com NCM 3004." },
      { keywords: ["cesta básica", "alimento", "básico", "arroz", "feijão"], reply: "Alimentos da Cesta Básica Nacional têm isenção total (100%). Outros alimentos do Anexo II têm redução de 60%. Ex: arroz NCM 1006, feijão NCM 0713, leite NCM 0401." },
    ],
    fallback: "Analisando configurações de tributação personalizada. Em breve trarei os dados.",
  },

  "/configuracoes/aliquotas": {
    suggestions: [
      "Qual a alíquota CBS vigente para 2026?",
      "Como calcular o crédito de CBS/IBS?",
      "Quais alíquotas se aplicam à minha atividade?",
    ],
    responses: [
      { keywords: ["cbs", "alíquota", "vigente", "2026"], reply: "Alíquota CBS 2026: 0,9%. IBS estadual/municipal 2026: 9,7%. Total combinado: 10,6%. A alíquota plena (após 2033) será CBS 8,8% + IBS 17,7% = 26,5%." },
      { keywords: ["crédito", "calcular", "como", "aproveitamento"], reply: "O crédito é calculado sobre entradas tributadas: valor da nota × alíquota CBS ou IBS. Créditos acumulados podem ser compensados ou ressarcidos conforme LC 214/2025 Art. 28." },
      { keywords: ["atividade", "setor", "minha", "serviço", "comércio"], reply: "Alíquotas variam por atividade: serviços financeiros (redução 30%), saúde (isenção), educação (isenção), agropecuária (isenção). Informe sua atividade para análise específica." },
    ],
    fallback: "Analisando a tabela de alíquotas. Em breve trarei os dados.",
  },

  "/configuracoes/tabelas": {
    suggestions: [
      "Quando foi a última atualização das tabelas?",
      "Como funciona a classificação tributária?",
      "O que são os indicadores dos locais de operação?",
    ],
    responses: [
      { keywords: ["atualização", "última", "quando", "versão"], reply: "A última versão das tabelas oficiais é v1.2.0 publicada em 15/03/2026 pelo ENCAT/RFB. Use o botão 'Agendar Atualização' para sincronizar com a API oficial." },
      { keywords: ["classificação", "tributária", "cclass", "código"], reply: "A Classificação Tributária (cClass) identifica o regime de cada produto para IBS/CBS. Estruturada em 4 níveis hierárquicos, derivada dos Anexos I–XVIII da LC 214/2025. Cada NCM deve ser mapeado a um cClass." },
      { keywords: ["indicador", "local", "operação", "município"], reply: "Os Indicadores dos Locais de Operação definem qual município e estado são competentes para arrecadar o IBS em cada transação. Essenciais para a DeRE e para o cálculo de partilha federativa." },
    ],
    fallback: "Analisando tabelas oficiais da reforma. Em breve trarei os dados.",
  },
};

function getPageContext(pathname: string): PageContext {
  const key = Object.keys(PAGE_CONTEXTS)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname.startsWith(k));
  return key ? PAGE_CONTEXTS[key] : PAGE_CONTEXTS["/home"];
}

function buildContextResponse(msg: string, ctx: PageContext): string {
  const lower = msg.toLowerCase();
  const match = ctx.responses.find((r) => r.keywords.some((k) => lower.includes(k)));
  if (match) return match.reply;
  return ctx.fallback.replace(
    "Em breve trarei os dados consolidados.",
    `Analisando "${msg}". Em breve trarei os dados consolidados.`
  );
}

// ── Component ─────────────────────────────────────────────────────
export function HomeQueryBox({ onCollapse }: { onCollapse?: () => void }) {
  const { addMessage, sendInsight, setThinking, thinking } = useBIAChat();
  const { pathname } = useLocation();
  const ctx = getPageContext(pathname);

  const [value, setValue] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset placeholder when route changes
  useEffect(() => {
    setPlaceholderIdx(0);
    setPlaceholderVisible(true);
  }, [pathname]);

  // Cycling placeholder animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIdx((i) => (i + 1) % ctx.suggestions.length);
        setPlaceholderVisible(true);
      }, 400);
    }, 3200);
    return () => clearInterval(interval);
  }, [ctx]);

  async function handleSend() {
    const text = value.trim();
    if (!text || thinking) return;
    setValue("");
    const skill = detectSkill(text);
    const response = buildContextResponse(text, ctx);
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
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-primary-foreground bg-primary rounded px-2 py-0.5 tracking-wide">
            IA
          </span>
          {onCollapse && (
            <button
              onClick={onCollapse}
              title="Ocultar"
              className="text-primary/60 hover:text-primary transition-colors p-0.5 rounded"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
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
              {ctx.suggestions[placeholderIdx]}
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
        {ctx.suggestions.map((s) => (
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
