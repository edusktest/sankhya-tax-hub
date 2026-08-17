import { useState, useMemo, useRef } from "react";
import {
  CheckCircle2, ChevronRight, Building2, FileText, Info,
  Layers, Calendar, Search, Percent, Plus,
  MoreHorizontal, Pencil, PowerOff, Power, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen      = "landing" | "nova-top" | "editar" | "success";
type TopMode     = "choose" | "criar" | "vincular";
type Step        = 1 | 2 | 3 | 4 | 5;
type SuccessMode = "criada" | "atualizada" | "inativada" | "reativada";

interface Empresa {
  id: string; cod: number; nome: string; cnpj: string;
}
interface SubtipoDebito {
  cod: string; label: string; descricao: string; topSugerida: string; suportado: boolean; cfopSugerido: string;
}
interface TopConfigurada {
  id: string;
  codTop: number;
  subtipo: string;
  nomeTop: string;
  cfop: string;
  aliqIBS: string;
  aliqCBS: string;
  cst: string;
  cClassTrib: string;
  vigencia: string;
  empresaIds: string[];
  serieEmpresas: Record<string, string>;
  tipoNegociacao: string;
  finalidadeOp: string;
  naturezaOp: string;
  centroResultado: string;
  projeto: string;
  status: "ativa" | "inativa";
  criadoEm: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SUBTIPOS_DEBITO: SubtipoDebito[] = [
  { cod: "01", label: "Transferência de créditos para Cooperativas",          descricao: "NF-e de Débito para transferência de créditos de IBS/CBS a cooperativas.",                                                              topSugerida: "NF DEB IBS/CBS - Transf. Crédito Cooperativa", suportado: false, cfopSugerido: "5.949" },
  { cod: "02", label: "Anulação de Crédito por Saídas Imunes/Isentas",        descricao: "NF-e de Débito para anular créditos de IBS/CBS em decorrência de saídas com imunidade ou isenção.",                                      topSugerida: "NF DEB IBS/CBS - Anulação Crédito Isento",     suportado: false, cfopSugerido: "5.949" },
  { cod: "03", label: "Débitos de NFs não processadas na apuração",            descricao: "NF-e de Débito para regularizar documentos fiscais não processados na apuração de IBS/CBS.",                                             topSugerida: "NF DEB IBS/CBS - NF Não Processadas",          suportado: false, cfopSugerido: "5.949" },
  { cod: "04", label: "Multa e juros",                                         descricao: "NF-e de Débito para registro de multa e juros sobre IBS/CBS não recolhidos no prazo.",                                                    topSugerida: "NF DEB IBS/CBS - Multa e Juros",               suportado: true,  cfopSugerido: "5.949" },
  { cod: "05", label: "Transferência de crédito na sucessão",                  descricao: "NF-e de Débito para transferência de créditos de IBS/CBS em processos de sucessão empresarial.",                                         topSugerida: "NF DEB IBS/CBS - Transf. Crédito Sucessão",    suportado: false, cfopSugerido: "5.949" },
  { cod: "06", label: "Pagamento antecipado",                                  descricao: "NF-e de Débito emitida pelo contribuinte em função de antecipação de pagamento de IBS/CBS.",                                             topSugerida: "NF DEB IBS/CBS - Pagamento Antecipado",        suportado: true,  cfopSugerido: "5.949" },
  { cod: "07", label: "Perda em estoque (Perecimento, Perda, Furto, Roubo)",   descricao: "NF-e de Débito para estorno de créditos de IBS/CBS por perda, perecimento, furto ou roubo de mercadorias.",                             topSugerida: "NF DEB IBS/CBS - Perda em Estoque",            suportado: false, cfopSugerido: "5.949" },
  { cod: "08", label: "Desenquadramento do Simples Nacional",                  descricao: "NF-e de Débito em função do desenquadramento do regime do Simples Nacional para regularização de IBS/CBS.",                              topSugerida: "NF DEB IBS/CBS - Desenquadramento SN",         suportado: false, cfopSugerido: "5.949" },
];

const SUBTIPOS_SUPORTADOS = SUBTIPOS_DEBITO.filter(s => s.suportado);

interface CstOpcao { cst: string; descricao: string; }

const CST_OPCOES: CstOpcao[] = [
  { cst: "000", descricao: "Tributação integral"                      },
  { cst: "010", descricao: "Tributação com alíquotas uniformes"       },
  { cst: "011", descricao: "Tributação com alíquotas uniformes reduzidas" },
  { cst: "200", descricao: "Alíquota reduzida"                        },
  { cst: "220", descricao: "Alíquota fixa"                            },
  { cst: "221", descricao: "Alíquota fixa proporcional"               },
  { cst: "222", descricao: "Redução de base de cálculo"               },
  { cst: "400", descricao: "Isenção"                                  },
  { cst: "410", descricao: "Imunidade e não incidência"               },
  { cst: "510", descricao: "Diferimento"                              },
  { cst: "515", descricao: "Diferimento com redução de alíquota"      },
  { cst: "550", descricao: "Suspensão"                                },
  { cst: "620", descricao: "Tributação monofásica"                    },
  { cst: "800", descricao: "Transferência de crédito"                 },
  { cst: "810", descricao: "Ajuste de IBS na ZFM"                    },
  { cst: "811", descricao: "Ajustes"                                  },
  { cst: "820", descricao: "Tributação em documento específico"       },
  { cst: "830", descricao: "Exclusão de base de cálculo"             },
];

interface CClassTribOpcao { cClassTrib: string; descricao: string; }

const CCLASS_OPCOES: CClassTribOpcao[] = [
  // 000 - Tributação integral
  { cClassTrib: "000001", descricao: "Situações tributadas integralmente pelo IBS e CBS." },
  { cClassTrib: "000002", descricao: "Exploração de via" },
  { cClassTrib: "000003", descricao: "Regime automotivo - projetos incentivados (art. 311)" },
  { cClassTrib: "000004", descricao: "Regime automotivo - projetos incentivados (art. 312)" },
  { cClassTrib: "000005", descricao: "Operação com EAC destinado à mistura com gasolina A, mas com saída do biocombustível com destinação diversa" },
  // 010 - Tributação com alíquotas uniformes
  { cClassTrib: "010001", descricao: "Operações do FGTS não realizadas pela Caixa Econômica Federal" },
  { cClassTrib: "010002", descricao: "Operações do serviço financeiro" },
  // 011 - Tributação com alíquotas uniformes reduzidas
  { cClassTrib: "011001", descricao: "Planos de assistência funerária." },
  { cClassTrib: "011002", descricao: "Planos de assistência à saúde" },
  { cClassTrib: "011003", descricao: "Intermediação de planos de assistência à saúde" },
  { cClassTrib: "011004", descricao: "Concursos e prognósticos" },
  { cClassTrib: "011005", descricao: "Planos de assistência à saúde de animais domésticos" },
  // 200 - Alíquota reduzida
  { cClassTrib: "200001", descricao: "Serviços de transporte de bens até as zonas de processamento de exportação e bens exportados a partir das zonas de processamento de exportação" },
  { cClassTrib: "200002", descricao: "Fornecimento ou importação para produtor rural não contribuinte ou TAC" },
  { cClassTrib: "200003", descricao: "Vendas de produtos destinados à alimentação humana (Anexo I)" },
  { cClassTrib: "200004", descricao: "Fornecimento de dispositivos médicos (Anexo XII)" },
  { cClassTrib: "200005", descricao: "Fornecimento de dispositivos médicos para órgãos da administração pública e entidades de saúde imunes (Anexo IV)" },
  { cClassTrib: "200006", descricao: "Situação de emergência de saúde pública reconhecida pelo Poder público" },
  { cClassTrib: "200007", descricao: "Fornecimento dos dispositivos de acessibilidade próprios para pessoas com deficiência (Anexo XIII)" },
  { cClassTrib: "200008", descricao: "Fornecimento dos dispositivos de acessibilidade próprios para pessoas com deficiência adquiridos por órgãos da administração pública (Anexo V)" },
  { cClassTrib: "200009", descricao: "Fornecimento dos medicamentos registrados na Anvisa" },
  { cClassTrib: "200010", descricao: "Fornecimento dos medicamentos registrados na Anvisa, adquiridos por órgãos da administração pública" },
  { cClassTrib: "200011", descricao: "Fornecimento das composições para nutrição enteral e parenteral quando adquiridas por órgãos da administração pública (Anexo VI)" },
  { cClassTrib: "200012", descricao: "Situação de emergência de saúde pública reconhecida pelo Poder público" },
  { cClassTrib: "200013", descricao: "Fornecimento de tampões higiênicos, absorventes higiênicos internos ou externos" },
  { cClassTrib: "200014", descricao: "Fornecimento dos produtos hortícolas, frutas e ovos (Anexo XV)" },
  { cClassTrib: "200015", descricao: "Venda de automóveis de passageiros de fabricação nacional adquiridos por motoristas profissionais ou pessoas com deficiência" },
  { cClassTrib: "200016", descricao: "Prestação de serviços de pesquisa e desenvolvimento por Instituição Científica, Tecnológica e de Inovação (ICT)" },
  { cClassTrib: "200017", descricao: "Operações relacionadas ao FGTS" },
  { cClassTrib: "200018", descricao: "Operações de resseguro e retrocessão" },
  { cClassTrib: "200019", descricao: "Importador dos serviços financeiros contribuinte" },
  { cClassTrib: "200020", descricao: "Operação praticada por sociedades cooperativas optantes por regime específico do IBS e CBS" },
  { cClassTrib: "200021", descricao: "Serviços de transporte público coletivo de passageiros ferroviário e hidroviário" },
  { cClassTrib: "200022", descricao: "Operação originada fora da ZFM que destine bem material industrializado a contribuinte estabelecido na ZFM" },
  { cClassTrib: "200023", descricao: "Operação realizada por indústria incentivada que destine bem material intermediário para outra indústria incentivada na ZFM" },
  { cClassTrib: "200024", descricao: "Operação originada fora das Áreas de Livre Comércio destinadas a contribuinte estabelecido nas Áreas de Livre Comércio" },
  { cClassTrib: "200025", descricao: "Fornecimento dos serviços de educação relacionados ao Programa Universidade para Todos (Prouni)" },
  { cClassTrib: "200026", descricao: "Locação de imóveis localizados nas zonas reabilitadas" },
  { cClassTrib: "200027", descricao: "Operações de locação, cessão onerosa e arrendamento de bens imóveis" },
  { cClassTrib: "200028", descricao: "Fornecimento dos serviços de educação (Anexo II)" },
  { cClassTrib: "200029", descricao: "Fornecimento dos serviços de saúde humana (Anexo III)" },
  { cClassTrib: "200030", descricao: "Venda dos dispositivos médicos (Anexo IV)" },
  { cClassTrib: "200031", descricao: "Fornecimento dos dispositivos de acessibilidade próprios para pessoas com deficiência (Anexo V)" },
  { cClassTrib: "200032", descricao: "Fornecimento dos medicamentos registrados na Anvisa ou produzidos por farmácias de manipulação, ressalvados os medicamentos sujeitos à alíquota zero" },
  { cClassTrib: "200033", descricao: "Fornecimento das composições para nutrição enteral e parenteral (Anexo VI)" },
  { cClassTrib: "200034", descricao: "Fornecimento dos alimentos destinados ao consumo humano (Anexo VII)" },
  { cClassTrib: "200035", descricao: "Fornecimento dos produtos de higiene pessoal e limpeza (Anexo VIII)" },
  { cClassTrib: "200036", descricao: "Fornecimento de produtos agropecuários, aquícolas, pesqueiros, florestais e extrativistas vegetais in natura" },
  { cClassTrib: "200037", descricao: "Fornecimento de serviços ambientais de conservação ou recuperação da vegetação nativa" },
  { cClassTrib: "200038", descricao: "Fornecimento dos insumos agropecuários e aquícolas (Anexo IX)" },
  { cClassTrib: "200039", descricao: "Fornecimento dos bens e serviços relacionados com produções nacionais artísticas, culturais, de eventos, jornalísticas e audiovisuais (Anexo X)" },
  { cClassTrib: "200040", descricao: "Fornecimento de serviços de comunicação institucional à administração pública" },
  { cClassTrib: "200041", descricao: "Fornecimento de serviço de educação desportiva (art. 141. I)" },
  { cClassTrib: "200042", descricao: "Fornecimento de serviço de gestão e exploração do desporto (art. 141. II)" },
  { cClassTrib: "200043", descricao: "Fornecimento à administração pública dos serviços e dos bens relativos à soberania (Anexo XI)" },
  { cClassTrib: "200044", descricao: "Operações e prestações de serviços de segurança da informação e segurança cibernética desenvolvidos por sociedade que tenha sócio brasileiro (Anexo XI)" },
  { cClassTrib: "200045", descricao: "Operações relacionadas a projetos de reabilitação urbana de zonas históricas e de áreas críticas de recuperação e reconversão urbanística" },
  { cClassTrib: "200046", descricao: "Operações com bens imóveis" },
  { cClassTrib: "200047", descricao: "Bares e Restaurantes" },
  { cClassTrib: "200048", descricao: "Hotelaria, Parques de Diversão e Parques Temáticos" },
  { cClassTrib: "200049", descricao: "Transporte coletivo de passageiros rodoviário, ferroviário e hidroviário" },
  { cClassTrib: "200050", descricao: "Serviços de transporte aéreo regional coletivo de passageiros ou de carga" },
  { cClassTrib: "200051", descricao: "Agências de Turismo" },
  { cClassTrib: "200052", descricao: "Prestação de serviços de profissões intelectuais" },
  { cClassTrib: "200053", descricao: "Fornecimento de medicamentos registrados na Anvisa, quando classificados como soros ou vacinas" },
  { cClassTrib: "200054", descricao: "Fornecimento de bem material pela cooperativa de produção agropecuária a associado não sujeito ao regime regular do IBS e da CBS" },
  // 220 - Alíquota fixa
  { cClassTrib: "220001", descricao: "Incorporação imobiliária submetida ao regime especial de tributação" },
  { cClassTrib: "220002", descricao: "Incorporação imobiliária submetida ao regime especial de tributação" },
  { cClassTrib: "220003", descricao: "Alienação de imóvel decorrente de parcelamento do solo" },
  // 221 - Alíquota fixa proporcional
  { cClassTrib: "221001", descricao: "Locação, cessão onerosa ou arrendamento de bem imóvel com alíquota sobre a receita bruta" },
  { cClassTrib: "221002", descricao: "Incorporação imobiliária submetida ao regime especial de tributação" },
  { cClassTrib: "221003", descricao: "Incorporação imobiliária submetida ao regime especial de tributação" },
  { cClassTrib: "221004", descricao: "Alienação de imóvel decorrente de parcelamento do solo" },
  // 222 - Redução de base de cálculo
  { cClassTrib: "222001", descricao: "Transporte internacional de passageiros, caso os trechos de ida e volta sejam vendidos em conjunto" },
  // 400 - Isenção
  { cClassTrib: "400001", descricao: "Fornecimento de serviços de transporte público coletivo de passageiros rodoviário e metroviário" },
  { cClassTrib: "400002", descricao: "Fornecimento de serviços de transporte público coletivo de passageiros rodoviário e metroviário com medição por quilômetro rodado" },
  // 410 - Imunidade e não incidência
  { cClassTrib: "410001", descricao: "Fornecimento de bonificações quando constem no documento fiscal e que não dependam de evento posterior" },
  { cClassTrib: "410002", descricao: "Transferências entre estabelecimentos pertencentes ao mesmo contribuinte" },
  { cClassTrib: "410003", descricao: "Doações sem contraprestação em benefício do doador" },
  { cClassTrib: "410004", descricao: "Exportações de bens e serviços" },
  { cClassTrib: "410005", descricao: "Fornecimentos realizados pela União, pelos Estados, pelo Distrito Federal e pelos Municípios" },
  { cClassTrib: "410006", descricao: "Fornecimentos realizados por entidades religiosas e templos de qualquer culto" },
  { cClassTrib: "410007", descricao: "Fornecimentos realizados por partidos políticos, entidades sindicais e instituições de educação e de assistência social" },
  { cClassTrib: "410008", descricao: "Fornecimentos de livros, jornais, periódicos e do papel destinado a sua impressão" },
  { cClassTrib: "410009", descricao: "Fornecimentos de fonogramas e videofonogramas musicais produzidos no Brasil" },
  { cClassTrib: "410010", descricao: "Fornecimentos de serviço de comunicação nas modalidades de radiodifusão sonora e de sons e imagens de recepção livre e gratuita" },
  { cClassTrib: "410011", descricao: "Fornecimentos de ouro, quando definido em lei como ativo financeiro ou instrumento cambial" },
  { cClassTrib: "410012", descricao: "Fornecimento de condomínio edilício não optante pelo regime regular" },
  { cClassTrib: "410013", descricao: "Exportações de combustíveis" },
  { cClassTrib: "410014", descricao: "Fornecimento de produtor rural não contribuinte" },
  { cClassTrib: "410015", descricao: "Fornecimento por transportador autônomo não contribuinte" },
  { cClassTrib: "410016", descricao: "Fornecimento ou aquisição de resíduos sólidos" },
  { cClassTrib: "410017", descricao: "Aquisição de bem móvel com crédito presumido sob condição de revenda realizada" },
  { cClassTrib: "410018", descricao: "Operações relacionadas aos fundos garantidores e executores de políticas públicas" },
  { cClassTrib: "410019", descricao: "Exclusão da gorjeta na base de cálculo no fornecimento de alimentação" },
  { cClassTrib: "410020", descricao: "Exclusão do valor de intermediação na base de cálculo no fornecimento de alimentação" },
  { cClassTrib: "410021", descricao: "Contribuição de que trata o art. 149-A da Constituição Federal" },
  { cClassTrib: "410022", descricao: "Consolidação da propriedade do bem pelo credor" },
  { cClassTrib: "410023", descricao: "Alienação de bens móveis ou imóveis que tenham sido objeto de garantia em que o prestador da garantia não seja contribuinte" },
  { cClassTrib: "410024", descricao: "Consolidação da propriedade do bem pelo grupo de consórcio" },
  { cClassTrib: "410025", descricao: "Alienação de bem que tenha sido objeto de garantia em que o prestador da garantia não seja contribuinte" },
  { cClassTrib: "410026", descricao: "Doação com anulação de crédito" },
  { cClassTrib: "410027", descricao: "Exportação de serviço ou de bem imaterial" },
  { cClassTrib: "410028", descricao: "Operações com bens imóveis realizadas por pessoas físicas não consideradas contribuintes" },
  { cClassTrib: "410029", descricao: "Operações acobertadas somente pelo ICMS" },
  { cClassTrib: "410030", descricao: "Estorno de crédito por perecimento, deteriorização, roubo, furto ou extravio." },
  { cClassTrib: "410031", descricao: "Fornecimento em período anterior ao início de vigência de incidências de CBS e IBS" },
  { cClassTrib: "410032", descricao: "Tributos incidentes na operação que não integram a base de cálculo do IBS e da CBS" },
  { cClassTrib: "410033", descricao: "Operações de Fundos de Investimento Imobiliário (FII) e Fundos de Investimento nas Cadeias Produtivas do Agronegócio (Fiagro)" },
  { cClassTrib: "410034", descricao: "Operações de fundos de investimento" },
  { cClassTrib: "410035", descricao: "Fornecimento realizado por nanoempreendedor" },
  { cClassTrib: "410036", descricao: "Descontos incondicionais" },
  { cClassTrib: "410037", descricao: "Importação os bens materiais sem incidência de IBS e CBS" },
  { cClassTrib: "410999", descricao: "Operações não onerosas sem previsão de tributação, não especificadas anteriormente" },
  // 510 - Diferimento
  { cClassTrib: "510001", descricao: "Operações, sujeitas a diferimento, com energia elétrica, relativas à importação, geração, comercialização, distribuição e transmissão" },
  // 515 - Diferimento com redução de alíquota
  { cClassTrib: "515001", descricao: "Operações, sujeitas a diferimento, com insumos agropecuários e aquícolas (Anexo IX)" },
  // 550 - Suspensão
  { cClassTrib: "550001", descricao: "Exportações de bens materiais" },
  { cClassTrib: "550002", descricao: "Regime de Trânsito" },
  { cClassTrib: "550003", descricao: "Regimes de Depósito (art. 85)" },
  { cClassTrib: "550004", descricao: "Regimes de Depósito (art. 87)" },
  { cClassTrib: "550005", descricao: "Regimes de Depósito (art. 87, Parágrafo único)" },
  { cClassTrib: "550006", descricao: "Regimes de Permanência Temporária" },
  { cClassTrib: "550007", descricao: "Regimes de Aperfeiçoamento" },
  { cClassTrib: "550008", descricao: "Importação de bens para o Regime de Repetro-Temporário" },
  { cClassTrib: "550009", descricao: "GNL-Temporário" },
  { cClassTrib: "550010", descricao: "Repetro-Permanente" },
  { cClassTrib: "550011", descricao: "Repetro-Industrialização" },
  { cClassTrib: "550012", descricao: "Repetro-Nacional" },
  { cClassTrib: "550013", descricao: "Repetro-Entreposto" },
  { cClassTrib: "550014", descricao: "Zona de Processamento de Exportação" },
  { cClassTrib: "550015", descricao: "Regime Tributário para Incentivo à Modernização e à Ampliação da Estrutura Portuária" },
  { cClassTrib: "550016", descricao: "Regime Especial de Incentivos para o Desenvolvimento da Infraestrutura" },
  { cClassTrib: "550017", descricao: "Regime Tributário para Incentivo à Atividade Naval - Renaval (Art. 107, I)" },
  { cClassTrib: "550018", descricao: "Desoneração da aquisição de bens de capital" },
  { cClassTrib: "550019", descricao: "Importação de bem material por indústria incentivada para utilização na ZFM" },
  { cClassTrib: "550020", descricao: "Áreas de livre comércio" },
  { cClassTrib: "550021", descricao: "Industrialização destinada a exportações" },
  { cClassTrib: "550022", descricao: "Regime Especial de Incentivos para a Produção de Hidrogênio de Baixa Emissão de Carbono (Rehidro)" },
  { cClassTrib: "550023", descricao: "Operações com hidrocarbonetos líquidos derivados de petróleo não combustíveis ou de gás natural, inclusive nafta" },
  { cClassTrib: "550024", descricao: "Regime Tributário para Incentivo à Atividade Naval - Renaval (Art. 107, II)" },
  { cClassTrib: "550025", descricao: "Regime Tributário para Incentivo à Atividade Naval - Renaval (Art. 107, III)" },
  // 620 - Tributação monofásica
  { cClassTrib: "620001", descricao: "Tributação monofásica sobre combustíveis" },
  { cClassTrib: "620002", descricao: "Tributação monofásica com responsabilidade pela retenção sobre combustíveis" },
  { cClassTrib: "620003", descricao: "Tributação monofásica com responsabilidade de retenção de tributos por terceiros" },
  { cClassTrib: "620004", descricao: "Tributação monofásica sobre mistura de EAC com gasolina A em percentual superior ao obrigatório" },
  { cClassTrib: "620005", descricao: "Tributação monofásica sobre mistura de EAC com gasolina A em percentual inferior ao obrigatório" },
  { cClassTrib: "620006", descricao: "Tributação monofásica sobre combustíveis cobrada anteriormente" },
  { cClassTrib: "620007", descricao: "Perecimento, deteriorização, roubo, furto ou extravio no regime monofásico" },
  // 800 - Transferência de crédito
  { cClassTrib: "800001", descricao: "Fusão, cisão ou incorporação" },
  { cClassTrib: "800002", descricao: "Transferência de crédito do associado, inclusive as cooperativas singulares" },
  // 810 - Ajuste de IBS na ZFM
  { cClassTrib: "810001", descricao: "Crédito presumido de IBS sobre o valor apurado nos fornecimentos a partir da ZFM" },
  // 811 - Ajustes
  { cClassTrib: "811001", descricao: "Anulação de Crédito por Saídas Imunes/Isentas" },
  { cClassTrib: "811002", descricao: "Débitos de notas fiscais não processadas na apuração" },
  { cClassTrib: "811003", descricao: "Desenquadramento do Simples Nacional" },
  // 820 - Tributação em documento específico
  { cClassTrib: "820001", descricao: "Documento com informações de fornecimento de serviços de planos de assistência à saúde elencados no art. 234 da Lei Complementar nº214, de 2025" },
  { cClassTrib: "820002", descricao: "Documento com informações de fornecimento de serviços de planos de assistência funerária" },
  { cClassTrib: "820003", descricao: "Documento com informações de fornecimento de serviços de planos de assistência à saúde de animais domésticos" },
  { cClassTrib: "820004", descricao: "Documento com informações de prestação de serviços de consursos de prognósticos" },
  { cClassTrib: "820005", descricao: "Documento com informações de alienação de bens imóveis" },
  { cClassTrib: "820006", descricao: "Documento com informações de fornecimento de serviços de exploração de via" },
  { cClassTrib: "820007", descricao: "Documento com informações de fornecimento de serviços financeiros" },
  { cClassTrib: "820008", descricao: "Documento com informações de fornecimento de serviço continuado, mas com tributação realizada em fatura anterior" },
  { cClassTrib: "820009", descricao: "Cobrança relativa a fornecimentos declarados em outro documento" },
  // 830 - Exclusão de base de cálculo
  { cClassTrib: "830001", descricao: "Documento com exclusão da BC da CBS e do IBS de energia elétrica fornecida pela distribuidora à UC" },
];

const STEP_LABELS = ["Dados da TOP", "Empresas", "Alíquotas", "Nota", "Resumo/Conclusão"] as const;

const EMPRESAS: Empresa[] = [
  { id: "40",  cod: 40,  nome: "EMPRESA JR PR (N ALT)",          cnpj: "78.765.740/0001-06" },
  { id: "47",  cod: 47,  nome: "EMPRESA JR RJ II (N ALT)",       cnpj: "98.765.432/0002-98" },
  { id: "375", cod: 375, nome: "041 - VIAMÃO",                   cnpj: "05.727.583/0002-51" },
  { id: "369", cod: 369, nome: "004 - ALVORADA",                 cnpj: "05.727.583/0001-70" },
  { id: "353", cod: 353, nome: "MAILBIZ",                        cnpj: "11.498.408/0001-51" },
  { id: "501", cod: 501, nome: "ATLAS SOLUTIONS BRASIL S.A.",    cnpj: "26.314.062/0001-61" },
  { id: "447", cod: 447, nome: "TESTE NATUREZA 9 - NATAL",       cnpj: "58.950.300/0001-11" },
  { id: "49",  cod: 49,  nome: "EMPRESA JR DF (N ALT)",          cnpj: "26.314.062/0007-57" },
  { id: "805", cod: 805, nome: "ARAPOTI TESTE MARCO",            cnpj: "01.820.705/0001-18" },
  { id: "45",  cod: 45,  nome: "EMPRESA JR ES (N ALT)",          cnpj: "26.314.062/0001-61" },
];

const TOPS_MOCK: TopConfigurada[] = [
  {
    id: "top-04-001",
    codTop: 850,
    subtipo: "04",
    nomeTop: "NF DEB IBS/CBS - Multa e Juros",
    cfop: "5.949",
    aliqIBS: "9,10",
    aliqCBS: "0,90",
    cst: "000",
    cClassTrib: "000001",
    vigencia: "01/01/2026",
    empresaIds: ["40", "47", "353"],
    serieEmpresas: { "40": "001", "47": "001", "353": "001" },
    tipoNegociacao: "01",
    finalidadeOp: "",
    naturezaOp: "",
    centroResultado: "",
    projeto: "",
    status: "ativa",
    criadoEm: "15/06/2025",
  },
];

const CFOP_OPCOES = [
  { codigo: "5.949", descricao: "Outra entrada de mercadoria ou prestação de serviço não especificadas." },
  { codigo: "6.949", descricao: "Outra saída de mercadoria ou prestação de serviço não especificado." },
] as const;

const FINALIDADES_OPERACAO = [
  { cod: "1",  descricao: "CONSUMO" },
  { cod: "2",  descricao: "BONIFICAÇÃO" },
  { cod: "3",  descricao: "IMOBILIZADO" },
  { cod: "4",  descricao: "VENDA MERC EXTERNO" },
  { cod: "5",  descricao: "VENDA EXPORTAÇÃO DRAWBACK" },
  { cod: "6",  descricao: "VENDA MERC C/FIM ESPEC EXPORTAÇÃO" },
  { cod: "7",  descricao: "OUTRAS SAIDAS EXPORTAÇÃO" },
  { cod: "8",  descricao: "CRED. PRESUMIDO" },
  { cod: "9",  descricao: "DIFERIMENTO" },
  { cod: "10", descricao: "IMPORTAÇÃO" },
  { cod: "11", descricao: "IMUNIDADE E NÃO INCIDÊNCIA" },
  { cod: "12", descricao: "DOAÇÕES SEM CONTRAPRESTAÇÃO" },
  { cod: "13", descricao: "DOAÇÃO COM ANULAÇÃO DE CRÉDITO" },
];

const TIPOS_NEGOCIACAO = [
  { cod: "01", descricao: "À vista" },
  { cod: "02", descricao: "A prazo" },
  { cod: "03", descricao: "Outros" },
];

const NATUREZAS_OPERACAO = [
  { cod: "1000000", descricao: "Receitas" },
  { cod: "2000000", descricao: "Estoques" },
  { cod: "3000000", descricao: "Despesas administrativas" },
  { cod: "4000000", descricao: "Despesas comerciais" },
  { cod: "5000000", descricao: "Impostos / Tributos" },
  { cod: "6000000", descricao: "Investimentos" },
  { cod: "7000000", descricao: "Dividendos" },
];

const CENTROS_RESULTADO = [
  { cod: "1000", descricao: "Comercial" },
  { cod: "1100", descricao: "Vendas Mercado Interno" },
  { cod: "1200", descricao: "Vendas Exportação" },
  { cod: "1300", descricao: "E-commerce" },
  { cod: "2000", descricao: "Serviços" },
  { cod: "2100", descricao: "Implantação" },
  { cod: "2200", descricao: "Consultoria" },
  { cod: "2300", descricao: "Suporte" },
  { cod: "3000", descricao: "Indústria" },
  { cod: "3100", descricao: "Produção Linha A" },
  { cod: "3200", descricao: "Produção Linha B" },
  { cod: "4000", descricao: "Projetos" },
  { cod: "4100", descricao: "Projeto Alpha" },
  { cod: "4200", descricao: "Projeto Beta" },
];

const PROJETOS = [
  { cod: "1000", descricao: "Projetos Estratégicos" },
  { cod: "1100", descricao: "Transformação Digital" },
  { cod: "1200", descricao: "Expansão de Negócios" },
  { cod: "1300", descricao: "Inovação" },
  { cod: "2000", descricao: "Projetos de Clientes" },
  { cod: "2100", descricao: "Cliente A" },
  { cod: "2110", descricao: "Implantação ERP" },
  { cod: "2120", descricao: "Sustentação" },
  { cod: "2200", descricao: "Cliente B" },
  { cod: "2210", descricao: "Implantação ERP" },
  { cod: "2220", descricao: "Integrações" },
  { cod: "3000", descricao: "Projetos Internos" },
  { cod: "3100", descricao: "Infraestrutura" },
  { cod: "3200", descricao: "Sistemas Corporativos" },
  { cod: "3300", descricao: "Pesquisa e Desenvolvimento" },
  { cod: "4000", descricao: "Projetos de Investimento" },
  { cod: "4100", descricao: "Aquisição de Máquinas" },
  { cod: "4200", descricao: "Construção/Expansão" },
];

// ─── WizardProgress ───────────────────────────────────────────────────────────
function WizardProgress({ step, steps }: { step: number; steps: readonly string[] }) {
  return (
    <div className="flex items-center">
      {steps.map((label, i) => {
        const idx   = i + 1;
        const done   = step > idx;
        const active = step === idx;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors shrink-0",
                done   && "bg-emerald-500 border-emerald-500 text-white",
                active && "bg-primary border-primary text-primary-foreground",
                !done && !active && "bg-card border-border text-muted-foreground",
              )}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : idx}
              </div>
              <span className={cn(
                "text-[11px] whitespace-nowrap",
                active ? "text-primary font-semibold" : "text-muted-foreground",
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-0.5 w-20 mx-3 mb-4", done ? "bg-emerald-500" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AssistenteNfeDebitoPage() {
  const [screen,      setScreen]      = useState<Screen>("landing");
  const [step,        setStep]        = useState<Step>(1);
  const [successMode, setSuccessMode] = useState<SuccessMode>("criada");

  // TOPs gerenciadas em estado local (mock → substituir por API)
  const [tops, setTops] = useState<TopConfigurada[]>(TOPS_MOCK);

  // TOP sendo editada/criada
  const [editingTop,    setEditingTop]    = useState<TopConfigurada | null>(null);
  const [subtipoAtivo,  setSubtipoAtivo]  = useState("");

  // Campos do wizard / edição
  const [topMode,       setTopMode]       = useState<TopMode>("choose");
  const [numeracaoAuto, setNumeracaoAuto] = useState(false);
  const [codTop,        setCodTop]        = useState("");
  const [nomeTop,       setNomeTop]       = useState("");
  const [cfop,          setCfop]          = useState("");
  const [cfopDropdown,  setCfopDropdown]  = useState(false);

  // Campos do passo Nota
  const [finalidadeOp,       setFinalidadeOp]       = useState("");
  const [finalidadeDropdown, setFinalidadeDropdown] = useState(false);
  const [naturezaDropdown,        setNaturezaDropdown]        = useState(false);
  const [tipoNegociacaoDropdown,  setTipoNegociacaoDropdown]  = useState(false);
  const [centroResultadoDropdown, setCentroResultadoDropdown] = useState(false);
  const [projetoDropdown,         setProjetoDropdown]         = useState(false);
  const [serieEmpresas,   setSerieEmpresas]   = useState<Record<string, string>>({});
  const [naturezaOp,      setNaturezaOp]      = useState("");
  const [tipoNegociacao,  setTipoNegociacao]  = useState("");
  const [centroResultado, setCentroResultado] = useState("");
  const [projeto,         setProjeto]         = useState("");
  const [aliqIBS,       setAliqIBS]       = useState("9,10");
  const [aliqCBS,       setAliqCBS]       = useState("0,90");
  const [cst,           setCst]           = useState("");
  const [cClassTrib,    setCClassTrib]    = useState("");
  const [vigencia,      setVigencia]      = useState("01/01/2026");
  const [selEmpresas,   setSelEmpresas]   = useState<Set<string>>(new Set());
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [cstFocus,      setCstFocus]      = useState<"cst" | "cClassTrib" | null>(null);
  const cstBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subtipoSel  = SUBTIPOS_DEBITO.find(s => s.cod === subtipoAtivo);
  const topAtiva    = (cod: string) => tops.find(t => t.subtipo === cod && t.status === "ativa");
  const todasTops   = (cod: string) => tops.filter(t => t.subtipo === cod);

  const filteredEmpresas = useMemo(
    () => EMPRESAS.filter(e =>
      `${e.cod} ${e.nome} ${e.cnpj}`.toLowerCase().includes(empresaSearch.toLowerCase())
    ),
    [empresaSearch],
  );

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function toggleEmpresa(id: string) {
    setSelEmpresas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAllEmpresas() {
    setSelEmpresas(prev =>
      prev.size === filteredEmpresas.length && filteredEmpresas.length > 0
        ? new Set()
        : new Set(filteredEmpresas.map(e => e.id))
    );
  }

  function openNovaTop(cod: string) {
    const sub = SUBTIPOS_DEBITO.find(s => s.cod === cod)!;
    setSubtipoAtivo(cod);
    setTopMode("choose");
    setNumeracaoAuto(false);
    setCodTop("");
    setNomeTop(sub.topSugerida);
    setCfop(sub.cfopSugerido);
    setCfopDropdown(false);
    setAliqIBS("9,10");
    setAliqCBS("0,90");
    setCst("");
    setCClassTrib("");
    setVigencia("01/01/2026");
    setSelEmpresas(new Set());
    setEmpresaSearch("");
    setEditingTop(null);

    setFinalidadeOp("");
    setFinalidadeDropdown(false);
    setNaturezaDropdown(false);
    setTipoNegociacaoDropdown(false);
    setCentroResultadoDropdown(false);
    setProjetoDropdown(false);
    setSerieEmpresas({});
    setNaturezaOp("");
    setTipoNegociacao("");
    setCentroResultado("");
    setProjeto("");
    setStep(1);
    setScreen("nova-top");
  }

  function openEditar(top: TopConfigurada) {
    setEditingTop(top);
    setSubtipoAtivo(top.subtipo);
    // Etapa 1 — Dados da TOP
    setTopMode("criar");
    setCodTop(top.codTop ? String(top.codTop) : "");
    setNumeracaoAuto(!top.codTop);
    setNomeTop(top.nomeTop);
    setCfop(top.cfop);
    // Etapa 2 — Empresas
    setSelEmpresas(new Set(top.empresaIds));
    setSerieEmpresas({ ...(top.serieEmpresas ?? {}) });
    setEmpresaSearch("");
    // Etapa 3 — Alíquotas
    setAliqIBS(top.aliqIBS);
    setAliqCBS(top.aliqCBS);
    setCst(top.cst);
    setCClassTrib(top.cClassTrib);
    setVigencia(top.vigencia);
    // Etapa 4 — Nota
    setTipoNegociacao(top.tipoNegociacao ?? "");
    setFinalidadeOp(top.finalidadeOp ?? "");
    setNaturezaOp(top.naturezaOp ?? "");
    setCentroResultado(top.centroResultado ?? "");
    setProjeto(top.projeto ?? "");
    setStep(1);
    setScreen("nova-top");
  }

  function toggleStatus(id: string) {
    let subtipoDaTop = "";
    let foiInativada = false;
    setTops(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        foiInativada = t.status === "ativa";
        subtipoDaTop = t.subtipo;
        return { ...t, status: foiInativada ? "inativa" : "ativa" };
      })
    );
    setSubtipoAtivo(subtipoDaTop);
    setSuccessMode(foiInativada ? "inativada" : "reativada");
    setScreen("success");
  }

  function salvarNovaTop() {
    const novaTop: TopConfigurada = {
      id: `top-${subtipoAtivo}-${Date.now()}`,
      codTop: parseInt(codTop, 10) || 0,
      subtipo: subtipoAtivo,
      nomeTop,
      cfop,
      aliqIBS,
      aliqCBS,
      cst,
      cClassTrib,
      vigencia,
      empresaIds: Array.from(selEmpresas),
      serieEmpresas: { ...serieEmpresas },
      tipoNegociacao,
      finalidadeOp,
      naturezaOp,
      centroResultado,
      projeto,
      status: "ativa",
      criadoEm: new Date().toLocaleDateString("pt-BR"),
    };
    setTops(prev => [...prev, novaTop]);
    setSuccessMode("criada");
    setScreen("success");
  }

  function salvarEdicao() {
    if (!editingTop) return;
    setTops(prev =>
      prev.map(t =>
        t.id === editingTop.id
          ? {
              ...t,
              nomeTop, cfop, codTop: parseInt(codTop, 10) || 0,
              aliqIBS, aliqCBS, cst, cClassTrib, vigencia,
              empresaIds: Array.from(selEmpresas),
              serieEmpresas: { ...serieEmpresas },
              tipoNegociacao, finalidadeOp, naturezaOp, centroResultado, projeto,
            }
          : t
      )
    );
    setSuccessMode("atualizada");
    setScreen("success");
  }

  const codTopValido = topMode === "vincular"
    ? !!codTop.trim()
    : (numeracaoAuto || !!codTop.trim());

  const step1CriarValido =
    !!nomeTop.trim() && codTopValido && !!cfop.trim();

  const step2ModeloValido = TIPOS_NEGOCIACAO.some(o => o.cod === tipoNegociacao);

  const canNextNovaTop =
    (step === 1 && (topMode === "criar" ? step1CriarValido : (!!nomeTop.trim() && codTopValido))) ||
    (step === 2 && selEmpresas.size > 0 && Array.from(selEmpresas).every(id => (serieEmpresas[id] ?? "").trim())) ||
    step === 3 ||
    (step === 4 && step2ModeloValido) ||
    step === 5;

  // ── Landing ──────────────────────────────────────────────────────────────────
  if (screen === "landing") {
    const totalConf = SUBTIPOS_SUPORTADOS.filter(s => topAtiva(s.cod)).length;

    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-foreground leading-tight">
                Nota de Débito IBS/CBS
              </h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Configure os Tipos de Operação (TOP) e alíquotas para emissão de Notas de Débito
                {" "}(<span className="font-medium">finNFe = 6</span>).
              </p>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4 flex gap-3">
          <Info className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[13px] font-semibold text-orange-800 dark:text-orange-300">
              O que é uma Nota de Débito?
            </p>
            <p className="text-[12px] text-orange-700 dark:text-orange-400 leading-relaxed">
              Documenta qualquer evento que resulte no <strong>aumento do imposto devido</strong> pelo emitente.
              Corresponde à finalidade <strong>finNFe = 6</strong> na NF-e. Este assistente cobre os subtipos:{" "}
              <strong>04 — Multa e juros</strong> e <strong>06 — Pagamento antecipado</strong>.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Subtipos configurados</p>
              <p className="text-[18px] font-bold text-foreground leading-tight">
                {totalConf} <span className="text-[13px] font-normal text-muted-foreground">de {SUBTIPOS_SUPORTADOS.length}</span>
              </p>
            </div>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">TOPs cadastradas</p>
              <p className="text-[18px] font-bold text-foreground leading-tight">{tops.length}</p>
            </div>
          </div>
        </div>

        {/* TOPs table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b">
            <p className="text-[13px] font-semibold text-foreground">TOPs Configuradas</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[12px] w-52">Subtipo</TableHead>
                <TableHead className="text-[12px] w-16 text-center">Cód. TOP</TableHead>
                <TableHead className="text-[12px]">Nome da TOP</TableHead>
                <TableHead className="text-[12px] w-20 text-right">IBS%</TableHead>
                <TableHead className="text-[12px] w-20 text-right">CBS%</TableHead>
                <TableHead className="text-[12px] w-28">Vigência</TableHead>
                <TableHead className="text-[12px] w-24">Empresas</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {SUBTIPOS_SUPORTADOS.map(sub => {
                const top = topAtiva(sub.cod);

                if (!top) {
                  return (
                    <TableRow key={sub.cod}>
                      <TableCell className="text-[12px]">
                        <span className="font-mono font-semibold text-muted-foreground">{sub.cod}</span>
                        {" "}<span className="text-foreground">{sub.label}</span>
                      </TableCell>
                      <TableCell className="text-center text-[12px] text-muted-foreground">—</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground italic">Não configurado</TableCell>
                      <TableCell colSpan={4} />
                      <TableCell className="text-right">
                        <Button size="sm" className="h-7 gap-1.5 text-[12px]" onClick={() => openNovaTop(sub.cod)}>
                          <Plus className="h-3.5 w-3.5" />
                          Configurar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={top.id}>
                    <TableCell className="text-[12px]">
                      <span className="font-mono font-semibold text-muted-foreground">{sub.cod}</span>
                      {" "}<span className="text-foreground">{sub.label}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {top.codTop
                        ? <span className="text-[12px] font-mono font-semibold text-foreground">{top.codTop}</span>
                        : <span className="text-[12px] text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell className="text-[12px] font-medium">{top.nomeTop}</TableCell>
                    <TableCell className="text-[12px] text-right font-mono">{top.aliqIBS}%</TableCell>
                    <TableCell className="text-[12px] text-right font-mono">{top.aliqCBS}%</TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{top.vigencia}</TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{top.empresaIds.length} empresa(s)</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-[12px]"
                        onClick={() => openEditar(top)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────────
  if (screen === "success") {
    const top = editingTop ?? tops.find(t => t.subtipo === subtipoAtivo && t.status === "ativa");
    const subtipoLabel = SUBTIPOS_DEBITO.find(s => s.cod === subtipoAtivo)?.label ?? "";

    // Inativação: oferta de configurar substituta
    if (successMode === "inativada") {
      return (
        <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <PowerOff className="h-7 w-7 text-amber-600" />
            </div>
            <h1 className="text-[20px] font-bold text-foreground">TOP inativada</h1>
            <p className="text-[13px] text-muted-foreground max-w-sm">
              O subtipo <strong>{subtipoAtivo} — {subtipoLabel}</strong> não possui mais uma TOP ativa.
              O portal não irá gerar Notas de Débito para este subtipo até que uma substituta seja configurada.
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Deseja configurar uma TOP substituta agora? Você precisará informar o código da nova TOP
              gerada no cadastro do ERP e definir as alíquotas e empresas aplicáveis.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setScreen("landing")} className="flex-1">
              Configurar depois
            </Button>
            <Button onClick={() => openNovaTop(subtipoAtivo)} className="flex-1 gap-2">
              <Plus className="h-4 w-4" />
              Configurar substituta agora
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="text-[20px] font-bold text-foreground">
            {successMode === "criada"    && "TOP cadastrada com sucesso!"}
            {successMode === "atualizada" && "Alíquotas atualizadas com sucesso!"}
            {successMode === "reativada"  && "TOP reativada com sucesso!"}
          </h1>
          <p className="text-[13px] text-muted-foreground max-w-sm">
            {successMode === "criada" && "A TOP foi registrada e está disponível para uso na geração automática de Notas de Débito a partir dos movimentos de receitas e despesas."}
            {successMode === "atualizada" && "As novas alíquotas e empresas foram salvas na TOP selecionada."}
            {successMode === "reativada" && `O subtipo ${subtipoAtivo} — ${subtipoLabel} voltará a gerar Notas de Débito automaticamente.`}
          </p>
        </div>

        {top && (successMode === "criada" || successMode === "atualizada") && (
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <p className="text-[13px] font-semibold text-foreground">Resumo</p>
            <div className="divide-y divide-border/50 text-[13px]">
              {[
                ["Finalidade NF-e",      "6 — Nota de débito"],
                ["Subtipo (tpNFDebito)", `${top.subtipo} — ${SUBTIPOS_DEBITO.find(s => s.cod === top.subtipo)?.label}`],
                ["Código da TOP",        String(top.codTop)],
                ["Nome da TOP",          top.nomeTop],
                ["Alíquota IBS",         `${top.aliqIBS}%`],
                ["Alíquota CBS",         `${top.aliqCBS}%`],
                ["Vigência",             top.vigencia],
                ["Empresas",             `${top.empresaIds.length} empresa(s)`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right max-w-[55%]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={() => setScreen("landing")} className="w-full gap-2">
          Voltar para o assistente
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // ── Editar alíquotas ──────────────────────────────────────────────────────────
  if (screen === "editar" && editingTop) {
    const canSave = selEmpresas.size > 0;
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-3 -mx-6 mb-2">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
            <span>Configurações</span>
            <ChevronRight className="h-3 w-3" />
            <span>Assistentes</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Nota de Débito IBS/CBS</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-[16px] font-semibold text-foreground leading-tight">
                Editar alíquotas — {editingTop.nomeTop}
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Subtipo {editingTop.subtipo} — {SUBTIPOS_DEBITO.find(s => s.cod === editingTop.subtipo)?.label} · finNFe = 6 — Nota de débito
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setScreen("landing")} className="text-muted-foreground">
                Cancelar
              </Button>
              <Button size="sm" onClick={salvarEdicao} disabled={!canSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Salvar alterações
              </Button>
            </div>
          </div>
        </div>

        {/* Alíquotas */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <p className="text-[13px] font-semibold text-foreground">Alíquotas IBS e CBS</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Alíquota IBS (%)</Label>
              <Input value={aliqIBS} onChange={e => setAliqIBS(e.target.value)} placeholder="Ex.: 9,10" className="text-[13px]" />
              <p className="text-[11px] text-muted-foreground">Imposto sobre Bens e Serviços</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Alíquota CBS (%)</Label>
              <Input value={aliqCBS} onChange={e => setAliqCBS(e.target.value)} placeholder="Ex.: 0,90" className="text-[13px]" />
              <p className="text-[11px] text-muted-foreground">Contribuição sobre Bens e Serviços</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Vigência</Label>
            <div className="relative w-52">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input value={vigencia} onChange={e => setVigencia(e.target.value)} placeholder="DD/MM/AAAA" className="pl-8 text-[13px]" />
            </div>
          </div>
        </div>

        {/* Empresas */}
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-[13px] font-semibold text-foreground">Empresas</p>
            {selEmpresas.size > 0 && (
              <span className="ml-auto text-[11px] font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5">
                {selEmpresas.size} selecionada(s)
              </span>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input value={empresaSearch} onChange={e => setEmpresaSearch(e.target.value)} placeholder="Buscar empresa..." className="pl-8 text-[13px]" />
          </div>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredEmpresas.length > 0 && filteredEmpresas.every(e => selEmpresas.has(e.id))}
                      onCheckedChange={toggleAllEmpresas}
                    />
                  </TableHead>
                  <TableHead className="text-[12px] w-16">Cód.</TableHead>
                  <TableHead className="text-[12px]">Empresa</TableHead>
                  <TableHead className="text-[12px]">CNPJ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmpresas.map(emp => (
                  <TableRow key={emp.id} className="cursor-pointer hover:bg-accent/40" onClick={() => toggleEmpresa(emp.id)}>
                    <TableCell>
                      <Checkbox checked={selEmpresas.has(emp.id)} onCheckedChange={() => toggleEmpresa(emp.id)} onClick={e => e.stopPropagation()} />
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{emp.cod}</TableCell>
                    <TableCell className="text-[12px] font-medium">{emp.nome}</TableCell>
                    <TableCell className="text-[12px] text-muted-foreground font-mono">{emp.cnpj}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

      </div>
    );
  }

  // ── Nova TOP (wizard 3 etapas) ────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-3 -mx-6 mb-2">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
          <span>Configurações</span>
          <ChevronRight className="h-3 w-3" />
          <span>Assistentes</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Nota de Débito IBS/CBS</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[16px] font-semibold text-foreground leading-tight">
              {editingTop ? "Editar configuração" : "Nota de Débito IBS/CBS"}
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Subtipo {subtipoAtivo} · {subtipoSel?.label} · finNFe = 6
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {topMode === "choose" ? (
              <Button variant="ghost" size="sm" onClick={() => setScreen("landing")} className="text-muted-foreground">
                Cancelar
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost" size="sm" className="text-muted-foreground"
                  onClick={() => {
                    if (step === 1) editingTop ? setScreen("landing") : setTopMode("choose");
                    else setStep((step - 1) as Step);
                  }}
                >
                  Voltar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setScreen("landing")} className="text-muted-foreground">
                  Cancelar
                </Button>
                {step < 5 ? (
                  <Button size="sm" onClick={() => setStep((step + 1) as Step)} disabled={!canNextNovaTop}>
                    Próximo
                  </Button>
                ) : (
                  <Button size="sm" onClick={editingTop ? salvarEdicao : salvarNovaTop} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {editingTop ? "Salvar alterações" : "Confirmar e Cadastrar"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        {topMode !== "choose" && (
          <div className="mt-3">
            <WizardProgress step={step} steps={STEP_LABELS} />
          </div>
        )}
      </div>

      {/* ── Escolha: criar ou vincular ── */}
      {topMode === "choose" && (
        <div className="rounded-lg border bg-card p-6 space-y-5">
          <div>
            <p className="text-[14px] font-semibold text-foreground">
              Você já possui uma TOP cadastrada no ERP para este subtipo?
            </p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Subtipo {subtipoAtivo} — {subtipoSel?.label}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setTopMode("vincular"); setNumeracaoAuto(false); }}
              className="flex flex-col gap-1.5 rounded-lg border-2 border-border hover:border-primary/50 bg-background hover:bg-accent/30 p-4 text-left transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Layers className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-[13px] font-semibold text-foreground">Sim, quero vincular</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pl-10">
                A TOP já existe no ERP. Informe o código para associá-la à geração automática de Notas de Débito IBS/CBS.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setTopMode("criar")}
              className="flex flex-col gap-1.5 rounded-lg border-2 border-border hover:border-primary/50 bg-background hover:bg-accent/30 p-4 text-left transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-[13px] font-semibold text-foreground">Não, vou criar agora</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pl-10">
                Defina o código, nome, empresas e alíquotas. O portal usará esta TOP para gerar as notas automaticamente.
              </p>
            </button>
          </div>
        </div>
      )}


      {/* ── Etapa 1: Nome TOP + Empresas ── */}
      {topMode !== "choose" && step === 1 && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              {topMode === "vincular"
                ? <Layers className="h-4 w-4 text-muted-foreground" />
                : <FileText className="h-4 w-4 text-muted-foreground" />}
              <p className="text-[13px] font-semibold text-foreground">
                {topMode === "vincular" ? "Vinculando TOP existente" : editingTop ? "Dados da TOP" : "Nova TOP"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label className="text-[12px]">Código da TOP</Label>
                  {topMode === "criar" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => {
                            if (!numeracaoAuto) { setNumeracaoAuto(true); setCodTop(""); }
                            else { setNumeracaoAuto(false); }
                          }}
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border transition-colors",
                            numeracaoAuto
                              ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                              : "bg-muted text-muted-foreground border-border hover:bg-accent",
                          )}
                        >
                          {numeracaoAuto ? "Automática" : "Manual"}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-[12px]">
                          {numeracaoAuto
                            ? "Numeração automática — o ERP atribui o código. Clique para alterar."
                            : "Numeração manual — você define o código. Clique para alterar."}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="relative">
                  <Input
                    value={codTop}
                    onChange={e => setCodTop(e.target.value.replace(/\D/g, ""))}
                    placeholder={topMode === "vincular" ? "Código da TOP existente" : "Ex.: 850"}
                    disabled={topMode === "criar" && numeracaoAuto}
                    className={cn(
                      "text-[13px] font-mono",
                      topMode === "criar" && numeracaoAuto && "bg-muted text-muted-foreground",
                      topMode === "vincular" && "pr-8",
                    )}
                  />
                  {topMode === "vincular" && (
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  )}
                </div>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-[12px]">Nome da TOP</Label>
                <Input value={nomeTop} onChange={e => setNomeTop(e.target.value)} placeholder="Ex.: NF DEB IBS/CBS - Multa e Juros" className="text-[13px]" />
              </div>
            </div>

            {topMode === "criar" && (
              <>
                {/* CFOP */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-[12px]">CFOP</Label>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded px-1.5 py-0.5 font-medium">
                      Sugerido
                    </span>
                  </div>
                  <div className="relative flex">
                    {/* Código com ícone de pesquisa interno */}
                    <div className="relative shrink-0">
                      <Input
                        value={cfop}
                        onChange={e => { setCfop(e.target.value); setCfopDropdown(false); }}
                        placeholder="5.949"
                        className="text-[13px] font-mono w-28 pr-8 rounded-r-none border-r-0"
                      />
                      <button
                        type="button"
                        onClick={() => setCfopDropdown(v => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Search className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {/* Descrição — preenche o restante da linha */}
                    <div className="flex-1 flex items-center px-3 border border-border rounded-r-md bg-muted/30 min-w-0">
                      <span className="text-[12px] text-muted-foreground truncate">
                        {CFOP_OPCOES.find(o => o.codigo === cfop)?.descricao ?? "Selecione um CFOP"}
                      </span>
                    </div>
                    {/* Dropdown de pesquisa */}
                    {cfopDropdown && (
                      <div
                        className="absolute top-full left-0 mt-1 z-10 w-full rounded-md border bg-popover shadow-md overflow-hidden"
                        onMouseDown={e => e.preventDefault()}
                      >
                        {CFOP_OPCOES.map(o => (
                          <button
                            key={o.codigo}
                            type="button"
                            onMouseDown={() => { setCfop(o.codigo); setCfopDropdown(false); }}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent/60 transition-colors border-b last:border-b-0"
                          >
                            <span className="text-[12px] font-mono font-semibold text-foreground w-12 shrink-0 mt-0.5">{o.codigo}</span>
                            <span className="text-[12px] text-muted-foreground leading-snug">{o.descricao}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuração automática — campos + orientação */}
                <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
                  <div className="flex items-center gap-2 px-4 py-2.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Preenchido automaticamente pelo assistente
                    </p>
                  </div>
                  <div className="px-4 py-3 grid grid-cols-2 gap-x-8 gap-y-1.5">
                    {[
                      ["Modelo de documento", "55 — NF-e"],
                      ["finNFe",              "6 — Nota de débito"],
                      ["tpNFDebito",          `${subtipoAtivo} — ${subtipoSel?.label ?? ""}`],
                      ["Movimenta estoque",          "Não"],
                      ["Gera financeiro",            "Não"],
                      ["Numeração somente automática", "Sim"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-baseline gap-1.5">
                        <span className="text-[11px] text-muted-foreground shrink-0">{label}:</span>
                        <span className="text-[11px] font-semibold text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2.5 px-4 py-3">
                    <Info className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-relaxed">
                      A TOP será gerada com padrão pré-definido para emissão de Notas de Débito IBS/CBS.
                      Ajustes adicionais — partidas contábeis, Livros Fiscais, comissões e integrações — devem ser realizados
                      diretamente no <span className="font-semibold">Cadastro da TOP</span>.
                    </p>
                  </div>
                </div>
              </>
            )}

          </div>

        </div>
      )}

      {/* ── Etapa 4: Nota ── */}
      {topMode !== "choose" && step === 4 && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] font-semibold text-foreground">Configuração da Nota</p>
            </div>

            {/* Tipo de negociação */}
            <div className="space-y-1.5">
              <Label className="text-[12px]">Tipo de negociação *</Label>
              <div className="relative flex">
                <div className="relative shrink-0">
                  <Input
                    value={tipoNegociacao}
                    onChange={e => { setTipoNegociacao(e.target.value.replace(/\D/g, "")); setTipoNegociacaoDropdown(false); }}
                    placeholder="Cód."
                    className="text-[13px] font-mono w-16 pr-8 rounded-r-none border-r-0"
                  />
                  <button
                    type="button"
                    onClick={() => setTipoNegociacaoDropdown(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Search className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex-1 flex items-center px-3 border border-border rounded-r-md bg-muted/30 min-w-0">
                  {(() => { const found = TIPOS_NEGOCIACAO.find(o => o.cod === tipoNegociacao); return found
                    ? <span className="text-[12px] text-foreground truncate">{found.descricao}</span>
                    : <span className="text-[12px] text-muted-foreground/60 italic truncate">Selecione o tipo de negociação</span>;
                  })()}
                </div>
                {tipoNegociacaoDropdown && (
                  <div
                    className="absolute top-full left-0 mt-1 z-10 w-full rounded-md border bg-popover shadow-md overflow-hidden"
                    onMouseDown={e => e.preventDefault()}
                  >
                    {TIPOS_NEGOCIACAO.map(o => (
                      <button
                        key={o.cod}
                        type="button"
                        onMouseDown={() => { setTipoNegociacao(o.cod); setTipoNegociacaoDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/60 transition-colors border-b last:border-b-0"
                      >
                        <span className="text-[12px] font-mono font-semibold text-foreground w-8 shrink-0">{o.cod}</span>
                        <span className="text-[12px] text-muted-foreground">{o.descricao}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Campos opcionais */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Campos opcionais</p>
              {/* Finalidade da operação */}
              <div className="space-y-1.5">
                <Label className="text-[12px]">Finalidade da operação</Label>
                <div className="relative flex">
                  <div className="relative shrink-0">
                    <Input
                      value={finalidadeOp}
                      onChange={e => { setFinalidadeOp(e.target.value.replace(/\D/g, "")); setFinalidadeDropdown(false); }}
                      placeholder="Cód."
                      className="text-[13px] font-mono w-16 pr-8 rounded-r-none border-r-0"
                    />
                    <button
                      type="button"
                      onClick={() => setFinalidadeDropdown(v => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Search className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 flex items-center px-3 border border-border rounded-r-md bg-muted/30 min-w-0">
                    {(() => { const found = FINALIDADES_OPERACAO.find(o => o.cod === finalidadeOp); return found
                      ? <span className="text-[12px] text-foreground truncate">{found.descricao}</span>
                      : <span className="text-[12px] text-muted-foreground/60 italic truncate">Selecione a finalidade</span>;
                    })()}
                  </div>
                  {finalidadeDropdown && (
                    <div
                      className="absolute top-full left-0 mt-1 z-10 w-full rounded-md border bg-popover shadow-md overflow-hidden max-h-52 overflow-y-auto"
                      onMouseDown={e => e.preventDefault()}
                    >
                      {FINALIDADES_OPERACAO.map(o => (
                        <button
                          key={o.cod}
                          type="button"
                          onMouseDown={() => { setFinalidadeOp(o.cod); setFinalidadeDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/60 transition-colors border-b last:border-b-0"
                        >
                          <span className="text-[12px] font-mono font-semibold text-foreground w-8 shrink-0">{o.cod}</span>
                          <span className="text-[12px] text-muted-foreground">{o.descricao}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Natureza de operação */}
              <div className="space-y-1.5">
                <Label className="text-[12px]">Natureza de operação</Label>
                <div className="relative flex">
                  <div className="relative shrink-0">
                    <Input
                      value={naturezaOp}
                      onChange={e => { setNaturezaOp(e.target.value.replace(/\D/g, "")); setNaturezaDropdown(false); }}
                      placeholder="Cód."
                      className="text-[13px] font-mono w-28 pr-8 rounded-r-none border-r-0"
                    />
                    <button
                      type="button"
                      onClick={() => setNaturezaDropdown(v => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Search className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 flex items-center px-3 border border-border rounded-r-md bg-muted/30 min-w-0">
                    {(() => { const found = NATUREZAS_OPERACAO.find(o => o.cod === naturezaOp); return found
                      ? <span className="text-[12px] text-foreground truncate">{found.descricao}</span>
                      : <span className="text-[12px] text-muted-foreground/60 italic truncate">Selecione a natureza de operação</span>;
                    })()}
                  </div>
                  {naturezaDropdown && (
                    <div
                      className="absolute top-full left-0 mt-1 z-10 w-full rounded-md border bg-popover shadow-md overflow-hidden max-h-52 overflow-y-auto"
                      onMouseDown={e => e.preventDefault()}
                    >
                      {NATUREZAS_OPERACAO.map(o => (
                        <button
                          key={o.cod}
                          type="button"
                          onMouseDown={() => { setNaturezaOp(o.cod); setNaturezaDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/60 transition-colors border-b last:border-b-0"
                        >
                          <span className="text-[12px] font-mono font-semibold text-foreground w-20 shrink-0">{o.cod}</span>
                          <span className="text-[12px] text-muted-foreground">{o.descricao}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {/* Centro de resultado */}
                <div className="space-y-1.5">
                  <Label className="text-[12px]">Centro de resultado</Label>
                  <div className="relative flex">
                    <div className="relative shrink-0">
                      <Input
                        value={centroResultado}
                        onChange={e => { setCentroResultado(e.target.value.replace(/\D/g, "")); setCentroResultadoDropdown(false); }}
                        placeholder="Cód."
                        className="text-[13px] font-mono w-20 pr-8 rounded-r-none border-r-0"
                      />
                      <button
                        type="button"
                        onClick={() => setCentroResultadoDropdown(v => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Search className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 flex items-center px-3 border border-border rounded-r-md bg-muted/30 min-w-0">
                      {(() => { const found = CENTROS_RESULTADO.find(o => o.cod === centroResultado); return found
                        ? <span className="text-[12px] text-foreground truncate">{found.descricao}</span>
                        : <span className="text-[12px] text-muted-foreground/60 italic truncate">Selecione o centro de resultado</span>;
                      })()}
                    </div>
                    {centroResultadoDropdown && (
                      <div
                        className="absolute top-full left-0 mt-1 z-10 w-full rounded-md border bg-popover shadow-md overflow-hidden max-h-52 overflow-y-auto"
                        onMouseDown={e => e.preventDefault()}
                      >
                        {CENTROS_RESULTADO.map(o => (
                          <button
                            key={o.cod}
                            type="button"
                            onMouseDown={() => { setCentroResultado(o.cod); setCentroResultadoDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/60 transition-colors border-b last:border-b-0"
                          >
                            <span className="text-[12px] font-mono font-semibold text-foreground w-12 shrink-0">{o.cod}</span>
                            <span className="text-[12px] text-muted-foreground">{o.descricao}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Projeto */}
                <div className="space-y-1.5">
                  <Label className="text-[12px]">Projeto</Label>
                  <div className="relative flex">
                    <div className="relative shrink-0">
                      <Input
                        value={projeto}
                        onChange={e => { setProjeto(e.target.value.replace(/\D/g, "")); setProjetoDropdown(false); }}
                        placeholder="Cód."
                        className="text-[13px] font-mono w-20 pr-8 rounded-r-none border-r-0"
                      />
                      <button
                        type="button"
                        onClick={() => setProjetoDropdown(v => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Search className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 flex items-center px-3 border border-border rounded-r-md bg-muted/30 min-w-0">
                      {(() => { const found = PROJETOS.find(o => o.cod === projeto); return found
                        ? <span className="text-[12px] text-foreground truncate">{found.descricao}</span>
                        : <span className="text-[12px] text-muted-foreground/60 italic truncate">Selecione o projeto</span>;
                      })()}
                    </div>
                    {projetoDropdown && (
                      <div
                        className="absolute top-full left-0 mt-1 z-10 w-full rounded-md border bg-popover shadow-md overflow-hidden max-h-52 overflow-y-auto"
                        onMouseDown={e => e.preventDefault()}
                      >
                        {PROJETOS.map(o => (
                          <button
                            key={`${o.cod}-${o.descricao}`}
                            type="button"
                            onMouseDown={() => { setProjeto(o.cod); setProjetoDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/60 transition-colors border-b last:border-b-0"
                          >
                            <span className="text-[12px] font-mono font-semibold text-foreground w-12 shrink-0">{o.cod}</span>
                            <span className="text-[12px] text-muted-foreground">{o.descricao}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Campos automáticos */}
            <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Aplicado automaticamente pelo assistente
                </p>
              </div>
              <div className="px-4 py-3 space-y-3">
                {/* TOP */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[11px] text-muted-foreground shrink-0 w-20">TOP:</span>
                  <span className="text-[11px] font-semibold text-foreground">{codTop ? `${codTop} — ${nomeTop}` : nomeTop}</span>
                </div>
                {/* Empresas + Série */}
                {selEmpresas.size > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Empresas e série da nota:</span>
                    <div className="space-y-0.5 pl-2 border-l-2 border-border/60">
                      {Array.from(selEmpresas).map(id => {
                        const emp = EMPRESAS.find(e => e.id === id);
                        return emp ? (
                          <div key={id} className="flex items-baseline gap-1.5">
                            <span className="text-[11px] font-semibold text-foreground">{emp.cod} — {emp.nome}</span>
                            <span className="text-[11px] text-muted-foreground">· Série {serieEmpresas[id] || "—"}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                {/* Alíquotas */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[11px] text-muted-foreground shrink-0 w-20">Alíquotas:</span>
                  <span className="text-[11px] font-semibold text-foreground">IBS {aliqIBS}% · CBS {aliqCBS}%</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Etapa 2: Empresas ── */}
      {topMode !== "choose" && step === 2 && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] font-semibold text-foreground">Empresas</p>
              {selEmpresas.size > 0 && (
                <span className="ml-auto text-[11px] font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5">
                  {selEmpresas.size} selecionada(s)
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input value={empresaSearch} onChange={e => setEmpresaSearch(e.target.value)} placeholder="Buscar empresa..." className="pl-8 text-[13px]" />
            </div>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filteredEmpresas.length > 0 && filteredEmpresas.every(e => selEmpresas.has(e.id))}
                        onCheckedChange={toggleAllEmpresas}
                      />
                    </TableHead>
                    <TableHead className="text-[12px] w-16">Cód.</TableHead>
                    <TableHead className="text-[12px]">Empresa</TableHead>
                    <TableHead className="text-[12px]">CNPJ</TableHead>
                    <TableHead className="text-[12px] w-28">
                      <span>Série *</span>
                      <span className="block text-[10px] font-normal text-muted-foreground/70 normal-case tracking-normal">usada na emissão da nota</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmpresas.map(emp => (
                    <TableRow key={emp.id} className="cursor-pointer hover:bg-accent/40" onClick={() => toggleEmpresa(emp.id)}>
                      <TableCell>
                        <Checkbox checked={selEmpresas.has(emp.id)} onCheckedChange={() => toggleEmpresa(emp.id)} onClick={e => e.stopPropagation()} />
                      </TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">{emp.cod}</TableCell>
                      <TableCell className="text-[12px] font-medium">{emp.nome}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground font-mono">{emp.cnpj}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Input
                          value={serieEmpresas[emp.id] ?? ""}
                          onChange={e => setSerieEmpresas(prev => ({ ...prev, [emp.id]: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                          placeholder="001"
                          disabled={!selEmpresas.has(emp.id)}
                          className="text-[12px] font-mono h-7 w-20"
                          maxLength={3}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* ── Etapa 3: Alíquotas ── */}
      {topMode !== "choose" && step === 3 && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] font-semibold text-foreground">Alíquotas IBS e CBS</p>
            </div>
            {/* CST + cClassTrib com busca integrada */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px]">CST</Label>
                  <div className="relative">
                    <Input
                      value={cst}
                      onChange={e => {
                        setCst(e.target.value);
                        if (cClassTrib && !cClassTrib.startsWith(e.target.value)) {
                          setCClassTrib("");
                        }
                      }}
                      onFocus={() => {
                        if (cstBlurTimer.current) clearTimeout(cstBlurTimer.current);
                        setCstFocus("cst");
                      }}
                      onBlur={() => {
                        cstBlurTimer.current = setTimeout(() => setCstFocus(null), 150);
                      }}
                      placeholder="Ex.: 000"
                      className="text-[13px] font-mono pr-8"
                    />
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Código de Situação Tributária</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px]">cClassTrib</Label>
                  <div className="relative">
                    <Input
                      value={cClassTrib}
                      onChange={e => setCClassTrib(e.target.value)}
                      onFocus={() => {
                        if (cstBlurTimer.current) clearTimeout(cstBlurTimer.current);
                        setCstFocus("cClassTrib");
                      }}
                      onBlur={() => {
                        cstBlurTimer.current = setTimeout(() => setCstFocus(null), 150);
                      }}
                      placeholder="Ex.: 000001"
                      className="text-[13px] font-mono pr-8"
                    />
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Código de Classificação Tributária</p>
                </div>
              </div>

              {/* Resultados — CST */}
              {cstFocus === "cst" && (() => {
                const q = cst.toLowerCase().trim();
                const results = CST_OPCOES.filter(o =>
                  !q || o.cst.includes(q) || o.descricao.toLowerCase().includes(q)
                );
                return results.length > 0 ? (
                  <div
                    className="rounded-md border overflow-hidden max-h-52 overflow-y-auto"
                    onMouseDown={e => e.preventDefault()}
                  >
                    {results.map(o => (
                      <button
                        key={o.cst}
                        type="button"
                        onMouseDown={() => {
                            setCst(o.cst);
                            if (cClassTrib && !cClassTrib.startsWith(o.cst)) setCClassTrib("");
                            setCstFocus(null);
                          }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/60 transition-colors border-b last:border-b-0"
                      >
                        <span className="text-[12px] font-mono font-semibold text-foreground w-10 shrink-0">{o.cst}</span>
                        <span className="text-[12px] text-muted-foreground">{o.descricao}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground px-1">Nenhum resultado encontrado.</p>
                );
              })()}

              {/* Resultados — cClassTrib */}
              {cstFocus === "cClassTrib" && (() => {
                const q = cClassTrib.toLowerCase().trim();
                const results = CCLASS_OPCOES.filter(o => {
                  const matchesPrefix = !cst || o.cClassTrib.startsWith(cst);
                  const matchesSearch = !q || o.cClassTrib.toLowerCase().includes(q) || o.descricao.toLowerCase().includes(q);
                  return matchesPrefix && matchesSearch;
                });
                return results.length > 0 ? (
                  <div
                    className="rounded-md border overflow-hidden max-h-52 overflow-y-auto"
                    onMouseDown={e => e.preventDefault()}
                  >
                    {results.map(o => (
                      <button
                        key={o.cClassTrib}
                        type="button"
                        onMouseDown={() => {
                            setCClassTrib(o.cClassTrib);
                            setCst(o.cClassTrib.substring(0, 3));
                            setCstFocus(null);
                          }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/60 transition-colors border-b last:border-b-0"
                      >
                        <span className="text-[12px] font-mono font-semibold text-foreground w-14 shrink-0">{o.cClassTrib}</span>
                        <span className="text-[12px] text-muted-foreground">{o.descricao}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground px-1">Nenhum resultado encontrado.</p>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[12px]">Alíquota IBS (%)</Label>
                <Input value={aliqIBS} onChange={e => setAliqIBS(e.target.value)} placeholder="Ex.: 9,10" className="text-[13px]" />
                <p className="text-[11px] text-muted-foreground">Imposto sobre Bens e Serviços</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Alíquota CBS (%)</Label>
                <Input value={aliqCBS} onChange={e => setAliqCBS(e.target.value)} placeholder="Ex.: 0,90" className="text-[13px]" />
                <p className="text-[11px] text-muted-foreground">Contribuição sobre Bens e Serviços</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Vigência</Label>
              <div className="relative w-52">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input value={vigencia} onChange={e => setVigencia(e.target.value)} placeholder="DD/MM/AAAA" className="pl-8 text-[13px]" />
              </div>
            </div>

            <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 flex gap-2.5">
              <Info className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                Na geração da Nota de Débito, o portal prioriza os dados tributários da nota de origem.
                As alíquotas, CST e classificação tributária definidas aqui são aplicadas automaticamente
                apenas quando essas informações não puderem ser recuperadas da nota original —
                por ausência, inconsistência ou indisponibilidade dos dados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Etapa 5: Resumo / Conclusão ── */}
      {topMode !== "choose" && step === 5 && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <p className="text-[13px] font-semibold text-foreground">Resumo da configuração</p>
            <div className="divide-y divide-border/50 text-[13px]">
              {[
                ["Finalidade NF-e",      "6 — Nota de débito"],
                ["Subtipo (tpNFDebito)", `${subtipoAtivo} — ${subtipoSel?.label ?? ""}`],
                ["Modelo NF-e",         "55 — NF-e"],
                ["Código da TOP",        numeracaoAuto ? "Gerado automaticamente pelo ERP" : codTop],
                ["Nome da TOP",          nomeTop],
                ...(topMode === "criar" ? [
                  ["CFOP",              `${cfop}${CFOP_OPCOES.find(o => o.codigo === cfop) ? ` — ${CFOP_OPCOES.find(o => o.codigo === cfop)!.descricao}` : ""}`],
                  ["Movimenta estoque", "Não"],
                ] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right max-w-[55%]">{value}</span>
                </div>
              ))}
            </div>

            {/* Nota */}
            <p className="text-[12px] font-semibold text-foreground mt-2">Nota</p>
            <div className="divide-y divide-border/50 text-[13px]">
              {[
                ["Finalidade op.",     (() => { const f = FINALIDADES_OPERACAO.find(o => o.cod === finalidadeOp); return f ? `${f.cod} — ${f.descricao}` : "—"; })()],
                ["Natureza op.",       (() => { const n = NATUREZAS_OPERACAO.find(o => o.cod === naturezaOp); return n ? `${n.cod} — ${n.descricao}` : "—"; })()],
                ["Tipo de negociação", (() => { const t = TIPOS_NEGOCIACAO.find(o => o.cod === tipoNegociacao); return t ? `${t.cod} — ${t.descricao}` : "—"; })()],
                ...(centroResultado ? [["Centro de resultado", (() => { const c = CENTROS_RESULTADO.find(o => o.cod === centroResultado); return c ? `${c.cod} — ${c.descricao}` : centroResultado; })()]] : []),
                ...(projeto ? [["Projeto", (() => { const p = PROJETOS.find(o => o.cod === projeto); return p ? `${p.cod} — ${p.descricao}` : projeto; })()]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right max-w-[55%]">{value}</span>
                </div>
              ))}
            </div>

            {/* Alíquotas e empresas */}
            <p className="text-[12px] font-semibold text-foreground mt-2">Alíquotas e Empresas</p>
            <div className="divide-y divide-border/50 text-[13px]">
              {[
                ["Alíquota IBS",  `${aliqIBS}%`],
                ["Alíquota CBS",  `${aliqCBS}%`],
                ["CST",           cst || "—"],
                ["cClassTrib",    cClassTrib || "—"],
                ["Vigência",      vigencia],
                ["Empresas",      `${selEmpresas.size} empresa(s) selecionada(s)`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right max-w-[55%]">{value}</span>
                </div>
              ))}
            </div>
            {selEmpresas.size > 0 && (
              <div className="mt-1 divide-y divide-border/30 text-[12px]">
                {Array.from(selEmpresas).map(id => {
                  const emp = EMPRESAS.find(e => e.id === id);
                  return emp ? (
                    <div key={id} className="flex justify-between py-1.5">
                      <span className="text-muted-foreground">{emp.cod} — {emp.nome}</span>
                      <span className="font-mono font-medium">Série {serieEmpresas[id] || "—"}</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}

            <div className="mt-1 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 flex gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                Ao confirmar, a TOP será configurada com as regras de geração da Nota de Débito IBS/CBS — tipo de negociação,
                série por empresa e alíquotas IBS/CBS aplicadas automaticamente — e ficará disponível para emissão
                a partir dos movimentos registrados no portal.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
