import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp, Sparkles, Bot, Gem, AlertTriangle, ChevronRight,
  Home, Plus, ChevronDown, CheckCircle2, Clock,
} from "lucide-react";
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

// ── Skill options for + menu ──────────────────────────────────────
const SKILL_OPTIONS = [
  { id: "dere", label: "DeRE", prompt: "Enviar eventos pendentes da DeRE" },
  { id: "aliquota-integral", label: "Alíquota Integral", prompt: "Configurar tributação com alíquota integral" },
  { id: "excecoes-tributacao", label: "Exceções da Tributação Integral", prompt: "Configurar exceções da Tributação Integral de IBS/CBS para NCM/NBS específicos" },
];

const DERE_TRIGGER = "Enviar eventos pendentes da DeRE";

// ── Digital Workers ───────────────────────────────────────────────
interface DigitalWorker {
  id: string;
  name: string;
  pendingCount: number;
  triggerMessage: string;
  biaResponse: string;
  skill: BIASkill;
  lastUpdate: string;
  tasksCompleted: number;
  tasksScheduled: number;
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
    lastUpdate: "há 12 min",
    tasksCompleted: 47,
    tasksScheduled: 3,
  },
  {
    id: "dere",
    name: "Assistente de DeRE",
    pendingCount: 1,
    triggerMessage: "Quais são as aprovações pendentes do Assistente de DeRE?",
    biaResponse:
      "O Assistente de DeRE tem 1 aprovação pendente:\n\nPlano Referencial — Gamma Seguros S.A. (Mai/2026) — O Plano Referencial precisa de validação antes do envio do D-1011. O evento D-1001 está em Processando há +24h sem recibo de protocolo. Deseja revisar agora?",
    skill: "Consultor Tributário",
    lastUpdate: "há 1h",
    tasksCompleted: 23,
    tasksScheduled: 1,
  },
  {
    id: "cbs",
    name: "Assistente de Apuração de CBS",
    pendingCount: 0,
    triggerMessage: "Qual o status do Assistente de Apuração de CBS?",
    biaResponse:
      "Assistente de Apuração de CBS está operando normalmente. Todas as apurações de Mai/2026 estão dentro do prazo e sem divergências críticas. A Financeira Alpha S.A. tem 2 alertas de NCM, mas nenhum bloqueio para envio.",
    skill: "Consultor Tributário",
    lastUpdate: "há 35 min",
    tasksCompleted: 61,
    tasksScheduled: 0,
  },
  {
    id: "ibs",
    name: "Assistente de Apuração de IBS",
    pendingCount: 0,
    triggerMessage: "Qual o status do Assistente de Apuração de IBS?",
    biaResponse:
      "Assistente de Apuração de IBS está operando normalmente. 3 apurações de Mai/2026 processadas sem erros. Saldo líquido estimado credor: R$ 12.400,00. Nenhuma ação pendente.",
    skill: "Consultor Tributário",
    lastUpdate: "há 4h",
    tasksCompleted: 58,
    tasksScheduled: 0,
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
  const [expanded, setExpanded] = useState(false);
  const hasPending = worker.pendingCount > 0;

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        hasPending
          ? "border-amber-200 bg-amber-50"
          : "border-emerald-200 bg-emerald-50/60"
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 px-3 py-2">
        {/* Clickable area — activates the worker */}
        <div
          onClick={() => onActivate(worker)}
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
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
        </div>

        {/* Expand / collapse chevron */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1 rounded-md hover:bg-black/5 transition-colors shrink-0 ml-0.5"
          aria-label={expanded ? "Recolher" : "Expandir"}
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              hasPending ? "text-amber-600/70" : "text-emerald-600/70",
              expanded && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          className={cn(
            "px-3 pb-3 pt-2 border-t",
            hasPending ? "border-amber-200/60" : "border-emerald-200/60"
          )}
        >
          {/* Period label (left) + last update (right) */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
              Últimos 30 dias
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              Atualizado {worker.lastUpdate}
            </span>
          </div>

          {/* Totalizadores */}
          <div className="flex gap-6 mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[20px] font-bold text-foreground leading-none">
                  {worker.tasksCompleted}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Tarefas realizadas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary/60 shrink-0" />
              <div>
                <p className="text-[20px] font-bold text-foreground leading-none">
                  {worker.tasksScheduled}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Tarefas agendadas</p>
              </div>
            </div>
          </div>

          {/* Resolver pendências — only when there are pending items */}
          {hasPending && (
            <button
              onClick={() => onActivate(worker)}
              className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white text-[12px] font-semibold py-1.5 transition-all"
            >
              Resolver pendências
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export function ConversationalLanding() {
  const { addMessage, setThinking, sendInsight, setPendingAction, skipToLayout } = useBIAChat();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // + menu state
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showSkillSubmenu, setShowSkillSubmenu] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const [pendingDeREFlow, setPendingDeREFlow] = useState(false);
  const [pendingIntegralFlow, setPendingIntegralFlow] = useState(false);
  const [pendingExcecoesFlow, setPendingExcecoesFlow] = useState(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [value]);

  // Close + menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setShowPlusMenu(false);
        setShowSkillSubmenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  async function handleDeREFlow(userText: string) {
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    addMessage({ role: "user", content: userText });
    navigate(ERoutes.APURACAO_DERE);

    setThinking(true);
    await sleep(500);
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

    setPendingAction(async (event: string) => {
      if (event === "d1011") {
        setThinking(true);
        await sleep(500);
        setThinking(false);
        addMessage({
          role: "bia",
          content: "O assistente de D-1011 ainda não está disponível. Em breve você poderá enviá-lo por aqui.",
          tag: "info",
          skill: "Consultor Tributário",
        });
        setPendingAction(null);
        return;
      }

      setThinking(true);
      await sleep(500);
      setThinking(false);

      addMessage({
        role: "bia",
        content: "Existe 1 empresa com D-1001 não enviado. Deseja enviar?",
        tag: "insight",
        skill: "Consultor Tributário",
        quickReplies: [
          { label: "Sim", value: "sim" },
          { label: "Não", value: "nao" },
        ],
      });

      setPendingAction(async (answer: string) => {
        if (answer === "nao") { setPendingAction(null); return; }

        navigate(ERoutes.APURACAO_DERE_D1001, {
          state: { fromBIA: true, wizScreen: "d1001-wiz", wizStep: 1 },
        });

        setThinking(true);
        await sleep(500);
        setThinking(false);

        addMessage({
          role: "bia",
          content: "Confira as empresas. Posso avançar?",
          tag: "insight",
          skill: "Consultor Tributário",
          quickReplies: [
            { label: "Sim", value: "sim" },
            { label: "Não", value: "nao" },
          ],
        });

        setPendingAction(async (answer2: string) => {
          if (answer2 === "nao") { setPendingAction(null); return; }

          setThinking(true);
          await sleep(500);
          setThinking(false);

          addMessage({
            role: "bia",
            content: "Qual o regime tributário principal?",
            tag: "insight",
            skill: "Consultor Tributário",
            quickReplies: [
              { label: "9 – Normas Gerais", value: "9" },
              { label: "1 – Serviços Financeiros", value: "1" },
              { label: "2 – Plano de Saúde", value: "2" },
            ],
          });

          setPendingAction(async (regime: string) => {
            setThinking(true);
            await sleep(500);
            setThinking(false);

            addMessage({
              role: "bia",
              content: "Qual a natureza tributária?",
              tag: "insight",
              skill: "Consultor Tributário",
              quickReplies: [
                { label: "0 – Tributação regular", value: "0" },
                { label: "1 – Imunidade ou não incidência", value: "1" },
              ],
            });

            setPendingAction(async (natureza: string) => {
              navigate(ERoutes.APURACAO_DERE_D1001, {
                state: { fromBIA: true, wizScreen: "d1001-wiz", wizStep: 3, regime, natureza },
              });

              setThinking(true);
              await sleep(500);
              setThinking(false);

              addMessage({
                role: "bia",
                content: "Preenchi os dados. Informe as atividades diretamente na tela e me avise para seguir.",
                tag: "insight",
                skill: "Consultor Tributário",
                quickReplies: [{ label: "Seguir para envio", value: "seguir" }],
              });

              setPendingAction(async () => {
                navigate(ERoutes.APURACAO_DERE_D1001, {
                  state: { fromBIA: true, wizScreen: "d1001-wiz", wizStep: 4 },
                });

                setThinking(true);
                await sleep(500);
                setThinking(false);

                addMessage({
                  role: "bia",
                  content: "Confira o resumo. Posso realizar o envio?",
                  tag: "insight",
                  skill: "Consultor Tributário",
                  quickReplies: [
                    { label: "Sim, enviar", value: "sim" },
                    { label: "Não", value: "nao" },
                  ],
                });

                setPendingAction(async () => {
                  setThinking(true);
                  await sleep(500);
                  setThinking(false);

                  addMessage({
                    role: "bia",
                    content: "Deseja consultar o histórico?",
                    tag: "insight",
                    skill: "Consultor Tributário",
                    quickReplies: [
                      { label: "Sim", value: "sim", url: ERoutes.APURACAO_DERE_HISTORICO },
                      { label: "Não", value: "nao" },
                    ],
                  });

                  setPendingAction((ans: string) => {
                    if (ans === "nao") setPendingAction(null);
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  async function handleIntegralFlow(userText: string) {
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    addMessage({ role: "user", content: userText });
    navigate(ERoutes.TRIBUTACAO_INTEGRAL);

    setThinking(true);
    await sleep(500);
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

    setPendingAction(async (answer: string) => {
      if (answer === "nao") { setPendingAction(null); return; }

      navigate(ERoutes.TRIBUTACAO_INTEGRAL, {
        state: { fromBIA: true, step: 1, selAllEmpresas: true },
      });

      setThinking(true);
      await sleep(500);
      setThinking(false);

      addMessage({
        role: "bia",
        content: "Confira as empresas. Posso seguir para próxima etapa?",
        tag: "insight",
        skill: "Consultor Tributário",
        quickReplies: [
          { label: "Sim", value: "sim" },
          { label: "Não", value: "nao" },
        ],
      });

      setPendingAction(async (answer2: string) => {
        if (answer2 === "nao") { setPendingAction(null); return; }

        navigate(ERoutes.TRIBUTACAO_INTEGRAL, {
          state: { fromBIA: true, step: 2, selTop0: true },
        });

        setThinking(true);
        await sleep(500);
        setThinking(false);

        addMessage({
          role: "bia",
          content: "Selecionei a TOP 0. Se desejar adicionar mais alguma me fale os números aqui ou marque na tela e me avise para continuar.",
          tag: "insight",
          skill: "Consultor Tributário",
          quickReplies: [{ label: "Continuar", value: "continuar" }],
        });

        setPendingAction(async () => {
          navigate(ERoutes.TRIBUTACAO_INTEGRAL, {
            state: { fromBIA: true, step: 3 },
          });

          setThinking(true);
          await sleep(500);
          setThinking(false);

          addMessage({
            role: "bia",
            content: "Estou pronta para seguir para última etapa. Confira na tela se está tudo OK.",
            tag: "insight",
            skill: "Consultor Tributário",
            quickReplies: [{ label: "Confirmar", value: "confirmar" }],
          });

          setPendingAction(async () => {
            navigate(ERoutes.TRIBUTACAO_INTEGRAL, {
              state: { fromBIA: true, step: 4 },
            });

            setThinking(true);
            await sleep(500);
            setThinking(false);

            addMessage({
              role: "bia",
              content: "Pronto. Agora vamos finalizar o cadastro, veja o resumo e me avisa se posso finalizar.",
              tag: "insight",
              skill: "Consultor Tributário",
              quickReplies: [{ label: "Finalizar", value: "finalizar" }],
            });

            setPendingAction(async () => {
              navigate(ERoutes.TRIBUTACAO_INTEGRAL, {
                state: { fromBIA: true, step: 5 },
              });

              setThinking(true);
              await sleep(500);
              setThinking(false);

              addMessage({
                role: "bia",
                content: "Configuração realizada com sucesso! As alíquotas integrais foram aplicadas a todas as empresas selecionadas.",
                tag: "insight",
                skill: "Consultor Tributário",
              });

              setPendingAction(null);
            });
          });
        });
      });
    });
  }

  async function handleExcecoesFlow(userText: string) {
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    addMessage({ role: "user", content: userText });

    // Navega direto para diagnóstico com todos os NCMs aguardando selecionados
    navigate(ERoutes.CONFIG_ASSISTENTE_EXCECOES, {
      state: { fromBIA: true, selectAll: true },
    });

    setThinking(true);
    await sleep(1200);
    setThinking(false);

    addMessage({
      role: "bia",
      content: "Encontrei 35 NCM/NBS vendidas nos últimos 90 dias com exceções de alíquota integral de IBS e CBS que não foram configuradas. Verifiquei as NCM que deseja configurar e me avise para continuar",
      tag: "insight",
      skill: "Consultor Tributário",
      quickReplies: [{ label: "Continuar", value: "continuar" }],
    });

    // Etapa 1: UF/Município
    setPendingAction(async () => {
      navigate(ERoutes.CONFIG_ASSISTENTE_EXCECOES, {
        state: { fromBIA: true, screen: 3, wizardStep: 1 },
      });

      setThinking(true);
      await sleep(600);
      setThinking(false);

      addMessage({
        role: "bia",
        content: "Para qual UF/Município de destino? Estou considerando todas as UFs/Municípios sem restrição (recomendado). Posso seguir?",
        tag: "insight",
        skill: "Consultor Tributário",
        quickReplies: [
          { label: "Sim", value: "sim" },
          { label: "Não", value: "nao" },
        ],
      });

      // Etapa 2: NCM/NBS
      setPendingAction(async (ans0: string) => {
        if (ans0 === "nao") { setPendingAction(null); return; }

        navigate(ERoutes.CONFIG_ASSISTENTE_EXCECOES, {
          state: { fromBIA: true, screen: 3, wizardStep: 2 },
        });

        setThinking(true);
        await sleep(600);
        setThinking(false);

        addMessage({
          role: "bia",
          content: "Confirme os NCMs/NBS selecionados para configuração. Posso seguir?",
          tag: "insight",
          skill: "Consultor Tributário",
          quickReplies: [
            { label: "Sim", value: "sim" },
            { label: "Não", value: "nao" },
          ],
        });

        // Etapa 3: Empresa
        setPendingAction(async (ans1: string) => {
          if (ans1 === "nao") { setPendingAction(null); return; }

          navigate(ERoutes.CONFIG_ASSISTENTE_EXCECOES, {
            state: { fromBIA: true, screen: 3, wizardStep: 3, selAllEmpresas: true },
          });

          setThinking(true);
          await sleep(600);
          setThinking(false);

          addMessage({
            role: "bia",
            content: "Selecionei todas as empresas do grupo. Posso seguir?",
            tag: "insight",
            skill: "Consultor Tributário",
            quickReplies: [
              { label: "Sim", value: "sim" },
              { label: "Não", value: "nao" },
            ],
          });

          // Etapa 4: Operação (TOPs)
          setPendingAction(async (ans2: string) => {
            if (ans2 === "nao") { setPendingAction(null); return; }

            navigate(ERoutes.CONFIG_ASSISTENTE_EXCECOES, {
              state: { fromBIA: true, screen: 3, wizardStep: 4, selAllTops: true },
            });

            setThinking(true);
            await sleep(600);
            setThinking(false);

            addMessage({
              role: "bia",
              content: "Selecionei todas as TOPs (recomendado). Posso seguir?",
              tag: "insight",
              skill: "Consultor Tributário",
              quickReplies: [
                { label: "Sim", value: "sim" },
                { label: "Não", value: "nao" },
              ],
            });

            // Etapa 5: Parceiro
            setPendingAction(async (ans3: string) => {
              if (ans3 === "nao") { setPendingAction(null); return; }

              navigate(ERoutes.CONFIG_ASSISTENTE_EXCECOES, {
                state: { fromBIA: true, screen: 3, wizardStep: 5, selAllParceiros: true },
              });

              setThinking(true);
              await sleep(600);
              setThinking(false);

              addMessage({
                role: "bia",
                content: "Selecionei todos os parceiros. Posso seguir?",
                tag: "insight",
                skill: "Consultor Tributário",
                quickReplies: [
                  { label: "Sim", value: "sim" },
                  { label: "Não", value: "nao" },
                ],
              });

              // Etapa 6: Resumo/Conclusão
              setPendingAction(async (ans4: string) => {
                if (ans4 === "nao") { setPendingAction(null); return; }

                navigate(ERoutes.CONFIG_ASSISTENTE_EXCECOES, {
                  state: { fromBIA: true, screen: 3, wizardStep: 6 },
                });

                setThinking(true);
                await sleep(600);
                setThinking(false);

                addMessage({
                  role: "bia",
                  content: "Confira o resumo e conclusão na tela. Posso confirmar e gravar?",
                  tag: "insight",
                  skill: "Consultor Tributário",
                  quickReplies: [
                    { label: "Confirmar e Gravar", value: "confirmar" },
                    { label: "Não", value: "nao" },
                  ],
                });

                setPendingAction(async (ans5: string) => {
                  if (ans5 === "nao") { setPendingAction(null); return; }

                  navigate(ERoutes.CONFIG_ASSISTENTE_EXCECOES, {
                    state: { fromBIA: true, screen: 3, wizardStep: 6, confirm: true },
                  });

                  setThinking(true);
                  await sleep(600);
                  setThinking(false);

                  addMessage({
                    role: "bia",
                    content: "35 exceções tributárias gravadas em 12/05/2026 às 14:32 por Ana Silva.",
                    tag: "insight",
                    skill: "Consultor Tributário",
                  });

                  setPendingAction(null);
                });
              });
            });
          });
        });
      });
    });
  }

  function handleInputSend() {
    const text = value.trim();
    if (!text) return;
    setValue("");
    if (pendingDeREFlow) {
      setPendingDeREFlow(false);
      handleDeREFlow(text);
      return;
    }
    if (pendingIntegralFlow) {
      setPendingIntegralFlow(false);
      handleIntegralFlow(text);
      return;
    }
    if (pendingExcecoesFlow) {
      setPendingExcecoesFlow(false);
      handleExcecoesFlow(text);
      return;
    }
    handleSend(text);
  }

  function handleSkillSelect(skill: (typeof SKILL_OPTIONS)[0]) {
    if (skill.id === "dere") {
      setValue(DERE_TRIGGER);
      setPendingDeREFlow(true);
    } else if (skill.id === "aliquota-integral") {
      setValue(skill.prompt);
      setPendingIntegralFlow(true);
    } else if (skill.id === "excecoes-tributacao") {
      setValue(skill.prompt);
      setPendingExcecoesFlow(true);
    } else {
      setValue(skill.prompt);
    }
    setShowPlusMenu(false);
    setShowSkillSubmenu(false);
    textareaRef.current?.focus();
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {/* Top-right action */}
      <div className="absolute top-3 right-4 z-10">
        <button
          onClick={skipToLayout}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent hover:border-primary/30 transition-colors shadow-sm"
        >
          <Home className="h-3.5 w-3.5 shrink-0" />
          Home
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
              {/* + button with dropdown */}
              <div className="relative shrink-0" ref={plusMenuRef}>
                <button
                  onClick={() => {
                    setShowPlusMenu((v) => !v);
                    setShowSkillSubmenu(false);
                  }}
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                    showPlusMenu
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground/60 hover:bg-accent hover:text-foreground"
                  )}
                  aria-label="Mais opções"
                >
                  <Plus className="h-4 w-4" />
                </button>

                {/* Dropdown */}
                {showPlusMenu && (
                  <div className="absolute bottom-full left-0 mb-1.5 w-44 rounded-xl border border-border bg-card shadow-lg z-50 py-1">
                    {/* Skill row — click toggles submenu */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSkillSubmenu((v) => !v)}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-[13px] text-foreground hover:bg-accent transition-colors"
                      >
                        <span>Skill</span>
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-150",
                            showSkillSubmenu && "rotate-90"
                          )}
                        />
                      </button>

                      {/* Skills submenu */}
                      {showSkillSubmenu && (
                        <div className="absolute left-full top-0 ml-1 w-52 rounded-xl border border-border bg-card shadow-lg z-50 py-1">
                          {SKILL_OPTIONS.map((skill) => (
                            <button
                              key={skill.id}
                              onClick={() => handleSkillSelect(skill)}
                              className="w-full px-3 py-1.5 text-left text-[13px] text-foreground hover:bg-accent transition-colors"
                            >
                              {skill.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mx-2 my-0.5 border-t border-border/40" />

                    {/* Enviar arquivo */}
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowPlusMenu(false);
                        setShowSkillSubmenu(false);
                      }}
                      className="w-full flex items-center px-3 py-1.5 text-[13px] text-foreground hover:bg-accent transition-colors"
                    >
                      Enviar arquivo
                    </button>
                  </div>
                )}
              </div>

              {/* Textarea */}
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

              {/* Send button */}
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={() => setShowPlusMenu(false)}
      />
    </div>
  );
}
