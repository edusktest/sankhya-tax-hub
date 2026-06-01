import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  CheckCircle2, AlertTriangle, Clock, DollarSign, ChevronRight, ChevronDown,
  Search, ArrowUpDown, Sparkles, Info, Pencil, RotateCcw, CheckCheck, ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen    = 1 | 2 | 3 | 4;
type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;
type Period    = "30" | "60" | "90";
type SortKey   = "ncm" | "descricao" | "volume" | "docs" | "status";
type SortDir   = "asc" | "desc";
type StatusFilter = "todos" | "aguardando" | "sem" | "parcial" | "configurado";
type LogStatus = "Sucesso" | "Erro" | "Desfeito";

interface NcmRow {
  id: string; ncm: string; descricao: string; volume: number; docs: number;
  status: "sem" | "parcial" | "configurado";
  sugestao: string;
  sincedays: number;
}

interface LogEntry {
  id: string; usuario: string; dataHora: string; versaoCFF: string;
  tempo: string; registros: string; status: LogStatus;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// sincedays ≤ 60 → visível em todos os períodos (31 linhas: 8 config, 17 sem, 6 parcial)
// sincedays 61-90 → visível em 90d e 120d (+16 linhas: 4 config, 10 sem, 2 parcial)
// sincedays 91-120 → visível apenas em 120d (+11 linhas: 3 config, 7 sem, 1 parcial)
// Totais: 60d→31(8c,23a) | 90d→47(12c,35a) | 120d→58(15c,43a)
const TABLE_ROWS: NcmRow[] = [
  // ── configurado, sincedays 1-60 ──────────────────────────────────────────
  { id: "c01", ncm: "0201.30.00", descricao: "Carnes bovinas",              volume: 1430000,  docs: 3102, status: "configurado", sugestao: "012 — Isento IBS/CBS",              sincedays: 15 },
  { id: "c02", ncm: "0303.89.00", descricao: "Peixes congelados",           volume:  980000,  docs:  721, status: "configurado", sugestao: "031 — Isento CBS / Reduzido IBS",   sincedays:  5 },
  { id: "c03", ncm: "1701.14.00", descricao: "Açúcar de cana",             volume:  870000,  docs: 1543, status: "configurado", sugestao: "012 — Isento IBS/CBS",              sincedays: 20 },
  { id: "c04", ncm: "8703.23.10", descricao: "Automóveis a gasolina",      volume: 12450000, docs: 4382, status: "configurado", sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays:  8 },
  { id: "c05", ncm: "2203.00.00", descricao: "Cervejas de malte",          volume:  3210000, docs: 2187, status: "configurado", sugestao: "019 — Redução 50% IBS/CBS",         sincedays: 30 },
  { id: "c06", ncm: "3304.99.90", descricao: "Cosméticos e perfumes",      volume:  2180000, docs: 1654, status: "configurado", sugestao: "025 — Alíquota Reduzida IBS/CBS",   sincedays: 42 },
  { id: "c07", ncm: "9504.50.00", descricao: "Consoles de videogame",      volume:  5430000, docs:  987, status: "configurado", sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays: 18 },
  { id: "c08", ncm: "8443.39.10", descricao: "Impressoras multifuncionais",volume:  1870000, docs:  843, status: "configurado", sugestao: "025 — Alíquota Reduzida IBS/CBS",   sincedays: 55 },
  // ── sem, sincedays 1-60 ─────────────────────────────────────────────────
  { id:  "1",  ncm: "8471.30.19", descricao: "Computadores portáteis",      volume:  3240000, docs: 1847, status: "sem",         sugestao: "025 — Alíquota Reduzida IBS/CBS",   sincedays: 12 },
  { id:  "2",  ncm: "3004.90.69", descricao: "Medicamentos - uso humano",   volume:  2180000, docs:  943, status: "sem",         sugestao: "031 — Isento CBS / Reduzido IBS",   sincedays: 25 },
  { id:  "4",  ncm: "8528.72.20", descricao: "Televisores",                 volume:  1650000, docs:  782, status: "sem",         sugestao: "025 — Alíquota Reduzida IBS/CBS",   sincedays: 35 },
  { id:  "6",  ncm: "3002.15.90", descricao: "Vacinas - uso humano",        volume:   980000, docs:  421, status: "sem",         sugestao: "031 — Isento CBS / Reduzido IBS",   sincedays: 48 },
  { id:  "8",  ncm: "2204.21.00", descricao: "Vinhos de uvas frescas",      volume:   640000, docs:  589, status: "sem",         sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays: 22 },
  { id: "s01", ncm: "6109.10.00", descricao: "Camisetas de algodão",        volume:   430000, docs: 1203, status: "sem",         sugestao: "019 — Redução 50% IBS/CBS",         sincedays:  3 },
  { id: "s02", ncm: "2710.19.31", descricao: "Óleo diesel",                 volume:  5640000, docs: 3201, status: "sem",         sugestao: "015 — Tributação Diferenciada",     sincedays: 17 },
  { id: "s03", ncm: "8517.12.13", descricao: "Smartphones Android",         volume:  8930000, docs: 2847, status: "sem",         sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays:  9 },
  { id: "s04", ncm: "9401.61.00", descricao: "Assentos de madeira",         volume:   320000, docs:  487, status: "sem",         sugestao: "025 — Alíquota Reduzida IBS/CBS",   sincedays: 45 },
  { id: "s05", ncm: "4011.10.00", descricao: "Pneus novos para automóveis", volume:  1230000, docs:  892, status: "sem",         sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays: 28 },
  { id: "s06", ncm: "9021.10.00", descricao: "Próteses ortopédicas",        volume:   430000, docs:  234, status: "sem",         sugestao: "031 — Isento CBS / Reduzido IBS",   sincedays: 52 },
  { id: "s07", ncm: "3808.94.19", descricao: "Desinfetantes",               volume:   780000, docs: 1087, status: "sem",         sugestao: "019 — Redução 50% IBS/CBS",         sincedays:  7 },
  { id: "s08", ncm: "8544.42.00", descricao: "Condutores elétricos",        volume:  1120000, docs:  643, status: "sem",         sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays: 33 },
  { id: "s09", ncm: "9503.00.10", descricao: "Brinquedos plásticos",        volume:   567000, docs: 1432, status: "sem",         sugestao: "019 — Redução 50% IBS/CBS",         sincedays: 41 },
  { id: "s10", ncm: "8471.60.54", descricao: "Periféricos de computador",   volume:   480000, docs:  723, status: "sem",         sugestao: "025 — Alíquota Reduzida IBS/CBS",   sincedays: 57 },
  { id: "s11", ncm: "9018.31.11", descricao: "Seringas médicas",            volume:   230000, docs: 1876, status: "sem",         sugestao: "031 — Isento CBS / Reduzido IBS",   sincedays: 14 },
  { id: "s12", ncm: "2523.29.10", descricao: "Cimento Portland",            volume:  2340000, docs: 2109, status: "sem",         sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays: 39 },
  // ── parcial, sincedays 1-60 ─────────────────────────────────────────────
  { id:  "3",  ncm: "2710.12.59", descricao: "Gasolina automotiva",         volume:  1920000, docs: 2341, status: "parcial",     sugestao: "015 — Tributação Diferenciada",     sincedays: 19 },
  { id:  "7",  ncm: "8517.12.31", descricao: "Telefones celulares",         volume:   870000, docs: 1203, status: "parcial",     sugestao: "025 — Alíquota Reduzida IBS/CBS",   sincedays: 43 },
  { id: "p01", ncm: "3006.60.00", descricao: "Preparações químicas diagnóstico", volume: 560000, docs: 342, status: "parcial",  sugestao: "031 — Isento CBS / Reduzido IBS",   sincedays: 11 },
  { id: "p02", ncm: "8415.10.00", descricao: "Aparelhos de ar condicionado",volume: 2870000, docs: 1432, status: "parcial",     sugestao: "025 — Alíquota Reduzida IBS/CBS",   sincedays: 26 },
  { id: "p03", ncm: "9201.10.00", descricao: "Pianos e cravos",             volume:   180000, docs:   87, status: "parcial",     sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays: 51 },
  { id: "p04", ncm: "3901.20.29", descricao: "Polietileno",                 volume:  1450000, docs:  876, status: "parcial",     sugestao: "015 — Tributação Diferenciada",     sincedays: 38 },
  // ── configurado, sincedays 61-90 ─────────────────────────────────────────
  { id: "c09", ncm: "1006.30.21", descricao: "Arroz beneficiado",           volume:  2340000, docs: 3421, status: "configurado", sugestao: "012 — Isento IBS/CBS",              sincedays: 65 },
  { id: "c10", ncm: "0805.10.00", descricao: "Laranjas frescas",            volume:   340000, docs: 1243, status: "configurado", sugestao: "012 — Isento IBS/CBS",              sincedays: 72 },
  { id: "c11", ncm: "8702.10.10", descricao: "Ônibus a diesel",             volume:  8750000, docs:  543, status: "configurado", sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays: 80 },
  { id: "c12", ncm: "9405.11.00", descricao: "Lustres e luminárias",        volume:   430000, docs:  321, status: "configurado", sugestao: "025 — Alíquota Reduzida IBS/CBS",   sincedays: 88 },
  // ── sem, sincedays 61-90 ─────────────────────────────────────────────────
  { id: "s13", ncm: "8483.10.10", descricao: "Eixos de transmissão",        volume:  1230000, docs:  654, status: "sem",         sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays: 63 },
  { id: "s14", ncm: "7208.10.10", descricao: "Chapas de aço plano",         volume:  3420000, docs:  987, status: "sem",         sugestao: "015 — Tributação Diferenciada",     sincedays: 70 },
  { id: "s15", ncm: "6204.62.00", descricao: "Calças jeans femininas",      volume:   540000, docs: 1654, status: "sem",         sugestao: "019 — Redução 50% IBS/CBS",         sincedays: 75 },
  { id: "s16", ncm: "3901.20.00", descricao: "Polipropileno",               volume:  2100000, docs:  543, status: "sem",         sugestao: "015 — Tributação Diferenciada",     sincedays: 82 },
  { id: "s17", ncm: "8481.80.39", descricao: "Válvulas industriais",        volume:   890000, docs:  432, status: "sem",         sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays: 67 },
  { id: "s18", ncm: "2401.10.20", descricao: "Tabaco não manufaturado",     volume:  1560000, docs:  765, status: "sem",         sugestao: "015 — Tributação Diferenciada",     sincedays: 78 },
  { id: "s19", ncm: "8516.40.00", descricao: "Ferros de passar roupa",      volume:   230000, docs:  543, status: "sem",         sugestao: "025 — Alíquota Reduzida IBS/CBS",   sincedays: 85 },
  { id: "s20", ncm: "4016.93.00", descricao: "Juntas de borracha",          volume:   450000, docs:  321, status: "sem",         sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays: 62 },
  { id: "s21", ncm: "8407.34.90", descricao: "Motores de combustão interna",volume:  3210000, docs:  432, status: "sem",         sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays: 73 },
  { id: "s22", ncm: "9403.60.00", descricao: "Móveis de madeira",           volume:   760000, docs:  876, status: "sem",         sugestao: "019 — Redução 50% IBS/CBS",         sincedays: 89 },
  // ── parcial, sincedays 61-90 ─────────────────────────────────────────────
  { id: "p05", ncm: "2106.90.10", descricao: "Preparações alimentícias",    volume:   870000, docs: 1234, status: "parcial",     sugestao: "019 — Redução 50% IBS/CBS",         sincedays: 68 },
  { id: "p06", ncm: "8504.40.21", descricao: "Conversores de frequência",   volume:  1340000, docs:  543, status: "parcial",     sugestao: "015 — Tributação Diferenciada",     sincedays: 83 },
  // ── configurado, sincedays 91-120 ────────────────────────────────────────
  { id: "c13", ncm: "8471.50.10", descricao: "Unidades de processamento",   volume:  2340000, docs:  765, status: "configurado", sugestao: "025 — Alíquota Reduzida IBS/CBS",   sincedays:  95 },
  { id: "c14", ncm: "3102.10.10", descricao: "Ureia fertilizante",          volume:  1230000, docs:  432, status: "configurado", sugestao: "012 — Isento IBS/CBS",              sincedays: 105 },
  { id: "c15", ncm: "2710.12.11", descricao: "Gasolina premium",            volume:  4320000, docs: 1234, status: "configurado", sugestao: "015 — Tributação Diferenciada",     sincedays: 112 },
  // ── sem, sincedays 91-120 ────────────────────────────────────────────────
  { id: "s23", ncm: "8536.50.90", descricao: "Interruptores elétricos",     volume:   340000, docs:  432, status: "sem",         sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays:  93 },
  { id: "s24", ncm: "8901.10.00", descricao: "Embarcações de transporte",   volume: 12300000, docs:   87, status: "sem",         sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays: 101 },
  { id: "s25", ncm: "2106.10.00", descricao: "Concentrados p/ bebidas",     volume:   560000, docs: 1234, status: "sem",         sugestao: "019 — Redução 50% IBS/CBS",         sincedays: 108 },
  { id: "s26", ncm: "8544.60.00", descricao: "Cabos elétricos",             volume:   890000, docs:  543, status: "sem",         sugestao: "000 — Tributação Padrão IBS/CBS",   sincedays:  95 },
  { id: "s27", ncm: "7304.31.10", descricao: "Tubos de aço sem costura",    volume:  2340000, docs:  432, status: "sem",         sugestao: "015 — Tributação Diferenciada",     sincedays: 103 },
  { id: "s28", ncm: "9403.10.00", descricao: "Móveis metálicos",            volume:   450000, docs:  654, status: "sem",         sugestao: "019 — Redução 50% IBS/CBS",         sincedays: 115 },
  { id: "s29", ncm: "3102.21.00", descricao: "Sulfato de amônio",           volume:   870000, docs:  321, status: "sem",         sugestao: "012 — Isento IBS/CBS",              sincedays:  98 },
  // ── parcial, sincedays 91-120 ────────────────────────────────────────────
  { id: "p07", ncm: "2106.90.30", descricao: "Alimentos processados",       volume:  1230000, docs:  876, status: "parcial",     sugestao: "019 — Redução 50% IBS/CBS",         sincedays: 107 },
];

const EMPRESAS_INIT = [
  { id: "a", nome: "Empresa A Comércio Ltda",      cnpj: "12.345.678/0001-00", docs: "248 docs no período",   checked: true  },
  { id: "b", nome: "Empresa B Distribuidora S.A.", cnpj: "12.345.678/0002-11", docs: "1.421 docs no período", checked: true  },
  { id: "c", nome: "Empresa C Filial SP",          cnpj: "12.345.678/0003-22", docs: "178 docs no período",   checked: false },
];

const UFS_LIST = [
  { id: "AC", label: "Acre"                },
  { id: "AL", label: "Alagoas"             },
  { id: "AP", label: "Amapá"              },
  { id: "AM", label: "Amazonas"            },
  { id: "BA", label: "Bahia"              },
  { id: "CE", label: "Ceará"             },
  { id: "DF", label: "Distrito Federal"    },
  { id: "ES", label: "Espírito Santo"    },
  { id: "GO", label: "Goiás"             },
  { id: "MA", label: "Maranhão"           },
  { id: "MT", label: "Mato Grosso"         },
  { id: "MS", label: "Mato Grosso do Sul"  },
  { id: "MG", label: "Minas Gerais"        },
  { id: "PA", label: "Pará"              },
  { id: "PB", label: "Paraíba"           },
  { id: "PR", label: "Paraná"            },
  { id: "PE", label: "Pernambuco"          },
  { id: "PI", label: "Piauí"             },
  { id: "RJ", label: "Rio de Janeiro"      },
  { id: "RN", label: "Rio Grande do Norte" },
  { id: "RS", label: "Rio Grande do Sul"   },
  { id: "RO", label: "Rondônia"          },
  { id: "RR", label: "Roraima"             },
  { id: "SC", label: "Santa Catarina"      },
  { id: "SP", label: "São Paulo"         },
  { id: "SE", label: "Sergipe"             },
  { id: "TO", label: "Tocantins"           },
];

const MUNICIPIOS_LIST = [
  { id: "3550308", label: "São Paulo — SP"          },
  { id: "3304557", label: "Rio de Janeiro — RJ"     },
  { id: "3106200", label: "Belo Horizonte — MG"     },
  { id: "2927408", label: "Salvador — BA"           },
  { id: "4106902", label: "Curitiba — PR"           },
  { id: "2611606", label: "Recife — PE"             },
  { id: "1302603", label: "Manaus — AM"             },
  { id: "2304400", label: "Fortaleza — CE"          },
  { id: "4314902", label: "Porto Alegre — RS"       },
  { id: "1501402", label: "Belém — PA"              },
  { id: "5300108", label: "Brasília — DF"           },
  { id: "3518800", label: "Guarulhos — SP"          },
  { id: "3509502", label: "Campinas — SP"           },
  { id: "3548708", label: "São Bernardo do Campo — SP" },
  { id: "4209102", label: "Joinville — SC"          },
];

const TOPS_LIST = [
  { id: "1",  label: "Venda"               },
  { id: "2",  label: "Devolução de venda"  },
  { id: "3",  label: "Remessa"             },
  { id: "4",  label: "Retorno"             },
  { id: "5",  label: "Simples faturamento" },
  { id: "6",  label: "Compra"              },
  { id: "7",  label: "Devolução de compra" },
  { id: "8",  label: "Transferência"       },
  { id: "9",  label: "Exportação"          },
  { id: "10", label: "Importação"          },
];

const FINALIDADES_LIST = [
  { id: "1", label: "Uso e Consumo"     },
  { id: "2", label: "Ativo Imobilizado" },
  { id: "3", label: "Industrialização"  },
  { id: "4", label: "Conserto"          },
  { id: "5", label: "Revenda"           },
  { id: "6", label: "Serviço"           },
];

const GRUPOS_PARCEIROS_LIST = [
  { id: "001", label: "Entidades sem Fins Lucrativos e Vulnerabilidade Social"          },
  { id: "002", label: "Setor Público e Infraestrutura"                                  },
  { id: "003", label: "Cadeia de Saúde, Educação e Inovação"                            },
  { id: "004", label: "Produção Primária e Agronegócio"                                 },
  { id: "005", label: "Consumidores Finais Pessoa Física (Regime Geral vs. Protegido)"  },
  { id: "006", label: "Grandes Contribuintes e Multinacionais"                          },
  { id: "007", label: "Micro e Pequenas Empresas (Simples Nacional)"                    },
  { id: "008", label: "Exportadores e Comércio Exterior"                                },
];

const LOG_ENTRIES: LogEntry[] = [
  { id: "EXC-2026-00847", usuario: "ana.silva",    dataHora: "12/05/2026 14:32", versaoCFF: "12/05/2026", tempo: "1,3s", registros: "6 (3 ex. × 2 emp.)", status: "Sucesso"  },
  { id: "EXC-2026-00846", usuario: "joao.santos",  dataHora: "11/05/2026 10:15", versaoCFF: "10/05/2026", tempo: "0,8s", registros: "2 (1 ex. × 2 emp.)", status: "Sucesso"  },
  { id: "EXC-2026-00845", usuario: "pedro.alves",  dataHora: "10/05/2026 08:40", versaoCFF: "10/05/2026", tempo: "1,9s", registros: "10 (5 ex. × 2 emp.)", status: "Sucesso" },
  { id: "EXC-2026-00844", usuario: "maria.lima",   dataHora: "09/05/2026 16:45", versaoCFF: "09/05/2026", tempo: "2,1s", registros: "0",                   status: "Erro"    },
  { id: "EXC-2026-00840", usuario: "ana.silva",    dataHora: "07/05/2026 09:20", versaoCFF: "07/05/2026", tempo: "1,1s", registros: "4 (2 ex. × 2 emp.)", status: "Sucesso"  },
  { id: "EXC-2026-00835", usuario: "carlos.souza", dataHora: "05/05/2026 11:55", versaoCFF: "05/05/2026", tempo: "0,5s", registros: "2 (1 ex. × 2 emp.)", status: "Desfeito" },
  { id: "EXC-2026-00820", usuario: "joao.santos",  dataHora: "02/05/2026 14:10", versaoCFF: "01/05/2026", tempo: "1,7s", registros: "6 (3 ex. × 2 emp.)", status: "Sucesso"  },
];

const WIZARD_STEP_LABELS = ["UF/Município", "NCM/NBS", "Empresa", "Operação", "Parceiro", "Resumo/Conclusão"] as const;

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
function fmtNum(v: number) { return v.toLocaleString("pt-BR"); }
function fmtVolume(v: number) {
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}B`;
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
  return `R$ ${(v / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}K`;
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, sub, variant, highlighted, onClick }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  variant: "primary" | "success" | "warning" | "muted";
  highlighted?: boolean;
  onClick?: () => void;
}) {
  const map = {
    primary: { value: "text-primary",     bg: "bg-primary/10"  },
    success: { value: "text-success",     bg: "bg-success/10"  },
    warning: { value: "text-warning",     bg: "bg-warning/10"  },
    muted:   { value: "text-foreground",  bg: "bg-muted"       },
  };
  const { value: valCls, bg } = map[variant];
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg p-4 flex-1 border transition-shadow",
        highlighted ? "bg-warning/5 border-warning/50" : "bg-background border-border",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/40"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[12px] font-medium text-muted-foreground leading-tight">{label}</span>
        <div className={cn("rounded-full p-1.5", bg)}>{icon}</div>
      </div>
      <p className={cn("text-2xl font-bold", valCls)}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: NcmRow["status"] }) {
  if (status === "sem")     return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">🔴 Sem exceção</span>;
  if (status === "parcial") return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-warning/10 text-warning">🟡 Exc. parcial</span>;
  return                           <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">✅ Configurado</span>;
}

// ─── LogStatusBadge ───────────────────────────────────────────────────────────
function LogStatusBadge({ status }: { status: LogStatus }) {
  if (status === "Sucesso")  return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">✅ Sucesso</span>;
  if (status === "Erro")     return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">❌ Erro</span>;
  return                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">↩ Desfeito</span>;
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card rounded-lg p-5 border border-border card-shadow", className)}>
      {children}
    </div>
  );
}

// ─── SyncBadge (com tooltip CSS) ─────────────────────────────────────────────
function SyncBadge({ label, date, nextSync }: { label: string; date: string; nextSync: string }) {
  return (
    <div className="relative group inline-flex">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 cursor-default dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
        ✓ {label}: {date}
      </span>
      <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block z-20">
        <div className="bg-popover text-popover-foreground text-[11px] px-2.5 py-1.5 rounded-md shadow-md border border-border whitespace-nowrap">
          Próxima sincronização: {nextSync}
        </div>
      </div>
    </div>
  );
}

// ─── WizardProgress ──────────────────────────────────────────────────────────
function WizardProgress({ step }: { step: WizardStep }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {WIZARD_STEP_LABELS.map((label, idx) => {
        const n      = (idx + 1) as WizardStep;
        const active = n === step;
        const done   = n < step;
        const last   = idx === WIZARD_STEP_LABELS.length - 1;
        return (
          <div key={n} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition-colors",
                done   ? "bg-success border-success text-success-foreground"
                : active ? "bg-primary border-primary text-primary-foreground"
                :          "bg-card border-border text-muted-foreground"
              )}>
                {done ? <CheckCheck className="h-4 w-4" /> : n}
              </div>
              <span className={cn("text-[10px] font-medium mt-1 whitespace-nowrap",
                active ? "text-primary" : done ? "text-success" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </div>
            {!last && (
              <div className={cn("flex-1 h-0.5 mx-1 mb-4", done ? "bg-success" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("w-9 h-5 rounded-full transition-colors flex-shrink-0 relative",
          checked ? "bg-primary" : "bg-muted-foreground/30")}
      >
        <span className={cn("absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform",
          checked ? "translate-x-4 left-0.5" : "translate-x-0 left-0.5")} />
      </button>
      <span className="text-[12px] font-medium text-foreground cursor-pointer" onClick={() => onChange(!checked)}>
        {label}
      </span>
    </div>
  );
}

// ─── ResumoConcluso ───────────────────────────────────────────────────────────
function ResumoConcluso({
  selectedRows, resumeItems, logOpen, setLogOpen, confirmed, onConfirm, onConcluir,
}: {
  selectedRows: NcmRow[];
  resumeItems: { ncm: string; desc: string; action: string; actionCls: string }[];
  logOpen: boolean;
  setLogOpen: (v: (prev: boolean) => boolean) => void;
  confirmed: boolean;
  onConfirm: () => void;
  onConcluir: () => void;
}) {
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => { if (confirmed) setListOpen(false); }, [confirmed]);

  return (
    <div className="space-y-5">
      {/* ── Resumo de impacto (sempre visível) ── */}
      <div className="rounded-lg px-5 py-4 space-y-1.5 bg-success/10 border border-success/30">
        <p className="text-[13px] font-semibold text-success">Resumo de impacto</p>
        {[
          `${selectedRows.length} NCM${selectedRows.length !== 1 ? "s" : ""}/NBS serão configurados`,
          "2 empresas serão impactadas",
          `Estimativa: ${selectedRows.reduce((s, r) => s + r.docs, 0).toLocaleString("pt-BR")} documentos futuros passarão a calcular IBS/CBS com a nova classificação`,
        ].map(t => (
          <p key={t} className="text-[12px] flex items-center gap-2 text-success">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> {t}
          </p>
        ))}
      </div>

      {/* ── Lista colapsável de NCMs ── */}
      <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden">
        <button
          onClick={() => setListOpen(v => !v)}
          className="flex items-center justify-between w-full px-5 py-3 text-[13px] font-semibold text-foreground bg-muted/40 hover:bg-muted/60 transition-colors">
          <span>Detalhes dos NCMs/NBS configurados ({resumeItems.length})</span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", listOpen && "rotate-180")} />
        </button>
        {listOpen && (
          <div className="divide-y divide-border">
            {resumeItems.map(item => (
              <div key={item.ncm}>
                <div className="flex items-center justify-between px-5 py-3 bg-muted/20">
                  <div>
                    <span className="font-mono text-[13px] font-bold text-foreground">{item.ncm}</span>
                    <span className="text-[13px] text-muted-foreground ml-2">— {item.desc}</span>
                  </div>
                  <button className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 hover:text-foreground">
                    <Pencil className="h-3 w-3" /> Editar
                  </button>
                </div>
                <div className="px-5 py-3 space-y-2 text-[12px]">
                  {[
                    { label: "Empresas",   value: "Empresa A · Empresa B" },
                    { label: "Operações",  value: "Venda · Transferência" },
                    { label: "Parceiros",  value: "Todos"                 },
                    { label: "cClassTrib", value: (
                      <span>
                        <span className="text-muted-foreground">Não configurado</span>
                        <span className="text-muted-foreground mx-1">→</span>
                        <span className="font-semibold text-foreground">025 — Alíquota Reduzida IBS/CBS</span>
                      </span>
                    )},
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-2">
                      <span className="w-24 text-muted-foreground font-medium">{row.label}:</span>
                      <span className="text-foreground">{row.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="w-24 text-muted-foreground font-medium">Ação:</span>
                    <span className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full", item.actionCls)}>{item.action}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Conclusão (aparece após confirmar) ── */}
      {confirmed && (
        <div className="space-y-4">
          <div className="flex flex-col items-center py-5">
            <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-9 w-9 text-success" />
            </div>
            <h2 className="text-[20px] font-bold text-foreground">Configuração realizada com sucesso!</h2>
            <p className="text-[13px] text-muted-foreground mt-1">
              {selectedRows.length} exceção{selectedRows.length !== 1 ? "ões" : ""} tributária{selectedRows.length !== 1 ? "s" : ""} gravada{selectedRows.length !== 1 ? "s" : ""} em 12/05/2026 às 14:32 por Ana Silva.
            </p>
          </div>

          <SectionCard>
            <button onClick={() => setLogOpen(v => !v)}
              className="flex items-center justify-between w-full text-[13px] font-semibold text-foreground">
              <span>Ver detalhes do log</span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", logOpen && "rotate-180")} />
            </button>
            {logOpen && (
              <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-[12px]">
                {[
                  ["ID Execução",        "EXC-2026-00847"             ],
                  ["Usuário",            "ana.silva"                  ],
                  ["Versão tabela CFF",  "12/05/2026"                 ],
                  ["Tempo de execução",  "1,3s"                       ],
                  ["Registros gravados", "6 (3 exceções × 2 empresas)"],
                ].map(([label, val]) => (
                  <div key={label} className="flex gap-2">
                    <span className="w-40 text-muted-foreground font-medium">{label}:</span>
                    <span className="font-mono text-foreground">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AssistenteExcecoesPage() {
  const location = useLocation();
  const [screen, setScreen]             = useState<Screen>(1);
  const [wizardStep, setWizardStep]     = useState<WizardStep>(1);
  const [period, setPeriod]             = useState<Period>("30");
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [sortKey, setSortKey]           = useState<SortKey>("volume");
  const [sortDir, setSortDir]           = useState<SortDir>("desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [search, setSearch]             = useState("");
  const [showUndo, setShowUndo]         = useState(false);
  const [logOpen, setLogOpen]           = useState(false);
  const [ufMunicOpt, setUfMunicOpt]               = useState<"all" | "ufs" | "municipios">("all");
  const [ufSearch, setUfSearch]                   = useState("");
  const [municipioSearch, setMunicipioSearch]     = useState("");
  const [selectedUFs, setSelectedUFs]             = useState<Set<string>>(new Set());
  const [selectedMunicipios, setSelectedMunicipios] = useState<Set<string>>(new Set());
  const [partnerOpt, setPartnerOpt]               = useState<"all" | "specific" | "group">("all");
  const [topOpt, setTopOpt]                       = useState<"all" | "specific" | "finalidade">("all");
  const [topSearch, setTopSearch]                 = useState("");
  const [finalidadeSearch, setFinalidadeSearch]   = useState("");
  const [selectedTops, setSelectedTops]           = useState<Set<string>>(new Set());
  const [selectedFinalidades, setSelectedFinalidades] = useState<Set<string>>(new Set());
  const [grupoSearch, setGrupoSearch]               = useState("");
  const [selectedGrupos, setSelectedGrupos]         = useState<Set<string>>(new Set());
  const [empresas, setEmpresas]                   = useState(EMPRESAS_INIT);
  const [allEmpresas, setAllEmpresas]             = useState(false);
  const [selectedLogs, setSelectedLogs]           = useState<Set<string>>(new Set());
  const [resumoConfirmado, setResumoConfirmado]   = useState(false);

  useEffect(() => {
    const state = location.state as {
      fromBIA?: boolean;
      screen?: Screen;
      wizardStep?: WizardStep;
      selectAll?: boolean;
      selAllEmpresas?: boolean;
      selAllTops?: boolean;
      selAllParceiros?: boolean;
      initialScreen?: Screen;
      confirm?: boolean;
    } | null;

    if (state?.initialScreen) {
      setScreen(state.initialScreen);
      return;
    }
    if (!state?.fromBIA) return;

    if (state.screen !== undefined) setScreen(state.screen);
    if (state.wizardStep !== undefined) setWizardStep(state.wizardStep);

    if (state.selectAll) {
      const awaitingIds = TABLE_ROWS
        .filter(r => r.sincedays <= 90 && r.status !== "configurado")
        .map(r => r.id);
      setSelected(new Set(awaitingIds));
      setStatusFilter("aguardando");
      setScreen(2);
    }
    if (state.selAllEmpresas) {
      setAllEmpresas(true);
      setEmpresas(prev => prev.map(e => ({ ...e, checked: true })));
    }
    if (state.selAllTops) {
      setTopOpt("all");
    }
    if (state.selAllParceiros) {
      setPartnerOpt("all");
    }
    if (state.confirm) {
      setResumoConfirmado(true);
    }
  }, [location.state]);

  const metrics = useMemo(() => {
    const rows = TABLE_ROWS.filter(r => r.sincedays <= parseInt(period));
    const configurados = rows.filter(r => r.status === "configurado").length;
    const aguardando   = rows.filter(r => r.status !== "configurado").length;
    const totalVol     = rows.reduce((s, r) => s + r.volume, 0);
    return { elegiveis: rows.length, configurados, aguardando, volume: fmtVolume(totalVol) };
  }, [period]);

  const filteredRows = useMemo(() => {
    let rows = TABLE_ROWS.filter(r => r.sincedays <= parseInt(period));
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.ncm.includes(q) || r.descricao.toLowerCase().includes(q));
    }
    if (statusFilter === "aguardando") rows = rows.filter(r => r.status !== "configurado");
    else if (statusFilter !== "todos") rows = rows.filter(r => r.status === statusFilter);
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "ncm")       cmp = a.ncm.localeCompare(b.ncm);
      if (sortKey === "descricao") cmp = a.descricao.localeCompare(b.descricao);
      if (sortKey === "volume")    cmp = a.volume - b.volume;
      if (sortKey === "docs")      cmp = a.docs - b.docs;
      if (sortKey === "status")    cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [search, statusFilter, sortKey, sortDir, period]);

  const filteredTops = useMemo(() => {
    if (!topSearch.trim()) return TOPS_LIST;
    const q = topSearch.toLowerCase();
    return TOPS_LIST.filter(t => t.label.toLowerCase().includes(q) || t.id.includes(q));
  }, [topSearch]);

  const filteredFinalidades = useMemo(() => {
    if (!finalidadeSearch.trim()) return FINALIDADES_LIST;
    const q = finalidadeSearch.toLowerCase();
    return FINALIDADES_LIST.filter(f => f.label.toLowerCase().includes(q) || f.id.includes(q));
  }, [finalidadeSearch]);

  const filteredGrupos = useMemo(() => {
    if (!grupoSearch.trim()) return GRUPOS_PARCEIROS_LIST;
    const q = grupoSearch.toLowerCase();
    return GRUPOS_PARCEIROS_LIST.filter(g => g.label.toLowerCase().includes(q) || g.id.includes(q));
  }, [grupoSearch]);

  const filteredUFs = useMemo(() => {
    if (!ufSearch.trim()) return UFS_LIST;
    const q = ufSearch.toLowerCase();
    return UFS_LIST.filter(u => u.label.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
  }, [ufSearch]);

  const filteredMunicipios = useMemo(() => {
    if (!municipioSearch.trim()) return MUNICIPIOS_LIST;
    const q = municipioSearch.toLowerCase();
    return MUNICIPIOS_LIST.filter(m => m.label.toLowerCase().includes(q) || m.id.includes(q));
  }, [municipioSearch]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function toggleRow(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected(selected.size === filteredRows.length ? new Set() : new Set(filteredRows.map(r => r.id)));
  }
  const allChecked = filteredRows.length > 0 && selected.size === filteredRows.length;

  function toggleEmpresa(id: string) {
    setEmpresas(prev => prev.map(e => e.id === id ? { ...e, checked: !e.checked } : e));
  }
  function handleAllEmpresas(v: boolean) {
    setAllEmpresas(v);
    setEmpresas(prev => prev.map(e => ({ ...e, checked: v })));
  }

  // ── Screen 1 — Dashboard ──────────────────────────────────────────────────
  const screen1 = (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">Exceções da Tributação Integral - IBS/CBS</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Configure as exceções tributárias da Reforma com base no seu histórico real de operações.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
            onClick={() => { setWizardStep(1); setScreen(2); }}>
            <ChevronRight className="h-3.5 w-3.5" />
            Iniciar configuração
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5"
            onClick={() => setScreen(4)}>
            <ScrollText className="h-3.5 w-3.5" />
            Visualizar Logs
          </Button>
        </div>
      </div>

      <SectionCard>
        {/* Cabeçalho do card */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-foreground">Período de análise</p>
          <div className="flex flex-col items-end gap-1">
            <SyncBadge label="Tabela CFF"  date="12/05/2026" nextSync="13/05/2026 às 02:00" />
            <SyncBadge label="Análise DFe" date="12/05/2026" nextSync="13/05/2026 às 04:00" />
          </div>
        </div>

        {/* Seletor de período */}
        <div className="flex gap-2 mb-1.5">
          {(["30", "60", "90"] as Period[]).map(p => {
            const wip = p !== "30";
            return (
              <div key={p} className="relative group">
                <button
                  disabled={wip}
                  onClick={() => !wip && setPeriod(p)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-colors",
                    wip
                      ? "bg-muted border-border text-muted-foreground/50 cursor-not-allowed"
                      : period === p
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                  )}
                >
                  {p} dias{!wip && period === p ? " ✓" : ""}
                  {wip && <span className="ml-1.5 text-[10px]">🚧</span>}
                </button>
                {wip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20 pointer-events-none">
                    <div className="bg-popover text-popover-foreground text-[11px] px-2.5 py-1.5 rounded-md shadow-md border border-border whitespace-nowrap">
                      Em construção
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">
          Analisando documentos fiscais: NF-e · NFC-e · CT-e · CT-eOS · NFS-e · NF-Com
        </p>

        {/* Metric cards dentro do mesmo SectionCard — clicáveis → Diagnóstico */}
        <div className="flex gap-3">
          <MetricCard icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
            label="NCMs/NBS elegíveis identificados" value={String(metrics.elegiveis)}
            sub="no período selecionado" variant="primary"
            onClick={() => { setStatusFilter("todos"); setScreen(2); }} />
          <MetricCard icon={<CheckCircle2 className="h-4 w-4 text-success" />}
            label="Já configurados" value={String(metrics.configurados)}
            sub="com exceção IBS/CBS" variant="success"
            onClick={() => { setStatusFilter("configurado"); setScreen(2); }} />
          <MetricCard icon={<Clock className="h-4 w-4 text-warning" />}
            label="Aguardando configuração" value={String(metrics.aguardando)}
            sub="sem exceção parametrizada" variant="warning"
            highlighted={metrics.aguardando > 0}
            onClick={() => { setStatusFilter("aguardando"); setScreen(2); }} />
          <MetricCard icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            label="Volume total no período" value={metrics.volume}
            sub="últimos 90 dias" variant="muted"
            onClick={() => { setStatusFilter("todos"); setScreen(2); }} />
        </div>
      </SectionCard>
    </div>
  );

  // ── Screen 2 — Diagnóstico ────────────────────────────────────────────────
  const screen2 = (
    <div className="space-y-4">

      <div className="rounded-lg px-4 py-3 flex items-start gap-2 text-[12px] bg-info/10 border border-info/30 text-info">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <span>Sugestões baseadas nas tabelas classTrib e anexos do CFF/SVRS, atualizadas em 12/05/2026.</span>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por NCM, NBS ou descrição..." className="pl-8 text-[12px] h-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="h-9 rounded-md border border-input bg-card px-3 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer">
          <option value="todos">Todos os status</option>
          <option value="sem">Sem exceção</option>
          <option value="parcial">Exc. parcial</option>
          <option value="configurado">Configurado</option>
        </select>
        <select
          value={`${sortKey}_${sortDir}`}
          onChange={e => { const [k, d] = e.target.value.split("_"); setSortKey(k as SortKey); setSortDir(d as SortDir); }}
          className="h-9 rounded-md border border-input bg-card px-3 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer">
          <option value="volume_desc">Ordenar: Volume ↓</option>
          <option value="volume_asc">Volume ↑</option>
          <option value="docs_desc">Qtd. Docs ↓</option>
          <option value="ncm_asc">NCM A-Z</option>
        </select>
      </div>

      <div className="bg-card rounded-lg overflow-hidden border border-border card-shadow">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10 pl-4">
                <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
              </TableHead>
              {([
                { key: "ncm"      , label: "NCM/NBS"     },
                { key: "descricao", label: "Descrição"   },
                { key: "volume"   , label: "Volume (R$)" },
                { key: "docs"     , label: "Qtd. Docs"   },
                { key: "status"   , label: "Status"      },
              ] as { key: SortKey; label: string }[]).map(col => (
                <TableHead key={col.key}
                  className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort(col.key)}>
                  <div className="flex items-center gap-1">
                    {col.label}<ArrowUpDown className="h-3 w-3 opacity-40" />
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map(row => (
              <TableRow key={row.id} className={cn("hover:bg-muted/30 transition-colors", selected.has(row.id) && "bg-primary/5")}>
                <TableCell className="pl-4">
                  <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggleRow(row.id)} />
                </TableCell>
                <TableCell className="font-mono text-[12px] font-semibold text-foreground">{row.ncm}</TableCell>
                <TableCell className="text-[12px] text-foreground">{row.descricao}</TableCell>
                <TableCell className="text-[12px] font-medium text-foreground">{fmtBRL(row.volume)}</TableCell>
                <TableCell className="text-[12px] text-muted-foreground">{fmtNum(row.docs)}</TableCell>
                <TableCell><StatusBadge status={row.status} /></TableCell>
                <TableCell>
                  {row.status === "configurado"
                    ? <button onClick={() => { setWizardStep(1); setScreen(3); }} className="text-[11px] font-semibold px-3 py-1 rounded border border-border text-muted-foreground hover:bg-muted transition-colors">Revisar</button>
                    : <button onClick={() => { setWizardStep(1); setScreen(3); }} className="text-[11px] font-semibold px-3 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity">Configurar</button>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  // ── Screen 3 — Wizard ─────────────────────────────────────────────────────
  function wizardContent() {
    const selectedRows = TABLE_ROWS.filter(r => selected.has(r.id));

    if (wizardStep === 1) return (
      <div className="space-y-4">
        <h2 className="text-[16px] font-bold text-foreground">Para qual UF/Município de destino?</h2>
        <div className="space-y-2">
          {([
            { val: "all",        label: "Todas as UFs/Municípios (sem restrição)", badge: "Recomendado" },
            { val: "ufs",        label: "UFs específicas",                          badge: null          },
            { val: "municipios", label: "Municípios específicos",                   badge: null          },
          ] as const).map(opt => (
            <label key={opt.val}
              className={cn(
                "flex items-center gap-3 border rounded-lg p-3.5 cursor-pointer transition-colors",
                ufMunicOpt === opt.val ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
              )}
              onClick={() => setUfMunicOpt(opt.val)}>
              <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                ufMunicOpt === opt.val ? "border-primary" : "border-muted-foreground/40")}>
                {ufMunicOpt === opt.val && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <span className="text-[13px] font-medium text-foreground flex-1">{opt.label}</span>
              {opt.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">{opt.badge}</span>}
            </label>
          ))}
        </div>
        {ufMunicOpt === "ufs" && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input value={ufSearch} onChange={e => setUfSearch(e.target.value)} placeholder="Buscar UF..." className="pl-8 text-[12px] h-9" />
            </div>
            <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
              {filteredUFs.map(uf => (
                <div key={uf.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Checkbox checked={selectedUFs.has(uf.id)}
                    onCheckedChange={() => setSelectedUFs(prev => { const n = new Set(prev); n.has(uf.id) ? n.delete(uf.id) : n.add(uf.id); return n; })} />
                  <span className="text-[11px] text-muted-foreground w-8 shrink-0 font-mono">{uf.id}</span>
                  <span className="text-[12px] text-foreground">{uf.label}</span>
                </div>
              ))}
              {filteredUFs.length === 0 && <p className="text-[12px] text-muted-foreground text-center py-4">Nenhum resultado encontrado.</p>}
            </div>
          </div>
        )}
        {ufMunicOpt === "municipios" && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input value={municipioSearch} onChange={e => setMunicipioSearch(e.target.value)} placeholder="Buscar município..." className="pl-8 text-[12px] h-9" />
            </div>
            <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
              {filteredMunicipios.map(mun => (
                <div key={mun.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Checkbox checked={selectedMunicipios.has(mun.id)}
                    onCheckedChange={() => setSelectedMunicipios(prev => { const n = new Set(prev); n.has(mun.id) ? n.delete(mun.id) : n.add(mun.id); return n; })} />
                  <span className="text-[11px] text-muted-foreground w-16 shrink-0 font-mono">{mun.id}</span>
                  <span className="text-[12px] text-foreground">{mun.label}</span>
                </div>
              ))}
              {filteredMunicipios.length === 0 && <p className="text-[12px] text-muted-foreground text-center py-4">Nenhum resultado encontrado.</p>}
            </div>
          </div>
        )}
      </div>
    );

    if (wizardStep === 2) return (
      <div className="space-y-4">
        <h2 className="text-[16px] font-bold text-foreground">Confirme os NCMs/NBS para configuração</h2>
        <div className="space-y-3">
          {selectedRows.map(row => (
            <div key={row.id} className="border border-border rounded-lg p-4 flex items-start gap-3">
              <Checkbox defaultChecked className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[13px] font-bold text-foreground">{row.ncm}</span>
                    <span className="text-[13px] text-foreground ml-2">— {row.descricao}</span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full whitespace-nowrap">
                    {fmtBRL(row.volume)} · {fmtNum(row.docs)} docs
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  cClassTrib atual: <span className="font-medium">Não configurado</span>
                </p>
                <p className="text-[11px] mt-0.5 text-success flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  cClassTrib sugerida pelo CFF: <strong className="ml-1">{row.sugestao}</strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    if (wizardStep === 3) return (
      <div className="space-y-4">
        <h2 className="text-[16px] font-bold text-foreground">Para quais empresas aplicar a exceção?</h2>
        <Toggle checked={allEmpresas} onChange={handleAllEmpresas} label="Selecionar todas as empresas do grupo" />
        <div className="space-y-2">
          {empresas.map(e => (
            <div key={e.id} className="border border-border rounded-lg p-3.5 flex items-center gap-3">
              <Checkbox checked={e.checked} onCheckedChange={() => toggleEmpresa(e.id)} />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground">{e.nome}</p>
                <p className="text-[11px] text-muted-foreground">CNPJ {e.cnpj}</p>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{e.docs}</span>
            </div>
          ))}
        </div>
      </div>
    );

    if (wizardStep === 4) return (
      <div className="space-y-4">
        <h2 className="text-[16px] font-bold text-foreground">Para quais tipos de operação?</h2>
        <div className="space-y-2">
          {([
            { val: "all",        label: "Todas as TOPs (sem restrição)", badge: "Recomendado" },
            { val: "specific",   label: "TOPs específicas",              badge: null          },
            { val: "finalidade", label: "Finalidade da operação",        badge: null          },
          ] as const).map(opt => (
            <label key={opt.val}
              className={cn(
                "flex items-center gap-3 border rounded-lg p-3.5 cursor-pointer transition-colors",
                topOpt === opt.val ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
              )}
              onClick={() => setTopOpt(opt.val)}>
              <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                topOpt === opt.val ? "border-primary" : "border-muted-foreground/40")}>
                {topOpt === opt.val && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <span className="text-[13px] font-medium text-foreground flex-1">{opt.label}</span>
              {opt.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">{opt.badge}</span>}
            </label>
          ))}
        </div>
        {topOpt === "specific" && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input value={topSearch} onChange={e => setTopSearch(e.target.value)} placeholder="Buscar tipo de operação..." className="pl-8 text-[12px] h-9" />
            </div>
            <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
              {filteredTops.map(top => (
                <div key={top.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Checkbox checked={selectedTops.has(top.id)}
                    onCheckedChange={() => setSelectedTops(prev => { const n = new Set(prev); n.has(top.id) ? n.delete(top.id) : n.add(top.id); return n; })} />
                  <span className="text-[11px] text-muted-foreground w-5 shrink-0">{top.id}</span>
                  <span className="text-[12px] text-foreground">{top.label}</span>
                </div>
              ))}
              {filteredTops.length === 0 && <p className="text-[12px] text-muted-foreground text-center py-4">Nenhum resultado encontrado.</p>}
            </div>
          </div>
        )}
        {topOpt === "finalidade" && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input value={finalidadeSearch} onChange={e => setFinalidadeSearch(e.target.value)} placeholder="Buscar finalidade da operação..." className="pl-8 text-[12px] h-9" />
            </div>
            <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
              {filteredFinalidades.map(fin => (
                <div key={fin.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Checkbox checked={selectedFinalidades.has(fin.id)}
                    onCheckedChange={() => setSelectedFinalidades(prev => { const n = new Set(prev); n.has(fin.id) ? n.delete(fin.id) : n.add(fin.id); return n; })} />
                  <span className="text-[11px] text-muted-foreground w-5 shrink-0">{fin.id}</span>
                  <span className="text-[12px] text-foreground">{fin.label}</span>
                </div>
              ))}
              {filteredFinalidades.length === 0 && <p className="text-[12px] text-muted-foreground text-center py-4">Nenhum resultado encontrado.</p>}
            </div>
          </div>
        )}
      </div>
    );

    if (wizardStep === 5) return (
      <div className="space-y-4">
        <h2 className="text-[16px] font-bold text-foreground">Para quais parceiros aplicar?</h2>
        <div className="space-y-2">
          {([
            { val: "all",      label: "Todos os parceiros (sem restrição)", badge: "Recomendado" },
            { val: "specific", label: "Parceiros específicos",               badge: null           },
            { val: "group",    label: "Grupo de parceiros cadastrado",        badge: null           },
          ] as const).map(opt => (
            <label key={opt.val}
              className={cn(
                "flex items-center gap-3 border rounded-lg p-3.5 cursor-pointer transition-colors",
                partnerOpt === opt.val ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
              )}
              onClick={() => setPartnerOpt(opt.val)}>
              <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                partnerOpt === opt.val ? "border-primary" : "border-muted-foreground/40")}>
                {partnerOpt === opt.val && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <span className="text-[13px] font-medium text-foreground flex-1">{opt.label}</span>
              {opt.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">{opt.badge}</span>}
            </label>
          ))}
        </div>
        {partnerOpt === "specific" && (
          <div className="space-y-2">
            <Input placeholder="Buscar parceiro..." className="text-[12px] h-9" />
            <div className="border border-border rounded-lg divide-y divide-border">
              {["Distribuidora XYZ Ltda", "Comércio ABC S.A.", "Ind. Nacional Eireli"].map(p => (
                <div key={p} className="flex items-center gap-3 px-3 py-2.5">
                  <Checkbox />
                  <span className="text-[12px] text-foreground">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {partnerOpt === "group" && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input value={grupoSearch} onChange={e => setGrupoSearch(e.target.value)} placeholder="Buscar grupo de parceiros..." className="pl-8 text-[12px] h-9" />
            </div>
            <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
              {filteredGrupos.map(grupo => (
                <div key={grupo.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Checkbox checked={selectedGrupos.has(grupo.id)}
                    onCheckedChange={() => setSelectedGrupos(prev => { const n = new Set(prev); n.has(grupo.id) ? n.delete(grupo.id) : n.add(grupo.id); return n; })} />
                  <span className="text-[11px] text-muted-foreground w-8 shrink-0">{grupo.id}</span>
                  <span className="text-[12px] text-foreground">{grupo.label}</span>
                </div>
              ))}
              {filteredGrupos.length === 0 && <p className="text-[12px] text-muted-foreground text-center py-4">Nenhum resultado encontrado.</p>}
            </div>
          </div>
        )}
      </div>
    );

    // ── Etapa 6: Resumo/Conclusão ─────────────────────────────────────────────
    const resumeItems = selectedRows.map(row => ({
      ncm: row.ncm,
      desc: row.descricao,
      action: row.status === "parcial" ? "ATUALIZAR" : "INCLUIR",
      actionCls: row.status === "parcial"
        ? "bg-warning text-warning-foreground"
        : "bg-success text-success-foreground",
    }));

    if (wizardStep === 6) return (
      <ResumoConcluso
        selectedRows={selectedRows}
        resumeItems={resumeItems}
        logOpen={logOpen}
        setLogOpen={setLogOpen}
        confirmed={resumoConfirmado}
        onConfirm={() => setResumoConfirmado(true)}
        onConcluir={() => { setScreen(1); setWizardStep(1); setResumoConfirmado(false); }}
      />
    );

    return null;
  }

  const screen3 = (
    <div className="space-y-4">
      {wizardStep === 6 && resumoConfirmado && (
        <div className="rounded-lg px-4 py-2.5 flex items-center gap-2 text-[12px] bg-warning/10 border border-warning/30 text-warning">
          <span>💡</span>
          <span><strong>Dica:</strong> Retorne ao Diagnóstico para configurar os 32 NCMs/NBS restantes. Volume estimado sem configuração: R$ 9,2M</span>
        </div>
      )}
      <SectionCard>
        {wizardContent()}
      </SectionCard>
    </div>
  );

  // ── Screen 4 — Log de Operações ───────────────────────────────────────────
  const logsConcluidosIds = LOG_ENTRIES.filter(e => e.status === "Sucesso").map(e => e.id);
  const allLogsConcluidos = logsConcluidosIds.length > 0 && logsConcluidosIds.every(id => selectedLogs.has(id));

  function toggleLog(id: string) {
    setSelectedLogs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAllLogs() {
    setSelectedLogs(allLogsConcluidos ? new Set() : new Set(logsConcluidosIds));
  }

  const screen4 = (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-bold text-foreground">Log de Operações</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Histórico de execuções de configuração de exceções tributárias IBS/CBS.
        </p>
      </div>

      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <button
          disabled={selectedLogs.size === 0}
          onClick={() => setShowUndo(true)}
          className="px-4 py-2 rounded-lg border border-destructive text-destructive text-[13px] font-medium flex items-center gap-2 hover:bg-destructive/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <RotateCcw className="h-3.5 w-3.5" />
          Desfazer{selectedLogs.size > 0 ? ` (${selectedLogs.size} selecionado${selectedLogs.size > 1 ? "s" : ""})` : ""}
        </button>
        {selectedLogs.size === 0 && (
          <span className="text-[11px] text-muted-foreground">Selecione registros concluídos para desfazer</span>
        )}
      </div>

      <div className="bg-card rounded-lg overflow-hidden border border-border card-shadow">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10 pl-4">
                <Checkbox
                  checked={allLogsConcluidos}
                  onCheckedChange={toggleAllLogs}
                  title="Selecionar todos os concluídos"
                />
              </TableHead>
              {[
                "ID Execução", "Usuário", "Data/Hora",
                "Versão tabela CFF", "Tempo de execução", "Registros gravados", "Status",
              ].map(h => (
                <TableHead key={h} className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {LOG_ENTRIES.map(entry => {
              const selectable = entry.status === "Sucesso";
              return (
                <TableRow
                  key={entry.id}
                  className={cn(
                    "transition-colors",
                    selectable ? "hover:bg-muted/30 cursor-pointer" : "opacity-60",
                    selectedLogs.has(entry.id) && "bg-primary/5"
                  )}
                  onClick={() => selectable && toggleLog(entry.id)}
                >
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={selectedLogs.has(entry.id)}
                      disabled={!selectable}
                      onCheckedChange={() => selectable && toggleLog(entry.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-[12px] font-semibold text-foreground">{entry.id}</TableCell>
                  <TableCell className="text-[12px] text-foreground">{entry.usuario}</TableCell>
                  <TableCell className="font-mono text-[12px] text-foreground">{entry.dataHora}</TableCell>
                  <TableCell className="font-mono text-[12px] text-foreground">{entry.versaoCFF}</TableCell>
                  <TableCell className="text-[12px] text-foreground">{entry.tempo}</TableCell>
                  <TableCell className="text-[12px] text-foreground">{entry.registros}</TableCell>
                  <TableCell><LogStatusBadge status={entry.status} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const screens: Record<Screen, React.ReactNode> = { 1: screen1, 2: screen2, 3: screen3, 4: screen4 };


  return (
    <div className="min-h-full p-6 bg-background">
      <div className="max-w-4xl mx-auto">

        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-background border-b -mx-6 -mt-6 px-6 py-3 mb-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2 flex-wrap">
            <span>Configurações</span>
            <ChevronRight className="h-3 w-3" />
            <span>Assistentes</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Exceções da Tributação Integral - IBS/CBS</span>
          </div>

          {/* Título + botões de ação — oculto para screen 1 (título fica no conteúdo) */}
          {screen !== 1 && (
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h1 className="text-[16px] font-semibold text-foreground leading-tight">
                {screen === 2 && "Diagnóstico — NCMs/NBS que precisam de atenção"}
                {screen === 3 && "Wizard de Configuração"}
                {screen === 4 && "Log de Operações"}
              </h1>
              {screen === 3 && (
                <p className="text-[11px] text-muted-foreground mt-0.5">Etapa {wizardStep} de 6</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {screen === 2 && (
                <>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"
                    onClick={() => setScreen(1)}>
                    <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                    Voltar
                  </Button>
                  <Button size="sm" disabled={selected.size === 0}
                    onClick={() => { if (selected.size > 0) { setWizardStep(1); setScreen(3); } }}>
                    Configurar selecionados ({selected.size})
                  </Button>
                </>
              )}
              {screen === 3 && (
                <>
                  {!resumoConfirmado && (
                    <>
                      <Button variant="ghost" size="sm" className="text-muted-foreground"
                        onClick={() => wizardStep > 1 ? setWizardStep(s => (s - 1) as WizardStep) : setScreen(2)}>
                        Voltar
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground"
                        onClick={() => setScreen(2)}>
                        Cancelar
                      </Button>
                    </>
                  )}
                  {wizardStep <= 5 ? (
                    <Button size="sm"
                      onClick={() => setWizardStep(s => (s + 1) as WizardStep)}>
                      {`Próximo: ${WIZARD_STEP_LABELS[wizardStep - 1]} →`}
                    </Button>
                  ) : resumoConfirmado ? (
                    <Button size="sm"
                      onClick={() => { setScreen(1); setWizardStep(1); setResumoConfirmado(false); }}>
                      Concluir
                    </Button>
                  ) : (
                    <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90 gap-1.5"
                      onClick={() => setResumoConfirmado(true)}>
                      <CheckCheck className="h-3.5 w-3.5" /> Confirmar e Gravar
                    </Button>
                  )}
                </>
              )}
              {screen === 4 && (
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"
                  onClick={() => setScreen(1)}>
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                  Voltar
                </Button>
              )}
            </div>
          </div>
          )}

          {/* Indicador de etapas — apenas no wizard */}
          {screen === 3 && <WizardProgress step={wizardStep} />}
        </div>


        {screens[screen]}
      </div>

      {/* Modal: Desfazer */}
      <Dialog open={showUndo} onOpenChange={setShowUndo}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[16px]">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Desfazer configuração
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground mt-1">
              Tem certeza que deseja desfazer? Esta ação removerá as <strong>3 exceções gravadas</strong> nesta sessão.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowUndo(false)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1"
              onClick={() => { setShowUndo(false); setScreen(2); setWizardStep(1); }}>
              Confirmar desfazer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
