import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Download, ChevronRight,
  Loader2, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────
type Screen =
  | "home"
  | "plano-ref"
  | "d1001-list"
  | "d1001-wiz"
  | "d1011-list"
  | "d1011-depara"
  | "historico";

type StatusDeRE = "enviado" | "nao-enviado" | "alteracao-pendente" | "erro";
type StatusPlano = "configurado" | "nao-configurado";
type TipoOp = "Inclusão" | "Alteração" | "Exclusão";

interface EmpresaDeRE {
  raiz: string;
  cnpj: string;
  razao: string;
  filiais: number;
  d1001: StatusDeRE;
  d1011: StatusDeRE;
  plano: StatusPlano;
  regTrib: string;
}

interface Batch {
  indices: number[];
  forcedOp?: TipoOp;
}

// ── Mock Data ─────────────────────────────────────────────────────
const EMPRESAS: EmpresaDeRE[] = [
  {
    raiz: "12.345.678",
    cnpj: "12.345.678/0001-99",
    razao: "Financeira Alpha S.A.",
    filiais: 2,
    d1001: "enviado",
    d1011: "nao-enviado",
    plano: "configurado",
    regTrib: "1 – Simples",
  },
  {
    raiz: "98.765.432",
    cnpj: "98.765.432/0001-01",
    razao: "Beta Factoring Ltda.",
    filiais: 0,
    d1001: "nao-enviado",
    d1011: "nao-enviado",
    plano: "nao-configurado",
    regTrib: "3 – Lucro Real",
  },
  {
    raiz: "55.444.333",
    cnpj: "55.444.333/0001-55",
    razao: "Gamma Seguros S.A.",
    filiais: 4,
    d1001: "alteracao-pendente",
    d1011: "erro",
    plano: "configurado",
    regTrib: "3 – Lucro Real",
  },
];

const CONTAS_EMPRESA = [
  { cod: "1.1.01", nome: "Caixa e Equivalentes", mapped: "1001" },
  { cod: "1.1.02", nome: "Aplicações Financeiras CP", mapped: "1002" },
  { cod: "1.2.01", nome: "Créditos com Clientes", mapped: null },
  { cod: "1.2.02", nome: "Operações de Crédito", mapped: "2001" },
  { cod: "2.1.01", nome: "Fornecedores", mapped: null },
  { cod: "2.1.02", nome: "Obrigações Fiscais", mapped: "3001" },
  { cod: "3.1.01", nome: "Receita de Intermediação", mapped: null },
  { cod: "3.1.02", nome: "Receitas de Prestação de Serviços", mapped: "4001" },
];

const CONTAS_REF = [
  "1001 – Disponibilidades",
  "1002 – Aplicações Interfinanceiras",
  "2001 – Operações de Crédito",
  "2002 – Títulos e Valores",
  "3001 – Obrigações com Instituições",
  "4001 – Receitas da Intermediação",
];

const EVENTOS_HISTORICO = [
  {
    cnpj: "12.345.678/0001-99",
    razao: "Financeira Alpha",
    evento: "D1001" as const,
    status: "enviado" as StatusDeRE,
    data: "15/04/2026 09:32",
    nrRecibo: "REC-2026-0041",
  },
  {
    cnpj: "12.345.678/0001-99",
    razao: "Financeira Alpha",
    evento: "D1011" as const,
    status: "erro" as StatusDeRE,
    data: "15/04/2026 09:45",
    nrRecibo: "REC-2026-0042",
  },
  {
    cnpj: "55.444.333/0001-55",
    razao: "Gamma Seguros",
    evento: "D1001" as const,
    status: "enviado" as StatusDeRE,
    data: "10/04/2026 14:10",
    nrRecibo: "REC-2026-0039",
  },
  {
    cnpj: "55.444.333/0001-55",
    razao: "Gamma Seguros",
    evento: "D1011" as const,
    status: "alteracao-pendente" as StatusDeRE,
    data: "10/04/2026 14:22",
    nrRecibo: "REC-2026-0040",
  },
];

// ── Shared Components ─────────────────────────────────────────────
function StatusBadge({ status }: { status: StatusDeRE | StatusPlano }) {
  const map: Record<string, [string, string]> = {
    enviado: ["border-success/50 text-success bg-success/10", "Enviado"],
    "nao-enviado": ["border-border text-muted-foreground bg-muted/50", "Não enviado"],
    "alteracao-pendente": [
      "border-warning/60 text-warning bg-warning/10",
      "Alteração pendente",
    ],
    erro: ["border-destructive/50 text-destructive bg-destructive/10", "Erro"],
    configurado: ["border-success/50 text-success bg-success/10", "Configurado"],
    "nao-configurado": [
      "border-border text-muted-foreground bg-muted/50",
      "Não configurado",
    ],
  };
  const [cls, label] = map[status] || ["border-border text-muted-foreground", status];
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", cls)}>
      {label}
    </Badge>
  );
}

function OpBadge({ tipo }: { tipo: TipoOp }) {
  const map: Record<TipoOp, string> = {
    Inclusão: "border-blue-400/50 text-blue-600 bg-blue-50",
    Alteração: "border-warning/60 text-warning bg-warning/10",
    Exclusão: "border-destructive/50 text-destructive bg-destructive/10",
  };
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", map[tipo])}>
      {tipo}
    </Badge>
  );
}

function InfoAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-blue-300/40 bg-blue-50/60 p-3 text-sm text-foreground mb-4">
      <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

function WarnAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground mb-4">
      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

function DangerAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive mb-4">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value?: string;
  filled?: boolean;
  note?: string;
}
function Field({ label, value, filled, note }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <div
        className={cn(
          "rounded-md border px-3 py-2 text-sm min-h-[36px]",
          filled
            ? "bg-muted/30 text-foreground"
            : "bg-muted/10 text-muted-foreground/50 border-dashed"
        )}
      >
        {value || (
          <span className="text-muted-foreground/40 italic text-xs">
            — campo obrigatório —
          </span>
        )}
      </div>
      {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}

interface WizardHeaderProps {
  breadcrumb: string[];
  title: string;
  titleBadge?: React.ReactNode;
  onCancel: () => void;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}
function WizardHeader({
  breadcrumb,
  title,
  titleBadge,
  onCancel,
  onBack,
  onNext,
  nextLabel = "Avançar",
  nextDisabled,
}: WizardHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-background border-b px-6 py-3 flex items-center justify-between gap-4 -mx-6 -mt-6 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground hover:text-foreground shrink-0"
          onClick={onBack ?? onCancel}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-0.5 flex-wrap">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <span
                  className={
                    i === breadcrumb.length - 1 ? "text-foreground font-medium" : ""
                  }
                >
                  {b}
                </span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-[16px] font-semibold text-foreground leading-tight truncate">
              {title}
            </h1>
            {titleBadge}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-muted-foreground"
        >
          Cancelar
        </Button>
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            Voltar
          </Button>
        )}
        {onNext && (
          <Button size="sm" onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

interface StepsBarProps {
  steps: string[];
  current: number;
}
function StepsBar({ steps, current }: StepsBarProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2",
                  i + 1 < current
                    ? "bg-primary border-primary text-primary-foreground"
                    : i + 1 === current
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-muted border-border text-muted-foreground"
                )}
              >
                {i + 1 < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[11px] mt-1 text-center whitespace-nowrap",
                  i + 1 === current ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mb-4",
                  i + 1 < current ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface SendStepProps {
  onDone: () => void;
  label: string;
  opTipo?: TipoOp;
}
function SendStep({ onDone, label, opTipo }: SendStepProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [recibo] = useState(() => String(Math.floor(Math.random() * 9000) + 1000));

  function handleSend() {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1500);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center py-10 gap-4">
        <div className="h-14 w-14 rounded-full bg-success/10 border border-success/30 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">
            {label} enviado com sucesso!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Número do recibo:{" "}
            <span className="font-mono font-medium">REC-2026-{recibo}</span>
          </p>
        </div>
        <Button onClick={onDone}>Concluir</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Resumo do envio</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Evento</span>
          <Badge
            variant="outline"
            className="border-blue-400/50 text-blue-600 bg-blue-50 text-xs"
          >
            {label}
          </Badge>
        </div>
        {opTipo && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tipo de operação</span>
            <OpBadge tipo={opTipo} />
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Destino</span>
          <span className="text-foreground font-medium">RFB – Portal DeRE</span>
        </div>
      </div>
      <InfoAlert>
        Ao clicar em <strong>Enviar</strong>, os dados serão transmitidos à Receita Federal.
        Esta ação pode ser desfeita enviando um evento de <strong>Alteração</strong> ou{" "}
        <strong>Exclusão</strong>.
      </InfoAlert>
      <div className="flex justify-end">
        <Button onClick={handleSend} disabled={sending} className="gap-2">
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {sending ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  );
}

// ── Screen 1: Home / Painel de Status ────────────────────────────
interface HomeScreenProps {
  navigate: (s: Screen) => void;
}
function HomeScreen({ navigate }: HomeScreenProps) {
  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
            <span>DeRE</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Painel de Status</span>
          </div>
          <h1 className="text-[20px] font-semibold text-foreground leading-tight">
            DeRE – Painel de Status
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Declaração de Regimes Específicos · IBS/CBS
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg card-shadow border mb-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                CNPJ Raiz
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Razão Social
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                D1001
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                D1011
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Plano de Contas
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EMPRESAS.map((e) => (
              <TableRow key={e.raiz} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="font-semibold font-mono text-sm">{e.raiz}</div>
                  <div className="text-[11px] text-muted-foreground">{e.cnpj}</div>
                  {e.filiais > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] mt-0.5 border-border text-muted-foreground"
                    >
                      {e.filiais} filiais
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">{e.razao}</TableCell>
                <TableCell>
                  <StatusBadge status={e.d1001} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={e.d1011} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={e.plano} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 flex-wrap">
                    {e.d1001 !== "enviado" && (
                      <Button
                        size="sm"
                        className="h-7 text-xs px-3"
                        onClick={() => navigate("d1001-wiz")}
                      >
                        Iniciar D1001
                      </Button>
                    )}
                    {e.d1001 === "enviado" && e.plano === "configurado" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-3"
                        onClick={() => navigate("d1011-depara")}
                      >
                        Iniciar D1011
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 text-primary hover:text-primary"
                      onClick={() => navigate("historico")}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Quick navigation cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Plano Referencial",
            screen: "plano-ref" as Screen,
            desc: "SPED / COSIF / ANS / SUSEP",
          },
          {
            label: "D1001 – Inf. Contribuinte",
            screen: "d1001-list" as Screen,
            desc: "Envio em lote",
          },
          {
            label: "D1011 – Plano de Contas",
            screen: "d1011-list" as Screen,
            desc: "De/Para referencial",
          },
          {
            label: "Histórico de Eventos",
            screen: "historico" as Screen,
            desc: "Download XML / ZIP",
          },
        ].map((item) => (
          <button
            key={item.screen}
            onClick={() => navigate(item.screen)}
            className="text-left rounded-lg border bg-card p-4 hover:bg-accent/40 transition-colors card-shadow"
          >
            <p className="text-sm font-semibold text-foreground">{item.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Screen 2: Plano Referencial ───────────────────────────────────
interface PlanoRefScreenProps {
  navigate: (s: Screen) => void;
}
function PlanoRefScreen({ navigate }: PlanoRefScreenProps) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  const opts = [
    {
      val: "SPED",
      label: "SPED – planoCtaRef = 4",
      sub: "Padrão residual · Fintechs, factoring, administradoras sem regulador setorial",
    },
    {
      val: "COSIF",
      label: "COSIF – planoCtaRef = 1",
      sub: "Instituições financeiras reguladas pelo Banco Central",
    },
    {
      val: "ANS",
      label: "ANS – planoCtaRef = 2",
      sub: "Planos de assistência à saúde, planos funerários e saúde animal",
    },
    {
      val: "SUSEP",
      label: "SUSEP – planoCtaRef = 3",
      sub: "Seguradoras e resseguradoras",
    },
  ];

  function handleNext() {
    if (step === 1 && selected) setStep(2);
    else if (step === 2) navigate("home");
  }

  return (
    <div>
      <WizardHeader
        breadcrumb={["Portal da Reforma Tributária", "DeRE", "Plano Referencial"]}
        title="Importação do Plano Referencial"
        onCancel={() => navigate("home")}
        onBack={step > 1 ? () => setStep(1) : undefined}
        onNext={handleNext}
        nextLabel={step === 2 ? "Importar" : "Avançar"}
        nextDisabled={step === 1 && !selected}
      />

      <div className="bg-card rounded-lg border p-6 card-shadow">
        <div className="text-[11px] text-muted-foreground mb-1">Etapa {step} de 2</div>
        <StepsBar steps={["Selecionar tipo", "Importar arquivo"]} current={step} />

        {step === 1 && (
          <>
            <h2 className="text-[15px] font-semibold text-foreground mb-1">
              Selecionar tipo de plano referencial
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Escolha o plano de contas referencial correspondente ao regime do contribuinte.
              Esta seleção determina quais contas estarão disponíveis no de/para do D1011.
            </p>
            <div className="space-y-3">
              {opts.map((o) => (
                <div
                  key={o.val}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors",
                    selected === o.val
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/30"
                  )}
                  onClick={() => setSelected(o.val)}
                >
                  <div
                    className={cn(
                      "mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                      selected === o.val ? "border-primary" : "border-border"
                    )}
                  >
                    {selected === o.val && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{o.label}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{o.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-[15px] font-semibold text-foreground mb-1">
              Importar arquivo do plano {selected}
            </h2>
            {selected === "SPED" ? (
              <>
                <InfoAlert>
                  Identificamos que já existe um plano SPED importado via rotina ECF do
                  Sankhya. Deseja reaproveitar?
                </InfoAlert>
                <div className="flex gap-3">
                  <Button size="sm" onClick={() => navigate("home")}>
                    Sim, reaproveitar
                  </Button>
                  <Button size="sm" variant="outline">
                    Importar novo
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Faça o upload do arquivo de plano de contas {selected} fornecido pelo
                  órgão regulador.
                </p>
                <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    ↑ Arraste e solte ou{" "}
                    <span className="text-primary cursor-pointer hover:underline">
                      clique para adicionar arquivo
                    </span>
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-2">
                    Selecione o arquivo .ZIP ou .TXT do plano {selected}
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Screen 3a: D1001 Lista ────────────────────────────────────────
interface D1001ListScreenProps {
  navigate: (s: Screen) => void;
  setBatch: (b: Batch | null) => void;
}
function D1001ListScreen({ navigate, setBatch }: D1001ListScreenProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const allSelected = selected.length === EMPRESAS.length;

  function toggleAll() {
    setSelected(allSelected ? [] : EMPRESAS.map((_, i) => i));
  }
  function toggleOne(i: number) {
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  }
  function startBatch(indices: number[], forcedOp?: TipoOp) {
    setBatch({ indices, forcedOp });
    navigate("d1001-wiz");
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
            <button
              onClick={() => navigate("home")}
              className="hover:text-foreground transition-colors"
            >
              DeRE
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">D1001</span>
          </div>
          <h1 className="text-[20px] font-semibold text-foreground leading-tight">
            Informações do Contribuinte – D1001
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Selecione uma ou várias empresas para enviar em lote
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {selected.length > 0 && (
            <Button size="sm" onClick={() => startBatch(selected)} className="gap-1.5">
              ▶ Iniciar selecionadas ({selected.length})
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg card-shadow border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                CNPJ Raiz
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Razão Social
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                D1001 – Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EMPRESAS.map((e, i) => (
              <TableRow key={e.raiz} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <Checkbox
                    checked={selected.includes(i)}
                    onCheckedChange={() => toggleOne(i)}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-semibold font-mono text-sm">{e.raiz}</div>
                  <div className="text-[11px] text-muted-foreground">{e.cnpj}</div>
                  {e.filiais > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] mt-0.5 border-border text-muted-foreground"
                    >
                      +{e.filiais} filiais
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">{e.razao}</TableCell>
                <TableCell>
                  <StatusBadge status={e.d1001} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {(e.d1001 === "nao-enviado" || e.d1001 === "alteracao-pendente") && (
                      <Button
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() =>
                          startBatch(
                            [i],
                            e.d1001 === "nao-enviado" ? "Inclusão" : "Alteração"
                          )
                        }
                      >
                        Iniciar
                      </Button>
                    )}
                    {(e.d1001 === "enviado" || e.d1001 === "alteracao-pendente") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={() => startBatch([i], "Exclusão")}
                      >
                        Excluir
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 text-primary hover:text-primary"
                      onClick={() => navigate("historico")}
                    >
                      Detalhes
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-2.5 border-t text-[11px] text-muted-foreground bg-muted/20">
          <span>
            Tipo de operação:{" "}
            <strong>Inclusão</strong> (Não enviado) ·{" "}
            <strong>Alteração</strong> (Enviado / Alteração pendente) ·{" "}
            <strong>Exclusão</strong> (Enviado)
          </span>
          <span>
            {EMPRESAS.length} de {EMPRESAS.length} registros
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Screen 3b: D1001 Wizard ───────────────────────────────────────
interface D1001WizardScreenProps {
  navigate: (s: Screen) => void;
  batch: Batch | null;
}
function D1001WizardScreen({ navigate, batch }: D1001WizardScreenProps) {
  const [step, setStep] = useState(1);
  const [regTrib, setRegTrib] = useState("");
  const [natTrib, setNatTrib] = useState("");

  const indices = batch?.indices?.length ? batch.indices : [0];
  const isMulti = indices.length > 1;
  const empresa = EMPRESAS[indices[0]] || EMPRESAS[0];

  function opTypeFor(status: StatusDeRE, forced?: TipoOp): TipoOp {
    if (forced) return forced;
    if (status === "nao-enviado") return "Inclusão";
    if (status === "alteracao-pendente") return "Alteração";
    return "Alteração";
  }
  const opTipo = opTypeFor(empresa.d1001, batch?.forcedOp);

  const STEPS = ["Revisar dados ERP", "Completar campos", "Enviar"];

  return (
    <div>
      <WizardHeader
        breadcrumb={[
          "DeRE",
          "D1001",
          isMulti ? `Lote (${indices.length} empresas)` : empresa.razao,
        ]}
        title="Informações do Contribuinte – D1001"
        titleBadge={<OpBadge tipo={opTipo} />}
        onCancel={() => navigate("d1001-list")}
        onBack={
          step > 1
            ? () => setStep((s) => s - 1)
            : () => navigate("d1001-list")
        }
        onNext={step < STEPS.length ? () => setStep((s) => s + 1) : undefined}
        nextLabel="Avançar"
      />

      <div className="bg-card rounded-lg border p-6 card-shadow">
        <div className="text-[11px] text-muted-foreground mb-1">
          Etapa {step} de {STEPS.length}
        </div>
        <StepsBar steps={STEPS} current={step} />

        {step === 1 && (
          <>
            {opTipo === "Exclusão" ? (
              <DangerAlert>
                Esta operação enviará um evento de <strong>Exclusão</strong> à RFB. A
                declaração D1001 desta empresa será cancelada.
              </DangerAlert>
            ) : (
              <InfoAlert>
                Os campos abaixo foram pré-preenchidos com dados do cadastro da empresa no
                ERP. Revise e confirme.
              </InfoAlert>
            )}
            {isMulti && (
              <WarnAlert>
                Lote com <strong>{indices.length} empresas</strong>. Cada uma será enviada
                com seu próprio tipo de operação.
              </WarnAlert>
            )}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="CNPJ" value={empresa.cnpj} filled />
              <Field label="Razão Social" value={empresa.razao} filled />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field
                label="Nome Fantasia"
                value={empresa.razao.split(" ")[0]}
                filled
              />
              <Field label="CNAE Principal" value="6491-3/00" filled />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Logradouro" value="Av. Paulista, 1000" filled />
              <Field label="Município" value="São Paulo – SP" filled />
              <Field label="CEP" value="01310-100" filled />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Campos específicos DeRE
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  regTribPrinc – Regime Tributário Principal
                </label>
                <Select value={regTrib} onValueChange={setRegTrib}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 – Simples Nacional</SelectItem>
                    <SelectItem value="2">2 – Lucro Presumido</SelectItem>
                    <SelectItem value="3">3 – Lucro Real</SelectItem>
                    <SelectItem value="4">4 – Imune/Isento</SelectItem>
                  </SelectContent>
                </Select>
                {regTrib && (
                  <p className="text-[11px] text-muted-foreground">
                    Pré-preenchido pelo ERP – confirme
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  indNatTrib – Natureza Tributária
                </label>
                <Select value={natTrib} onValueChange={setNatTrib}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 – Financeiro</SelectItem>
                    <SelectItem value="2">2 – Seguradora</SelectItem>
                    <SelectItem value="3">3 – Plano de Saúde</SelectItem>
                    <SelectItem value="4">4 – Demais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  planoCtaRef – Plano de Contas Referencial
                </label>
                <div className="rounded-md border px-3 py-2 text-sm bg-muted/30 flex items-center gap-2">
                  4 – SPED
                  <span className="text-[11px] text-primary">(derivado de regTribPrinc)</span>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <SendStep
            onDone={() => navigate("d1001-list")}
            label="D1001"
            opTipo={opTipo}
          />
        )}
      </div>
    </div>
  );
}

// ── Screen 4a: D1011 Lista ────────────────────────────────────────
interface D1011ListScreenProps {
  navigate: (s: Screen) => void;
}
function D1011ListScreen({ navigate }: D1011ListScreenProps) {
  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
            <button
              onClick={() => navigate("home")}
              className="hover:text-foreground transition-colors"
            >
              DeRE
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">D1011</span>
          </div>
          <h1 className="text-[20px] font-semibold text-foreground leading-tight">
            Plano Geral de Contas Comentado – D1011
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            O D1001 deve estar enviado antes de iniciar o D1011
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg card-shadow border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                CNPJ Raiz
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Razão Social
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                D1001
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                D1011
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Plano de Contas
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EMPRESAS.map((e) => (
              <TableRow key={e.raiz} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="font-semibold font-mono text-sm">{e.raiz}</div>
                  {e.filiais > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] mt-0.5 border-border text-muted-foreground"
                    >
                      +{e.filiais} filiais
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">{e.razao}</TableCell>
                <TableCell>
                  <StatusBadge status={e.d1001} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={e.d1011} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={e.plano} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {e.d1001 === "enviado" && e.plano === "configurado" ? (
                      <Button
                        size="sm"
                        className="h-7 text-xs px-3"
                        onClick={() => navigate("d1011-depara")}
                      >
                        Iniciar
                      </Button>
                    ) : (
                      <span className="text-[12px] text-muted-foreground">
                        {e.d1001 !== "enviado"
                          ? "Aguardando D1001"
                          : "Plano não configurado"}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 text-primary hover:text-primary"
                      onClick={() => navigate("historico")}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Screen 4b: D1011 De/Para ──────────────────────────────────────
interface D1011DeparaScreenProps {
  navigate: (s: Screen) => void;
}
function D1011DeparaScreen({ navigate }: D1011DeparaScreenProps) {
  const [step, setStep] = useState(1);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const empresa = EMPRESAS[0];

  const mappedCount = CONTAS_EMPRESA.filter(
    (c) => c.mapped || mappings[c.cod]
  ).length;

  return (
    <div>
      <WizardHeader
        breadcrumb={["DeRE", "D1011", empresa.razao]}
        title="De/Para – Plano de Contas Comentado"
        onCancel={() => navigate("d1011-list")}
        onBack={
          step > 1 ? () => setStep(1) : () => navigate("d1011-list")
        }
        onNext={step < 2 ? () => setStep(2) : undefined}
        nextLabel="Avançar"
      />

      <div className="bg-card rounded-lg border p-6 card-shadow">
        <div className="text-[11px] text-muted-foreground mb-1">Etapa {step} de 2</div>
        <StepsBar steps={["Mapear contas", "Revisar e enviar"]} current={step} />

        {step === 1 && (
          <>
            <InfoAlert>
              Plano referencial: <strong>SPED (planoCtaRef = 4)</strong> · conforme
              informado no D1001. Para cada conta analítica da empresa, selecione a conta
              correspondente no plano referencial.
            </InfoAlert>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                {mappedCount} de {CONTAS_EMPRESA.length} contas mapeadas
              </span>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-success/60 inline-block" />
                  mapeada
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30 inline-block" />
                  pendente
                </span>
              </div>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-8" />
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Conta da Empresa
                    </TableHead>
                    <TableHead className="text-[11px] text-center text-muted-foreground w-8">
                      →
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Conta Referencial (SPED)
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-24">
                      codTrib
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CONTAS_EMPRESA.map((c) => {
                    const isMapped = !!(c.mapped || mappings[c.cod]);
                    const currentValue =
                      mappings[c.cod] ||
                      (c.mapped
                        ? CONTAS_REF.find((r) => r.startsWith(c.mapped!)) || ""
                        : "");
                    return (
                      <TableRow key={c.cod} className="hover:bg-muted/20">
                        <TableCell>
                          <div
                            className={cn(
                              "h-4 w-4 rounded border-2",
                              isMapped
                                ? "bg-success/20 border-success/60"
                                : "border-border"
                            )}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <span className="text-muted-foreground mr-2">{c.cod}</span>
                          {c.nome}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          →
                        </TableCell>
                        <TableCell>
                          <Select
                            value={currentValue}
                            onValueChange={(val) =>
                              setMappings((m) => ({ ...m, [c.cod]: val }))
                            }
                          >
                            <SelectTrigger
                              className={cn(
                                "h-8 text-xs",
                                isMapped ? "border-success/50 bg-success/5" : ""
                              )}
                            >
                              <SelectValue placeholder="— selecionar —" />
                            </SelectTrigger>
                            <SelectContent>
                              {CONTAS_REF.map((r) => (
                                <SelectItem key={r} value={r} className="text-xs">
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="h-8 rounded border border-dashed border-border bg-muted/20 px-2 flex items-center text-[11px] text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {step === 2 && (
          <SendStep onDone={() => navigate("d1011-list")} label="D1011" />
        )}
      </div>
    </div>
  );
}

// ── Screen 5: Histórico de Eventos ────────────────────────────────
interface HistoricoScreenProps {
  navigate: (s: Screen) => void;
}
function HistoricoScreen({ navigate }: HistoricoScreenProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [filtroEvento, setFiltroEvento] = useState("todos");
  const [filtroEmpresa, setFiltroEmpresa] = useState("todas");

  const filtered = EVENTOS_HISTORICO.filter(
    (e) =>
      (filtroEvento === "todos" || e.evento === filtroEvento) &&
      (filtroEmpresa === "todas" || e.cnpj.startsWith(filtroEmpresa))
  );

  const allSelected = selected.length === filtered.length && filtered.length > 0;
  function toggleAll() {
    setSelected(allSelected ? [] : filtered.map((_, i) => i));
  }
  function toggleOne(i: number) {
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
            <button
              onClick={() => navigate("home")}
              className="hover:text-foreground transition-colors"
            >
              DeRE
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Histórico de Eventos</span>
          </div>
          <h1 className="text-[20px] font-semibold text-foreground leading-tight">
            Histórico de Eventos
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Consulte todos os eventos transmitidos
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-1.5 text-muted-foreground hover:text-foreground",
              selected.length > 0 && "text-foreground"
            )}
            disabled={selected.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            Baixar {selected.length > 1 ? "ZIP" : "XML"}
            {selected.length > 0 && ` (${selected.length})`}
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 px-3 py-2.5 bg-muted/40 rounded-lg border flex-wrap">
        <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
          <SelectTrigger className="w-[220px] h-8 text-sm">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as empresas</SelectItem>
            <SelectItem value="12.345.678">Financeira Alpha S.A.</SelectItem>
            <SelectItem value="98.765.432">Beta Factoring Ltda.</SelectItem>
            <SelectItem value="55.444.333">Gamma Seguros S.A.</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          {["todos", "D1001", "D1011"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltroEvento(f)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
                filtroEvento === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {f === "todos" ? "Todos eventos" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg card-shadow border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                CNPJ
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Razão Social
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Evento
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Data/Hora
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Recibo
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e, i) => (
              <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <Checkbox
                    checked={selected.includes(i)}
                    onCheckedChange={() => toggleOne(i)}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {e.cnpj}
                </TableCell>
                <TableCell className="text-sm">{e.razao}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="border-blue-400/50 text-blue-600 bg-blue-50 text-xs"
                  >
                    {e.evento}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={e.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.data}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {e.nrRecibo}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 text-primary hover:text-primary gap-1"
                  >
                    <Download className="h-3 w-3" /> XML
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-2.5 border-t text-[11px] text-muted-foreground bg-muted/20">
          <span>
            Download: 1 selecionado → baixa .xml · 2+ selecionados → baixa .zip com todos
            os XMLs
          </span>
          <span>
            Exibindo{" "}
            <span className="font-medium text-foreground">{filtered.length}</span> de{" "}
            <span className="font-medium text-foreground">
              {EVENTOS_HISTORICO.length}
            </span>{" "}
            registros
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function ApuracaoDere() {
  const [screen, setScreen] = useState<Screen>("home");
  const [batch, setBatch] = useState<Batch | null>(null);

  function navigate(s: Screen) {
    setScreen(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      {screen === "home" && <HomeScreen navigate={navigate} />}
      {screen === "plano-ref" && <PlanoRefScreen navigate={navigate} />}
      {screen === "d1001-list" && (
        <D1001ListScreen navigate={navigate} setBatch={setBatch} />
      )}
      {screen === "d1001-wiz" && (
        <D1001WizardScreen navigate={navigate} batch={batch} />
      )}
      {screen === "d1011-list" && <D1011ListScreen navigate={navigate} />}
      {screen === "d1011-depara" && <D1011DeparaScreen navigate={navigate} />}
      {screen === "historico" && <HistoricoScreen navigate={navigate} />}
    </div>
  );
}
