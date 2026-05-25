import React, { useState, useMemo } from "react";
import {
  TrendingUp,
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

interface TituloRef {
  id: string;
  dataNegociacao: string;
  empresa: string;
  parceiroNome: string;
  parceiroCNPJ: string;
  tipo: "Receita" | "Despesa";
  tipoMovimento: string;
  nroUnico: string;
  nroNota: string;
  vlrDesdobramento: number;
  totalIBSUF: number;
  totalIBSMun: number;
  totalCBS: number;
  tributos?: Tributo[];
  tributosDevolvidos?: Tributo[];
}

interface ReceitaMovimento {
  id: string;
  dataNegociacao: string;
  empresa: string;
  empresaCod: string;
  parceiroNome: string;
  parceiroCNPJ: string;
  nroUnico: string;
  tipo: "Receita" | "Despesa";
  tipoMovimento: string;
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
  tributosDevolvidos?: Tributo[];
  tituloRef?: TituloRef;
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

const MOCK: ReceitaMovimento[] = [
  {
    id: "1",
    dataNegociacao: "10/01/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Comércio Brasil Ltda",
    parceiroCNPJ: "45.678.901/0001-23",
    nroUnico: "100.001",
    tipo: "Receita",
    tipoMovimento: "Venda",
    vlrDesdobramento: 24500.0,
    totalIBSUF: 857.5,
    totalIBSMun: 857.5,
    totalCBS: 1225.0,
    nroNota: "NF-001234",
    desdob: "001/001",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "10/01/2026",
    dtVencimento: "10/02/2026",
    vlrDesconto: 0,
    vlrMulta: 0,
    vlrJuros: 0,
    vlrBaixa: 24500.0,
    dataBaixa: "10/02/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 24500, baseReduzida: 0, aliquota: "5,00%", valor: 1225.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 24500, baseReduzida: 0, aliquota: "3,50%", valor:  857.5, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 24500, baseReduzida: 0, aliquota: "3,50%", valor:  857.5, digitado: "Não" },
    ],
  },
  {
    id: "2",
    dataNegociacao: "18/01/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Tech Solutions S.A.",
    parceiroCNPJ: "67.890.123/0001-45",
    nroUnico: "100.002",
    tipo: "Receita",
    tipoMovimento: "Venda",
    vlrDesdobramento: 8750.0,
    totalIBSUF: 306.25,
    totalIBSMun: 306.25,
    totalCBS: 437.5,
    nroNota: "NF-001235",
    desdob: "001/002",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "18/01/2026",
    dtVencimento: "18/02/2026",
    vlrDesconto: 250.0,
    vlrMulta: 0,
    vlrJuros: 0,
    vlrBaixa: 0,
    dataBaixa: "—",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 8750, baseReduzida: 0, aliquota: "5,00%", valor: 437.50, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 8750, baseReduzida: 0, aliquota: "3,50%", valor: 306.25, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 8750, baseReduzida: 0, aliquota: "3,50%", valor: 306.25, digitado: "Não" },
    ],
  },
  {
    id: "3",
    dataNegociacao: "05/02/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Indústria Sul Ltda",
    parceiroCNPJ: "12.345.678/0001-90",
    nroUnico: "200.015",
    tipo: "Receita",
    tipoMovimento: "Venda",
    vlrDesdobramento: 52000.0,
    totalIBSUF: 1820.0,
    totalIBSMun: 1820.0,
    totalCBS: 2600.0,
    nroNota: "NF-002100",
    desdob: "001/001",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "05/02/2026",
    dtVencimento: "05/03/2026",
    vlrDesconto: 0,
    vlrMulta: 0,
    vlrJuros: 0,
    vlrBaixa: 52000.0,
    dataBaixa: "05/03/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 52000, baseReduzida: 0, aliquota: "5,00%", valor: 2600.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 52000, baseReduzida: 0, aliquota: "3,50%", valor: 1820.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 52000, baseReduzida: 0, aliquota: "3,50%", valor: 1820.0, digitado: "Não" },
    ],
  },
  {
    id: "4",
    dataNegociacao: "22/02/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Varejo Central S.A.",
    parceiroCNPJ: "98.765.432/0001-11",
    nroUnico: "100.003",
    tipo: "Receita",
    tipoMovimento: "Venda",
    vlrDesdobramento: 3200.0,
    totalIBSUF: 112.0,
    totalIBSMun: 112.0,
    totalCBS: 160.0,
    nroNota: "NF-001250",
    desdob: "001/003",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "22/02/2026",
    dtVencimento: "22/03/2026",
    vlrDesconto: 0,
    vlrMulta: 64.0,
    vlrJuros: 38.4,
    vlrBaixa: 3302.4,
    dataBaixa: "25/03/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 3200, baseReduzida: 0, aliquota: "5,00%", valor: 160.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 3200, baseReduzida: 0, aliquota: "3,50%", valor: 112.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 3200, baseReduzida: 0, aliquota: "3,50%", valor: 112.0, digitado: "Não" },
    ],
  },
  {
    id: "5",
    dataNegociacao: "25/04/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Grupo Nexus S.A.",
    parceiroCNPJ: "23.456.789/0001-01",
    nroUnico: "100.004",
    tipo: "Receita",
    tipoMovimento: "Venda",
    vlrDesdobramento: 11300.0,
    totalIBSUF: 395.5,
    totalIBSMun: 395.5,
    totalCBS: 565.0,
    nroNota: "NF-001310",
    desdob: "001/001",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "25/04/2026",
    dtVencimento: "25/05/2026",
    vlrDesconto: 0,
    vlrMulta: 0,
    vlrJuros: 0,
    vlrBaixa: 0,
    dataBaixa: "—",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 11300, baseReduzida: 0, aliquota: "5,00%", valor: 565.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 11300, baseReduzida: 0, aliquota: "3,50%", valor: 395.5, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 11300, baseReduzida: 0, aliquota: "3,50%", valor: 395.5, digitado: "Não" },
    ],
  },
  {
    id: "6",
    dataNegociacao: "07/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Comércio Leste Ltda",
    parceiroCNPJ: "77.888.999/0001-55",
    nroUnico: "200.020",
    tipo: "Receita",
    tipoMovimento: "Venda",
    vlrDesdobramento: 29800.0,
    totalIBSUF: 1043.0,
    totalIBSMun: 1043.0,
    totalCBS: 1490.0,
    nroNota: "NF-002200",
    desdob: "001/001",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "07/05/2026",
    dtVencimento: "07/06/2026",
    vlrDesconto: 0,
    vlrMulta: 0,
    vlrJuros: 0,
    vlrBaixa: 0,
    dataBaixa: "—",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 29800, baseReduzida: 0, aliquota: "5,00%", valor: 1490.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 29800, baseReduzida: 0, aliquota: "3,50%", valor: 1043.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 29800, baseReduzida: 0, aliquota: "3,50%", valor: 1043.0, digitado: "Não" },
    ],
  },
  {
    id: "7",
    dataNegociacao: "16/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Tech Solutions S.A.",
    parceiroCNPJ: "67.890.123/0001-45",
    nroUnico: "100.005",
    tipo: "Receita",
    tipoMovimento: "Venda",
    vlrDesdobramento: 7600.0,
    totalIBSUF: 266.0,
    totalIBSMun: 266.0,
    totalCBS: 380.0,
    nroNota: "NF-001320",
    desdob: "001/001",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "16/05/2026",
    dtVencimento: "16/06/2026",
    vlrDesconto: 0,
    vlrMulta: 0,
    vlrJuros: 0,
    vlrBaixa: 0,
    dataBaixa: "—",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 7600, baseReduzida: 0, aliquota: "5,00%", valor: 380.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 7600, baseReduzida: 0, aliquota: "3,50%", valor: 266.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 7600, baseReduzida: 0, aliquota: "3,50%", valor: 266.0, digitado: "Não" },
    ],
  },

  // ── Venda – Atacado Regional Ltda (devolução parcial 40% → 950.001) ────────
  {
    id: "9",
    dataNegociacao: "12/05/2026",
    empresa: "003 - Distribuidora Norte Ltda",
    empresaCod: "003",
    parceiroNome: "Atacado Regional Ltda",
    parceiroCNPJ: "33.444.555/0001-99",
    nroUnico: "900.001",
    tipo: "Receita",
    tipoMovimento: "Venda",
    vlrDesdobramento: 8400.0,
    totalIBSUF: 294.0,
    totalIBSMun: 294.0,
    totalCBS: 420.0,
    nroNota: "NF-003200",
    desdob: "001/001",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "12/05/2026",
    dtVencimento: "12/06/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 8400, baseReduzida: 0, aliquota: "5,00%", valor:  420.0,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 8400, baseReduzida: 0, aliquota: "3,50%", valor:  294.0,  digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 8400, baseReduzida: 0, aliquota: "3,50%", valor:  294.0,  digitado: "Não" },
    ],
    tributosDevolvidos: [
      { imposto: "CBS",     incidencia: "Devolução", cst: "01", base: -3360, baseReduzida: 0, aliquota: "5,00%", valor: -168.0,   digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Devolução", cst: "01", base: -3360, baseReduzida: 0, aliquota: "3,50%", valor: -117.60,  digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Devolução", cst: "01", base: -3360, baseReduzida: 0, aliquota: "3,50%", valor: -117.60,  digitado: "Não" },
    ],
    tituloRef: {
      id: "t10",
      dataNegociacao: "20/05/2026",
      empresa: "003 - Distribuidora Norte Ltda",
      parceiroNome: "Atacado Regional Ltda",
      parceiroCNPJ: "33.444.555/0001-99",
      tipo: "Despesa",
      tipoMovimento: "Devolução de Venda",
      nroUnico: "950.001",
      nroNota: "NF-003250",
      vlrDesdobramento: 3360.0,
      totalIBSUF: 117.60,
      totalIBSMun: 117.60,
      totalCBS: 168.0,
    },
  },

  // ── Venda – Indústria Central Ltda (devolução total → 800.001) ─────────────
  {
    id: "8",
    dataNegociacao: "08/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Indústria Central Ltda",
    parceiroCNPJ: "44.555.666/0001-22",
    nroUnico: "700.001",
    tipo: "Receita",
    tipoMovimento: "Venda",
    vlrDesdobramento: 18600.0,
    totalIBSUF: 651.0,
    totalIBSMun: 651.0,
    totalCBS: 930.0,
    nroNota: "NF-003050",
    desdob: "001/001",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "08/05/2026",
    dtVencimento: "08/05/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 18600, baseReduzida: 0, aliquota: "5,00%", valor: 930.0,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 18600, baseReduzida: 0, aliquota: "3,50%", valor: 651.0,  digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 18600, baseReduzida: 0, aliquota: "3,50%", valor: 651.0,  digitado: "Não" },
    ],
    tributosDevolvidos: [
      { imposto: "CBS",     incidencia: "Devolução", cst: "01", base: -18600, baseReduzida: 0, aliquota: "5,00%", valor: -930.0,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Devolução", cst: "01", base: -18600, baseReduzida: 0, aliquota: "3,50%", valor: -651.0,  digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Devolução", cst: "01", base: -18600, baseReduzida: 0, aliquota: "3,50%", valor: -651.0,  digitado: "Não" },
    ],
    tituloRef: {
      id: "t8",
      dataNegociacao: "19/05/2026",
      empresa: "002 - Sankhya São Paulo S.A.",
      parceiroNome: "Indústria Central Ltda",
      parceiroCNPJ: "44.555.666/0001-22",
      tipo: "Despesa",
      tipoMovimento: "Devolução de Venda",
      nroUnico: "800.001",
      nroNota: "NF-003100",
      vlrDesdobramento: 18600.0,
      totalIBSUF: 651.0,
      totalIBSMun: 651.0,
      totalCBS: 930.0,
    },
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

export default function MovimentacoesReceitasMovimento() {
  const [view, setView] = useState<"list" | "detail" | "ref-detail">("list");
  const [selected, setSelected] = useState<ReceitaMovimento | null>(null);
  const [selectedRef, setSelectedRef] = useState<TituloRef | null>(null);
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

  if (view === "ref-detail" && selectedRef && selected) {
    return (
      <RefDetailView
        tituloRef={selectedRef}
        parentRecord={selected}
        onBack={() => { setView("detail"); setSelectedRef(null); }}
      />
    );
  }

  if (view === "detail" && selected) {
    return (
      <DetailView
        record={selected}
        onBack={() => { setView("list"); setSelected(null); }}
        onDetalharTituloRef={(ref) => { setSelectedRef(ref); setView("ref-detail"); }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-1">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Movimentações</span>
          <ChevronRight className="h-3 w-3" />
          <span>Receitas</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Movimento</span>
        </div>
        <h1 className="text-[18px] font-semibold">Receitas — Movimento</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Títulos a receber com tributos CBS e IBS · negociações a partir de 01/01/2026
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

function ImpostoBadge({ imposto }: { imposto: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] font-semibold",
        imposto === "CBS"
          ? "border-blue-300 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40"
          : "border-amber-300 text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40"
      )}
    >
      {imposto}
    </Badge>
  );
}

function TributoTable({
  tributos,
  tributosDevolvidos,
}: {
  tributos: Tributo[];
  tributosDevolvidos?: Tributo[];
}) {
  const contaCorrente = !!tributosDevolvidos;
  return (
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
            {contaCorrente ? (
              <>
                <TableHead className="text-[12px] text-right">Débito</TableHead>
                <TableHead className="text-[12px] text-right">Crédito</TableHead>
              </>
            ) : (
              <TableHead className="text-[12px] text-right">Valor</TableHead>
            )}
            <TableHead className="text-[12px] text-center">Digitado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tributos.map((tri, i) => (
            <TableRow key={`orig-${i}`} className="text-[13px]">
              <TableCell><ImpostoBadge imposto={tri.imposto} /></TableCell>
              <TableCell>{tri.incidencia}</TableCell>
              <TableCell className="font-mono text-[12px]">{tri.cst}</TableCell>
              <TableCell className="text-right font-mono text-[12px]">{brl(tri.base)}</TableCell>
              <TableCell className="text-right font-mono text-[12px]">
                {tri.baseReduzida !== 0 ? brl(tri.baseReduzida) : "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-[12px]">{tri.aliquota}</TableCell>
              {contaCorrente ? (
                <>
                  <TableCell className="text-right font-mono text-[12px] font-semibold">{brl(tri.valor)}</TableCell>
                  <TableCell className="text-right font-mono text-[12px] text-muted-foreground">—</TableCell>
                </>
              ) : (
                <TableCell className="text-right font-mono text-[12px] font-semibold">{brl(tri.valor)}</TableCell>
              )}
              <TableCell className="text-center text-[12px]">{tri.digitado}</TableCell>
            </TableRow>
          ))}
          {tributosDevolvidos?.map((tri, i) => (
            <TableRow key={`dev-${i}`} className="text-[13px] bg-rose-50/40 dark:bg-rose-950/10">
              <TableCell><ImpostoBadge imposto={tri.imposto} /></TableCell>
              <TableCell className="text-rose-600 dark:text-rose-400 font-medium">{tri.incidencia}</TableCell>
              <TableCell className="font-mono text-[12px]">{tri.cst}</TableCell>
              <TableCell className="text-right font-mono text-[12px] text-rose-600 dark:text-rose-400">{brl(tri.base)}</TableCell>
              <TableCell className="text-right font-mono text-[12px] text-muted-foreground">—</TableCell>
              <TableCell className="text-right font-mono text-[12px]">{tri.aliquota}</TableCell>
              <TableCell className="text-right font-mono text-[12px] text-muted-foreground">—</TableCell>
              <TableCell className="text-right font-mono text-[12px] font-semibold text-rose-600 dark:text-rose-400">
                -{brl(Math.abs(tri.valor))}
              </TableCell>
              <TableCell className="text-center text-[12px]">{tri.digitado}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

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
  onDetalharTituloRef,
}: {
  record: ReceitaMovimento;
  onBack: () => void;
  onDetalharTituloRef?: (ref: TituloRef) => void;
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
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            <span>Receitas</span>
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
            Central de Vendas
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
            <SummaryCard label="Total CBS"      value={brl(r.totalCBS)}         mono colorClass="text-blue-700 dark:text-blue-400" />
            <SummaryCard label="Total IBS UF"   value={brl(r.totalIBSUF)}       mono colorClass="text-amber-700 dark:text-amber-400" />
            <SummaryCard label="Total IBS Mun"  value={brl(r.totalIBSMun)}      mono colorClass="text-amber-700 dark:text-amber-400" />
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

        {/* Título Referenciado */}
        {r.tituloRef && (
          <section>
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Título Referenciado
            </h2>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[12px]">Dt. Negociação</TableHead>
                    <TableHead className="text-[12px]">Empresa</TableHead>
                    <TableHead className="text-[12px]">Parceiro</TableHead>
                    <TableHead className="text-[12px]">Tipo</TableHead>
                    <TableHead className="text-[12px]">Tipo de Movimento</TableHead>
                    <TableHead className="text-[12px]">Nro Único</TableHead>
                    <TableHead className="text-[12px]">Nro Nota</TableHead>
                    <TableHead className="text-[12px] text-right">Valor</TableHead>
                    <TableHead className="text-[12px] text-right">Total IBS UF</TableHead>
                    <TableHead className="text-[12px] text-right">Total IBS Mun</TableHead>
                    <TableHead className="text-[12px] text-right">Total CBS</TableHead>
                    <TableHead className="text-[12px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="text-[13px]">
                    <TableCell className="font-mono text-[12px]">{r.tituloRef.dataNegociacao}</TableCell>
                    <TableCell>{r.tituloRef.empresa}</TableCell>
                    <TableCell>
                      <div>{r.tituloRef.parceiroNome}</div>
                      <div className="text-[11px] text-muted-foreground">{r.tituloRef.parceiroCNPJ}</div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-[13px] font-medium",
                        r.tituloRef.tipo === "Receita"
                          ? "text-blue-700 dark:text-blue-400"
                          : "text-red-700 dark:text-red-400"
                      )}
                    >
                      {r.tituloRef.tipo}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{r.tituloRef.tipoMovimento}</TableCell>
                    <TableCell className="font-mono">{r.tituloRef.nroUnico}</TableCell>
                    <TableCell className="font-mono">{r.tituloRef.nroNota}</TableCell>
                    <TableCell className="text-right font-mono">{brl(r.tituloRef.vlrDesdobramento)}</TableCell>
                    <TableCell className="text-right font-mono">{brl(r.tituloRef.totalIBSUF)}</TableCell>
                    <TableCell className="text-right font-mono">{brl(r.tituloRef.totalIBSMun)}</TableCell>
                    <TableCell className="text-right font-mono">{brl(r.tituloRef.totalCBS)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[12px] gap-1"
                        onClick={() => onDetalharTituloRef?.(r.tituloRef!)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Detalhar
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </section>
        )}

        {/* Tributos do Título — TGFIIF */}
        <section>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Tributos do Título
          </h2>
          <TributoTable tributos={r.tributos} tributosDevolvidos={r.tributosDevolvidos} />
        </section>

      </div>
    </div>
  );
}

// ─── Ref Detail View ──────────────────────────────────────────────────────────

function RefDetailView({
  tituloRef: tr,
  parentRecord: p,
  onBack,
}: {
  tituloRef: TituloRef;
  parentRecord: ReceitaMovimento;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-[13px]" onClick={onBack}>
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          Voltar ao Título
        </Button>
        <div className="h-4 w-px bg-border" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-0.5">
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            <span>Receitas</span>
            <ChevronRight className="h-3 w-3" />
            <span>Movimento</span>
            <ChevronRight className="h-3 w-3" />
            <span>Título {p.nroUnico}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium truncate">Título Ref. {tr.nroUnico}</span>
          </div>
          <h1 className="text-[16px] font-semibold">Detalhamento do Título Referenciado</h1>
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
            <SummaryCard label="Dt. Negociação"    value={tr.dataNegociacao}        mono />
            <SummaryCard label="Empresa"           value={tr.empresa}                    />
            <SummaryCard label="Parceiro"          value={tr.parceiroNome}               />
            <SummaryCard label="Nro Único"         value={tr.nroUnico}             mono />
            <SummaryCard label="Tipo de Movimento" value={tr.tipoMovimento}              />
            <SummaryCard label="Valor"             value={brl(tr.vlrDesdobramento)} mono />
            <SummaryCard label="Total CBS"         value={brl(tr.totalCBS)}         mono colorClass="text-blue-700 dark:text-blue-400" />
            <SummaryCard label="Total IBS UF"      value={brl(tr.totalIBSUF)}       mono colorClass="text-amber-700 dark:text-amber-400" />
            <SummaryCard label="Total IBS Mun"     value={brl(tr.totalIBSMun)}      mono colorClass="text-amber-700 dark:text-amber-400" />
          </div>
        </section>

        {/* Título Referenciado — back to parent */}
        <section>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Título Referenciado
          </h2>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-[12px]">Dt. Negociação</TableHead>
                  <TableHead className="text-[12px]">Empresa</TableHead>
                  <TableHead className="text-[12px]">Parceiro</TableHead>
                  <TableHead className="text-[12px]">Tipo</TableHead>
                  <TableHead className="text-[12px]">Tipo de Movimento</TableHead>
                  <TableHead className="text-[12px]">Nro Único</TableHead>
                  <TableHead className="text-[12px]">Nro Nota</TableHead>
                  <TableHead className="text-[12px] text-right">Valor</TableHead>
                  <TableHead className="text-[12px] text-right">Total IBS UF</TableHead>
                  <TableHead className="text-[12px] text-right">Total IBS Mun</TableHead>
                  <TableHead className="text-[12px] text-right">Total CBS</TableHead>
                  <TableHead className="text-[12px] text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="text-[13px]">
                  <TableCell className="font-mono text-[12px]">{p.dataNegociacao}</TableCell>
                  <TableCell>{p.empresa}</TableCell>
                  <TableCell>
                    <div>{p.parceiroNome}</div>
                    <div className="text-[11px] text-muted-foreground">{p.parceiroCNPJ}</div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-[13px] font-medium",
                      p.tipo === "Receita"
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-red-700 dark:text-red-400"
                    )}
                  >
                    {p.tipo}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{p.tipoMovimento}</TableCell>
                  <TableCell className="font-mono">{p.nroUnico}</TableCell>
                  <TableCell className="font-mono">{p.nroNota}</TableCell>
                  <TableCell className="text-right font-mono">{brl(p.vlrDesdobramento)}</TableCell>
                  <TableCell className="text-right font-mono">{brl(p.totalIBSUF)}</TableCell>
                  <TableCell className="text-right font-mono">{brl(p.totalIBSMun)}</TableCell>
                  <TableCell className="text-right font-mono">{brl(p.totalCBS)}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[12px] gap-1"
                      onClick={onBack}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Detalhar
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Tributos do Título — somente quando tituloRef é Receita com tributos */}
        {tr.tipo === "Receita" && tr.tributos && (
          <section>
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Tributos do Título
            </h2>
            <TributoTable tributos={tr.tributos} tributosDevolvidos={tr.tributosDevolvidos} />
          </section>
        )}

      </div>
    </div>
  );
}
