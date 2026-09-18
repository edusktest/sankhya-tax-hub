import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TrendingUp, ChevronRight, ExternalLink, Eye, Filter, X,
  FileText, FileStack, AlertTriangle, CheckCircle2, RefreshCw, BadgeCheck,
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

type StatusCalculo             = "Pendente" | "Processando" | "Concluído" | "Erro" | "Não configurado";
type StatusGeracaoNota         = "Pendente" | "Processando" | "Confirmada" | "Erro" | "Não configurado";
type StatusDFe                 = "Não enviado" | "Aguardando autorização" | "Erro" | "Autorizado" | "Cancelado" | "Denegado";
type StatusPagamentoAntecipado = "Pendente" | "Confirmado";

interface NotaDebito {
  dataNegociacao: string;
  nroUnico:       string;
  nroNota:        string;
  chaveDFe?:      string;
  chaveDFeOrigem: string;
  statusDFe:      StatusDFe;
}

interface TituloDoc {
  id:               string;
  dataNegociacao:   string;
  empresa:          string;
  parceiroNome:     string;
  parceiroCNPJ:     string;
  tipo:             "Receita" | "Despesa";
  tipoMovimento:    string;
  nroUnico:         string;
  vlrDesdobramento: number;
  totalIBS:         number;
  totalCBS:         number;
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
  totalIBS:           number;
  totalCBS:           number;
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

interface PedidoRef {
  id:             string;
  numero:         string;
  dataNegociacao: string;
  empresa:        string;
  parceiroNome:   string;
  parceiroCNPJ:   string;
  nroUnico:       string;
  valor:          number;
  tipoOperacao:   string;
  pendencia?:     boolean;
}

interface PagamentoAntecipadoReceita {
  id:                        string;
  dataNegociacao:            string;
  empresa:                   string;
  empresaCod:                string;
  parceiroNome:              string;
  parceiroCNPJ:              string;
  tipo:                      "Receita";
  tipoMovimento:             string;
  nroUnico:                  string;
  parcela:                   string;
  totalIBS:                  number;
  totalCBS:                  number;
  statusPagamentoAntecipado: StatusPagamentoAntecipado;
  statusCalculo:             StatusCalculo;
  statusGeracaoNota:         StatusGeracaoNota;
  statusDFe:                 StatusDFe;
  // TGFFIN
  nroNota:          string;
  desdob:           string;
  tipoOperacao:     string;
  dtEntradaSaida:   string;
  dtVencimento:     string;
  vlrDesdobramento: number;
  vlrDesconto:      number;
  vlrBaixa:         number;
  dataBaixa:        string;
  // refs
  documentoFiscal?:          DocumentoFiscalOrigem;
  semDocumentoFinalidadeNormal?: boolean;
  pedidoRef:       PedidoRef;
  notaDebito?:     NotaDebito;
  baixaEstornada?: boolean;
}

// ─── Pendências ───────────────────────────────────────────────────────────────

export const PENDENCIAS_PA = {
  PRT0005: "Título baixado com Pedido sem um documento fiscal referenciado.",
  PRT0006: "Documento não tem um documento fiscal com finalidade normal emitida.",
} as const;

export type CodigoPRTPA = keyof typeof PENDENCIAS_PA;

export interface PendenciaPA {
  codigo:   CodigoPRTPA;
  descricao: string;
}

const DFE_DEFINITIVO = new Set<StatusDFe>(["Autorizado", "Cancelado", "Denegado"]);

function isDFeDefinitivo(status: StatusDFe): boolean {
  return DFE_DEFINITIVO.has(status);
}

export function getPagamentoAntecipadoPendencias(r: PagamentoAntecipadoReceita): PendenciaPA[] {
  const p: PendenciaPA[] = [];
  if (!r.documentoFiscal)
    p.push({ codigo: "PRT0005", descricao: PENDENCIAS_PA.PRT0005 });
  if (r.semDocumentoFinalidadeNormal)
    p.push({ codigo: "PRT0006", descricao: PENDENCIAS_PA.PRT0006 });
  return p;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const EMPRESAS = [
  { cod: "001", nome: "Sankhya Gestão de Negócios Ltda" },
  { cod: "002", nome: "Sankhya São Paulo S.A." },
  { cod: "003", nome: "Distribuidora Norte Ltda" },
];

const TIPOS_MOVIMENTO = ["Venda", "Pedido de Venda"];

const DOC_PV010: DocumentoFiscalOrigem = {
  dataNegociacao:     "05/08/2026",
  empresa:            "001 - Sankhya Gestão de Negócios Ltda",
  parceiroNome:       "Digital Supply Ltda",
  parceiroCNPJ:       "12.345.678/0001-55",
  tipoMovimento:      "Pedido de Venda",
  numero:             "NF-001601",
  chaveDFe:           "35260801234567890001550010000016011000016011",
  valor:              20000.0,
  totalIBS:           700.0,
  totalCBS:           1000.0,
  empresaNegociacao:  "001 - Sankhya Gestão de Negócios Ltda",
  tipoOperacao:       "1.001 - Pedido de Venda",
  tipoNegociacao:     "Boleto",
  dtEntradaSaida:     "05/08/2026",
  dtFaturamento:      "05/08/2026",
  dtMovimento:        "05/08/2026",
  finalidadeOperacao: "Remessa",
  nroNFSe:            "—",
  nroUnico:           "100.800",
  serieNota:          "001",
  statusNota:         "Liberado",
  notaModelo:         "55",
};

const DOC_PV005: DocumentoFiscalOrigem = {
  dataNegociacao:     "20/08/2026",
  empresa:            "001 - Sankhya Gestão de Negócios Ltda",
  parceiroNome:       "Indústria Nova Ltda",
  parceiroCNPJ:       "77.888.999/0001-66",
  tipoMovimento:      "Pedido de Venda",
  numero:             "NF-000601",
  chaveDFe:           "35260801234567890001550010000006011234560601",
  valor:              90.0,
  totalIBS:           3.15,
  totalCBS:           4.50,
  empresaNegociacao:  "001 - Sankhya Gestão de Negócios Ltda",
  tipoOperacao:       "1.001 - Pedido de Venda",
  tipoNegociacao:     "Boleto",
  dtEntradaSaida:     "20/08/2026",
  dtFaturamento:      "20/08/2026",
  dtMovimento:        "20/08/2026",
  finalidadeOperacao: "Remessa",
  nroNFSe:            "—",
  nroUnico:           "100.700",
  serieNota:          "001",
  statusNota:         "Liberado",
  notaModelo:         "55",
};

const DOC_PV015: DocumentoFiscalOrigem = {
  dataNegociacao:     "01/09/2026",
  empresa:            "002 - Sankhya São Paulo S.A.",
  parceiroNome:       "Grupo Nexus S.A.",
  parceiroCNPJ:       "22.333.444/0001-77",
  tipoMovimento:      "Pedido de Venda",
  numero:             "NF-002501",
  chaveDFe:           "35260902233444000177550010000025011000025011",
  valor:              15000.0,
  totalIBS:           525.0,
  totalCBS:           750.0,
  empresaNegociacao:  "002 - Sankhya São Paulo S.A.",
  tipoOperacao:       "1.001 - Pedido de Venda",
  tipoNegociacao:     "Boleto",
  dtEntradaSaida:     "01/09/2026",
  dtFaturamento:      "01/09/2026",
  dtMovimento:        "01/09/2026",
  finalidadeOperacao: "Remessa",
  nroNFSe:            "—",
  nroUnico:           "100.900",
  serieNota:          "001",
  statusNota:         "Liberado",
  notaModelo:         "55",
};

const DOC_PV020: DocumentoFiscalOrigem = {
  dataNegociacao:     "05/09/2026",
  empresa:            "001 - Sankhya Gestão de Negócios Ltda",
  parceiroNome:       "Comércio Leste Ltda",
  parceiroCNPJ:       "55.666.777/0001-88",
  tipoMovimento:      "Venda",
  numero:             "NF-003001",
  chaveDFe:           "35260901234567890001550010000030011000030011",
  valor:              5000.0,
  totalIBS:           175.0,
  totalCBS:           250.0,
  empresaNegociacao:  "001 - Sankhya Gestão de Negócios Ltda",
  tipoOperacao:       "1.101 - Venda de Mercadoria",
  tipoNegociacao:     "Boleto",
  dtEntradaSaida:     "05/09/2026",
  dtFaturamento:      "05/09/2026",
  dtMovimento:        "05/09/2026",
  finalidadeOperacao: "Remessa",
  nroNFSe:            "—",
  nroUnico:           "100.950",
  serieNota:          "001",
  statusNota:         "Liberado",
  notaModelo:         "55",
};

const DOC_PV025: DocumentoFiscalOrigem = {
  dataNegociacao:     "08/09/2026",
  empresa:            "003 - Distribuidora Norte Ltda",
  parceiroNome:       "Transportes Sul S.A.",
  parceiroCNPJ:       "33.444.555/0001-99",
  tipoMovimento:      "Venda",
  numero:             "NF-004501",
  chaveDFe:           "35260903344455500199550010000045011000045011",
  valor:              12000.0,
  totalIBS:           420.0,
  totalCBS:           600.0,
  empresaNegociacao:  "003 - Distribuidora Norte Ltda",
  tipoOperacao:       "1.101 - Venda de Mercadoria",
  tipoNegociacao:     "Boleto",
  dtEntradaSaida:     "08/09/2026",
  dtFaturamento:      "08/09/2026",
  dtMovimento:        "08/09/2026",
  finalidadeOperacao: "Remessa",
  nroNFSe:            "—",
  nroUnico:           "100.970",
  serieNota:          "001",
  statusNota:         "Liberado",
  notaModelo:         "55",
};

const DOC_PV030: DocumentoFiscalOrigem = {
  dataNegociacao:     "05/09/2026",
  empresa:            "002 - Sankhya São Paulo S.A.",
  parceiroNome:       "Atacado Central Ltda",
  parceiroCNPJ:       "88.999.111/0001-22",
  tipoMovimento:      "Pedido de Venda",
  numero:             "NF-005001",
  chaveDFe:           "35260902899911100122550010000050011000050011",
  valor:              8000.0,
  totalIBS:           280.0,
  totalCBS:           400.0,
  empresaNegociacao:  "002 - Sankhya São Paulo S.A.",
  tipoOperacao:       "1.001 - Pedido de Venda",
  tipoNegociacao:     "Boleto",
  dtEntradaSaida:     "05/09/2026",
  dtFaturamento:      "05/09/2026",
  dtMovimento:        "05/09/2026",
  finalidadeOperacao: "Remessa",
  nroNFSe:            "—",
  nroUnico:           "101.000",
  serieNota:          "001",
  statusNota:         "Liberado",
  notaModelo:         "55",
};

const MOCK: PagamentoAntecipadoReceita[] = [
  // ── pa-001 — Digital Supply, parcela 1/2, PA Pendente ────────────────────────
  {
    id:                        "pa-001",
    dataNegociacao:            "05/08/2026",
    empresa:                   "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod:                "001",
    parceiroNome:              "Digital Supply Ltda",
    parceiroCNPJ:              "12.345.678/0001-55",
    tipo:                      "Receita",
    tipoMovimento:             "Pedido de Venda",
    nroUnico:                  "100.803",
    parcela:                   "1/2",
    totalIBS:                  350.0,
    totalCBS:                  500.0,
    statusPagamentoAntecipado: "Pendente",
    statusCalculo:             "Não configurado",
    statusGeracaoNota:         "Não configurado",
    statusDFe:                 "Não enviado",
    nroNota:                   "NF-001601",
    desdob:                    "001/002",
    tipoOperacao:              "1.201 - Recebimento",
    dtEntradaSaida:            "05/08/2026",
    dtVencimento:              "05/09/2026",
    vlrDesdobramento:          10000.0,
    vlrDesconto:               0,
    vlrBaixa:                  10000.0,
    dataBaixa:                 "12/08/2026",
    documentoFiscal:           DOC_PV010,
    pedidoRef: {
      id:             "pv-010",
      numero:         "PV-010",
      dataNegociacao: "05/08/2026",
      empresa:        "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome:   "Digital Supply Ltda",
      parceiroCNPJ:   "12.345.678/0001-55",
      nroUnico:       "100.800",
      valor:          20000.0,
      tipoOperacao:   "1.001 - Pedido de Venda",
    },
  },

  // ── pa-002 — Digital Supply, parcela 2/2, PA Pendente ────────────────────────
  {
    id:                        "pa-002",
    dataNegociacao:            "05/08/2026",
    empresa:                   "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod:                "001",
    parceiroNome:              "Digital Supply Ltda",
    parceiroCNPJ:              "12.345.678/0001-55",
    tipo:                      "Receita",
    tipoMovimento:             "Pedido de Venda",
    nroUnico:                  "100.804",
    parcela:                   "2/2",
    totalIBS:                  350.0,
    totalCBS:                  500.0,
    statusPagamentoAntecipado: "Pendente",
    statusCalculo:             "Não configurado",
    statusGeracaoNota:         "Não configurado",
    statusDFe:                 "Não enviado",
    nroNota:                   "NF-001601",
    desdob:                    "002/002",
    tipoOperacao:              "1.201 - Recebimento",
    dtEntradaSaida:            "05/08/2026",
    dtVencimento:              "05/10/2026",
    vlrDesdobramento:          10000.0,
    vlrDesconto:               0,
    vlrBaixa:                  10000.0,
    dataBaixa:                 "15/08/2026",
    documentoFiscal:           DOC_PV010,
    pedidoRef: {
      id:             "pv-010",
      numero:         "PV-010",
      dataNegociacao: "05/08/2026",
      empresa:        "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome:   "Digital Supply Ltda",
      parceiroCNPJ:   "12.345.678/0001-55",
      nroUnico:       "100.800",
      valor:          20000.0,
      tipoOperacao:   "1.001 - Pedido de Venda",
    },
  },

  // ── pa-003 — Indústria Nova, parcela 1/3, PA Confirmado, DFe Autorizado ──────
  {
    id:                        "pa-003",
    dataNegociacao:            "20/08/2026",
    empresa:                   "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod:                "001",
    parceiroNome:              "Indústria Nova Ltda",
    parceiroCNPJ:              "77.888.999/0001-66",
    tipo:                      "Receita",
    tipoMovimento:             "Pedido de Venda",
    nroUnico:                  "100.701",
    parcela:                   "1/3",
    totalIBS:                  1.05,
    totalCBS:                  1.50,
    statusPagamentoAntecipado: "Confirmado",
    statusCalculo:             "Concluído",
    statusGeracaoNota:         "Confirmada",
    statusDFe:                 "Autorizado",
    nroNota:                   "NF-000601",
    desdob:                    "001/003",
    tipoOperacao:              "1.201 - Recebimento",
    dtEntradaSaida:            "20/08/2026",
    dtVencimento:              "06/09/2026",
    vlrDesdobramento:          30.0,
    vlrDesconto:               0,
    vlrBaixa:                  30.0,
    dataBaixa:                 "20/08/2026",
    documentoFiscal:           DOC_PV005,
    pedidoRef: {
      id:             "pv-005",
      numero:         "PV-005",
      dataNegociacao: "20/08/2026",
      empresa:        "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome:   "Indústria Nova Ltda",
      parceiroCNPJ:   "77.888.999/0001-66",
      nroUnico:       "100.700",
      valor:          90.0,
      tipoOperacao:   "1.001 - Pedido de Venda",
    },
    notaDebito: {
      dataNegociacao: "21/08/2026",
      nroUnico:       "100.710",
      nroNota:        "ND-0701",
      chaveDFe:       "35260801234567890001550010000007011234560701",
      chaveDFeOrigem: "35260801234567890001550010000006011234560601",
      statusDFe:      "Autorizado",
    },
  },

  // ── pa-004 — Indústria Nova, parcela 2/3, PA Confirmado, Nota Processando ────
  {
    id:                        "pa-004",
    dataNegociacao:            "20/08/2026",
    empresa:                   "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod:                "001",
    parceiroNome:              "Indústria Nova Ltda",
    parceiroCNPJ:              "77.888.999/0001-66",
    tipo:                      "Receita",
    tipoMovimento:             "Pedido de Venda",
    nroUnico:                  "100.702",
    parcela:                   "2/3",
    totalIBS:                  1.05,
    totalCBS:                  1.50,
    statusPagamentoAntecipado: "Confirmado",
    statusCalculo:             "Concluído",
    statusGeracaoNota:         "Processando",
    statusDFe:                 "Não enviado",
    nroNota:                   "NF-000601",
    desdob:                    "002/003",
    tipoOperacao:              "1.201 - Recebimento",
    dtEntradaSaida:            "20/08/2026",
    dtVencimento:              "27/09/2026",
    vlrDesdobramento:          30.0,
    vlrDesconto:               0,
    vlrBaixa:                  30.0,
    dataBaixa:                 "27/08/2026",
    documentoFiscal:           DOC_PV005,
    pedidoRef: {
      id:             "pv-005",
      numero:         "PV-005",
      dataNegociacao: "20/08/2026",
      empresa:        "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome:   "Indústria Nova Ltda",
      parceiroCNPJ:   "77.888.999/0001-66",
      nroUnico:       "100.700",
      valor:          90.0,
      tipoOperacao:   "1.001 - Pedido de Venda",
    },
  },

  // ── pa-005 — Grupo Nexus, parcela 1/4, PA Pendente ───────────────────────────
  {
    id:                        "pa-005",
    dataNegociacao:            "01/09/2026",
    empresa:                   "002 - Sankhya São Paulo S.A.",
    empresaCod:                "002",
    parceiroNome:              "Grupo Nexus S.A.",
    parceiroCNPJ:              "22.333.444/0001-77",
    tipo:                      "Receita",
    tipoMovimento:             "Pedido de Venda",
    nroUnico:                  "100.901",
    parcela:                   "1/4",
    totalIBS:                  131.25,
    totalCBS:                  187.50,
    statusPagamentoAntecipado: "Pendente",
    statusCalculo:             "Não configurado",
    statusGeracaoNota:         "Não configurado",
    statusDFe:                 "Não enviado",
    nroNota:                   "NF-002501",
    desdob:                    "001/004",
    tipoOperacao:              "1.201 - Recebimento",
    dtEntradaSaida:            "01/09/2026",
    dtVencimento:              "01/10/2026",
    vlrDesdobramento:          3750.0,
    vlrDesconto:               0,
    vlrBaixa:                  3750.0,
    dataBaixa:                 "01/09/2026",
    documentoFiscal:           DOC_PV015,
    pedidoRef: {
      id:             "pv-015",
      numero:         "PV-015",
      dataNegociacao: "01/09/2026",
      empresa:        "002 - Sankhya São Paulo S.A.",
      parceiroNome:   "Grupo Nexus S.A.",
      parceiroCNPJ:   "22.333.444/0001-77",
      nroUnico:       "100.900",
      valor:          15000.0,
      tipoOperacao:   "1.001 - Pedido de Venda",
    },
  },

  // ── pa-006 — Comércio Leste, parcela 1/1, PA Confirmado, Cálculo Erro ────────
  {
    id:                        "pa-006",
    dataNegociacao:            "05/09/2026",
    empresa:                   "001 - Sankhya Gestão de Negócios Ltda",
    empresaCod:                "001",
    parceiroNome:              "Comércio Leste Ltda",
    parceiroCNPJ:              "55.666.777/0001-88",
    tipo:                      "Receita",
    tipoMovimento:             "Venda",
    nroUnico:                  "100.902",
    parcela:                   "1/1",
    totalIBS:                  175.0,
    totalCBS:                  250.0,
    statusPagamentoAntecipado: "Confirmado",
    statusCalculo:             "Erro",
    statusGeracaoNota:         "Pendente",
    statusDFe:                 "Não enviado",
    nroNota:                   "NF-003001",
    desdob:                    "001/001",
    tipoOperacao:              "1.101 - Recebimento",
    dtEntradaSaida:            "05/09/2026",
    dtVencimento:              "05/09/2026",
    vlrDesdobramento:          5000.0,
    vlrDesconto:               0,
    vlrBaixa:                  5000.0,
    dataBaixa:                 "05/09/2026",
    documentoFiscal:           DOC_PV020,
    pedidoRef: {
      id:             "pv-020",
      numero:         "PV-020",
      dataNegociacao: "05/09/2026",
      empresa:        "001 - Sankhya Gestão de Negócios Ltda",
      parceiroNome:   "Comércio Leste Ltda",
      parceiroCNPJ:   "55.666.777/0001-88",
      nroUnico:       "100.950",
      valor:          5000.0,
      tipoOperacao:   "1.001 - Pedido de Venda",
    },
  },

  // ── pa-007 — Transportes Sul, parcela 3/3, PA Confirmado, DFe Aguardando ─────
  {
    id:                        "pa-007",
    dataNegociacao:            "08/09/2026",
    empresa:                   "003 - Distribuidora Norte Ltda",
    empresaCod:                "003",
    parceiroNome:              "Transportes Sul S.A.",
    parceiroCNPJ:              "33.444.555/0001-99",
    tipo:                      "Receita",
    tipoMovimento:             "Venda",
    nroUnico:                  "100.903",
    parcela:                   "3/3",
    totalIBS:                  140.0,
    totalCBS:                  200.0,
    statusPagamentoAntecipado: "Confirmado",
    statusCalculo:             "Concluído",
    statusGeracaoNota:         "Confirmada",
    statusDFe:                 "Aguardando autorização",
    nroNota:                   "NF-004501",
    desdob:                    "003/003",
    tipoOperacao:              "1.101 - Recebimento",
    dtEntradaSaida:            "08/09/2026",
    dtVencimento:              "08/09/2026",
    vlrDesdobramento:          4000.0,
    vlrDesconto:               0,
    vlrBaixa:                  4000.0,
    dataBaixa:                 "08/09/2026",
    documentoFiscal:           DOC_PV025,
    pedidoRef: {
      id:             "pv-025",
      numero:         "PV-025",
      dataNegociacao: "08/09/2026",
      empresa:        "003 - Distribuidora Norte Ltda",
      parceiroNome:   "Transportes Sul S.A.",
      parceiroCNPJ:   "33.444.555/0001-99",
      nroUnico:       "100.970",
      valor:          12000.0,
      tipoOperacao:   "1.001 - Pedido de Venda",
    },
    notaDebito: {
      dataNegociacao: "09/09/2026",
      nroUnico:       "100.975",
      nroNota:        "ND-004502",
      chaveDFeOrigem: "35260903344455500199550010000045011000045011",
      statusDFe:      "Aguardando autorização",
    },
  },

  // ── pa-008 — Atacado Central, PRT0005: baixado sem documento fiscal ───────────
  {
    id:                        "pa-008",
    dataNegociacao:            "03/09/2026",
    empresa:                   "002 - Sankhya São Paulo S.A.",
    empresaCod:                "002",
    parceiroNome:              "Atacado Central Ltda",
    parceiroCNPJ:              "88.999.111/0001-22",
    tipo:                      "Receita",
    tipoMovimento:             "Pedido de Venda",
    nroUnico:                  "100.955",
    parcela:                   "1/1",
    totalIBS:                  0,
    totalCBS:                  0,
    statusPagamentoAntecipado: "Pendente",
    statusCalculo:             "Não configurado",
    statusGeracaoNota:         "Não configurado",
    statusDFe:                 "Não enviado",
    nroNota:                   "—",
    desdob:                    "001/001",
    tipoOperacao:              "1.201 - Recebimento",
    dtEntradaSaida:            "03/09/2026",
    dtVencimento:              "03/10/2026",
    vlrDesdobramento:          8000.0,
    vlrDesconto:               0,
    vlrBaixa:                  8000.0,
    dataBaixa:                 "09/09/2026",
    pedidoRef: {
      id:             "pv-030",
      numero:         "PV-030",
      dataNegociacao: "03/09/2026",
      empresa:        "002 - Sankhya São Paulo S.A.",
      parceiroNome:   "Atacado Central Ltda",
      parceiroCNPJ:   "88.999.111/0001-22",
      nroUnico:       "101.000",
      valor:          8000.0,
      tipoOperacao:   "1.001 - Pedido de Venda",
    },
  },

  // ── pa-009 — Atacado Central, PRT0006: doc referenciado sem finalidade Normal ─
  {
    id:                          "pa-009",
    dataNegociacao:              "05/09/2026",
    empresa:                     "002 - Sankhya São Paulo S.A.",
    empresaCod:                  "002",
    parceiroNome:                "Atacado Central Ltda",
    parceiroCNPJ:                "88.999.111/0001-22",
    tipo:                        "Receita",
    tipoMovimento:               "Pedido de Venda",
    nroUnico:                    "100.956",
    parcela:                     "1/1",
    totalIBS:                    280.0,
    totalCBS:                    400.0,
    statusPagamentoAntecipado:   "Confirmado",
    statusCalculo:               "Concluído",
    statusGeracaoNota:           "Confirmada",
    statusDFe:                   "Autorizado",
    nroNota:                     "NF-005001",
    desdob:                      "001/001",
    tipoOperacao:                "1.201 - Recebimento",
    dtEntradaSaida:              "05/09/2026",
    dtVencimento:                "05/10/2026",
    vlrDesdobramento:            8000.0,
    vlrDesconto:                 0,
    vlrBaixa:                    8000.0,
    dataBaixa:                   "10/09/2026",
    documentoFiscal:             DOC_PV030,
    pedidoRef: {
      id:             "pv-031",
      numero:         "PV-031",
      dataNegociacao: "05/09/2026",
      empresa:        "002 - Sankhya São Paulo S.A.",
      parceiroNome:   "Atacado Central Ltda",
      parceiroCNPJ:   "88.999.111/0001-22",
      nroUnico:       "101.001",
      valor:          8000.0,
      tipoOperacao:   "1.001 - Pedido de Venda",
      pendencia:      true,
    },
    notaDebito: {
      dataNegociacao: "11/09/2026",
      nroUnico:       "101.010",
      nroNota:        "ND-031",
      chaveDFe:       "35260902899911100122550010000000311000000311",
      chaveDFeOrigem: "35260902899911100122550010000050011000050011",
      statusDFe:      "Autorizado",
    },
  },
];

export const MOCK_PAGAMENTO_ANTECIPADO = MOCK;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function parseDate(date: string): Date {
  const [d, m, y] = date.split("/");
  return new Date(Number(y), Number(m) - 1, Number(d));
}

// ─── Badge Components ─────────────────────────────────────────────────────────

function BadgeCalculo({ status }: { status: StatusCalculo }) {
  const cls =
    status === "Concluído"       ? "border-green-300 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/40" :
    status === "Processando"     ? "border-blue-300 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40" :
    status === "Erro"            ? "border-red-300 text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/40" :
    status === "Não configurado" ? "border-orange-300 text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/40" :
                                   "border-gray-300 text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/40";
  return <Badge variant="outline" className={cn("text-[11px] whitespace-nowrap", cls)}>{status}</Badge>;
}

function BadgeGeracao({ status }: { status: StatusGeracaoNota }) {
  const cls =
    status === "Confirmada"      ? "border-green-300 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/40" :
    status === "Processando"     ? "border-blue-300 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40" :
    status === "Erro"            ? "border-red-300 text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/40" :
    status === "Não configurado" ? "border-orange-300 text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/40" :
                                   "border-gray-300 text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/40";
  return <Badge variant="outline" className={cn("text-[11px] whitespace-nowrap", cls)}>{status}</Badge>;
}

function BadgeDFe({ status }: { status: StatusDFe }) {
  const cls =
    status === "Autorizado"             ? "border-green-300 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/40" :
    status === "Aguardando autorização" ? "border-blue-300 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40" :
    status === "Erro"                   ? "border-red-300 text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/40" :
    status === "Denegado"               ? "border-red-300 text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/40" :
    status === "Cancelado"              ? "border-gray-400 text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800/40" :
                                          "border-gray-300 text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/40";
  return <Badge variant="outline" className={cn("text-[11px] whitespace-nowrap", cls)}>{status}</Badge>;
}

function BadgePagamentoAntecipado({ status }: { status: StatusPagamentoAntecipado }) {
  const cls =
    status === "Confirmado" ? "border-green-300 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/40" :
                              "border-amber-300 text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40";
  return <Badge variant="outline" className={cn("text-[11px] whitespace-nowrap", cls)}>{status}</Badge>;
}

// ─── Display Primitives ───────────────────────────────────────────────────────

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

function ibsValue(v: number, statusGeracao: StatusGeracaoNota) {
  return statusGeracao === "Confirmada" ? brl(v) : "—";
}

function PendenciaIcon({ pendencias }: { pendencias: PendenciaPA[] }) {
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

function SyncBadge({ label, date }: { label: string; date: string }) {
  return (
    <div className="relative group inline-flex">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 cursor-default dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
        ✓ {label}: {date}
      </span>
      <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block z-20 pointer-events-none">
        <div className="bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[11px] px-2.5 py-1.5 rounded-md shadow-md border border-amber-200 dark:border-amber-700 whitespace-nowrap">
          <span className="font-semibold">Dev:</span> O job só executa se houver registros novos. Remover este tooltip na versão do cliente.
        </div>
      </div>
    </div>
  );
}

function DevTooltip({ children, hint }: { children: React.ReactNode; hint: string }) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-20 pointer-events-none">
        <div className="bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[11px] px-2.5 py-1.5 rounded-md shadow-md border border-amber-200 dark:border-amber-700 max-w-[300px] leading-relaxed">
          <span className="font-semibold">Dev:</span> {hint}
        </div>
      </div>
    </div>
  );
}

// ─── Confirmation Modals ──────────────────────────────────────────────────────

function ConfirmLoteModal({
  records,
  onConfirm,
  onCancel,
}: {
  records: PagamentoAntecipadoReceita[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-xl border w-full max-w-[580px] p-6 space-y-4">
        <h2 className="text-[16px] font-semibold flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
          Confirmar Pagamento Antecipado ({records.length} título{records.length !== 1 ? "s" : ""})
        </h2>
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-3 text-[13px] text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Ao confirmar, os <strong>{records.length} títulos</strong> selecionados serão classificados como
            pagamento antecipado e o cálculo de rateio e geração da nota de débito serão habilitados.
          </span>
        </div>
        <div className="rounded-lg border overflow-hidden max-h-[240px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[12px]">Nro Único</TableHead>
                <TableHead className="text-[12px] text-center">Parcela</TableHead>
                <TableHead className="text-[12px]">Parceiro</TableHead>
                <TableHead className="text-[12px] text-right">Vlr Desdobramento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id} className="text-[13px]">
                  <TableCell className="font-mono">{r.nroUnico}</TableCell>
                  <TableCell className="font-mono text-center">{r.parcela}</TableCell>
                  <TableCell>{r.parceiroNome}</TableCell>
                  <TableCell className="text-right font-mono">{brl(r.vlrDesdobramento)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button size="sm" className="gap-1.5" onClick={onConfirm}>
            <BadgeCheck className="h-3.5 w-3.5" />
            Confirmar {records.length} título{records.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConfirmPAModal({
  record,
  onConfirm,
  onCancel,
}: {
  record: PagamentoAntecipadoReceita;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-xl border w-full max-w-[500px] p-6 space-y-4">
        <h2 className="text-[16px] font-semibold flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
          Confirmar Pagamento Antecipado
        </h2>
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-3 text-[13px] text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Ao confirmar, este título será classificado como pagamento antecipado e o cálculo de rateio
            e geração da nota de débito serão habilitados e iniciados automaticamente.
          </span>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
            <div>
              <span className="text-muted-foreground text-[11px] block">Nro Único</span>
              <span className="font-mono font-medium">{record.nroUnico}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px] block">Parcela</span>
              <span className="font-mono font-medium">{record.parcela}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px] block">Parceiro</span>
              <span className="font-medium">{record.parceiroNome}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px] block">Vlr Desdobramento</span>
              <span className="font-mono font-medium">{brl(record.vlrDesdobramento)}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px] block">Pedido</span>
              <span className="font-mono font-medium">{record.pedidoRef.numero}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px] block">Dt. Baixa</span>
              <span className="font-mono font-medium">{record.dataBaixa}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button size="sm" className="gap-1.5" onClick={onConfirm}>
            <BadgeCheck className="h-3.5 w-3.5" />
            Confirmar como Pagamento Antecipado
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type View = "list" | "detail";

export default function MovimentacoesReceitasPagamentoAntecipado() {
  const location = useLocation();
  const [view, setView]           = useState<View>("list");
  const [selected, setSelected]   = useState<PagamentoAntecipadoReceita | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<PagamentoAntecipadoReceita | null>(null);

  const [filtroEmpresa, setFiltroEmpresa]         = useState("");
  const [filtroDe, setFiltroDe]                   = useState("");
  const [filtroAte, setFiltroAte]                 = useState("");
  const [filtroPA, setFiltroPA]                   = useState("");
  const [filtroCalculo, setFiltroCalculo]         = useState("");
  const [filtroGeracao, setFiltroGeracao]         = useState("");
  const [filtroDFe, setFiltroDFe]                 = useState("");
  const [filtroTipoMovimento, setFiltroTipoMovimento] = useState("");
  const [filtroNroUnico, setFiltroNroUnico]       = useState("");
  const [refreshing, setRefreshing]               = useState(false);
  const [mockOverrides, setMockOverrides]         = useState<Record<string, Partial<PagamentoAntecipadoReceita>>>({});
  const [selectedIds, setSelectedIds]             = useState<Set<string>>(new Set());
  const [showLoteModal, setShowLoteModal]         = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const openConfirm = (r: PagamentoAntecipadoReceita) => setConfirmTarget(r);
  const closeConfirm = () => setConfirmTarget(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirmar = () => {
    if (!confirmTarget) return;
    const id = confirmTarget.id;
    setMockOverrides((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        statusPagamentoAntecipado: "Confirmado",
        statusCalculo: "Pendente",
        statusGeracaoNota: "Pendente",
      },
    }));
    if (selected?.id === id) {
      setSelected((s) =>
        s ? { ...s, statusPagamentoAntecipado: "Confirmado", statusCalculo: "Pendente", statusGeracaoNota: "Pendente" } : s
      );
    }
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    closeConfirm();
  };

  const handleConfirmarLote = () => {
    setMockOverrides((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        next[id] = {
          ...next[id],
          statusPagamentoAntecipado: "Confirmado",
          statusCalculo: "Pendente",
          statusGeracaoNota: "Pendente",
        };
      });
      return next;
    });
    setSelectedIds(new Set());
    setShowLoteModal(false);
  };

  const handleReprocessar = (id: string) => {
    const base = MOCK.find((m) => m.id === id)!;
    setMockOverrides((prev) => ({ ...prev, [id]: { ...prev[id], statusCalculo: "Processando" } }));
    setTimeout(() => {
      setMockOverrides((prev) => {
        const current = { ...base, ...prev[id] };
        const notaDebito: NotaDebito = current.notaDebito
          ? { ...current.notaDebito, statusDFe: "Não enviado" }
          : {
              dataNegociacao: new Date().toLocaleDateString("pt-BR"),
              nroUnico: `100.${parseInt(base.nroUnico.replace(".", "")) + 10}`,
              nroNota: `ND-${base.id.toUpperCase()}`,
              chaveDFeOrigem: base.documentoFiscal?.chaveDFe ?? "",
              statusDFe: "Não enviado",
            };
        return {
          ...prev,
          [id]: {
            ...prev[id],
            statusCalculo: "Concluído",
            statusGeracaoNota: "Confirmada",
            notaDebito,
          },
        };
      });
    }, 2000);
  };

  useEffect(() => {
    const state = location.state as { openNroUnico?: string; filterNroUnico?: string } | null;
    if (state?.openNroUnico) {
      const record = MOCK.find((r) => r.nroUnico === state.openNroUnico);
      if (record) { setSelected(record); setView("detail"); }
    } else if (state?.filterNroUnico) {
      setFiltroNroUnico(state.filterNroUnico);
    }
  }, [location.state]);

  const hasFilter = filtroEmpresa !== "" || filtroDe !== "" || filtroAte !== "" ||
    filtroPA !== "" || filtroCalculo !== "" || filtroGeracao !== "" ||
    filtroDFe !== "" || filtroTipoMovimento !== "" || filtroNroUnico !== "";

  const rows = useMemo(() => {
    const de = filtroDe ? new Date(filtroDe) : null;
    const ate = filtroAte ? new Date(filtroAte) : null;
    return MOCK.map((r) => ({ ...r, ...mockOverrides[r.id] } as PagamentoAntecipadoReceita)).filter((r) => {
      const byEmpresa = !filtroEmpresa || r.empresaCod === filtroEmpresa;
      const dt = parseDate(r.dataBaixa);
      const byDe = !de || dt >= de;
      const byAte = !ate || dt <= ate;
      const byPA = !filtroPA || r.statusPagamentoAntecipado === filtroPA;
      const byCalculo = !filtroCalculo || r.statusCalculo === filtroCalculo;
      const byGeracao = !filtroGeracao || r.statusGeracaoNota === filtroGeracao;
      const byDFe = !filtroDFe || r.statusDFe === filtroDFe;
      const byTipo = !filtroTipoMovimento || r.tipoMovimento === filtroTipoMovimento;
      const byNroUnico = !filtroNroUnico || r.nroUnico === filtroNroUnico;
      return byEmpresa && byDe && byAte && byPA && byCalculo && byGeracao && byDFe && byTipo && byNroUnico;
    });
  }, [filtroEmpresa, filtroDe, filtroAte, filtroPA, filtroCalculo, filtroGeracao, filtroDFe, filtroTipoMovimento, filtroNroUnico, mockOverrides]);

  if (view === "detail" && selected) {
    return (
      <>
        {confirmTarget && (
          <ConfirmPAModal
            record={confirmTarget}
            onConfirm={handleConfirmar}
            onCancel={closeConfirm}
          />
        )}
        <PagamentoAntecipadoDetailView
          record={{ ...selected, ...mockOverrides[selected.id] } as PagamentoAntecipadoReceita}
          onBack={() => { setView("list"); setSelected(null); }}
          onConfirmarPA={() => openConfirm({ ...selected, ...mockOverrides[selected.id] } as PagamentoAntecipadoReceita)}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Modals */}
      {confirmTarget && (
        <ConfirmPAModal
          record={confirmTarget}
          onConfirm={handleConfirmar}
          onCancel={closeConfirm}
        />
      )}
      {showLoteModal && (
        <ConfirmLoteModal
          records={rows.filter((r) => selectedIds.has(r.id))}
          onConfirm={handleConfirmarLote}
          onCancel={() => setShowLoteModal(false)}
        />
      )}

      {/* Page header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-1">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Movimentações</span>
          <ChevronRight className="h-3 w-3" />
          <span>Receitas</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Pagamento Antecipado</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-semibold">Receitas — Pagamento Antecipado</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Títulos baixados vinculados a pedidos sem nota de fornecimento emitida · a partir de 01/01/2026
            </p>
          </div>
          <SyncBadge label="Sincronizado" date="11/09/2026 08:14:32" />
        </div>
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

          {/* Pagamento Antecipado */}
          <Select value={filtroPA} onValueChange={setFiltroPA}>
            <SelectTrigger className="w-[200px] h-8 text-[13px]">
              <SelectValue placeholder="Pagamento Antecipado" />
            </SelectTrigger>
            <SelectContent>
              {(["Pendente", "Confirmado"] as StatusPagamentoAntecipado[]).map((s) => (
                <SelectItem key={s} value={s} className="text-[13px]">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Cálculo */}
          <Select value={filtroCalculo} onValueChange={setFiltroCalculo}>
            <SelectTrigger className="w-[155px] h-8 text-[13px]">
              <SelectValue placeholder="Cálculo de Rateio" />
            </SelectTrigger>
            <SelectContent>
              {(["Não configurado", "Pendente", "Processando", "Concluído", "Erro"] as StatusCalculo[]).map((s) => (
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
              {(["Não configurado", "Pendente", "Processando", "Confirmada", "Erro"] as StatusGeracaoNota[]).map((s) => (
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
              {(["Não enviado", "Aguardando autorização", "Erro", "Autorizado", "Cancelado", "Denegado"] as StatusDFe[]).map((s) => (
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
                setFiltroEmpresa(""); setFiltroDe(""); setFiltroAte(""); setFiltroPA("");
                setFiltroCalculo(""); setFiltroGeracao(""); setFiltroDFe("");
                setFiltroTipoMovimento(""); setFiltroNroUnico("");
              }}
              className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                className="gap-1.5 h-8 text-[12px]"
                onClick={() => setShowLoteModal(true)}
              >
                <BadgeCheck className="h-3.5 w-3.5" />
                Confirmar Pagamento Antecipado ({selectedIds.size})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              {refreshing ? "Atualizando…" : "Atualizar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Chip: filtro por nº único vindo de Alertas */}
      {filtroNroUnico && (
        <div className="px-6 py-2 border-b bg-primary/5 flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">Filtrado por:</span>
          <span className="inline-flex items-center gap-1 text-[12px] font-medium bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
            Nº único: {filtroNroUnico}
            <button onClick={() => setFiltroNroUnico("")} className="hover:text-destructive ml-0.5 leading-none">
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

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
                    <TableHead className="text-[12px]">Dt. Baixa</TableHead>
                    <TableHead className="text-[12px]">Empresa</TableHead>
                    <TableHead className="text-[12px]">Parceiro</TableHead>
                    <TableHead className="text-[12px]">Tipo de Movimento</TableHead>
                    <TableHead className="text-[12px]">Nro Único</TableHead>
                    <TableHead className="text-[12px]">Pagamento Antecipado</TableHead>
                    <TableHead className="text-[12px]">Cálculo de Rateio</TableHead>
                    <TableHead className="text-[12px]">Geração da Nota</TableHead>
                    <TableHead className="text-[12px]">Status DFe</TableHead>
                    <TableHead className="text-[12px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow
                      key={r.id}
                      onClick={() => r.statusPagamentoAntecipado === "Pendente" && toggleSelect(r.id)}
                      className={cn(
                        "text-[13px]",
                        r.statusPagamentoAntecipado === "Pendente" ? "cursor-pointer hover:bg-primary/5" : "hover:bg-muted/40",
                        selectedIds.has(r.id) && "bg-primary/5"
                      )}
                    >
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <PendenciaIcon pendencias={getPagamentoAntecipadoPendencias(r)} />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[12px]">{r.dataBaixa}</TableCell>
                      <TableCell>{r.empresa}</TableCell>
                      <TableCell>
                        <div>{r.parceiroNome}</div>
                        <div className="text-[11px] text-muted-foreground">{r.parceiroCNPJ}</div>
                      </TableCell>
                      <TableCell className="text-[13px] font-medium">{r.tipoMovimento}</TableCell>
                      <TableCell className="font-mono">{r.nroUnico}</TableCell>
                      <TableCell><BadgePagamentoAntecipado status={r.statusPagamentoAntecipado} /></TableCell>
                      <TableCell>
                        {r.statusPagamentoAntecipado === "Confirmado"
                          ? <BadgeCalculo status={r.statusCalculo} />
                          : <span className="text-[12px] text-muted-foreground">—</span>
                        }
                      </TableCell>
                      <TableCell>
                        {r.statusPagamentoAntecipado === "Confirmado"
                          ? <BadgeGeracao status={r.statusGeracaoNota} />
                          : <span className="text-[12px] text-muted-foreground">—</span>
                        }
                      </TableCell>
                      <TableCell><BadgeDFe status={r.statusDFe} /></TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {r.statusPagamentoAntecipado === "Pendente" && (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-[12px] gap-1"
                              onClick={() => openConfirm(r)}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Gerar nota
                            </Button>
                          )}
                          {r.statusPagamentoAntecipado === "Confirmado" &&
                            r.statusCalculo !== "Não configurado" &&
                            !isDFeDefinitivo(r.statusDFe) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[12px] gap-1"
                              disabled={r.statusCalculo === "Processando"}
                              onClick={() => handleReprocessar(r.id)}
                            >
                              <RefreshCw className={cn("h-3.5 w-3.5", r.statusCalculo === "Processando" && "animate-spin")} />
                              Reprocessar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[12px] gap-1"
                            onClick={() => { setSelected(r); setView("detail"); }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Detalhar
                          </Button>
                        </div>
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

// ─── Pagamento Antecipado Detail View ─────────────────────────────────────────

function PagamentoAntecipadoDetailView({
  record: r,
  onBack,
  onConfirmarPA,
}: {
  record: PagamentoAntecipadoReceita;
  onBack: () => void;
  onConfirmarPA: () => void;
}) {
  const navigate = useNavigate();
  const isConfirmado = r.statusPagamentoAntecipado === "Confirmado";
  const showGerar    = isConfirmado && r.statusGeracaoNota === "Confirmada" && r.statusDFe === "Não enviado";

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
            <span>Pagamento Antecipado</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium truncate">Nro Único {r.nroUnico}</span>
          </div>
          <h1 className="text-[16px] font-semibold">Detalhamento — Pagamento Antecipado</h1>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
          {!isConfirmado && (
            <DevTooltip hint="Classifica o título como pagamento antecipado e habilita o cálculo de rateio e geração da nota de débito. Remover este tooltip na versão do cliente.">
              <Button variant="default" size="sm" className="h-8 text-[12px] gap-1.5" onClick={onConfirmarPA}>
                <FileText className="h-3.5 w-3.5" />
                Gerar nota
              </Button>
            </DevTooltip>
          )}
          {showGerar && (
            <DevTooltip hint="Abre Central de Vendas filtrada pela nota e Status NFe = 'Não enviado'. Remover este tooltip na versão do cliente.">
              <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Transmitir DFe
              </Button>
            </DevTooltip>
          )}
          <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Central de Vendas
          </Button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-6">

        {/* Alertas de pendência */}
        {getPagamentoAntecipadoPendencias(r).map((p) => (
          <div key={p.codigo} className="flex items-center gap-2.5 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-2.5 text-[13px] text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span><strong>{p.codigo}</strong> — {p.descricao}</span>
          </div>
        ))}

        {/* Status do processo */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Pagamento Antecipado</span>
            <BadgePagamentoAntecipado status={r.statusPagamentoAntecipado} />
          </div>
          {isConfirmado && (
            <>
              <div className="h-px w-4 bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground">Cálculo de Rateio</span>
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
            </>
          )}
        </div>

        {/* Resumo do Título */}
        <CollapsibleSection title="Resumo do Título">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Dt. Negociação"  value={r.dataNegociacao} mono />
            <SummaryCard label="Empresa"          value={r.empresa}            />
            <SummaryCard label="Parceiro"         value={r.parceiroNome}       />
            <SummaryCard
              label="Tipo"
              value={r.tipo}
              colorClass="text-blue-700 dark:text-blue-400"
            />
            <SummaryCard label="Nro Único"        value={r.nroUnico}      mono />
            <SummaryCard label="Parcela"          value={r.parcela}       mono />
            <SummaryCard label="Vlr Desdobramento" value={brl(r.vlrDesdobramento)} mono />
            <SummaryCard
              label="Pagamento Antecipado"
              value={r.statusPagamentoAntecipado}
              colorClass={isConfirmado ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}
            />
            {isConfirmado && (
              <>
                <SummaryCard
                  label="IBS Calculado"
                  value={ibsValue(r.totalIBS, r.statusGeracaoNota)}
                  mono
                  colorClass={r.statusGeracaoNota !== "Confirmada" ? "text-muted-foreground" : undefined}
                />
                <SummaryCard
                  label="CBS Calculado"
                  value={ibsValue(r.totalCBS, r.statusGeracaoNota)}
                  mono
                  colorClass={r.statusGeracaoNota !== "Confirmada" ? "text-muted-foreground" : undefined}
                />
                <SummaryCard
                  label="Cálculo de Rateio"
                  value={r.statusCalculo}
                  colorClass={
                    r.statusCalculo === "Concluído"   ? "text-green-700 dark:text-green-400" :
                    r.statusCalculo === "Processando" ? "text-blue-700 dark:text-blue-400"   :
                    r.statusCalculo === "Erro"        ? "text-red-700 dark:text-red-400"     :
                                                       "text-muted-foreground"
                  }
                />
                <SummaryCard label="Geração da Nota" value={r.statusGeracaoNota} />
                <SummaryCard label="Status DFe"      value={r.statusDFe}         />
              </>
            )}
          </div>
        </CollapsibleSection>

        {/* Detalhes do Título — TGFFIN */}
        <CollapsibleSection title="Detalhes do Título">
          <div className="rounded-lg border bg-card p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-4">
              <DetailField label="Nro Nota"           value={r.nroNota}               mono />
              <DetailField label="Desdobramento"      value={r.desdob}                mono />
              <DetailField label="Tipo Operação"      value={r.tipoOperacao}               />
              <DetailField label="Dt. Negociação"     value={r.dataNegociacao}        mono />
              <DetailField label="Dt. Entrada/Saída"  value={r.dtEntradaSaida}        mono />
              <DetailField label="Dt. Vencimento"     value={r.dtVencimento}          mono />
              <DetailField label="Vlr Desdobramento"  value={brl(r.vlrDesdobramento)} mono />
              <DetailField label="Vlr Desconto"       value={brl(r.vlrDesconto)}      mono />
              <DetailField label="Vlr Baixa"          value={brl(r.vlrBaixa)}         mono />
              <DetailField label="Data Baixa"         value={r.dataBaixa}             mono />
            </div>
          </div>
        </CollapsibleSection>

        {/* Pedido do Título */}
        <CollapsibleSection title="Pedido do Título">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-[12px] text-center w-10">Pendências</TableHead>
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
                  <TableCell className="text-center w-10">
                    <div className="flex justify-center">
                      {(getPagamentoAntecipadoPendencias(r).length > 0 || r.pedidoRef.pendencia)
                        ? <AlertTriangle className="h-4 w-4 text-amber-500" title="PRT0001: Títulos com pendências" />
                        : <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Sem pendências" />}
                    </div>
                  </TableCell>
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
                          state: { openNroUnico: r.pedidoRef.id },
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

        {/* Nota de Débito */}
        {r.statusGeracaoNota === "Confirmada" && r.notaDebito && (
          <CollapsibleSection title="Nota de Débito">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[12px] text-center w-10">Pendências</TableHead>
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
                    <TableCell className="text-center w-10"><div className="flex justify-center">{["Autorizado","Cancelado","Denegado"].includes(r.notaDebito.statusDFe) ? <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Sem pendências" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}</div></TableCell>
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
            <SummaryCard label="Número"            value={d.numero}          mono />
            <SummaryCard label="Valor"             value={brl(d.valor)}      mono />
            <SummaryCard label="CBS Calculado"     value={brl(d.totalCBS)}   mono />
            <SummaryCard label="IBS Calculado"     value={brl(d.totalIBS)}   mono />
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
                    <TableHead className="text-[12px] text-right">IBS</TableHead>
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
                      <TableCell className="text-right font-mono">{brl(t.totalIBS)}</TableCell>
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
