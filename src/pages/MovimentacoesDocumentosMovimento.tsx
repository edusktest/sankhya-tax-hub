import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ERoutes } from "@/routes/interface";
import {
  FileStack,
  ChevronRight,
  ExternalLink,
  Eye,
  Filter,
  X,
  FilePlus,
  Link2,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  CalendarIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

type TipoMovimento = "Venda" | "Compra" | "Devolução de Venda" | "Devolução de Compra" | "Multa e Juros" | "Pedido de Venda" | "Pedido de Compra";

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

interface DocumentoFiscalRef {
  id: string;
  dataNegociacao: string;
  empresa: string;
  parceiroNome: string;
  parceiroCNPJ: string;
  tipoMovimento: TipoMovimento;
  finalidadeOperacao?: string;
  numero: string;
  chaveDFe: string;
  valor: number;
  totalIBSUF: number;
  totalIBSMun: number;
  totalCBS: number;
  pendencia?: string;
}

interface TituloRef {
  id: string;
  dataNegociacao: string;
  empresa: string;
  parceiroNome: string;
  parceiroCNPJ: string;
  tipo: "Receita" | "Despesa";
  tipoMovimento: TipoMovimento;
  nroUnico: string;
  nroNota: string;
  vlrDesdobramento: number;
  totalIBSUF: number;
  totalIBSMun: number;
  totalCBS: number;
  tributos?: Tributo[];
  tributosDevolvidos?: Tributo[];
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
  tributosDevolvidos?: Tributo[];
  tributosMultaJuros?: Tributo[];
  tituloRef?: TituloRef;
  documentos?: DocumentoTitulo[];
  pendencia?: string;
  pedidoRef?: { id: string; numero: string };
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
  documentosFiscaisRef?: DocumentoFiscalRef[];
  pedidoRef?: { id: string; numero: string };
  pendencia?: string;
}

// ─── Pendências ───────────────────────────────────────────────────────────────

export const PENDENCIAS_DOC = {
  PRT0001: "Títulos com pendências",
} as const;

export type CodigoPRT_DOC = keyof typeof PENDENCIAS_DOC;

export interface PendenciaDoc {
  codigo: CodigoPRT_DOC;
  descricao: string;
}

export function getDocumentoPendencias(d: DocumentoMovimento): PendenciaDoc[] {
  if (d.pendencia || d.titulos.some((t) => t.pendencia))
    return [{ codigo: "PRT0001", descricao: PENDENCIAS_DOC.PRT0001 }];
  return [];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const EMPRESAS = [
  { cod: "001", nome: "Sankhya Gestão de Negócios Ltda" },
  { cod: "002", nome: "Sankhya São Paulo S.A." },
  { cod: "003", nome: "Distribuidora Norte Ltda" },
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
    documentosFiscaisRef: [{
      id: "ext-nf-4321",
      dataNegociacao: "18/04/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Grupo Nexus S.A.",
      parceiroCNPJ: "23.456.789/0001-01",
      tipoMovimento: "Venda",
      finalidadeOperacao: "Normal",
      numero: "1198",
      chaveDFe: "35260123456789000100550010000011981234567880",
      valor: 11300.0,
      totalIBSUF: 395.5,
      totalIBSMun: 395.5,
      totalCBS: 565.0,
    }],
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
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 11300.0, dataBaixa: "25/04/2026",
        tributos: [
          { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 11300, baseReduzida: 0, aliquota: "5,00%", valor: 565.0,  digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 11300, baseReduzida: 0, aliquota: "3,50%", valor: 395.5,  digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 11300, baseReduzida: 0, aliquota: "3,50%", valor: 395.5,  digitado: "Não" },
        ],
        documentos: [
          { nroUnico: "100.004", nroNota: "NF-001310", chaveDFe: "35260123456789000100550010000012341234567890", statusDFe: "Autorizado", finalidade: "Normal" },
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
        documentos: [
          { nroUnico: "200.020", nroNota: "NF-002200", chaveDFe: "35260267890100000123550010000022001234567891", statusDFe: "Autorizado", finalidade: "Normal" },
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
        documentos: [
          { nroUnico: "200.020", nroNota: "NF-002200", chaveDFe: "35260267890100000123550010000022001234567891", statusDFe: "Autorizado", finalidade: "Normal" },
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
        documentos: [
          { nroUnico: "200.020", nroNota: "NF-002200", chaveDFe: "35260267890100000123550010000022001234567891", statusDFe: "Autorizado", finalidade: "Normal" },
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
        documentos: [
          { nroUnico: "600.020", nroNota: "NF-600100", chaveDFe: "35260288999000000133550010000061001234567892", statusDFe: "Autorizado", finalidade: "Normal" },
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
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 5100.0, dataBaixa: "14/05/2026",
        tributos: [
          { imposto: "CBS",     incidencia: "Entrada", cst: "50", base: 5100, baseReduzida: 0, aliquota: "5,00%", valor: 255.0, digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Entrada", cst: "50", base: 5100, baseReduzida: 0, aliquota: "3,50%", valor: 178.5, digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Entrada", cst: "50", base: 5100, baseReduzida: 0, aliquota: "3,50%", valor: 178.5, digitado: "Não" },
        ],
        documentos: [
          { nroUnico: "500.005", nroNota: "NF-500210", chaveDFe: "35260255666777000188550010000052101234567893", statusDFe: "Autorizado", finalidade: "Normal" },
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
    documentosFiscaisRef: [{
      id: "1",
      dataNegociacao: "25/04/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Grupo Nexus S.A.",
      parceiroCNPJ: "23.456.789/0001-01",
      tipoMovimento: "Venda",
      finalidadeOperacao: "Normal",
      numero: "1234",
      chaveDFe: "35260123456789000100550010000012341234567890",
      valor: 11300.0,
      totalIBSUF: 395.5,
      totalIBSMun: 395.5,
      totalCBS: 565.0,
    }],
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
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 5650.0, dataBaixa: "12/05/2026",
        tributos: [
          { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 5650, baseReduzida: 0, aliquota: "5,00%", valor: 282.5,  digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 5650, baseReduzida: 0, aliquota: "3,50%", valor: 197.75, digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 5650, baseReduzida: 0, aliquota: "3,50%", valor: 197.75, digitado: "Não" },
        ],
        documentos: [
          { nroUnico: "100.009", nroNota: "NF-001310", chaveDFe: "35260123456789000100550010000013101234567894", statusDFe: "Autorizado", finalidade: "Devolução" },
        ],
      },
    ],
  },

  // ── Venda – cenário devolução total (par com id "8") ─────────────────────
  {
    id: "7",
    dataNegociacao: "08/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Indústria Central Ltda",
    parceiroCNPJ: "44.555.666/0001-22",
    numero: "3050",
    chaveDFe: "35260244555666000122550010000030501234567896",
    valor: 18600.0,
    totalIBSUF: 651.0,
    totalIBSMun: 651.0,
    totalCBS: 930.0,
    empresaNegociacao: "002 - Sankhya São Paulo S.A.",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "08/05/2026",
    dtFaturamento: "08/05/2026",
    dtMovimento: "08/05/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "700.001",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    documentosFiscaisRef: [{
      id: "8",
      dataNegociacao: "19/05/2026",
      empresa: "002 - Sankhya São Paulo S.A.",
      parceiroNome: "Indústria Central Ltda",
      parceiroCNPJ: "44.555.666/0001-22",
      tipoMovimento: "Devolução de Venda",
      finalidadeOperacao: "Devolução",
      numero: "3100",
      chaveDFe: "35260244555666000122550010000031001234567897",
      valor: 18600.0,
      totalIBSUF: 651.0,
      totalIBSMun: 651.0,
      totalCBS: 930.0,
    }],
    titulos: [
      {
        id: "t7",
        dataNegociacao: "08/05/2026",
        empresa: "002 - Sankhya São Paulo S.A.",
        parceiroNome: "Indústria Central Ltda",
        parceiroCNPJ: "44.555.666/0001-22",
        tipo: "Receita",
        tipoMovimento: "Venda",
        nroUnico: "700.001",
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
          { nroUnico: "700.001", nroNota: "NF-003050", chaveDFe: "35260244555666000122550010000030501234567896", statusDFe: "Autorizado", finalidade: "Normal" },
        ],
      },
    ],
  },

  // ── Devolução de Venda total – mesmo valor da Venda id "7" ────────────────
  {
    id: "8",
    dataNegociacao: "19/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Indústria Central Ltda",
    parceiroCNPJ: "44.555.666/0001-22",
    numero: "3100",
    chaveDFe: "35260244555666000122550010000031001234567897",
    valor: 18600.0,
    totalIBSUF: 651.0,
    totalIBSMun: 651.0,
    totalCBS: 930.0,
    empresaNegociacao: "002 - Sankhya São Paulo S.A.",
    tipoOperacao: "1.202 - Devolução de Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "19/05/2026",
    dtFaturamento: "19/05/2026",
    dtMovimento: "19/05/2026",
    finalidadeOperacao: "Devolução",
    nroNFSe: "—",
    nroUnico: "800.001",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Devolução de Venda",
    documentosFiscaisRef: [{
      id: "7",
      dataNegociacao: "08/05/2026",
      empresa: "002 - Sankhya São Paulo S.A.",
      parceiroNome: "Indústria Central Ltda",
      parceiroCNPJ: "44.555.666/0001-22",
      tipoMovimento: "Venda",
      finalidadeOperacao: "Normal",
      numero: "3050",
      chaveDFe: "35260244555666000122550010000030501234567896",
      valor: 18600.0,
      totalIBSUF: 651.0,
      totalIBSMun: 651.0,
      totalCBS: 930.0,
    }],
    titulos: [
      {
        id: "t8",
        dataNegociacao: "19/05/2026",
        empresa: "002 - Sankhya São Paulo S.A.",
        parceiroNome: "Indústria Central Ltda",
        parceiroCNPJ: "44.555.666/0001-22",
        tipo: "Despesa",
        tipoMovimento: "Devolução de Venda",
        nroUnico: "800.001",
        vlrDesdobramento: 18600.0,
        totalIBSUF: 651.0,
        totalIBSMun: 651.0,
        totalCBS: 930.0,
        nroNota: "NF-003100",
        desdob: "001/001",
        tipoOperacao: "1.202 - Estorno",
        dtEntradaSaida: "19/05/2026",
        dtVencimento: "19/05/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 18600.0, dataBaixa: "19/05/2026",
        tributos: [
          { imposto: "CBS",     incidencia: "Saída", cst: "01", base: -18600, baseReduzida: 0, aliquota: "5,00%", valor: -930.0,  digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: -18600, baseReduzida: 0, aliquota: "3,50%", valor: -651.0,  digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: -18600, baseReduzida: 0, aliquota: "3,50%", valor: -651.0,  digitado: "Não" },
        ],
        tituloRef: {
          id: "t7",
          dataNegociacao: "08/05/2026",
          empresa: "002 - Sankhya São Paulo S.A.",
          parceiroNome: "Indústria Central Ltda",
          parceiroCNPJ: "44.555.666/0001-22",
          tipo: "Receita",
          tipoMovimento: "Venda",
          nroUnico: "700.001",
          nroNota: "NF-003050",
          vlrDesdobramento: 18600.0,
          totalIBSUF: 651.0,
          totalIBSMun: 651.0,
          totalCBS: 930.0,
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
        },
        documentos: [
          { nroUnico: "800.001", nroNota: "NF-003100", chaveDFe: "35260244555666000122550010000031001234567897", statusDFe: "Autorizado", finalidade: "Devolução" },
        ],
      },
    ],
  },

  // ── Venda – devolução parcial 40% (par com id "10") ─────────────────────
  {
    id: "9",
    dataNegociacao: "12/05/2026",
    empresa: "003 - Distribuidora Norte Ltda",
    empresaCod: "003",
    parceiroNome: "Atacado Regional Ltda",
    parceiroCNPJ: "33.444.555/0001-99",
    numero: "3200",
    chaveDFe: "35260233444555000199550010000032001234567898",
    valor: 8400.0,
    totalIBSUF: 294.0,
    totalIBSMun: 294.0,
    totalCBS: 420.0,
    empresaNegociacao: "003 - Distribuidora Norte Ltda",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "12/05/2026",
    dtFaturamento: "12/05/2026",
    dtMovimento: "12/05/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "900.001",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    documentosFiscaisRef: [{
      id: "10",
      dataNegociacao: "20/05/2026",
      empresa: "003 - Distribuidora Norte Ltda",
      parceiroNome: "Atacado Regional Ltda",
      parceiroCNPJ: "33.444.555/0001-99",
      tipoMovimento: "Devolução de Venda",
      finalidadeOperacao: "Devolução",
      numero: "3250",
      chaveDFe: "35260233444555000199550010000032501234567899",
      valor: 3360.0,
      totalIBSUF: 117.60,
      totalIBSMun: 117.60,
      totalCBS: 168.0,
    }],
    titulos: [
      {
        id: "t9",
        dataNegociacao: "12/05/2026",
        empresa: "003 - Distribuidora Norte Ltda",
        parceiroNome: "Atacado Regional Ltda",
        parceiroCNPJ: "33.444.555/0001-99",
        tipo: "Receita",
        tipoMovimento: "Venda",
        nroUnico: "900.001",
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
          { nroUnico: "900.001", nroNota: "NF-003200", chaveDFe: "35260233444555000199550010000032001234567898", statusDFe: "Autorizado", finalidade: "Normal" },
        ],
      },
    ],
  },

  // ── Devolução de Venda parcial 40% (par com id "9") ───────────────────────
  {
    id: "10",
    dataNegociacao: "20/05/2026",
    empresa: "003 - Distribuidora Norte Ltda",
    empresaCod: "003",
    parceiroNome: "Atacado Regional Ltda",
    parceiroCNPJ: "33.444.555/0001-99",
    numero: "3250",
    chaveDFe: "35260233444555000199550010000032501234567899",
    valor: 3360.0,
    totalIBSUF: 117.60,
    totalIBSMun: 117.60,
    totalCBS: 168.0,
    empresaNegociacao: "003 - Distribuidora Norte Ltda",
    tipoOperacao: "1.202 - Devolução de Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "20/05/2026",
    dtFaturamento: "20/05/2026",
    dtMovimento: "20/05/2026",
    finalidadeOperacao: "Devolução",
    nroNFSe: "—",
    nroUnico: "950.001",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Devolução de Venda",
    documentosFiscaisRef: [{
      id: "9",
      dataNegociacao: "12/05/2026",
      empresa: "003 - Distribuidora Norte Ltda",
      parceiroNome: "Atacado Regional Ltda",
      parceiroCNPJ: "33.444.555/0001-99",
      tipoMovimento: "Venda",
      finalidadeOperacao: "Normal",
      numero: "3200",
      chaveDFe: "35260233444555000199550010000032001234567898",
      valor: 8400.0,
      totalIBSUF: 294.0,
      totalIBSMun: 294.0,
      totalCBS: 420.0,
    }],
    titulos: [
      {
        id: "t10",
        dataNegociacao: "20/05/2026",
        empresa: "003 - Distribuidora Norte Ltda",
        parceiroNome: "Atacado Regional Ltda",
        parceiroCNPJ: "33.444.555/0001-99",
        tipo: "Despesa",
        tipoMovimento: "Devolução de Venda",
        nroUnico: "950.001",
        vlrDesdobramento: 3360.0,
        totalIBSUF: 117.60,
        totalIBSMun: 117.60,
        totalCBS: 168.0,
        nroNota: "NF-003250",
        desdob: "001/001",
        tipoOperacao: "1.202 - Estorno",
        dtEntradaSaida: "20/05/2026",
        dtVencimento: "20/05/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 3360.0, dataBaixa: "20/05/2026",
        tributos: [
          { imposto: "CBS",     incidencia: "Saída", cst: "01", base: -3360, baseReduzida: 0, aliquota: "5,00%", valor: -168.0,   digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: -3360, baseReduzida: 0, aliquota: "3,50%", valor: -117.60,  digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: -3360, baseReduzida: 0, aliquota: "3,50%", valor: -117.60,  digitado: "Não" },
        ],
        tituloRef: {
          id: "t9",
          dataNegociacao: "12/05/2026",
          empresa: "003 - Distribuidora Norte Ltda",
          parceiroNome: "Atacado Regional Ltda",
          parceiroCNPJ: "33.444.555/0001-99",
          tipo: "Receita",
          tipoMovimento: "Venda",
          nroUnico: "900.001",
          nroNota: "NF-003200",
          vlrDesdobramento: 8400.0,
          totalIBSUF: 294.0,
          totalIBSMun: 294.0,
          totalCBS: 420.0,
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
        },
        documentos: [
          { nroUnico: "950.001", nroNota: "NF-003250", chaveDFe: "35260233444555000199550010000032501234567899", statusDFe: "Autorizado", finalidade: "Devolução" },
        ],
      },
    ],
  },

  // ── Venda – Transportes Delta (com Nota de Débito por Multa e Juros) ─────
  {
    id: "11",
    dataNegociacao: "15/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Transportes Delta S.A.",
    parceiroCNPJ: "22.333.444/0001-66",
    numero: "1400",
    chaveDFe: "35260123456789000100550010000014001234567901",
    valor: 12000.0,
    totalIBSUF: 420.0,
    totalIBSMun: 420.0,
    totalCBS: 600.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "15/05/2026",
    dtFaturamento: "15/05/2026",
    dtMovimento: "15/05/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "400.001",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    documentosFiscaisRef: [{
      id: "12",
      dataNegociacao: "25/05/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Transportes Delta S.A.",
      parceiroCNPJ: "22.333.444/0001-66",
      tipoMovimento: "Venda",
      finalidadeOperacao: "Débito",
      numero: "20",
      chaveDFe: "35260123456789000100550010000000201234567902",
      valor: 540.0,
      totalIBSUF: 18.9,
      totalIBSMun: 18.9,
      totalCBS: 27.0,
    }],
    titulos: [
      {
        id: "t11",
        dataNegociacao: "15/05/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Transportes Delta S.A.",
        parceiroCNPJ: "22.333.444/0001-66",
        tipo: "Receita",
        tipoMovimento: "Venda",
        nroUnico: "400.001",
        vlrDesdobramento: 12000.0,
        totalIBSUF: 420.0,
        totalIBSMun: 420.0,
        totalCBS: 600.0,
        nroNota: "NF-001400",
        desdob: "001/001",
        tipoOperacao: "1.201 - Recebimento",
        dtEntradaSaida: "15/05/2026",
        dtVencimento: "15/06/2026",
        vlrDesconto: 0, vlrMulta: 360.0, vlrJuros: 180.0, vlrBaixa: 12540.0, dataBaixa: "25/05/2026",
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
          { nroUnico: "400.001", nroNota: "NF-001400", chaveDFe: "35260123456789000100550010000014001234567901", statusDFe: "Autorizado", finalidade: "Normal" },
          { nroUnico: "400.010", nroNota: "ND-000020", chaveDFe: "35260123456789000100550010000000201234567902", statusDFe: "Autorizado", finalidade: "Débito" },
        ],
      },
    ],
  },

  // ── Nota de Débito – Transportes Delta (Multa e Juros da NF-001400) ───────
  {
    id: "12",
    dataNegociacao: "25/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Transportes Delta S.A.",
    parceiroCNPJ: "22.333.444/0001-66",
    numero: "20",
    chaveDFe: "35260123456789000100550010000000201234567902",
    valor: 540.0,
    totalIBSUF: 18.9,
    totalIBSMun: 18.9,
    totalCBS: 27.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.209 - Nota de Débito",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "25/05/2026",
    dtFaturamento: "25/05/2026",
    dtMovimento: "25/05/2026",
    finalidadeOperacao: "Débito",
    nroNFSe: "—",
    nroUnico: "400.010",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    documentosFiscaisRef: [{
      id: "11",
      dataNegociacao: "15/05/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Transportes Delta S.A.",
      parceiroCNPJ: "22.333.444/0001-66",
      tipoMovimento: "Venda",
      finalidadeOperacao: "Normal",
      numero: "1400",
      chaveDFe: "35260123456789000100550010000014001234567901",
      valor: 12000.0,
      totalIBSUF: 420.0,
      totalIBSMun: 420.0,
      totalCBS: 600.0,
    }],
    titulos: [],
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
        documentos: [
          { nroUnico: "300.011", nroNota: "NF-000180", chaveDFe: "35260288999000000133550010000001801234567895", statusDFe: "Autorizado", finalidade: "Devolução" },
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
        documentos: [
          { nroUnico: "300.012", nroNota: "NF-000180", chaveDFe: "35260288999000000133550010000001801234567895", statusDFe: "Autorizado", finalidade: "Devolução" },
        ],
      },
    ],
  },

  // ── Venda – sem títulos ───────────────────────────────────────────────────
  {
    id: "13",
    dataNegociacao: "20/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Tech Solutions Ltda",
    parceiroCNPJ: "11.222.333/0001-44",
    numero: "5500",
    chaveDFe: "35260123456789000100550010000055001234567800",
    valor: 8500.0,
    totalIBSUF: 297.5,
    totalIBSMun: 297.5,
    totalCBS: 425.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "20/05/2026",
    dtFaturamento: "20/05/2026",
    dtMovimento: "20/05/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "500.001",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    titulos: [],
  },

  // ── Venda – título sem documentos ─────────────────────────────────────────
  {
    id: "14",
    dataNegociacao: "22/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Global Parts S.A.",
    parceiroCNPJ: "55.666.777/0001-88",
    numero: "6601",
    chaveDFe: "35260267890100000123550010000066011234567810",
    valor: 15000.0,
    totalIBSUF: 525.0,
    totalIBSMun: 525.0,
    totalCBS: 750.0,
    empresaNegociacao: "002 - Sankhya São Paulo S.A.",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "22/05/2026",
    dtFaturamento: "22/05/2026",
    dtMovimento: "22/05/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "600.001",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    titulos: [
      {
        id: "t14",
        dataNegociacao: "22/05/2026",
        empresa: "002 - Sankhya São Paulo S.A.",
        parceiroNome: "Global Parts S.A.",
        parceiroCNPJ: "55.666.777/0001-88",
        tipo: "Receita",
        tipoMovimento: "Venda",
        nroUnico: "600.002",
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
    ],
  },

  // ── Venda (ND antecipação) – Janeiro (ND-000101 / R$ 20,00) ─────────────────
  {
    id: "ant1-nd",
    dataNegociacao: "15/01/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Comércio Brasil Ltda",
    parceiroCNPJ: "45.678.901/0001-23",
    numero: "101",
    chaveDFe: "35260101234567890001550010000001010000010101",
    valor: 20.0,
    totalIBSUF: 0.7,
    totalIBSMun: 0.7,
    totalCBS: 1.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.209 - Nota de Débito",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "15/01/2026",
    dtFaturamento: "15/01/2026",
    dtMovimento: "15/01/2026",
    finalidadeOperacao: "Débito",
    nroNFSe: "—",
    nroUnico: "100.101",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    titulos: [
      {
        id: "t-ant1",
        dataNegociacao: "15/01/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Comércio Brasil Ltda",
        parceiroCNPJ: "45.678.901/0001-23",
        tipo: "Receita",
        tipoMovimento: "Venda",
        nroUnico: "100.101",
        vlrDesdobramento: 20.0,
        totalIBSUF: 0.7,
        totalIBSMun: 0.7,
        totalCBS: 1.0,
        nroNota: "ND-000101",
        desdob: "001/001",
        tipoOperacao: "1.209 - Nota de Débito",
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
    ],
  },

  // ── Venda (ND antecipação) – Fevereiro (ND-000102 / R$ 30,00) ───────────────
  {
    id: "ant2-nd",
    dataNegociacao: "10/02/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Comércio Brasil Ltda",
    parceiroCNPJ: "45.678.901/0001-23",
    numero: "102",
    chaveDFe: "35260201234567890001550010000001020000010201",
    valor: 30.0,
    totalIBSUF: 1.05,
    totalIBSMun: 1.05,
    totalCBS: 1.5,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.209 - Nota de Débito",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "10/02/2026",
    dtFaturamento: "10/02/2026",
    dtMovimento: "10/02/2026",
    finalidadeOperacao: "Débito",
    nroNFSe: "—",
    nroUnico: "100.102",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    titulos: [
      {
        id: "t-ant2",
        dataNegociacao: "10/02/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Comércio Brasil Ltda",
        parceiroCNPJ: "45.678.901/0001-23",
        tipo: "Receita",
        tipoMovimento: "Venda",
        nroUnico: "100.102",
        vlrDesdobramento: 30.0,
        totalIBSUF: 1.05,
        totalIBSMun: 1.05,
        totalCBS: 1.5,
        nroNota: "ND-000102",
        desdob: "001/001",
        tipoOperacao: "1.209 - Nota de Débito",
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
    ],
  },

  // ── Fornecimento – Março (NF-000300 / R$ 50,00) – sem título, ref às 2 NDs ──
  {
    id: "forn-nd",
    dataNegociacao: "20/03/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Comércio Brasil Ltda",
    parceiroCNPJ: "45.678.901/0001-23",
    numero: "300",
    chaveDFe: "35260301234567890001550010000003000000030001",
    valor: 50.0,
    totalIBSUF: 1.75,
    totalIBSMun: 1.75,
    totalCBS: 2.5,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "20/03/2026",
    dtFaturamento: "20/03/2026",
    dtMovimento: "20/03/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "100.300",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    documentosFiscaisRef: [
      {
        id: "ant1-nd",
        dataNegociacao: "15/01/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Comércio Brasil Ltda",
        parceiroCNPJ: "45.678.901/0001-23",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "101",
        chaveDFe: "35260101234567890001550010000001010000010101",
        valor: 20.0,
        totalIBSUF: 0.7,
        totalIBSMun: 0.7,
        totalCBS: 1.0,
      },
      {
        id: "ant2-nd",
        dataNegociacao: "10/02/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Comércio Brasil Ltda",
        parceiroCNPJ: "45.678.901/0001-23",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "102",
        chaveDFe: "35260201234567890001550010000001020000010201",
        valor: 30.0,
        totalIBSUF: 1.05,
        totalIBSMun: 1.05,
        totalCBS: 1.5,
      },
    ],
    titulos: [],
  },

  // ── Pedido de Compra – Fornecedor Alpha Ltda (R$ 200,00) ────────────────────
  {
    id: "pedido-compra-xpto",
    dataNegociacao: "01/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Fornecedor Alpha Ltda",
    parceiroCNPJ: "11.222.333/0001-44",
    numero: "PC-001",
    chaveDFe: "—",
    valor: 200.0,
    totalIBSUF: 7.0,
    totalIBSMun: 7.0,
    totalCBS: 10.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "2.001 - Pedido de Compra",
    tipoNegociacao: "A Prazo",
    dtEntradaSaida: "01/06/2026",
    dtFaturamento: "—",
    dtMovimento: "01/06/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "500.200",
    serieNota: "—",
    statusNota: "—",
    notaModelo: "—",
    tipoMovimento: "Pedido de Compra",
    titulos: [
      {
        id: "t-compra-xpto",
        dataNegociacao: "01/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Fornecedor Alpha Ltda",
        parceiroCNPJ: "11.222.333/0001-44",
        tipo: "Despesa",
        tipoMovimento: "Pedido de Compra",
        nroUnico: "500.200",
        vlrDesdobramento: 200.0,
        totalIBSUF: 7.0,
        totalIBSMun: 7.0,
        totalCBS: 10.0,
        nroNota: "—",
        desdob: "001/001",
        tipoOperacao: "2.001 - Pedido de Compra",
        dtEntradaSaida: "01/06/2026",
        dtVencimento: "01/06/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 200.0, dataBaixa: "01/06/2026",
        tributos: [
          { imposto: "CBS",     incidencia: "Entrada", cst: "50", base: 200, baseReduzida: 0, aliquota: "5,00%", valor: 10.0, digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Entrada", cst: "50", base: 200, baseReduzida: 0, aliquota: "3,50%", valor:  7.0, digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Entrada", cst: "50", base: 200, baseReduzida: 0, aliquota: "3,50%", valor:  7.0, digitado: "Não" },
        ],
        documentos: [],
        pendencia: "Esse título não tem um documento fiscal relacionado. Veja as opções disponíveis através do grupo Documentos do Título.",
        pedidoRef: { id: "pedido-compra-xpto", numero: "PC-001" },
      },
    ],
  },

  // ── Pedido de Venda – PV-002 (R$ 800,00 / 2 títulos com Nota de Débito) ─────
  {
    id: "pedido-pv002",
    dataNegociacao: "15/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Tech Solutions S.A.",
    parceiroCNPJ: "67.890.123/0001-45",
    numero: "PV-002",
    chaveDFe: "—",
    valor: 800.0,
    totalIBSUF: 28.0,
    totalIBSMun: 28.0,
    totalCBS: 40.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.001 - Pedido de Venda",
    tipoNegociacao: "A Prazo",
    dtEntradaSaida: "15/05/2026",
    dtFaturamento: "—",
    dtMovimento: "15/05/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "100.400",
    serieNota: "—",
    statusNota: "—",
    notaModelo: "—",
    tipoMovimento: "Pedido de Venda",
    pendencia: "Esse pedido não tem um documento fiscal referenciado com Finalidade Normal. Acesse o Portal de Vendas e fature esse pedido.",
    documentosFiscaisRef: [
      {
        id: "nd-pv002-1",
        dataNegociacao: "01/05/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Tech Solutions S.A.",
        parceiroCNPJ: "67.890.123/0001-45",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "ND-0301",
        chaveDFe: "35260501234567890001550010000003011234560301",
        valor: 400.0,
        totalIBSUF: 14.0,
        totalIBSMun: 14.0,
        totalCBS: 20.0,
      },
      {
        id: "nd-pv002-2",
        dataNegociacao: "01/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Tech Solutions S.A.",
        parceiroCNPJ: "67.890.123/0001-45",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "ND-0302",
        chaveDFe: "35260601234567890001550010000003021234560302",
        valor: 400.0,
        totalIBSUF: 14.0,
        totalIBSMun: 14.0,
        totalCBS: 20.0,
      },
    ],
    titulos: [
      {
        id: "t-pv002-1",
        dataNegociacao: "15/05/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Tech Solutions S.A.",
        parceiroCNPJ: "67.890.123/0001-45",
        tipo: "Receita",
        tipoMovimento: "Pedido de Venda",
        nroUnico: "100.401",
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
        pedidoRef: { id: "pedido-pv002", numero: "PV-002" },
      },
      {
        id: "t-pv002-2",
        dataNegociacao: "15/05/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Tech Solutions S.A.",
        parceiroCNPJ: "67.890.123/0001-45",
        tipo: "Receita",
        tipoMovimento: "Pedido de Venda",
        nroUnico: "100.402",
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
        pedidoRef: { id: "pedido-pv002", numero: "PV-002" },
      },
    ],
  },

  // ── Nota de Débito – PV-002 Parcela 1 (ND-0301 / R$ 400,00 / venc 01/05/2026) ─
  {
    id: "nd-pv002-1",
    dataNegociacao: "01/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Tech Solutions S.A.",
    parceiroCNPJ: "67.890.123/0001-45",
    numero: "ND-0301",
    chaveDFe: "35260501234567890001550010000003011234560301",
    valor: 400.0,
    totalIBSUF: 14.0,
    totalIBSMun: 14.0,
    totalCBS: 20.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.209 - Nota de Débito",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "01/05/2026",
    dtFaturamento: "01/05/2026",
    dtMovimento: "01/05/2026",
    finalidadeOperacao: "Débito",
    nroNFSe: "—",
    nroUnico: "100.403",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    pedidoRef: { id: "pedido-pv002", numero: "PV-002" },
    titulos: [],
  },

  // ── Nota de Débito – PV-002 Parcela 2 (ND-0302 / R$ 400,00 / venc 01/06/2026) ─
  {
    id: "nd-pv002-2",
    dataNegociacao: "01/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Tech Solutions S.A.",
    parceiroCNPJ: "67.890.123/0001-45",
    numero: "ND-0302",
    chaveDFe: "35260601234567890001550010000003021234560302",
    valor: 400.0,
    totalIBSUF: 14.0,
    totalIBSMun: 14.0,
    totalCBS: 20.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.209 - Nota de Débito",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "01/06/2026",
    dtFaturamento: "01/06/2026",
    dtMovimento: "01/06/2026",
    finalidadeOperacao: "Débito",
    nroNFSe: "—",
    nroUnico: "100.404",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    pedidoRef: { id: "pedido-pv002", numero: "PV-002" },
    titulos: [],
  },

  // ── Pedido de Venda – PV-003 (R$ 900,00 / 2 títulos + NF Normal) ────────────
  {
    id: "pedido-pv003",
    dataNegociacao: "20/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Varejo Central S.A.",
    parceiroCNPJ: "98.765.432/0001-11",
    numero: "PV-003",
    chaveDFe: "—",
    valor: 900.0,
    totalIBSUF: 31.5,
    totalIBSMun: 31.5,
    totalCBS: 45.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.001 - Pedido de Venda",
    tipoNegociacao: "A Prazo",
    dtEntradaSaida: "20/05/2026",
    dtFaturamento: "—",
    dtMovimento: "20/05/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "100.500",
    serieNota: "—",
    statusNota: "—",
    notaModelo: "—",
    tipoMovimento: "Pedido de Venda",
    documentosFiscaisRef: [
      {
        id: "nd-pv003-1",
        dataNegociacao: "01/05/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Varejo Central S.A.",
        parceiroCNPJ: "98.765.432/0001-11",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "ND-0401",
        chaveDFe: "35260501234567890001550010000004011234560401",
        valor: 450.0,
        totalIBSUF: 15.75,
        totalIBSMun: 15.75,
        totalCBS: 22.5,
      },
      {
        id: "nd-pv003-2",
        dataNegociacao: "01/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Varejo Central S.A.",
        parceiroCNPJ: "98.765.432/0001-11",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "ND-0402",
        chaveDFe: "35260601234567890001550010000004021234560402",
        valor: 450.0,
        totalIBSUF: 15.75,
        totalIBSMun: 15.75,
        totalCBS: 22.5,
      },
      {
        id: "nf-pv003",
        dataNegociacao: "01/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Varejo Central S.A.",
        parceiroCNPJ: "98.765.432/0001-11",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Normal",
        numero: "NF-0901",
        chaveDFe: "35260601234567890001550010000009011234560901",
        valor: 900.0,
        totalIBSUF: 31.5,
        totalIBSMun: 31.5,
        totalCBS: 45.0,
      },
    ],
    titulos: [
      {
        id: "t-pv003-1",
        dataNegociacao: "20/05/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Varejo Central S.A.",
        parceiroCNPJ: "98.765.432/0001-11",
        tipo: "Receita",
        tipoMovimento: "Pedido de Venda",
        nroUnico: "100.501",
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
        pedidoRef: { id: "pedido-pv003", numero: "PV-003" },
      },
      {
        id: "t-pv003-2",
        dataNegociacao: "20/05/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Varejo Central S.A.",
        parceiroCNPJ: "98.765.432/0001-11",
        tipo: "Receita",
        tipoMovimento: "Pedido de Venda",
        nroUnico: "100.502",
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
        pedidoRef: { id: "pedido-pv003", numero: "PV-003" },
      },
    ],
  },

  // ── Nota de Débito – PV-003 Parcela 1 (ND-0401 / R$ 450,00 / venc 01/05/2026) ─
  {
    id: "nd-pv003-1",
    dataNegociacao: "01/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Varejo Central S.A.",
    parceiroCNPJ: "98.765.432/0001-11",
    numero: "ND-0401",
    chaveDFe: "35260501234567890001550010000004011234560401",
    valor: 450.0,
    totalIBSUF: 15.75,
    totalIBSMun: 15.75,
    totalCBS: 22.5,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.209 - Nota de Débito",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "01/05/2026",
    dtFaturamento: "01/05/2026",
    dtMovimento: "01/05/2026",
    finalidadeOperacao: "Débito",
    nroNFSe: "—",
    nroUnico: "100.503",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    pedidoRef: { id: "pedido-pv003", numero: "PV-003" },
    titulos: [],
  },

  // ── Nota de Débito – PV-003 Parcela 2 (ND-0402 / R$ 450,00 / venc 01/06/2026) ─
  {
    id: "nd-pv003-2",
    dataNegociacao: "01/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Varejo Central S.A.",
    parceiroCNPJ: "98.765.432/0001-11",
    numero: "ND-0402",
    chaveDFe: "35260601234567890001550010000004021234560402",
    valor: 450.0,
    totalIBSUF: 15.75,
    totalIBSMun: 15.75,
    totalCBS: 22.5,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.209 - Nota de Débito",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "01/06/2026",
    dtFaturamento: "01/06/2026",
    dtMovimento: "01/06/2026",
    finalidadeOperacao: "Débito",
    nroNFSe: "—",
    nroUnico: "100.504",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    pedidoRef: { id: "pedido-pv003", numero: "PV-003" },
    titulos: [],
  },

  // ── NF Normal – PV-003 (NF-0901 / R$ 900,00 / referencia ND-0401 + ND-0402) ─
  {
    id: "nf-pv003",
    dataNegociacao: "01/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Varejo Central S.A.",
    parceiroCNPJ: "98.765.432/0001-11",
    numero: "NF-0901",
    chaveDFe: "35260601234567890001550010000009011234560901",
    valor: 900.0,
    totalIBSUF: 31.5,
    totalIBSMun: 31.5,
    totalCBS: 45.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "01/06/2026",
    dtFaturamento: "01/06/2026",
    dtMovimento: "01/06/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "100.505",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    pedidoRef: { id: "pedido-pv003", numero: "PV-003" },
    documentosFiscaisRef: [
      {
        id: "nd-pv003-1",
        dataNegociacao: "01/05/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Varejo Central S.A.",
        parceiroCNPJ: "98.765.432/0001-11",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "ND-0401",
        chaveDFe: "35260501234567890001550010000004011234560401",
        valor: 450.0,
        totalIBSUF: 15.75,
        totalIBSMun: 15.75,
        totalCBS: 22.5,
      },
      {
        id: "nd-pv003-2",
        dataNegociacao: "01/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Varejo Central S.A.",
        parceiroCNPJ: "98.765.432/0001-11",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "ND-0402",
        chaveDFe: "35260601234567890001550010000004021234560402",
        valor: 450.0,
        totalIBSUF: 15.75,
        totalIBSMun: 15.75,
        totalCBS: 22.5,
      },
    ],
    titulos: [],
  },

  // ── Pedido de Venda – PV-004 (R$ 1.200,00 / antecipação R$ 600 + NF Normal) ──
  {
    id: "pedido-pv004",
    dataNegociacao: "25/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Logística Express Ltda",
    parceiroCNPJ: "88.999.000/0001-44",
    numero: "PV-004",
    chaveDFe: "—",
    valor: 1200.0,
    totalIBSUF: 42.0,
    totalIBSMun: 42.0,
    totalCBS: 60.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.001 - Pedido de Venda",
    tipoNegociacao: "A Prazo",
    dtEntradaSaida: "25/05/2026",
    dtFaturamento: "—",
    dtMovimento: "25/05/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "100.600",
    serieNota: "—",
    statusNota: "—",
    notaModelo: "—",
    tipoMovimento: "Pedido de Venda",
    documentosFiscaisRef: [
      {
        id: "nd-pv004",
        dataNegociacao: "01/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Logística Express Ltda",
        parceiroCNPJ: "88.999.000/0001-44",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "ND-0501",
        chaveDFe: "35260601234567890001550010000005011234560501",
        valor: 600.0,
        totalIBSUF: 21.0,
        totalIBSMun: 21.0,
        totalCBS: 30.0,
      },
      {
        id: "nf-pv004",
        dataNegociacao: "10/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Logística Express Ltda",
        parceiroCNPJ: "88.999.000/0001-44",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Normal",
        numero: "NF-1201",
        chaveDFe: "35260601234567890001550010000012011234561201",
        valor: 1200.0,
        totalIBSUF: 42.0,
        totalIBSMun: 42.0,
        totalCBS: 60.0,
      },
    ],
    titulos: [
      {
        id: "t-pv004-1",
        dataNegociacao: "25/05/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Logística Express Ltda",
        parceiroCNPJ: "88.999.000/0001-44",
        tipo: "Receita",
        tipoMovimento: "Pedido de Venda",
        nroUnico: "100.601",
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
        pedidoRef: { id: "pedido-pv004", numero: "PV-004" },
      },
      {
        id: "t-pv004-2",
        dataNegociacao: "25/05/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Logística Express Ltda",
        parceiroCNPJ: "88.999.000/0001-44",
        tipo: "Receita",
        tipoMovimento: "Pedido de Venda",
        nroUnico: "100.602",
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
        pedidoRef: { id: "pedido-pv004", numero: "PV-004" },
      },
    ],
  },

  // ── Nota de Débito – PV-004 antecipação (ND-0501 / R$ 600,00) ────────────────
  {
    id: "nd-pv004",
    dataNegociacao: "01/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Logística Express Ltda",
    parceiroCNPJ: "88.999.000/0001-44",
    numero: "ND-0501",
    chaveDFe: "35260601234567890001550010000005011234560501",
    valor: 600.0,
    totalIBSUF: 21.0,
    totalIBSMun: 21.0,
    totalCBS: 30.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.209 - Nota de Débito",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "01/06/2026",
    dtFaturamento: "01/06/2026",
    dtMovimento: "01/06/2026",
    finalidadeOperacao: "Débito",
    nroNFSe: "—",
    nroUnico: "100.602",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    pedidoRef: { id: "pedido-pv004", numero: "PV-004" },
    titulos: [],
  },

  // ── NF Normal – PV-004 fornecimento (NF-1201 / R$ 1.200,00) ─────────────────
  {
    id: "nf-pv004",
    dataNegociacao: "10/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Logística Express Ltda",
    parceiroCNPJ: "88.999.000/0001-44",
    numero: "NF-1201",
    chaveDFe: "35260601234567890001550010000012011234561201",
    valor: 1200.0,
    totalIBSUF: 42.0,
    totalIBSMun: 42.0,
    totalCBS: 60.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "10/06/2026",
    dtFaturamento: "10/06/2026",
    dtMovimento: "10/06/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "100.603",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    pedidoRef: { id: "pedido-pv004", numero: "PV-004" },
    documentosFiscaisRef: [
      {
        id: "nd-pv004",
        dataNegociacao: "01/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Logística Express Ltda",
        parceiroCNPJ: "88.999.000/0001-44",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "ND-0501",
        chaveDFe: "35260601234567890001550010000005011234560501",
        valor: 600.0,
        totalIBSUF: 21.0,
        totalIBSMun: 21.0,
        totalCBS: 30.0,
      },
    ],
    titulos: [],
  },

  // ── Pedido de Venda – PV-005 (R$ 60,00 / 1 parcela antecipada em 2 / antecipação total) ──
  {
    id: "pedido-pv005",
    dataNegociacao: "20/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Indústria Nova Ltda",
    parceiroCNPJ: "77.888.999/0001-66",
    numero: "PV-005",
    chaveDFe: "—",
    valor: 60.0,
    totalIBSUF: 2.10,
    totalIBSMun: 2.10,
    totalCBS: 3.00,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.001 - Pedido de Venda",
    tipoNegociacao: "A Prazo",
    dtEntradaSaida: "20/06/2026",
    dtFaturamento: "—",
    dtMovimento: "20/06/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "100.700",
    serieNota: "—",
    statusNota: "—",
    notaModelo: "—",
    tipoMovimento: "Pedido de Venda",
    documentosFiscaisRef: [
      {
        id: "nd-pv005-1",
        dataNegociacao: "06/07/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Indústria Nova Ltda",
        parceiroCNPJ: "77.888.999/0001-66",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "ND-0601",
        chaveDFe: "35260701234567890001550010000006011234560601",
        valor: 30.0,
        totalIBSUF: 1.05,
        totalIBSMun: 1.05,
        totalCBS: 1.50,
      },
      {
        id: "nd-pv005-2",
        dataNegociacao: "27/07/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Indústria Nova Ltda",
        parceiroCNPJ: "77.888.999/0001-66",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "ND-0602",
        chaveDFe: "35260701234567890001550010000006021234560602",
        valor: 30.0,
        totalIBSUF: 1.05,
        totalIBSMun: 1.05,
        totalCBS: 1.50,
      },
      {
        id: "nf-pv005",
        dataNegociacao: "30/07/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Indústria Nova Ltda",
        parceiroCNPJ: "77.888.999/0001-66",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Normal",
        numero: "NF-1301",
        chaveDFe: "35260701234567890001550010000013011234561301",
        valor: 60.0,
        totalIBSUF: 2.10,
        totalIBSMun: 2.10,
        totalCBS: 3.00,
      },
    ],
    titulos: [
      {
        id: "t-pv005-1",
        dataNegociacao: "20/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Indústria Nova Ltda",
        parceiroCNPJ: "77.888.999/0001-66",
        tipo: "Receita",
        tipoMovimento: "Pedido de Venda",
        nroUnico: "100.701",
        vlrDesdobramento: 30.0,
        totalIBSUF: 1.05,
        totalIBSMun: 1.05,
        totalCBS: 1.50,
        nroNota: "ND-0601",
        desdob: "001/002",
        tipoOperacao: "1.001 - Pedido de Venda",
        dtEntradaSaida: "20/06/2026",
        dtVencimento: "06/07/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 30.0, dataBaixa: "06/07/2026",
        tributos: [
          { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 30, baseReduzida: 0, aliquota: "5,00%", valor: 1.50, digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 30, baseReduzida: 0, aliquota: "3,50%", valor: 1.05, digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 30, baseReduzida: 0, aliquota: "3,50%", valor: 1.05, digitado: "Não" },
        ],
        documentos: [
          { nroUnico: "100.701", nroNota: "ND-0601", chaveDFe: "35260701234567890001550010000006011234560601", statusDFe: "Autorizado", finalidade: "Débito" },
        ],
        pedidoRef: { id: "pedido-pv005", numero: "PV-005" },
      },
      {
        id: "t-pv005-2",
        dataNegociacao: "20/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Indústria Nova Ltda",
        parceiroCNPJ: "77.888.999/0001-66",
        tipo: "Receita",
        tipoMovimento: "Pedido de Venda",
        nroUnico: "100.702",
        vlrDesdobramento: 30.0,
        totalIBSUF: 1.05,
        totalIBSMun: 1.05,
        totalCBS: 1.50,
        nroNota: "ND-0602",
        desdob: "002/002",
        tipoOperacao: "1.001 - Pedido de Venda",
        dtEntradaSaida: "20/06/2026",
        dtVencimento: "27/07/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 30.0, dataBaixa: "27/07/2026",
        tributos: [
          { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 30, baseReduzida: 0, aliquota: "5,00%", valor: 1.50, digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 30, baseReduzida: 0, aliquota: "3,50%", valor: 1.05, digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 30, baseReduzida: 0, aliquota: "3,50%", valor: 1.05, digitado: "Não" },
        ],
        documentos: [
          { nroUnico: "100.702", nroNota: "ND-0602", chaveDFe: "35260701234567890001550010000006021234560602", statusDFe: "Autorizado", finalidade: "Débito" },
        ],
        pedidoRef: { id: "pedido-pv005", numero: "PV-005" },
      },
    ],
  },

  // ── Nota de Débito – PV-005 Antecipação 1 (ND-0601 / R$ 30,00 / 06/07/2026) ─
  {
    id: "nd-pv005-1",
    dataNegociacao: "06/07/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Indústria Nova Ltda",
    parceiroCNPJ: "77.888.999/0001-66",
    numero: "ND-0601",
    chaveDFe: "35260701234567890001550010000006011234560601",
    valor: 30.0,
    totalIBSUF: 1.05,
    totalIBSMun: 1.05,
    totalCBS: 1.50,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.209 - Nota de Débito",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "06/07/2026",
    dtFaturamento: "06/07/2026",
    dtMovimento: "06/07/2026",
    finalidadeOperacao: "Débito",
    nroNFSe: "—",
    nroUnico: "100.703",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    pedidoRef: { id: "pedido-pv005", numero: "PV-005" },
    titulos: [],
  },

  // ── Nota de Débito – PV-005 Antecipação 2 (ND-0602 / R$ 30,00 / 27/07/2026) ─
  {
    id: "nd-pv005-2",
    dataNegociacao: "27/07/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Indústria Nova Ltda",
    parceiroCNPJ: "77.888.999/0001-66",
    numero: "ND-0602",
    chaveDFe: "35260701234567890001550010000006021234560602",
    valor: 30.0,
    totalIBSUF: 1.05,
    totalIBSMun: 1.05,
    totalCBS: 1.50,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.209 - Nota de Débito",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "27/07/2026",
    dtFaturamento: "27/07/2026",
    dtMovimento: "27/07/2026",
    finalidadeOperacao: "Débito",
    nroNFSe: "—",
    nroUnico: "100.704",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    pedidoRef: { id: "pedido-pv005", numero: "PV-005" },
    titulos: [],
  },

  // ── NF Fornecimento – PV-005 (NF-1301 / R$ 60,00 / 30/07/2026 / ref ND-0601 + ND-0602) ─
  {
    id: "nf-pv005",
    dataNegociacao: "30/07/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Indústria Nova Ltda",
    parceiroCNPJ: "77.888.999/0001-66",
    numero: "NF-1301",
    chaveDFe: "35260701234567890001550010000013011234561301",
    valor: 60.0,
    totalIBSUF: 2.10,
    totalIBSMun: 2.10,
    totalCBS: 3.00,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "30/07/2026",
    dtFaturamento: "30/07/2026",
    dtMovimento: "30/07/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "100.705",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    pedidoRef: { id: "pedido-pv005", numero: "PV-005" },
    documentosFiscaisRef: [
      {
        id: "nd-pv005-1",
        dataNegociacao: "06/07/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Indústria Nova Ltda",
        parceiroCNPJ: "77.888.999/0001-66",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "ND-0601",
        chaveDFe: "35260701234567890001550010000006011234560601",
        valor: 30.0,
        totalIBSUF: 1.05,
        totalIBSMun: 1.05,
        totalCBS: 1.50,
      },
      {
        id: "nd-pv005-2",
        dataNegociacao: "27/07/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Indústria Nova Ltda",
        parceiroCNPJ: "77.888.999/0001-66",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "ND-0602",
        chaveDFe: "35260701234567890001550010000006021234560602",
        valor: 30.0,
        totalIBSUF: 1.05,
        totalIBSMun: 1.05,
        totalCBS: 1.50,
      },
    ],
    titulos: [],
  },

  // ── Pedido de Venda – XPTO (R$ 500,00) ──────────────────────────────────────
  {
    id: "pedido-xpto",
    dataNegociacao: "01/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Comércio Brasil Ltda",
    parceiroCNPJ: "45.678.901/0001-23",
    numero: "PV-001",
    chaveDFe: "—",
    valor: 500.0,
    totalIBSUF: 17.5,
    totalIBSMun: 17.5,
    totalCBS: 25.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.001 - Pedido de Venda",
    tipoNegociacao: "A Prazo",
    dtEntradaSaida: "01/06/2026",
    dtFaturamento: "—",
    dtMovimento: "01/06/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "100.200",
    serieNota: "—",
    statusNota: "—",
    notaModelo: "—",
    tipoMovimento: "Pedido de Venda",
    pendencia: "Existem títulos com pendências.",
    titulos: [
      {
        id: "t-xpto",
        dataNegociacao: "01/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Comércio Brasil Ltda",
        parceiroCNPJ: "45.678.901/0001-23",
        tipo: "Receita",
        tipoMovimento: "Pedido de Venda",
        nroUnico: "100.200",
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
        pendencia: "Esse título não tem um documento fiscal relacionado. Veja as opções disponíveis através do grupo Documentos do Título.",
        pedidoRef: { id: "pedido-xpto", numero: "PV-001" },
      },
      {
        id: "t-xpto-2",
        dataNegociacao: "01/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Comércio Brasil Ltda",
        parceiroCNPJ: "45.678.901/0001-23",
        tipo: "Receita",
        tipoMovimento: "Pedido de Venda",
        nroUnico: "100.201",
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
        pedidoRef: { id: "pedido-xpto", numero: "PV-001" },
      },
      {
        id: "t-xpto-3",
        dataNegociacao: "01/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Comércio Brasil Ltda",
        parceiroCNPJ: "45.678.901/0001-23",
        tipo: "Receita",
        tipoMovimento: "Pedido de Venda",
        nroUnico: "100.202",
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
        pedidoRef: { id: "pedido-xpto", numero: "PV-001" },
      },
    ],
  },

  // ── Venda – NF-002200 / Comércio Leste (gerou título 200.020) ──────────────────
  {
    id: "200-019",
    dataNegociacao: "07/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Comércio Leste Ltda",
    parceiroCNPJ: "77.888.999/0001-55",
    numero: "2200",
    chaveDFe: "35260502345678901002550010000022001000022000",
    valor: 29800.0,
    totalIBSUF: 1043.0,
    totalIBSMun: 1043.0,
    totalCBS: 1490.0,
    empresaNegociacao: "002 - Sankhya São Paulo S.A.",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "07/05/2026",
    dtFaturamento: "07/05/2026",
    dtMovimento: "07/05/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "200.019",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    titulos: [
      {
        id: "t-rec-200020",
        dataNegociacao: "07/05/2026",
        empresa: "002 - Sankhya São Paulo S.A.",
        parceiroNome: "Comércio Leste Ltda",
        parceiroCNPJ: "77.888.999/0001-55",
        tipo: "Receita",
        tipoMovimento: "Venda",
        nroUnico: "200.020",
        vlrDesdobramento: 29800.0,
        totalIBSUF: 1043.0,
        totalIBSMun: 1043.0,
        totalCBS: 1490.0,
        nroNota: "NF-002200",
        desdob: "001/001",
        tipoOperacao: "1.201 - Recebimento",
        dtEntradaSaida: "07/05/2026",
        dtVencimento: "07/06/2026",
        vlrDesconto: 0, vlrMulta: 6200.0, vlrJuros: 2300.0, vlrBaixa: 38300.0, dataBaixa: "18/05/2026",
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
    ],
  },

  // ── Venda – NF-001234 / Comércio Brasil (gerou título 100.001) ───────────────
  {
    id: "100-000",
    dataNegociacao: "10/01/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Comércio Brasil Ltda",
    parceiroCNPJ: "45.678.901/0001-23",
    numero: "1234",
    chaveDFe: "35260101234567890001550010000012341000012340",
    valor: 24500.0,
    totalIBSUF: 857.5,
    totalIBSMun: 857.5,
    totalCBS: 1225.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "10/01/2026",
    dtFaturamento: "10/01/2026",
    dtMovimento: "10/01/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "100.000",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    titulos: [
      {
        id: "t-rec-100001",
        dataNegociacao: "10/01/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Comércio Brasil Ltda",
        parceiroCNPJ: "45.678.901/0001-23",
        tipo: "Receita",
        tipoMovimento: "Venda",
        nroUnico: "100.001",
        vlrDesdobramento: 24500.0,
        totalIBSUF: 857.5,
        totalIBSMun: 857.5,
        totalCBS: 1225.0,
        nroNota: "NF-001234",
        desdob: "001/001",
        tipoOperacao: "1.201 - Recebimento",
        dtEntradaSaida: "10/01/2026",
        dtVencimento: "10/02/2026",
        vlrDesconto: 0, vlrMulta: 0, vlrJuros: 0, vlrBaixa: 24500.0, dataBaixa: "10/02/2026",
        tributos: [
          { imposto: "CBS",     incidencia: "Saída", cst: "01", base: 24500, baseReduzida: 0, aliquota: "5,00%", valor: 1225.0, digitado: "Não" },
          { imposto: "IBS UF",  incidencia: "Saída", cst: "01", base: 24500, baseReduzida: 0, aliquota: "3,50%", valor:  857.5, digitado: "Não" },
          { imposto: "IBS Mun", incidencia: "Saída", cst: "01", base: 24500, baseReduzida: 0, aliquota: "3,50%", valor:  857.5, digitado: "Não" },
        ],
        documentos: [
          { nroUnico: "100.000", nroNota: "NF-001234", chaveDFe: "35260101234567890001550010000012341000012340", statusDFe: "Autorizado", finalidade: "Normal" },
        ],
      },
    ],
  },

  // ── PV-010 — Pedido de Venda (Digital Supply Ltda / R$ 20.000,00) ─────────────
  {
    id: "pv-010",
    dataNegociacao: "05/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Digital Supply Ltda",
    parceiroCNPJ: "12.345.678/0001-55",
    numero: "PV-010",
    chaveDFe: "—",
    valor: 20000.0,
    totalIBSUF: 700.0,
    totalIBSMun: 700.0,
    totalCBS: 1000.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.001 - Pedido de Venda",
    tipoNegociacao: "A Prazo",
    dtEntradaSaida: "05/06/2026",
    dtFaturamento: "—",
    dtMovimento: "05/06/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "100.800",
    serieNota: "—",
    statusNota: "—",
    notaModelo: "—",
    tipoMovimento: "Pedido de Venda",
    documentosFiscaisRef: [
      {
        id: "nf-010-fat",
        dataNegociacao: "05/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Digital Supply Ltda",
        parceiroCNPJ: "12.345.678/0001-55",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Normal",
        numero: "1601",
        chaveDFe: "35260601234567890001550010000016011000016011",
        valor: 20000.0,
        totalIBSUF: 700.0,
        totalIBSMun: 700.0,
        totalCBS: 1000.0,
      },
    ],
    titulos: [],
  },

  // ── NF-001601 — Faturamento do PV-010 (parcelas 100.802 + 100.803) ─────────────
  {
    id: "nf-010-fat",
    dataNegociacao: "05/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Digital Supply Ltda",
    parceiroCNPJ: "12.345.678/0001-55",
    numero: "1601",
    chaveDFe: "35260601234567890001550010000016011000016011",
    valor: 20000.0,
    totalIBSUF: 700.0,
    totalIBSMun: 700.0,
    totalCBS: 1000.0,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Prazo",
    dtEntradaSaida: "05/06/2026",
    dtFaturamento: "05/06/2026",
    dtMovimento: "05/06/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "100.801",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    pedidoRef: { id: "pv-010", numero: "PV-010" },
    documentosFiscaisRef: [
      {
        id: "nd-010-mj",
        dataNegociacao: "10/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Digital Supply Ltda",
        parceiroCNPJ: "12.345.678/0001-55",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "1602",
        chaveDFe: "35260601234567890001550010000016021000016021",
        valor: 450.0,
        totalIBSUF: 15.75,
        totalIBSMun: 15.75,
        totalCBS: 22.5,
      },
    ],
    titulos: [
      {
        id: "t-010-t1",
        dataNegociacao: "05/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Digital Supply Ltda",
        parceiroCNPJ: "12.345.678/0001-55",
        tipo: "Receita",
        tipoMovimento: "Venda",
        nroUnico: "100.802",
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
        pedidoRef: { id: "pv-010", numero: "PV-010" },
      },
      {
        id: "t-010-t2",
        dataNegociacao: "05/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Digital Supply Ltda",
        parceiroCNPJ: "12.345.678/0001-55",
        tipo: "Receita",
        tipoMovimento: "Venda",
        nroUnico: "100.803",
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
        ],
        pedidoRef: { id: "pv-010", numero: "PV-010" },
      },
    ],
  },

  // ── ND-001602 — Nota de Débito Multa e Juros do PV-010 parcela 2 ──────────────
  {
    id: "nd-010-mj",
    dataNegociacao: "10/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Digital Supply Ltda",
    parceiroCNPJ: "12.345.678/0001-55",
    numero: "1602",
    chaveDFe: "35260601234567890001550010000016021000016021",
    valor: 450.0,
    totalIBSUF: 15.75,
    totalIBSMun: 15.75,
    totalCBS: 22.5,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.209 - Nota de Débito",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "10/06/2026",
    dtFaturamento: "10/06/2026",
    dtMovimento: "10/06/2026",
    finalidadeOperacao: "Débito",
    nroNFSe: "—",
    nroUnico: "100.810",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    documentosFiscaisRef: [
      {
        id: "nf-010-fat",
        dataNegociacao: "05/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Digital Supply Ltda",
        parceiroCNPJ: "12.345.678/0001-55",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Normal",
        numero: "1601",
        chaveDFe: "35260601234567890001550010000016011000016011",
        valor: 20000.0,
        totalIBSUF: 700.0,
        totalIBSMun: 700.0,
        totalCBS: 1000.0,
      },
    ],
    titulos: [],
  },

  // ── Pedido de Venda – PV-072 / Fênix Serviços (R$ 72,00 / 1 título antecipado) ─
  {
    id: "sc-pv-72",
    dataNegociacao: "16/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Fênix Serviços Ltda",
    parceiroCNPJ: "12.876.543/0001-21",
    numero: "PV-072",
    chaveDFe: "—",
    valor: 72.0,
    totalIBSUF: 2.52,
    totalIBSMun: 2.52,
    totalCBS: 3.60,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.001 - Pedido de Venda",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "16/06/2026",
    dtFaturamento: "—",
    dtMovimento: "16/06/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "150.001",
    serieNota: "—",
    statusNota: "—",
    notaModelo: "—",
    tipoMovimento: "Pedido de Venda",
    documentosFiscaisRef: [
      {
        id: "sc-nd-72",
        dataNegociacao: "16/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Fênix Serviços Ltda",
        parceiroCNPJ: "12.876.543/0001-21",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "ND-0072",
        chaveDFe: "35260601234567890001550010000000072123456720",
        valor: 72.0,
        totalIBSUF: 2.52,
        totalIBSMun: 2.52,
        totalCBS: 3.60,
      },
      {
        id: "sc-nfe-72",
        dataNegociacao: "18/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Fênix Serviços Ltda",
        parceiroCNPJ: "12.876.543/0001-21",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Normal",
        numero: "1072",
        chaveDFe: "35260601234567890001550010000001072123456721",
        valor: 72.0,
        totalIBSUF: 2.52,
        totalIBSMun: 2.52,
        totalCBS: 3.60,
      },
    ],
    titulos: [
      {
        id: "t-sc-pv-72",
        dataNegociacao: "16/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Fênix Serviços Ltda",
        parceiroCNPJ: "12.876.543/0001-21",
        tipo: "Receita",
        tipoMovimento: "Pedido de Venda",
        nroUnico: "150.001",
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
        pedidoRef: { id: "sc-pv-72", numero: "PV-072" },
      },
    ],
  },

  // ── NFe de Débito – ND-0072 / Fênix Serviços (R$ 72,00 / antecipação paga) ──
  {
    id: "sc-nd-72",
    dataNegociacao: "16/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Fênix Serviços Ltda",
    parceiroCNPJ: "12.876.543/0001-21",
    numero: "ND-0072",
    chaveDFe: "35260601234567890001550010000000072123456720",
    valor: 72.0,
    totalIBSUF: 2.52,
    totalIBSMun: 2.52,
    totalCBS: 3.60,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.209 - Nota de Débito",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "16/06/2026",
    dtFaturamento: "16/06/2026",
    dtMovimento: "16/06/2026",
    finalidadeOperacao: "Débito",
    nroNFSe: "—",
    nroUnico: "150.002",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    pedidoRef: { id: "sc-pv-72", numero: "PV-072" },
    documentosFiscaisRef: [
      {
        id: "sc-nfe-72",
        dataNegociacao: "18/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Fênix Serviços Ltda",
        parceiroCNPJ: "12.876.543/0001-21",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Normal",
        numero: "1072",
        chaveDFe: "35260601234567890001550010000001072123456721",
        valor: 72.0,
        totalIBSUF: 2.52,
        totalIBSMun: 2.52,
        totalCBS: 3.60,
      },
    ],
    titulos: [],
  },

  // ── NFe de Fornecimento – NF-1072 / Fênix Serviços (R$ 72,00 / sem título) ──
  {
    id: "sc-nfe-72",
    dataNegociacao: "18/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Fênix Serviços Ltda",
    parceiroCNPJ: "12.876.543/0001-21",
    numero: "1072",
    chaveDFe: "35260601234567890001550010000001072123456721",
    valor: 72.0,
    totalIBSUF: 2.52,
    totalIBSMun: 2.52,
    totalCBS: 3.60,
    empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
    tipoOperacao: "1.201 - Venda de Mercadoria",
    tipoNegociacao: "A Vista",
    dtEntradaSaida: "18/06/2026",
    dtFaturamento: "18/06/2026",
    dtMovimento: "18/06/2026",
    finalidadeOperacao: "Normal",
    nroNFSe: "—",
    nroUnico: "150.003",
    serieNota: "001",
    statusNota: "Autorizado",
    notaModelo: "55 - NF-e",
    tipoMovimento: "Venda",
    pedidoRef: { id: "sc-pv-72", numero: "PV-072" },
    documentosFiscaisRef: [
      {
        id: "sc-nd-72",
        dataNegociacao: "16/06/2026",
        empresa: "001 - Sankhya Gestão de Negócios Ltda",
        parceiroNome: "Fênix Serviços Ltda",
        parceiroCNPJ: "12.876.543/0001-21",
        tipoMovimento: "Venda",
        finalidadeOperacao: "Débito",
        numero: "ND-0072",
        chaveDFe: "35260601234567890001550010000000072123456720",
        valor: 72.0,
        totalIBSUF: 2.52,
        totalIBSMun: 2.52,
        totalCBS: 3.60,
      },
    ],
    titulos: [],
  },
];

export const MOCK_DOCUMENTOS_MOVIMENTO = MOCK;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function tipoMovClass(t: TipoMovimento): string {
  if (t === "Venda")               return "text-blue-700 dark:text-blue-400";
  if (t === "Compra")              return "text-amber-700 dark:text-amber-500";
  if (t === "Devolução de Venda")  return "text-rose-700 dark:text-rose-400";
  if (t === "Devolução de Compra") return "text-blue-700 dark:text-blue-400";
  if (t === "Multa e Juros")       return "text-orange-700 dark:text-orange-400";
  if (t === "Pedido de Venda")     return "text-sky-700 dark:text-sky-400";
  if (t === "Pedido de Compra")   return "text-amber-700 dark:text-amber-500";
  return "";
}

function centralLabel(tm: TipoMovimento): string {
  return ["Venda", "Devolução de Venda", "Multa e Juros", "Pedido de Venda"].includes(tm)
    ? "Portal de Vendas"
    : "Central de Compra";
}

function PendenciaIcon({ pendencias }: { pendencias: PendenciaDoc[] }) {
  if (pendencias.length === 0)
    return <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Sem pendências" />;
  const tooltip = pendencias.map((p) => `${p.codigo}: ${p.descricao}`).join("\n");
  return (
    <div className="flex items-center gap-0.5" title={tooltip}>
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      {pendencias.length > 1 && (
        <span className="text-[10px] font-semibold text-amber-600 leading-none">{pendencias.length}</span>
      )}
    </div>
  );
}

function PendenciaAlerta({ pendencias }: { pendencias: { codigo: string; descricao: string }[] }) {
  if (pendencias.length === 0) return null;
  return (
    <div className="space-y-2">
      {pendencias.map((p) => (
        <div key={p.codigo} className="flex items-center gap-2.5 rounded-md border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 px-4 py-2.5 text-[13px] text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span><strong>{p.codigo}</strong> — {p.descricao}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

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
          {tributosDevolvidos?.map((tri, i) => (
            <TableRow key={`dev-${i}`} className="text-[13px] bg-rose-50/40 dark:bg-rose-950/10">
              <TableCell className="font-mono text-[12px]">{dataDevolucao ?? data}</TableCell>
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

function BadgeDFe({ status }: { status: StatusDFe }) {
  const cls =
    status === "Autorizado"             ? "border-green-300 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/40" :
    status === "Aguardando autorização" ? "border-blue-300 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40" :
    status === "Erro"                   ? "border-red-300 text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/40" :
                                          "border-gray-300 text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/40";
  return <Badge variant="outline" className={cn("text-[11px] whitespace-nowrap", cls)}>{status}</Badge>;
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

// ─── Main Page ────────────────────────────────────────────────────────────────

type View = "list" | "doc-detail" | "titulo-detail";

export default function MovimentacoesDocumentosMovimento() {
  const location = useLocation();
  const [view, setView] = useState<View>("list");
  const [selectedDoc, setSelectedDoc] = useState<DocumentoMovimento | null>(null);
  const [selectedTitulo, setSelectedTitulo] = useState<TituloDocumento | null>(null);
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroDataDe, setFiltroDataDe] = useState<Date | undefined>(undefined);
  const [filtroDataAte, setFiltroDataAte] = useState<Date | undefined>(undefined);
  const [filtroTipoMovimento, setFiltroTipoMovimento] = useState("");
  const [filtroFinalidade, setFiltroFinalidade] = useState("");
  const [filtroPendencia, setFiltroPendencia] = useState("");

  const TIPOS_MOVIMENTO = useMemo(() => Array.from(new Set(MOCK.map(r => r.tipoMovimento))).sort(), []);
  const FINALIDADES = useMemo(() => Array.from(new Set(MOCK.map(r => r.finalidadeOperacao))).sort(), []);

  useEffect(() => {
    const state = location.state as { openChaveDFe?: string; openNroUnico?: string } | null;
    if (state?.openChaveDFe) {
      const doc = MOCK.find((r) => r.chaveDFe === state.openChaveDFe);
      if (doc) { setSelectedDoc(doc); setView("doc-detail"); }
    } else if (state?.openNroUnico) {
      const doc = MOCK.find((r) => r.id === state.openNroUnico);
      if (doc) { setSelectedDoc(doc); setView("doc-detail"); }
    }
  }, [location.state]);

  const hasFilter = filtroEmpresa !== "" || filtroDataDe !== undefined || filtroDataAte !== undefined || filtroTipoMovimento !== "" || filtroFinalidade !== "" || filtroPendencia !== "";

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
      const byTipoMovimento = !filtroTipoMovimento || r.tipoMovimento === filtroTipoMovimento;
      const byFinalidade = !filtroFinalidade || r.finalidadeOperacao === filtroFinalidade;
      const byPendencia = !filtroPendencia || (filtroPendencia === "sim" ? !!r.pendencia : !r.pendencia);
      return byEmpresa && byDe && byAte && byTipoMovimento && byFinalidade && byPendencia;
    });
  }, [filtroEmpresa, filtroDataDe, filtroDataAte, filtroTipoMovimento, filtroFinalidade, filtroPendencia]);

  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [rows]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (view === "titulo-detail" && selectedTitulo && selectedDoc) {
    return (
      <TituloDetailView
        titulo={selectedTitulo}
        onBack={() => { setView("doc-detail"); setSelectedTitulo(null); }}
        onDetalharTituloRef={(refId) => {
          for (const doc of MOCK) {
            const titulo = doc.titulos.find((tt) => tt.id === refId);
            if (titulo) { setSelectedDoc(doc); setSelectedTitulo(titulo); return; }
          }
        }}
      />
    );
  }

  if (view === "doc-detail" && selectedDoc) {
    return (
      <DocumentDetailView
        doc={selectedDoc}
        onBack={() => { setView("list"); setSelectedDoc(null); }}
        onDetalhaTitulo={(t) => { setSelectedTitulo(t); setView("titulo-detail"); }}
        onDetalharDocRef={(id) => {
          const ref = MOCK.find((r) => r.id === id);
          if (ref) setSelectedDoc(ref);
        }}
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 text-[13px] font-normal gap-1.5 min-w-[110px]">
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                {filtroDataDe ? format(filtroDataDe, "dd/MM/yyyy") : <span className="text-muted-foreground">De</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={filtroDataDe} onSelect={setFiltroDataDe} initialFocus />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 text-[13px] font-normal gap-1.5 min-w-[110px]">
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                {filtroDataAte ? format(filtroDataAte, "dd/MM/yyyy") : <span className="text-muted-foreground">Até</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={filtroDataAte} onSelect={setFiltroDataAte} initialFocus />
            </PopoverContent>
          </Popover>
          <Select value={filtroTipoMovimento} onValueChange={setFiltroTipoMovimento}>
            <SelectTrigger className="w-[200px] h-8 text-[13px]">
              <SelectValue placeholder="Tipo de Movimento" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_MOVIMENTO.map((t) => (
                <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroFinalidade} onValueChange={setFiltroFinalidade}>
            <SelectTrigger className="w-[160px] h-8 text-[13px]">
              <SelectValue placeholder="Finalidade" />
            </SelectTrigger>
            <SelectContent>
              {FINALIDADES.map((f) => (
                <SelectItem key={f} value={f} className="text-[13px]">{f}</SelectItem>
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
              onClick={() => {
                setFiltroEmpresa("");
                setFiltroDataDe(undefined);
                setFiltroDataAte(undefined);
                setFiltroTipoMovimento("");
                setFiltroFinalidade("");
                setFiltroPendencia("");
              }}
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
                    <TableHead className="text-[12px]">Finalidade</TableHead>
                    <TableHead className="text-[12px]">Nro Único</TableHead>
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
                  {pageRows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/40 text-[13px] align-middle">
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <PendenciaIcon pendencias={getDocumentoPendencias(r)} />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[12px]">{r.dataNegociacao}</TableCell>
                      <TableCell>{r.empresa}</TableCell>
                      <TableCell>
                        <div>{r.parceiroNome}</div>
                        <div className="text-[11px] text-muted-foreground">{r.parceiroCNPJ}</div>
                      </TableCell>
                      <TableCell className={cn("font-medium whitespace-nowrap", tipoMovClass(r.tipoMovimento))}>
                        {r.tipoMovimento}
                      </TableCell>
                      <TableCell><FinalidadeBadge finalidade={r.finalidadeOperacao} /></TableCell>
                      <TableCell className="font-mono text-[12px]">{r.nroUnico}</TableCell>
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

// ─── Document Detail View ─────────────────────────────────────────────────────

function DocumentDetailView({
  doc: d,
  onBack,
  onDetalhaTitulo,
  onDetalharDocRef,
}: {
  doc: DocumentoMovimento;
  onBack: () => void;
  onDetalhaTitulo: (t: TituloDocumento) => void;
  onDetalharDocRef?: (id: string) => void;
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

        {/* Alertas de pendência */}
        <PendenciaAlerta pendencias={getDocumentoPendencias(d)} />

        {/* Resumo do Documento */}
        <CollapsibleSection title="Resumo do Documento">
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
        </CollapsibleSection>

        {/* Detalhes do Documento — TGFCAB */}
        <CollapsibleSection title="Detalhes do Documento">
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
        </CollapsibleSection>

        {/* Pedido do Documento */}
        <CollapsibleSection title="Pedido do Documento">
            {d.pedidoRef ? (
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
                    {(() => {
                      const pedDoc = MOCK.find(m => m.id === d.pedidoRef!.id);
                      return pedDoc ? (
                        <TableRow className="text-[13px]">
                          <TableCell className="font-mono font-medium">{pedDoc.numero}</TableCell>
                          <TableCell className="font-mono text-[12px]">{pedDoc.dataNegociacao}</TableCell>
                          <TableCell>{pedDoc.empresa}</TableCell>
                          <TableCell>
                            <div>{pedDoc.parceiroNome}</div>
                            <div className="text-[11px] text-muted-foreground">{pedDoc.parceiroCNPJ}</div>
                          </TableCell>
                          <TableCell className="font-mono">{pedDoc.nroUnico}</TableCell>
                          <TableCell>{pedDoc.tipoOperacao}</TableCell>
                          <TableCell className="text-right font-mono">{brl(pedDoc.valor)}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[12px] gap-1"
                              onClick={() => onDetalharDocRef?.(pedDoc.id)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Detalhar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ) : null;
                    })()}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/20 p-6 flex flex-col items-center gap-3 text-center">
                <p className="text-[13px] text-muted-foreground">Não existe um pedido relacionado</p>
                {d.tipoMovimento !== "Pedido de Venda" && d.tipoMovimento !== "Pedido de Compra" && (
                  <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
                    <Link2 className="h-3.5 w-3.5" />
                    Relacionar documento
                  </Button>
                )}
              </div>
            )}
          </CollapsibleSection>

        {/* Documento Referenciado */}
        <CollapsibleSection title="Documento Referenciado">
          {(() => {
            const refs = (d.documentosFiscaisRef ?? []).filter(
              r => r.tipoMovimento !== "Pedido de Venda" && r.tipoMovimento !== "Pedido de Compra"
            );
            return refs.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-[12px] text-center">Pendências</TableHead>
                      <TableHead className="text-[12px]">Dt. Negociação</TableHead>
                      <TableHead className="text-[12px]">Empresa</TableHead>
                      <TableHead className="text-[12px]">Parceiro</TableHead>
                      <TableHead className="text-[12px]">Tipo de Movimento</TableHead>
                      <TableHead className="text-[12px]">Finalidade</TableHead>
                      <TableHead className="text-[12px]">Número</TableHead>
                      <TableHead className="text-[12px]">Chave DFe</TableHead>
                      <TableHead className="text-right text-[12px]">Valor</TableHead>
                      <TableHead className="text-right text-[12px]">Total IBS UF</TableHead>
                      <TableHead className="text-right text-[12px]">Total IBS Mun</TableHead>
                      <TableHead className="text-right text-[12px]">Total CBS</TableHead>
                      <TableHead className="text-center text-[12px]">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refs.map((ref) => (
                      <TableRow key={ref.id} className="text-[13px]">
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <PendenciaIcon pendencias={ref.pendencia ? [{ codigo: "PRT0001" as const, descricao: ref.pendencia }] : []} />
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[12px]">{ref.dataNegociacao}</TableCell>
                        <TableCell>{ref.empresa}</TableCell>
                        <TableCell>
                          <div>{ref.parceiroNome}</div>
                          <div className="text-[11px] text-muted-foreground">{ref.parceiroCNPJ}</div>
                        </TableCell>
                        <TableCell className={cn("font-medium whitespace-nowrap", tipoMovClass(ref.tipoMovimento))}>
                          {ref.tipoMovimento}
                        </TableCell>
                        <TableCell>
                          {ref.finalidadeOperacao && (
                            <FinalidadeBadge finalidade={ref.finalidadeOperacao} />
                          )}
                        </TableCell>
                        <TableCell className="font-mono">{ref.numero}</TableCell>
                        <TableCell className="max-w-[140px]">
                          <span className="font-mono text-[11px] text-muted-foreground truncate block" title={ref.chaveDFe}>
                            {ref.chaveDFe}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">{brl(ref.valor)}</TableCell>
                        <TableCell className="text-right font-mono">{brl(ref.totalIBSUF)}</TableCell>
                        <TableCell className="text-right font-mono">{brl(ref.totalIBSMun)}</TableCell>
                        <TableCell className="text-right font-mono">{brl(ref.totalCBS)}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[12px] gap-1"
                            onClick={() => onDetalharDocRef?.(ref.id)}
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
            ) : (
              <p className="text-[13px] text-muted-foreground py-6 text-center">Sem documentos referenciados</p>
            );
          })()}
        </CollapsibleSection>

        {/* Títulos do Documento */}
        <CollapsibleSection title="Títulos do Documento">
          {d.titulos.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[12px] text-center">Pendências</TableHead>
                    <TableHead className="text-[12px]">Dt. Negociação</TableHead>
                    <TableHead className="text-[12px]">Dt. Baixa</TableHead>
                    <TableHead className="text-[12px]">Empresa</TableHead>
                    <TableHead className="text-[12px]">Parceiro</TableHead>
                    <TableHead className="text-[12px]">Tipo</TableHead>
                    <TableHead className="text-[12px]">Nro Único</TableHead>
                    <TableHead className="text-[12px] text-right">Valor</TableHead>
                    <TableHead className="text-[12px] text-right">Valor Baixa</TableHead>
                    <TableHead className="text-[12px] text-right">Total IBS UF</TableHead>
                    <TableHead className="text-[12px] text-right">Total IBS Mun</TableHead>
                    <TableHead className="text-[12px] text-right">Total CBS</TableHead>
                    <TableHead className="text-[12px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.titulos.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/40 text-[13px]">
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <PendenciaIcon pendencias={t.pendencia ? [{ codigo: "PRT0001" as const, descricao: t.pendencia }] : []} />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[12px]">{t.dataNegociacao}</TableCell>
                      <TableCell className="font-mono text-[12px]">{t.dataBaixa}</TableCell>
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
                      <TableCell className="text-right font-mono">{t.vlrBaixa > 0 ? brl(t.vlrBaixa) : "—"}</TableCell>
                      <TableCell className="text-right font-mono">{brl(t.totalIBSUF)}</TableCell>
                      <TableCell className="text-right font-mono">{brl(t.totalIBSMun)}</TableCell>
                      <TableCell className="text-right font-mono">{brl(t.totalCBS)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[12px] gap-1"
                          onClick={() => {
                            if (t.tipo === "Receita") {
                              navigate(ERoutes.MOVIMENTACOES_RECEITAS_MOVIMENTO, {
                                state: { openNroUnico: t.nroUnico },
                              });
                            } else {
                              onDetalhaTitulo(t);
                            }
                          }}
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
          ) : (
            <div className="rounded-lg border bg-muted/20 p-6 flex flex-col items-center gap-3 text-center">
              <p className="text-[13px] text-muted-foreground">Não existe um título relacionado a esse documento.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
                  <FilePlus className="h-3.5 w-3.5" />
                  Lançar título
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  Relacionar título
                </Button>
              </div>
            </div>
          )}
        </CollapsibleSection>

      </div>
    </div>
  );
}

// ─── Título Detail View ───────────────────────────────────────────────────────

function TituloDetailView({
  titulo: t,
  onBack,
  onDetalharTituloRef,
}: {
  titulo: TituloDocumento;
  onBack: () => void;
  onDetalharTituloRef?: (id: string) => void;
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

        {/* Alertas de pendência */}
        <PendenciaAlerta pendencias={t.pendencia ? [{ codigo: "PRT0001", descricao: t.pendencia }] : []} />

        {/* Resumo do Título */}
        <CollapsibleSection title="Resumo do Título">
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
        </CollapsibleSection>

        {/* Detalhes do Título — TGFFIN */}
        <CollapsibleSection title="Detalhes do Título">
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
        </CollapsibleSection>

        {/* Pedido do Título */}
        <CollapsibleSection title="Pedido do Título">
          {t.pedidoRef ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[12px]">Número</TableHead>
                    <TableHead className="text-[12px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="text-[13px]">
                    <TableCell className="font-mono font-medium">{t.pedidoRef.numero}</TableCell>
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
          {t.documentos && t.documentos.length > 0 ? (
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {t.documentos.map((doc, i) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-[13px] text-muted-foreground text-center">
                Não existe um documento fiscal relacionado a esse título.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Importar XML
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  Relacionar documento
                </Button>
                {t.pedidoRef && (
                  <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Gerar Nota de Débito
                  </Button>
                )}
              </div>
            </div>
          )}
        </CollapsibleSection>

        {/* Título Referenciado */}
        {t.tituloRef && (
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
                    <TableCell className="font-mono text-[12px]">{t.tituloRef.dataNegociacao}</TableCell>
                    <TableCell>{t.tituloRef.empresa}</TableCell>
                    <TableCell>
                      <div>{t.tituloRef.parceiroNome}</div>
                      <div className="text-[11px] text-muted-foreground">{t.tituloRef.parceiroCNPJ}</div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-[13px] font-medium",
                        t.tituloRef.tipo === "Receita"
                          ? "text-blue-700 dark:text-blue-400"
                          : "text-red-700 dark:text-red-400"
                      )}
                    >
                      {t.tituloRef.tipo}
                    </TableCell>
                    <TableCell className={cn("font-medium whitespace-nowrap", tipoMovClass(t.tituloRef.tipoMovimento))}>
                      {t.tituloRef.tipoMovimento}
                    </TableCell>
                    <TableCell className="font-mono">{t.tituloRef.nroUnico}</TableCell>
                    <TableCell className="font-mono">{t.tituloRef.nroNota}</TableCell>
                    <TableCell className="text-right font-mono">{brl(t.tituloRef.vlrDesdobramento)}</TableCell>
                    <TableCell className="text-right font-mono">{brl(t.tituloRef.totalIBSUF)}</TableCell>
                    <TableCell className="text-right font-mono">{brl(t.tituloRef.totalIBSMun)}</TableCell>
                    <TableCell className="text-right font-mono">{brl(t.tituloRef.totalCBS)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[12px] gap-1"
                        onClick={() => onDetalharTituloRef?.(t.tituloRef!.id)}
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

        {/* Tributos do Título Referenciado — somente Despesa com tituloRef.tributos */}
        {t.tipo === "Despesa" && t.tituloRef?.tributos && (
          <CollapsibleSection title="Tributos do Título Referenciado">
            <TributoTable
              tributos={t.tituloRef.tributos}
              tributosDevolvidos={t.tituloRef.tributosDevolvidos}
              data={t.tituloRef.dataNegociacao}
              dataDevolucao={t.dataNegociacao}
            />
          </CollapsibleSection>
        )}

        {/* Tributos do Título — somente Receita */}
        {t.tipo === "Receita" && (
          <CollapsibleSection title="Tributos do Título">
            <TributoTable
              tributos={t.tributos}
              tributosDevolvidos={t.tributosDevolvidos}
              tributosMultaJuros={t.tributosMultaJuros}
              data={t.dataNegociacao}
              dataMultaJuros={t.dataBaixa !== "—" ? t.dataBaixa : undefined}
              dataDevolucao={t.tituloRef?.dataNegociacao}
            />
          </CollapsibleSection>
        )}

      </div>
    </div>
  );
}
