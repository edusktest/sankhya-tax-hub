import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────
type Screen = "list" | "wizard";
type Ambiente = "1" | "2" | null;

interface EmpresaCredencial {
  cod: string;
  razao: string;
  cnpj: string;
  logradouro: string;
  municipio: string;
  cep: string;
  ambiente: Ambiente;
  clientId: string | null;
  clientSecret: string | null;
}

// ── Mock Data ─────────────────────────────────────────────────────
const MOCK_EMPRESAS: EmpresaCredencial[] = [
  {
    cod: "001",
    razao: "Financeira Alpha S.A.",
    cnpj: "12.345.678/0001-99",
    logradouro: "Av. Paulista, 1000",
    municipio: "São Paulo – SP",
    cep: "01310-100",
    ambiente: null,
    clientId: null,
    clientSecret: null,
  },
  {
    cod: "002",
    razao: "Beta Factoring Ltda.",
    cnpj: "98.765.432/0001-01",
    logradouro: "Rua da Consolação, 300",
    municipio: "São Paulo – SP",
    cep: "01302-000",
    ambiente: null,
    clientId: null,
    clientSecret: null,
  },
  {
    cod: "003",
    razao: "Gamma Seguros S.A.",
    cnpj: "55.444.333/0001-55",
    logradouro: "Av. Brigadeiro Faria Lima, 2500",
    municipio: "São Paulo – SP",
    cep: "01452-000",
    ambiente: null,
    clientId: null,
    clientSecret: null,
  },
];

// ── Filter options ─────────────────────────────────────────────────
const AMBIENTE_OPTS = [
  { value: "todos",   label: "Todos"              },
  { value: "nc",      label: "Não configurado"    },
  { value: "1",       label: "1 – Produção"       },
  { value: "2",       label: "2 – Prod. Restrita" },
];

const CREDENCIAL_OPTS = [
  { value: "todos", label: "Todos"           },
  { value: "nc",    label: "Não configurada" },
  { value: "ok",    label: "Configurada"     },
];

// ── Badges ─────────────────────────────────────────────────────────
function AmbienteBadge({ ambiente }: { ambiente: Ambiente }) {
  if (!ambiente) {
    return (
      <Badge variant="outline" className="text-xs font-medium border-border text-muted-foreground bg-muted/50">
        Não configurado
      </Badge>
    );
  }
  const label = ambiente === "1" ? "1 – Produção" : "2 – Produção Restrita";
  const cls =
    ambiente === "1"
      ? "border-success/50 text-success bg-success/10"
      : "border-warning/60 text-warning bg-warning/10";
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", cls)}>
      {label}
    </Badge>
  );
}

function CredencialBadge({ configurada }: { configurada: boolean }) {
  if (!configurada) {
    return (
      <Badge variant="outline" className="text-xs font-medium border-border text-muted-foreground bg-muted/50">
        Não configurada
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs font-medium border-success/50 text-success bg-success/10">
      Configurada
    </Badge>
  );
}

// ── Field (read-only display) ──────────────────────────────────────
function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <div className="rounded-md border px-3 py-2 text-sm min-h-[36px] bg-muted/30 text-foreground">
        {value || <span className="text-muted-foreground/40 italic text-xs">—</span>}
      </div>
    </div>
  );
}

// ── WizardHeader ───────────────────────────────────────────────────
interface WizardHeaderProps {
  breadcrumb: string[];
  title: string;
  onCancel: () => void;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}
function WizardHeader({
  breadcrumb,
  title,
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
                <span className={i === breadcrumb.length - 1 ? "text-foreground font-medium" : ""}>
                  {b}
                </span>
              </span>
            ))}
          </div>
          <h1 className="text-[16px] font-semibold text-foreground leading-tight truncate">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground">
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

// ── StepsBar ───────────────────────────────────────────────────────
function StepsBar({ steps, current }: { steps: string[]; current: number }) {
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

// ── InputField ─────────────────────────────────────────────────────
function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 text-sm"
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function DereCredenciais() {
  const [screen, setScreen] = useState<Screen>("list");
  const [empresas, setEmpresas] = useState<EmpresaCredencial[]>(MOCK_EMPRESAS);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [step, setStep] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [filtroAmbiente, setFiltroAmbiente] = useState("todos");
  const [filtroCredencial, setFiltroCredencial] = useState("todos");

  // Wizard form state
  const [formAmbiente, setFormAmbiente] = useState<string>("");
  const [formClientId, setFormClientId] = useState("");
  const [formClientSecret, setFormClientSecret] = useState("");

  const filtered = useMemo(() => {
    return empresas.filter((e) => {
      const q = search.toLowerCase();
      if (q && !e.razao.toLowerCase().includes(q) && !e.cnpj.includes(q) && !e.cod.includes(q)) {
        return false;
      }
      if (filtroAmbiente !== "todos") {
        if (filtroAmbiente === "nc" && e.ambiente !== null) return false;
        if (filtroAmbiente === "1" && e.ambiente !== "1") return false;
        if (filtroAmbiente === "2" && e.ambiente !== "2") return false;
      }
      if (filtroCredencial !== "todos") {
        const cfg = e.clientId !== null && e.clientSecret !== null;
        if (filtroCredencial === "nc" && cfg) return false;
        if (filtroCredencial === "ok" && !cfg) return false;
      }
      return true;
    });
  }, [empresas, search, filtroAmbiente, filtroCredencial]);

  function openWizard(originalIdx: number) {
    const e = empresas[originalIdx];
    setSelectedIdx(originalIdx);
    setFormAmbiente(e.ambiente ?? "");
    setFormClientId(e.clientId ?? "");
    setFormClientSecret(e.clientSecret ?? "");
    setStep(1);
    setScreen("wizard");
  }

  function handleCancel() {
    setScreen("list");
    setSelectedIdx(null);
    setStep(1);
  }

  function handleSave() {
    if (selectedIdx === null) return;
    setEmpresas((prev) =>
      prev.map((e, i) =>
        i === selectedIdx
          ? {
              ...e,
              ambiente: (formAmbiente as Ambiente) || null,
              clientId: formClientId.trim() || null,
              clientSecret: formClientSecret.trim() || null,
            }
          : e
      )
    );
    setScreen("list");
    setSelectedIdx(null);
    setStep(1);
  }

  const canSave = formAmbiente !== "";

  const empresa = selectedIdx !== null ? empresas[selectedIdx] : null;

  // ── List ──────────────────────────────────────────────────────
  if (screen === "list") {
    return (
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Credenciais DeRE</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure o ambiente e as credenciais para cada empresa habilitada no módulo DeRE.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-2.5 px-3 py-2.5 bg-muted/40 rounded-lg border">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cód., CNPJ ou Razão Social"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ambiente:
              </span>
              {AMBIENTE_OPTS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setFiltroAmbiente(o.value)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                    filtroAmbiente === o.value
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
                Credencial:
              </span>
              {CREDENCIAL_OPTS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setFiltroCredencial(o.value)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                    filtroCredencial === o.value
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
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-24">
                  Cód. Empresa
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Razão Social
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  CNPJ
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Ambiente
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Credencial
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                    Nenhuma empresa encontrada para os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => {
                  const originalIdx = empresas.indexOf(e);
                  const configurada = e.clientId !== null && e.clientSecret !== null;
                  return (
                    <TableRow key={e.cod} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-sm">{e.cod}</TableCell>
                      <TableCell className="text-sm">{e.razao}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{e.cnpj}</TableCell>
                      <TableCell>
                        <AmbienteBadge ambiente={e.ambiente} />
                      </TableCell>
                      <TableCell>
                        <CredencialBadge configurada={configurada} />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          className="h-7 text-xs px-3"
                          onClick={() => openWizard(originalIdx)}
                        >
                          {configurada ? "Editar" : "Iniciar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // ── Wizard ────────────────────────────────────────────────────
  if (!empresa) return null;

  return (
    <div className="p-6">
      <WizardHeader
        breadcrumb={["DeRE", "Credenciais", empresa.razao]}
        title={step === 1 ? "Revisão dos Dados da Empresa" : "Ambiente e Credenciais"}
        onCancel={handleCancel}
        onBack={step === 2 ? () => setStep(1) : undefined}
        onNext={step === 1 ? () => setStep(2) : handleSave}
        nextLabel={step === 1 ? "Avançar" : "Salvar"}
        nextDisabled={step === 2 && !canSave}
      />

      <div className="max-w-2xl mx-auto">
        <StepsBar steps={["Revisão", "Ambiente e Credenciais"]} current={step} />

        {step === 1 && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Confirme os dados cadastrais da empresa antes de configurar o acesso ao DeRE.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Razão Social" value={empresa.razao} />
              </div>
              <Field label="CNPJ" value={empresa.cnpj} />
              <Field label="CEP" value={empresa.cep} />
              <div className="sm:col-span-2">
                <Field label="Logradouro" value={empresa.logradouro} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Município" value={empresa.municipio} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            {/* Ambiente */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <span className="text-sm font-semibold text-foreground">Ambiente</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Ambiente DeRE<span className="text-destructive ml-0.5">*</span>
                </label>
                <Select value={formAmbiente} onValueChange={setFormAmbiente}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione o ambiente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 – Produção</SelectItem>
                    <SelectItem value="2">2 – Produção Restrita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Credenciais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <span className="text-sm font-semibold text-foreground">Credenciais</span>
              </div>
              <InputField
                label="Client_ID"
                value={formClientId}
                onChange={setFormClientId}
                placeholder="Informe o Client ID fornecido pela Receita Federal"
              />
              <InputField
                label="Client_Secret"
                value={formClientSecret}
                onChange={setFormClientSecret}
                placeholder="Informe o Client Secret fornecido pela Receita Federal"
                type="password"
              />
              <p className="text-[11px] text-muted-foreground">
                As credenciais são fornecidas pela Receita Federal no portal de acesso ao DeRE.
                Mantenha-as seguras e não as compartilhe.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
