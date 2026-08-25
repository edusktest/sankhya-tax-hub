import React, { useState, useEffect, useMemo } from "react";
import {
  Calculator, FileText, ChevronDown, Calendar,
  SlidersHorizontal, Search, X, Building2, LayoutDashboard,
  Percent, BookOpen, Sparkles, Menu, ChevronLeft, ChevronRight, Bot, Globe,
  TrendingUp, TrendingDown, FileStack,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { ERoutes } from "@/routes/interface";
import { cn } from "@/lib/utils";

type SubItem = { title: string; url: string };
interface MenuItem { title: string; url: string; icon: React.ElementType; subItems?: SubItem[] }

const HOME_ITEM: MenuItem = { title: "Home", url: ERoutes.HOME, icon: LayoutDashboard };

const menuGroups: { group: string; items: MenuItem[] }[] = [
  {
    group: "Movimentações",
    items: [
      {
        title: "Receitas",
        url: ERoutes.MOVIMENTACOES_RECEITAS_MOVIMENTO,
        icon: TrendingUp,
        subItems: [
          { title: "Movimento",     url: ERoutes.MOVIMENTACOES_RECEITAS_MOVIMENTO   },
          { title: "Multa e Juros", url: ERoutes.MOVIMENTACOES_RECEITAS_MULTA_JUROS },
        ],
      },
      {
        title: "Despesas",
        url: ERoutes.MOVIMENTACOES_DESPESAS_MOVIMENTO,
        icon: TrendingDown,
        subItems: [
          { title: "Movimento", url: ERoutes.MOVIMENTACOES_DESPESAS_MOVIMENTO },
        ],
      },
      {
        title: "Documentos",
        url: ERoutes.MOVIMENTACOES_DOCUMENTOS_MOVIMENTO,
        icon: FileStack,
        subItems: [
          { title: "Movimento", url: ERoutes.MOVIMENTACOES_DOCUMENTOS_MOVIMENTO },
        ],
      },
    ],
  },
  {
    group: "Operações",
    items: [
      {
        title: "Apuração CBS",
        url: ERoutes.APURACAO_CBS,
        icon: Calculator,
        subItems: [
          { title: "Apurações",          url: ERoutes.APURACAO_CBS                    },
          { title: "Conciliação Fiscal", url: ERoutes.APURACAO_CONCILIACAO_FISCAL     },
        ],
      },
      { title: "Apuração IBS", url: ERoutes.APURACAO_IBS, icon: Calculator },
      { title: "Apuração IS",  url: ERoutes.APURACAO_IS,  icon: Calculator },
      {
        title: "DeRE",
        url: ERoutes.APURACAO_DERE,
        icon: FileText,
        subItems: [
          { title: "Plano Referencial",                       url: ERoutes.APURACAO_DERE_PLANO_REF },
          { title: "D1001 – Inf. Contribuinte",               url: ERoutes.APURACAO_DERE_D1001     },
          { title: "D1011 – Plano Geral de Contas Comentado", url: ERoutes.APURACAO_DERE_D1011     },
          { title: "Histórico de Eventos",                    url: ERoutes.APURACAO_DERE_HISTORICO  },
          { title: "Credenciais",                             url: ERoutes.APURACAO_DERE_CREDENCIAIS },
        ],
      },
      { title: "Gestão Eventos", url: ERoutes.GESTAO_EVENTOS, icon: Calendar },
    ],
  },
  {
    group: "Configurações",
    items: [
      { title: "Empresas", url: ERoutes.CONFIG_EMPRESAS, icon: Building2 },
      {
        title: "Assistentes",
        url: ERoutes.TRIBUTACAO_INTEGRAL,
        icon: SlidersHorizontal,
        subItems: [
          { title: "Tributação Integral - IBS/CBS",               url: ERoutes.TRIBUTACAO_INTEGRAL           },
          { title: "Exceções da Tributação Integral - IBS/CBS",   url: ERoutes.CONFIG_ASSISTENTE_EXCECOES    },
          { title: "NFe débito - IBS/CBS",                        url: ERoutes.CONFIG_ASSISTENTE_NFE_DEBITO  },
          { title: "NFe crédito - IBS/CBS",                       url: ERoutes.CONFIG_ASSISTENTE_NFE_CREDITO },
        ],
      },
      {
        title: "Alíquotas",
        url: ERoutes.CONFIG_ALIQUOTAS_CBS,
        icon: Percent,
        subItems: [
          { title: "CBS", url: ERoutes.CONFIG_ALIQUOTAS_CBS },
          { title: "IBS", url: ERoutes.CONFIG_ALIQUOTAS_IBS },
          { title: "IS",  url: ERoutes.CONFIG_ALIQUOTAS_IS  },
        ],
      },
      {
        title: "Tabelas Oficiais",
        url: ERoutes.CONFIG_TABELAS_CLASSIFICACAO,
        icon: BookOpen,
        subItems: [
          { title: "Classificação Tributária",           url: ERoutes.CONFIG_TABELAS_CLASSIFICACAO     },
          { title: "Crédito Presumido",                  url: ERoutes.CONFIG_TABELAS_CREDITO_PRESUMIDO },
          { title: "Anexos",                             url: ERoutes.CONFIG_TABELAS_ANEXOS            },
          { title: "Indicadores dos Locais de Operação", url: ERoutes.CONFIG_TABELAS_INDICADORES       },
        ],
      },
    ],
  },
  {
    group: "Digital Workers",
    items: [
      { title: "Configurações Globais",   url: ERoutes.DIGITAL_WORKERS_CONFIG_GLOBAL, icon: Globe },
      { title: "Configuração por Worker", url: ERoutes.DIGITAL_WORKERS_CONFIG_WORKER, icon: Bot  },
    ],
  },
];

export function EIPSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(() => {
    const open = new Set<string>();
    menuGroups.forEach((group) =>
      group.items.forEach((item) => {
        if (item.subItems && location.pathname.startsWith(item.url)) open.add(item.url);
      })
    );
    return open;
  });

  useEffect(() => {
    menuGroups.forEach((group) =>
      group.items.forEach((item) => {
        if (item.subItems && location.pathname.startsWith(item.url))
          setOpenSubMenus((prev) => new Set([...prev, item.url]));
      })
    );
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) setSearchQuery("");
  }, [isOpen]);

  function toggleSubMenu(url: string) {
    setOpenSubMenus((prev) => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  }

  const q = searchQuery.toLowerCase().trim();

  const forceOpenUrls = useMemo(() => {
    const urls = new Set<string>();
    if (!q) return urls;
    menuGroups.forEach((g) =>
      g.items.forEach((item) => {
        if (item.subItems?.some((s) => s.title.toLowerCase().includes(q))) urls.add(item.url);
      })
    );
    return urls;
  }, [q]);

  const showHome = !q || HOME_ITEM.title.toLowerCase().includes(q);

  const filteredGroups = useMemo(() => {
    if (!q) return menuGroups;
    return menuGroups
      .map((group) => {
        const filteredItems = group.items
          .map((item) => {
            if (item.title.toLowerCase().includes(q)) return item;
            if (item.subItems) {
              const subs = item.subItems.filter((s) => s.title.toLowerCase().includes(q));
              if (subs.length) return { ...item, subItems: subs };
            }
            return null;
          })
          .filter(Boolean) as MenuItem[];
        return filteredItems.length ? { ...group, items: filteredItems } : null;
      })
      .filter(Boolean) as typeof menuGroups;
  }, [q]);

  const noResults = !showHome && filteredGroups.length === 0;

  return (
    <div
      className={cn(
        "flex flex-col bg-white shrink-0 transition-[width] duration-200 overflow-hidden",
        isOpen ? "w-[260px]" : "w-12"
      )}
      style={{ boxShadow: "1px 0 0 0 hsl(214 20% 90%)" }}
    >
      {/* Header */}
      {isOpen ? (
        <div className="flex items-center gap-2 px-3 h-12 border-b shrink-0">
          <span className="flex-1 text-[12px] font-semibold text-[#333333] truncate">Portal da Reforma Tributária</span>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-[#E3F2FD] rounded p-1.5 transition-colors shrink-0"
            title="Recolher"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center justify-center h-12 border-b hover:bg-[#E3F2FD] transition-colors w-full shrink-0"
          title="Expandir navegação"
        >
          <Menu className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Collapsed label */}
      {!isOpen && (
        <div
          className="flex-1 flex items-center justify-center cursor-pointer hover:bg-accent/40 transition-colors"
          onClick={() => setIsOpen(true)}
        >
          <span
            className="text-[9px] font-semibold text-muted-foreground tracking-[0.2em] uppercase select-none"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Navegação
          </span>
        </div>
      )}

      {/* Nav content */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Home */}
          {showHome && (
            <div className="px-2 py-1.5 shrink-0">
              <NavLink
                to={HOME_ITEM.url}
                end
                className="flex items-center px-3 h-8 rounded-md text-[13px] text-[#333333] hover:bg-[#E3F2FD] hover:text-[#1565C0] transition-colors"
                activeClassName="bg-[#E3F2FD] text-[#1565C0] font-semibold border-l-[3px] border-[#1565C0] rounded-l-none pl-[10px]"
              >
                <span>Home</span>
              </NavLink>
            </div>
          )}

          {noResults && (
            <p className="px-4 py-6 text-[12px] text-muted-foreground text-center">
              Nenhum item encontrado.
            </p>
          )}

          {/* Groups */}
          {filteredGroups.map((group) => (
            <div key={group.group} className="shrink-0">
              <div className="px-3 pt-3 pb-1">
                <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest">
                  {group.group}
                </span>
              </div>
              <div className="px-2 pb-1">
                {group.items.map((item) => {
                  const isParentActive = location.pathname.startsWith(item.url);
                  const isSubOpen = openSubMenus.has(item.url) || forceOpenUrls.has(item.url);

                  if (item.subItems) {
                    return (
                      <div key={item.title}>
                        <button
                          onClick={() => toggleSubMenu(item.url)}
                          className={cn(
                            "flex items-center w-full px-3 h-8 rounded-md text-[13px] transition-colors hover:bg-[#E3F2FD] hover:text-[#1565C0]",
                            isParentActive ? "bg-[#E3F2FD] text-[#1565C0] font-semibold border-l-[3px] border-[#1565C0] rounded-l-none pl-[10px]" : "text-[#333333]"
                          )}
                        >
                          <span className="flex-1 text-left">{item.title}</span>
                          <ChevronDown
                            className={cn(
                              "h-3 w-3 shrink-0 transition-transform duration-200",
                              isSubOpen && "rotate-180"
                            )}
                          />
                        </button>
                        {isSubOpen && (
                          <div className="ml-4 mt-0.5 mb-0.5">
                            {item.subItems.map((sub) => (
                              <NavLink
                                key={sub.title}
                                to={sub.url}
                                end
                                className="flex items-start px-3 py-1.5 rounded-md text-[12px] text-[#555555] hover:text-[#1565C0] hover:bg-[#E3F2FD] transition-colors leading-snug"
                                activeClassName="text-[#1565C0] font-semibold bg-[#E3F2FD] border-l-[3px] border-[#1565C0] rounded-l-none pl-[10px]"
                              >
                                {sub.title}
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      end
                      className="flex items-center px-3 h-8 rounded-md text-[13px] text-[#333333] hover:bg-[#E3F2FD] hover:text-[#1565C0] transition-colors"
                      activeClassName="bg-[#E3F2FD] text-[#1565C0] font-semibold border-l-[3px] border-[#1565C0] rounded-l-none pl-[10px]"
                    >
                      <span>{item.title}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}
