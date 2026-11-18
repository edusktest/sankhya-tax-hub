import { apuracoes } from "./mockData";
import { debitosApuracaoAssistida, creditosApuracaoAssistida } from "./debitosApuracaoAssistida";

// Débito e crédito apurados por mês, para o dashboard de Minhas Apurações da CBS.
export const EMPRESAS_DASHBOARD = [
  "Sankhya Tecnologia em Sistemas S.A.",
  "Distribuidora Nacional Ltda.",
];

export const ANOS_DASHBOARD = ["2026", "2025"];

export const MESES_ABREV = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export interface ApuracaoMes {
  mes: string;
  debito: number | null; // null = mês ainda sem apuração
  credito: number | null;
  alertas: number;
  apuracaoId?: string; // só os meses com detalhe de apuração disponível
}

const somaReais = (valores: number[]) => Math.round(valores.reduce((a, b) => a + b * 100, 0)) / 100;

function hash(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Último mês com apuração em cada ano (o ano corrente, 2026, vai até NOV).
const ultimoMes = (ano: string) => (ano === "2026" ? 10 : 11);

export function apuracaoPorMes(empresa: string, ano: string): ApuracaoMes[] {
  let seed = hash(`${empresa}|${ano}`);
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const escala = empresa === EMPRESAS_DASHBOARD[0] ? 1 : 0.45;

  return MESES_ABREV.map((mes, i) => {
    if (i > ultimoMes(ano)) return { mes, debito: null, credito: null, alertas: 0 };

    // NOV/2026 da primeira empresa usa os totais reais das abas Débito e Crédito.
    if (empresa === EMPRESAS_DASHBOARD[0] && ano === "2026" && i === 10) {
      return {
        mes,
        debito: somaReais(debitosApuracaoAssistida.map(d => d.cbsApurado)),
        credito: somaReais(creditosApuracaoAssistida.map(d => d.cbsApurado)),
        alertas: apuracoes[0].alertas,
        apuracaoId: apuracoes[0].id,
      };
    }
    const debito = Math.round((6000 + rnd() * 6000) * escala * 100) / 100;
    const credito = Math.round((3000 + rnd() * 4500) * escala * 100) / 100;
    const alertas = rnd() < 0.5 ? 0 : Math.floor(rnd() * 4);
    return { mes, debito, credito, alertas };
  });
}
