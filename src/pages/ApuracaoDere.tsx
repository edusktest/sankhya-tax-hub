import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Download, ChevronRight,
  Loader2, Send, Search, Upload, RefreshCw, Trash2, X, ChevronsUpDown, Info,
} from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
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

type StatusDeRE = "enviado" | "processando" | "nao_enviado";
type StatusPlano = "configurado" | "nao-configurado";
type TipoOp = "Inclusão" | "Alteração" | "Exclusão";
type Ocorrencia = "erro" | "aviso" | null;

interface EmpresaDeRE {
  raiz: string;
  cnpj: string;
  razao: string;
  filiais: number;
  d1001: StatusDeRE;
  d1011: StatusDeRE;
  plano: StatusPlano;
  regTrib: string;
  ocorrencia: Ocorrencia;
}

interface EventoHistorico {
  cnpjRaiz: string;
  cnpj: string;
  razao: string;
  evento: "D-1001" | "D-1011";
  operacao: TipoOp;
  status: StatusDeRE;
  dtGeracao: string;
  protocolo: string | null;
  nrRecibo: string | null;
  nrRetificacao?: number;
  idUnico: string | null;
  ocorrencias: Ocorrencia;
  dtUltimaConsulta: string | null;
}

interface Batch {
  indices: number[];
}

// ── Mock Data ─────────────────────────────────────────────────────
const EMPRESAS: EmpresaDeRE[] = [
  {
    raiz: "12.345.678",
    cnpj: "12.345.678/0001-99",
    razao: "Financeira Alpha S.A.",
    filiais: 2,
    d1001: "enviado",
    d1011: "nao_enviado",
    plano: "configurado",
    regTrib: "1 – Serviços Financeiros",
    ocorrencia: "aviso",
  },
  {
    raiz: "98.765.432",
    cnpj: "98.765.432/0001-01",
    razao: "Beta Factoring Ltda.",
    filiais: 0,
    d1001: "nao_enviado",
    d1011: "nao_enviado",
    plano: "nao-configurado",
    regTrib: "9 – Normas Gerais",
    ocorrencia: "erro",
  },
  {
    raiz: "55.444.333",
    cnpj: "55.444.333/0001-55",
    razao: "Gamma Seguros S.A.",
    filiais: 4,
    d1001: "processando",
    d1011: "nao_enviado",
    plano: "configurado",
    regTrib: "2 – Plano de Saúde",
    ocorrencia: null,
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

const EVENTOS_HISTORICO: EventoHistorico[] = [
  {
    cnpjRaiz: "12.345.678",
    cnpj: "12.345.678/0001-99",
    razao: "Financeira Alpha S.A.",
    evento: "D-1001",
    operacao: "Inclusão",
    status: "enviado",
    dtGeracao: "15/04/2026 09:32",
    protocolo: "PROT-2026-0041",
    nrRecibo: "2026-000041-ALPHA0000000000001",
    nrRetificacao: 0,
    idUnico: "DeRE20251112345678SANKHYA0000000000000000041",
    ocorrencias: "aviso",
    dtUltimaConsulta: "15/04/2026 09:33",
  },
  {
    cnpjRaiz: "55.444.333",
    cnpj: "55.444.333/0001-55",
    razao: "Gamma Seguros S.A.",
    evento: "D-1001",
    operacao: "Inclusão",
    status: "enviado",
    dtGeracao: "10/04/2026 14:10",
    protocolo: "PROT-2026-0039",
    nrRecibo: "2026-000039-GAMMA0000000000001",
    nrRetificacao: 0,
    idUnico: "DeRE20251155444333SANKHYA0000000000000000039",
    ocorrencias: null,
    dtUltimaConsulta: "10/04/2026 14:11",
  },
  {
    cnpjRaiz: "55.444.333",
    cnpj: "55.444.333/0001-55",
    razao: "Gamma Seguros S.A.",
    evento: "D-1001",
    operacao: "Alteração",
    status: "enviado",
    dtGeracao: "22/04/2026 10:45",
    protocolo: "PROT-2026-0048",
    nrRecibo: "1001-202604-00000000000000048",
    nrRetificacao: 2,
    idUnico: "DeRE10011155444333000155202604221045000001",
    ocorrencias: null,
    dtUltimaConsulta: "22/04/2026 10:46",
  },
  {
    cnpjRaiz: "55.444.333",
    cnpj: "55.444.333/0001-55",
    razao: "Gamma Seguros S.A.",
    evento: "D-1001",
    operacao: "Alteração",
    status: "processando",
    dtGeracao: "30/04/2026 16:00",
    protocolo: "PROT-2026-0055",
    nrRecibo: null,
    nrRetificacao: 0,
    idUnico: "DeRE10011155444333000155202604301600000001",
    ocorrencias: null,
    dtUltimaConsulta: "30/04/2026 16:01",
  },
  {
    cnpjRaiz: "12.345.678",
    cnpj: "12.345.678/0001-99",
    razao: "Financeira Alpha S.A.",
    evento: "D-1001",
    operacao: "Exclusão",
    status: "enviado",
    dtGeracao: "02/05/2026 11:15",
    protocolo: "PROT-2026-0061",
    nrRecibo: "1001-202605-00000000000000061",
    nrRetificacao: 0,
    idUnico: "DeRE10011123456780001992026050211150000001",
    ocorrencias: null,
    dtUltimaConsulta: "02/05/2026 11:16",
  },
  {
    cnpjRaiz: "98.765.432",
    cnpj: "98.765.432/0001-01",
    razao: "Beta Factoring Ltda.",
    evento: "D-1001",
    operacao: "Inclusão",
    status: "nao_enviado",
    dtGeracao: "05/05/2026 10:00",
    protocolo: null,
    nrRecibo: null,
    idUnico: null,
    ocorrencias: null,
    dtUltimaConsulta: null,
  },
];

// ── Shared Components ─────────────────────────────────────────────
const STATUS_TOOLTIPS: Record<string, string> = {
  enviado: "Evento registrado em ambiente de testes. Na Fase 2, será necessário reenviar para obter recibo real.",
  processando: "Aguardando processamento no ambiente de testes. Recibo chega imediatamente (mock).",
};

function StatusBadge({ status }: { status: StatusDeRE | StatusPlano }) {
  const map: Record<string, [string, string]> = {
    enviado:        ["border-success/50 text-success bg-success/10", "Enviado"],
    processando:    ["border-warning/60 text-warning bg-warning/10", "Processando"],
    nao_enviado:    ["border-border text-muted-foreground bg-muted/50", "Não enviado"],
    configurado:    ["border-success/50 text-success bg-success/10", "Configurado"],
    "nao-configurado": ["border-border text-muted-foreground bg-muted/50", "Não configurado"],
  };
  const [cls, label] = map[status] || ["border-border text-muted-foreground", status];
  const tooltip = STATUS_TOOLTIPS[status];

  const badge = (
    <Badge variant="outline" className={cn("text-xs font-medium", cls)}>
      {label}
    </Badge>
  );

  if (!tooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function OcorrenciaBadge({ ocorrencia }: { ocorrencia: Ocorrencia }) {
  if (!ocorrencia) return <span className="text-muted-foreground/40 text-xs">—</span>;
  const map: Record<string, [string, string]> = {
    erro:  ["border-destructive/50 text-destructive bg-destructive/10", "Erro"],
    aviso: ["border-warning/60 text-warning bg-warning/10", "Aviso"],
  };
  const [cls, label] = map[ocorrencia];
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

function TestEnvBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="text-xs font-medium border-blue-400/50 text-blue-600 bg-blue-50 cursor-default"
        >
          🧪 Testes
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">
        <p>
          A API da Receita Federal ainda não foi liberada. Estes eventos estão sendo
          gerados em ambiente de testes da Sankhya. Quando a Receita Federal
          disponibilizar a API, será necessário reenviar os eventos.
        </p>
      </TooltipContent>
    </Tooltip>
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

// ── MultiSelectField ──────────────────────────────────────────────
interface MultiSelectFieldProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

function MultiSelectField({
  label,
  options,
  selected,
  onChange,
  placeholder = "Selecione as atividades...",
}: MultiSelectFieldProps) {
  const [open, setOpen] = useState(false);

  const unselected = options.filter((o) => !selected.includes(o.value));
  const selectedOptions = options.filter((o) => selected.includes(o.value));

  function add(value: string) {
    onChange([...selected, value]);
  }

  function remove(value: string) {
    onChange(selected.filter((v) => v !== value));
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-9 w-full justify-between text-sm font-normal"
          >
            <span className={cn(!selected.length && "text-muted-foreground")}>
              {selected.length === 0
                ? placeholder
                : `${selected.length} atividade${selected.length > 1 ? "s" : ""} selecionada${selected.length > 1 ? "s" : ""}`}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[480px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar atividade..." className="h-9" />
            <CommandList>
              <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                Nenhuma atividade encontrada.
              </CommandEmpty>
              <CommandGroup>
                {unselected.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => add(opt.value)}
                    className="text-sm cursor-pointer"
                  >
                    {opt.label}
                  </CommandItem>
                ))}
                {unselected.length === 0 && (
                  <div className="py-3 px-2 text-sm text-muted-foreground text-center">
                    Todas as atividades foram selecionadas.
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedOptions.map((opt) => (
            <Badge
              key={opt.value}
              variant="secondary"
              className="flex items-center gap-1 pr-1 text-xs max-w-full"
            >
              <span className="truncate max-w-[360px]" title={opt.label}>
                {opt.label}
              </span>
              <button
                type="button"
                onClick={() => remove(opt.value)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
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
      {/* Banner MVP — Versão de Testes */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-300/40 bg-blue-50/60 px-4 py-2.5 text-sm text-foreground mb-4">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <span>
          <strong>Versão de Testes</strong> — A API da Receita Federal ainda não foi
          liberada. Os eventos são validados localmente e simulados em ambiente de
          testes da Sankhya. Será necessário reenviar na Fase 2.
        </span>
      </div>

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
                    {(e.d1001 === "nao_enviado" || e.d1001 === "enviado") && (
                      <Button
                        size="sm"
                        className="h-7 text-xs px-3"
                        onClick={() => navigate("d1001-list")}
                      >
                        {e.d1001 === "nao_enviado" ? "Iniciar D1001" : "Alterar D1001"}
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
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string[]>([]);
  const [filtroOcorrencia, setFiltroOcorrencia] = useState<string[]>([]);

  const filtered = EMPRESAS.filter((e) => {
    const matchSearch =
      search === "" ||
      e.raiz.includes(search) ||
      e.razao.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filtroStatus.length === 0 || filtroStatus.includes(e.d1001);
    const matchOcorrencia =
      filtroOcorrencia.length === 0 ||
      (filtroOcorrencia.includes("vazio") && e.ocorrencia === null) ||
      (e.ocorrencia !== null && filtroOcorrencia.includes(e.ocorrencia));
    return matchSearch && matchStatus && matchOcorrencia;
  });

  const selectableIndices = filtered
    .map((_, i) => i)
    .filter((i) => filtered[i].d1001 !== "processando");
  const allSelected =
    selectableIndices.length > 0 &&
    selectableIndices.every((i) => selected.includes(i));

  function toggleAll() {
    setSelected(allSelected ? [] : selectableIndices);
  }
  function toggleOne(i: number) {
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  }
  function toggleFilter<T extends string>(
    val: T,
    state: T[],
    setState: (v: T[]) => void
  ) {
    setState(state.includes(val) ? state.filter((x) => x !== val) : [...state, val]);
  }

  function startBatch(indices: number[]) {
    setBatch({ indices });
    navigate("d1001-wiz");
  }

  const STATUS_OPTS: { value: StatusDeRE; label: string }[] = [
    { value: "enviado",     label: "Enviado" },
    { value: "processando", label: "Processando" },
    { value: "nao_enviado", label: "Não enviado" },
  ];
  const OCORR_OPTS = [
    { value: "erro",  label: "Erro" },
    { value: "aviso", label: "Aviso" },
    { value: "vazio", label: "Sem ocorrência" },
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
            <button onClick={() => navigate("home")} className="hover:text-foreground transition-colors">
              DeRE
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">D-1001</span>
          </div>
          <h1 className="text-[20px] font-semibold text-foreground leading-tight">
            Informações do Contribuinte – D-1001
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Selecione uma ou várias empresas para enviar em lote
          </p>
        </div>
        {selected.length > 0 && (
          <Button size="sm" onClick={() => startBatch(selected)} className="gap-1.5 mt-1">
            Iniciar ({selected.length})
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-2.5 mb-4 px-3 py-2.5 bg-muted/40 rounded-lg border">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="CNPJ raiz ou Razão Social"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Status:
            </span>
            {STATUS_OPTS.map((o) => (
              <button
                key={o.value}
                onClick={() => toggleFilter(o.value, filtroStatus, setFiltroStatus as (v: string[]) => void)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                  filtroStatus.includes(o.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Ocorrência:
            </span>
            {OCORR_OPTS.map((o) => (
              <button
                key={o.value}
                onClick={() => toggleFilter(o.value, filtroOcorrencia, setFiltroOcorrencia)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                  filtroOcorrencia.includes(o.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg card-shadow border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">CNPJ Raiz</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Razão Social</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ocorrência</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e, i) => (
              <TableRow key={e.raiz} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <Checkbox
                    checked={selected.includes(i)}
                    onCheckedChange={() => toggleOne(i)}
                    disabled={e.d1001 === "processando"}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-semibold font-mono text-sm">{e.raiz}</div>
                  <div className="text-[11px] text-muted-foreground">{e.cnpj}</div>
                  {e.filiais > 0 && (
                    <Badge variant="outline" className="text-[10px] mt-0.5 border-border text-muted-foreground">
                      +{e.filiais} filiais
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">{e.razao}</TableCell>
                <TableCell><StatusBadge status={e.d1001} /></TableCell>
                <TableCell><OcorrenciaBadge ocorrencia={e.ocorrencia} /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {e.d1001 !== "processando" && (
                      <Button
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => startBatch([i])}
                      >
                        Iniciar
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
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                  Nenhuma empresa encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-2.5 border-t text-[11px] text-muted-foreground bg-muted/20">
          <span>
            <strong>Inclusão</strong> · Não enviado &nbsp;·&nbsp;
            <strong>Alteração</strong> · Enviado &nbsp;·&nbsp;
            <strong>Processando</strong> · sem ação disponível
          </span>
          <span>
            Exibindo <span className="font-medium text-foreground">{filtered.length}</span> de{" "}
            <span className="font-medium text-foreground">{EMPRESAS.length}</span> registros
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
  initialStep?: number;
  initialRegime?: string;
  initialNatureza?: string;
}
function D1001WizardScreen({
  navigate,
  batch,
  initialStep = 1,
  initialRegime = "",
  initialNatureza = "",
}: D1001WizardScreenProps) {
  const [step, setStep] = useState(initialStep);
  const [regTribPrinc, setRegTribPrinc] = useState(initialRegime);
  const [regTribSecund, setRegTribSecund] = useState<string[]>([]);
  const [indNatTrib, setIndNatTrib] = useState(initialNatureza);
  const [atividadesFinanc, setAtividadesFinanc] = useState<string[]>([]);
  const [atividadesSaude, setAtividadesSaude] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [testProtocolo] = useState(() => {
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, "0");
    return `ABC-20260513-${seq}`;
  });

  const indices = batch?.indices?.length ? batch.indices : [0];
  const isMulti = indices.length > 1;
  const empresas = indices.map((i) => EMPRESAS[i]).filter(Boolean);
  const empresa = empresas[0] ?? EMPRESAS[0];

  function getOpTipo(e: EmpresaDeRE): TipoOp {
    return e.d1001 === "nao_enviado" ? "Inclusão" : "Alteração";
  }

  const needsActividades = ["1", "2"].some(
    (r) => regTribPrinc === r || regTribSecund.includes(r)
  );

  const STEPS = ["Revisão", "Dados DeRE", "Atividades", "Envio"];

  function handleNext() {
    if (step === 2 && !needsActividades) setStep(4);
    else if (step < 4) setStep((s) => s + 1);
    else handleSend();
  }
  function handleBack() {
    if (step === 4 && !needsActividades) setStep(2);
    else if (step > 1) setStep((s) => s - 1);
    else navigate("d1001-list");
  }
  function handleSend() {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1500);
  }
  function toggleSecund(val: string) {
    setRegTribSecund((p) => p.includes(val) ? p.filter((x) => x !== val) : [...p, val]);
  }

  const canAdvance =
    step === 1 ? true :
    step === 2 ? regTribPrinc !== "" && indNatTrib !== "" :
    true;

  if (sent) {
    return (
      <div className="flex flex-col items-center py-16 gap-4 max-w-md mx-auto">
        <div className="h-14 w-14 rounded-full bg-success/10 border border-success/30 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">
            Evento{empresas.length > 1 ? "s" : ""} validado{empresas.length > 1 ? "s" : ""} e
            registrado{empresas.length > 1 ? "s" : ""} em ambiente de testes.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Protocolo de teste:{" "}
            <span className="font-mono font-medium">{testProtocolo}</span>
          </p>
        </div>
        <div className="w-full rounded-lg border border-orange-300/60 bg-orange-50 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800">
            Quando a Receita Federal disponibilizar a API, será necessário reenviar
            estes eventos para obter o recibo definitivo.
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          <Button onClick={() => navigate("historico")}>Consultar histórico</Button>
          <Button variant="outline" onClick={() => navigate("d1001-list")}>Voltar ao menu</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <WizardHeader
        breadcrumb={["DeRE", "D-1001", isMulti ? `Lote (${indices.length} empresas)` : empresa.razao]}
        title="Informações do Contribuinte – D-1001"

        onCancel={() => navigate("d1001-list")}
        onBack={handleBack}
        onNext={!sending ? handleNext : undefined}
        nextLabel={step === 4 ? (sending ? "Enviando..." : "Concluir") : "Avançar"}
        nextDisabled={!canAdvance || sending}
      />

      <div className="bg-card rounded-lg border p-6 card-shadow">
        <div className="text-[11px] text-muted-foreground mb-1">Etapa {step} de 4</div>
        <StepsBar steps={STEPS} current={step} />

        {/* Etapa 1 – Revisão das Empresas */}
        {step === 1 && (
          <div className="space-y-4">
            <InfoAlert>
              Revise os dados cadastrais abaixo. Nenhum campo é editável nesta etapa.
            </InfoAlert>
            {isMulti && (
              <WarnAlert>
                Lote com <strong>{indices.length} empresas</strong>. Cada empresa será enviada com seu próprio tipo de operação.
              </WarnAlert>
            )}
            {empresas.map((e) => (
              <div key={e.raiz} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm">{e.raiz}</span>
                  <OpBadge tipo={getOpTipo(e)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Razão Social" value={e.razao} filled />
                  <Field label="CNAE Principal" value="6491-3/00" filled />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Logradouro" value="Av. Paulista, 1000" filled />
                  <Field label="Município" value="São Paulo – SP" filled />
                  <Field label="CEP" value="01310-100" filled />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Etapa 2 – Dados Específicos da DeRE */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Complete os campos específicos da DeRE</h3>
            {empresas.map((e) => (
              <div key={e.raiz} className="border rounded-lg p-4 space-y-4">
                {isMulti && (
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <span className="font-mono font-semibold text-sm">{e.raiz}</span>
                    <span className="text-xs text-muted-foreground">{e.razao}</span>
                  </div>
                )}
                {/* regTribPrinc */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    Regime Tributário Principal
                  </label>
                  <Select value={regTribPrinc} onValueChange={(v) => { setRegTribPrinc(v); setRegTribSecund((p) => p.filter((x) => x !== v)); }}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Selecione o regime tributário principal do contribuinte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">9 – Normas Gerais de Tributação</SelectItem>
                      <SelectItem value="1">1 – Regime Específico de Serviços Financeiros</SelectItem>
                      <SelectItem value="2">2 – Regime Específico de Plano de Assistência à Saúde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* regTribSecund */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    Regimes Tributários Secundários (opcional)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: "1", label: "1 – Serviços Financeiros" },
                      { value: "2", label: "2 – Plano de Assistência à Saúde" },
                    ].filter((o) => o.value !== regTribPrinc).map((opt) => (
                      <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={regTribSecund.includes(opt.value)}
                          onCheckedChange={() => toggleSecund(opt.value)}
                        />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                    {regTribPrinc === "" && (
                      <span className="text-xs text-muted-foreground italic">Selecione o regime principal primeiro</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    Natureza Tributária
                  </label>
                  <Select value={indNatTrib} onValueChange={setIndNatTrib}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Selecione a natureza tributária" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 – Tributação regular</SelectItem>
                      <SelectItem value="1">1 – Imunidade ou não incidência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Etapa 3 – Atividades Específicas */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Informe as atividades dos regimes específicos</h3>
            {!needsActividades && (
              <InfoAlert>
                Nenhuma atividade específica é exigida para os regimes selecionados.
              </InfoAlert>
            )}
            {(regTribPrinc === "1" || regTribSecund.includes("1")) && (
              <div className="border rounded-lg p-4">
                <MultiSelectField
                  label="Tabela 21 – Atividades de Serviços Financeiros"
                  options={[
                    { value: "1", label: "1 – Operações de crédito (captação, repasse, empréstimo, financiamento)" },
                    { value: "2", label: "2 – Operações de câmbio (inclusive por tarifa ou comissão)" },
                    { value: "3", label: "3 – Operações com títulos e valores mobiliários (custódia, corretagem)" },
                  ]}
                  selected={atividadesFinanc}
                  onChange={setAtividadesFinanc}
                />
              </div>
            )}
            {(regTribPrinc === "2" || regTribSecund.includes("2")) && (
              <div className="border rounded-lg p-4">
                <MultiSelectField
                  label="Tabela 31 – Atividades de Planos de Assistência à Saúde"
                  options={[
                    { value: "1", label: "1 – Seguradoras de saúde" },
                    { value: "2", label: "2 – Administradoras de benefícios" },
                    { value: "3", label: "3 – Cooperativas operadoras de planos de saúde" },
                  ]}
                  selected={atividadesSaude}
                  onChange={setAtividadesSaude}
                />
              </div>
            )}
          </div>
        )}

        {/* Etapa 4 – Revisão Final e Envio */}
        {step === 4 && !sending && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Revise as informações antes de enviar</h3>
            {/* Banner Ambiente de Testes */}
            <div className="rounded-lg border border-blue-300/50 bg-[#E3F2FD] p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-800">Ambiente de Testes</p>
                <p className="text-sm text-blue-800">
                  A API da Receita Federal ainda não foi liberada. Estes eventos serão
                  validados localmente e simulados em ambiente de testes da Sankhya.
                  Quando a Receita Federal disponibilizar a API, será necessário
                  reenviar os eventos para obter o recibo definitivo.
                </p>
              </div>
            </div>
            <InfoAlert>
              Serão enviados <strong>{empresas.length} evento{empresas.length > 1 ? "s" : ""} D-1001</strong>.
              Esta ação pode ser desfeita enviando um evento de <strong>Alteração</strong> ou <strong>Exclusão</strong>.
            </InfoAlert>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-10">#</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Operação</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">CNPJ Raiz</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Razão Social</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresas.map((e, i) => (
                    <TableRow key={e.raiz}>
                      <TableCell className="text-sm text-muted-foreground">{i + 1}</TableCell>
                      <TableCell><OpBadge tipo={getOpTipo(e)} /></TableCell>
                      <TableCell className="font-mono text-sm">{e.raiz}</TableCell>
                      <TableCell className="text-sm">{e.razao}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        {step === 4 && sending && (
          <div className="flex flex-col items-center py-10 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Enviando...</p>
          </div>
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
  const [search, setSearch] = useState("");
  const [filtroEvento, setFiltroEvento] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState<string[]>([]);
  const [filtroOperacao, setFiltroOperacao] = useState<TipoOp[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [motExcl, setMotExcl] = useState("");
  const [eventos, setEventos] = useState<EventoHistorico[]>(EVENTOS_HISTORICO);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [filtroAmbiente, setFiltroAmbiente] = useState<string[]>([]);

  const filtered = eventos.filter((e) => {
    const matchSearch =
      search === "" ||
      e.cnpjRaiz.includes(search) ||
      e.razao.toLowerCase().includes(search.toLowerCase()) ||
      (e.protocolo ?? "").includes(search) ||
      (e.nrRecibo ?? "").includes(search) ||
      (e.idUnico ?? "").includes(search);
    const matchEvento = filtroEvento === "todos" || e.evento === filtroEvento;
    const matchStatus = filtroStatus.length === 0 || filtroStatus.includes(e.status);
    const matchOperacao = filtroOperacao.length === 0 || filtroOperacao.includes(e.operacao);
    // MVP: todos os eventos são "Testes". Filtrar "Produção" exibe zero resultados.
    const matchAmbiente =
      filtroAmbiente.length === 0 || filtroAmbiente.includes("Testes");
    return matchSearch && matchEvento && matchStatus && matchOperacao && matchAmbiente;
  });

  const allSelected = filtered.length > 0 && filtered.every((_, i) => selected.includes(i));
  function toggleAll() {
    setSelected(allSelected ? [] : filtered.map((_, i) => i));
  }
  function toggleOne(i: number) {
    setSelected((s) => s.includes(i) ? s.filter((x) => x !== i) : [...s, i]);
  }
  function toggleStatusFilter(v: string) {
    setFiltroStatus((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  }
  function toggleOperacaoFilter(v: TipoOp) {
    setFiltroOperacao((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  }
  function handleDelete(i: number) {
    const evento = filtered[i];
    if (!evento) return;

    setDeleteConfirm(null);
    setMotExcl("");
    setSelected((s) => s.filter((x) => x !== i).map((x) => x > i ? x - 1 : x));

    if (!evento.nrRecibo) {
      setEventos((prev) => prev.filter((ev) => ev !== evento));
      return;
    }

    // Com recibo: transmite exclusão → processando → Exclusão/enviado
    setEventos((prev) =>
      prev.map((ev) => ev === evento ? { ...ev, status: "processando" as StatusDeRE } : ev)
    );
    setTimeout(() => {
      setEventos((prev) =>
        prev.map((ev) =>
          ev === evento
            ? { ...ev, status: "enviado" as StatusDeRE, operacao: "Exclusão" as TipoOp }
            : ev
        )
      );
      setShowDeleteSuccess(true);
    }, 2500);
  }

  function handleUpdateStatus(ev: EventoHistorico) {
    const now = new Date().toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    setEventos((prev) => prev.map((e) => e === ev ? { ...e, dtUltimaConsulta: now } : e));
    setShowUpdateModal(true);
  }

  const temProcessando = selected.some((i) => filtered[i]?.status === "processando");

  const TH = "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
            <button onClick={() => navigate("home")} className="hover:text-foreground transition-colors">
              DeRE
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Histórico de Eventos</span>
          </div>
          <h1 className="text-[20px] font-semibold text-foreground leading-tight">Histórico de Eventos</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Consulte todos os eventos transmitidos</p>
        </div>
        {/* Ações globais */}
        <div className="flex items-center gap-2 mt-1">
          <Button
            variant="outline" size="sm"
            className="gap-1.5"
            disabled={selected.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            Baixar{selected.length > 0 ? ` (${selected.length})` : ""}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline" size="sm"
                className="gap-1.5"
                onClick={() => setShowUpdateModal(true)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              <p>⚠️ Ambiente de testes: não há polling real. O recibo de teste está registrado na tabela.</p>
            </TooltipContent>
          </Tooltip>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Importar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-2.5 mb-4 px-3 py-2.5 bg-muted/40 rounded-lg border">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="CNPJ, razão social, protocolo ou recibo"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Evento:</span>
            {["todos", "D-1001", "D-1011"].map((f) => (
              <button
                key={f}
                onClick={() => setFiltroEvento(f)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                  filtroEvento === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {f === "todos" ? "Todos" : f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Status:</span>
            {(["enviado", "processando", "nao_enviado"] as StatusDeRE[]).map((v) => (
              <button
                key={v}
                onClick={() => toggleStatusFilter(v)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                  filtroStatus.includes(v)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {v === "nao_enviado" ? "Não enviado" : v === "processando" ? "Processando" : "Enviado"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Operação:</span>
            {(["Inclusão", "Alteração", "Exclusão"] as TipoOp[]).map((v) => (
              <button
                key={v}
                onClick={() => toggleOperacaoFilter(v)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                  filtroOperacao.includes(v)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ambiente:</span>
            {(["Testes", "Produção"] as const).map((v) => (
              <button
                key={v}
                onClick={() =>
                  setFiltroAmbiente((p) =>
                    p.includes(v) ? p.filter((x) => x !== v) : [...p, v]
                  )
                }
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                  filtroAmbiente.includes(v)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg card-shadow border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className={TH}>CNPJ Raiz</TableHead>
              <TableHead className={TH}>Razão Social</TableHead>
              <TableHead className={TH}>Evento</TableHead>
              <TableHead className={TH}>Operação</TableHead>
              <TableHead className={TH}>Status</TableHead>
              <TableHead className={TH}>
                <Tooltip>
                  <TooltipTrigger className="cursor-default underline decoration-dotted">
                    Ambiente
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p>
                      A API da Receita Federal ainda não foi liberada. Estes eventos
                      estão sendo gerados em ambiente de testes da Sankhya. Quando a
                      Receita Federal disponibilizar a API, será necessário reenviar
                      os eventos.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className={TH}>Data/Hora Geração</TableHead>
              <TableHead className={TH}>ID Único</TableHead>
              <TableHead className={TH}>
                <Tooltip>
                  <TooltipTrigger className="cursor-default underline decoration-dotted">
                    Protocolo
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p>Protocolo de teste (ambiente de testes; recibo definitivo na Fase 2).</p>
                  </TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className={TH}>
                <Tooltip>
                  <TooltipTrigger className="cursor-default underline decoration-dotted">
                    Recibo
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p>Recibo de teste (ambiente de testes; recibo definitivo na Fase 2).</p>
                  </TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className={TH}>Retificação</TableHead>
              <TableHead className={TH}>Ocorrências</TableHead>
              <TableHead className={TH}>Última Consulta</TableHead>
              <TableHead className={TH}>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e, i) => (
              <>
                <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <Checkbox checked={selected.includes(i)} onCheckedChange={() => toggleOne(i)} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{e.cnpjRaiz}</TableCell>
                  <TableCell className="text-sm">{e.razao}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-blue-400/50 text-blue-600 bg-blue-50 text-xs">
                      {e.evento}
                    </Badge>
                  </TableCell>
                  <TableCell><OpBadge tipo={e.operacao} /></TableCell>
                  <TableCell><StatusBadge status={e.status} /></TableCell>
                  <TableCell><TestEnvBadge /></TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{e.dtGeracao}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap" title={e.idUnico ?? undefined}>{e.idUnico ? e.idUnico.substring(0, 13) + "…" : "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{e.protocolo ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[140px] truncate">{e.nrRecibo ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(e.nrRetificacao ?? 0) > 0
                      ? <Badge variant="outline" className="border-warning/60 text-warning bg-warning/10 text-xs">{e.nrRetificacao}</Badge>
                      : <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell><OcorrenciaBadge ocorrencia={e.ocorrencias} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{e.dtUltimaConsulta ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="Baixar XML">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleUpdateStatus(e)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          <p>⚠️ Ambiente de testes: não há polling real. O recibo de teste está registrado acima.</p>
                        </TooltipContent>
                      </Tooltip>
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        title="Excluir"
                        onClick={() => { setDeleteConfirm(deleteConfirm === i ? null : i); setMotExcl(""); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {deleteConfirm === i && (
                  <TableRow key={`confirm-${i}`} className="bg-destructive/5">
                    <TableCell colSpan={15} className="py-3 px-4">
                      <div className="flex items-center justify-between gap-4">
                        {e.nrRecibo ? (
                          <div className="flex flex-col gap-2 flex-1">
                            <p className="text-sm text-destructive">
                              Esse evento tem recibo de entrega. Esta ação transmitirá o evento de exclusão em ambiente de testes. Selecione o motivo:
                            </p>
                            <div className="flex items-center gap-3">
                              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                                Motivo de exclusão
                              </label>
                              <Select value={motExcl} onValueChange={setMotExcl}>
                                <SelectTrigger className="h-8 text-xs max-w-xs">
                                  <SelectValue placeholder="Selecione o motivo..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="01">01 – Determinação judicial ou administrativa</SelectItem>
                                  <SelectItem value="02">02 – Envio indevido (fato inexistente)</SelectItem>
                                  <SelectItem value="03">03 – Erro na identificação (CNPJ/período incorretos)</SelectItem>
                                  <SelectItem value="09">09 – Outro</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-destructive">
                            Esse evento não tem recibo de entrega. Essa ação vai apenas apagar o evento no sistema. Deseja excluir?
                          </p>
                        )}
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => { setDeleteConfirm(null); setMotExcl(""); }}>
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(i)}
                            disabled={e.nrRecibo ? motExcl === "" : false}
                          >
                            {e.nrRecibo ? "Enviar exclusão" : "Excluir"}
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={15} className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum evento encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-end px-4 py-2.5 border-t text-[11px] text-muted-foreground bg-muted/20">
          <span>
            Exibindo <span className="font-medium text-foreground">{filtered.length}</span> de{" "}
            <span className="font-medium text-foreground">{eventos.length}</span> registros
          </span>
        </div>
      </div>

      {/* Modal: Atualizar — Ambiente de Testes */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Ambiente de Testes
            </DialogTitle>
            <DialogDescription className="text-sm text-foreground pt-2">
              Não há polling real para a API da RFB. O recibo de teste está registrado
              na tabela acima.
              <br /><br />
              Quando a RFB disponibilizar a API, este botão fará consultas reais e
              atualizará o status do evento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" onClick={() => setShowUpdateModal(false)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Exclusão Registrada — Ambiente de Testes */}
      <Dialog open={showDeleteSuccess} onOpenChange={setShowDeleteSuccess}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Exclusão registrada
            </DialogTitle>
            <DialogDescription className="text-sm text-foreground pt-2">
              O evento de exclusão foi registrado em ambiente de testes.
              <br /><br />
              Quando a Receita Federal disponibilizar a API, será necessário reenviar
              este evento para obter o recibo definitivo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" onClick={() => setShowDeleteSuccess(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
interface ApuracaoDereProps {
  initialScreen?: Screen;
}

export default function ApuracaoDere({ initialScreen = "home" }: ApuracaoDereProps) {
  const location = useLocation();
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [biaWizStep, setBiaWizStep] = useState(1);
  const [biaRegime, setBiaRegime] = useState("");
  const [biaNatureza, setBiaNatureza] = useState("");

  useEffect(() => {
    setScreen(initialScreen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [initialScreen]);

  useEffect(() => {
    const state = location.state as {
      fromBIA?: boolean;
      wizScreen?: Screen;
      wizStep?: number;
      regime?: string;
      natureza?: string;
    } | null;
    if (!state?.fromBIA) return;
    if (state.wizScreen) setScreen(state.wizScreen);
    if (state.wizStep !== undefined) setBiaWizStep(state.wizStep);
    if (state.regime !== undefined) setBiaRegime(state.regime);
    if (state.natureza !== undefined) setBiaNatureza(state.natureza);
  }, [location.state]);

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
        <D1001WizardScreen
          key={`bia-${biaWizStep}-${biaRegime}-${biaNatureza}`}
          navigate={navigate}
          batch={batch}
          initialStep={biaWizStep}
          initialRegime={biaRegime}
          initialNatureza={biaNatureza}
        />
      )}
      {screen === "d1011-list" && <D1011ListScreen navigate={navigate} />}
      {screen === "d1011-depara" && <D1011DeparaScreen navigate={navigate} />}
      {screen === "historico" && <HistoricoScreen navigate={navigate} />}
    </div>
  );
}
