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
  ultimaDataApi: string; // data do último documento disponível na API
  consultaRealizada?: boolean; // false = não houve consulta na Apuração Assistida
}

export interface ContaApuracao {
  conta: string;
  valorCBS: string;
  status?: string;
  hasDetail?: boolean;
  hasAlert?: boolean;
  level?: number;
  expandable?: boolean;
  total?: boolean;
  enabled?: boolean;
  tone?: "debito" | "credito";
}

export interface OutraInfo {
  label: string;
  valor: string;
  subItems?: { label: string; valor: string }[];
}

export const apuracoes: Apuracao[] = [
  {
    id: "1",
    periodo: "NOV/2026",
    cnpjRaiz: "12.345.678",
    razaoSocial: "Sankhya Tecnologia em Sistemas S.A.",
    situacao: "Em andamento",
    tipoResultado: "Devedor",
    resultadoApuracao: "R$ 750,00 D",
    saldoPagarAtual: "R$ 750,00",
    alertas: 0,
    ultimaConsulta: "2026-11-17T08:32:07.418-03:00",
    ultimaDataApi: "2026-11-16T16:23:54.732-03:00",
  },
  {
    id: "2",
    periodo: "OUT/2026",
    cnpjRaiz: "12.345.678",
    razaoSocial: "Sankhya Tecnologia em Sistemas S.A.",
    situacao: "Concluído",
    tipoResultado: "-",
    resultadoApuracao: "R$ 0,00",
    saldoPagarAtual: "R$ 0,00",
    alertas: 0,
    ultimaConsulta: "",
    ultimaDataApi: "",
    consultaRealizada: false,
  },
];

export const contasApuracao: ContaApuracao[] = [
  { conta: "Débitos", valorCBS: "R$ 750,00", expandable: true, enabled: true },
  { conta: "Processados", valorCBS: "R$ 750,00", level: 1, hasDetail: true, enabled: true },
  { conta: "Provenientes de cancelamento ou outros eventos", valorCBS: "R$ 0,00", level: 1, hasDetail: true, enabled: true },
  { conta: "Redutores de débitos", valorCBS: "R$ 0,00", expandable: true, enabled: true },
  { conta: "Créditos de CBS apropriados", valorCBS: "R$ 0,00", expandable: true, enabled: true },
  { conta: "Redutores de créditos de CBS apropriados", valorCBS: "R$ 0,00", expandable: true, enabled: true },
  { conta: "Créditos da apuração anterior utilizados para extinguir débitos dessa apuração", valorCBS: "R$ 0,00", hasDetail: true, enabled: true },
  { conta: "Pagamentos utilizados", valorCBS: "R$ 0,00", expandable: true, hasDetail: true, enabled: true },
  { conta: "Resultado da apuração", valorCBS: "R$ 750,00 D", total: true, enabled: true },
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

export type SituacaoAssistida = "Débito" | "Crédito" | "Não encontrado" | "Consulta não realizada";

export interface DocumentoConciliacao {
  dtNegociacao: string;
  empresa: string;
  parceiro: string;
  cnpjParceiro: string;
  tipoMovimento: string;
  finalidade: string;
  nroUnico: string;
  numero: string;
  chaveDFe: string;
  valor: string;
  totalCBS: string;
  apuracaoAssistida: SituacaoAssistida;
}

export const documentosConciliacao: DocumentoConciliacao[] = [
  {
    dtNegociacao: "01/11/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    parceiro: "Grupo Nexus S.A.",
    cnpjParceiro: "23.456.789/0001-01",
    tipoMovimento: "Venda",
    finalidade: "Normal",
    nroUnico: "100.004",
    numero: "1234",
    chaveDFe: "35260123456789000100550010000012341234567890",
    valor: "R$ 11.300,00",
    totalCBS: "R$ 565,00",
    apuracaoAssistida: "Débito",
  },
  {
    dtNegociacao: "02/11/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    parceiro: "Comércio Leste Ltda",
    cnpjParceiro: "77.888.999/0001-55",
    tipoMovimento: "Venda",
    finalidade: "Normal",
    nroUnico: "200.020",
    numero: "2200",
    chaveDFe: "35260267890100000123550010000022001234567891",
    valor: "R$ 29.800,00",
    totalCBS: "R$ 1.490,00",
    apuracaoAssistida: "Débito",
  },
  {
    dtNegociacao: "02/11/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    parceiro: "Comércio Leste Ltda",
    cnpjParceiro: "77.888.999/0001-55",
    tipoMovimento: "Venda",
    finalidade: "Normal",
    nroUnico: "200.021",
    numero: "2200",
    chaveDFe: "35260267890100000123550010000022001234567891",
    valor: "R$ 29.800,00",
    totalCBS: "R$ 1.490,00",
    apuracaoAssistida: "Não encontrado",
  },
  {
    dtNegociacao: "03/11/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    parceiro: "Transportes Delta S.A.",
    cnpjParceiro: "22.333.444/0001-66",
    tipoMovimento: "Venda",
    finalidade: "Normal",
    nroUnico: "400.001",
    numero: "1400",
    chaveDFe: "35260123456789000100550010000014001234567901",
    valor: "R$ 12.000,00",
    totalCBS: "R$ 600,00",
    apuracaoAssistida: "Débito",
  },
  {
    dtNegociacao: "04/11/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    parceiro: "Tech Solutions Ltda",
    cnpjParceiro: "11.222.333/0001-44",
    tipoMovimento: "Venda",
    finalidade: "Normal",
    nroUnico: "500.001",
    numero: "5500",
    chaveDFe: "35260123456789000100550010000055001234567800",
    valor: "R$ 8.500,00",
    totalCBS: "R$ 425,00",
    apuracaoAssistida: "Débito",
  },
  {
    dtNegociacao: "05/11/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    parceiro: "Global Parts S.A.",
    cnpjParceiro: "55.666.777/0001-88",
    tipoMovimento: "Venda",
    finalidade: "Normal",
    nroUnico: "600.001",
    numero: "6601",
    chaveDFe: "35260267890100000123550010000066011234567810",
    valor: "R$ 15.000,00",
    totalCBS: "R$ 750,00",
    apuracaoAssistida: "Débito",
  },
  {
    dtNegociacao: "06/11/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    parceiro: "Distribuidora Beta S.A.",
    cnpjParceiro: "55.666.777/0001-88",
    tipoMovimento: "Compra",
    finalidade: "Normal",
    nroUnico: "500.005",
    numero: "5210",
    chaveDFe: "35260255666777000188550010000052101234567893",
    valor: "R$ 5.100,00",
    totalCBS: "R$ 255,00",
    apuracaoAssistida: "Crédito",
  },
  {
    dtNegociacao: "07/11/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    parceiro: "Materiais Omega S.A.",
    cnpjParceiro: "88.999.000/0001-33",
    tipoMovimento: "Compra",
    finalidade: "Normal",
    nroUnico: "600.020",
    numero: "6100",
    chaveDFe: "35260288999000000133550010000061001234567892",
    valor: "R$ 21.500,00",
    totalCBS: "R$ 1.075,00",
    apuracaoAssistida: "Crédito",
  },
  {
    dtNegociacao: "08/11/2026",
    empresa: "003 - Distribuidora Norte Ltda",
    parceiro: "Materiais Omega S.A.",
    cnpjParceiro: "88.999.000/0001-33",
    tipoMovimento: "Devolução de Compra",
    finalidade: "Devolução",
    nroUnico: "300.010",
    numero: "180",
    chaveDFe: "35260288999000000133550010000001801234567895",
    valor: "R$ 8.400,00",
    totalCBS: "R$ 420,00",
    apuracaoAssistida: "Não encontrado",
  },
];

export const contasEmProcessamento: ContaApuracao[] = [
  { conta: "Débitos aguardando processamento", valorCBS: "R$ 371.030,09 D", hasDetail: true, enabled: true, tone: "debito" },
  { conta: "Pendências de processamento", valorCBS: "", expandable: true, enabled: true },
  { conta: "Documentos fiscais aguardando DFe referenciados", valorCBS: "R$ 0,00", level: 1, hasDetail: true, enabled: false },
  { conta: "Documentos fiscais aguardando aceite", valorCBS: "R$ 0,00", level: 1, hasDetail: true, enabled: false },
  { conta: "Débitos de fatos geradores futuros", valorCBS: "R$ 0,00", hasDetail: true, enabled: false },
  { conta: "Créditos de fatos geradores futuros", valorCBS: "R$ 382,67 C", hasDetail: true, enabled: true, tone: "credito" },
];

// Documentos do EIP em OUT/2026: não houve consulta na Apuração Assistida nessa competência.
export const documentosConciliacaoOutubro: DocumentoConciliacao[] = [
  {
    dtNegociacao: "05/10/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    parceiro: "Indústria Central Ltda",
    cnpjParceiro: "44.555.666/0001-22",
    tipoMovimento: "Venda",
    finalidade: "Normal",
    nroUnico: "700.001",
    numero: "3050",
    chaveDFe: "35260244555666000122550010000030501234567896",
    valor: "R$ 18.600,00",
    totalCBS: "R$ 930,00",
    apuracaoAssistida: "Consulta não realizada",
  },
  {
    dtNegociacao: "08/10/2026",
    empresa: "003 - Distribuidora Norte Ltda",
    parceiro: "Atacado Regional Ltda",
    cnpjParceiro: "33.444.555/0001-99",
    tipoMovimento: "Venda",
    finalidade: "Normal",
    nroUnico: "900.001",
    numero: "3200",
    chaveDFe: "35260233444555000199550010000032001234567898",
    valor: "R$ 8.400,00",
    totalCBS: "R$ 420,00",
    apuracaoAssistida: "Consulta não realizada",
  },
  {
    dtNegociacao: "12/10/2026",
    empresa: "001 - Sankhya Gestão de Negócios Ltda",
    parceiro: "Grupo Nexus S.A.",
    cnpjParceiro: "23.456.789/0001-01",
    tipoMovimento: "Devolução de Venda",
    finalidade: "Devolução",
    nroUnico: "100.009",
    numero: "1310",
    chaveDFe: "35260123456789000100550010000013101234567894",
    valor: "R$ 5.650,00",
    totalCBS: "R$ 282,50",
    apuracaoAssistida: "Consulta não realizada",
  },
  {
    dtNegociacao: "19/10/2026",
    empresa: "002 - Sankhya São Paulo S.A.",
    parceiro: "Indústria Central Ltda",
    cnpjParceiro: "44.555.666/0001-22",
    tipoMovimento: "Devolução de Venda",
    finalidade: "Devolução",
    nroUnico: "800.001",
    numero: "3100",
    chaveDFe: "35260244555666000122550010000031001234567897",
    valor: "R$ 18.600,00",
    totalCBS: "R$ 930,00",
    apuracaoAssistida: "Consulta não realizada",
  },
  {
    dtNegociacao: "26/10/2026",
    empresa: "003 - Distribuidora Norte Ltda",
    parceiro: "Atacado Regional Ltda",
    cnpjParceiro: "33.444.555/0001-99",
    tipoMovimento: "Devolução de Venda",
    finalidade: "Devolução",
    nroUnico: "950.001",
    numero: "3250",
    chaveDFe: "35260233444555000199550010000032501234567899",
    valor: "R$ 3.360,00",
    totalCBS: "R$ 168,00",
    apuracaoAssistida: "Consulta não realizada",
  },
];
