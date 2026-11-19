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
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, Loader2, Plug, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────
type Screen = "list" | "wizard";
type Ambiente = "1" | "2" | null;
type ServicoKey = "dere" | "assistida";
type StatusServico = "nao-habilitado" | "nao-configurado" | "configurado";

interface ServicoCredencial {
  habilitado: boolean; // serviço habilitado para a empresa
  ambiente: Ambiente;
  clientId: string | null;
  clientSecret: string | null;
}

interface EmpresaCredencial {
  cod: string;
  razao: string;
  cnpj: string;
  logradouro: string;
  municipio: string;
  cep: string;
  servicos: Record<ServicoKey, ServicoCredencial>;
}

interface FormServico {
  ambiente: string;
  clientId: string;
  clientSecret: string;
}

type ResultadoTeste = { estado: "idle" } | { estado: "testando" } | { estado: "ok" } | { estado: "erro"; mensagem: string };

const SERVICOS: { key: ServicoKey; label: string; feminino: boolean; origem: string }[] = [
  { key: "dere", label: "DeRE", feminino: false, origem: "no portal de acesso ao DeRE" },
  { key: "assistida", label: "Apuração Assistida", feminino: true, origem: "no portal da Apuração Assistida" },
];

const naoHabilitado: ServicoCredencial = { habilitado: false, ambiente: null, clientId: null, clientSecret: null };
const semCredencial: ServicoCredencial = { habilitado: true, ambiente: null, clientId: null, clientSecret: null };

// ── Mock Data ─────────────────────────────────────────────────────
const MOCK_EMPRESAS: EmpresaCredencial[] = [
  {
    cod: "001",
    razao: "Financeira Alpha S.A.",
    cnpj: "12.345.678/0001-99",
    logradouro: "Av. Paulista, 1000",
    municipio: "São Paulo – SP",
    cep: "01310-100",
    servicos: { dere: semCredencial, assistida: semCredencial },
  },
  {
    cod: "002",
    razao: "Beta Factoring Ltda.",
    cnpj: "98.765.432/0001-01",
    logradouro: "Rua da Consolação, 300",
    municipio: "São Paulo – SP",
    cep: "01302-000",
    servicos: { dere: naoHabilitado, assistida: semCredencial },
  },
  {
    cod: "003",
    razao: "Gamma Seguros S.A.",
    cnpj: "55.444.333/0001-55",
    logradouro: "Av. Brigadeiro Faria Lima, 2500",
    municipio: "São Paulo – SP",
    cep: "01452-000",
    servicos: {
      dere: { habilitado: true, ambiente: "1", clientId: "dere-gamma-0003", clientSecret: "segredo-dere-0003" },
      assistida: { habilitado: true, ambiente: "1", clientId: "aa-gamma-0003", clientSecret: "segredo-aa-0003" },
    },
  },
  {
    cod: "004",
    razao: "Delta Capital S.A.",
    cnpj: "33.222.111/0001-44",
    logradouro: "Rua Funchal, 411",
    municipio: "São Paulo – SP",
    cep: "04551-060",
    servicos: {
      dere: { habilitado: true, ambiente: "2", clientId: "dere-delta-0004", clientSecret: "segredo-dere-0004" },
      assistida: { habilitado: true, ambiente: "1", clientId: "aa-delta-0004", clientSecret: "segredo-aa-0004" },
    },
  },
];

// ── Status ────────────────────────────────────────────────────────
function statusServico(s: ServicoCredencial): StatusServico {
  if (!s.habilitado) return "nao-habilitado";
  return s.ambiente && s.clientId && s.clientSecret ? "configurado" : "nao-configurado";
}

function rotuloStatus(s: ServicoCredencial, feminino: boolean): string {
  const status = statusServico(s);
  if (status === "nao-habilitado") return feminino ? "Não habilitada" : "Não habilitado";
  if (status === "nao-configurado") return feminino ? "Não configurada" : "Não configurado";
  return `Configurado (${s.ambiente === "1" ? "produção" : "produção restrita"})`;
}

const FILTRO_STATUS_OPTS: { value: string; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "configurado", label: "Configurado" },
  { value: "nao-configurado", label: "Não configurado" },
  { value: "nao-habilitado", label: "Não habilitado" },
];

function StatusBadge({ servico, feminino }: { servico: ServicoCredencial; feminino: boolean }) {
  const status = statusServico(servico);
  const cls =
    status === "configurado"
      ? servico.ambiente === "1"
        ? "border-success/50 text-success bg-success/10"
        : "border-warning/60 text-warning bg-warning/10"
      : status === "nao-configurado"
      ? "border-border text-muted-foreground bg-muted/50"
      : "border-dashed border-border text-muted-foreground/70 bg-transparent";
  return (
    <Badge variant="outline" className={cn("text-xs font-medium whitespace-nowrap", cls)}>
      {rotuloStatus(servico, feminino)}
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

const formVazio = (): FormServico => ({ ambiente: "", clientId: "", clientSecret: "" });
const formCompleto = (f: FormServico) => f.ambiente !== "" && f.clientId.trim() !== "" && f.clientSecret.trim() !== "";

// ── Main component ─────────────────────────────────────────────────
export default function Credenciais() {
  const [screen, setScreen] = useState<Screen>("list");
  const [empresas, setEmpresas] = useState<EmpresaCredencial[]>(MOCK_EMPRESAS);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [step, setStep] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [filtros, setFiltros] = useState<Record<ServicoKey, string>>({ dere: "todos", assistida: "todos" });

  // Wizard form state (um bloco por serviço)
  const [forms, setForms] = useState<Record<ServicoKey, FormServico>>({ dere: formVazio(), assistida: formVazio() });
  const [testes, setTestes] = useState<Record<ServicoKey, ResultadoTeste>>({
    dere: { estado: "idle" },
    assistida: { estado: "idle" },
  });

  const filtered = useMemo(() => {
    return empresas.filter((e) => {
      const q = search.toLowerCase();
      if (q && !e.razao.toLowerCase().includes(q) && !e.cnpj.includes(q) && !e.cod.includes(q)) {
        return false;
      }
      return SERVICOS.every((s) => filtros[s.key] === "todos" || statusServico(e.servicos[s.key]) === filtros[s.key]);
    });
  }, [empresas, search, filtros]);

  const empresa = selectedIdx !== null ? empresas[selectedIdx] : null;
  // Etapas: Revisão + um passo por serviço habilitado (2 etapas com 1 serviço, 3 com DeRE e Apuração Assistida)
  const servicosAtivos = empresa ? SERVICOS.filter((s) => empresa.servicos[s.key].habilitado) : [];
  const etapas = ["Revisão", ...servicosAtivos.map((s) => s.label)];
  const servicoAtual = step > 1 ? servicosAtivos[step - 2] : null;

  function openWizard(originalIdx: number) {
    const e = empresas[originalIdx];
    const next = { dere: formVazio(), assistida: formVazio() };
    SERVICOS.forEach((s) => {
      const sv = e.servicos[s.key];
      next[s.key] = { ambiente: sv.ambiente ?? "", clientId: sv.clientId ?? "", clientSecret: sv.clientSecret ?? "" };
    });
    setForms(next);
    setTestes({ dere: { estado: "idle" }, assistida: { estado: "idle" } });
    setSelectedIdx(originalIdx);
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
      prev.map((e, i) => {
        if (i !== selectedIdx) return e;
        const servicos = { ...e.servicos };
        servicosAtivos.forEach((s) => {
          const f = forms[s.key];
          servicos[s.key] = {
            ...servicos[s.key],
            ambiente: (f.ambiente as Ambiente) || null,
            clientId: f.clientId.trim() || null,
            clientSecret: f.clientSecret.trim() || null,
          };
        });
        return { ...e, servicos };
      })
    );
    handleCancel();
  }

  function atualizarForm(key: ServicoKey, campo: keyof FormServico, valor: string) {
    setForms((prev) => ({ ...prev, [key]: { ...prev[key], [campo]: valor } }));
    setTestes((prev) => ({ ...prev, [key]: { estado: "idle" } })); // dados mudaram: o teste anterior deixa de valer
  }

  // Simula a chamada de teste de conexão com as credenciais informadas
  function testarConexao(key: ServicoKey) {
    const f = forms[key];
    setTestes((prev) => ({ ...prev, [key]: { estado: "testando" } }));
    window.setTimeout(() => {
      const validas = f.clientId.trim().length >= 8 && f.clientSecret.trim().length >= 8;
      setTestes((prev) => ({
        ...prev,
        [key]: validas
          ? { estado: "ok" }
          : { estado: "erro", mensagem: "Falha na autenticação: Client_ID ou Client_Secret inválidos." },
      }));
    }, 1200);
  }

  // ── List ──────────────────────────────────────────────────────
  if (screen === "list") {
    return (
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Credenciais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure o ambiente e as credenciais de cada empresa para os serviços habilitados (DeRE e Apuração Assistida).
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
            {SERVICOS.map((s) => (
              <div key={s.key} className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {s.label}:
                </span>
                {FILTRO_STATUS_OPTS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setFiltros((prev) => ({ ...prev, [s.key]: o.value }))}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                      filtros[s.key] === o.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg card-shadow border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-24">
                  Empresa
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Razão Social
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  CNPJ
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Dere
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Apuração Assistida
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
                  const habilitados = SERVICOS.filter((s) => e.servicos[s.key].habilitado);
                  const algumConfigurado = habilitados.some((s) => statusServico(e.servicos[s.key]) === "configurado");
                  return (
                    <TableRow key={e.cod} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-sm">{e.cod}</TableCell>
                      <TableCell className="text-sm">{e.razao}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{e.cnpj}</TableCell>
                      {SERVICOS.map((s) => (
                        <TableCell key={s.key}>
                          <StatusBadge servico={e.servicos[s.key]} feminino={s.feminino} />
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          size="sm"
                          className="h-7 text-xs px-3"
                          disabled={habilitados.length === 0}
                          title={habilitados.length === 0 ? "Nenhum serviço habilitado para a empresa" : undefined}
                          onClick={() => openWizard(originalIdx)}
                        >
                          {algumConfigurado ? "Editar" : "Iniciar"}
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

  const ultimaEtapa = step === etapas.length;
  const formAtual = servicoAtual ? forms[servicoAtual.key] : null;
  const testeAtual = servicoAtual ? testes[servicoAtual.key] : null;
  const podeAvancar = servicoAtual ? formCompleto(forms[servicoAtual.key]) : true;

  return (
    <div className="p-6">
      <WizardHeader
        breadcrumb={["Configurações", "Empresas", "Credenciais", empresa.razao]}
        title={servicoAtual ? `${servicoAtual.label} — Ambiente e Credenciais` : "Revisão dos Dados da Empresa"}
        onCancel={handleCancel}
        onBack={step > 1 ? () => setStep(step - 1) : undefined}
        onNext={ultimaEtapa ? handleSave : () => setStep(step + 1)}
        nextLabel={ultimaEtapa ? "Salvar" : "Avançar"}
        nextDisabled={!podeAvancar}
      />

      <div className="max-w-2xl mx-auto">
        <StepsBar steps={etapas} current={step} />

        {step === 1 && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Confirme os dados cadastrais da empresa antes de configurar o acesso aos serviços.
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
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Serviços habilitados
              </span>
              <div className="flex flex-wrap gap-2">
                {servicosAtivos.map((s) => (
                  <Badge key={s.key} variant="outline" className="text-xs border-success/50 text-success bg-success/10">
                    {s.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {servicoAtual && formAtual && testeAtual && (
          <div className="space-y-8">
            {/* Ambiente */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <span className="text-sm font-semibold text-foreground">Ambiente</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Ambiente {servicoAtual.label}<span className="text-destructive ml-0.5">*</span>
                </label>
                <Select
                  value={formAtual.ambiente}
                  onValueChange={(v) => atualizarForm(servicoAtual.key, "ambiente", v)}
                >
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
                required
                value={formAtual.clientId}
                onChange={(v) => atualizarForm(servicoAtual.key, "clientId", v)}
                placeholder="Informe o Client ID fornecido pela Receita Federal"
              />
              <InputField
                label="Client_Secret"
                required
                value={formAtual.clientSecret}
                onChange={(v) => atualizarForm(servicoAtual.key, "clientSecret", v)}
                placeholder="Informe o Client Secret fornecido pela Receita Federal"
                type="password"
              />
              <p className="text-[11px] text-muted-foreground">
                As credenciais são fornecidas pela Receita Federal {servicoAtual.origem}.
                Mantenha-as seguras e não as compartilhe.
              </p>

              {/* Testar conexão */}
              <div className="space-y-3 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={!podeAvancar || testeAtual.estado === "testando"}
                  onClick={() => testarConexao(servicoAtual.key)}
                >
                  {testeAtual.estado === "testando" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plug className="h-4 w-4" />
                  )}
                  {testeAtual.estado === "testando" ? "Testando conexão..." : "Testar conexão"}
                </Button>

                {testeAtual.estado === "ok" && (
                  <div className="flex items-center gap-2 rounded-md border border-success/50 bg-success/10 px-3 py-2 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Conexão realizada com sucesso. As credenciais estão funcionando.
                  </div>
                )}
                {testeAtual.estado === "erro" && (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {testeAtual.mensagem}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
