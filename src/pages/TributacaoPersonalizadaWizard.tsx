import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight, ChevronLeft, Search, CheckCircle2, Users, Info, ScrollText,
  Building2, FileSearch, ClipboardCheck, AlertTriangle, Sparkles, Check, X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ERoutes } from "@/routes/interface";
import { cn } from "@/lib/utils";
import { useBIAChat } from "@/context/BIAChatContext";

// ── Types ──────────────────────────────────────────────────────────
interface EmpresaWizard {
  codEmpresa: number;
  nomeFantasia: string;
  cnpj: string;
  simplesNacional: boolean;
  codRegimeTributario: string;
  empresaMatriz: number;
}

interface CClassCandidate {
  cClass: string;
  descricao: string;
  baseLegal: string;
  reducaoPerc: number;
}

interface Produto {
  codProd: number;
  descricao: string;
  ncm: string;
  empresa: number;
}

interface NcmRow {
  ncm: string;
  descNcm: string;
  empresas: string[];
  candidatos: CClassCandidate[];
  isAmbiguo: boolean;
  status: "pendente" | "aprovado" | "em_analise_bia";
  cClassAprovado?: string;
}

interface Top {
  codTop: number;
  descricao: string;
  tipoMovimento: "E" | "S";
}

interface AliquotaRow {
  cbs: string;
  ibs: string;
  vigencia: string;
}

// ── Mock data ──────────────────────────────────────────────────────
const TODAS_EMPRESAS: EmpresaWizard[] = [
  { codEmpresa: 1,  nomeFantasia: "Financeira Alpha S.A.", cnpj: "12.345.678/0001-99", simplesNacional: false, codRegimeTributario: "Regime Normal",    empresaMatriz: 1 },
  { codEmpresa: 2,  nomeFantasia: "Alpha Filial SP",       cnpj: "12.345.678/0002-80", simplesNacional: false, codRegimeTributario: "Regime Normal",    empresaMatriz: 1 },
  { codEmpresa: 3,  nomeFantasia: "Beta Factoring Ltda.",  cnpj: "98.765.432/0001-01", simplesNacional: false, codRegimeTributario: "Regime Normal",    empresaMatriz: 3 },
  { codEmpresa: 4,  nomeFantasia: "Gamma Seguros S.A.",    cnpj: "55.444.333/0001-55", simplesNacional: false, codRegimeTributario: "Regime Normal",    empresaMatriz: 4 },
  { codEmpresa: 5,  nomeFantasia: "Delta Comercio ME",     cnpj: "11.222.333/0001-44", simplesNacional: true,  codRegimeTributario: "Simples Nacional", empresaMatriz: 5 },
  { codEmpresa: 25, nomeFantasia: "Empresa Teste",         cnpj: "01.001.001/0001-00", simplesNacional: false, codRegimeTributario: "Regime Normal",    empresaMatriz: 1 },
];

const EMPRESAS = TODAS_EMPRESAS.filter((e) => !e.simplesNacional);

const PRODUTOS: Produto[] = [
  { codProd: 101,  descricao: "Fundo de Investimento Imobiliário — Cotas FII", ncm: "4907.00.00", empresa: 1  },
  { codProd: 102,  descricao: "Operação de Crédito Pessoal",                   ncm: "4907.00.00", empresa: 1  },
  { codProd: 201,  descricao: "Notebook Dell Inspiron 15",                     ncm: "8471.30.12", empresa: 2  },
  { codProd: 202,  descricao: "Medicamento Antibiótico Amoxicilina 500mg",     ncm: "3004.20.99", empresa: 2  },
  { codProd: 301,  descricao: "Absorvente Higiênico Feminino",                 ncm: "9619.00.00", empresa: 3  },
  { codProd: 302,  descricao: "Fralda Descartável Infantil",                   ncm: "9619.00.00", empresa: 3  },
  { codProd: 303,  descricao: "Arroz Polido Tipo 1 5kg",                       ncm: "1006.30.21", empresa: 3  },
  { codProd: 401,  descricao: "Óleo de Soja Refinado 900ml",                   ncm: "1507.90.11", empresa: 4  },
  { codProd: 402,  descricao: "Pão de Forma Integral 500g",                    ncm: "1905.90.90", empresa: 4  },
  { codProd: 2501, descricao: "Software de Gestão Empresarial — Licença Anual",ncm: "8523.49.90", empresa: 25 },
];

const KB: Record<string, CClassCandidate[]> = {
  "4907.00.00": [{ cClass: "01.01.01.100", descricao: "Títulos e valores mobiliários — isenção CBS/IBS",    baseLegal: "LC 214/2025 Art. 136",        reducaoPerc: 100 }],
  "8471.30.12": [{ cClass: "21.01.01.100", descricao: "Equipamentos de informática — alíquota padrão",      baseLegal: "LC 214/2025 Anexo I",         reducaoPerc: 0   }],
  "3004.20.99": [{ cClass: "04.01.01.200", descricao: "Medicamentos — isenção CBS/IBS",                     baseLegal: "LC 214/2025 Art. 147 I",      reducaoPerc: 100 }],
  "9619.00.00": [
    { cClass: "04.03.01.100", descricao: "Absorventes higiênicos — isenção CBS/IBS",   baseLegal: "LC 214/2025 Art. 147 VI",    reducaoPerc: 100 },
    { cClass: "04.03.02.100", descricao: "Fraldas descartáveis — redução 50% CBS/IBS", baseLegal: "LC 214/2025 Anexo V Item 3", reducaoPerc: 50  },
  ],
  "1006.30.21": [{ cClass: "02.01.01.100", descricao: "Arroz — redução 60% CBS/IBS",        baseLegal: "LC 214/2025 Anexo II Item 1", reducaoPerc: 60 }],
  "1507.90.11": [{ cClass: "02.02.01.100", descricao: "Óleo de soja — redução 60% CBS/IBS", baseLegal: "LC 214/2025 Anexo II Item 5", reducaoPerc: 60 }],
  "1905.90.90": [{ cClass: "02.03.01.100", descricao: "Pão — redução 60% CBS/IBS",          baseLegal: "LC 214/2025 Anexo II Item 8", reducaoPerc: 60 }],
  "8523.49.90": [{ cClass: "22.01.01.100", descricao: "Software — alíquota padrão",          baseLegal: "LC 214/2025 Anexo I",         reducaoPerc: 0  }],
};

// ── Scenario: aliquotas-pending (pre-built ambiguous rows) ─────────
const ALIQUOTAS_PENDING_ROWS: NcmRow[] = [
  {
    ncm: "3004.20.99",
    descNcm: "Medicamento Antibiótico Amoxicilina 500mg",
    empresas: ["Alpha Filial SP"],
    candidatos: [
      { cClass: "04.01.01.200", descricao: "Medicamentos registrados ANVISA — isenção total CBS/IBS",  baseLegal: "LC 214/2025 Art. 147 I",  reducaoPerc: 100 },
      { cClass: "04.01.02.100", descricao: "Outros produtos farmacêuticos — redução 60% CBS/IBS",       baseLegal: "LC 214/2025 Anexo II",    reducaoPerc: 60  },
    ],
    isAmbiguo: true,
    status: "pendente",
    cClassAprovado: undefined,
  },
  {
    ncm: "0401.10.10",
    descNcm: "Leite Integral UHT 1L",
    empresas: ["Beta Factoring Ltda.", "Gamma Seguros S.A."],
    candidatos: [
      { cClass: "02.01.05.100", descricao: "Cesta Básica Nacional — isenção total CBS/IBS",       baseLegal: "LC 214/2025 Anexo I Art. 25",  reducaoPerc: 100 },
      { cClass: "02.01.06.060", descricao: "Produto lácteo processado — redução 60% CBS/IBS",      baseLegal: "LC 214/2025 Anexo II Item 12", reducaoPerc: 60  },
    ],
    isAmbiguo: true,
    status: "pendente",
    cClassAprovado: undefined,
  },
];

const TOPS: Top[] = [
  { codTop: 100, descricao: "Venda de Mercadoria",           tipoMovimento: "S" },
  { codTop: 101, descricao: "Venda de Serviço",              tipoMovimento: "S" },
  { codTop: 200, descricao: "Compra de Mercadoria",          tipoMovimento: "E" },
  { codTop: 201, descricao: "Compra de Serviço",             tipoMovimento: "E" },
  { codTop: 300, descricao: "Devolução de Venda",            tipoMovimento: "E" },
  { codTop: 301, descricao: "Devolução de Compra",           tipoMovimento: "S" },
  { codTop: 400, descricao: "Transferência entre Filiais",   tipoMovimento: "S" },
  { codTop: 500, descricao: "Remessa para Conserto",         tipoMovimento: "S" },
];

// ── Helpers ────────────────────────────────────────────────────────
function getGroupMembers(empresa: EmpresaWizard): EmpresaWizard[] {
  return EMPRESAS.filter((e) => e.empresaMatriz === empresa.empresaMatriz);
}

function getMatrizNome(empresa: EmpresaWizard): string | undefined {
  return EMPRESAS.find((e) => e.codEmpresa === empresa.empresaMatriz)?.nomeFantasia;
}

function buildNcmRows(selectedIds: number[]): NcmRow[] {
  const produtos = PRODUTOS.filter((p) => selectedIds.includes(p.empresa));
  const ncmMap = new Map<string, { descricoes: Set<string>; empresas: Set<string> }>();
  for (const p of produtos) {
    const nome = EMPRESAS.find((e) => e.codEmpresa === p.empresa)?.nomeFantasia ?? `Empresa ${p.empresa}`;
    if (!ncmMap.has(p.ncm)) ncmMap.set(p.ncm, { descricoes: new Set(), empresas: new Set() });
    const entry = ncmMap.get(p.ncm)!;
    entry.descricoes.add(p.descricao);
    entry.empresas.add(nome);
  }
  return Array.from(ncmMap.entries()).map(([ncm, { descricoes, empresas }]) => {
    const candidatos = KB[ncm] ?? [];
    const isAmbiguo = candidatos.length > 1;
    return {
      ncm,
      descNcm: Array.from(descricoes).join(" / "),
      empresas: Array.from(empresas),
      candidatos,
      isAmbiguo,
      status: "pendente" as const,
      cClassAprovado: isAmbiguo ? undefined : candidatos[0]?.cClass,
    };
  });
}

function getBiaRecommendation(row: NcmRow): { cClass: string; reasoning: string } | null {
  if (!row.isAmbiguo || row.candidatos.length < 2) return null;
  if (row.ncm === "3004.20.99") {
    return {
      cClass: "04.01.01.200",
      reasoning: "NCM 3004.20.99 pode enquadrar-se em duas classes: com registro ANVISA ativo (isenção total, Art. 147 I) ou sem registro (redução 60%, Anexo II). A ANVISA registrou atualização recente neste código. Este medicamento possui registro ANVISA ativo?",
    };
  }
  if (row.ncm === "0401.10.10") {
    return {
      cClass: "02.01.05.100",
      reasoning: "NCM 0401.10.10 abrange leite puro (Cesta Básica Nacional, isenção total, Anexo I Art. 25) e leite processado com ingredientes adicionados (redução 60%, Anexo II Item 12). Este produto é leite puro/integral sem ingredientes adicionados?",
    };
  }
  if (row.ncm === "9619.00.00") {
    const lower = row.descNcm.toLowerCase();
    const hasAbsorvent = lower.includes("absorvente");
    const hasFralda = lower.includes("fralda");
    if (hasAbsorvent && !hasFralda)
      return { cClass: "04.03.01.100", reasoning: "Identifico 'absorvente' nos produtos deste NCM. Pelo Art. 147 VI da LC 214/2025, absorventes têm isenção total de CBS/IBS (100%). Recomendo classificar como 04.03.01.100 — selecione na tabela para confirmar." };
    if (hasFralda && !hasAbsorvent)
      return { cClass: "04.03.02.100", reasoning: "Identifico 'fralda' nos produtos deste NCM. Pelo Anexo V Item 3 da LC 214/2025, fraldas têm redução de 50%. Recomendo classificar como 04.03.02.100 — selecione na tabela para confirmar." };
    return { cClass: "04.03.01.100", reasoning: "Este NCM engloba absorventes e fraldas com tratamentos tributários distintos. Localizei ambos nos produtos — selecione o cClass predominante na tabela ou separe os produtos em NCMs distintos antes de confirmar." };
  }
  return null;
}

// ── Styles ─────────────────────────────────────────────────────────
const TH = "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

// ── Filter pill helper ─────────────────────────────────────────────
function FilterPill<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] transition-colors border",
            value === o.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: "Seleção de Empresa" },
  { n: 2, label: "Sugestão de Códigos" },
  { n: 3, label: "Tipos de Operação" },
  { n: 4, label: "Resumo e Cadastro" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => (
        <>
          <div key={s.n} className="flex items-center gap-2 shrink-0">
            <div
              className={cn(
                "h-7 w-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors",
                s.n <= current
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background border-border text-muted-foreground"
              )}
            >
              {s.n < current ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
            </div>
            <span
              className={cn(
                "text-[12px] hidden sm:block whitespace-nowrap",
                s.n === current ? "text-foreground font-semibold" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              key={`line-${s.n}`}
              className={cn("h-px mx-3 flex-1 min-w-[16px]", s.n < current ? "bg-primary" : "bg-border")}
            />
          )}
        </>
      ))}
    </div>
  );
}

// ── Step 1 — Seleção de Empresa ────────────────────────────────────
interface Step1Props {
  selected: number[];
  onChange: (ids: number[]) => void;
}

function Step1({ selected, onChange }: Step1Props) {
  const [search, setSearch] = useState("");
  const [groupDialog, setGroupDialog] = useState<{
    empresa: EmpresaWizard;
    group: EmpresaWizard[];
  } | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return EMPRESAS.filter(
      (e) =>
        !q ||
        e.nomeFantasia.toLowerCase().includes(q) ||
        e.cnpj.includes(q) ||
        String(e.codEmpresa).includes(q)
    );
  }, [search]);

  function handleToggle(empresa: EmpresaWizard) {
    const isSelected = selected.includes(empresa.codEmpresa);
    if (isSelected) {
      onChange(selected.filter((id) => id !== empresa.codEmpresa));
      return;
    }
    const group = getGroupMembers(empresa);
    const groupHasMultiple = group.length > 1;
    const groupAlreadyTouched = group.some((m) => selected.includes(m.codEmpresa));
    if (groupHasMultiple && !groupAlreadyTouched) {
      setGroupDialog({ empresa, group });
      return;
    }
    onChange([...selected, empresa.codEmpresa]);
  }

  function confirmGroupDialog(all: boolean) {
    if (!groupDialog) return;
    const toAdd = all ? groupDialog.group.map((e) => e.codEmpresa) : [groupDialog.empresa.codEmpresa];
    onChange([...new Set([...selected, ...toAdd])]);
    setGroupDialog(null);
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((e) => selected.includes(e.codEmpresa));
  const someFilteredSelected = filtered.some((e) => selected.includes(e.codEmpresa));
  const headerCheckState: boolean | "indeterminate" = allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false;

  function toggleAll() {
    if (allFilteredSelected) {
      onChange(selected.filter((id) => !filtered.some((e) => e.codEmpresa === id)));
    } else {
      onChange([...new Set([...selected, ...filtered.map((e) => e.codEmpresa)])]);
    }
  }

  return (
    <>
      <p className="text-[13px] text-muted-foreground mb-4">
        Selecione a(s) empresa(s) para as quais deseja configurar a tributação personalizada de
        IBS/CBS. Apenas empresas do Regime Normal com documentos fiscais configurados são listadas.
      </p>

      <div className="flex items-center mb-4 px-3 py-2.5 bg-muted/40 rounded-lg border">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Código, nome ou CNPJ"
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border card-shadow">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10">
                <Checkbox checked={headerCheckState} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className={TH}>Cód. Emp.</TableHead>
              <TableHead className={TH}>Nome Fantasia</TableHead>
              <TableHead className={TH}>CNPJ</TableHead>
              <TableHead className={TH}>Regime Tributário</TableHead>
              <TableHead className={TH}>Grupo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => {
              const isSelected = selected.includes(e.codEmpresa);
              const isFilial = e.codEmpresa !== e.empresaMatriz;
              const group = getGroupMembers(e);
              return (
                <TableRow
                  key={e.codEmpresa}
                  className={cn("cursor-pointer hover:bg-muted/30 transition-colors", isSelected && "bg-primary/5")}
                  onClick={() => handleToggle(e)}
                >
                  <TableCell onClick={(ev) => ev.stopPropagation()}>
                    <Checkbox checked={isSelected} onCheckedChange={() => handleToggle(e)} />
                  </TableCell>
                  <TableCell className="font-mono text-sm font-semibold">{e.codEmpresa}</TableCell>
                  <TableCell className="text-sm font-medium">{e.nomeFantasia}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{e.cnpj}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                      {e.codRegimeTributario}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isFilial ? (
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground shrink-0">Filial</Badge>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[130px]">{getMatrizNome(e)}</span>
                      </div>
                    ) : group.length > 1 ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-[11px]">{group.length - 1} filial{group.length > 2 ? "is" : ""}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                  Nenhuma empresa encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-2.5 border-t text-[11px] text-muted-foreground bg-muted/20">
          <span>
            {selected.length > 0 && <><strong>{selected.length}</strong> selecionada{selected.length > 1 ? "s" : ""} · </>}
            Exibindo <strong className="text-foreground">{filtered.length}</strong> de{" "}
            <strong className="text-foreground">{EMPRESAS.length}</strong> empresas (Regime Normal)
          </span>
        </div>
      </div>

      <Dialog open={!!groupDialog} onOpenChange={() => setGroupDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Empresa pertence a um grupo
            </DialogTitle>
            <DialogDescription className="pt-1">
              <strong>{groupDialog?.empresa.nomeFantasia}</strong> faz parte de um grupo econômico com mais{" "}
              {groupDialog && groupDialog.group.length - 1} empresa{groupDialog && groupDialog.group.length > 2 ? "s" : ""}:
            </DialogDescription>
          </DialogHeader>
          {groupDialog && (
            <div className="rounded-lg border divide-y text-[13px] my-1 max-h-52 overflow-y-auto">
              {groupDialog.group.map((m) => (
                <div key={m.codEmpresa} className="flex items-center justify-between px-3 py-2.5">
                  <div>
                    <p className="font-medium">{m.nomeFantasia}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{m.cnpj}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] shrink-0 ml-3",
                      m.codEmpresa === m.empresaMatriz
                        ? "border-primary/40 text-primary bg-primary/5"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {m.codEmpresa === m.empresaMatriz ? "Matriz" : "Filial"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <p className="text-[13px] text-muted-foreground">
            Deseja aplicar as mesmas configurações de tributação a todas as empresas do grupo?
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => confirmGroupDialog(false)}>Não, somente esta</Button>
            <Button onClick={() => confirmGroupDialog(true)}>Sim, aplicar a todas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Step 2 — Sugestão de Códigos Tributários ───────────────────────
type StatusFilter = "todos" | "pendente" | "aprovado" | "ambiguo";

interface Step2Props {
  selectedEmpresas: number[];
  onApprovalChange: (allApproved: boolean) => void;
  onRowsSnapshot?: (rows: NcmRow[]) => void;
  initialRows?: NcmRow[];
}

function Step2({ selectedEmpresas, onApprovalChange, onRowsSnapshot, initialRows }: Step2Props) {
  const { addMessage, setThinking, sendInsight, setIsOpen, setPendingAction } = useBIAChat();
  const [rows, setRows] = useState<NcmRow[]>(() => initialRows ?? buildNcmRows(selectedEmpresas));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  const pendentes = rows.filter((r) => r.status === "pendente").length;
  const aprovados = rows.filter((r) => r.status === "aprovado").length;
  const ambiguosPendentes = rows.filter((r) => r.isAmbiguo && r.status !== "aprovado").length;
  const lotePendentes = rows.filter((r) => r.status === "pendente" && !r.isAmbiguo).length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const matchSearch = !q || r.ncm.includes(q) || r.descNcm.toLowerCase().includes(q) || r.empresas.some((e) => e.toLowerCase().includes(q));
      const matchStatus =
        statusFilter === "todos"    ? true :
        statusFilter === "pendente" ? r.status === "pendente" :
        statusFilter === "aprovado" ? r.status === "aprovado" :
        r.isAmbiguo && r.status !== "aprovado";
      return matchSearch && matchStatus;
    });
  }, [rows, search, statusFilter]);

  useEffect(() => {
    onApprovalChange(rows.length > 0 && rows.every((r) => r.status === "aprovado"));
    onRowsSnapshot?.(rows);
  }, [rows, onApprovalChange, onRowsSnapshot]);

  function removeRow(ncm: string) {
    setRows((prev) => prev.filter((r) => r.ncm !== ncm));
  }

  function approveRow(ncm: string, cClass?: string) {
    setRows((prev) =>
      prev.map((r) => r.ncm === ncm ? { ...r, status: "aprovado", cClassAprovado: cClass ?? r.cClassAprovado } : r)
    );
  }

  function approveAll() {
    setRows((prev) => prev.map((r) => r.status === "pendente" && !r.isAmbiguo ? { ...r, status: "aprovado" } : r));
  }

  function openBia(row: NcmRow) {
    setRows((prev) => prev.map((r) => r.ncm === row.ncm ? { ...r, status: "em_analise_bia" } : r));
    setIsOpen(true);
    addMessage({ role: "user", content: `Analise o NCM ${row.ncm} — ${row.descNcm}` });
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      const rec = getBiaRecommendation(row);
      const candidates = row.candidatos
        .map((c) => `• ${c.cClass} — ${c.descricao} (${c.reducaoPerc}%) — ${c.baseLegal}`)
        .join("\n");
      const analysisMsg = rec
        ? `NCM ${row.ncm} analisado. ${rec.reasoning}\n\nCandidatos:\n${candidates}`
        : `NCM ${row.ncm} — múltiplos cClass identificados.\n\nCandidatos:\n${candidates}`;
      sendInsight(analysisMsg, "insight", "Consultor Tributário");

      const quickReplies =
        row.ncm === "3004.20.99"
          ? [{ label: "Tem registro ANVISA", value: "anvisa_sim" }, { label: "Sem registro ANVISA", value: "anvisa_nao" }]
        : row.ncm === "0401.10.10"
          ? [{ label: "Leite puro/integral", value: "leite_puro" }, { label: "Leite processado", value: "leite_processado" }]
        : row.ncm === "9619.00.00"
          ? [{ label: "É uma fralda", value: "fralda" }, { label: "É um absorvente", value: "absorvente" }]
        : row.candidatos.map((c) => ({ label: c.cClass, value: c.cClass }));

      addMessage({
        role: "bia",
        content: "Você pode me contar um pouco mais sobre esse item?",
        tag: "insight",
        skill: "Consultor Tributário",
        quickReplies,
      });

      setPendingAction((input: string) => {
        const lower = input.toLowerCase();
        let matched: CClassCandidate | undefined;
        if (row.ncm === "3004.20.99") {
          if (lower === "anvisa_sim" || lower.includes("tem registro") || lower.includes("ativo"))
            matched = row.candidatos.find((c) => c.cClass === "04.01.01.200");
          else if (lower === "anvisa_nao" || lower.includes("sem registro"))
            matched = row.candidatos.find((c) => c.cClass === "04.01.02.100");
        } else if (row.ncm === "0401.10.10") {
          if (lower === "leite_puro" || lower.includes("puro") || lower.includes("integral"))
            matched = row.candidatos.find((c) => c.cClass === "02.01.05.100");
          else if (lower === "leite_processado" || lower.includes("processado"))
            matched = row.candidatos.find((c) => c.cClass === "02.01.06.060");
        } else if (lower.includes("absorvente"))
          matched = row.candidatos.find((c) => c.cClass === "04.03.01.100");
        else if (lower.includes("fralda"))
          matched = row.candidatos.find((c) => c.cClass === "04.03.02.100");
        else
          matched = row.candidatos.find((c) =>
            lower.includes(c.cClass.toLowerCase()) ||
            lower.includes(c.descricao.toLowerCase().split(" ")[0])
          );

        setPendingAction(null);

        if (matched) {
          approveRow(row.ncm, matched.cClass);
          setThinking(true);
          setTimeout(() => {
            setThinking(false);
            sendInsight(
              `O mais adequado seria o código ${matched!.cClass} — ${matched!.descricao}. Classificação confirmada na tabela.`,
              "insight",
              "Consultor Tributário"
            );
          }, 800);
        } else {
          setRows((prev) => prev.map((r) => r.ncm === row.ncm ? { ...r, status: "pendente" } : r));
          setThinking(true);
          setTimeout(() => {
            setThinking(false);
            addMessage({
              role: "bia",
              content: "Nesse caso, o mais adequado é 000001 — Tributação Integral. Usamos essa rotina para exceções — esse NCM pode ser removido da lista. Posso remover?",
              tag: "insight",
              skill: "Consultor Tributário",
              quickReplies: [
                { label: "Sim, remover", value: "remover" },
                { label: "Não, manter", value: "manter" },
              ],
            });
            setPendingAction((answer: string) => {
              setPendingAction(null);
              if (answer === "remover" || answer.toLowerCase().includes("sim")) {
                removeRow(row.ncm);
                setThinking(true);
                setTimeout(() => {
                  setThinking(false);
                  sendInsight(`NCM ${row.ncm} removido da lista.`, "info", "Consultor Tributário");
                }, 600);
              } else {
                sendInsight(`Ok, o NCM ${row.ncm} foi mantido. Você pode revisá-lo manualmente.`, "info", "Consultor Tributário");
              }
            });
          }, 1000);
        }
      });
    }, 1600);
  }

  return (
    <>
      <p className="text-[13px] text-muted-foreground mb-4">
        Os NCMs dos produtos das empresas selecionadas foram cruzados com a base LC 214/2025.
        Revise as sugestões e aprove cada NCM. NCMs ambíguos requerem desambiguação via BIA.
      </p>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-3 px-3 py-2.5 bg-muted/40 rounded-lg border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="NCM, produto ou empresa"
            className="h-8 pl-8 text-sm w-56"
          />
        </div>
        <FilterPill<StatusFilter>
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "todos",    label: "Todos" },
            { value: "pendente", label: "Pendente" },
            { value: "aprovado", label: "Aprovado" },
            { value: "ambiguo",  label: "Ambíguo" },
          ]}
        />
      </div>

      {/* Status chips + lote */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border text-[12px] text-muted-foreground">
          Total: <strong className="text-foreground ml-1">{rows.length}</strong>
        </span>
        <span className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px]",
          aprovados > 0 && aprovados === rows.length
            ? "bg-green-50 border-green-500/30 text-green-700 dark:bg-green-950/30 dark:text-green-400"
            : "bg-muted/60 border-border text-muted-foreground"
        )}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Aprovados: <strong className="ml-1">{aprovados}</strong>
        </span>
        {ambiguosPendentes > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/10 border border-warning/30 text-[12px] text-warning">
            <AlertTriangle className="h-3.5 w-3.5" />
            Ambíguos: <strong className="ml-1">{ambiguosPendentes}</strong>
          </span>
        )}
        {pendentes > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border text-[12px] text-muted-foreground">
            Pendentes: <strong className="ml-1">{pendentes}</strong>
          </span>
        )}
        {lotePendentes > 0 && (
          <Button size="sm" variant="outline" className="ml-auto h-7 gap-1.5 text-[12px]" onClick={approveAll}>
            <Check className="h-3.5 w-3.5" />
            Aprovar em lote ({lotePendentes})
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border card-shadow">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className={TH}>NCM</TableHead>
              <TableHead className={TH}>Produto(s)</TableHead>
              <TableHead className={TH}>Empresa(s)</TableHead>
              <TableHead className={TH}>cClass Sugerido</TableHead>
              <TableHead className={TH}>Base Legal</TableHead>
              <TableHead className={TH}>Redução</TableHead>
              <TableHead className={TH}>Status</TableHead>
              <TableHead className={TH}>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const isAprovado   = row.status === "aprovado";
              const isAnalisando = row.status === "em_analise_bia";
              const cClassDisplay  = row.cClassAprovado ?? row.candidatos[0]?.cClass;
              const candidatoAtivo = row.candidatos.find((c) => c.cClass === cClassDisplay) ?? row.candidatos[0];
              const perc = candidatoAtivo?.reducaoPerc ?? 0;

              return (
                <TableRow key={row.ncm} className={cn(isAprovado && "bg-green-50/50 dark:bg-green-950/10")}>
                  <TableCell className="font-mono text-[12px] font-semibold whitespace-nowrap">{row.ncm}</TableCell>
                  <TableCell className="text-[12px] max-w-[160px]">
                    <span className="line-clamp-2 text-muted-foreground">{row.descNcm}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.empresas.map((e) => (
                        <Badge key={e} variant="outline" className="text-[10px] text-muted-foreground border-border whitespace-nowrap">{e}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.isAmbiguo && !isAprovado ? (
                      <div className="flex items-center gap-1.5 text-warning">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-[11px] font-medium">Ambíguo</span>
                      </div>
                    ) : (
                      <span className="font-mono text-[12px]">{cClassDisplay ?? "—"}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground max-w-[140px]">
                    {row.isAmbiguo && !isAprovado ? "—" : (candidatoAtivo?.baseLegal ?? "—")}
                  </TableCell>
                  <TableCell>
                    {!row.isAmbiguo || isAprovado ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          perc === 100 ? "border-green-500/40 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30"
                            : perc > 0  ? "border-warning/40 text-warning bg-warning/5"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {`${perc}%`}
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAprovado ? (
                      <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">Aprovado</span>
                      </div>
                    ) : isAnalisando ? (
                      <div className="flex items-center gap-1 text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">BIA analisando</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 inline-block" />
                        <span className="text-[11px]">Pendente</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isAnalisando ? (
                        <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-semibold">Confirmar</p>
                          <div className="flex flex-wrap gap-1">
                            {row.candidatos.map((c) => (
                              <Button
                                key={c.cClass}
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-[10px] font-mono border-primary/40 text-primary hover:bg-primary/5"
                                onClick={() => approveRow(row.ncm, c.cClass)}
                              >
                                {c.cClass}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : !isAprovado && row.isAmbiguo ? (
                        <Button size="sm" className="h-7 px-2.5 text-[11px] gap-1" onClick={() => openBia(row)}>
                          <Sparkles className="h-3 w-3" />
                          BIA
                        </Button>
                      ) : !isAprovado ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-[11px] gap-1 border-green-500/40 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/20"
                          onClick={() => approveRow(row.ncm)}
                        >
                          <Check className="h-3 w-3" />
                          Aprovar
                        </Button>
                      ) : null}
                      <button
                        onClick={() => removeRow(row.ncm)}
                        className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                        title="Remover NCM"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                  {rows.length === 0 ? "Nenhum produto com NCM cadastrado." : "Nenhum resultado para os filtros aplicados."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

// ── Step 3 — Tipos de Operação ─────────────────────────────────────
type TopTypeFilter = "todos" | "E" | "S";

interface Step3Props {
  selectedTops: number[];
  onChange: (tops: number[]) => void;
}

function Step3({ selectedTops, onChange }: Step3Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TopTypeFilter>("todos");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return TOPS.filter((t) => {
      const matchSearch = !q || t.descricao.toLowerCase().includes(q) || String(t.codTop).includes(q);
      const matchType = typeFilter === "todos" || t.tipoMovimento === typeFilter;
      return matchSearch && matchType;
    });
  }, [search, typeFilter]);

  const allFilteredSel = filtered.length > 0 && filtered.every((t) => selectedTops.includes(t.codTop));
  const someFilteredSel = filtered.some((t) => selectedTops.includes(t.codTop));
  const headerCheck: boolean | "indeterminate" = allFilteredSel ? true : someFilteredSel ? "indeterminate" : false;

  function toggleTop(codTop: number) {
    onChange(selectedTops.includes(codTop) ? selectedTops.filter((c) => c !== codTop) : [...selectedTops, codTop]);
  }

  function toggleAllFiltered() {
    if (allFilteredSel) {
      onChange(selectedTops.filter((id) => !filtered.some((t) => t.codTop === id)));
    } else {
      onChange([...new Set([...selectedTops, ...filtered.map((t) => t.codTop)])]);
    }
  }

  return (
    <>
      <p className="text-[13px] text-muted-foreground mb-4">
        Selecione os Tipos de Operação (TOP) aos quais as configurações de IBS/CBS serão aplicadas.
        As alíquotas personalizadas incidirão nas notas fiscais geradas por esses TOPs.
      </p>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4 px-3 py-2.5 bg-muted/40 rounded-lg border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Código ou descrição"
            className="h-8 pl-8 text-sm w-52"
          />
        </div>
        <FilterPill<TopTypeFilter>
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "todos", label: "Todos" },
            { value: "S",     label: "Saída" },
            { value: "E",     label: "Entrada" },
          ]}
        />
      </div>

      <div className="bg-card rounded-lg border card-shadow">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10">
                <Checkbox checked={headerCheck} onCheckedChange={toggleAllFiltered} />
              </TableHead>
              <TableHead className={TH}>Cód. TOP</TableHead>
              <TableHead className={TH}>Descrição</TableHead>
              <TableHead className={TH}>Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => {
              const isSel = selectedTops.includes(t.codTop);
              return (
                <TableRow
                  key={t.codTop}
                  className={cn("cursor-pointer hover:bg-muted/30 transition-colors", isSel && "bg-primary/5")}
                  onClick={() => toggleTop(t.codTop)}
                >
                  <TableCell onClick={(ev) => ev.stopPropagation()}>
                    <Checkbox checked={isSel} onCheckedChange={() => toggleTop(t.codTop)} />
                  </TableCell>
                  <TableCell className="font-mono text-sm font-semibold">{t.codTop}</TableCell>
                  <TableCell className="text-sm">{t.descricao}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        t.tipoMovimento === "S"
                          ? "border-primary/30 text-primary bg-primary/5"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {t.tipoMovimento === "S" ? "Saída" : "Entrada"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum resultado para os filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-2.5 border-t text-[11px] text-muted-foreground bg-muted/20">
          <span>
            {selectedTops.length > 0 && <><strong>{selectedTops.length}</strong> selecionado{selectedTops.length > 1 ? "s" : ""} · </>}
            <strong className="text-foreground">{TOPS.length}</strong> TOPs disponíveis
          </span>
        </div>
      </div>
    </>
  );
}

// ── Step 4 — Resumo e Cadastro ─────────────────────────────────────
interface Step4Props {
  selectedEmpresas: number[];
  approvedRows: NcmRow[];
  selectedTops: number[];
}

function Step4({ selectedEmpresas, approvedRows, selectedTops }: Step4Props) {
  const [search, setSearch] = useState("");
  const [aliquotas, setAliquotas] = useState<Record<string, AliquotaRow>>(() =>
    Object.fromEntries(approvedRows.map((r) => [r.ncm, { cbs: "0.9", ibs: "9.1", vigencia: "2025-07-01" }]))
  );
  const [confirmed, setConfirmed] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return approvedRows.filter((r) => !q || r.ncm.includes(q) || (r.cClassAprovado ?? "").includes(q) || r.descNcm.toLowerCase().includes(q));
  }, [approvedRows, search]);

  function updateAliquota(ncm: string, field: keyof AliquotaRow, value: string) {
    setAliquotas((prev) => ({ ...prev, [ncm]: { ...prev[ncm], [field]: value } }));
  }

  if (confirmed) {
    return (
      <div className="flex flex-col items-center py-20 gap-5 text-center max-w-md mx-auto">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-950/40">
          <CheckCircle2 className="h-9 w-9 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-[17px] font-semibold text-foreground">Tributação cadastrada com sucesso!</p>
          <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
            {approvedRows.length} NCM{approvedRows.length > 1 ? "s configurados" : " configurado"} para{" "}
            {selectedEmpresas.length} empresa{selectedEmpresas.length > 1 ? "s" : ""} ·{" "}
            {selectedTops.length} TOP{selectedTops.length > 1 ? "s vinculados" : " vinculado"}.{" "}
            NT ativada e log de auditoria registrado.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {approvedRows.map((r) => (
            <Badge key={r.ncm} variant="outline" className="text-[10px] border-green-500/30 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30">
              {r.ncm} → {r.cClassAprovado ?? r.candidatos[0]?.cClass}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border text-[12px]">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{selectedEmpresas.length} empresa{selectedEmpresas.length > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border text-[12px]">
          <FileSearch className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{approvedRows.length} NCM{approvedRows.length > 1 ? "s" : ""} aprovado{approvedRows.length > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border text-[12px]">
          <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{selectedTops.length} TOP{selectedTops.length > 1 ? "s" : ""} selecionado{selectedTops.length > 1 ? "s" : ""}</span>
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground mb-4">
        Revise as alíquotas e a vigência antes de confirmar. Os campos CBS%, IBS% e Vigência são editáveis por NCM.
      </p>

      {/* Filtro */}
      <div className="flex items-center mb-4 px-3 py-2.5 bg-muted/40 rounded-lg border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por NCM ou cClass"
            className="h-8 pl-8 text-sm w-60"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border card-shadow mb-5">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className={TH}>NCM</TableHead>
              <TableHead className={TH}>cClass</TableHead>
              <TableHead className={TH}>Base Legal</TableHead>
              <TableHead className={TH}>Redução</TableHead>
              <TableHead className={TH}>CBS %</TableHead>
              <TableHead className={TH}>IBS %</TableHead>
              <TableHead className={TH}>Vigência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const cClass = row.cClassAprovado ?? row.candidatos[0]?.cClass ?? "—";
              const cand = row.candidatos.find((c) => c.cClass === cClass) ?? row.candidatos[0];
              const perc = cand?.reducaoPerc ?? 0;
              const aq = aliquotas[row.ncm] ?? { cbs: "0.9", ibs: "9.1", vigencia: "2025-07-01" };
              return (
                <TableRow key={row.ncm}>
                  <TableCell className="font-mono text-[12px] font-semibold whitespace-nowrap">{row.ncm}</TableCell>
                  <TableCell className="font-mono text-[12px]">{cClass}</TableCell>
                  <TableCell className="text-[11px] text-muted-foreground max-w-[140px]">{cand?.baseLegal ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        perc === 100 ? "border-green-500/40 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30"
                          : perc > 0  ? "border-warning/40 text-warning bg-warning/5"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {`${perc}%`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <input
                      value={aq.cbs}
                      onChange={(e) => updateAliquota(row.ncm, "cbs", e.target.value)}
                      className="w-16 h-7 rounded border bg-background px-2 text-[12px] text-right outline-none focus:ring-1 focus:ring-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      value={aq.ibs}
                      onChange={(e) => updateAliquota(row.ncm, "ibs", e.target.value)}
                      className="w-16 h-7 rounded border bg-background px-2 text-[12px] text-right outline-none focus:ring-1 focus:ring-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="date"
                      value={aq.vigencia}
                      onChange={(e) => updateAliquota(row.ncm, "vigencia", e.target.value)}
                      className="h-7 rounded border bg-background px-2 text-[12px] outline-none focus:ring-1 focus:ring-primary"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum resultado para o filtro aplicado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* TOPs vinculados */}
      <div className="rounded-lg bg-muted/40 border p-4 mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">TOPs vinculados</p>
        <div className="flex flex-wrap gap-1.5">
          {TOPS.filter((t) => selectedTops.includes(t.codTop)).map((t) => (
            <Badge key={t.codTop} variant="outline" className="text-[11px] text-foreground">
              {t.codTop} — {t.descricao}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setConfirmed(true)} className="gap-1.5">
          <Check className="h-4 w-4" />
          Confirmar Cadastro
        </Button>
      </div>
    </>
  );
}

// ── Welcome screen ─────────────────────────────────────────────────
const WELCOME_STEPS = [
  {
    n: 1,
    icon: Building2,
    title: "Seleção de Empresa",
    desc: "Selecione a(s) empresa(s) para as quais deseja configurar a tributação personalizada. Somente empresas do Regime Normal previamente configuradas para NF-e, NFC-e, NFS-e, CTe ou NFCom são consideradas. Caso a empresa faça parte de um grupo econômico, você poderá aplicar as configurações a todas as filiais de uma vez.",
  },
  {
    n: 2,
    icon: FileSearch,
    title: "Sugestão de Códigos Tributários",
    desc: "O assistente lê o cadastro de produtos das empresas selecionadas, extrai os NCMs e os cruza com a base de conhecimento da LC 214/2025 (Anexos I–XVIII e Arts. 136/147). Para cada NCM elegível são exibidos o cClass sugerido, a base legal e o percentual de redução. NCMs ambíguos são resolvidos via BIA no chat lateral.",
  },
  {
    n: 3,
    icon: ClipboardCheck,
    title: "Tipos de Operação",
    desc: "Selecione os TOPs (Tipos de Operação) nos quais as alíquotas personalizadas de IBS/CBS serão aplicadas. É possível filtrar por tipo de movimento (Entrada/Saída) e buscar por código ou descrição.",
  },
  {
    n: 4,
    icon: ClipboardCheck,
    title: "Resumo e Cadastro",
    desc: "Revise os NCMs aprovados com alíquotas IBS/CBS editáveis e vigência por linha. Ao confirmar, os registros são criados em TGFCBS e TGFIBS para cada empresa × NCM, a NT é ativada e um log de auditoria é registrado.",
  },
];

interface WelcomeScreenProps {
  onStart: () => void;
  onCancel: () => void;
}

function WelcomeScreen({ onStart, onCancel }: WelcomeScreenProps) {
  return (
    <div>
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-3 -mx-6 -mt-6 mb-8">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2 flex-wrap">
          <span>Configurações</span>
          <ChevronRight className="h-3 w-3" />
          <span>Assistente</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Tributação Personalizada — IBS/CBS</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[16px] font-semibold text-foreground leading-tight">
            Assistente Tributação Personalizada — IBS/CBS
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => {}}>
              <ScrollText className="h-3.5 w-3.5" />
              Visualizar Logs
            </Button>
            <Button size="sm" onClick={onStart} className="gap-1.5">
              Iniciar configuração
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Bem-vindo ao</p>
        <h2 className="text-[22px] font-bold text-foreground leading-snug mb-3">
          Assistente de Configuração da Tributação Personalizada — IBS/CBS
        </h2>
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-8">
          A partir desta tela, você poderá realizar o cadastro personalizado das alíquotas IBS
          Estadual/Municipal e CBS por NCM, com sugestões geradas automaticamente a partir da base
          de conhecimento normativo (LC 214/2025 + Anexos). O Wizard está dividido em 4 etapas:
        </p>

        <div className="space-y-3 mb-8">
          {WELCOME_STEPS.map((s) => (
            <div key={s.n} className="flex gap-5 rounded-xl border bg-card p-5 card-shadow">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-[15px]">
                  {s.n}
                </div>
                <s.icon className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-foreground mb-1">{s.title}</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-muted/50 border px-5 py-4">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Após concluir as etapas e confirmar, as alíquotas serão cadastradas, a NT será ativada
            nas empresas selecionadas e um log de auditoria será registrado com todas as decisões,
            incluindo as realizadas com apoio da BIA.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────
export default function TributacaoPersonalizadaWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addMessage, setIsOpen } = useBIAChat();
  const isAliquotasScenario = searchParams.get("scenario") === "aliquotas-pending";

  const [welcome, setWelcome] = useState(!isAliquotasScenario);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(isAliquotasScenario ? 2 : 1);
  const [selectedEmpresas, setSelectedEmpresas] = useState<number[]>(isAliquotasScenario ? [2, 3, 4] : []);
  const [step2AllApproved, setStep2AllApproved] = useState(false);
  const [ncmSnapshot, setNcmSnapshot] = useState<NcmRow[]>([]);
  const [selectedTops, setSelectedTops] = useState<number[]>([]);

  useEffect(() => {
    if (isAliquotasScenario) {
      setIsOpen(true);
      const t = setTimeout(() => {
        addMessage({
          role: "bia",
          content: "Aqui estão as 2 aprovações pendentes do Assistente de Alíquotas. Clique em BIA em qualquer NCM ambíguo para que eu ajude na desambiguação.",
          tag: "info",
          skill: "Consultor Tributário",
        });
      }, 400);
      return () => clearTimeout(t);
    }
  }, []);

  if (welcome) {
    return (
      <WelcomeScreen
        onStart={() => setWelcome(false)}
        onCancel={() => navigate(ERoutes.HOME)}
      />
    );
  }

  const canNext =
    step === 1 ? selectedEmpresas.length > 0 :
    step === 2 ? step2AllApproved :
    step === 3 ? selectedTops.length > 0 :
    false;

  const selectedNames = selectedEmpresas
    .map((id) => EMPRESAS.find((e) => e.codEmpresa === id)?.nomeFantasia)
    .filter(Boolean) as string[];

  function handleNext() {
    if (step < 4) setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
  }

  function handleBack() {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
    else setWelcome(true);
  }

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-3 -mx-6 -mt-6 mb-6">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2 flex-wrap">
          <span>Configurações</span>
          <ChevronRight className="h-3 w-3" />
          <span>Assistente</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Tributação Personalizada — IBS/CBS</span>
        </div>

        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-[16px] font-semibold text-foreground leading-tight">
              Assistente Tributação Personalizada — IBS/CBS
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Etapa {step} de 4</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={handleBack} className="text-muted-foreground">
              Voltar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate(ERoutes.HOME)} className="text-muted-foreground">
              Cancelar
            </Button>
            {step < 4 ? (
              <Button size="sm" onClick={handleNext} disabled={!canNext}>
                Próximo
              </Button>
            ) : (
              <Button size="sm" disabled>
                Salvar
              </Button>
            )}
          </div>
        </div>

        <StepIndicator current={step} />
      </div>

      {/* Selection summary banner — step 1 only */}
      {selectedEmpresas.length > 0 && step === 1 && (
        <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20 text-[12px] text-primary">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>{selectedEmpresas.length}</strong> empresa{selectedEmpresas.length > 1 ? "s" : ""} selecionada{selectedEmpresas.length > 1 ? "s" : ""}:{" "}
            {selectedNames.join(", ")}
          </span>
        </div>
      )}

      {/* Step content */}
      {step === 1 && <Step1 selected={selectedEmpresas} onChange={setSelectedEmpresas} />}
      {step === 2 && (
        <Step2
          selectedEmpresas={selectedEmpresas}
          onApprovalChange={setStep2AllApproved}
          onRowsSnapshot={setNcmSnapshot}
          initialRows={isAliquotasScenario ? ALIQUOTAS_PENDING_ROWS : undefined}
        />
      )}
      {step === 3 && <Step3 selectedTops={selectedTops} onChange={setSelectedTops} />}
      {step === 4 && (
        <Step4
          selectedEmpresas={selectedEmpresas}
          approvedRows={ncmSnapshot.filter((r) => r.status === "aprovado")}
          selectedTops={selectedTops}
        />
      )}
    </div>
  );
}
