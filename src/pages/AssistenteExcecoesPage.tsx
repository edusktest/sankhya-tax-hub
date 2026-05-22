import { useState, useMemo } from "react";
import {
  CheckCircle2, AlertTriangle, Clock, DollarSign, ChevronRight, ChevronDown,
  Search, ArrowUpDown, Sparkles, Info, Pencil, RotateCcw, CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen    = 1 | 2 | 3 | 4 | 5;
type WizardStep = 1 | 2 | 3 | 4;
type Period    = "60" | "90" | "120";
type SortKey   = "ncm" | "descricao" | "volume" | "docs" | "status";
type SortDir   = "asc" | "desc";
type StatusFilter = "todos" | "sem" | "parcial" | "configurado";

interface NcmRow {
  id: string; ncm: string; descricao: string; volume: number; docs: number;
  status: "sem" | "parcial" | "configurado";
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const PERIOD_METRICS: Record<Period, { elegiveis: number; configurados: number; aguardando: number; volume: string }> = {
  "60":  { elegiveis: 31, configurados: 8,  aguardando: 23, volume: "R$ 11,2M" },
  "90":  { elegiveis: 47, configurados: 12, aguardando: 35, volume: "R$ 18,4M" },
  "120": { elegiveis: 58, configurados: 15, aguardando: 43, volume: "R$ 24,7M" },
};

const TABLE_ROWS: NcmRow[] = [
  { id: "1", ncm: "8471.30.19", descricao: "Computadores portáteis",    volume: 3240000, docs: 1847, status: "sem"         },
  { id: "2", ncm: "3004.90.69", descricao: "Medicamentos - uso humano", volume: 2180000, docs: 943,  status: "sem"         },
  { id: "3", ncm: "2710.12.59", descricao: "Gasolina automotiva",       volume: 1920000, docs: 2341, status: "parcial"     },
  { id: "4", ncm: "8528.72.20", descricao: "Televisores",               volume: 1650000, docs: 782,  status: "sem"         },
  { id: "5", ncm: "0201.30.00", descricao: "Carnes bovinas",            volume: 1430000, docs: 3102, status: "configurado" },
  { id: "6", ncm: "3002.15.90", descricao: "Vacinas - uso humano",      volume: 980000,  docs: 421,  status: "sem"         },
  { id: "7", ncm: "8517.12.31", descricao: "Telefones celulares",       volume: 870000,  docs: 1203, status: "parcial"     },
  { id: "8", ncm: "2204.21.00", descricao: "Vinhos de uvas frescas",    volume: 640000,  docs: 589,  status: "sem"         },
];

const WIZARD_ITEMS = [
  { ncm: "8471.30.19", desc: "Computadores portáteis",  vol: "R$ 3,24M", docs: "1.847 docs", sugestao: "025 — Alíquota Reduzida IBS/CBS" },
  { ncm: "3004.90.69", desc: "Medicamentos uso humano", vol: "R$ 2,18M", docs: "943 docs",   sugestao: "031 — Isento CBS / Reduzido IBS"  },
  { ncm: "8528.72.20", desc: "Televisores",             vol: "R$ 1,65M", docs: "782 docs",   sugestao: "025 — Alíquota Reduzida IBS/CBS" },
];

const EMPRESAS_INIT = [
  { id: "a", nome: "Empresa A Comércio Ltda",      cnpj: "12.345.678/0001-00", docs: "248 docs no período",   checked: true  },
  { id: "b", nome: "Empresa B Distribuidora S.A.", cnpj: "12.345.678/0002-11", docs: "1.421 docs no período", checked: true  },
  { id: "c", nome: "Empresa C Filial SP",          cnpj: "12.345.678/0003-22", docs: "178 docs no período",   checked: false },
];

const TOPS_LIST = [
  { id: "1",  label: "Venda"               },
  { id: "2",  label: "Devolução de venda"  },
  { id: "3",  label: "Remessa"             },
  { id: "4",  label: "Retorno"             },
  { id: "5",  label: "Simples faturamento" },
  { id: "6",  label: "Compra"              },
  { id: "7",  label: "Devolução de compra" },
  { id: "8",  label: "Transferência"       },
  { id: "9",  label: "Exportação"          },
  { id: "10", label: "Importação"          },
];

const FINALIDADES_LIST = [
  { id: "1", label: "Uso e Consumo"     },
  { id: "2", label: "Ativo Imobilizado" },
  { id: "3", label: "Industrialização"  },
  { id: "4", label: "Conserto"          },
  { id: "5", label: "Revenda"           },
  { id: "6", label: "Serviço"           },
];

const GRUPOS_PARCEIROS_LIST = [
  { id: "001", label: "Entidades sem Fins Lucrativos e Vulnerabilidade Social"          },
  { id: "002", label: "Setor Público e Infraestrutura"                                  },
  { id: "003", label: "Cadeia de Saúde, Educação e Inovação"                            },
  { id: "004", label: "Produção Primária e Agronegócio"                                 },
  { id: "005", label: "Consumidores Finais Pessoa Física (Regime Geral vs. Protegido)"  },
  { id: "006", label: "Grandes Contribuintes e Multinacionais"                          },
  { id: "007", label: "Micro e Pequenas Empresas (Simples Nacional)"                    },
  { id: "008", label: "Exportadores e Comércio Exterior"                                },
];

const WIZARD_STEP_LABELS = ["NCM/NBS", "Empresa", "Tipo de Operação", "Parceiro"] as const;

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
function fmtNum(v: number) { return v.toLocaleString("pt-BR"); }

// ─── MetricCard ───────────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, sub, variant }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  variant: "primary" | "success" | "warning" | "muted";
}) {
  const map = {
    primary: { value: "text-primary",     bg: "bg-primary/10"     },
    success: { value: "text-success",     bg: "bg-success/10"     },
    warning: { value: "text-warning",     bg: "bg-warning/10"     },
    muted:   { value: "text-foreground",  bg: "bg-muted"          },
  };
  const { value: valCls, bg } = map[variant];
  return (
    <div className="bg-card rounded-lg p-4 flex-1 card-shadow border border-border">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[12px] font-medium text-muted-foreground leading-tight">{label}</span>
        <div className={cn("rounded-full p-1.5", bg)}>{icon}</div>
      </div>
      <p className={cn("text-2xl font-bold", valCls)}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: NcmRow["status"] }) {
  if (status === "sem")     return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">🔴 Sem exceção</span>;
  if (status === "parcial") return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-warning/10 text-warning">🟡 Exc. parcial</span>;
  return                           <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">✅ Configurado</span>;
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card rounded-lg p-5 border border-border card-shadow", className)}>
      {children}
    </div>
  );
}

// ─── WizardProgress ──────────────────────────────────────────────────────────
function WizardProgress({ step }: { step: WizardStep }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {WIZARD_STEP_LABELS.map((label, idx) => {
        const n      = (idx + 1) as WizardStep;
        const active = n === step;
        const done   = n < step;
        const last   = idx === WIZARD_STEP_LABELS.length - 1;
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
              <span className={cn("text-[10px] font-medium mt-1 whitespace-nowrap",
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

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("w-9 h-5 rounded-full transition-colors flex-shrink-0 relative",
          checked ? "bg-primary" : "bg-muted-foreground/30")}
      >
        <span className={cn("absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform",
          checked ? "translate-x-4 left-0.5" : "translate-x-0 left-0.5")} />
      </button>
      <span className="text-[12px] font-medium text-foreground cursor-pointer" onClick={() => onChange(!checked)}>
        {label}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AssistenteExcecoesPage() {
  const [screen, setScreen]             = useState<Screen>(1);
  const [wizardStep, setWizardStep]     = useState<WizardStep>(1);
  const [period, setPeriod]             = useState<Period>("90");
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [sortKey, setSortKey]           = useState<SortKey>("volume");
  const [sortDir, setSortDir]           = useState<SortDir>("desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [search, setSearch]             = useState("");
  const [showUndo, setShowUndo]         = useState(false);
  const [logOpen, setLogOpen]           = useState(false);
  const [partnerOpt, setPartnerOpt]               = useState<"all" | "specific" | "group">("all");
  const [topOpt, setTopOpt]                       = useState<"all" | "specific" | "finalidade">("all");
  const [topSearch, setTopSearch]                 = useState("");
  const [finalidadeSearch, setFinalidadeSearch]   = useState("");
  const [selectedTops, setSelectedTops]           = useState<Set<string>>(new Set());
  const [selectedFinalidades, setSelectedFinalidades] = useState<Set<string>>(new Set());
  const [grupoSearch, setGrupoSearch]               = useState("");
  const [selectedGrupos, setSelectedGrupos]         = useState<Set<string>>(new Set());
  const [empresas, setEmpresas]                   = useState(EMPRESAS_INIT);
  const [allEmpresas, setAllEmpresas]             = useState(false);

  const metrics = PERIOD_METRICS[period];

  const filteredRows = useMemo(() => {
    let rows = [...TABLE_ROWS];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.ncm.includes(q) || r.descricao.toLowerCase().includes(q));
    }
    if (statusFilter !== "todos") rows = rows.filter(r => r.status === statusFilter);
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "ncm")       cmp = a.ncm.localeCompare(b.ncm);
      if (sortKey === "descricao") cmp = a.descricao.localeCompare(b.descricao);
      if (sortKey === "volume")    cmp = a.volume - b.volume;
      if (sortKey === "docs")      cmp = a.docs - b.docs;
      if (sortKey === "status")    cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [search, statusFilter, sortKey, sortDir]);

  const filteredTops = useMemo(() => {
    if (!topSearch.trim()) return TOPS_LIST;
    const q = topSearch.toLowerCase();
    return TOPS_LIST.filter(t => t.label.toLowerCase().includes(q) || t.id.includes(q));
  }, [topSearch]);

  const filteredFinalidades = useMemo(() => {
    if (!finalidadeSearch.trim()) return FINALIDADES_LIST;
    const q = finalidadeSearch.toLowerCase();
    return FINALIDADES_LIST.filter(f => f.label.toLowerCase().includes(q) || f.id.includes(q));
  }, [finalidadeSearch]);

  const filteredGrupos = useMemo(() => {
    if (!grupoSearch.trim()) return GRUPOS_PARCEIROS_LIST;
    const q = grupoSearch.toLowerCase();
    return GRUPOS_PARCEIROS_LIST.filter(g => g.label.toLowerCase().includes(q) || g.id.includes(q));
  }, [grupoSearch]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function toggleRow(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected(selected.size === filteredRows.length ? new Set() : new Set(filteredRows.map(r => r.id)));
  }
  const allChecked = filteredRows.length > 0 && selected.size === filteredRows.length;

  function toggleEmpresa(id: string) {
    setEmpresas(prev => prev.map(e => e.id === id ? { ...e, checked: !e.checked } : e));
  }
  function handleAllEmpresas(v: boolean) {
    setAllEmpresas(v);
    setEmpresas(prev => prev.map(e => ({ ...e, checked: v })));
  }
  // ── Screen 1 ─────────────────────────────────────────────────────────────────
  const screen1 = (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-foreground">Exceções da Tributação Integral - IBS/CBS</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Configure as exceções tributárias da Reforma com base no seu histórico real de operações.
        </p>
      </div>

      <div className="rounded-lg px-4 py-2.5 flex items-center gap-2 text-[12px] font-medium bg-accent border border-primary/30 text-accent-foreground">
        <span>⚠️</span>
        <span>Tabelas CFF atualizadas em 12/05/2026 · Próxima sincronização: 13/05/2026 às 02:00</span>
      </div>

      <div className="flex gap-4">
        <MetricCard icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
          label="NCMs/NBS elegíveis identificados" value={String(metrics.elegiveis)}
          sub="no período selecionado" variant="primary" />
        <MetricCard icon={<CheckCircle2 className="h-4 w-4 text-success" />}
          label="Já configurados" value={String(metrics.configurados)}
          sub="com exceção IBS/CBS" variant="success" />
        <MetricCard icon={<Clock className="h-4 w-4 text-warning" />}
          label="Aguardando configuração" value={String(metrics.aguardando)}
          sub="sem exceção parametrizada" variant="warning" />
        <MetricCard icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          label="Volume total no período" value={metrics.volume}
          sub="últimos 90 dias" variant="muted" />
      </div>

      <SectionCard>
        <p className="text-[13px] font-semibold text-foreground mb-3">Período de análise</p>
        <div className="flex gap-2 mb-3">
          {(["60", "90", "120"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
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
        <p className="text-[11px] text-muted-foreground">
          Analisando documentos fiscais: NF-e · NFC-e · CT-e · CT-eOS · NFS-e · NF-Com
        </p>
      </SectionCard>

      <button onClick={() => setScreen(2)}
        className="w-full py-3.5 rounded-lg text-[14px] font-bold bg-primary text-primary-foreground flex items-center justify-center gap-2 transition-opacity hover:opacity-90">
        Iniciar Configuração Guiada <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  // ── Screen 2 ─────────────────────────────────────────────────────────────────
  const screen2 = (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-bold text-foreground">Diagnóstico — NCMs/NBS que precisam de atenção</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Lista baseada no seu histórico de vendas (últimos 90 dias), filtrada pelas tabelas de Anexos do Portal da Conformidade Fácil.
        </p>
      </div>

      <div className="flex items-center justify-between pb-4 border-b border-border">
        <span className="text-[12px] text-muted-foreground">{selected.size} item(s) selecionado(s)</span>
        <button
          disabled={selected.size === 0}
          onClick={() => { if (selected.size > 0) setScreen(3); }}
          className="px-5 py-2 rounded-lg text-[13px] font-bold bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30">
          Configurar selecionados ({selected.size})
        </button>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por NCM, NBS ou descrição..." className="pl-8 text-[12px] h-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="h-9 rounded-md border border-input bg-card px-3 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer">
          <option value="todos">Todos os status</option>
          <option value="sem">Sem exceção</option>
          <option value="parcial">Exc. parcial</option>
          <option value="configurado">Configurado</option>
        </select>
        <select
          value={`${sortKey}_${sortDir}`}
          onChange={e => { const [k, d] = e.target.value.split("_"); setSortKey(k as SortKey); setSortDir(d as SortDir); }}
          className="h-9 rounded-md border border-input bg-card px-3 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer">
          <option value="volume_desc">Ordenar: Volume ↓</option>
          <option value="volume_asc">Volume ↑</option>
          <option value="docs_desc">Qtd. Docs ↓</option>
          <option value="ncm_asc">NCM A-Z</option>
        </select>
      </div>

      <div className="bg-card rounded-lg overflow-hidden border border-border card-shadow">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10 pl-4">
                <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
              </TableHead>
              {([
                { key: "ncm"      , label: "NCM/NBS"     },
                { key: "descricao", label: "Descrição"   },
                { key: "volume"   , label: "Volume (R$)" },
                { key: "docs"     , label: "Qtd. Docs"   },
                { key: "status"   , label: "Status"      },
              ] as { key: SortKey; label: string }[]).map(col => (
                <TableHead key={col.key}
                  className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort(col.key)}>
                  <div className="flex items-center gap-1">
                    {col.label}<ArrowUpDown className="h-3 w-3 opacity-40" />
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map(row => (
              <TableRow key={row.id} className={cn("hover:bg-muted/30 transition-colors", selected.has(row.id) && "bg-primary/5")}>
                <TableCell className="pl-4">
                  <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggleRow(row.id)} />
                </TableCell>
                <TableCell className="font-mono text-[12px] font-semibold text-foreground">{row.ncm}</TableCell>
                <TableCell className="text-[12px] text-foreground">{row.descricao}</TableCell>
                <TableCell className="text-[12px] font-medium text-foreground">{fmtBRL(row.volume)}</TableCell>
                <TableCell className="text-[12px] text-muted-foreground">{fmtNum(row.docs)}</TableCell>
                <TableCell><StatusBadge status={row.status} /></TableCell>
                <TableCell>
                  {row.status === "configurado"
                    ? <button onClick={() => setScreen(3)} className="text-[11px] font-semibold px-3 py-1 rounded border border-border text-muted-foreground hover:bg-muted transition-colors">Revisar</button>
                    : <button onClick={() => setScreen(3)} className="text-[11px] font-semibold px-3 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity">Configurar</button>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

    </div>
  );

  // ── Screen 3 ─────────────────────────────────────────────────────────────────
  function wizardContent() {
    if (wizardStep === 1) return (
      <div className="space-y-4">
        <h2 className="text-[16px] font-bold text-foreground">Confirme os NCMs/NBS para configuração</h2>
        <div className="space-y-3">
          {WIZARD_ITEMS.map(item => (
            <div key={item.ncm} className="border border-border rounded-lg p-4 flex items-start gap-3">
              <Checkbox defaultChecked className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[13px] font-bold text-foreground">{item.ncm}</span>
                    <span className="text-[13px] text-foreground ml-2">— {item.desc}</span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full whitespace-nowrap">
                    {item.vol} · {item.docs}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  cClassTrib atual: <span className="font-medium">Não configurado</span>
                </p>
                <p className="text-[11px] mt-0.5 text-success flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  cClassTrib sugerida pelo CFF: <strong className="ml-1">{item.sugestao}</strong>
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg px-4 py-3 flex items-start gap-2 text-[12px] bg-info/10 border border-info/30 text-info">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>As sugestões de classificação são baseadas na tabela classTrib do Portal da Conformidade Fácil (CFF/SVRS), atualizada em 12/05/2026.</span>
        </div>
      </div>
    );

    if (wizardStep === 2) return (
      <div className="space-y-4">
        <h2 className="text-[16px] font-bold text-foreground">Para quais empresas aplicar a exceção?</h2>
        <Toggle checked={allEmpresas} onChange={handleAllEmpresas} label="Selecionar todas as empresas do grupo" />
        <div className="space-y-2">
          {empresas.map(e => (
            <div key={e.id} className="border border-border rounded-lg p-3.5 flex items-center gap-3">
              <Checkbox checked={e.checked} onCheckedChange={() => toggleEmpresa(e.id)} />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground">{e.nome}</p>
                <p className="text-[11px] text-muted-foreground">CNPJ {e.cnpj}</p>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{e.docs}</span>
            </div>
          ))}
        </div>
      </div>
    );

    if (wizardStep === 3) return (
      <div className="space-y-4">
        <h2 className="text-[16px] font-bold text-foreground">Para quais tipos de operação?</h2>
        <div className="space-y-2">
          {([
            { val: "all",        label: "Todas as TOPs (sem restrição)", badge: "Recomendado" },
            { val: "specific",   label: "TOPs específicas",              badge: null          },
            { val: "finalidade", label: "Finalidade da operação",        badge: null          },
          ] as const).map(opt => (
            <label key={opt.val}
              className={cn(
                "flex items-center gap-3 border rounded-lg p-3.5 cursor-pointer transition-colors",
                topOpt === opt.val
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/30"
              )}
              onClick={() => setTopOpt(opt.val)}>
              <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                topOpt === opt.val ? "border-primary" : "border-muted-foreground/40")}>
                {topOpt === opt.val && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <span className="text-[13px] font-medium text-foreground flex-1">{opt.label}</span>
              {opt.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">{opt.badge}</span>
              )}
            </label>
          ))}
        </div>
        {topOpt === "specific" && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={topSearch}
                onChange={e => setTopSearch(e.target.value)}
                placeholder="Buscar tipo de operação..."
                className="pl-8 text-[12px] h-9"
              />
            </div>
            <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
              {filteredTops.map(top => (
                <div key={top.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Checkbox
                    checked={selectedTops.has(top.id)}
                    onCheckedChange={() => setSelectedTops(prev => {
                      const next = new Set(prev);
                      next.has(top.id) ? next.delete(top.id) : next.add(top.id);
                      return next;
                    })}
                  />
                  <span className="text-[11px] text-muted-foreground w-5 shrink-0">{top.id}</span>
                  <span className="text-[12px] text-foreground">{top.label}</span>
                </div>
              ))}
              {filteredTops.length === 0 && (
                <p className="text-[12px] text-muted-foreground text-center py-4">Nenhum resultado encontrado.</p>
              )}
            </div>
          </div>
        )}
        {topOpt === "finalidade" && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={finalidadeSearch}
                onChange={e => setFinalidadeSearch(e.target.value)}
                placeholder="Buscar finalidade da operação..."
                className="pl-8 text-[12px] h-9"
              />
            </div>
            <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
              {filteredFinalidades.map(fin => (
                <div key={fin.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Checkbox
                    checked={selectedFinalidades.has(fin.id)}
                    onCheckedChange={() => setSelectedFinalidades(prev => {
                      const next = new Set(prev);
                      next.has(fin.id) ? next.delete(fin.id) : next.add(fin.id);
                      return next;
                    })}
                  />
                  <span className="text-[11px] text-muted-foreground w-5 shrink-0">{fin.id}</span>
                  <span className="text-[12px] text-foreground">{fin.label}</span>
                </div>
              ))}
              {filteredFinalidades.length === 0 && (
                <p className="text-[12px] text-muted-foreground text-center py-4">Nenhum resultado encontrado.</p>
              )}
            </div>
          </div>
        )}
      </div>
    );

    return (
      <div className="space-y-4">
        <h2 className="text-[16px] font-bold text-foreground">Para quais parceiros aplicar?</h2>
        <div className="space-y-2">
          {([
            { val: "all",      label: "Todos os parceiros (sem restrição)", badge: "Recomendado" },
            { val: "specific", label: "Parceiros específicos",               badge: null           },
            { val: "group",    label: "Grupo de parceiros cadastrado",        badge: null           },
          ] as const).map(opt => (
            <label key={opt.val}
              className={cn(
                "flex items-center gap-3 border rounded-lg p-3.5 cursor-pointer transition-colors",
                partnerOpt === opt.val
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/30"
              )}
              onClick={() => setPartnerOpt(opt.val)}>
              <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                partnerOpt === opt.val ? "border-primary" : "border-muted-foreground/40")}>
                {partnerOpt === opt.val && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <span className="text-[13px] font-medium text-foreground flex-1">{opt.label}</span>
              {opt.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">{opt.badge}</span>
              )}
            </label>
          ))}
        </div>
        {partnerOpt === "specific" && (
          <div className="space-y-2">
            <Input placeholder="Buscar parceiro..." className="text-[12px] h-9" />
            <div className="border border-border rounded-lg divide-y divide-border">
              {["Distribuidora XYZ Ltda", "Comércio ABC S.A.", "Ind. Nacional Eireli"].map(p => (
                <div key={p} className="flex items-center gap-3 px-3 py-2.5">
                  <Checkbox />
                  <span className="text-[12px] text-foreground">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {partnerOpt === "group" && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={grupoSearch}
                onChange={e => setGrupoSearch(e.target.value)}
                placeholder="Buscar grupo de parceiros..."
                className="pl-8 text-[12px] h-9"
              />
            </div>
            <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
              {filteredGrupos.map(grupo => (
                <div key={grupo.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Checkbox
                    checked={selectedGrupos.has(grupo.id)}
                    onCheckedChange={() => setSelectedGrupos(prev => {
                      const next = new Set(prev);
                      next.has(grupo.id) ? next.delete(grupo.id) : next.add(grupo.id);
                      return next;
                    })}
                  />
                  <span className="text-[11px] text-muted-foreground w-8 shrink-0">{grupo.id}</span>
                  <span className="text-[12px] text-foreground">{grupo.label}</span>
                </div>
              ))}
              {filteredGrupos.length === 0 && (
                <p className="text-[12px] text-muted-foreground text-center py-4">Nenhum resultado encontrado.</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const screen3 = (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-bold text-foreground">Wizard de Configuração</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Preencha cada etapa para configurar as exceções tributárias.</p>
      </div>
      <SectionCard>
        <WizardProgress step={wizardStep} />
        <div className="flex justify-between pb-4 mb-4 border-b border-border">
          <button
            onClick={() => wizardStep > 1 ? setWizardStep(s => (s - 1) as WizardStep) : setScreen(2)}
            className="px-4 py-2 rounded-lg border border-border text-[13px] font-medium text-muted-foreground hover:bg-muted transition-colors">
            ← Voltar
          </button>
          <div className="flex gap-2">
            <button onClick={() => setScreen(2)}
              className="px-4 py-2 rounded-lg border border-border text-[13px] font-medium text-muted-foreground hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => wizardStep < 4 ? setWizardStep(s => (s + 1) as WizardStep) : setScreen(4)}
              className="px-5 py-2 rounded-lg text-[13px] font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              {wizardStep < 4 ? `Próximo: ${WIZARD_STEP_LABELS[wizardStep]} →` : "Ver Resumo →"}
            </button>
          </div>
        </div>
        {wizardContent()}
      </SectionCard>
    </div>
  );

  // ── Screen 4 ─────────────────────────────────────────────────────────────────
  const resumeItems = [
    { ncm: "8471.30.19", desc: "Computadores portáteis",  action: "INCLUIR",   actionCls: "bg-success text-success-foreground"  },
    { ncm: "3004.90.69", desc: "Medicamentos uso humano", action: "ATUALIZAR", actionCls: "bg-warning text-warning-foreground"  },
    { ncm: "8528.72.20", desc: "Televisores",             action: "INCLUIR",   actionCls: "bg-success text-success-foreground"  },
  ];

  const screen4 = (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-bold text-foreground">Resumo da Configuração</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Revise as regras antes de confirmar. Esta ação pode ser desfeita apenas durante esta sessão.
        </p>
      </div>

      <div className="flex justify-between pb-4 border-b border-border">
        <button onClick={() => setScreen(3)}
          className="px-4 py-2 rounded-lg border border-border text-[13px] font-medium text-muted-foreground hover:bg-muted transition-colors">
          Cancelar e voltar
        </button>
        <button onClick={() => setScreen(5)}
          className="px-6 py-2 rounded-lg text-[13px] font-bold bg-success text-success-foreground flex items-center gap-2 hover:opacity-90 transition-opacity">
          <CheckCheck className="h-4 w-4" /> Confirmar e Gravar
        </button>
      </div>

      {resumeItems.map(item => (
        <div key={item.ncm} className="bg-card rounded-lg overflow-hidden border border-border card-shadow">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/40">
            <div>
              <span className="font-mono text-[13px] font-bold text-foreground">{item.ncm}</span>
              <span className="text-[13px] text-muted-foreground ml-2">— {item.desc}</span>
            </div>
            <button className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 hover:text-foreground">
              <Pencil className="h-3 w-3" /> Editar
            </button>
          </div>
          <div className="px-5 py-4 space-y-2 text-[12px]">
            {[
              { label: "Empresas",  value: "Empresa A · Empresa B" },
              { label: "Operações", value: "Venda · Transferência" },
              { label: "Parceiros", value: "Todos"                 },
              { label: "cClassTrib",
                value: (
                  <span>
                    <span className="text-muted-foreground">Não configurado</span>
                    <span className="text-muted-foreground mx-1">→</span>
                    <span className="font-semibold text-foreground">025 — Alíquota Reduzida IBS/CBS</span>
                  </span>
                )
              },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-2">
                <span className="w-24 text-muted-foreground font-medium">{row.label}:</span>
                <span className="text-foreground">{row.value}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1">
              <span className="w-24 text-muted-foreground font-medium">Ação:</span>
              <span className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full", item.actionCls)}>
                {item.action}
              </span>
            </div>
          </div>
        </div>
      ))}

      <div className="rounded-lg px-5 py-4 space-y-1.5 bg-success/10 border border-success/30">
        <p className="text-[13px] font-semibold text-success">Resumo de impacto</p>
        {[
          "3 NCMs/NBS serão configurados",
          "2 empresas serão impactadas",
          "Estimativa: 1.966 documentos futuros passarão a calcular IBS/CBS com a nova classificação",
        ].map(t => (
          <p key={t} className="text-[12px] flex items-center gap-2 text-success">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> {t}
          </p>
        ))}
      </div>

    </div>
  );

  // ── Screen 5 ─────────────────────────────────────────────────────────────────
  const screen5 = (
    <div className="space-y-5">
      <div className="flex flex-col items-center py-6">
        <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-9 w-9 text-success" />
        </div>
        <h1 className="text-[20px] font-bold text-foreground">Configuração realizada com sucesso!</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          3 exceções tributárias foram gravadas em 12/05/2026 às 14:32 por Ana Silva.
        </p>
      </div>

      <div className="flex justify-between pb-4 border-b border-border">
        <button onClick={() => setShowUndo(true)}
          className="px-4 py-2 rounded-lg border border-destructive text-destructive text-[13px] font-medium flex items-center gap-2 hover:bg-destructive/5 transition-colors">
          <RotateCcw className="h-3.5 w-3.5" /> Desfazer esta configuração
        </button>
        <button onClick={() => { setScreen(2); setWizardStep(1); }}
          className="px-5 py-2 rounded-lg text-[13px] font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          Voltar ao Diagnóstico
        </button>
      </div>

      <SectionCard className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {["NCM/NBS", "Descrição", "Ação", "Status"].map(h => (
                <TableHead key={h} className={cn("text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", h === "NCM/NBS" && "pl-5")}>
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { ncm: "8471.30.19", desc: "Computadores portáteis", acao: "INCLUÍDA" },
              { ncm: "3004.90.69", desc: "Medicamentos",           acao: "INCLUÍDA" },
              { ncm: "8528.72.20", desc: "Televisores",            acao: "INCLUÍDA" },
            ].map(r => (
              <TableRow key={r.ncm}>
                <TableCell className="font-mono text-[12px] font-semibold text-foreground pl-5">{r.ncm}</TableCell>
                <TableCell className="text-[12px] text-foreground">{r.desc}</TableCell>
                <TableCell>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-success text-success-foreground">{r.acao}</span>
                </TableCell>
                <TableCell className="text-[12px] font-semibold text-success">✅ Sucesso</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard>
        <button onClick={() => setLogOpen(v => !v)}
          className="flex items-center justify-between w-full text-[13px] font-semibold text-foreground">
          <span>Ver detalhes do log</span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", logOpen && "rotate-180")} />
        </button>
        {logOpen && (
          <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-[12px]">
            {[
              ["ID Execução",        "EXC-2026-00847"            ],
              ["Usuário",            "ana.silva"                 ],
              ["Versão tabela CFF",  "12/05/2026"                ],
              ["Tempo de execução",  "1,3s"                      ],
              ["Registros gravados", "6 (3 exceções × 2 empresas)"],
            ].map(([label, val]) => (
              <div key={label} className="flex gap-2">
                <span className="w-40 text-muted-foreground font-medium">{label}:</span>
                <span className="font-mono text-foreground">{val}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="rounded-lg px-4 py-2.5 flex items-center gap-2 text-[12px] bg-warning/10 border border-warning/30 text-warning">
        <span>💡</span>
        <span><strong>Dica:</strong> Retorne ao Diagnóstico para configurar os 32 NCMs/NBS restantes. Volume estimado sem configuração: R$ 9,2M</span>
      </div>
    </div>
  );

  const screens: Record<Screen, React.ReactNode> = { 1: screen1, 2: screen2, 3: screen3, 4: screen4, 5: screen5 };

  const SCREEN_LABELS = ["Dashboard", "Diagnóstico", "Wizard", "Resumo", "Conclusão"];

  return (
    <div className="min-h-full p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-5">
          <span>Configurações</span>
          <ChevronRight className="h-3 w-3" />
          <span>Assistentes</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-primary">Exceções da Tributação Integral - IBS/CBS</span>
        </div>

        {/* Screen nav pills */}
        <div className="flex gap-2 mb-6">
          {([1, 2, 3, 4, 5] as Screen[]).map((s, idx) => (
            <button key={s} onClick={() => setScreen(s)}
              className={cn(
                "text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors",
                screen === s
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
              )}>
              {SCREEN_LABELS[idx]}
            </button>
          ))}
        </div>

        {screens[screen]}
      </div>

      {/* Undo modal */}
      <Dialog open={showUndo} onOpenChange={setShowUndo}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[16px]">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Desfazer configuração
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground mt-1">
              Tem certeza que deseja desfazer? Esta ação removerá as <strong>3 exceções gravadas</strong> nesta sessão.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowUndo(false)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1"
              onClick={() => { setShowUndo(false); setScreen(2); setWizardStep(1); }}>
              Confirmar desfazer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
