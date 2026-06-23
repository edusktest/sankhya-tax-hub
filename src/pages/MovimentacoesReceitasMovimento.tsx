import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ERoutes } from "@/routes/interface";
import {
  TrendingUp,
  ChevronRight,
  ExternalLink,
  Eye,
  Filter,
  X,
  Link2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  CalendarIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
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
import { CollapsibleSection } from "@/components/ui/collapsible-section";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusDFe = "Não enviado" | "Aguardando autorização" | "Erro" | "Autorizado";

interface DocumentoTitulo {
  nroUnico: string;
  nroNota: string;
  chaveDFe: string;
  statusDFe: StatusDFe;
  finalidade: string;
}

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

interface PedidoTitulo {
  id: string;
  numero: string;
  dataNegociacao: string;
  empresa: string;
  parceiroNome: string;
  parceiroCNPJ: string;
  nroUnico: string;
  valor: number;
  tipoOperacao: string;
}

interface GuiaTituloItem {
  nroUnico: string;
  tipoMovimento: string;
  tipoTitulo: string;
  valor: number;
}

interface ConciliacaoApuracaoAssistida {
  guias: GuiaTituloItem[];
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
  tipoTitulo: string;
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
  tributosMultaJuros?: Tributo[];
  tituloRef?: TituloRef;
  documentos?: DocumentoTitulo[];
  pedidoRef?: PedidoTitulo;
  conciliacaoApuracaoAssistida?: ConciliacaoApuracaoAssistida;
  pendencia?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const EMPRESAS = [
  { cod: "001", nome: "Sankhya Gestão de Negócios Ltda" },
  { cod: "002", nome: "Sankhya São Paulo S.A." },
  { cod: "003", nome: "Distribuidora Norte Ltda" },
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
    tipoTitulo: "Boleto",
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
    documentos: [
      { nroUnico: "100.000", nroNota: "NF-001234", chaveDFe: "35260101234567890001550010000012341000012340", statusDFe: "Autorizado", finalidade: "Normal" },
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
    tipoTitulo: "PIX",
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
    documentos: [
      { nroUnico: "100.002", nroNota: "NF-001235", chaveDFe: "35260101234567890001550010000012351000012350", statusDFe: "Aguardando autorização", finalidade: "Normal" },
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
    tipoTitulo: "Boleto",
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
    documentos: [
      { nroUnico: "200.015", nroNota: "NF-002100", chaveDFe: "35260202345678901002550010000021001000021000", statusDFe: "Autorizado", finalidade: "Normal" },
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
    tipoTitulo: "Cartão",
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
    documentos: [
      { nroUnico: "100.003", nroNota: "NF-001250", chaveDFe: "35260201234567890001550010000012501000012500", statusDFe: "Autorizado", finalidade: "Normal" },
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
    tipoTitulo: "PIX",
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
    documentos: [
      { nroUnico: "100.004", nroNota: "NF-001310", chaveDFe: "35260401234567890001550010000013101000013100", statusDFe: "Autorizado", finalidade: "Normal" },
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
    tipoTitulo: "Cartão",
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
    vlrMulta: 6200.0,
    vlrJuros: 2300.0,
    vlrBaixa: 38300.0,
    dataBaixa: "18/05/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 29800, baseReduzida: 0, aliquota: "5,00%", valor: 1490.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 29800, baseReduzida: 0, aliquota: "3,50%", valor: 1043.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 29800, baseReduzida: 0, aliquota: "3,50%", valor: 1043.0, digitado: "Não" },
    ],
    tributosMultaJuros: [
      { imposto: "CBS",     incidencia: "Multa e Juros", cst: "01", base: 8500, baseReduzida: 0, aliquota: "5,00%", valor: 425.0,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Multa e Juros", cst: "01", base: 8500, baseReduzida: 0, aliquota: "3,50%", valor: 297.5,  digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Multa e Juros", cst: "01", base: 8500, baseReduzida: 0, aliquota: "3,50%", valor: 297.5,  digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "200.019", nroNota: "NF-002200", chaveDFe: "35260502345678901002550010000022001000022000", statusDFe: "Autorizado", finalidade: "Normal" },
    ],
  },

  // ── Venda A Prazo – NF-002200 / Comércio Leste (3 parcelas do doc 200.020) ───
  {
    id: "t2200-1",
    dataNegociacao: "07/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Comércio Leste Ltda",
    parceiroCNPJ: "77.888.999/0001-55",
    nroUnico: "200.021",
    tipo: "Receita",
    tipoMovimento: "Venda",
    tipoTitulo: "Boleto",
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
    documentos: [
      { nroUnico: "200.020", nroNota: "NF-002200", chaveDFe: "35260267890100000123550010000022001234567891", statusDFe: "Autorizado", finalidade: "Normal" },
    ],
  },
  {
    id: "t2200-2",
    dataNegociacao: "07/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Comércio Leste Ltda",
    parceiroCNPJ: "77.888.999/0001-55",
    nroUnico: "200.022",
    tipo: "Receita",
    tipoMovimento: "Venda",
    tipoTitulo: "Boleto",
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
    documentos: [
      { nroUnico: "200.020", nroNota: "NF-002200", chaveDFe: "35260267890100000123550010000022001234567891", statusDFe: "Autorizado", finalidade: "Normal" },
    ],
  },
  {
    id: "t2200-3",
    dataNegociacao: "07/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Comércio Leste Ltda",
    parceiroCNPJ: "77.888.999/0001-55",
    nroUnico: "200.023",
    tipo: "Receita",
    tipoMovimento: "Venda",
    tipoTitulo: "Boleto",
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
    documentos: [
      { nroUnico: "200.020", nroNota: "NF-002200", chaveDFe: "35260267890100000123550010000022001234567891", statusDFe: "Autorizado", finalidade: "Normal" },
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
    tipoTitulo: "PIX",
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
    documentos: [
      { nroUnico: "100.005", nroNota: "NF-001320", chaveDFe: "35260501234567890001550010000013201000013200", statusDFe: "Não enviado", finalidade: "Normal" },
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
    tipoTitulo: "Boleto",
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
    documentos: [
      { nroUnico: "900.001", nroNota: "NF-003200", chaveDFe: "35260533444555000199550010032000010032000101", statusDFe: "Autorizado", finalidade: "Normal" },
    ],
  },

  // ── Venda – Transportes Delta (com Nota de Débito ND-000020) ───────────────
  {
    id: "12",
    dataNegociacao: "15/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Transportes Delta S.A.",
    parceiroCNPJ: "22.333.444/0001-66",
    nroUnico: "400.001",
    tipo: "Receita",
    tipoMovimento: "Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 12000.0,
    totalIBSUF: 420.0,
    totalIBSMun: 420.0,
    totalCBS: 600.0,
    nroNota: "NF-001400",
    desdob: "001/001",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "15/05/2026",
    dtVencimento: "15/06/2026",
    vlrDesconto: 0,
    vlrMulta: 360.0,
    vlrJuros: 180.0,
    vlrBaixa: 12540.0,
    dataBaixa: "25/05/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 12000, baseReduzida: 0, aliquota: "5,00%", valor: 600.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 12000, baseReduzida: 0, aliquota: "3,50%", valor: 420.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 12000, baseReduzida: 0, aliquota: "3,50%", valor: 420.0, digitado: "Não" },
    ],
    tributosMultaJuros: [
      { imposto: "CBS",     incidencia: "Multa e Juros", cst: "01", base: 540, baseReduzida: 0, aliquota: "5,00%", valor: 27.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Multa e Juros", cst: "01", base: 540, baseReduzida: 0, aliquota: "3,50%", valor: 18.9, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Multa e Juros", cst: "01", base: 540, baseReduzida: 0, aliquota: "3,50%", valor: 18.9, digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "400.001", nroNota: "NF-001400", chaveDFe: "35260501234567890001550010001400001000140001", statusDFe: "Autorizado", finalidade: "Normal" },
      { nroUnico: "400.010", nroNota: "ND-000020", chaveDFe: "35260501234567890001550010000200001000020001", statusDFe: "Autorizado", finalidade: "Débito" },
    ],
  },

  // ── Multa e Juros – Comércio Leste Ltda (par com MultaJuros 200.050) ─────────
  {
    id: "11",
    dataNegociacao: "18/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Comércio Leste Ltda",
    parceiroCNPJ: "77.888.999/0001-55",
    nroUnico: "200.050",
    tipo: "Receita",
    tipoMovimento: "Multa e Juros",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 9933.34,
    totalIBSUF: 297.5,
    totalIBSMun: 297.5,
    totalCBS: 425.0,
    nroNota: "ND-000012",
    desdob: "001/003",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "18/05/2026",
    dtVencimento: "07/06/2026",
    vlrDesconto: 0,
    vlrMulta: 6200.0,
    vlrJuros: 2300.0,
    vlrBaixa: 18433.34,
    dataBaixa: "18/05/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 8500, baseReduzida: 0, aliquota: "5,00%", valor: 425.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 8500, baseReduzida: 0, aliquota: "3,50%", valor: 297.5, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 8500, baseReduzida: 0, aliquota: "3,50%", valor: 297.5, digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "200.050", nroNota: "ND-000012", chaveDFe: "35260577888999000155550010000120001000012001", statusDFe: "Autorizado", finalidade: "Débito" },
    ],
  },

  // ── Venda – Logística Express Ltda (imposto quitado via DARF/DAR — 3 parcelas) ─
  // Parcela 1 — vencimento 20/05/2026 — imposto QUITADO (baixa realizada)
  {
    id: "10a",
    dataNegociacao: "05/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Logística Express Ltda",
    parceiroCNPJ: "88.999.000/0001-44",
    nroUnico: "100.006",
    tipo: "Receita",
    tipoMovimento: "Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 5000.0,
    totalIBSUF: 175.0,
    totalIBSMun: 175.0,
    totalCBS: 250.0,
    nroNota: "NF-001325",
    desdob: "001/003",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "05/05/2026",
    dtVencimento: "20/05/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 5000.0, dataBaixa: "20/05/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 5000, baseReduzida: 0, aliquota: "5,00%", valor: 250.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 5000, baseReduzida: 0, aliquota: "3,50%", valor: 175.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 5000, baseReduzida: 0, aliquota: "3,50%", valor: 175.0, digitado: "Não" },
    ],
    // Imposto quitado via guia — baixa integral desta parcela
    tributosDevolvidos: [
      { imposto: "CBS",     incidencia: "DARF", cst: "01", base: -5000, baseReduzida: 0, aliquota: "5,00%", valor: -250.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "DAR",  cst: "01", base: -5000, baseReduzida: 0, aliquota: "3,50%", valor: -175.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "DAR",  cst: "01", base: -5000, baseReduzida: 0, aliquota: "3,50%", valor: -175.0, digitado: "Não" },
    ],
    conciliacaoApuracaoAssistida: {
      guias: [
        { nroUnico: "100.006", tipoMovimento: "Despesa", tipoTitulo: "DARF", valor: 250.0 },
        { nroUnico: "100.006", tipoMovimento: "Despesa", tipoTitulo: "DAR",  valor: 175.0 },
        { nroUnico: "100.006", tipoMovimento: "Despesa", tipoTitulo: "DAR",  valor: 175.0 },
      ],
    },
    documentos: [
      { nroUnico: "100.006", nroNota: "NF-001325", chaveDFe: "35260501234567890001550010000013251000013250", statusDFe: "Autorizado", finalidade: "Normal" },
    ],
  },
  // Parcela 2 — vencimento 20/06/2026 — imposto QUITADO
  {
    id: "10b",
    dataNegociacao: "05/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Logística Express Ltda",
    parceiroCNPJ: "88.999.000/0001-44",
    nroUnico: "100.006",
    tipo: "Receita",
    tipoMovimento: "Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 5000.0,
    totalIBSUF: 175.0,
    totalIBSMun: 175.0,
    totalCBS: 250.0,
    nroNota: "NF-001325",
    desdob: "002/003",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "05/05/2026",
    dtVencimento: "20/06/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 5000.0, dataBaixa: "20/06/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 5000, baseReduzida: 0, aliquota: "5,00%", valor: 250.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 5000, baseReduzida: 0, aliquota: "3,50%", valor: 175.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 5000, baseReduzida: 0, aliquota: "3,50%", valor: 175.0, digitado: "Não" },
    ],
    tributosDevolvidos: [
      { imposto: "CBS",     incidencia: "DARF", cst: "01", base: -5000, baseReduzida: 0, aliquota: "5,00%", valor: -250.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "DAR",  cst: "01", base: -5000, baseReduzida: 0, aliquota: "3,50%", valor: -175.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "DAR",  cst: "01", base: -5000, baseReduzida: 0, aliquota: "3,50%", valor: -175.0, digitado: "Não" },
    ],
    conciliacaoApuracaoAssistida: {
      guias: [
        { nroUnico: "100.006", tipoMovimento: "Despesa", tipoTitulo: "DARF", valor: 250.0 },
        { nroUnico: "100.006", tipoMovimento: "Despesa", tipoTitulo: "DAR",  valor: 175.0 },
        { nroUnico: "100.006", tipoMovimento: "Despesa", tipoTitulo: "DAR",  valor: 175.0 },
      ],
    },
    documentos: [
      { nroUnico: "100.006", nroNota: "NF-001325", chaveDFe: "35260501234567890001550010000013251000013250", statusDFe: "Autorizado", finalidade: "Normal" },
    ],
  },
  // Parcela 3 — vencimento 20/07/2026 — saldo devedor pendente
  {
    id: "10c",
    dataNegociacao: "05/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Logística Express Ltda",
    parceiroCNPJ: "88.999.000/0001-44",
    nroUnico: "100.006",
    tipo: "Receita",
    tipoMovimento: "Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 5000.0,
    totalIBSUF: 175.0,
    totalIBSMun: 175.0,
    totalCBS: 250.0,
    nroNota: "NF-001325",
    desdob: "003/003",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "05/05/2026",
    dtVencimento: "20/07/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 5000, baseReduzida: 0, aliquota: "5,00%", valor: 250.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 5000, baseReduzida: 0, aliquota: "3,50%", valor: 175.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 5000, baseReduzida: 0, aliquota: "3,50%", valor: 175.0, digitado: "Não" },
    ],
    // Sem tributosDevolvidos — imposto ainda não quitado nesta parcela
    conciliacaoApuracaoAssistida: {
      guias: [],
    },
    documentos: [
      { nroUnico: "100.006", nroNota: "NF-001325", chaveDFe: "35260501234567890001550010000013251000013250", statusDFe: "Autorizado", finalidade: "Normal" },
    ],
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
    tipoTitulo: "Boleto",
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
    documentos: [
      { nroUnico: "700.001", nroNota: "NF-003050", chaveDFe: "35260544555666000122550010030500010030500101", statusDFe: "Autorizado", finalidade: "Normal" },
    ],
  },

  // ── Cenário 1: Receita com multa e juros — sem Nota de Débito/Crédito gerada ──
  {
    id: "pen1",
    dataNegociacao: "02/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Indústria Alfa S.A.",
    parceiroCNPJ: "11.222.333/0001-44",
    nroUnico: "100.099",
    tipo: "Receita",
    tipoMovimento: "Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 18000.0,
    totalIBSUF: 630.0,
    totalIBSMun: 630.0,
    totalCBS: 900.0,
    nroNota: "NF-001500",
    desdob: "001/001",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "02/06/2026",
    dtVencimento: "02/05/2026",
    vlrDesconto: 0,
    vlrMulta: 540.0,
    vlrJuros: 270.0,
    vlrBaixa: 18810.0,
    dataBaixa: "02/06/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 18000, baseReduzida: 0, aliquota: "5,00%", valor: 900.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 18000, baseReduzida: 0, aliquota: "3,50%", valor: 630.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 18000, baseReduzida: 0, aliquota: "3,50%", valor: 630.0, digitado: "Não" },
    ],
    tributosMultaJuros: [
      { imposto: "CBS",     incidencia: "Multa e Juros", cst: "01", base: 810, baseReduzida: 0, aliquota: "5,00%", valor: 40.5,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Multa e Juros", cst: "01", base: 810, baseReduzida: 0, aliquota: "3,50%", valor: 28.35, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Multa e Juros", cst: "01", base: 810, baseReduzida: 0, aliquota: "3,50%", valor: 28.35, digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "100.099", nroNota: "NF-001500", chaveDFe: "35260601234567890001550010000015001000015000", statusDFe: "Autorizado", finalidade: "Normal" },
    ],
    pendencia: "Esse título foi recebido com multa e juros. É necessário gerar uma Nota de Débito.",
  },

  // ── Antecipação – Janeiro (ND-000101 / R$ 20,00) ────────────────────────────
  {
    id: "ant1",
    dataNegociacao: "15/01/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Comércio Brasil Ltda",
    parceiroCNPJ: "45.678.901/0001-23",
    nroUnico: "100.101",
    tipo: "Receita",
    tipoMovimento: "Antecipação",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 20.0,
    totalIBSUF: 0.7,
    totalIBSMun: 0.7,
    totalCBS: 1.0,
    nroNota: "ND-000101",
    desdob: "001/001",
    tipoOperacao: "1.209 - Antecipação",
    dtEntradaSaida: "15/01/2026",
    dtVencimento: "15/01/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 20.0, dataBaixa: "15/01/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 20, baseReduzida: 0, aliquota: "5,00%", valor: 1.0,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 20, baseReduzida: 0, aliquota: "3,50%", valor: 0.7,  digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 20, baseReduzida: 0, aliquota: "3,50%", valor: 0.7,  digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "100.101", nroNota: "ND-000101", chaveDFe: "35260101234567890001550010000001010000010101", statusDFe: "Autorizado", finalidade: "Débito" },
    ],
  },

  // ── Antecipação – Fevereiro (ND-000102 / R$ 30,00) ──────────────────────────
  {
    id: "ant2",
    dataNegociacao: "10/02/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Comércio Brasil Ltda",
    parceiroCNPJ: "45.678.901/0001-23",
    nroUnico: "100.102",
    tipo: "Receita",
    tipoMovimento: "Antecipação",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 30.0,
    totalIBSUF: 1.05,
    totalIBSMun: 1.05,
    totalCBS: 1.5,
    nroNota: "ND-000102",
    desdob: "001/001",
    tipoOperacao: "1.209 - Antecipação",
    dtEntradaSaida: "10/02/2026",
    dtVencimento: "10/02/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 30.0, dataBaixa: "10/02/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 30, baseReduzida: 0, aliquota: "5,00%", valor: 1.5,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 30, baseReduzida: 0, aliquota: "3,50%", valor: 1.05, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 30, baseReduzida: 0, aliquota: "3,50%", valor: 1.05, digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "100.102", nroNota: "ND-000102", chaveDFe: "35260201234567890001550010000001020000010201", statusDFe: "Autorizado", finalidade: "Débito" },
    ],
  },

  // ── Pedido de Venda – Título XPTO (R$ 100,00 / venc 01/06/2026) ─────────────
  {
    id: "xpto",
    dataNegociacao: "01/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Comércio Brasil Ltda",
    parceiroCNPJ: "45.678.901/0001-23",
    nroUnico: "100.200",
    tipo: "Receita",
    tipoMovimento: "Pedido de Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 100.0,
    totalIBSUF: 3.5,
    totalIBSMun: 3.5,
    totalCBS: 5.0,
    nroNota: "—",
    desdob: "001/001",
    tipoOperacao: "1.001 - Pedido de Venda",
    dtEntradaSaida: "01/06/2026",
    dtVencimento: "01/06/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 100.0, dataBaixa: "01/06/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 100, baseReduzida: 0, aliquota: "5,00%", valor: 5.0,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 100, baseReduzida: 0, aliquota: "3,50%", valor: 3.5,  digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 100, baseReduzida: 0, aliquota: "3,50%", valor: 3.5,  digitado: "Não" },
    ],
    documentos: [],
    pedidoRef: {
      id: "pedido-xpto",
      numero: "PV-001",
      dataNegociacao: "01/06/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Comércio Brasil Ltda",
      parceiroCNPJ: "45.678.901/0001-23",
      nroUnico: "100.200",
      valor: 500.0,
      tipoOperacao: "1.001 - Pedido de Venda",
    },
    pendencia: "Esse título não tem um documento fiscal relacionado. Veja as opções disponíveis através do grupo Documentos do Título.",
  },

  // ── Pedido de Venda – Título 100.201 (R$ 150,00 / venc 01/07/2026) ──────────
  {
    id: "xpto-2",
    dataNegociacao: "01/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Comércio Brasil Ltda",
    parceiroCNPJ: "45.678.901/0001-23",
    nroUnico: "100.201",
    tipo: "Receita",
    tipoMovimento: "Pedido de Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 150.0,
    totalIBSUF: 5.25,
    totalIBSMun: 5.25,
    totalCBS: 7.5,
    nroNota: "—",
    desdob: "002/003",
    tipoOperacao: "1.001 - Pedido de Venda",
    dtEntradaSaida: "01/06/2026",
    dtVencimento: "01/07/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 150, baseReduzida: 0, aliquota: "5,00%", valor: 7.5,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 150, baseReduzida: 0, aliquota: "3,50%", valor: 5.25, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 150, baseReduzida: 0, aliquota: "3,50%", valor: 5.25, digitado: "Não" },
    ],
    documentos: [],
    pedidoRef: {
      id: "pedido-xpto",
      numero: "PV-001",
      dataNegociacao: "01/06/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Comércio Brasil Ltda",
      parceiroCNPJ: "45.678.901/0001-23",
      nroUnico: "100.201",
      valor: 500.0,
      tipoOperacao: "1.001 - Pedido de Venda",
    },
  },

  // ── Pedido de Venda – Título 100.202 (R$ 250,00 / venc 01/08/2026) ──────────
  {
    id: "xpto-3",
    dataNegociacao: "01/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Comércio Brasil Ltda",
    parceiroCNPJ: "45.678.901/0001-23",
    nroUnico: "100.202",
    tipo: "Receita",
    tipoMovimento: "Pedido de Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 250.0,
    totalIBSUF: 8.75,
    totalIBSMun: 8.75,
    totalCBS: 12.5,
    nroNota: "—",
    desdob: "003/003",
    tipoOperacao: "1.001 - Pedido de Venda",
    dtEntradaSaida: "01/06/2026",
    dtVencimento: "01/08/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 250, baseReduzida: 0, aliquota: "5,00%", valor: 12.5, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 250, baseReduzida: 0, aliquota: "3,50%", valor: 8.75, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 250, baseReduzida: 0, aliquota: "3,50%", valor: 8.75, digitado: "Não" },
    ],
    documentos: [],
    pedidoRef: {
      id: "pedido-xpto",
      numero: "PV-001",
      dataNegociacao: "01/06/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Comércio Brasil Ltda",
      parceiroCNPJ: "45.678.901/0001-23",
      nroUnico: "100.202",
      valor: 500.0,
      tipoOperacao: "1.001 - Pedido de Venda",
    },
  },

  // ── Pedido de Venda – PV-002 Parcela 1 (R$ 400,00 / venc 01/05/2026) ────────
  {
    id: "pv002-t1",
    dataNegociacao: "15/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Tech Solutions S.A.",
    parceiroCNPJ: "67.890.123/0001-45",
    nroUnico: "100.401",
    tipo: "Receita",
    tipoMovimento: "Pedido de Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 400.0,
    totalIBSUF: 14.0,
    totalIBSMun: 14.0,
    totalCBS: 20.0,
    nroNota: "ND-0301",
    desdob: "001/002",
    tipoOperacao: "1.001 - Pedido de Venda",
    dtEntradaSaida: "15/05/2026",
    dtVencimento: "01/05/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 400.0, dataBaixa: "01/05/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 400, baseReduzida: 0, aliquota: "5,00%", valor: 20.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 400, baseReduzida: 0, aliquota: "3,50%", valor: 14.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 400, baseReduzida: 0, aliquota: "3,50%", valor: 14.0, digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "100.401", nroNota: "ND-0301", chaveDFe: "35260501234567890001550010000003011234560301", statusDFe: "Autorizado", finalidade: "Débito" },
    ],
    pedidoRef: {
      id: "pedido-pv002",
      numero: "PV-002",
      dataNegociacao: "15/05/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Tech Solutions S.A.",
      parceiroCNPJ: "67.890.123/0001-45",
      nroUnico: "100.400",
      valor: 800.0,
      tipoOperacao: "1.001 - Pedido de Venda",
    },
  },

  // ── Pedido de Venda – PV-002 Parcela 2 (R$ 400,00 / venc 01/06/2026) ────────
  {
    id: "pv002-t2",
    dataNegociacao: "15/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Tech Solutions S.A.",
    parceiroCNPJ: "67.890.123/0001-45",
    nroUnico: "100.402",
    tipo: "Receita",
    tipoMovimento: "Pedido de Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 400.0,
    totalIBSUF: 14.0,
    totalIBSMun: 14.0,
    totalCBS: 20.0,
    nroNota: "ND-0302",
    desdob: "002/002",
    tipoOperacao: "1.001 - Pedido de Venda",
    dtEntradaSaida: "15/05/2026",
    dtVencimento: "01/06/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 400.0, dataBaixa: "01/06/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 400, baseReduzida: 0, aliquota: "5,00%", valor: 20.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 400, baseReduzida: 0, aliquota: "3,50%", valor: 14.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 400, baseReduzida: 0, aliquota: "3,50%", valor: 14.0, digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "100.402", nroNota: "ND-0302", chaveDFe: "35260601234567890001550010000003021234560302", statusDFe: "Autorizado", finalidade: "Débito" },
    ],
    pedidoRef: {
      id: "pedido-pv002",
      numero: "PV-002",
      dataNegociacao: "15/05/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Tech Solutions S.A.",
      parceiroCNPJ: "67.890.123/0001-45",
      nroUnico: "100.400",
      valor: 800.0,
      tipoOperacao: "1.001 - Pedido de Venda",
    },
  },

  // ── Pedido de Venda – PV-003 Parcela 1 (R$ 450,00 / venc 01/05/2026) ────────
  {
    id: "pv003-t1",
    dataNegociacao: "20/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Varejo Central S.A.",
    parceiroCNPJ: "98.765.432/0001-11",
    nroUnico: "100.501",
    tipo: "Receita",
    tipoMovimento: "Pedido de Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 450.0,
    totalIBSUF: 15.75,
    totalIBSMun: 15.75,
    totalCBS: 22.5,
    nroNota: "ND-0401",
    desdob: "001/002",
    tipoOperacao: "1.001 - Pedido de Venda",
    dtEntradaSaida: "20/05/2026",
    dtVencimento: "01/05/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 450.0, dataBaixa: "01/05/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 450, baseReduzida: 0, aliquota: "5,00%", valor: 22.5,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 450, baseReduzida: 0, aliquota: "3,50%", valor: 15.75, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 450, baseReduzida: 0, aliquota: "3,50%", valor: 15.75, digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "100.501", nroNota: "ND-0401", chaveDFe: "35260501234567890001550010000004011234560401", statusDFe: "Autorizado", finalidade: "Débito" },
    ],
    pedidoRef: {
      id: "pedido-pv003",
      numero: "PV-003",
      dataNegociacao: "20/05/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Varejo Central S.A.",
      parceiroCNPJ: "98.765.432/0001-11",
      nroUnico: "100.500",
      valor: 900.0,
      tipoOperacao: "1.001 - Pedido de Venda",
    },
  },

  // ── Pedido de Venda – PV-003 Parcela 2 (R$ 450,00 / venc 01/06/2026) ────────
  {
    id: "pv003-t2",
    dataNegociacao: "20/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Varejo Central S.A.",
    parceiroCNPJ: "98.765.432/0001-11",
    nroUnico: "100.502",
    tipo: "Receita",
    tipoMovimento: "Pedido de Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 450.0,
    totalIBSUF: 15.75,
    totalIBSMun: 15.75,
    totalCBS: 22.5,
    nroNota: "ND-0402",
    desdob: "002/002",
    tipoOperacao: "1.001 - Pedido de Venda",
    dtEntradaSaida: "20/05/2026",
    dtVencimento: "01/06/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 450.0, dataBaixa: "01/06/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 450, baseReduzida: 0, aliquota: "5,00%", valor: 22.5,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 450, baseReduzida: 0, aliquota: "3,50%", valor: 15.75, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 450, baseReduzida: 0, aliquota: "3,50%", valor: 15.75, digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "100.502", nroNota: "ND-0402", chaveDFe: "35260601234567890001550010000004021234560402", statusDFe: "Autorizado", finalidade: "Débito" },
    ],
    pedidoRef: {
      id: "pedido-pv003",
      numero: "PV-003",
      dataNegociacao: "20/05/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Varejo Central S.A.",
      parceiroCNPJ: "98.765.432/0001-11",
      nroUnico: "100.500",
      valor: 900.0,
      tipoOperacao: "1.001 - Pedido de Venda",
    },
  },

  // ── Pedido de Venda – PV-004 Parcela 1 (R$ 600,00 / antecipação / ND-0501) ────
  {
    id: "pv004-t1",
    dataNegociacao: "25/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Logística Express Ltda",
    parceiroCNPJ: "88.999.000/0001-44",
    nroUnico: "100.601",
    tipo: "Receita",
    tipoMovimento: "Pedido de Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 600.0,
    totalIBSUF: 21.0,
    totalIBSMun: 21.0,
    totalCBS: 30.0,
    nroNota: "ND-0501",
    desdob: "001/002",
    tipoOperacao: "1.001 - Pedido de Venda",
    dtEntradaSaida: "25/05/2026",
    dtVencimento: "01/06/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 600.0, dataBaixa: "01/06/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 600, baseReduzida: 0, aliquota: "5,00%", valor: 30.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 600, baseReduzida: 0, aliquota: "3,50%", valor: 21.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 600, baseReduzida: 0, aliquota: "3,50%", valor: 21.0, digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "100.601", nroNota: "ND-0501", chaveDFe: "35260601234567890001550010000005011234560501", statusDFe: "Autorizado", finalidade: "Débito" },
    ],
    pedidoRef: {
      id: "pedido-pv004",
      numero: "PV-004",
      dataNegociacao: "25/05/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Logística Express Ltda",
      parceiroCNPJ: "88.999.000/0001-44",
      nroUnico: "100.600",
      valor: 1200.0,
      tipoOperacao: "1.001 - Pedido de Venda",
    },
  },

  // ── Pedido de Venda – PV-004 Parcela 2 (R$ 600,00 / fornecimento / NF-1201) ──
  {
    id: "pv004-t2",
    dataNegociacao: "25/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Logística Express Ltda",
    parceiroCNPJ: "88.999.000/0001-44",
    nroUnico: "100.602",
    tipo: "Receita",
    tipoMovimento: "Pedido de Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 600.0,
    totalIBSUF: 21.0,
    totalIBSMun: 21.0,
    totalCBS: 30.0,
    nroNota: "NF-1201",
    desdob: "002/002",
    tipoOperacao: "1.001 - Pedido de Venda",
    dtEntradaSaida: "25/05/2026",
    dtVencimento: "10/06/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 600.0, dataBaixa: "10/06/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 600, baseReduzida: 0, aliquota: "5,00%", valor: 30.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 600, baseReduzida: 0, aliquota: "3,50%", valor: 21.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 600, baseReduzida: 0, aliquota: "3,50%", valor: 21.0, digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "100.602", nroNota: "NF-1201", chaveDFe: "35260601234567890001550010000012011234561201", statusDFe: "Autorizado", finalidade: "Normal" },
    ],
    pedidoRef: {
      id: "pedido-pv004",
      numero: "PV-004",
      dataNegociacao: "25/05/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Logística Express Ltda",
      parceiroCNPJ: "88.999.000/0001-44",
      nroUnico: "100.600",
      valor: 1200.0,
      tipoOperacao: "1.001 - Pedido de Venda",
    },
  },

  // ── Venda – sem documento fiscal ─────────────────────────────────────────
  {
    id: "t14",
    dataNegociacao: "22/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Global Parts S.A.",
    parceiroCNPJ: "55.666.777/0001-88",
    nroUnico: "600.002",
    tipo: "Receita",
    tipoMovimento: "Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 15000.0,
    totalIBSUF: 525.0,
    totalIBSMun: 525.0,
    totalCBS: 750.0,
    nroNota: "NF-006601",
    desdob: "001/001",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "22/05/2026",
    dtVencimento: "22/06/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 0, dataBaixa: "—",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 15000, baseReduzida: 0, aliquota: "5,00%", valor: 750.0,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 15000, baseReduzida: 0, aliquota: "3,50%", valor: 525.0,  digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 15000, baseReduzida: 0, aliquota: "3,50%", valor: 525.0,  digitado: "Não" },
    ],
    documentos: [],
    pendencia: "Esse título não tem um documento fiscal relacionado. Importe um XML ou relacione com um documento existente, através do grupo Documentos do Título.",
  },

  // ── PV-010 — Parcela 1 (R$ 10.000,00 / sem multa e juros) ────────────────────
  {
    id: "pv010-t1",
    dataNegociacao: "05/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Digital Supply Ltda",
    parceiroCNPJ: "12.345.678/0001-55",
    nroUnico: "100.802",
    tipo: "Receita",
    tipoMovimento: "Pedido de Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 10000.0,
    totalIBSUF: 350.0,
    totalIBSMun: 350.0,
    totalCBS: 500.0,
    nroNota: "NF-001601",
    desdob: "001/002",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "05/06/2026",
    dtVencimento: "05/07/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 10000.0, dataBaixa: "10/06/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 10000, baseReduzida: 0, aliquota: "5,00%", valor: 500.0, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 10000, baseReduzida: 0, aliquota: "3,50%", valor: 350.0, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 10000, baseReduzida: 0, aliquota: "3,50%", valor: 350.0, digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "100.801", nroNota: "NF-001601", chaveDFe: "35260601234567890001550010000016011000016011", statusDFe: "Autorizado", finalidade: "Normal" },
    ],
    pedidoRef: {
      id: "pv-010",
      numero: "PV-010",
      dataNegociacao: "05/06/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Digital Supply Ltda",
      parceiroCNPJ: "12.345.678/0001-55",
      nroUnico: "100.800",
      valor: 20000.0,
      tipoOperacao: "1.001 - Pedido de Venda",
    },
  },

  // ── PV-010 — Parcela 2 (R$ 10.000,00 / com multa e juros) ────────────────────
  {
    id: "pv010-t2",
    dataNegociacao: "05/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Digital Supply Ltda",
    parceiroCNPJ: "12.345.678/0001-55",
    nroUnico: "100.803",
    tipo: "Receita",
    tipoMovimento: "Pedido de Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 10000.0,
    totalIBSUF: 350.0,
    totalIBSMun: 350.0,
    totalCBS: 500.0,
    nroNota: "NF-001601",
    desdob: "002/002",
    tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "05/06/2026",
    dtVencimento: "05/07/2026",
    vlrDesconto: 0, vlrMulta: 300.0, vlrJuros: 150.0, vlrBaixa: 10450.0, dataBaixa: "10/06/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 10000, baseReduzida: 0, aliquota: "5,00%", valor: 500.0,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 10000, baseReduzida: 0, aliquota: "3,50%", valor: 350.0,  digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 10000, baseReduzida: 0, aliquota: "3,50%", valor: 350.0,  digitado: "Não" },
    ],
    tributosMultaJuros: [
      { imposto: "CBS",     incidencia: "Multa e Juros", cst: "01", base: 450, baseReduzida: 0, aliquota: "5,00%", valor: 22.5,  digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Multa e Juros", cst: "01", base: 450, baseReduzida: 0, aliquota: "3,50%", valor: 15.75, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Multa e Juros", cst: "01", base: 450, baseReduzida: 0, aliquota: "3,50%", valor: 15.75, digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "100.801", nroNota: "NF-001601", chaveDFe: "35260601234567890001550010000016011000016011", statusDFe: "Autorizado", finalidade: "Normal" },
      { nroUnico: "100.810", nroNota: "ND-001602", chaveDFe: "35260601234567890001550010000016021000016021", statusDFe: "Autorizado", finalidade: "Débito" },
    ],
    pedidoRef: {
      id: "pv-010",
      numero: "PV-010",
      dataNegociacao: "05/06/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Digital Supply Ltda",
      parceiroCNPJ: "12.345.678/0001-55",
      nroUnico: "100.800",
      valor: 20000.0,
      tipoOperacao: "1.001 - Pedido de Venda",
    },
    pendencia: "Esse título foi recebido com multa e juros. É necessário gerar uma Nota de Débito.",
  },

  // ── Pedido de Venda – PV-072 / Fênix Serviços (R$ 72,00 / venc 16/06/2026 pago) ─
  {
    id: "sc-ant-72",
    dataNegociacao: "16/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Fênix Serviços Ltda",
    parceiroCNPJ: "12.876.543/0001-21",
    nroUnico: "150.001",
    tipo: "Receita",
    tipoMovimento: "Pedido de Venda",
    tipoTitulo: "Boleto",
    vlrDesdobramento: 72.0,
    totalIBSUF: 2.52,
    totalIBSMun: 2.52,
    totalCBS: 3.60,
    nroNota: "ND-000072",
    desdob: "001/001",
    tipoOperacao: "1.001 - Pedido de Venda",
    dtEntradaSaida: "16/06/2026",
    dtVencimento: "16/06/2026",
    vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 72.0, dataBaixa: "16/06/2026",
    tributos: [
      { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 72, baseReduzida: 0, aliquota: "5,00%", valor: 3.60, digitado: "Não" },
      { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 72, baseReduzida: 0, aliquota: "3,50%", valor: 2.52, digitado: "Não" },
      { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 72, baseReduzida: 0, aliquota: "3,50%", valor: 2.52, digitado: "Não" },
    ],
    documentos: [
      { nroUnico: "150.002", nroNota: "ND-000072", chaveDFe: "35260601234567890001550010000000072123456720", statusDFe: "Autorizado", finalidade: "Débito" },
    ],
    pedidoRef: {
      id: "sc-pv-72",
      numero: "PV-072",
      dataNegociacao: "16/06/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Fênix Serviços Ltda",
      parceiroCNPJ: "12.876.543/0001-21",
      nroUnico: "150.001",
      valor: 72.0,
      tipoOperacao: "1.001 - Pedido de Venda",
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function saldo(tributos: Tributo[], tributosDevolvidos: Tributo[] | undefined, tributosMultaJuros: Tributo[] | undefined, imposto: string): string {
  const all = [...tributos, ...(tributosMultaJuros ?? [])];
  if (all.length === 0) return "—";
  const deb  = all.filter(t => t.imposto === imposto).reduce((s, t) => s + t.valor, 0);
  const cred = (tributosDevolvidos ?? []).filter(t => t.imposto === imposto).reduce((s, t) => s + Math.abs(t.valor), 0);
  const net  = deb - cred;
  if (Math.abs(net) < 0.001) return brl(0);
  return `${brl(Math.abs(net))} ${net > 0 ? "D" : "C"}`;
}


function PendenciaIcon({ pendencia }: { pendencia?: string }) {
  if (pendencia) {
    return <AlertTriangle className="h-4 w-4 text-amber-500" aria-label="Pendência" />;
  }
  return <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Sem pendências" />;
}

function PendenciaAlerta({ pendencia, navigate, nroUnico }: { pendencia: string; navigate: ReturnType<typeof useNavigate>; nroUnico: string }) {
  const isMJ = pendencia.includes("multa e juros");
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 px-4 py-3">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
      <p className="text-[13px] text-amber-800 dark:text-amber-300 leading-relaxed">
        {pendencia}
        {isMJ && (
          <>
            {" "}
            <button
              className="underline font-medium hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
              onClick={() =>
                navigate(ERoutes.MOVIMENTACOES_RECEITAS_MULTA_JUROS, {
                  state: { openNroUnico: nroUnico },
                })
              }
            >
              Acesse Receitas — Multa e Juros
            </button>
          </>
        )}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MovimentacoesReceitasMovimento() {
  const location = useLocation();
  const [view, setView] = useState<"list" | "detail" | "ref-detail">("list");
  const [selected, setSelected] = useState<ReceitaMovimento | null>(null);
  const [selectedRef, setSelectedRef] = useState<TituloRef | null>(null);
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroDataDe, setFiltroDataDe] = useState<Date | undefined>(undefined);
  const [filtroDataAte, setFiltroDataAte] = useState<Date | undefined>(undefined);
  const [filtroTipoTitulo, setFiltroTipoTitulo] = useState("");
  const [filtroPendencia, setFiltroPendencia] = useState("");

  useEffect(() => {
    const nroUnico = (location.state as { openNroUnico?: string } | null)?.openNroUnico;
    if (!nroUnico) return;
    const record = MOCK.find((r) => r.nroUnico === nroUnico);
    if (record) { setSelected(record); setView("detail"); }
  }, [location.state]);

  const hasFilter = filtroEmpresa !== "" || filtroDataDe !== undefined || filtroDataAte !== undefined || filtroTipoTitulo !== "" || filtroPendencia !== "";

  const TIPOS_TITULO = useMemo(() => Array.from(new Set(MOCK.map(r => r.tipoTitulo))).sort(), []);

  const rows = useMemo(() => {
    const parseDate = (s: string) => {
      const [d, m, y] = s.split("/");
      return new Date(Number(y), Number(m) - 1, Number(d));
    };
    return MOCK.filter((r) => {
      const dt = parseDate(r.dataNegociacao);
      const byEmpresa = !filtroEmpresa || r.empresaCod === filtroEmpresa;
      const byDe = !filtroDataDe || dt >= filtroDataDe;
      const byAte = !filtroDataAte || dt <= filtroDataAte;
      const byTipoTitulo = !filtroTipoTitulo || r.tipoTitulo === filtroTipoTitulo;
      const byPendencia = !filtroPendencia || (filtroPendencia === "sim" ? !!r.pendencia : !r.pendencia);
      return byEmpresa && byDe && byAte && byTipoTitulo && byPendencia;
    });
  }, [filtroEmpresa, filtroDataDe, filtroDataAte, filtroTipoTitulo, filtroPendencia]);

  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [rows]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              <SelectValue placeholder="Empresas" />
            </SelectTrigger>
            <SelectContent>
              {EMPRESAS.map((e) => (
                <SelectItem key={e.cod} value={e.cod} className="text-[13px]">
                  {e.cod} — {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Período De */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex items-center gap-1.5 h-8 px-3 rounded-md border bg-background text-[13px] hover:bg-muted/50 transition-colors",
                !filtroDataDe && "text-muted-foreground"
              )}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {filtroDataDe ? format(filtroDataDe, "dd/MM/yyyy") : "De"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={filtroDataDe} onSelect={setFiltroDataDe} initialFocus />
            </PopoverContent>
          </Popover>

          {/* Período Até */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex items-center gap-1.5 h-8 px-3 rounded-md border bg-background text-[13px] hover:bg-muted/50 transition-colors",
                !filtroDataAte && "text-muted-foreground"
              )}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {filtroDataAte ? format(filtroDataAte, "dd/MM/yyyy") : "Até"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={filtroDataAte} onSelect={setFiltroDataAte} initialFocus />
            </PopoverContent>
          </Popover>

          <Select value={filtroTipoTitulo} onValueChange={setFiltroTipoTitulo}>
            <SelectTrigger className="w-[160px] h-8 text-[13px]">
              <SelectValue placeholder="Tipo Título" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_TITULO.map((t) => (
                <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroPendencia} onValueChange={setFiltroPendencia}>
            <SelectTrigger className="w-[140px] h-8 text-[13px]">
              <SelectValue placeholder="Pendência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sim" className="text-[13px]">Sim</SelectItem>
              <SelectItem value="nao" className="text-[13px]">Não</SelectItem>
            </SelectContent>
          </Select>

          {hasFilter && (
            <button
              onClick={() => { setFiltroEmpresa(""); setFiltroDataDe(undefined); setFiltroDataAte(undefined); setFiltroTipoTitulo(""); setFiltroPendencia(""); }}
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
                    <TableHead className="text-[12px] text-center">Pendências</TableHead>
                    <TableHead className="text-[12px]">Dt. Negociação</TableHead>
                    <TableHead className="text-[12px]">Empresa</TableHead>
                    <TableHead className="text-[12px]">Parceiro</TableHead>
                    <TableHead className="text-[12px]">Tipo de Movimento</TableHead>
                    <TableHead className="text-[12px]">Nro Único</TableHead>
                    <TableHead className="text-[12px]">Tipo Título</TableHead>
                    <TableHead className="text-[12px] text-right">Valor</TableHead>
                    <TableHead className="text-[12px] text-right">IBS UF</TableHead>
                    <TableHead className="text-[12px] text-right">IBS Mun</TableHead>
                    <TableHead className="text-[12px] text-right">CBS</TableHead>
                    <TableHead className="text-[12px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/40 text-[13px]">
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <PendenciaIcon pendencia={r.pendencia} />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[12px]">{r.dataNegociacao}</TableCell>
                      <TableCell>{r.empresa}</TableCell>
                      <TableCell>
                        <div>{r.parceiroNome}</div>
                        <div className="text-[11px] text-muted-foreground">{r.parceiroCNPJ}</div>
                      </TableCell>
                      <TableCell className="text-[13px] font-medium">
                        {r.tipoMovimento}
                      </TableCell>
                      <TableCell className="font-mono">{r.nroUnico}</TableCell>
                      <TableCell><TipoTituloBadge tipo={r.tipoTitulo} /></TableCell>
                      <TableCell className="text-right font-mono">{brl(r.vlrDesdobramento)}</TableCell>
                      <TableCell className="text-right font-mono">{saldo(r.tributos, r.tributosDevolvidos, r.tributosMultaJuros, "IBS UF")}</TableCell>
                      <TableCell className="text-right font-mono">{saldo(r.tributos, r.tributosDevolvidos, r.tributosMultaJuros, "IBS Mun")}</TableCell>
                      <TableCell className="text-right font-mono">{saldo(r.tributos, r.tributosDevolvidos, r.tributosMultaJuros, "CBS")}</TableCell>
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
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-[12px] text-muted-foreground">
                {rows.length} registro{rows.length !== 1 ? "s" : ""}
                {totalPages > 1 && ` · página ${page} de ${totalPages}`}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[12px] px-2"
                    disabled={page === 1}
                    onClick={() => setPage(1)}
                  >
                    «
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[12px] px-2"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ‹
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[12px] px-2"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    ›
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[12px] px-2"
                    disabled={page === totalPages}
                    onClick={() => setPage(totalPages)}
                  >
                    »
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function TipoTituloBadge({ tipo }: { tipo: string }) {
  const styles: Record<string, string> = {
    Boleto: "border-slate-300  text-slate-700  bg-slate-50  dark:text-slate-300  dark:bg-slate-900/40",
    PIX:    "border-emerald-300 text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40",
    Cartão: "border-violet-300 text-violet-700 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/40",
    DARF:   "border-blue-300  text-blue-700  bg-blue-50  dark:text-blue-400  dark:bg-blue-950/40",
    DAR:    "border-amber-300 text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40",
  };
  return (
    <Badge variant="outline" className={cn("text-[11px] font-semibold", styles[tipo] ?? "")}>
      {tipo}
    </Badge>
  );
}

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

function BadgeDFe({ status }: { status: StatusDFe }) {
  const cls =
    status === "Autorizado"             ? "border-green-300 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/40" :
    status === "Aguardando autorização" ? "border-blue-300 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40" :
    status === "Erro"                   ? "border-red-300 text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/40" :
                                          "border-gray-300 text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/40";
  return <Badge variant="outline" className={cn("text-[11px] whitespace-nowrap", cls)}>{status}</Badge>;
}

function FinalidadeBadge({ finalidade }: { finalidade: string }) {
  const styles: Record<string, string> = {
    Normal:    "border-gray-300 text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/40",
    Devolução: "border-rose-300 text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40",
    Débito:    "border-teal-300 text-teal-700 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/40",
  };
  return (
    <Badge variant="outline" className={cn("text-[11px] font-semibold whitespace-nowrap", styles[finalidade] ?? "")}>
      {finalidade}
    </Badge>
  );
}

function TributoTable({
  tributos,
  tributosDevolvidos,
  tributosMultaJuros,
  data,
  dataMultaJuros,
  dataDevolucao,
}: {
  tributos: Tributo[];
  tributosDevolvidos?: Tributo[];
  tributosMultaJuros?: Tributo[];
  data: string;
  dataMultaJuros?: string;
  dataDevolucao?: string;
}) {
  const contaCorrente = !!tributosDevolvidos;
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="text-[12px]">Data</TableHead>
            <TableHead className="text-[12px]">Imposto</TableHead>
            <TableHead className="text-[12px]">Incidência</TableHead>
            <TableHead className="text-[12px]">cClass</TableHead>
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
              <TableCell className="font-mono text-[12px]">{data}</TableCell>
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
          {tributosMultaJuros?.map((tri, i) => (
            <TableRow key={`mj-${i}`} className="text-[13px] bg-amber-50/40 dark:bg-amber-950/10">
              <TableCell className="font-mono text-[12px]">{dataMultaJuros ?? data}</TableCell>
              <TableCell><ImpostoBadge imposto={tri.imposto} /></TableCell>
              <TableCell className="text-amber-700 dark:text-amber-400 font-medium">{tri.incidencia}</TableCell>
              <TableCell className="font-mono text-[12px]">{tri.cst}</TableCell>
              <TableCell className="text-right font-mono text-[12px]">{brl(tri.base)}</TableCell>
              <TableCell className="text-right font-mono text-[12px]">
                {tri.baseReduzida !== 0 ? brl(tri.baseReduzida) : "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-[12px]">{tri.aliquota}</TableCell>
              {contaCorrente ? (
                <>
                  <TableCell className="text-right font-mono text-[12px] font-semibold text-amber-700 dark:text-amber-400">{brl(tri.valor)}</TableCell>
                  <TableCell className="text-right font-mono text-[12px] text-muted-foreground">—</TableCell>
                </>
              ) : (
                <TableCell className="text-right font-mono text-[12px] font-semibold text-amber-700 dark:text-amber-400">{brl(tri.valor)}</TableCell>
              )}
              <TableCell className="text-center text-[12px]">{tri.digitado}</TableCell>
            </TableRow>
          ))}
          {tributosDevolvidos?.map((tri, i) => {
            const isGuia = tri.incidencia === "DARF" || tri.incidencia === "DAR";
            return (
              <TableRow key={`dev-${i}`} className="text-[13px] bg-rose-50/40 dark:bg-rose-950/10">
                <TableCell className="font-mono text-[12px]">{dataDevolucao ?? data}</TableCell>
                <TableCell><ImpostoBadge imposto={tri.imposto} /></TableCell>
                <TableCell className="text-rose-600 dark:text-rose-400 font-medium">{tri.incidencia}</TableCell>
                <TableCell className="font-mono text-[12px] text-muted-foreground">{isGuia ? "—" : tri.cst}</TableCell>
                <TableCell className="text-right font-mono text-[12px] text-rose-600 dark:text-rose-400">
                  {isGuia ? "—" : brl(tri.base)}
                </TableCell>
                <TableCell className="text-right font-mono text-[12px] text-muted-foreground">—</TableCell>
                <TableCell className="text-right font-mono text-[12px]">{isGuia ? "—" : tri.aliquota}</TableCell>
                <TableCell className="text-right font-mono text-[12px] text-muted-foreground">—</TableCell>
                <TableCell className="text-right font-mono text-[12px] font-semibold text-rose-600 dark:text-rose-400">
                  -{brl(Math.abs(tri.valor))}
                </TableCell>
                <TableCell className="text-center text-[12px]">{isGuia ? "—" : tri.digitado}</TableCell>
              </TableRow>
            );
          })}
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
  const navigate = useNavigate();
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

        {/* Alerta de pendência */}
        {r.pendencia && (
          <PendenciaAlerta pendencia={r.pendencia} navigate={navigate} nroUnico={r.nroUnico} />
        )}

        {/* Resumo do Título */}
        <CollapsibleSection title="Resumo do Título">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Dt. Negociação" value={r.dataNegociacao}        mono />
            <SummaryCard label="Empresa"        value={r.empresa}                    />
            <SummaryCard label="Parceiro"       value={r.parceiroNome}               />
            <SummaryCard label="Nro Único"      value={r.nroUnico}              mono />
            <SummaryCard label="Valor"    value={brl(r.vlrDesdobramento)} mono />
            <SummaryCard label="CBS"      value={saldo(r.tributos, r.tributosDevolvidos, r.tributosMultaJuros, "CBS")}     mono colorClass="text-blue-700 dark:text-blue-400" />
            <SummaryCard label="IBS UF"   value={saldo(r.tributos, r.tributosDevolvidos, r.tributosMultaJuros, "IBS UF")}  mono colorClass="text-amber-700 dark:text-amber-400" />
            <SummaryCard label="IBS Mun"  value={saldo(r.tributos, r.tributosDevolvidos, r.tributosMultaJuros, "IBS Mun")} mono colorClass="text-amber-700 dark:text-amber-400" />
          </div>
        </CollapsibleSection>

        {/* Detalhes do Título — TGFFIN */}
        <CollapsibleSection title="Detalhes do Título">
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
        </CollapsibleSection>

        {/* Pedido do Título */}
        <CollapsibleSection title="Pedido do Título">
          {r.pedidoRef ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[12px]">Número</TableHead>
                    <TableHead className="text-[12px]">Dt. Negociação</TableHead>
                    <TableHead className="text-[12px]">Empresa</TableHead>
                    <TableHead className="text-[12px]">Parceiro</TableHead>
                    <TableHead className="text-[12px]">Nro Único</TableHead>
                    <TableHead className="text-[12px]">Tipo Operação</TableHead>
                    <TableHead className="text-[12px] text-right">Valor</TableHead>
                    <TableHead className="text-[12px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="text-[13px]">
                    <TableCell className="font-mono font-medium">{r.pedidoRef.numero}</TableCell>
                    <TableCell className="font-mono text-[12px]">{r.pedidoRef.dataNegociacao}</TableCell>
                    <TableCell>{r.pedidoRef.empresa}</TableCell>
                    <TableCell>
                      <div>{r.pedidoRef.parceiroNome}</div>
                      <div className="text-[11px] text-muted-foreground">{r.pedidoRef.parceiroCNPJ}</div>
                    </TableCell>
                    <TableCell className="font-mono">{r.pedidoRef.nroUnico}</TableCell>
                    <TableCell>{r.pedidoRef.tipoOperacao}</TableCell>
                    <TableCell className="text-right font-mono">{brl(r.pedidoRef.valor)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[12px] gap-1"
                        onClick={() =>
                          navigate(ERoutes.MOVIMENTACOES_DOCUMENTOS_MOVIMENTO, {
                            state: { openNroUnico: r.pedidoRef!.id },
                          })
                        }
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Detalhar
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/20 p-6 flex flex-col items-center gap-3 text-center">
              <p className="text-[13px] text-muted-foreground">Não existe um pedido relacionado</p>
              <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                Relacionar documento
              </Button>
            </div>
          )}
        </CollapsibleSection>

        {/* Documentos do Título */}
        <CollapsibleSection title="Documentos do Título">
          {r.documentos && r.documentos.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[12px] text-center">Pendências</TableHead>
                    <TableHead className="text-[12px]">Nro Único</TableHead>
                    <TableHead className="text-[12px]">Nro Nota</TableHead>
                    <TableHead className="text-[12px]">Chave DFe</TableHead>
                    <TableHead className="text-[12px]">Status DFe</TableHead>
                    <TableHead className="text-[12px]">Finalidade</TableHead>
                    <TableHead className="text-[12px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {r.documentos.map((doc, i) => (
                    <TableRow key={i} className="text-[13px]">
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Sem pendências" />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{doc.nroUnico}</TableCell>
                      <TableCell className="font-mono">{doc.nroNota}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="font-mono text-[11px] text-muted-foreground truncate block" title={doc.chaveDFe}>
                          {doc.chaveDFe}
                        </span>
                      </TableCell>
                      <TableCell><BadgeDFe status={doc.statusDFe} /></TableCell>
                      <TableCell><FinalidadeBadge finalidade={doc.finalidade} /></TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[12px] gap-1"
                          onClick={() =>
                            navigate(ERoutes.MOVIMENTACOES_DOCUMENTOS_MOVIMENTO, {
                              state: { openChaveDFe: doc.chaveDFe },
                            })
                          }
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
          ) : r.vlrBaixa > 0 ? (
            <div className="rounded-lg border bg-muted/20 p-6 flex flex-col items-center gap-3 text-center">
              <p className="text-[13px] text-muted-foreground">Não existe um documento fiscal relacionado</p>
              <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Gerar Nota de Débito
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/20 p-6 flex items-center justify-center">
              <p className="text-[13px] text-muted-foreground">Não existe um documento fiscal relacionado</p>
            </div>
          )}
        </CollapsibleSection>

        {/* Título Referenciado */}
        {r.tituloRef && (
          <CollapsibleSection title="Título Referenciado">
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
                    <TableHead className="text-[12px] text-right">IBS UF</TableHead>
                    <TableHead className="text-[12px] text-right">IBS Mun</TableHead>
                    <TableHead className="text-[12px] text-right">CBS</TableHead>
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
          </CollapsibleSection>
        )}

        {/* Tributos do Título — TGFIIF */}
        <CollapsibleSection title="Tributos do Título">
          <TributoTable
            tributos={r.tributos}
            tributosDevolvidos={r.tributosDevolvidos}
            tributosMultaJuros={r.tributosMultaJuros}
            data={r.dataNegociacao}
            dataMultaJuros={r.dataBaixa !== "—" ? r.dataBaixa : undefined}
            dataDevolucao={r.tituloRef?.dataNegociacao}
          />
        </CollapsibleSection>

        {/* Guias do Título */}
        {r.conciliacaoApuracaoAssistida && (
          <ConciliacaoSection conciliacao={r.conciliacaoApuracaoAssistida} />
        )}

      </div>
    </div>
  );
}

// ─── Guias do Título ──────────────────────────────────────────────────────────

function ConciliacaoSection({ conciliacao: c }: { conciliacao: ConciliacaoApuracaoAssistida }) {
  return (
    <CollapsibleSection title="Guias do Título">
      {c.guias.length === 0 ? (
        <div className="rounded-lg border bg-muted/20 p-6 flex items-center justify-center">
          <p className="text-[13px] text-muted-foreground">Nenhuma guia de pagamento encontrada para este título.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[12px]">Nro Único</TableHead>
                <TableHead className="text-[12px]">Tipo de Movimento</TableHead>
                <TableHead className="text-[12px]">Tipo Título</TableHead>
                <TableHead className="text-[12px] text-right">Valor</TableHead>
                <TableHead className="text-[12px] text-center">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {c.guias.map((g, i) => (
                <TableRow key={i} className="text-[13px]">
                  <TableCell className="font-mono">{g.nroUnico}</TableCell>
                  <TableCell
                    className="font-medium text-red-700 dark:text-red-400"
                  >
                    {g.tipoMovimento}
                  </TableCell>
                  <TableCell><TipoTituloBadge tipo={g.tipoTitulo} /></TableCell>
                  <TableCell className="text-right font-mono">{brl(g.valor)}</TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" variant="outline" className="h-7 text-[12px] gap-1" disabled>
                      <Eye className="h-3.5 w-3.5" />
                      Detalhar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </CollapsibleSection>
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
        <CollapsibleSection title="Resumo do Título">
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
        </CollapsibleSection>

        {/* Título Referenciado — back to parent */}
        <CollapsibleSection title="Título Referenciado">
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
        </CollapsibleSection>

        {/* Tributos do Título — somente quando tituloRef é Receita com tributos */}
        {tr.tipo === "Receita" && tr.tributos && (
          <CollapsibleSection title="Tributos do Título">
            <TributoTable
              tributos={tr.tributos}
              tributosDevolvidos={tr.tributosDevolvidos}
              data={tr.dataNegociacao}
              dataDevolucao={p.dataNegociacao}
            />
          </CollapsibleSection>
        )}

      </div>
    </div>
  );
}
