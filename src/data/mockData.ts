export interface Apuracao {
  id: string;
  periodo: string;
  cnpjRaiz: string;
  razaoSocial: string;
  situacao: "Em andamento" | "Concluído";
  tipoResultado: "Credor" | "Devedor" | "-";
  resultadoApuracao: string;
  saldoPagarAtual: string;
  alertas: number;
  ultimaConsulta: string;
}

export interface ContaApuracao {
  conta: string;
  valorCBS: string;
  status?: string;
  hasDetail?: boolean;
  hasAlert?: boolean;
}

export interface OutraInfo {
  label: string;
  valor: string;
  subItems?: { label: string; valor: string }[];
}

export const apuracoes: Apuracao[] = [
  {
    id: "1",
    periodo: "JUN/2026",
    cnpjRaiz: "12.345.678",
    razaoSocial: "Sankhya Tecnologia em Sistemas S.A.",
    situacao: "Em andamento",
    tipoResultado: "Devedor",
    resultadoApuracao: "R$ 750,00 D",
    saldoPagarAtual: "R$ 350,00",
    alertas: 0,
    ultimaConsulta: "14/04/2026 às 08:32",
  },
  {
    id: "2",
    periodo: "MAI/2026",
    cnpjRaiz: "12.345.678",
    razaoSocial: "Sankhya Tecnologia em Sistemas S.A.",
    situacao: "Em andamento",
    tipoResultado: "Credor",
    resultadoApuracao: "R$ 1.500,00 C",
    saldoPagarAtual: "R$ 0,00",
    alertas: 2,
    ultimaConsulta: "13/04/2026 às 14:15",
  },
  {
    id: "3",
    periodo: "ABR/2026",
    cnpjRaiz: "98.765.432",
    razaoSocial: "Distribuidora Nacional Ltda.",
    situacao: "Concluído",
    tipoResultado: "-",
    resultadoApuracao: "R$ 0,00",
    saldoPagarAtual: "R$ 0,00",
    alertas: 0,
    ultimaConsulta: "10/04/2026 às 09:00",
  },
  {
    id: "4",
    periodo: "MAR/2026",
    cnpjRaiz: "12.345.678",
    razaoSocial: "Sankhya Tecnologia em Sistemas S.A.",
    situacao: "Concluído",
    tipoResultado: "Devedor",
    resultadoApuracao: "R$ 420,00 D",
    saldoPagarAtual: "R$ 0,00",
    alertas: 0,
    ultimaConsulta: "05/03/2026 às 11:45",
  },
  {
    id: "5",
    periodo: "FEV/2026",
    cnpjRaiz: "98.765.432",
    razaoSocial: "Distribuidora Nacional Ltda.",
    situacao: "Concluído",
    tipoResultado: "Credor",
    resultadoApuracao: "R$ 800,00 C",
    saldoPagarAtual: "R$ 0,00",
    alertas: 0,
    ultimaConsulta: "02/02/2026 às 16:20",
  },
];

export const contasApuracao: ContaApuracao[] = [
  { conta: "Débitos processados", valorCBS: "R$ 750,00", status: "Processado", hasDetail: true },
  { conta: "Créditos de CBS apropriados", valorCBS: "R$ 1.500,00 C", hasDetail: true, hasAlert: true },
  { conta: "  Em apurações anteriores", valorCBS: "R$ 0,00" },
  { conta: "  Na apuração corrente", valorCBS: "R$ 1.500,00 C", hasDetail: true },
  { conta: "Pagamentos utilizados (PCONT)", valorCBS: "R$ 400,00", hasDetail: true },
  { conta: "Resultado da apuração", valorCBS: "R$ 750,00 D" },
];

export const outrasInfos: OutraInfo[] = [
  { label: "Débitos aguardando processamento", valor: "R$ 0,00" },
  { label: "Créditos possíveis", valor: "R$ 0,00" },
  {
    label: "Créditos não apropriados acumulados",
    valor: "R$ 1.500,00 C",
    subItems: [
      { label: "Créditos básicos (passíveis de RAD)", valor: "R$ 1.500,00 C" },
      { label: "Créditos presumidos", valor: "R$ 0,00" },
    ],
  },
  { label: "Pagamentos não utilizados", valor: "R$ 0,00" },
  { label: "Recolhimentos não utilizados", valor: "R$ 0,00" },
  { label: "Splits não utilizados", valor: "R$ 0,00" },
];

export const eventosApuracao = [
  { data: "03/06/2026 10:00:01", tipo: "Compra (RAD)", documento: "...579131", fornecedor: "00.394.460/0058-87", valor: "R$ 1.500,00", status: "Processado" },
  { data: "07/06/2026 10:00:01", tipo: "Venda", documento: "...329791", adquirente: "00.022.542/0001-65", valor: "R$ 500,00", status: "Processado" },
  { data: "08/06/2026 10:00:01", tipo: "Venda", documento: "...448023", adquirente: "00.022.542/0001-65", valor: "R$ 250,00", status: "Processado" },
];
