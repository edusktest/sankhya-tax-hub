import { useMemo, useState } from "react";
import {
  ChevronRight, Search, Plus, ScrollText, CheckCircle2, Calendar,
  Building2, Layers, Clock, DollarSign,
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
type View = "list" | "wizard";
type Step = 1 | 2 | 3 | 4; // 1: Empresas · 2: TOPs · 3: Parâmetros · 4: Resumo

interface Empresa { id: string; cod: number; nome: string; cnpj: string }
interface TopOp { id: string; cod: number; descricao: string; tipo: string }
interface ConfigLog {
  id: string; data: string; usuario: string; empresas: number; tops: number;
  vigencia: string; status: "Concluído" | "Em processamento";
}

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
  { id: "0",  cod: 0,  descricao: "<SEM TOP>",                    tipo: "P" },
  { id: "1",  cod: 1,  descricao: "ORÇAMENTO DE COMPRA - REVENDA",tipo: "O" },
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

const CONFIG_LOG: ConfigLog[] = [
  { id: "INT-2026-00128", data: "20/05/2026 09:42", usuario: "ana.silva",    empresas: 12, tops: 8,  vigencia: "01/06/2026", status: "Concluído" },
  { id: "INT-2026-00125", data: "15/05/2026 14:10", usuario: "joao.santos",  empresas:  4, tops: 22, vigencia: "01/05/2026", status: "Concluído" },
  { id: "INT-2026-00118", data: "08/05/2026 11:25", usuario: "maria.lima",   empresas: 30, tops: 6,  vigencia: "01/05/2026", status: "Concluído" },
  { id: "INT-2026-00112", data: "02/05/2026 16:08", usuario: "pedro.alves",  empresas:  9, tops: 14, vigencia: "01/05/2026", status: "Concluído" },
  { id: "INT-2026-00104", data: "25/04/2026 10:30", usuario: "carlos.souza", empresas:  3, tops:  5, vigencia: "01/05/2026", status: "Concluído" },
];

const STEP_LABELS = ["Seleção de Empresas", "Seleção de TOP e Tributos", "Parâmetros de Configuração", "Resumo"] as const;

// ─── Component ────────────────────────────────────────────────────────────────
export default function TributacaoIntegralPage() {
  const [view, setView] = useState<View>("list");
  const [step, setStep] = useState<Step>(1);

  // Filtros listagem
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<"60" | "90" | "120">("90");

  // Wizard state
  const [selEmpresas, setSelEmpresas] = useState<Set<string>>(new Set());
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [selTops, setSelTops] = useState<Set<string>>(new Set());
  const [topSearch, setTopSearch] = useState("");
  const [params, setParams] = useState({
    situacao: "000",
    classificacao: "000001",
    aliqIBS: "0,10",
    aliqCBS: "0,90",
    vigencia: "10/11/2025",
  });

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
  const filteredLog = useMemo(
    () => CONFIG_LOG.filter(l =>
      `${l.id} ${l.usuario} ${l.vigencia}`.toLowerCase().includes(search.toLowerCase())
    ),
    [search]
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
    setView("wizard");
  }

  function nextStep() { if (step < 4) setStep((step + 1) as Step); }
  function prevStep() { if (step > 1) setStep((step - 1) as Step); else setView("list"); }
  function finish() { setView("list"); }

  const canNext =
    (step === 1 && selEmpresas.size > 0) ||
    (step === 2 && selTops.size > 0) ||
    step === 3 ||
    step === 4;

  // ── Listagem ────────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <span>Configurações</span>
          <ChevronRight className="h-3 w-3" />
          <span>Assistentes</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Tributação Integral - IBS/CBS</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-foreground">
              Tributação Integral - IBS/CBS
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Configure a tributação integral padrão de IBS/CBS por empresa e tipo de operação.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5" onClick={startWizard}>
              <Plus className="h-3.5 w-3.5" />
              Iniciar configuração
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ScrollText className="h-3.5 w-3.5" />
              Visualizar Logs
            </Button>
          </div>
        </div>

        {/* Período de análise */}
        <div className="bg-card rounded-lg p-5 border border-border card-shadow">
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
              value={String(CONFIG_LOG.reduce((a, c) => a + c.empresas, 0))}
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
              value={String(CONFIG_LOG.reduce((a, c) => a + c.tops, 0))}
              sub={`últimos ${period} dias`}
              variant="muted"
            />
          </div>
        </div>

        {/* Filtros */}

        <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/40 rounded-lg border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por ID, usuário ou vigência..."
              className="pl-8 h-8 text-[12px]"
            />
          </div>
          <span className="text-[11px] text-muted-foreground ml-auto">
            {filteredLog.length} configuraç{filteredLog.length === 1 ? "ão" : "ões"}
          </span>
        </div>

        {/* Tabela de configurações existentes */}
        <div className="bg-card rounded-lg border card-shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {["ID Configuração", "Data/Hora", "Usuário", "Empresas", "TOPs", "Início Vigência", "Status"].map(h => (
                  <TableHead key={h} className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLog.map(l => (
                <TableRow key={l.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-[12px] font-semibold text-foreground">{l.id}</TableCell>
                  <TableCell className="font-mono text-[12px] text-foreground">{l.data}</TableCell>
                  <TableCell className="text-[12px] text-foreground">{l.usuario}</TableCell>
                  <TableCell className="text-[12px] text-foreground">{l.empresas}</TableCell>
                  <TableCell className="text-[12px] text-foreground">{l.tops}</TableCell>
                  <TableCell className="font-mono text-[12px] text-foreground">{l.vigencia}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {l.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLog.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[12px] text-muted-foreground py-10">
                    Nenhuma configuração encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // ── Wizard ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header wizard */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1 flex-wrap">
            <span>Configuração da tributação integral do IBS/CBS</span>
            {step >= 2 && (<><ChevronRight className="h-3 w-3" /><span>{STEP_LABELS[0]}</span></>)}
            {step >= 3 && (<><ChevronRight className="h-3 w-3" /><span>{STEP_LABELS[1]}</span></>)}
            {step === 4 && (<><ChevronRight className="h-3 w-3" /><span>{STEP_LABELS[2]}</span></>)}
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{STEP_LABELS[step - 1]}</span>
          </div>
          <h1 className="text-[20px] font-semibold text-foreground leading-tight">
            Configuração da tributação integral do IBS/CBS
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <Button variant="outline" size="sm" onClick={() => setView("list")}>Cancelar</Button>
          {step > 1 && (
            <Button variant="outline" size="sm" onClick={prevStep}>Voltar</Button>
          )}
          {step < 4 ? (
            <Button
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={!canNext}
              onClick={nextStep}
            >
              Próximo
            </Button>
          ) : (
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white" onClick={finish}>
              Finalizar
            </Button>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <WizardSteps current={step} />

      {/* Step content */}
      <div className="bg-card rounded-lg border card-shadow p-5">
        {step === 1 && (
          <Section title={`Etapa 1 de 3`} subtitle="Selecione as empresas que deseja vincular as alíquotas">
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

        {step === 2 && (
          <Section title="Etapa 2 de 3" subtitle="Selecione os Tipos de Operação">
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

        {step === 3 && (
          <Section title="Etapa 3 de 3" subtitle="Modifique os parâmetros de tributação">
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
                  Tipos de Operação e Tributos Selecionados
                </h3>
                <p className="text-[12px] text-foreground leading-relaxed">
                  <span className="text-muted-foreground">Tipos de Operação:</span>{" "}
                  {TOPS.filter(t => selTops.has(t.id)).map(t => t.descricao).join(", ") || "—"}
                </p>
              </div>

              <div>
                <h3 className="text-[14px] font-semibold text-primary mb-2">Parâmetros</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <ResumoField label="Situação Tributária" value={params.situacao} />
                  <ResumoField label="Classificação Tributária" value={params.classificacao} />
                  <ResumoField label="Alíquota IBS" value={params.aliqIBS} />
                  <ResumoField label="Alíquota CBS" value={params.aliqCBS} />
                  <ResumoField label="Data de Vigência" value={params.vigencia} />
                </div>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function WizardSteps({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2">
      {STEP_LABELS.map((label, i) => {
        const n = (i + 1) as Step;
        const active = n === current;
        const done = n < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors",
                active && "bg-primary text-primary-foreground border-primary",
                done && "bg-success/10 text-success border-success/40",
                !active && !done && "bg-card text-muted-foreground border-border"
              )}
            >
              <span
                className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold",
                  active && "bg-primary-foreground/20",
                  done && "bg-success/20",
                  !active && !done && "bg-muted"
                )}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
              </span>
              {label}
            </div>
            {i < STEP_LABELS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-foreground">{title}</p>
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
