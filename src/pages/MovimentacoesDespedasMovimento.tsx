import React, { useState, useMemo } from "react";
import {
  TrendingDown,
  ChevronRight,
  ExternalLink,
  Eye,
  Filter,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tributo {
  imposto: string;
  incidencia: string;
  cst: string;
  base: number;
  baseReduzida: number;
  aliquota: string;
  valor: number;
  digitado: string;
}

interface DespesaMovimento {
  id: string;
  dataNegociacao: string;
  empresa: string;
  empresaCod: string;
  parceiroNome: string;
  parceiroCNPJ: string;
  nroUnico: string;
  tipo: "Receita" | "Despesa";
  vlrDesdobramento: number;
  totalIBSUF: number;
  totalIBSMun: number;
  totalCBS: number;
  nroNota: string;
  desdob: string;
  tipoOperacao: string;
  dtEntradaSaida: string;
  dtVencimento: string;
  vlrDesconto: number;
  vlrMulta: number;
  vlrJuros: number;
  vlrBaixa: number;
  dataBaixa: string;
  tributos: Tributo[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const EMPRESAS = [
  { cod: "001", nome: "Sankhya Gestão de Negócios Ltda" },
  { cod: "002", nome: "Sankhya São Paulo S.A." },
  { cod: "003", nome: "Distribuidora Norte Ltda" },
];

const PERIODOS = [
  { value: "2026-01", label: "Janeiro/2026" },
  { value: "2026-02", label: "Fevereiro/2026" },
  { value: "2026-03", label: "Março/2026" },
  { value: "2026-04", label: "Abril/2026" },
  { value: "2026-05", label: "Maio/2026" },
];

const MOCK: DespesaMovimento[] = [
  {
    id: "1",
    dataNegociacao: "08/01/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Fornecedor Alpha Ltda",
    parceiroCNPJ: "11.222.333/0001-44",
    nroUnico: "500.001",
    tipo: "Despesa",
    vlrDesdobramento: 18000.0,
    totalIBSUF: 630.0,
    totalIBSMun: 630.0,
    totalCBS: 900.0,
    nroNota: "NF-500100",
    desdob: "001/001",
    tipoOperacao: "2.101 - Pagamento",
    dtEntradaSaida: "08/01/2026",
    dtVencimento: "08/02/2026",
    vlrDesconto: 0,
    vlrMulta: 0,
    vlrJuros: 0,
    vlrBaixa: 18000.0,
    dataBaixa: "08/02/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Entrada", cst: "50", base: 18000, baseReduzida: 0, aliquota: "5,00%", valor: 900.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Entrada", cst: "50", base: 18000, baseReduzida: 0, aliquota: "3,50%", valor: 630.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Entrada", cst: "50", base: 18000, baseReduzida: 0, aliquota: "3,50%", valor: 630.0, digitado: "Não" },
    ],
  },
  {
    id: "2",
    dataNegociacao: "14/01/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Distribuidora Beta S.A.",
    parceiroCNPJ: "55.666.777/0001-88",
    nroUnico: "500.002",
    tipo: "Despesa",
    vlrDesdobramento: 6200.0,
    totalIBSUF: 217.0,
    totalIBSMun: 217.0,
    totalCBS: 310.0,
    nroNota: "NF-500101",
    desdob: "001/002",
    tipoOperacao: "2.101 - Pagamento",
    dtEntradaSaida: "14/01/2026",
    dtVencimento: "14/02/2026",
    vlrDesconto: 100.0,
    vlrMulta: 0,
    vlrJuros: 0,
    vlrBaixa: 0,
    dataBaixa: "—",
    tributos: [
      { imposto: "CBS",     incidencia: "Entrada", cst: "50", base: 6200, baseReduzida: 0, aliquota: "5,00%", valor: 310.0,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Entrada", cst: "50", base: 6200, baseReduzida: 0, aliquota: "3,50%", valor: 217.0,  digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Entrada", cst: "50", base: 6200, baseReduzida: 0, aliquota: "3,50%", valor: 217.0,  digitado: "Não" },
    ],
  },
  {
    id: "3",
    dataNegociacao: "03/02/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Suprimentos Omega Ltda",
    parceiroCNPJ: "99.000.111/0001-22",
    nroUnico: "600.010",
    tipo: "Despesa",
    vlrDesdobramento: 37500.0,
    totalIBSUF: 1312.5,
    totalIBSMun: 1312.5,
    totalCBS: 1875.0,
    nroNota: "NF-600050",
    desdob: "001/001",
    tipoOperacao: "2.101 - Pagamento",
    dtEntradaSaida: "03/02/2026",
    dtVencimento: "03/03/2026",
    vlrDesconto: 0,
    vlrMulta: 0,
    vlrJuros: 0,
    vlrBaixa: 37500.0,
    dataBaixa: "03/03/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Entrada", cst: "50", base: 37500, baseReduzida: 0, aliquota: "5,00%", valor: 1875.0,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Entrada", cst: "50", base: 37500, baseReduzida: 0, aliquota: "3,50%", valor: 1312.5,  digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Entrada", cst: "50", base: 37500, baseReduzida: 0, aliquota: "3,50%", valor: 1312.5,  digitado: "Não" },
    ],
  },
  {
    id: "4",
    dataNegociacao: "19/02/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Serviços Delta ME",
    parceiroCNPJ: "33.444.555/0001-66",
    nroUnico: "500.003",
    tipo: "Despesa",
    vlrDesdobramento: 4800.0,
    totalIBSUF: 168.0,
    totalIBSMun: 168.0,
    totalCBS: 240.0,
    nroNota: "NF-500115",
    desdob: "001/001",
    tipoOperacao: "2.101 - Pagamento",
    dtEntradaSaida: "19/02/2026",
    dtVencimento: "19/03/2026",
    vlrDesconto: 0,
    vlrMulta: 96.0,
    vlrJuros: 57.6,
    vlrBaixa: 4953.6,
    dataBaixa: "22/03/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Entrada", cst: "50", base: 4800, baseReduzida: 0, aliquota: "5,00%", valor: 240.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Entrada", cst: "50", base: 4800, baseReduzida: 0, aliquota: "3,50%", valor: 168.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Entrada", cst: "50", base: 4800, baseReduzida: 0, aliquota: "3,50%", valor: 168.0, digitado: "Não" },
    ],
  },
  {
    id: "5",
    dataNegociacao: "22/04/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Fornecedor Sigma Ltda",
    parceiroCNPJ: "44.555.666/0001-77",
    nroUnico: "500.004",
    tipo: "Despesa",
    vlrDesdobramento: 9400.0,
    totalIBSUF: 329.0,
    totalIBSMun: 329.0,
    totalCBS: 470.0,
    nroNota: "NF-500200",
    desdob: "001/001",
    tipoOperacao: "2.101 - Pagamento",
    dtEntradaSaida: "22/04/2026",
    dtVencimento: "22/05/2026",
    vlrDesconto: 0,
    vlrMulta: 0,
    vlrJuros: 0,
    vlrBaixa: 0,
    dataBaixa: "—",
    tributos: [
      { imposto: "CBS",     incidencia: "Entrada", cst: "50", base: 9400, baseReduzida: 0, aliquota: "5,00%", valor: 470.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Entrada", cst: "50", base: 9400, baseReduzida: 0, aliquota: "3,50%", valor: 329.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Entrada", cst: "50", base: 9400, baseReduzida: 0, aliquota: "3,50%", valor: 329.0, digitado: "Não" },
    ],
  },
  {
    id: "6",
    dataNegociacao: "05/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Materiais Omega S.A.",
    parceiroCNPJ: "88.999.000/0001-33",
    nroUnico: "600.020",
    tipo: "Despesa",
    vlrDesdobramento: 21500.0,
    totalIBSUF: 752.5,
    totalIBSMun: 752.5,
    totalCBS: 1075.0,
    nroNota: "NF-600100",
    desdob: "001/001",
    tipoOperacao: "2.101 - Pagamento",
    dtEntradaSaida: "05/05/2026",
    dtVencimento: "05/06/2026",
    vlrDesconto: 0,
    vlrMulta: 0,
    vlrJuros: 0,
    vlrBaixa: 0,
    dataBaixa: "—",
    tributos: [
      { imposto: "CBS",     incidencia: "Entrada", cst: "50", base: 21500, baseReduzida: 0, aliquota: "5,00%", valor: 1075.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Entrada", cst: "50", base: 21500, baseReduzida: 0, aliquota: "3,50%", valor:  752.5, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Entrada", cst: "50", base: 21500, baseReduzida: 0, aliquota: "3,50%", valor:  752.5, digitado: "Não" },
    ],
  },
  {
    id: "7",
    dataNegociacao: "14/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Distribuidora Beta S.A.",
    parceiroCNPJ: "55.666.777/0001-88",
    nroUnico: "500.005",
    tipo: "Despesa",
    vlrDesdobramento: 5100.0,
    totalIBSUF: 178.5,
    totalIBSMun: 178.5,
    totalCBS: 255.0,
    nroNota: "NF-500210",
    desdob: "001/001",
    tipoOperacao: "2.101 - Pagamento",
    dtEntradaSaida: "14/05/2026",
    dtVencimento: "14/06/2026",
    vlrDesconto: 0,
    vlrMulta: 0,
    vlrJuros: 0,
    vlrBaixa: 0,
    dataBaixa: "—",
    tributos: [
      { imposto: "CBS",     incidencia: "Entrada", cst: "50", base: 5100, baseReduzida: 0, aliquota: "5,00%", valor: 255.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Entrada", cst: "50", base: 5100, baseReduzida: 0, aliquota: "3,50%", valor: 178.5, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Entrada", cst: "50", base: 5100, baseReduzida: 0, aliquota: "3,50%", valor: 178.5, digitado: "Não" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function dateToPeriod(date: string): string {
  const [, m, y] = date.split("/");
  return `${y}-${m}`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MovimentacoesDespedasMovimento() {
  const [view, setView] = useState<"list" | "detail">("list");
  const [selected, setSelected] = useState<DespesaMovimento | null>(null);
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");

  const hasFilter = filtroEmpresa !== "" || filtroPeriodo !== "";

  const rows = useMemo(() => {
    if (!hasFilter) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return MOCK.filter((r) => {
        const [d, m, y] = r.dataNegociacao.split("/");
        return new Date(Number(y), Number(m) - 1, Number(d)) >= cutoff;
      });
    }
    return MOCK.filter((r) => {
      const byEmpresa = !filtroEmpresa || r.empresaCod === filtroEmpresa;
      const byPeriodo = !filtroPeriodo || dateToPeriod(r.dataNegociacao) === filtroPeriodo;
      return byEmpresa && byPeriodo;
    });
  }, [filtroEmpresa, filtroPeriodo, hasFilter]);

  if (view === "detail" && selected) {
    return (
      <DetailView
        record={selected}
        onBack={() => { setView("list"); setSelected(null); }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-1">
          <TrendingDown className="h-3.5 w-3.5" />
          <span>Movimentações</span>
          <ChevronRight className="h-3 w-3" />
          <span>Despesas</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Movimento</span>
        </div>
        <h1 className="text-[18px] font-semibold">Despesas — Movimento</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Títulos a pagar com tributos CBS e IBS · negociações a partir de 01/01/2026
        </p>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

          <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
            <SelectTrigger className="w-[280px] h-8 text-[13px]">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              {EMPRESAS.map((e) => (
                <SelectItem key={e.cod} value={e.cod} className="text-[13px]">
                  {e.cod} — {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
            <SelectTrigger className="w-[180px] h-8 text-[13px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => (
                <SelectItem key={p.value} value={p.value} className="text-[13px]">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilter && (
            <button
              onClick={() => { setFiltroEmpresa(""); setFiltroPeriodo(""); }}
              className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[60%] gap-2 text-center">
            <p className="text-[14px] font-medium">Nenhum registro encontrado</p>
            <p className="text-[12px] text-muted-foreground">Tente ajustar os filtros selecionados.</p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="px-6 py-4">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[12px]">Dt. Negociação</TableHead>
                    <TableHead className="text-[12px]">Empresa</TableHead>
                    <TableHead className="text-[12px]">Parceiro</TableHead>
                    <TableHead className="text-[12px]">Tipo</TableHead>
                    <TableHead className="text-[12px]">Nro Único</TableHead>
                    <TableHead className="text-[12px] text-right">Valor</TableHead>
                    <TableHead className="text-[12px] text-right">Total IBS UF</TableHead>
                    <TableHead className="text-[12px] text-right">Total IBS Mun</TableHead>
                    <TableHead className="text-[12px] text-right">Total CBS</TableHead>
                    <TableHead className="text-[12px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/40 text-[13px]">
                      <TableCell className="font-mono text-[12px]">{r.dataNegociacao}</TableCell>
                      <TableCell>{r.empresa}</TableCell>
                      <TableCell>
                        <div>{r.parceiroNome}</div>
                        <div className="text-[11px] text-muted-foreground">{r.parceiroCNPJ}</div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-[13px] font-medium",
                          r.tipo === "Receita"
                            ? "text-blue-700 dark:text-blue-400"
                            : "text-red-700 dark:text-red-400"
                        )}
                      >
                        {r.tipo}
                      </TableCell>
                      <TableCell className="font-mono">{r.nroUnico}</TableCell>
                      <TableCell className="text-right font-mono">{brl(r.vlrDesdobramento)}</TableCell>
                      <TableCell className="text-right font-mono">{brl(r.totalIBSUF)}</TableCell>
                      <TableCell className="text-right font-mono">{brl(r.totalIBSMun)}</TableCell>
                      <TableCell className="text-right font-mono">{brl(r.totalCBS)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[12px] gap-1"
                          onClick={() => { setSelected(r); setView("detail"); }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Detalhar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground">
              {rows.length} registro{rows.length !== 1 ? "s" : ""}
              {!hasFilter && " · últimos 30 dias"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  mono = false,
  colorClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  colorClass?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[11px] text-muted-foreground mb-0.5">{label}</div>
      <div className={cn("text-[13px] font-medium truncate", mono && "font-mono", colorClass)}>
        {value}
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground mb-0.5">{label}</div>
      <div className={cn("text-[13px] text-foreground", mono && "font-mono")}>{value}</div>
    </div>
  );
}

function DetailView({
  record: r,
  onBack,
}: {
  record: DespesaMovimento;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-[13px]" onClick={onBack}>
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          Voltar
        </Button>
        <div className="h-4 w-px bg-border" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-0.5">
            <TrendingDown className="h-3.5 w-3.5 shrink-0" />
            <span>Despesas</span>
            <ChevronRight className="h-3 w-3" />
            <span>Movimento</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium truncate">Título {r.nroUnico}</span>
          </div>
          <h1 className="text-[16px] font-semibold">Detalhamento do Título</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Movimentação Financeira
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Central de Compra
          </Button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-6">

        {/* Resumo do Título */}
        <section>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Resumo do Título
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Dt. Negociação" value={r.dataNegociacao}        mono />
            <SummaryCard label="Empresa"        value={r.empresa}                    />
            <SummaryCard label="Parceiro"       value={r.parceiroNome}               />
            <SummaryCard label="Nro Único"      value={r.nroUnico}              mono />
            <SummaryCard label="Valor"          value={brl(r.vlrDesdobramento)} mono />
            <SummaryCard label="Total CBS"      value={brl(r.totalCBS)}         mono />
            <SummaryCard label="Total IBS UF"   value={brl(r.totalIBSUF)}       mono />
            <SummaryCard label="Total IBS Mun"  value={brl(r.totalIBSMun)}      mono />
          </div>
        </section>

        {/* Detalhes do Título — TGFFIN */}
        <section>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Detalhes do Título
          </h2>
          <div className="rounded-lg border bg-card p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-4">
              <DetailField label="Nro Único"          value={r.nroUnico}               mono />
              <DetailField label="Empresa"            value={r.empresa}                     />
              <DetailField label="Parceiro"           value={r.parceiroNome}                />
              <DetailField label="Nro Nota"           value={r.nroNota}                mono />
              <DetailField label="Desdobramento"      value={r.desdob}                 mono />
              <DetailField label="Tipo Operação"      value={r.tipoOperacao}                />
              <DetailField label="Dt. Negociação"     value={r.dataNegociacao}         mono />
              <DetailField label="Dt. Entrada/Saída"  value={r.dtEntradaSaida}         mono />
              <DetailField label="Dt. Vencimento"     value={r.dtVencimento}           mono />
              <DetailField label="Vlr Desdobramento"  value={brl(r.vlrDesdobramento)}  mono />
              <DetailField label="Vlr Desconto"       value={brl(r.vlrDesconto)}       mono />
              <DetailField label="Vlr Multa"          value={brl(r.vlrMulta)}          mono />
              <DetailField label="Vlr Juros"          value={brl(r.vlrJuros)}          mono />
              <DetailField label="Vlr Baixa"          value={brl(r.vlrBaixa)}          mono />
              <DetailField label="Data Baixa"         value={r.dataBaixa}              mono />
            </div>
          </div>
        </section>

        {/* Tributos do Título — TGFIIF */}
        <section>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Tributos do Título
          </h2>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-[12px]">Imposto</TableHead>
                  <TableHead className="text-[12px]">Incidência</TableHead>
                  <TableHead className="text-[12px]">CST</TableHead>
                  <TableHead className="text-[12px] text-right">Base</TableHead>
                  <TableHead className="text-[12px] text-right">Base Cálc. Reduzida</TableHead>
                  <TableHead className="text-[12px] text-right">Alíquota</TableHead>
                  <TableHead className="text-[12px] text-right">Valor</TableHead>
                  <TableHead className="text-[12px] text-center">Digitado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.tributos.map((t, i) => (
                  <TableRow key={i} className="text-[13px]">
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] font-semibold",
                          t.imposto === "CBS"
                            ? "border-blue-300 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40"
                            : "border-amber-300 text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40"
                        )}
                      >
                        {t.imposto}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.incidencia}</TableCell>
                    <TableCell className="font-mono text-[12px]">{t.cst}</TableCell>
                    <TableCell className="text-right font-mono text-[12px]">{brl(t.base)}</TableCell>
                    <TableCell className="text-right font-mono text-[12px]">
                      {t.baseReduzida > 0 ? brl(t.baseReduzida) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px]">{t.aliquota}</TableCell>
                    <TableCell className="text-right font-mono text-[12px] font-semibold">
                      {brl(t.valor)}
                    </TableCell>
                    <TableCell className="text-center text-[12px]">{t.digitado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

      </div>
    </div>
  );
}
