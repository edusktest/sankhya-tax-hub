import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TrendingUp, ChevronRight, ExternalLink, Eye, Filter, X,
  FileText, RefreshCw, FileStack, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { ERoutes } from "@/routes/interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusCalculo      = "Pendente" | "Calculando" | "Concluído";
type StatusGeracaoNota  = "Pendente" | "Em geração" | "Confirmada" | "Não configurado";
type StatusDFe          = "Não enviado" | "Aguardando autorização" | "Erro" | "Autorizado";

interface NotaDebito {
  dataNegociacao: string;
  nroUnico:       string;
  nroNota:        string;
  chaveDFe?:      string;   // somente quando Autorizado
  chaveDFeOrigem: string;
  statusDFe:      StatusDFe;
}

interface TituloDoc {
  id:                 string;
  dataNegociacao:     string;
  empresa:            string;
  parceiroNome:       string;
  parceiroCNPJ:       string;
  tipo:               "Receita" | "Despesa";
  tipoMovimento:      string;
  nroUnico:           string;
  vlrDesdobramento:   number;
  totalIBSUF:         number;
  totalIBSMun:        number;
  totalCBS:           number;
}

interface DocumentoFiscalOrigem {
  dataNegociacao:     string;
  empresa:            string;
  parceiroNome:       string;
  parceiroCNPJ:       string;
  tipoMovimento:      string;
  numero:             string;
  chaveDFe:           string;
  valor:              number;
  totalIBSUF:         number;
  totalIBSMun:        number;
  totalCBS:           number;
  // TGFCAB detail fields
  empresaNegociacao:  string;
  tipoOperacao:       string;
  tipoNegociacao:     string;
  dtEntradaSaida:     string;
  dtFaturamento:      string;
  dtMovimento:        string;
  finalidadeOperacao: string;
  nroNFSe:            string;
  nroUnico:           string;
  serieNota:          string;
  statusNota:         string;
  notaModelo:         string;
  titulos?:           TituloDoc[];
}

interface MultaJurosReceita {
  id:                 string;
  dataNegociacao:     string;
  empresa:            string;
  empresaCod:         string;
  parceiroNome:       string;
  parceiroCNPJ:       string;
  tipo:               "Receita";
  tipoMovimento:      string;
  nroUnico:           string;
  multa:              number;
  juros:              number;
  totalIBSUF:         number;
  totalIBSMun:        number;
  totalCBS:           number;
  statusCalculo:      StatusCalculo;
  statusGeracaoNota:  StatusGeracaoNota;
  statusDFe:          StatusDFe;
  // TGFFIN
  nroNota:            string;
  desdob:             string;
  tipoOperacao:       string;
  dtEntradaSaida:     string;
  dtVencimento:       string;
  vlrDesdobramento:   number;
  vlrDesconto:        number;
  vlrBaixa:           number;
  dataBaixa:          string;
  // refs
  documentoFiscal:    DocumentoFiscalOrigem;
  notaDebito?:        NotaDebito;
  pendencia?:         string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const EMPRESAS = [
  { cod: "001", nome: "Sankhya Gestão de Negócios Ltda" },
  { cod: "002", nome: "Sankhya São Paulo S.A." },
  { cod: "003", nome: "Distribuidora Norte Ltda" },
];

const TIPOS_MOVIMENTO = ["Venda", "Prestação de Serviço"];

const MOCK: MultaJurosReceita[] = [
  // ── 1 · Cálculo: Pendente ─────────────────────────────────────────────────
  {
    id: "mj1",
    dataNegociacao: "28/04/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Grupo Nexus S.A.",
    parceiroCNPJ: "23.456.789/0001-01",
    tipo: "Receita",
    tipoMovimento: "Venda",
    nroUnico: "100.010",
    multa: 450.0, juros: 230.0,
    totalIBSUF: 23.8, totalIBSMun: 23.8, totalCBS: 34.0,
    statusCalculo: "Pendente", statusGeracaoNota: "Pendente", statusDFe: "Não enviado",
    nroNota: "NF-001234", desdob: "001/001", tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "28/04/2026", dtVencimento: "25/04/2026",
    vlrDesdobramento: 11300.0, vlrDesconto: 0, vlrBaixa: 11750.0, dataBaixa: "28/04/2026",
    documentoFiscal: {
      dataNegociacao: "25/04/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Grupo Nexus S.A.", parceiroCNPJ: "23.456.789/0001-01",
      tipoMovimento: "Venda", numero: "1234",
      chaveDFe: "35260123456789000100550010000012341234567890",
      valor: 11300.0, totalIBSUF: 395.5, totalIBSMun: 395.5, totalCBS: 565.0,
      empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
      tipoOperacao: "1.201 - Venda de Mercadoria", tipoNegociacao: "A Vista",
      dtEntradaSaida: "25/04/2026", dtFaturamento: "25/04/2026", dtMovimento: "25/04/2026",
      finalidadeOperacao: "Normal", nroNFSe: "—", nroUnico: "100.004",
      serieNota: "001", statusNota: "Autorizado", notaModelo: "55 - NF-e",
    },
  },

  // ── 2 · Cálculo: Calculando ───────────────────────────────────────────────
  {
    id: "mj2",
    dataNegociacao: "05/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Comércio Leste Ltda",
    parceiroCNPJ: "77.888.999/0001-55",
    tipo: "Receita",
    tipoMovimento: "Venda",
    nroUnico: "200.030",
    multa: 1200.0, juros: 650.0,
    totalIBSUF: 64.75, totalIBSMun: 64.75, totalCBS: 92.5,
    statusCalculo: "Calculando", statusGeracaoNota: "Pendente", statusDFe: "Não enviado",
    nroNota: "NF-002200", desdob: "002/003", tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "05/05/2026", dtVencimento: "07/07/2026",
    vlrDesdobramento: 9933.33, vlrDesconto: 0, vlrBaixa: 11783.33, dataBaixa: "05/05/2026",
    documentoFiscal: {
      dataNegociacao: "07/05/2026",
      empresa: "002 - Sankhya São Paulo S.A.",
      parceiroNome: "Comércio Leste Ltda", parceiroCNPJ: "77.888.999/0001-55",
      tipoMovimento: "Venda", numero: "2200",
      chaveDFe: "35260267890100000123550010000022001234567891",
      valor: 29800.0, totalIBSUF: 1043.0, totalIBSMun: 1043.0, totalCBS: 1490.0,
      empresaNegociacao: "002 - Sankhya São Paulo S.A.",
      tipoOperacao: "1.201 - Venda de Mercadoria", tipoNegociacao: "A Prazo",
      dtEntradaSaida: "07/05/2026", dtFaturamento: "07/05/2026", dtMovimento: "07/05/2026",
      finalidadeOperacao: "Normal", nroNFSe: "—", nroUnico: "200.020",
      serieNota: "001", statusNota: "Autorizado", notaModelo: "55 - NF-e",
    },
  },

  // ── 3 · Concluído, Geração Pendente ──────────────────────────────────────
  {
    id: "mj3",
    dataNegociacao: "08/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Distribuidora Beta S.A.",
    parceiroCNPJ: "55.666.777/0001-88",
    tipo: "Receita",
    tipoMovimento: "Venda",
    nroUnico: "500.008",
    multa: 850.0, juros: 320.0,
    totalIBSUF: 40.95, totalIBSMun: 40.95, totalCBS: 58.5,
    statusCalculo: "Concluído", statusGeracaoNota: "Pendente", statusDFe: "Não enviado",
    nroNota: "NF-500210", desdob: "001/001", tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "08/05/2026", dtVencimento: "14/04/2026",
    vlrDesdobramento: 5100.0, vlrDesconto: 0, vlrBaixa: 6270.0, dataBaixa: "08/05/2026",
    documentoFiscal: {
      dataNegociacao: "14/05/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Distribuidora Beta S.A.", parceiroCNPJ: "55.666.777/0001-88",
      tipoMovimento: "Venda", numero: "5210",
      chaveDFe: "35260255666777000188550010000052101234567893",
      valor: 5100.0, totalIBSUF: 178.5, totalIBSMun: 178.5, totalCBS: 255.0,
      empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
      tipoOperacao: "1.201 - Venda de Mercadoria", tipoNegociacao: "A Vista",
      dtEntradaSaida: "14/05/2026", dtFaturamento: "14/05/2026", dtMovimento: "14/05/2026",
      finalidadeOperacao: "Normal", nroNFSe: "—", nroUnico: "500.005",
      serieNota: "001", statusNota: "Autorizado", notaModelo: "55 - NF-e",
    },
  },

  // ── 4 · Concluído, Geração Confirmada, DFe Não enviado ───────────────────
  {
    id: "mj4",
    dataNegociacao: "10/05/2026",
    empresa: "003 - Distribuidora Norte Ltda",
    empresaCod: "003",
    parceiroNome: "Materiais Omega S.A.",
    parceiroCNPJ: "88.999.000/0001-33",
    tipo: "Receita",
    tipoMovimento: "Venda",
    nroUnico: "600.025",
    multa: 2100.0, juros: 980.0,
    totalIBSUF: 107.8, totalIBSMun: 107.8, totalCBS: 154.0,
    statusCalculo: "Concluído", statusGeracaoNota: "Confirmada", statusDFe: "Não enviado",
    nroNota: "NF-600100", desdob: "001/001", tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "10/05/2026", dtVencimento: "05/04/2026",
    vlrDesdobramento: 21500.0, vlrDesconto: 0, vlrBaixa: 24580.0, dataBaixa: "10/05/2026",
    documentoFiscal: {
      dataNegociacao: "05/05/2026",
      empresa: "003 - Distribuidora Norte Ltda",
      parceiroNome: "Materiais Omega S.A.", parceiroCNPJ: "88.999.000/0001-33",
      tipoMovimento: "Venda", numero: "6100",
      chaveDFe: "35260288999000000133550010000061001234567892",
      valor: 21500.0, totalIBSUF: 752.5, totalIBSMun: 752.5, totalCBS: 1075.0,
      empresaNegociacao: "003 - Distribuidora Norte Ltda",
      tipoOperacao: "1.201 - Venda de Mercadoria", tipoNegociacao: "A Prazo",
      dtEntradaSaida: "05/05/2026", dtFaturamento: "05/05/2026", dtMovimento: "05/05/2026",
      finalidadeOperacao: "Normal", nroNFSe: "—", nroUnico: "600.020",
      serieNota: "001", statusNota: "Autorizado", notaModelo: "55 - NF-e",
    },
  },

  // ── 5 · Concluído, Geração Em geração, DFe Aguardando autorização ─────────
  {
    id: "mj5",
    dataNegociacao: "12/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Comércio Leste Ltda",
    parceiroCNPJ: "77.888.999/0001-55",
    tipo: "Receita",
    tipoMovimento: "Venda",
    nroUnico: "200.040",
    multa: 1800.0, juros: 720.0,
    totalIBSUF: 88.2, totalIBSMun: 88.2, totalCBS: 126.0,
    statusCalculo: "Concluído", statusGeracaoNota: "Confirmada", statusDFe: "Aguardando autorização",
    nroNota: "NF-002200", desdob: "003/003", tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "12/05/2026", dtVencimento: "07/08/2026",
    vlrDesdobramento: 9933.33, vlrDesconto: 0, vlrBaixa: 12453.33, dataBaixa: "12/05/2026",
    documentoFiscal: {
      dataNegociacao: "07/05/2026",
      empresa: "002 - Sankhya São Paulo S.A.",
      parceiroNome: "Comércio Leste Ltda", parceiroCNPJ: "77.888.999/0001-55",
      tipoMovimento: "Venda", numero: "2200",
      chaveDFe: "35260267890100000123550010000022001234567891",
      valor: 29800.0, totalIBSUF: 1043.0, totalIBSMun: 1043.0, totalCBS: 1490.0,
      empresaNegociacao: "002 - Sankhya São Paulo S.A.",
      tipoOperacao: "1.201 - Venda de Mercadoria", tipoNegociacao: "A Prazo",
      dtEntradaSaida: "07/05/2026", dtFaturamento: "07/05/2026", dtMovimento: "07/05/2026",
      finalidadeOperacao: "Normal", nroNFSe: "—", nroUnico: "200.020",
      serieNota: "001", statusNota: "Autorizado", notaModelo: "55 - NF-e",
    },
    notaDebito: {
      dataNegociacao: "12/05/2026",
      nroUnico: "ND-200.040",
      nroNota: "ND-000010",
      chaveDFeOrigem: "35260267890100000123550010000022001234567891",
      statusDFe: "Aguardando autorização",
    },
  },

  // ── 6 · Concluído, Confirmada, DFe Erro ──────────────────────────────────
  {
    id: "mj6",
    dataNegociacao: "14/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Grupo Nexus S.A.",
    parceiroCNPJ: "23.456.789/0001-01",
    tipo: "Receita",
    tipoMovimento: "Venda",
    nroUnico: "100.015",
    multa: 3500.0, juros: 1200.0,
    totalIBSUF: 164.5, totalIBSMun: 164.5, totalCBS: 235.0,
    statusCalculo: "Concluído", statusGeracaoNota: "Confirmada", statusDFe: "Erro",
    nroNota: "NF-001234", desdob: "001/001", tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "14/05/2026", dtVencimento: "25/03/2026",
    vlrDesdobramento: 11300.0, vlrDesconto: 0, vlrBaixa: 16000.0, dataBaixa: "14/05/2026",
    documentoFiscal: {
      dataNegociacao: "25/04/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Grupo Nexus S.A.", parceiroCNPJ: "23.456.789/0001-01",
      tipoMovimento: "Venda", numero: "1234",
      chaveDFe: "35260123456789000100550010000012341234567890",
      valor: 11300.0, totalIBSUF: 395.5, totalIBSMun: 395.5, totalCBS: 565.0,
      empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
      tipoOperacao: "1.201 - Venda de Mercadoria", tipoNegociacao: "A Vista",
      dtEntradaSaida: "25/04/2026", dtFaturamento: "25/04/2026", dtMovimento: "25/04/2026",
      finalidadeOperacao: "Normal", nroNFSe: "—", nroUnico: "100.004",
      serieNota: "001", statusNota: "Autorizado", notaModelo: "55 - NF-e",
    },
    notaDebito: {
      dataNegociacao: "14/05/2026",
      nroUnico: "ND-100.015",
      nroNota: "ND-000011",
      chaveDFeOrigem: "35260123456789000100550010000012341234567890",
      statusDFe: "Erro",
    },
  },

  // ── 7 · Concluído, Não configurado (sem modelo de Nota de Débito/Crédito) ──
  {
    id: "mj7b",
    dataNegociacao: "15/05/2026",
    empresa: "003 - Distribuidora Norte Ltda",
    empresaCod: "003",
    parceiroNome: "Transportes Sul S.A.",
    parceiroCNPJ: "11.222.333/0001-44",
    tipo: "Receita",
    tipoMovimento: "Prestação de Serviço",
    nroUnico: "300.011",
    multa: 980.0, juros: 410.0,
    totalIBSUF: 48.3, totalIBSMun: 48.3, totalCBS: 69.0,
    statusCalculo: "Concluído", statusGeracaoNota: "Não configurado", statusDFe: "Não enviado",
    nroNota: "NF-003100", desdob: "001/001", tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "15/05/2026", dtVencimento: "10/04/2026",
    vlrDesdobramento: 8200.0, vlrDesconto: 0, vlrBaixa: 9590.0, dataBaixa: "15/05/2026",
    documentoFiscal: {
      dataNegociacao: "10/05/2026",
      empresa: "003 - Distribuidora Norte Ltda",
      parceiroNome: "Transportes Sul S.A.", parceiroCNPJ: "11.222.333/0001-44",
      tipoMovimento: "Venda", numero: "3100",
      chaveDFe: "35260211222333000144550010000031001234567894",
      valor: 8200.0, totalIBSUF: 287.0, totalIBSMun: 287.0, totalCBS: 410.0,
      empresaNegociacao: "003 - Distribuidora Norte Ltda",
      tipoOperacao: "1.201 - Venda de Mercadoria", tipoNegociacao: "A Prazo",
      dtEntradaSaida: "10/05/2026", dtFaturamento: "10/05/2026", dtMovimento: "10/05/2026",
      finalidadeOperacao: "Normal", nroNFSe: "—", nroUnico: "300.008",
      serieNota: "001", statusNota: "Autorizado", notaModelo: "55 - NF-e",
    },
  },

  // ── 8 · Concluído, Confirmada, DFe Autorizado ─────────────────────────────
  {
    id: "mj8",
    dataNegociacao: "18/05/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    empresaCod: "002",
    parceiroNome: "Comércio Leste Ltda",
    parceiroCNPJ: "77.888.999/0001-55",
    tipo: "Receita",
    tipoMovimento: "Venda",
    nroUnico: "200.050",
    multa: 6200.0, juros: 2300.0,
    totalIBSUF: 297.5, totalIBSMun: 297.5, totalCBS: 425.0,
    statusCalculo: "Concluído", statusGeracaoNota: "Confirmada", statusDFe: "Autorizado",
    nroNota: "NF-002200", desdob: "001/003", tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "18/05/2026", dtVencimento: "07/06/2026",
    vlrDesdobramento: 9933.34, vlrDesconto: 0, vlrBaixa: 18433.34, dataBaixa: "18/05/2026",
    documentoFiscal: {
      dataNegociacao: "07/05/2026",
      empresa: "002 - Sankhya São Paulo S.A.",
      parceiroNome: "Comércio Leste Ltda", parceiroCNPJ: "77.888.999/0001-55",
      tipoMovimento: "Venda", numero: "2200",
      chaveDFe: "35260267890100000123550010000022001234567891",
      valor: 29800.0, totalIBSUF: 1043.0, totalIBSMun: 1043.0, totalCBS: 1490.0,
      empresaNegociacao: "002 - Sankhya São Paulo S.A.",
      tipoOperacao: "1.201 - Venda de Mercadoria", tipoNegociacao: "A Prazo",
      dtEntradaSaida: "07/05/2026", dtFaturamento: "07/05/2026", dtMovimento: "07/05/2026",
      finalidadeOperacao: "Normal", nroNFSe: "—", nroUnico: "200.020",
      serieNota: "001", statusNota: "Autorizado", notaModelo: "55 - NF-e",
      titulos: [
        {
          id: "td-200020",
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
        },
      ],
    },
    notaDebito: {
      dataNegociacao: "19/05/2026",
      nroUnico: "ND-200.050",
      nroNota: "ND-000012",
      chaveDFe: "35260167890100000123550010000000121234567999",
      chaveDFeOrigem: "35260267890100000123550010000022001234567891",
      statusDFe: "Autorizado",
    },
  },

  // ── 9 · Transportes Delta — Concluído, Confirmada, DFe Autorizado ────────────
  {
    id: "mj9",
    dataNegociacao: "25/05/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Transportes Delta S.A.",
    parceiroCNPJ: "22.333.444/0001-66",
    tipo: "Receita",
    tipoMovimento: "Prestação de Serviço",
    nroUnico: "400.010",
    multa: 360.0, juros: 180.0,
    totalIBSUF: 18.9, totalIBSMun: 18.9, totalCBS: 27.0,
    statusCalculo: "Concluído", statusGeracaoNota: "Confirmada", statusDFe: "Autorizado",
    nroNota: "NF-001400", desdob: "001/001", tipoOperacao: "1.209 - Recebimento",
    dtEntradaSaida: "25/05/2026", dtVencimento: "25/05/2026",
    vlrDesdobramento: 540.0, vlrDesconto: 0, vlrBaixa: 540.0, dataBaixa: "25/05/2026",
    documentoFiscal: {
      dataNegociacao: "15/05/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Transportes Delta S.A.", parceiroCNPJ: "22.333.444/0001-66",
      tipoMovimento: "Venda", numero: "1400",
      chaveDFe: "35260123456789000100550010000014001234567901",
      valor: 12000.0, totalIBSUF: 420.0, totalIBSMun: 420.0, totalCBS: 600.0,
      empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
      tipoOperacao: "1.201 - Venda de Mercadoria", tipoNegociacao: "A Vista",
      dtEntradaSaida: "15/05/2026", dtFaturamento: "15/05/2026", dtMovimento: "15/05/2026",
      finalidadeOperacao: "Normal", nroNFSe: "—", nroUnico: "400.001",
      serieNota: "001", statusNota: "Autorizado", notaModelo: "55 - NF-e",
      titulos: [
        {
          id: "td-400001",
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
        },
      ],
    },
    notaDebito: {
      dataNegociacao: "25/05/2026",
      nroUnico: "ND-400.010",
      nroNota: "ND-000020",
      chaveDFe: "35260123456789000100550010000000201234567902",
      chaveDFeOrigem: "35260123456789000100550010000014001234567901",
      statusDFe: "Autorizado",
    },
  },

  // ── Cenário 1: Indústria Alfa — Concluído, Geração Pendente ──────────────
  {
    id: "mj_pen1",
    dataNegociacao: "02/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Indústria Alfa S.A.",
    parceiroCNPJ: "11.222.333/0001-44",
    tipo: "Receita",
    tipoMovimento: "Venda",
    nroUnico: "100.099",
    multa: 540.0, juros: 270.0,
    totalIBSUF: 28.35, totalIBSMun: 28.35, totalCBS: 40.5,
    statusCalculo: "Concluído", statusGeracaoNota: "Pendente", statusDFe: "Não enviado",
    nroNota: "NF-001500", desdob: "001/001", tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "02/06/2026", dtVencimento: "02/05/2026",
    vlrDesdobramento: 18000.0, vlrDesconto: 0, vlrBaixa: 18810.0, dataBaixa: "02/06/2026",
    documentoFiscal: {
      dataNegociacao: "02/06/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Indústria Alfa S.A.", parceiroCNPJ: "11.222.333/0001-44",
      tipoMovimento: "Venda", numero: "1500",
      chaveDFe: "35260601234567890001550010000015001000015000",
      valor: 18000.0, totalIBSUF: 630.0, totalIBSMun: 630.0, totalCBS: 900.0,
      empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
      tipoOperacao: "1.201 - Venda de Mercadoria", tipoNegociacao: "A Prazo",
      dtEntradaSaida: "02/06/2026", dtFaturamento: "02/06/2026", dtMovimento: "02/06/2026",
      finalidadeOperacao: "Normal", nroNFSe: "—", nroUnico: "100.099",
      serieNota: "001", statusNota: "Autorizado", notaModelo: "55 - NF-e",
    },
  },

  // ── PV-010 — Parcela 2 / Digital Supply (Concluído, Confirmada, Autorizado) ───
  {
    id: "mj-pv010",
    dataNegociacao: "10/06/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod: "001",
    parceiroNome: "Digital Supply Ltda",
    parceiroCNPJ: "12.345.678/0001-55",
    tipo: "Receita",
    tipoMovimento: "Venda",
    nroUnico: "100.803",
    multa: 300.0, juros: 150.0,
    totalIBSUF: 15.75, totalIBSMun: 15.75, totalCBS: 22.5,
    statusCalculo: "Concluído", statusGeracaoNota: "Confirmada", statusDFe: "Autorizado",
    nroNota: "NF-001601", desdob: "002/002", tipoOperacao: "1.201 - Recebimento",
    dtEntradaSaida: "05/06/2026", dtVencimento: "05/07/2026",
    vlrDesdobramento: 10000.0, vlrDesconto: 0, vlrBaixa: 10450.0, dataBaixa: "10/06/2026",
    documentoFiscal: {
      dataNegociacao: "05/06/2026",
      empresa: "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome: "Digital Supply Ltda", parceiroCNPJ: "12.345.678/0001-55",
      tipoMovimento: "Venda", numero: "1601",
      chaveDFe: "35260601234567890001550010000016011000016011",
      valor: 20000.0, totalIBSUF: 700.0, totalIBSMun: 700.0, totalCBS: 1000.0,
      empresaNegociacao: "001 - Sankhya Gestão de Negócios Ltda",
      tipoOperacao: "1.201 - Venda de Mercadoria", tipoNegociacao: "A Prazo",
      dtEntradaSaida: "05/06/2026", dtFaturamento: "05/06/2026", dtMovimento: "05/06/2026",
      finalidadeOperacao: "Normal", nroNFSe: "—", nroUnico: "100.801",
      serieNota: "001", statusNota: "Autorizado", notaModelo: "55 - NF-e",
      titulos: [
        {
          id: "td-100802",
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
        },
        {
          id: "td-100803",
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
        },
      ],
    },
    notaDebito: {
      dataNegociacao: "10/06/2026",
      nroUnico: "ND-100.810",
      nroNota: "ND-001602",
      chaveDFe: "35260601234567890001550010000016021000016021",
      chaveDFeOrigem: "35260601234567890001550010000016011000016011",
      statusDFe: "Autorizado",
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function parseDate(date: string): Date {
  const [d, m, y] = date.split("/");
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function BadgeCalculo({ status }: { status: StatusCalculo }) {
  const cls =
    status === "Concluído"   ? "border-green-300 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/40" :
    status === "Calculando"  ? "border-blue-300 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40" :
                               "border-gray-300 text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/40";
  return <Badge variant="outline" className={cn("text-[11px] whitespace-nowrap", cls)}>{status}</Badge>;
}

function BadgeGeracao({ status }: { status: StatusGeracaoNota }) {
  const cls =
    status === "Confirmada"      ? "border-green-300 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/40" :
    status === "Em geração"      ? "border-amber-300 text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40" :
    status === "Não configurado" ? "border-orange-300 text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/40" :
                                   "border-gray-300 text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/40";
  return <Badge variant="outline" className={cn("text-[11px] whitespace-nowrap", cls)}>{status}</Badge>;
}

function BadgeDFe({ status }: { status: StatusDFe }) {
  const cls =
    status === "Autorizado"              ? "border-green-300 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/40" :
    status === "Aguardando autorização"  ? "border-blue-300 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40" :
    status === "Erro"                    ? "border-red-300 text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/40" :
                                           "border-gray-300 text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/40";
  return <Badge variant="outline" className={cn("text-[11px] whitespace-nowrap", cls)}>{status}</Badge>;
}

function SummaryCard({
  label, value, mono = false, colorClass,
}: { label: string; value: string; mono?: boolean; colorClass?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[11px] text-muted-foreground mb-0.5">{label}</div>
      <div className={cn("text-[13px] font-medium truncate", mono && "font-mono", colorClass)}>
        {value}
      </div>
    </div>
  );
}

function DetailField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground mb-0.5">{label}</div>
      <div className={cn("text-[13px] text-foreground", mono && "font-mono")}>{value}</div>
    </div>
  );
}

// valor IBS/CBS só aparece quando Concluído
function ibsValue(v: number, status: StatusCalculo) {
  return status === "Concluído" ? brl(v) : "—";
}

function PendenciaIcon({ pendencia }: { pendencia?: string }) {
  if (pendencia) {
    return <AlertTriangle className="h-4 w-4 text-amber-500" aria-label="Pendência" />;
  }
  return <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Sem pendências" />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type View = "list" | "detail" | "doc-fiscal";

export default function MovimentacoesReceitasMultaJuros() {
  const location = useLocation();
  const [view, setView]                 = useState<View>("list");
  const [selected, setSelected]         = useState<MultaJurosReceita | null>(null);
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroDe, setFiltroDe] = useState("");
  const [filtroAte, setFiltroAte] = useState("");
  const [filtroCalculo, setFiltroCalculo] = useState("");
  const [filtroGeracao, setFiltroGeracao] = useState("");
  const [filtroDFe, setFiltroDFe] = useState("");
  const [filtroTipoMovimento, setFiltroTipoMovimento] = useState("");

  useEffect(() => {
    const nroUnico = (location.state as { openNroUnico?: string } | null)?.openNroUnico;
    if (!nroUnico) return;
    const record = MOCK.find((r) => r.nroUnico === nroUnico);
    if (record) { setSelected(record); setView("detail"); }
  }, [location.state]);

  const hasFilter = filtroEmpresa !== "" || filtroDe !== "" || filtroAte !== "" ||
    filtroCalculo !== "" || filtroGeracao !== "" || filtroDFe !== "" || filtroTipoMovimento !== "";

  const rows = useMemo(() => {
    const de = filtroDe ? new Date(filtroDe) : null;
    const ate = filtroAte ? new Date(filtroAte) : null;
    return MOCK.filter((r) => {
      const byEmpresa = !filtroEmpresa || r.empresaCod === filtroEmpresa;
      const dt = parseDate(r.dataNegociacao);
      const byDe = !de || dt >= de;
      const byAte = !ate || dt <= ate;
      const byCalculo = !filtroCalculo || r.statusCalculo === filtroCalculo;
      const byGeracao = !filtroGeracao || r.statusGeracaoNota === filtroGeracao;
      const byDFe = !filtroDFe || r.statusDFe === filtroDFe;
      const byTipo = !filtroTipoMovimento || r.tipoMovimento === filtroTipoMovimento;
      return byEmpresa && byDe && byAte && byCalculo && byGeracao && byDFe && byTipo;
    });
  }, [filtroEmpresa, filtroDe, filtroAte, filtroCalculo, filtroGeracao, filtroDFe, filtroTipoMovimento]);

  if (view === "doc-fiscal" && selected) {
    return (
      <DocFiscalDetailView
        doc={selected.documentoFiscal}
        onBack={() => setView("detail")}
      />
    );
  }

  if (view === "detail" && selected) {
    return (
      <MultaJurosDetailView
        record={selected}
        onBack={() => { setView("list"); setSelected(null); }}
        onDetalharDoc={() => setView("doc-fiscal")}
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
          <span className="text-foreground font-medium">Multa e Juros</span>
        </div>
        <h1 className="text-[18px] font-semibold">Receitas — Multa e Juros</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Títulos a receber com multa e juros recebidos nas liquidações · a partir de 01/01/2026
        </p>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

          {/* Empresa */}
          <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
            <SelectTrigger className="w-[260px] h-8 text-[13px]">
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

          {/* De */}
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-muted-foreground">De</span>
            <input
              type="date"
              value={filtroDe}
              onChange={(e) => setFiltroDe(e.target.value)}
              className="h-8 text-[13px] rounded-md border border-input bg-background px-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>

          {/* Até */}
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-muted-foreground">Até</span>
            <input
              type="date"
              value={filtroAte}
              onChange={(e) => setFiltroAte(e.target.value)}
              className="h-8 text-[13px] rounded-md border border-input bg-background px-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>

          {/* Cálculo */}
          <Select value={filtroCalculo} onValueChange={setFiltroCalculo}>
            <SelectTrigger className="w-[145px] h-8 text-[13px]">
              <SelectValue placeholder="Cálculo" />
            </SelectTrigger>
            <SelectContent>
              {(["Pendente", "Calculando", "Concluído"] as StatusCalculo[]).map((s) => (
                <SelectItem key={s} value={s} className="text-[13px]">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Geração da Nota */}
          <Select value={filtroGeracao} onValueChange={setFiltroGeracao}>
            <SelectTrigger className="w-[175px] h-8 text-[13px]">
              <SelectValue placeholder="Geração da Nota" />
            </SelectTrigger>
            <SelectContent>
              {(["Pendente", "Em geração", "Confirmada", "Não configurado"] as StatusGeracaoNota[]).map((s) => (
                <SelectItem key={s} value={s} className="text-[13px]">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status DFe */}
          <Select value={filtroDFe} onValueChange={setFiltroDFe}>
            <SelectTrigger className="w-[200px] h-8 text-[13px]">
              <SelectValue placeholder="Status DFe" />
            </SelectTrigger>
            <SelectContent>
              {(["Não enviado", "Aguardando autorização", "Erro", "Autorizado"] as StatusDFe[]).map((s) => (
                <SelectItem key={s} value={s} className="text-[13px]">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tipo de Movimento */}
          <Select value={filtroTipoMovimento} onValueChange={setFiltroTipoMovimento}>
            <SelectTrigger className="w-[185px] h-8 text-[13px]">
              <SelectValue placeholder="Tipo de Movimento" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_MOVIMENTO.map((t) => (
                <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilter && (
            <button
              onClick={() => {
                setFiltroEmpresa(""); setFiltroDe(""); setFiltroAte("");
                setFiltroCalculo(""); setFiltroGeracao(""); setFiltroDFe("");
                setFiltroTipoMovimento("");
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
                    <TableHead className="text-[12px]">Nro Único</TableHead>
                    <TableHead className="text-[12px] text-right">Multa</TableHead>
                    <TableHead className="text-[12px] text-right">Juros</TableHead>
                    <TableHead className="text-[12px] text-right">IBS UF Calculado</TableHead>
                    <TableHead className="text-[12px] text-right">IBS Mun Calculado</TableHead>
                    <TableHead className="text-[12px] text-right">CBS Calculado</TableHead>
                    <TableHead className="text-[12px]">Cálculo</TableHead>
                    <TableHead className="text-[12px]">Geração da Nota</TableHead>
                    <TableHead className="text-[12px]">Status DFe</TableHead>
                    <TableHead className="text-[12px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
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
                      <TableCell className="text-right font-mono">{brl(r.multa)}</TableCell>
                      <TableCell className="text-right font-mono">{brl(r.juros)}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {ibsValue(r.totalIBSUF, r.statusCalculo)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {ibsValue(r.totalIBSMun, r.statusCalculo)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {ibsValue(r.totalCBS, r.statusCalculo)}
                      </TableCell>
                      <TableCell><BadgeCalculo status={r.statusCalculo} /></TableCell>
                      <TableCell><BadgeGeracao status={r.statusGeracaoNota} /></TableCell>
                      <TableCell><BadgeDFe status={r.statusDFe} /></TableCell>
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
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Multa e Juros Detail View ────────────────────────────────────────────────

function MultaJurosDetailView({
  record: r,
  onBack,
  onDetalharDoc,
}: {
  record: MultaJurosReceita;
  onBack: () => void;
  onDetalharDoc: () => void;
}) {
  const navigate = useNavigate();
  const showGerar   = r.statusGeracaoNota === "Confirmada" && r.statusDFe === "Não enviado";
  const showBuscar  = r.statusDFe === "Aguardando autorização";
  const concluido   = r.statusCalculo === "Concluído";

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
            <span>Multa e Juros</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium truncate">Nro Único {r.nroUnico}</span>
          </div>
          <h1 className="text-[16px] font-semibold">Detalhamento — Multa e Juros</h1>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
          {showGerar && (
            <Button variant="default" size="sm" className="h-8 text-[12px] gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Gerar Nota de Débito
            </Button>
          )}
          {showBuscar && (
            <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Buscar autorização
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Central de Vendas
          </Button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-6">

        {/* Status do processo */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Cálculo</span>
            <BadgeCalculo status={r.statusCalculo} />
          </div>
          <div className="h-px w-4 bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Geração da Nota</span>
            <BadgeGeracao status={r.statusGeracaoNota} />
          </div>
          <div className="h-px w-4 bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Status DFe</span>
            <BadgeDFe status={r.statusDFe} />
          </div>
        </div>

        {/* Resumo do Título */}
        <CollapsibleSection title="Resumo do Título">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Dt. Negociação" value={r.dataNegociacao}  mono />
            <SummaryCard label="Empresa"        value={r.empresa}              />
            <SummaryCard label="Parceiro"       value={r.parceiroNome}         />
            <SummaryCard
              label="Tipo"
              value={r.tipo}
              colorClass="text-blue-700 dark:text-blue-400"
            />
            <SummaryCard label="Nro Único"      value={r.nroUnico}        mono />
            <SummaryCard label="Multa"          value={brl(r.multa)}      mono />
            <SummaryCard label="Juros"          value={brl(r.juros)}      mono />
            <SummaryCard
              label="IBS UF Calculado"
              value={ibsValue(r.totalIBSUF, r.statusCalculo)}
              mono
              colorClass={!concluido ? "text-muted-foreground" : undefined}
            />
            <SummaryCard
              label="IBS Mun Calculado"
              value={ibsValue(r.totalIBSMun, r.statusCalculo)}
              mono
              colorClass={!concluido ? "text-muted-foreground" : undefined}
            />
            <SummaryCard
              label="CBS Calculado"
              value={ibsValue(r.totalCBS, r.statusCalculo)}
              mono
              colorClass={!concluido ? "text-muted-foreground" : undefined}
            />
            <div className="col-span-2 md:col-span-1">
              <SummaryCard
                label="Cálculo"
                value={r.statusCalculo}
                colorClass={
                  r.statusCalculo === "Concluído"  ? "text-green-700 dark:text-green-400" :
                  r.statusCalculo === "Calculando" ? "text-blue-700 dark:text-blue-400" :
                                                     "text-muted-foreground"
                }
              />
            </div>
            <SummaryCard label="Geração da Nota" value={r.statusGeracaoNota} />
            <SummaryCard label="Status DFe"      value={r.statusDFe}         />
          </div>
        </CollapsibleSection>

        {/* Detalhes do Título — TGFFIN */}
        <CollapsibleSection title="Detalhes do Título">
          <div className="rounded-lg border bg-card p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-4">
              <DetailField label="Nro Nota"           value={r.nroNota}              mono />
              <DetailField label="Desdobramento"      value={r.desdob}               mono />
              <DetailField label="Tipo Operação"      value={r.tipoOperacao}              />
              <DetailField label="Dt. Negociação"     value={r.dataNegociacao}       mono />
              <DetailField label="Dt. Entrada/Saída"  value={r.dtEntradaSaida}       mono />
              <DetailField label="Dt. Vencimento"     value={r.dtVencimento}         mono />
              <DetailField label="Vlr Desdobramento"  value={brl(r.vlrDesdobramento)} mono />
              <DetailField label="Vlr Desconto"       value={brl(r.vlrDesconto)}     mono />
              <DetailField label="Vlr Multa"          value={brl(r.multa)}           mono />
              <DetailField label="Vlr Juros"          value={brl(r.juros)}           mono />
              <DetailField label="Vlr Baixa"          value={brl(r.vlrBaixa)}        mono />
              <DetailField label="Data Baixa"         value={r.dataBaixa}            mono />
            </div>
          </div>
        </CollapsibleSection>

        {/* Documento Fiscal Origem */}
        <CollapsibleSection title="Documento Fiscal Origem">
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
                <TableRow className="text-[13px]">
                  <TableCell className="font-mono text-[12px]">{r.documentoFiscal.dataNegociacao}</TableCell>
                  <TableCell>{r.documentoFiscal.empresa}</TableCell>
                  <TableCell>
                    <div>{r.documentoFiscal.parceiroNome}</div>
                    <div className="text-[11px] text-muted-foreground">{r.documentoFiscal.parceiroCNPJ}</div>
                  </TableCell>
                  <TableCell className="font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap">
                    {r.documentoFiscal.tipoMovimento}
                  </TableCell>
                  <TableCell className="font-mono">{r.documentoFiscal.numero}</TableCell>
                  <TableCell className="max-w-[140px]">
                    <span
                      className="font-mono text-[11px] text-muted-foreground truncate block"
                      title={r.documentoFiscal.chaveDFe}
                    >
                      {r.documentoFiscal.chaveDFe}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{brl(r.documentoFiscal.valor)}</TableCell>
                  <TableCell className="text-right font-mono">{brl(r.documentoFiscal.totalIBSUF)}</TableCell>
                  <TableCell className="text-right font-mono">{brl(r.documentoFiscal.totalIBSMun)}</TableCell>
                  <TableCell className="text-right font-mono">{brl(r.documentoFiscal.totalCBS)}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[12px] gap-1"
                      onClick={onDetalharDoc}
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

        {/* Nota de Débito */}
        {r.notaDebito && (
          <CollapsibleSection title="Nota de Débito">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[12px]">Dt. Negociação</TableHead>
                    <TableHead className="text-[12px]">Nro Único</TableHead>
                    <TableHead className="text-[12px]">Nro Nota</TableHead>
                    {r.notaDebito.statusDFe === "Autorizado" && (
                      <TableHead className="text-[12px]">Chave DFe</TableHead>
                    )}
                    <TableHead className="text-[12px]">Chave DFe Origem</TableHead>
                    <TableHead className="text-[12px]">Status DFe</TableHead>
                    <TableHead className="text-[12px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="text-[13px]">
                    <TableCell className="font-mono text-[12px]">{r.notaDebito.dataNegociacao}</TableCell>
                    <TableCell className="font-mono">{r.notaDebito.nroUnico}</TableCell>
                    <TableCell className="font-mono">{r.notaDebito.nroNota}</TableCell>
                    {r.notaDebito.statusDFe === "Autorizado" && (
                      <TableCell className="max-w-[160px]">
                        <span
                          className="font-mono text-[11px] text-muted-foreground truncate block"
                          title={r.notaDebito.chaveDFe}
                        >
                          {r.notaDebito.chaveDFe}
                        </span>
                      </TableCell>
                    )}
                    <TableCell className="max-w-[160px]">
                      <span
                        className="font-mono text-[11px] text-muted-foreground truncate block"
                        title={r.notaDebito.chaveDFeOrigem}
                      >
                        {r.notaDebito.chaveDFeOrigem}
                      </span>
                    </TableCell>
                    <TableCell><BadgeDFe status={r.notaDebito.statusDFe} /></TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[12px] gap-1"
                        onClick={() =>
                          navigate(ERoutes.MOVIMENTACOES_DOCUMENTOS_MOVIMENTO, {
                            state: { openChaveDFe: r.notaDebito!.chaveDFe ?? r.notaDebito!.chaveDFeOrigem },
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
          </CollapsibleSection>
        )}

      </div>
    </div>
  );
}

// ─── Documento Fiscal Detail View ─────────────────────────────────────────────

function DocFiscalDetailView({
  doc: d,
  onBack,
}: {
  doc: DocumentoFiscalOrigem;
  onBack: () => void;
}) {
  const navigate = useNavigate();
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
            <FileStack className="h-3.5 w-3.5 shrink-0" />
            <span>Documentos</span>
            <ChevronRight className="h-3 w-3" />
            <span>Movimento</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium truncate">Nro {d.numero}</span>
          </div>
          <h1 className="text-[16px] font-semibold">Detalhamento do Documento Fiscal</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Central de Vendas
          </Button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-6">

        {/* Resumo */}
        <CollapsibleSection title="Resumo do Documento">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <SummaryCard label="Dt. Negociação"   value={d.dataNegociacao}  mono />
            <SummaryCard label="Empresa"           value={d.empresa}              />
            <SummaryCard label="Parceiro"          value={d.parceiroNome}         />
            <SummaryCard
              label="Tipo de Movimento"
              value={d.tipoMovimento}
              colorClass="text-blue-700 dark:text-blue-400"
            />
            <SummaryCard label="Número"            value={d.numero}         mono />
            <SummaryCard label="Valor"             value={brl(d.valor)}     mono />
            <SummaryCard label="CBS Calculado"      value={brl(d.totalCBS)}   mono />
            <SummaryCard label="IBS UF Calculado"  value={brl(d.totalIBSUF)} mono />
            <SummaryCard label="IBS Mun Calculado" value={brl(d.totalIBSMun)} mono />
            <div className="col-span-2 md:col-span-3 overflow-hidden">
              <div className="rounded-lg border bg-card p-3 overflow-hidden">
                <div className="text-[11px] text-muted-foreground mb-0.5">Chave DFe</div>
                <div className="font-mono text-[11px] text-foreground break-all leading-relaxed min-w-0">
                  {d.chaveDFe}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Detalhes TGFCAB */}
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

        {/* Títulos do Documento */}
        {d.titulos && d.titulos.length > 0 && (
          <CollapsibleSection title={<>Títulos do Documento <span className="ml-2 font-normal text-muted-foreground normal-case tracking-normal">({d.titulos.length} título{d.titulos.length !== 1 ? "s" : ""})</span></>}>
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
                    <TableHead className="text-[12px] text-right">Valor</TableHead>
                    <TableHead className="text-[12px] text-right">IBS UF</TableHead>
                    <TableHead className="text-[12px] text-right">IBS Mun</TableHead>
                    <TableHead className="text-[12px] text-right">CBS</TableHead>
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
                      <TableCell className="font-medium whitespace-nowrap">{t.tipoMovimento}</TableCell>
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
                          onClick={() =>
                            navigate(ERoutes.MOVIMENTACOES_RECEITAS_MOVIMENTO, {
                              state: { openNroUnico: t.nroUnico },
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
          </CollapsibleSection>
        )}

      </div>
    </div>
  );
}
