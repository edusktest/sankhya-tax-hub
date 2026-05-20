import React, { useState, useMemo } from "react";
import {
  FileStack,
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

type TipoMovimento = "Venda" | "Compra" | "Devolução de Venda" | "Devolução de Compra";

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

interface TituloDocumento {
  id: string;
  dataNegociacao: string;
  empresa: string;
  parceiroNome: string;
  parceiroCNPJ: string;
  tipo: "Receita" | "Despesa";
  tipoMovimento: TipoMovimento;
  nroUnico: string;
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

interface DocumentoMovimento {
  id: string;
  dataNegociacao: string;
  empresa: string;
  empresaCod: string;
  parceiroNome: string;
  parceiroCNPJ: string;
  numero: string;
  chaveDFe: string;
  valor: number;
  totalIBSUF: number;
  totalIBSMun: number;
  totalCBS: number;
  empresaNegociacao: string;
  tipoOperacao: string;
  tipoNegociacao: string;
  dtEntradaSaida: string;
  dtFaturamento: string;
  dtMovimento: string;
  finalidadeOperacao: string;
  nroNFSe: string;
  nroUnico: string;
  serieNota: string;
  statusNota: string;
  notaModelo: string;
  tipoMovimento: TipoMovimento;
  titulos: TituloDocumento[];
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

const MOCK: DocumentoMovimento[] = [
  // ── Venda – 1 título ──────────────────────────────────────────────────────
  {
    id: "1",
    dataNegociacao: "25/04/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Grupo Nexus S.A.",
    parceiroCNPJ: "23.456.789/0001-01",
    numero: "1234",
    chaveDFe: "35260123456789000100550010000012341234567890",
    valor: 11300.0,
    totalIBSUF: 395.5,
    totalIBSMun: 395.5,
    totalCBS: 565.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "25/04/2026",
    dtFaturamento: "25/04/2026",
    dtMovimento: "25/04/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "100.004",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    titulos: [
      {
        id: "t1",
        dataNegociacao: "25/04/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Grupo Nexus S.A.",
        parceiroCNPJ: "23.456.789/0001-01",
        tipo: "Receita",
        tipoMovimento: "Venda",
        nroUnico: "100.004",
        vlrDesdobramento: 11300.0,
        totalIBSUF: 395.5,
        totalIBSMun: 395.5,
        totalCBS: 565.0,
        nroNota: "NF-001310",
        desdob: "001/001",
        tipoOperacao: "1.201 - Recebimento",
        dtEntradaSaida: "25/04/2026",
        dtVencimento: "25/05/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
        tributos: [
          { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 11300, baseReduzida: 0, aliquota: "5,00%", valor: 565.0,  digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 11300, baseReduzida: 0, aliquota: "3,50%", valor: 395.5,  digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 11300, baseReduzida: 0, aliquota: "3,50%", valor: 395.5,  digitado: "Não" },
        ],
      },
    ],
  },

  // ── Venda – 3 títulos (A Prazo) ───────────────────────────────────────────
  {
    id: "2",
    dataNegociacao: "07/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Comércio Leste Ltda",
    parceiroCNPJ: "77.888.999/0001-55",
    numero: "2200",
    chaveDFe: "35260267890100000123550010000022001234567891",
    valor: 29800.0,
    totalIBSUF: 1043.0,
    totalIBSMun: 1043.0,
    totalCBS: 1490.0,
    empresaNegociacao: "002 - Sankhya São Paulo S.A.",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Prazo",
    dtEntradaSaida: "07/05/2026",
    dtFaturamento: "07/05/2026",
    dtMovimento: "07/05/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "200.020",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    titulos: [
      {
        id: "t2a",
        dataNegociacao: "07/05/2026",
        empresa: "002 - Sankhya São Paulo S.A.",
        parceiroNome: "Comércio Leste Ltda",
        parceiroCNPJ: "77.888.999/0001-55",
        tipo: "Receita",
        tipoMovimento: "Venda",
        nroUnico: "200.021",
        vlrDesdobramento: 9933.34,
        totalIBSUF: 347.67,
        totalIBSMun: 347.67,
        totalCBS: 496.67,
        nroNota: "NF-002200",
        desdob: "001/003",
        tipoOperacao: "1.201 - Recebimento",
        dtEntradaSaida: "07/05/2026",
        dtVencimento: "07/06/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
        tributos: [
          { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 9933.34, baseReduzida: 0, aliquota: "5,00%", valor: 496.67, digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 9933.34, baseReduzida: 0, aliquota: "3,50%", valor: 347.67, digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 9933.34, baseReduzida: 0, aliquota: "3,50%", valor: 347.67, digitado: "Não" },
        ],
      },
      {
        id: "t2b",
        dataNegociacao: "07/05/2026",
        empresa: "002 - Sankhya São Paulo S.A.",
        parceiroNome: "Comércio Leste Ltda",
        parceiroCNPJ: "77.888.999/0001-55",
        tipo: "Receita",
        tipoMovimento: "Venda",
        nroUnico: "200.022",
        vlrDesdobramento: 9933.33,
        totalIBSUF: 347.67,
        totalIBSMun: 347.67,
        totalCBS: 496.67,
        nroNota: "NF-002200",
        desdob: "002/003",
        tipoOperacao: "1.201 - Recebimento",
        dtEntradaSaida: "07/05/2026",
        dtVencimento: "07/07/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
        tributos: [
          { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 9933.33, baseReduzida: 0, aliquota: "5,00%", valor: 496.67, digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 9933.33, baseReduzida: 0, aliquota: "3,50%", valor: 347.67, digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 9933.33, baseReduzida: 0, aliquota: "3,50%", valor: 347.67, digitado: "Não" },
        ],
      },
      {
        id: "t2c",
        dataNegociacao: "07/05/2026",
        empresa: "002 - Sankhya São Paulo S.A.",
        parceiroNome: "Comércio Leste Ltda",
        parceiroCNPJ: "77.888.999/0001-55",
        tipo: "Receita",
        tipoMovimento: "Venda",
        nroUnico: "200.023",
        vlrDesdobramento: 9933.33,
        totalIBSUF: 347.66,
        totalIBSMun: 347.66,
        totalCBS: 496.66,
        nroNota: "NF-002200",
        desdob: "003/003",
        tipoOperacao: "1.201 - Recebimento",
        dtEntradaSaida: "07/05/2026",
        dtVencimento: "07/08/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
        tributos: [
          { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 9933.33, baseReduzida: 0, aliquota: "5,00%", valor: 496.66, digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 9933.33, baseReduzida: 0, aliquota: "3,50%", valor: 347.66, digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 9933.33, baseReduzida: 0, aliquota: "3,50%", valor: 347.66, digitado: "Não" },
        ],
      },
    ],
  },

  // ── Compra – 1 título ─────────────────────────────────────────────────────
  {
    id: "3",
    dataNegociacao: "05/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Materiais Omega S.A.",
    parceiroCNPJ: "88.999.000/0001-33",
    numero: "6100",
    chaveDFe: "35260288999000000133550010000061001234567892",
    valor: 21500.0,
    totalIBSUF: 752.5,
    totalIBSMun: 752.5,
    totalCBS: 1075.0,
    empresaNegociacao: "002 - Sankhya São Paulo S.A.",
    tipoOperacao: "2.101 - Compra de Mercadoria",
    tipoNegociacao: "A Prazo",
    dtEntradaSaida: "05/05/2026",
    dtFaturamento: "05/05/2026",
    dtMovimento: "05/05/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "600.020",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Compra",
    titulos: [
      {
        id: "t3",
        dataNegociacao: "05/05/2026",
        empresa: "002 - Sankhya São Paulo S.A.",
        parceiroNome: "Materiais Omega S.A.",
        parceiroCNPJ: "88.999.000/0001-33",
        tipo: "Despesa",
        tipoMovimento: "Compra",
        nroUnico: "600.020",
        vlrDesdobramento: 21500.0,
        totalIBSUF: 752.5,
        totalIBSMun: 752.5,
        totalCBS: 1075.0,
        nroNota: "NF-600100",
        desdob: "001/001",
        tipoOperacao: "2.101 - Pagamento",
        dtEntradaSaida: "05/05/2026",
        dtVencimento: "05/06/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
        tributos: [
          { imposto: "CBS",     incidencia: "Entrada", cst: "50", base: 21500, baseReduzida: 0, aliquota: "5,00%", valor: 1075.0, digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Entrada", cst: "50", base: 21500, baseReduzida: 0, aliquota: "3,50%", valor:  752.5, digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Entrada", cst: "50", base: 21500, baseReduzida: 0, aliquota: "3,50%", valor:  752.5, digitado: "Não" },
        ],
      },
    ],
  },

  // ── Compra – 1 título ─────────────────────────────────────────────────────
  {
    id: "4",
    dataNegociacao: "14/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Distribuidora Beta S.A.",
    parceiroCNPJ: "55.666.777/0001-88",
    numero: "5210",
    chaveDFe: "35260255666777000188550010000052101234567893",
    valor: 5100.0,
    totalIBSUF: 178.5,
    totalIBSMun: 178.5,
    totalCBS: 255.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "2.101 - Compra de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "14/05/2026",
    dtFaturamento: "14/05/2026",
    dtMovimento: "14/05/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "500.005",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Compra",
    titulos: [
      {
        id: "t4",
        dataNegociacao: "14/05/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Distribuidora Beta S.A.",
        parceiroCNPJ: "55.666.777/0001-88",
        tipo: "Despesa",
        tipoMovimento: "Compra",
        nroUnico: "500.005",
        vlrDesdobramento: 5100.0,
        totalIBSUF: 178.5,
        totalIBSMun: 178.5,
        totalCBS: 255.0,
        nroNota: "NF-500210",
        desdob: "001/001",
        tipoOperacao: "2.101 - Pagamento",
        dtEntradaSaida: "14/05/2026",
        dtVencimento: "14/06/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
        tributos: [
          { imposto: "CBS",     incidencia: "Entrada", cst: "50", base: 5100, baseReduzida: 0, aliquota: "5,00%", valor: 255.0, digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Entrada", cst: "50", base: 5100, baseReduzida: 0, aliquota: "3,50%", valor: 178.5, digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Entrada", cst: "50", base: 5100, baseReduzida: 0, aliquota: "3,50%", valor: 178.5, digitado: "Não" },
        ],
      },
    ],
  },

  // ── Devolução de Venda – 1 título ─────────────────────────────────────────
  {
    id: "5",
    dataNegociacao: "12/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Grupo Nexus S.A.",
    parceiroCNPJ: "23.456.789/0001-01",
    numero: "1310",
    chaveDFe: "35260123456789000100550010000013101234567894",
    valor: 5650.0,
    totalIBSUF: 197.75,
    totalIBSMun: 197.75,
    totalCBS: 282.5,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.202 - Devolução de Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "12/05/2026",
    dtFaturamento: "12/05/2026",
    dtMovimento: "12/05/2026",
    finalidadeOperacao: "Devolução",
    nroNFSe: "—",
    nroUnico: "100.009",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Devolução de Venda",
    titulos: [
      {
        id: "t5",
        dataNegociacao: "12/05/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Grupo Nexus S.A.",
        parceiroCNPJ: "23.456.789/0001-01",
        tipo: "Despesa",
        tipoMovimento: "Devolução de Venda",
        nroUnico: "100.009",
        vlrDesdobramento: 5650.0,
        totalIBSUF: 197.75,
        totalIBSMun: 197.75,
        totalCBS: 282.5,
        nroNota: "NF-001310",
        desdob: "001/001",
        tipoOperacao: "1.202 - Estorno",
        dtEntradaSaida: "12/05/2026",
        dtVencimento: "12/05/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
        tributos: [
          { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 5650, baseReduzida: 0, aliquota: "5,00%", valor: 282.5,  digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 5650, baseReduzida: 0, aliquota: "3,50%", valor: 197.75, digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 5650, baseReduzida: 0, aliquota: "3,50%", valor: 197.75, digitado: "Não" },
        ],
      },
    ],
  },

  // ── Devolução de Compra – 2 títulos ──────────────────────────────────────
  {
    id: "6",
    dataNegociacao: "16/05/2026",
    empresa: "003 - Distribuidora Norte Ltda",
    empresaCod: "003",
    parceiroNome: "Materiais Omega S.A.",
    parceiroCNPJ: "88.999.000/0001-33",
    numero: "180",
    chaveDFe: "35260288999000000133550010000001801234567895",
    valor: 8400.0,
    totalIBSUF: 294.0,
    totalIBSMun: 294.0,
    totalCBS: 420.0,
    empresaNegociacao: "003 - Distribuidora Norte Ltda",
    tipoOperacao: "2.202 - Devolução de Compra de Mercadoria",
    tipoNegociacao: "A Prazo",
    dtEntradaSaida: "16/05/2026",
    dtFaturamento: "16/05/2026",
    dtMovimento: "16/05/2026",
    finalidadeOperacao: "Devolução",
    nroNFSe: "—",
    nroUnico: "300.010",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Devolução de Compra",
    titulos: [
      {
        id: "t6a",
        dataNegociacao: "16/05/2026",
        empresa: "003 - Distribuidora Norte Ltda",
        parceiroNome: "Materiais Omega S.A.",
        parceiroCNPJ: "88.999.000/0001-33",
        tipo: "Receita",
        tipoMovimento: "Devolução de Compra",
        nroUnico: "300.011",
        vlrDesdobramento: 4200.0,
        totalIBSUF: 147.0,
        totalIBSMun: 147.0,
        totalCBS: 210.0,
        nroNota: "NF-000180",
        desdob: "001/002",
        tipoOperacao: "2.202 - Estorno",
        dtEntradaSaida: "16/05/2026",
        dtVencimento: "16/06/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
        tributos: [
          { imposto: "CBS",     incidencia: "Entrada", cst: "50", base: 4200, baseReduzida: 0, aliquota: "5,00%", valor: 210.0, digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Entrada", cst: "50", base: 4200, baseReduzida: 0, aliquota: "3,50%", valor: 147.0, digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Entrada", cst: "50", base: 4200, baseReduzida: 0, aliquota: "3,50%", valor: 147.0, digitado: "Não" },
        ],
      },
      {
        id: "t6b",
        dataNegociacao: "16/05/2026",
        empresa: "003 - Distribuidora Norte Ltda",
        parceiroNome: "Materiais Omega S.A.",
        parceiroCNPJ: "88.999.000/0001-33",
        tipo: "Receita",
        tipoMovimento: "Devolução de Compra",
        nroUnico: "300.012",
        vlrDesdobramento: 4200.0,
        totalIBSUF: 147.0,
        totalIBSMun: 147.0,
        totalCBS: 210.0,
        nroNota: "NF-000180",
        desdob: "002/002",
        tipoOperacao: "2.202 - Estorno",
        dtEntradaSaida: "16/05/2026",
        dtVencimento: "16/07/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
        tributos: [
          { imposto: "CBS",     incidencia: "Entrada", cst: "50", base: 4200, baseReduzida: 0, aliquota: "5,00%", valor: 210.0, digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Entrada", cst: "50", base: 4200, baseReduzida: 0, aliquota: "3,50%", valor: 147.0, digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Entrada", cst: "50", base: 4200, baseReduzida: 0, aliquota: "3,50%", valor: 147.0, digitado: "Não" },
        ],
      },
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

function tipoMovClass(t: TipoMovimento): string {
  if (t === "Venda")               return "text-blue-700 dark:text-blue-400";
  if (t === "Compra")              return "text-amber-700 dark:text-amber-500";
  if (t === "Devolução de Venda")  return "text-rose-700 dark:text-rose-400";
  if (t === "Devolução de Compra") return "text-blue-700 dark:text-blue-400";
  return "";
}

function centralLabel(tm: TipoMovimento): string {
  return ["Venda", "Devolução de Venda"].includes(tm)
    ? "Central de Vendas"
    : "Central de Compra";
}

// ─── Shared sub-components ────────────────────────────────────────────────────

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

// ─── Main Page ────────────────────────────────────────────────────────────────

type View = "list" | "doc-detail" | "titulo-detail";

export default function MovimentacoesDocumentosMovimento() {
  const [view, setView] = useState<View>("list");
  const [selectedDoc, setSelectedDoc] = useState<DocumentoMovimento | null>(null);
  const [selectedTitulo, setSelectedTitulo] = useState<TituloDocumento | null>(null);
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

  if (view === "titulo-detail" && selectedTitulo && selectedDoc) {
    return (
      <TituloDetailView
        titulo={selectedTitulo}
        onBack={() => { setView("doc-detail"); setSelectedTitulo(null); }}
      />
    );
  }

  if (view === "doc-detail" && selectedDoc) {
    return (
      <DocumentDetailView
        doc={selectedDoc}
        onBack={() => { setView("list"); setSelectedDoc(null); }}
        onDetalhaTitulo={(t) => { setSelectedTitulo(t); setView("titulo-detail"); }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-1">
          <FileStack className="h-3.5 w-3.5" />
          <span>Movimentações</span>
          <ChevronRight className="h-3 w-3" />
          <span>Documentos</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Movimento</span>
        </div>
        <h1 className="text-[18px] font-semibold">Documentos — Movimento</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Documentos fiscais eletrônicos com tributos CBS e IBS · a partir de 01/01/2026
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
                    <TableHead className="text-[12px]">Tipo de Movimento</TableHead>
                    <TableHead className="text-[12px]">Número</TableHead>
                    <TableHead className="text-[12px]">Chave DFe</TableHead>
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
                      <TableCell className={cn("font-medium whitespace-nowrap", tipoMovClass(r.tipoMovimento))}>
                        {r.tipoMovimento}
                      </TableCell>
                      <TableCell className="font-mono">{r.numero}</TableCell>
                      <TableCell className="max-w-[160px]">
                        <span className="font-mono text-[11px] text-muted-foreground truncate block" title={r.chaveDFe}>
                          {r.chaveDFe}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{brl(r.valor)}</TableCell>
                      <TableCell className="text-right font-mono">{brl(r.totalIBSUF)}</TableCell>
                      <TableCell className="text-right font-mono">{brl(r.totalIBSMun)}</TableCell>
                      <TableCell className="text-right font-mono">{brl(r.totalCBS)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[12px] gap-1"
                          onClick={() => { setSelectedDoc(r); setView("doc-detail"); }}
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

// ─── Document Detail View ─────────────────────────────────────────────────────

function DocumentDetailView({
  doc: d,
  onBack,
  onDetalhaTitulo,
}: {
  doc: DocumentoMovimento;
  onBack: () => void;
  onDetalhaTitulo: (t: TituloDocumento) => void;
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
            <FileStack className="h-3.5 w-3.5 shrink-0" />
            <span>Documentos</span>
            <ChevronRight className="h-3 w-3" />
            <span>Movimento</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium truncate">Nro {d.numero}</span>
          </div>
          <h1 className="text-[16px] font-semibold">Detalhamento do Documento</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            {centralLabel(d.tipoMovimento)}
          </Button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-6">

        {/* Resumo do Documento */}
        <section>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Resumo do Documento
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <SummaryCard label="Dt. Negociação"   value={d.dataNegociacao}  mono />
            <SummaryCard label="Empresa"           value={d.empresa}              />
            <SummaryCard label="Parceiro"          value={d.parceiroNome}         />
            <SummaryCard
              label="Tipo de Movimento"
              value={d.tipoMovimento}
              colorClass={tipoMovClass(d.tipoMovimento)}
            />
            <SummaryCard label="Número"            value={d.numero}         mono />
            <SummaryCard label="Valor"             value={brl(d.valor)}     mono />
            <SummaryCard label="Total CBS"         value={brl(d.totalCBS)}  mono />
            <SummaryCard label="Total IBS UF"      value={brl(d.totalIBSUF)} mono />
            <SummaryCard label="Total IBS Mun"     value={brl(d.totalIBSMun)} mono />
            <div className="col-span-2 md:col-span-3 overflow-hidden">
              <div className="rounded-lg border bg-card p-3 overflow-hidden">
                <div className="text-[11px] text-muted-foreground mb-0.5">Chave DFe</div>
                <div className="font-mono text-[11px] text-foreground break-all leading-relaxed min-w-0">{d.chaveDFe}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Detalhes do Documento — TGFCAB */}
        <section>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Detalhes do Documento
          </h2>
          <div className="rounded-lg border bg-card p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-4">
              <DetailField label="Chave DFe"              value={d.chaveDFe}              mono />
              <DetailField label="Empresa"                value={d.empresa}                    />
              <DetailField label="Empresa da Negociação"  value={d.empresaNegociacao}           />
              <DetailField label="Parceiro"               value={d.parceiroNome}                />
              <DetailField label="Tipo de Movimento"      value={d.tipoMovimento}               />
              <DetailField label="Tipo Operação"          value={d.tipoOperacao}                />
              <DetailField label="Tipo Negociação"        value={d.tipoNegociacao}              />
              <DetailField label="Dt. Entrada/Saída"      value={d.dtEntradaSaida}         mono />
              <DetailField label="Dt. do Faturamento"     value={d.dtFaturamento}          mono />
              <DetailField label="Dt. do Movimento"       value={d.dtMovimento}            mono />
              <DetailField label="Dt. Neg."               value={d.dataNegociacao}         mono />
              <DetailField label="Finalidade da Operação" value={d.finalidadeOperacao}          />
              <DetailField label="Nro. NFS-e"             value={d.nroNFSe}               mono />
              <DetailField label="Nro. Nota"              value={d.numero}                mono />
              <DetailField label="Nro. Único"             value={d.nroUnico}              mono />
              <DetailField label="Série da Nota"          value={d.serieNota}             mono />
              <DetailField label="Status da Nota"         value={d.statusNota}                 />
              <DetailField label="Nota Modelo"            value={d.notaModelo}                 />
              <DetailField label="Vlr. Nota"              value={brl(d.valor)}            mono />
            </div>
          </div>
        </section>

        {/* Títulos do Documento */}
        <section>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Títulos do Documento
            <span className="ml-2 font-normal text-muted-foreground normal-case tracking-normal">
              ({d.titulos.length} título{d.titulos.length !== 1 ? "s" : ""})
            </span>
          </h2>
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
                {d.titulos.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/40 text-[13px]">
                    <TableCell className="font-mono text-[12px]">{t.dataNegociacao}</TableCell>
                    <TableCell>{t.empresa}</TableCell>
                    <TableCell>
                      <div>{t.parceiroNome}</div>
                      <div className="text-[11px] text-muted-foreground">{t.parceiroCNPJ}</div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-[13px] font-medium",
                        t.tipo === "Receita"
                          ? "text-blue-700 dark:text-blue-400"
                          : "text-red-700 dark:text-red-400"
                      )}
                    >
                      {t.tipo}
                    </TableCell>
                    <TableCell className="font-mono">{t.nroUnico}</TableCell>
                    <TableCell className="text-right font-mono">{brl(t.vlrDesdobramento)}</TableCell>
                    <TableCell className="text-right font-mono">{brl(t.totalIBSUF)}</TableCell>
                    <TableCell className="text-right font-mono">{brl(t.totalIBSMun)}</TableCell>
                    <TableCell className="text-right font-mono">{brl(t.totalCBS)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[12px] gap-1"
                        onClick={() => onDetalhaTitulo(t)}
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
        </section>

      </div>
    </div>
  );
}

// ─── Título Detail View ───────────────────────────────────────────────────────

function TituloDetailView({
  titulo: t,
  onBack,
}: {
  titulo: TituloDocumento;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-[13px]" onClick={onBack}>
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          Voltar ao Documento
        </Button>
        <div className="h-4 w-px bg-border" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-0.5">
            <FileStack className="h-3.5 w-3.5 shrink-0" />
            <span>Documentos</span>
            <ChevronRight className="h-3 w-3" />
            <span>Títulos</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium truncate">Nro Único {t.nroUnico}</span>
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
            {centralLabel(t.tipoMovimento)}
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
            <SummaryCard label="Dt. Negociação"    value={t.dataNegociacao}        mono />
            <SummaryCard label="Empresa"           value={t.empresa}                    />
            <SummaryCard label="Parceiro"          value={t.parceiroNome}               />
            <SummaryCard label="Nro Único"         value={t.nroUnico}              mono />
            <SummaryCard
              label="Tipo de Movimento"
              value={t.tipoMovimento}
              colorClass={tipoMovClass(t.tipoMovimento)}
            />
            <SummaryCard label="Valor"             value={brl(t.vlrDesdobramento)} mono />
            <SummaryCard label="Total CBS"         value={brl(t.totalCBS)}         mono />
            <SummaryCard label="Total IBS UF"      value={brl(t.totalIBSUF)}       mono />
            <SummaryCard label="Total IBS Mun"     value={brl(t.totalIBSMun)}      mono />
          </div>
        </section>

        {/* Detalhes do Título — TGFFIN */}
        <section>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Detalhes do Título
          </h2>
          <div className="rounded-lg border bg-card p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-4">
              <DetailField label="Nro Único"         value={t.nroUnico}               mono />
              <DetailField label="Empresa"           value={t.empresa}                     />
              <DetailField label="Parceiro"          value={t.parceiroNome}                />
              <DetailField label="Tipo de Movimento" value={t.tipoMovimento}               />
              <DetailField label="Nro Nota"          value={t.nroNota}                mono />
              <DetailField label="Desdobramento"     value={t.desdob}                 mono />
              <DetailField label="Tipo Operação"     value={t.tipoOperacao}                />
              <DetailField label="Dt. Negociação"    value={t.dataNegociacao}         mono />
              <DetailField label="Dt. Entrada/Saída" value={t.dtEntradaSaida}         mono />
              <DetailField label="Dt. Vencimento"    value={t.dtVencimento}           mono />
              <DetailField label="Vlr Desdobramento" value={brl(t.vlrDesdobramento)}  mono />
              <DetailField label="Vlr Desconto"      value={brl(t.vlrDesconto)}       mono />
              <DetailField label="Vlr Multa"         value={brl(t.vlrMulta)}          mono />
              <DetailField label="Vlr Juros"         value={brl(t.vlrJuros)}          mono />
              <DetailField label="Vlr Baixa"         value={brl(t.vlrBaixa)}          mono />
              <DetailField label="Data Baixa"        value={t.dataBaixa}              mono />
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
                {t.tributos.map((tri, i) => (
                  <TableRow key={i} className="text-[13px]">
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] font-semibold",
                          tri.imposto === "CBS"
                            ? "border-blue-300 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40"
                            : "border-amber-300 text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40"
                        )}
                      >
                        {tri.imposto}
                      </Badge>
                    </TableCell>
                    <TableCell>{tri.incidencia}</TableCell>
                    <TableCell className="font-mono text-[12px]">{tri.cst}</TableCell>
                    <TableCell className="text-right font-mono text-[12px]">{brl(tri.base)}</TableCell>
                    <TableCell className="text-right font-mono text-[12px]">
                      {tri.baseReduzida > 0 ? brl(tri.baseReduzida) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12px]">{tri.aliquota}</TableCell>
                    <TableCell className="text-right font-mono text-[12px] font-semibold">{brl(tri.valor)}</TableCell>
                    <TableCell className="text-center text-[12px]">{tri.digitado}</TableCell>
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
