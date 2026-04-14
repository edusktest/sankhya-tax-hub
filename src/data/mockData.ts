export interface Apuracao {
  id: string;
  periodo: string;
  cnpjRaiz: string;
  situacao: "Em andamento" | "Concluído";
  tipoResultado: "Credor" | "Devedor" | "-";
  resultadoApuracao: string;
  saldoPagarAtual: string;
}

export interface ContaApuracao {
  conta: string;
  valorCBS: string;
  status?: string;
  hasDetail?: boolean;
}

export interface OutraInfo {
  label: string;
  valor: string;
  subItems?: { label: string; valor: string }[];
}

export const apuracoes: Apuracao[] = [
  {
    id: "1",
    periodo: "JUL/2025",
    cnpjRaiz: "12.345.678",
    situacao: "Em andamento",
    tipoResultado: "Devedor",
    resultadoApuracao: "R$ 750,00 D",
    saldoPagarAtual: "R$ 350,00",
  },
  {
    id: "2",
    periodo: "JUN/2025",
    cnpjRaiz: "12.345.678",
    situacao: "Concluído",
    tipoResultado: "Credor",
    resultadoApuracao: "R$ 1.500,00 C",
    saldoPagarAtual: "R$ 0,00",
  },
  {
    id: "3",
    periodo: "MAI/2025",
    cnpjRaiz: "98.765.432",
    situacao: "Concluído",
    tipoResultado: "-",
    resultadoApuracao: "R$ 0,00",
    saldoPagarAtual: "R$ 0,00",
  },
];

export const contasApuracao: ContaApuracao[] = [
  { conta: "Débitos processados", valorCBS: "R$ 750,00", status: "Processado", hasDetail: true },
  { conta: "Créditos de CBS apropriados", valorCBS: "R$ 1.500,00 C", hasDetail: true },
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
  { data: "03/07/2025 10:00:01", tipo: "Compra (RAD)", documento: "...579131", fornecedor: "00.394.460/0058-87", valor: "R$ 1.500,00", status: "Processado" },
  { data: "07/07/2025 10:00:01", tipo: "Venda", documento: "...329791", adquirente: "00.022.542/0001-65", valor: "R$ 500,00", status: "Processado" },
  { data: "08/07/2025 10:00:01", tipo: "Venda", documento: "...448023", adquirente: "00.022.542/0001-65", valor: "R$ 250,00", status: "Processado" },
];
