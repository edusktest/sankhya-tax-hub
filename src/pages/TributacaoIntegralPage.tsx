import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ChevronRight, Search, ScrollText, CheckCircle2, Calendar,
  Building2, Layers, Clock, CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 1 | 2;
type Step = 1 | 2 | 3 | 4 | 5; // 5 = tela de sucesso

interface Empresa { id: string; cod: number; nome: string; cnpj: string }
interface TopOp { id: string; cod: number; descricao: string; tipo: string }

// ─── Mock data ────────────────────────────────────────────────────────────────
const EMPRESAS: Empresa[] = [
  { id: "40",  cod: 40,  nome: "EMPRESA JR PR (N ALT)",          cnpj: "78765740000106" },
  { id: "47",  cod: 47,  nome: "EMPRESA JR RJ II (N ALT)",       cnpj: "98765432000198" },
  { id: "375", cod: 375, nome: "041 - VIAMÃO",                   cnpj: "05727583000251" },
  { id: "369", cod: 369, nome: "004 - ALVORADA",                 cnpj: "05727583000170" },
  { id: "353", cod: 353, nome: "MAILBIZ",                        cnpj: "11498408000151" },
  { id: "501", cod: 501, nome: "ATLAS SOLUTIONS BRASIL S.A.",    cnpj: "26314062000161" },
  { id: "447", cod: 447, nome: "TESTE NATUREZA 9 - NATAL",       cnpj: "58950300000111" },
  { id: "49",  cod: 49,  nome: "EMPRESA JR DF (N ALT)",          cnpj: "26314062000757" },
  { id: "805", cod: 805, nome: "ARAPOTI TESTE MARCO",            cnpj: "01820705000118" },
  { id: "45",  cod: 45,  nome: "EMPRESA JR ES (N ALT)",          cnpj: "26314062000161" },
  { id: "120", cod: 120, nome: "EMPRESA BRUNA RS (N ALT)",       cnpj: "12345678000190" },
  { id: "121", cod: 121, nome: "EMPRESA ZUMAK RC (N ALT)",       cnpj: "12345678000271" },
];

const TOPS: TopOp[] = [
  { id: "0",  cod: 0,  descricao: "<SEM TOP>",                         tipo: "P" },
  { id: "1",  cod: 1,  descricao: "ORÇAMENTO DE COMPRA - REVENDA",     tipo: "O" },
  { id: "2",  cod: 2,  descricao: "ORÇAMENTO DE COMPRA - USO/CONSUMO", tipo: "O" },
  { id: "3",  cod: 3,  descricao: "ORÇAMENTO DE COMPRA - SERVIÇO",     tipo: "O" },
  { id: "4",  cod: 4,  descricao: "DEV. VENDA - NF PROPRIA ESTORNO",   tipo: "D" },
  { id: "6",  cod: 6,  descricao: "RECLASSIFICACAO - SAÍDA",           tipo: "V" },
  { id: "9",  cod: 9,  descricao: "TESTE_RENEGOCIACAO",                tipo: "I" },
  { id: "10", cod: 10, descricao: "VENDA NF-E DIFERIMENTO",            tipo: "V" },
  { id: "14", cod: 14, descricao: "VENDA - TESTE F100",                tipo: "V" },
  { id: "21", cod: 21, descricao: "PRODUÇÃO ZUMAK",                    tipo: "F" },
  { id: "30", cod: 30, descricao: "VENDA NFC-E",                       tipo: "V" },
  { id: "44", cod: 44, descricao: "TRANSFERENCIA DE MERCADORIAS",      tipo: "T" },
];

const TOTAL_CONFIGURADAS = 58;
const TOTAL_TOPS_COBERTOS = 55;

const STEP_LABELS = ["Seleção de Empresas", "Seleção de TOP e Tributos", "Parâmetros de Configuração", "Resumo"] as const;

// ─── Component ────────────────────────────────────────────────────────────────
export default function TributacaoIntegralPage() {
  const location = useLocation();
  const [screen, setScreen] = useState<Screen>(1);
  const [step, setStep]     = useState<Step>(1);
  const [period, setPeriod] = useState<"60" | "90" | "120">("90");

  // Wizard state
  const [selEmpresas, setSelEmpresas] = useState<Set<string>>(new Set());
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [selTops, setSelTops] = useState<Set<string>>(new Set());
  const [topSearch, setTopSearch] = useState("");
  const [params, setParams] = useState({
    situacao:      "000",
    classificacao: "000001",
    aliqIBS:       "0,10",
    aliqCBS:       "0,90",
    vigencia:      "10/11/2025",
  });

  // Read BIA-guided state from location
  useEffect(() => {
    const state = location.state as {
      fromBIA?: boolean;
      step?: number;
      selAllEmpresas?: boolean;
      selTop0?: boolean;
    } | null;
    if (!state?.fromBIA) return;
    if (state.step !== undefined) {
      setScreen(2);
      setStep(state.step as Step);
    }
    if (state.selAllEmpresas) {
      setSelEmpresas(new Set(EMPRESAS.map(e => e.id)));
    }
    if (state.selTop0) {
      setSelTops(new Set(["0"]));
    }
  }, [location.state]);

  const filteredEmpresas = useMemo(
    () => EMPRESAS.filter(e =>
      `${e.cod} ${e.nome} ${e.cnpj}`.toLowerCase().includes(empresaSearch.toLowerCase())
    ),
    [empresaSearch]
  );
  const filteredTops = useMemo(
    () => TOPS.filter(t =>
      `${t.cod} ${t.descricao}`.toLowerCase().includes(topSearch.toLowerCase())
    ),
    [topSearch]
  );

  function toggle(set: Set<string>, id: string, setter: (s: Set<string>) => void) {
    const n = new Set(set);
    n.has(id) ? n.delete(id) : n.add(id);
    setter(n);
  }
  function toggleAll<T extends { id: string }>(items: T[], current: Set<string>, setter: (s: Set<string>) => void) {
    setter(current.size === items.length ? new Set() : new Set(items.map(i => i.id)));
  }

  function startWizard() {
    setSelEmpresas(new Set());
    setSelTops(new Set());
    setStep(1);
    setScreen(2);
  }

  function nextStep() { if (step < 4) setStep((step + 1) as Step); }
  function prevStep() { if (step > 1) setStep((step - 1) as Step); else setScreen(1); }
  function finish()   { setStep(5); }
  function concluir() { setScreen(1); setStep(1); }

  const canNext =
    (step === 1 && selEmpresas.size > 0) ||
    (step === 2 && selTops.size > 0) ||
    step === 3 ||
    step === 4;

  // ── Screen 1 — Dashboard ──────────────────────────────────────────────────
  const screen1 = (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">Tributação Integral - IBS/CBS</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Configure a tributação integral padrão de IBS/CBS por empresa e tipo de operação.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5" onClick={startWizard}>
            <ChevronRight className="h-3.5 w-3.5" />
            Iniciar configuração
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ScrollText className="h-3.5 w-3.5" />
            Visualizar Logs
          </Button>
        </div>
      </div>

      <SectionCard>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-foreground">Período de análise</p>
          <div className="flex flex-col items-end gap-1">
            <SyncBadge label="Tabela CFF"  date="12/05/2026" nextSync="13/05/2026 às 02:00" />
            <SyncBadge label="Análise DFe" date="12/05/2026" nextSync="13/05/2026 às 04:00" />
          </div>
        </div>

        <div className="flex gap-2 mb-1.5">
          {(["60", "90", "120"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-colors",
                period === p
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
              )}
            >
              {p} dias{period === p ? " ✓" : ""}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">
          Analisando empresas e tipos de operação com movimento no período: NF-e · NFC-e · CT-e · NFS-e
        </p>

        <div className="flex gap-3">
          <MetricCard
            icon={<Building2 className="h-4 w-4 text-primary" />}
            label="Empresas elegíveis"
            value={String(EMPRESAS.length)}
            sub="com movimento no período"
            variant="primary"
          />
          <MetricCard
            icon={<CheckCircle2 className="h-4 w-4 text-success" />}
            label="Empresas configuradas"
            value={String(TOTAL_CONFIGURADAS)}
            sub="com tributação integral"
            variant="success"
          />
          <MetricCard
            icon={<Clock className="h-4 w-4 text-warning" />}
            label="Aguardando configuração"
            value="3"
            sub="sem parametrização"
            variant="warning"
            highlighted
          />
          <MetricCard
            icon={<Layers className="h-4 w-4 text-muted-foreground" />}
            label="TOPs cobertos"
            value={String(TOTAL_TOPS_COBERTOS)}
            sub={`últimos ${period} dias`}
            variant="muted"
          />
        </div>
      </SectionCard>
    </div>
  );

  // ── Screen 2 — Wizard ─────────────────────────────────────────────────────
  const screen2 = (
    <div className="space-y-4">
      <SectionCard>

        {/* Etapa 1 — Empresas */}
        {step === 1 && (
          <Section subtitle="Selecione as empresas que deseja vincular as alíquotas">
            <SearchBar value={empresaSearch} onChange={setEmpresaSearch} placeholder="Buscar empresa..." />
            <div className="mt-3 border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        checked={filteredEmpresas.length > 0 && selEmpresas.size === filteredEmpresas.length}
                        onCheckedChange={() => toggleAll(filteredEmpresas, selEmpresas, setSelEmpresas)}
                      />
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">Cod. Emp.</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">Nome Fantasia</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">CNPJ/CPF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmpresas.map(e => {
                    const checked = selEmpresas.has(e.id);
                    return (
                      <TableRow
                        key={e.id}
                        className={cn("cursor-pointer transition-colors", checked ? "bg-success/10 hover:bg-success/15" : "hover:bg-muted/30")}
                        onClick={() => toggle(selEmpresas, e.id, setSelEmpresas)}
                      >
                        <TableCell className="pl-4">
                          <Checkbox checked={checked} onCheckedChange={() => toggle(selEmpresas, e.id, setSelEmpresas)} />
                        </TableCell>
                        <TableCell className="text-[12px] text-foreground">{e.cod}</TableCell>
                        <TableCell className="text-[12px] text-foreground">{e.nome}</TableCell>
                        <TableCell className="font-mono text-[12px] text-foreground">{e.cnpj}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              {selEmpresas.size} de {EMPRESAS.length} selecionada(s)
            </div>
          </Section>
        )}

        {/* Etapa 2 — TOPs */}
        {step === 2 && (
          <Section subtitle="Selecione os Tipos de Operação">
            <SearchBar value={topSearch} onChange={setTopSearch} placeholder="Buscar TOP..." />
            <div className="mt-3 border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        checked={filteredTops.length > 0 && selTops.size === filteredTops.length}
                        onCheckedChange={() => toggleAll(filteredTops, selTops, setSelTops)}
                      />
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">Cód. Tipo Op.</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">Descrição</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">Tipo de Movimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTops.map(t => {
                    const checked = selTops.has(t.id);
                    return (
                      <TableRow
                        key={t.id}
                        className={cn("cursor-pointer transition-colors", checked ? "bg-success/10 hover:bg-success/15" : "hover:bg-muted/30")}
                        onClick={() => toggle(selTops, t.id, setSelTops)}
                      >
                        <TableCell className="pl-4">
                          <Checkbox checked={checked} onCheckedChange={() => toggle(selTops, t.id, setSelTops)} />
                        </TableCell>
                        <TableCell className="text-[12px] text-foreground">{t.cod}</TableCell>
                        <TableCell className="text-[12px] text-foreground">{t.descricao}</TableCell>
                        <TableCell className="font-mono text-[12px] text-foreground">{t.tipo}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              {selTops.size} de {TOPS.length} selecionado(s)
            </div>
          </Section>
        )}

        {/* Etapa 3 — Parâmetros */}
        {step === 3 && (
          <Section subtitle="Modifique os parâmetros de tributação">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
              <ParamField label="Código de Situação Tributária" value={params.situacao}
                onChange={v => setParams(p => ({ ...p, situacao: v }))} />
              <ParamField label="Código de Classificação Tributária" value={params.classificacao}
                onChange={v => setParams(p => ({ ...p, classificacao: v }))} />
              <ParamField label="Alíquota IBS:" value={params.aliqIBS}
                onChange={v => setParams(p => ({ ...p, aliqIBS: v }))} />
              <ParamField label="Alíquota CBS:" value={params.aliqCBS}
                onChange={v => setParams(p => ({ ...p, aliqCBS: v }))} />
              <ParamField label="Data de Vigência:" value={params.vigencia} icon={<Calendar className="h-3.5 w-3.5" />}
                onChange={v => setParams(p => ({ ...p, vigencia: v }))} />
            </div>
          </Section>
        )}

        {/* Etapa 4 — Resumo */}
        {step === 4 && (
          <Section title="Resumo do Cadastro" subtitle="Revise as informações antes de finalizar a configuração">
            <div className="space-y-5 mt-3">
              <div>
                <h3 className="text-[14px] font-semibold text-primary mb-1">
                  Empresas Selecionadas ({selEmpresas.size})
                </h3>
                <p className="text-[12px] text-foreground leading-relaxed">
                  {EMPRESAS.filter(e => selEmpresas.has(e.id)).map(e => e.nome).join(", ") || "—"}
                </p>
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-primary mb-1">
                  Tipos de Operação Selecionados
                </h3>
                <p className="text-[12px] text-foreground leading-relaxed">
                  <span className="text-muted-foreground">Tipos de Operação:</span>{" "}
                  {TOPS.filter(t => selTops.has(t.id)).map(t => t.descricao).join(", ") || "—"}
                </p>
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-primary mb-2">Parâmetros</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <ResumoField label="Situação Tributária"      value={params.situacao} />
                  <ResumoField label="Classificação Tributária" value={params.classificacao} />
                  <ResumoField label="Alíquota IBS"             value={params.aliqIBS} />
                  <ResumoField label="Alíquota CBS"             value={params.aliqCBS} />
                  <ResumoField label="Data de Vigência"         value={params.vigencia} />
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Etapa 5 — Sucesso */}
        {step === 5 && (
          <div className="space-y-5">
            {/* Success visual */}
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-success" />
              </div>
              <div className="text-center">
                <h2 className="text-[20px] font-bold text-foreground">Configuração realizada com sucesso!</h2>
                <p className="text-[13px] text-muted-foreground mt-1">
                  {selEmpresas.size} empresa{selEmpresas.size !== 1 ? "s" : ""} e {selTops.size} TOP{selTops.size !== 1 ? "s" : ""}{" "}
                  configurado{selTops.size !== 1 ? "s" : ""} em{" "}
                  {new Date().toLocaleDateString("pt-BR")} às{" "}
                  {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.
                </p>
              </div>
            </div>

            {/* Summary table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {["Empresa", "CNPJ", "TOPs", "Status"].map(h => (
                      <TableHead key={h} className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:pl-5">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EMPRESAS.filter(e => selEmpresas.has(e.id)).map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="pl-5 text-[12px] font-semibold text-foreground">{e.nome}</TableCell>
                      <TableCell className="font-mono text-[12px] text-foreground">{e.cnpj}</TableCell>
                      <TableCell className="text-[12px] text-foreground">
                        {TOPS.filter(t => selTops.has(t.id)).map(t => t.cod).join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-success text-white">
                          ✅ Configurado
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

          </div>
        )}

      </SectionCard>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full p-6 bg-background">
      <div className="max-w-4xl mx-auto">

        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-background border-b -mx-6 -mt-6 px-6 py-3 mb-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2 flex-wrap">
            <span>Configurações</span>
            <ChevronRight className="h-3 w-3" />
            <span>Assistentes</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Tributação Integral - IBS/CBS</span>
          </div>

          {/* Wizard controls — etapas 1-4 */}
          {screen === 2 && step < 5 && (
            <>
              <div className="flex items-center justify-between gap-4 mb-3">
                <h1 className="text-[16px] font-semibold text-foreground leading-tight">
                  Configuração da tributação integral do IBS/CBS
                </h1>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setScreen(1)}>
                    Cancelar
                  </Button>
                  {step > 1 && (
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={prevStep}>
                      Voltar
                    </Button>
                  )}
                  {step < 4 ? (
                    <Button size="sm" disabled={!canNext} onClick={nextStep}>
                      Próximo
                    </Button>
                  ) : (
                    <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white" onClick={finish}>
                      Finalizar
                    </Button>
                  )}
                </div>
              </div>
              <WizardProgress step={step} />
            </>
          )}

          {/* Header etapa 5 — sucesso */}
          {screen === 2 && step === 5 && (
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-[16px] font-semibold text-foreground leading-tight">
                Configuração da tributação integral do IBS/CBS
              </h1>
              <Button onClick={concluir} className="bg-emerald-700 hover:bg-emerald-800 text-white shrink-0">
                Concluir
              </Button>
            </div>
          )}
        </div>

        {screen === 1 ? screen1 : screen2}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card rounded-lg p-5 border border-border card-shadow", className)}>
      {children}
    </div>
  );
}

function WizardProgress({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEP_LABELS.map((label, idx) => {
        const n      = (idx + 1) as Step;
        const active = n === step;
        const done   = n < step;
        const last   = idx === STEP_LABELS.length - 1;
        return (
          <div key={n} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition-colors",
                done   ? "bg-success border-success text-success-foreground"
                : active ? "bg-primary border-primary text-primary-foreground"
                :          "bg-card border-border text-muted-foreground"
              )}>
                {done ? <CheckCheck className="h-4 w-4" /> : n}
              </div>
              <span className={cn(
                "text-[10px] font-medium mt-1 whitespace-nowrap",
                active ? "text-primary" : done ? "text-success" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </div>
            {!last && (
              <div className={cn("flex-1 h-0.5 mx-1 mb-4", done ? "bg-success" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, subtitle, children }: { title?: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      {title && <p className="text-[13px] font-semibold text-foreground">{title}</p>}
      <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="pl-8 h-8 text-[12px]" />
    </div>
  );
}

function ParamField({ label, value, onChange, icon }: { label: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode }) {
  return (
    <div className="border rounded-lg px-3 py-2 bg-card">
      <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
        {icon}{label}
      </Label>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border-0 px-0 h-7 text-[13px] font-medium text-foreground focus-visible:ring-0 shadow-none"
      />
    </div>
  );
}

function ResumoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md px-3 py-2 bg-muted/30">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-[13px] font-semibold text-foreground font-mono">{value}</p>
    </div>
  );
}

function SyncBadge({ label, date, nextSync }: { label: string; date: string; nextSync: string }) {
  return (
    <div className="relative group inline-flex">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 cursor-default dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
        ✓ {label}: {date}
      </span>
      <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block z-20">
        <div className="bg-popover text-popover-foreground text-[11px] px-2.5 py-1.5 rounded-md shadow-md border border-border whitespace-nowrap">
          Próxima sincronização: {nextSync}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, variant, highlighted }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  variant: "primary" | "success" | "warning" | "muted";
  highlighted?: boolean;
}) {
  const map = {
    primary: { value: "text-primary",    bg: "bg-primary/10" },
    success: { value: "text-success",    bg: "bg-success/10" },
    warning: { value: "text-warning",    bg: "bg-warning/10" },
    muted:   { value: "text-foreground", bg: "bg-muted"      },
  };
  const { value: valCls, bg } = map[variant];
  return (
    <div className={cn(
      "rounded-lg p-4 flex-1 border transition-shadow",
      highlighted ? "bg-warning/5 border-warning/50" : "bg-background border-border"
    )}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-[12px] font-medium text-muted-foreground leading-tight">{label}</span>
        <div className={cn("rounded-full p-1.5", bg)}>{icon}</div>
      </div>
      <p className={cn("text-2xl font-bold", valCls)}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
