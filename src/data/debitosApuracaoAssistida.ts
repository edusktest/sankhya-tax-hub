import { documentosConciliacao } from "./mockData";

// Débitos e créditos da Apuração Assistida (layout igual ao da planilha de referência).
export const NAO_ENCONTRADO = "Não encontrado";

export interface DebitoApuracaoAssistida {
  periodoApuracao: string;
  origem: number;
  documento: string;
  chaveDocumento: string;
  dataEmissao: string;
  dataRegistro: string;
  dataAtualizacao: string;
  cbsApurado: number;
  cbsSaldoCorrente: number;
  cbsExtinto: number;
  nroUnicoEIP: string; // número único do documento no EIP, ou "Não encontrado"
}

interface OpcoesGeracao {
  situacao: "Débito" | "Crédito"; // situação dos documentos da Conciliação que entram na lista
  seed: number;
  totalLinhas: number;
  totalNaoEncontradosEIP: number;
  prefixoChave: string;
  ajustesCbs?: Record<number, number>; // diferença do CBS apurado em relação ao do EIP, por posição do documento
}

function gerar({ situacao, seed: seedInicial, totalLinhas, totalNaoEncontradosEIP, prefixoChave, ajustesCbs = {} }: OpcoesGeracao): DebitoApuracaoAssistida[] {
  let seed = seedInicial;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const inteiro = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
  const dois = (n: number) => String(n).padStart(2, "0");
  const digitos = (len: number) => String(Math.floor(rnd() * 10 ** len)).padStart(len, "0");

  const datas = () => {
    const dia = inteiro(3, 16);
    const hora = inteiro(17, 19);
    return {
      dataEmissao: `2026-11-${dois(dia)}T${dois(hora)}:${dois(inteiro(0, 59))}:${dois(inteiro(0, 59))}-03:00`,
      dataRegistro: `2026-11-${dois(dia)}T${dois(hora)}:${dois(inteiro(0, 59))}:${dois(inteiro(0, 59))}.${digitos(7)}-03:00`,
      dataAtualizacao: `2026-11-17T17:56:41.${digitos(3)}-03:00`,
    };
  };

  const linhas: DebitoApuracaoAssistida[] = [];

  // Linhas que o EIP também conhece (documentos da Conciliação com a situação informada).
  documentosConciliacao.filter(x => x.apuracaoAssistida === situacao).forEach((d, pos) => {
    const cbs = Math.round((parseFloat(d.totalCBS.replace(/[^\d,]/g, "").replace(",", ".")) + (ajustesCbs[pos] ?? 0)) * 100) / 100;
    linhas.push({
      periodoApuracao: "11/2026",
      origem: 0,
      documento: "NFSe",
      chaveDocumento: d.chaveDFe,
      ...datas(),
      cbsApurado: cbs,
      cbsSaldoCorrente: cbs,
      cbsExtinto: 0,
      nroUnicoEIP: d.nroUnico,
    });
  });

  // Demais linhas da apuração; algumas não existem no EIP.
  const restantes = totalLinhas - linhas.length;
  const naoEncontrados = new Set<number>();
  while (naoEncontrados.size < totalNaoEncontradosEIP) naoEncontrados.add(inteiro(0, restantes - 1));

  for (let i = 0; i < restantes; i++) {
    // Valores variados, de centavos a algumas centenas de reais.
    const base =
      rnd() < 0.35
        ? [0.31, 0.62, 1.23, 2.78, 4.32, 5.62, 5.8, 12.17][inteiro(0, 7)]
        : Math.round((1 + Math.pow(rnd(), 2) * 270) * 100) / 100;

    linhas.push({
      periodoApuracao: "11/2026",
      origem: 0,
      documento: "NFSe",
      chaveDocumento: `${prefixoChave}${digitos(40)}`,
      ...datas(),
      cbsApurado: base,
      cbsSaldoCorrente: base,
      cbsExtinto: 0,
      nroUnicoEIP: naoEncontrados.has(i) ? NAO_ENCONTRADO : `${inteiro(1, 9)}00.${digitos(3)}`,
    });
  }

  // Parte dos documentos já teve 5% extinto (débito) ou apropriado (crédito): reduz o saldo.
  linhas.forEach((l, i) => {
    if (i % 4 === 1) {
      l.cbsExtinto = Math.round(l.cbsApurado * 5) / 100;
      l.cbsSaldoCorrente = Math.round((l.cbsApurado - l.cbsExtinto) * 100) / 100;
    }
  });
  return linhas;
}

export const debitosApuracaoAssistida: DebitoApuracaoAssistida[] = gerar({
  situacao: "Débito",
  seed: 11202026,
  totalLinhas: 120,
  totalNaoEncontradosEIP: 3,
  prefixoChave: "3117",
  ajustesCbs: { 1: 12.5 },
});

export const creditosApuracaoAssistida: DebitoApuracaoAssistida[] = gerar({
  situacao: "Crédito",
  seed: 20261117,
  totalLinhas: 60,
  totalNaoEncontradosEIP: 0,
  prefixoChave: "3518",
  ajustesCbs: { 0: -5 },
});
