export interface DebitoAguardando {
  emissao: number; // timestamp (ms)
  inclusao: number; // timestamp (ms)
  documentoFiscal: string; // últimos 6 dígitos da chave
  niAdquirente: string;
  valorOriginal: number; // centavos
  aguardandoProcessamento: number; // centavos
}

export const TOTAL_DEBITOS_AGUARDANDO = 37103009; // R$ 371.030,09
const TOTAL_ITENS = 4708;

// Primeiras linhas conforme o demonstrativo de referência.
const fixas: [string, string, string, string, number][] = [
  ["16/11/2026 13:42:15", "16/11/2026 13:47:13", "384980", "03.799.534/0001-18", 1876],
  ["16/11/2026 09:21:34", "16/11/2026 09:22:39", "810966", "83.892.182/0001-80", 44121],
  ["16/11/2026 14:05:12", "16/11/2026 14:15:53", "000117", "44.136.221/0001-67", 17172],
  ["16/11/2026 13:43:32", "16/11/2026 13:48:19", "922400", "29.266.742/0001-45", 4834],
  ["16/11/2026 13:45:49", "16/11/2026 13:49:51", "130963", "27.313.181/0001-62", 743],
  ["16/11/2026 16:00:21", "16/11/2026 16:23:53", "980109", "02.895.077/0001-00", 5014],
  ["13/11/2026 14:26:11", "13/11/2026 14:36:11", "964039", "04.815.994/0001-55", 6643],
  ["13/11/2026 10:54:45", "13/11/2026 11:01:35", "336357", "07.818.357/0001-20", 1700],
  ["13/11/2026 15:34:24", "13/11/2026 15:40:08", "020289", "22.610.500/0001-88", 11855],
];

function parseData(s: string): number {
  const [d, h] = s.split(" ");
  const [dd, mm, yyyy] = d.split("/").map(Number);
  const [hh, mi, ss] = h.split(":").map(Number);
  return new Date(yyyy, mm - 1, dd, hh, mi, ss).getTime();
}

function gerar(): DebitoAguardando[] {
  let seed = 20261116;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const linhas: DebitoAguardando[] = fixas.map(([e, i, doc, ni, v]) => ({
    emissao: parseData(e),
    inclusao: parseData(i),
    documentoFiscal: doc,
    niAdquirente: ni,
    valorOriginal: v,
    aguardandoProcessamento: v,
  }));

  const restantes = TOTAL_ITENS - linhas.length;
  const somaFixas = linhas.reduce((acc, l) => acc + l.valorOriginal, 0);

  // 40% das linhas são pequenas (R$ 2,12); as demais variam e são escaladas para fechar o total.
  const ehPequena = Array.from({ length: restantes }, () => rnd() < 0.4);
  const somaPequenas = ehPequena.filter(Boolean).length * 212;
  const pesos = ehPequena.map(p => (p ? 0 : 1 + Math.pow(rnd(), 3) * 40));
  const somaPesos = pesos.reduce((a, b) => a + b, 0);
  const alvo = TOTAL_DEBITOS_AGUARDANDO - somaFixas - somaPequenas;

  const valores = ehPequena.map((p, i) => (p ? 212 : Math.max(213, Math.round((pesos[i] / somaPesos) * alvo))));
  const residuo = TOTAL_DEBITOS_AGUARDANDO - somaFixas - valores.reduce((a, b) => a + b, 0);
  let maior = 0;
  valores.forEach((v, i) => {
    if (v > valores[maior]) maior = i;
  });
  valores[maior] += residuo;

  const fim = parseData("13/11/2026 15:30:00");
  const inicio = parseData("11/11/2026 09:00:00");
  const digitos = (len: number) => String(Math.floor(rnd() * 10 ** len)).padStart(len, "0");

  for (let i = 0; i < restantes; i++) {
    const emissao = fim - Math.round(((fim - inicio) * i) / restantes) - Math.round(rnd() * 60000);
    const inclusao = emissao + (60 + Math.round(rnd() * 900)) * 1000;
    linhas.push({
      emissao,
      inclusao,
      documentoFiscal: digitos(6),
      niAdquirente: `${digitos(2)}.${digitos(3)}.${digitos(3)}/0001-${digitos(2)}`,
      valorOriginal: valores[i],
      aguardandoProcessamento: valores[i],
    });
  }
  return linhas;
}

export const debitosAguardando: DebitoAguardando[] = gerar();
