import { Building2, Settings2, Sparkles, ChevronRight, Calculator, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useBIAChat } from "@/context/BIAChatContext";
import { apuracoes } from "@/data/mockData";
import { HomeQueryBox } from "@/components/HomeQueryBox";
import { ERoutes } from "@/routes/interface";
import { cn } from "@/lib/utils";

// ── Mock: Configuração ────────────────────────────────────────────
const EMPRESAS = [
  { id: 1, nome: "Financeira Alpha S.A.", cbs: true,  ibs: true,  dere: true  },
  { id: 2, nome: "Alpha Filial SP",       cbs: true,  ibs: false, dere: false },
  { id: 3, nome: "Beta Factoring Ltda.",  cbs: false, ibs: false, dere: false },
  { id: 4, nome: "Gamma Seguros S.A.",    cbs: true,  ibs: true,  dere: false },
  { id: 5, nome: "Delta Comercio ME",     cbs: false, ibs: false, dere: false },
  { id:25, nome: "Empresa Teste",         cbs: false, ibs: false, dere: false },
];

const ASSISTENTE = [
  { nome: "Financeira Alpha S.A.", integral: false, personalizada: false },
  { nome: "Gamma Seguros S.A.",    integral: true,  personalizada: false },
  { nome: "Beta Factoring Ltda.",  integral: false, personalizada: false },
];

// ── Mock: Apuração IBS ────────────────────────────────────────────
const APURACAO_IBS = [
  { situacao: "Em andamento", tipoResultado: "Credor",  alertas: 0 },
  { situacao: "Em andamento", tipoResultado: "Credor",  alertas: 0 },
  { situacao: "Concluído",    tipoResultado: "Devedor", alertas: 0 },
];

// ── Mock: Apuração IS ─────────────────────────────────────────────
const APURACAO_IS: typeof APURACAO_IBS = [];

// ── Mock: DeRE ────────────────────────────────────────────────────
const DERE_D1001 = { naoEnviado: 1, enviado: 3, erro: 1 };
const DERE_D1011 = { naoEnviado: 2, enviado: 2, erro: 1 };

// ── Derived: Configuração ─────────────────────────────────────────
const totalEmpresas  = EMPRESAS.length;
const cbsCount       = EMPRESAS.filter((e) => e.cbs).length;
const ibsCount       = EMPRESAS.filter((e) => e.ibs).length;
const dereCount      = EMPRESAS.filter((e) => e.dere).length;
const semModulo      = EMPRESAS.filter((e) => !e.cbs && !e.ibs && !e.dere);
const totalAssistente    = ASSISTENTE.length;
const integralCount      = ASSISTENTE.filter((e) => e.integral).length;
const personalizadaCount = ASSISTENTE.filter((e) => e.personalizada).length;

// ── Derived: Apuração CBS ─────────────────────────────────────────
function calcApuracao(list: typeof apuracoes | typeof APURACAO_IBS) {
  return {
    devedor:   list.filter((a) => a.situacao === "Em andamento" && a.tipoResultado === "Devedor").length,
    credor:    list.filter((a) => a.situacao === "Em andamento" && a.tipoResultado === "Credor").length,
    alertas:   list.reduce((sum, a) => sum + (a.alertas ?? 0), 0),
    concluido: list.filter((a) => a.situacao === "Concluído").length,
  };
}

const statsCBS = calcApuracao(apuracoes);
const statsIBS = calcApuracao(APURACAO_IBS);
const statsIS  = calcApuracao(APURACAO_IS);

// ── Insights ──────────────────────────────────────────────────────
const INSIGHT_EMPRESAS =
  semModulo.length > 0
    ? `As empresas ${semModulo.map((e) => e.nome).join(" e ")} não têm nenhum módulo habilitado no portal. Deseja ir para a tela de Empresas para configurá-las?`
    : "Todas as empresas possuem ao menos um módulo habilitado.";

const INSIGHT_ASSISTENTE =
  "A empresa Financeira Alpha S.A. tem o módulo apuração de CBS habilitado, mas ainda não fez a configuração de tributação integral ou personalizada das alíquotas de IBS e CBS.";

const INSIGHT_CBS =
  "Apuração CBS — Mai/2026: a Financeira Alpha S.A. tem 2 divergências entre o ERP e a Receita Federal. Recomendo revisar os créditos antes do envio.";

const INSIGHT_IBS =
  "Apuração IBS — Mai/2026: a Financeira Alpha S.A. tem 2 divergências entre o ERP e a Receita Federal. Recomendo revisar os créditos antes do envio.";

const INSIGHT_IS =
  "Apuração IS — nenhuma apuração em andamento no período atual.";

const INSIGHT_D1001 =
  "DeRE — D-1001: o evento da Gamma Seguros S.A. está em Processando há mais de 24h sem recibo. Verifique o Histórico de Eventos para acompanhar o retorno.";

const INSIGHT_D1011 =
  "DeRE — D-1011: a Gamma Seguros S.A. está cadastrada como 2 – Plano de Assistência à Saúde, mas não fez a configuração do Plano Referencial, isso impede a geração do D-1011.";

// ── Sub-components ────────────────────────────────────────────────
type StatColor = "warning" | "info" | "destructive" | "success" | "muted";

const STAT_COLORS: Record<StatColor, string> = {
  warning:     "bg-warning/10 text-warning",
  info:        "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
  success:     "bg-success/10 text-success",
  muted:       "bg-muted text-muted-foreground",
};

function StatChip({ value, label, color }: { value: number; label: string; color: StatColor }) {
  return (
    <div className={cn("rounded-lg px-2 py-2.5 flex flex-col items-center gap-1 min-w-0", STAT_COLORS[color])}>
      <span className="text-[22px] font-bold leading-none tabular-nums">{value}</span>
      <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
    </div>
  );
}

function ModuloRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", count > 0 ? "bg-primary" : "bg-muted-foreground/20")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[12px] font-medium text-foreground w-12 text-right">{count} / {total}</span>
      </div>
    </div>
  );
}

function AssistenteRow({ label, count, total }: { label: string; count: number; total: number }) {
  const allDone = count === total;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-[13px] text-muted-foreground leading-snug">{label}</span>
      <Badge
        variant="outline"
        className={cn(
          "text-[11px] font-medium shrink-0 ml-3",
          allDone
            ? "border-success/50 text-success bg-success/10"
            : count === 0
            ? "border-destructive/50 text-destructive bg-destructive/10"
            : "border-warning/50 text-warning bg-warning/10"
        )}
      >
        {count} / {total}
      </Badge>
    </div>
  );
}

interface DashCardProps {
  icon: React.ReactNode;
  title: string;
  insight: string;
  insightTag: "alerta" | "insight" | "info";
  children: React.ReactNode;
  linkLabel?: string;
  onLinkClick?: () => void;
}

function DashCard({ icon, title, insight, insightTag, children, linkLabel, onLinkClick }: DashCardProps) {
  const { sendInsight } = useBIAChat();
  return (
    <div className="bg-card border rounded-xl p-5 flex flex-col gap-4 card-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
          <span className="text-[15px] font-semibold text-foreground">{title}</span>
        </div>
        <button
          onClick={() => sendInsight(insight, insightTag)}
          title="Ver insights da BIA"
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1">{children}</div>

      {linkLabel && onLinkClick && (
        <button
          onClick={onLinkClick}
          className="flex items-center gap-1 text-[12px] text-primary hover:underline mt-auto self-start"
        >
          {linkLabel}
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
        {label}
      </h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-[20px] font-semibold text-foreground leading-tight">Dashboard</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Visão geral do Portal da Reforma Tributária
        </p>
      </div>

      {/* ── Caixa de Consulta IA ─────────────────────────── */}
      <HomeQueryBox />

      {/* ── Configuração ─────────────────────────────────── */}
      <section>
        <SectionTitle label="Configuração" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashCard
            icon={<Building2 className="h-4 w-4" />}
            title="Empresas"
            insight={INSIGHT_EMPRESAS}
            insightTag="insight"
            linkLabel="Ver empresas"
            onLinkClick={() => navigate(ERoutes.CONFIG_EMPRESAS)}
          >
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">
              Módulos habilitados · {totalEmpresas} empresas cadastradas
            </div>
            <ModuloRow label="Apuração CBS" count={cbsCount} total={totalEmpresas} />
            <ModuloRow label="Apuração IBS" count={ibsCount} total={totalEmpresas} />
            <ModuloRow label="DeRE"         count={dereCount} total={totalEmpresas} />
            {semModulo.length > 0 && (
              <div className="mt-3 rounded-lg bg-warning/10 border border-warning/30 px-3 py-2">
                <span className="text-[12px] text-warning leading-snug">
                  <strong>{semModulo.length}</strong>{" "}
                  {semModulo.length === 1 ? "empresa sem" : "empresas sem"} nenhum módulo habilitado
                </span>
              </div>
            )}
          </DashCard>

          <DashCard
            icon={<Settings2 className="h-4 w-4" />}
            title="Assistente"
            insight={INSIGHT_ASSISTENTE}
            insightTag="alerta"
          >
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">
              Configuração de alíquotas · {totalAssistente} empresas habilitadas
            </div>
            <AssistenteRow label="Tributação Integral - IBS/CBS"      count={integralCount}      total={totalAssistente} />
            <AssistenteRow label="Tributação Personalizada - IBS/CBS"  count={personalizadaCount} total={totalAssistente} />
          </DashCard>
        </div>
      </section>

      {/* ── Apuração ──────────────────────────────────────── */}
      <section>
        <SectionTitle label="Apuração" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CBS */}
          <DashCard
            icon={<Calculator className="h-4 w-4" />}
            title="CBS"
            insight={INSIGHT_CBS}
            insightTag="alerta"
            linkLabel="Ver apurações CBS"
            onLinkClick={() => navigate(ERoutes.APURACAO_CBS)}
          >
            <div className="grid grid-cols-4 gap-2">
              <StatChip value={statsCBS.devedor}   label="Em and. Devedor" color="warning"     />
              <StatChip value={statsCBS.credor}    label="Em and. Credor"  color="info"        />
              <StatChip value={statsCBS.alertas}   label="Alertas"         color="destructive" />
              <StatChip value={statsCBS.concluido} label="Concluído"       color="success"     />
            </div>
          </DashCard>

          {/* IBS */}
          <DashCard
            icon={<Calculator className="h-4 w-4" />}
            title="IBS"
            insight={INSIGHT_IBS}
            insightTag="alerta"
            linkLabel="Ver apurações IBS"
            onLinkClick={() => navigate(ERoutes.APURACAO_IBS)}
          >
            <div className="grid grid-cols-4 gap-2">
              <StatChip value={statsIBS.devedor}   label="Em and. Devedor" color="warning"     />
              <StatChip value={statsIBS.credor}    label="Em and. Credor"  color="info"        />
              <StatChip value={statsIBS.alertas}   label="Alertas"         color="destructive" />
              <StatChip value={statsIBS.concluido} label="Concluído"       color="success"     />
            </div>
          </DashCard>

          {/* IS */}
          <DashCard
            icon={<Calculator className="h-4 w-4" />}
            title="IS"
            insight={INSIGHT_IS}
            insightTag="info"
            linkLabel="Ver apurações IS"
            onLinkClick={() => navigate(ERoutes.APURACAO_IS)}
          >
            <div className="grid grid-cols-4 gap-2">
              <StatChip value={statsIS.devedor}   label="Em and. Devedor" color="warning"     />
              <StatChip value={statsIS.credor}    label="Em and. Credor"  color="info"        />
              <StatChip value={statsIS.alertas}   label="Alertas"         color="destructive" />
              <StatChip value={statsIS.concluido} label="Concluído"       color="success"     />
            </div>
          </DashCard>
        </div>
      </section>

      {/* ── DeRE ────────────────────────────────────────────── */}
      <section>
        <SectionTitle label="DeRE" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* D-1001 */}
          <DashCard
            icon={<FileText className="h-4 w-4" />}
            title="D-1001"
            insight={INSIGHT_D1001}
            insightTag="alerta"
            linkLabel="Ver D-1001"
            onLinkClick={() => navigate(ERoutes.APURACAO_DERE_D1001)}
          >
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-3">
              Inf. Contribuinte
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatChip value={DERE_D1001.naoEnviado} label="Não enviado" color="muted"       />
              <StatChip value={DERE_D1001.enviado}    label="Enviado"     color="success"     />
              <StatChip value={DERE_D1001.erro}       label="Erro"        color="destructive" />
            </div>
          </DashCard>

          {/* D-1011 */}
          <DashCard
            icon={<FileText className="h-4 w-4" />}
            title="D-1011"
            insight={INSIGHT_D1011}
            insightTag="alerta"
            linkLabel="Ver D-1011"
            onLinkClick={() => navigate(ERoutes.APURACAO_DERE_D1011)}
          >
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-3">
              Plano Geral de Contas Comentado
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatChip value={DERE_D1011.naoEnviado} label="Não enviado" color="muted"       />
              <StatChip value={DERE_D1011.enviado}    label="Enviado"     color="success"     />
              <StatChip value={DERE_D1011.erro}       label="Erro"        color="destructive" />
            </div>
          </DashCard>
        </div>
      </section>
    </div>
  );
}
