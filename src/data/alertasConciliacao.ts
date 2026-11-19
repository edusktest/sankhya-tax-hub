import { documentosConciliacao } from "./mockData";
import { debitosApuracaoAssistida, creditosApuracaoAssistida, NAO_ENCONTRADO } from "./debitosApuracaoAssistida";

const centavos = (v: string) => Math.round(parseFloat(v.replace(/[^\d,]/g, "").replace(",", ".")) * 100);

// Total de alertas da conciliação da apuração:
// documentos não encontrados na Apuração Assistida, não encontrados no EIP e com CBS diferente.
export function totalAlertasConciliacao(): number {
  const linhasAA = [...debitosApuracaoAssistida, ...creditosApuracaoAssistida];
  const encontrados = documentosConciliacao.filter(d => d.apuracaoAssistida !== "Não encontrado");

  const naoEncontradosAA = documentosConciliacao.length - encontrados.length;
  const naoEncontradosEIP = linhasAA.filter(l => l.nroUnicoEIP === NAO_ENCONTRADO).length;
  const cbsDiferentes = encontrados.filter(d => {
    const linha = linhasAA.find(l => l.nroUnicoEIP === d.nroUnico);
    return linha !== undefined && Math.round(linha.cbsApurado * 100) !== centavos(d.totalCBS);
  }).length;

  return naoEncontradosAA + naoEncontradosEIP + cbsDiferentes;
}
