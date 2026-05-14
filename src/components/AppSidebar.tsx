import React, { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  FileText,
  ChevronDown,
  ChevronRight,
  Calendar,
  SlidersHorizontal,
  Search,
  X,
  Building2,
  LayoutDashboard,
  Percent,
  BookOpen,
  Sparkles,
  Zap,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { ERoutes } from "@/routes/interface";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type SubItem = { title: string; url: string };

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  subItems?: SubItem[];
}

// Home is standalone — not inside a collapsible group
const HOME_ITEM: MenuItem = { title: "Home", url: ERoutes.HOME, icon: LayoutDashboard };

const menuGroups: { group: string; items: MenuItem[] }[] = [
  {
    group: "Operações",
    items: [
      { title: "Apuração CBS", url: ERoutes.APURACAO_CBS, icon: Calculator },
      { title: "Apuração IBS", url: ERoutes.APURACAO_IBS, icon: Calculator },
      { title: "Apuração IS",  url: ERoutes.APURACAO_IS,  icon: Calculator },
      {
        title: "DeRE",
        url: ERoutes.APURACAO_DERE,
        icon: FileText,
        subItems: [
          { title: "Plano Referencial",                    url: ERoutes.APURACAO_DERE_PLANO_REF  },
          { title: "D1001 – Inf. Contribuinte",            url: ERoutes.APURACAO_DERE_D1001      },
          { title: "D1011 – Plano Geral de Contas Comentado", url: ERoutes.APURACAO_DERE_D1011   },
          { title: "Histórico de Eventos",                 url: ERoutes.APURACAO_DERE_HISTORICO  },
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
        title: "Assistente",
        url: ERoutes.TRIBUTACAO_INTEGRAL,
        icon: SlidersHorizontal,
        subItems: [
          { title: "Tributação Integral - IBS/CBS",    url: ERoutes.TRIBUTACAO_INTEGRAL    },
          { title: "Tributação Personalizada - IBS/CBS", url: ERoutes.TRIBUTACAO_PERSONALIZADA },
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
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [taxBannerOpen, setTaxBannerOpen] = useState(false);

  const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(() => {
    const open = new Set<string>();
    menuGroups.forEach((group) =>
      group.items.forEach((item) => {
        if (item.subItems && location.pathname.startsWith(item.url))
          open.add(item.url);
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
    if (collapsed) setSearchQuery("");
  }, [collapsed]);

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
    menuGroups.forEach((group) =>
      group.items.forEach((item) => {
        if (item.subItems?.some((s) => s.title.toLowerCase().includes(q)))
          urls.add(item.url);
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
              const subs = item.subItems.filter((s) =>
                s.title.toLowerCase().includes(q)
              );
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-2.5">
          {collapsed ? (
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-extrabold text-[13px] leading-none">S</span>
            </div>
          ) : (
            <div>
              <p className="text-[13px] font-bold text-foreground leading-tight">Sankhya</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Portal da Reforma Tributária</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col">
        {/* Search */}
        {!collapsed && (
          <div className="px-3 py-2 border-b border-sidebar-border shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite um filtro"
                className="w-full h-8 rounded-md border border-input bg-background pl-8 pr-7 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Home — standalone, no group label ── */}
        {showHome && (
          <SidebarGroup className="py-1.5 shrink-0">
            <SidebarGroupContent>
              <SidebarMenu className={cn(!collapsed && "pl-3")}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-8">
                    <NavLink
                      to={HOME_ITEM.url}
                      end
                      className="rounded-md text-[13px] text-foreground/80 transition-colors hover:bg-accent/60 hover:text-foreground"
                      activeClassName="bg-primary/10 text-primary font-semibold"
                    >
                      {collapsed ? (
                        <LayoutDashboard className="h-4 w-4 shrink-0" />
                      ) : (
                        <span>Home</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {noResults && !collapsed && (
          <p className="px-4 py-6 text-[12px] text-muted-foreground text-center">
            Nenhum item encontrado.
          </p>
        )}

        {/* ── Operações + Configurações groups ── */}
        {filteredGroups.map((group) => {
          const isGroupActive = group.items.some((i) =>
            location.pathname.startsWith(i.url)
          );
          const forceGroupOpen = q.length > 0;

          return (
            <Collapsible
              key={group.group}
              open={forceGroupOpen ? true : undefined}
              defaultOpen={isGroupActive || true}
            >
              <SidebarGroup className="py-0">
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel
                    className={cn(
                      "flex items-center gap-1.5 cursor-pointer px-3 py-2 text-[13px] font-semibold text-foreground hover:bg-accent/40 rounded-md transition-colors select-none",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    {!collapsed && (
                      <>
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                        <span>{group.group}</span>
                      </>
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className={cn(!collapsed && "pl-3")}>
                      {group.items.map((item) => {
                        if (item.subItems) {
                          const isParentActive = location.pathname.startsWith(item.url);
                          const isOpen = openSubMenus.has(item.url) || forceOpenUrls.has(item.url);

                          return (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                onClick={() => toggleSubMenu(item.url)}
                                className={cn(
                                  "rounded-md transition-colors hover:bg-accent/60 h-8",
                                  isParentActive
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-foreground/80"
                                )}
                              >
                                {collapsed ? (
                                  <item.icon className="h-4 w-4 shrink-0" />
                                ) : (
                                  <>
                                    <span className="flex-1 text-[13px]">{item.title}</span>
                                    <ChevronDown
                                      className={cn(
                                        "h-3 w-3 shrink-0 transition-transform duration-200",
                                        isOpen && "rotate-180"
                                      )}
                                    />
                                  </>
                                )}
                              </SidebarMenuButton>

                              {isOpen && !collapsed && (
                                <div className="ml-3 border-l-2 border-border/50 pl-2 mt-0.5 mb-0.5">
                                  <SidebarMenuSub className="border-none ml-0 px-0">
                                    {item.subItems.map((sub) => (
                                      <SidebarMenuSubItem key={sub.title}>
                                        <SidebarMenuSubButton
                                          asChild
                                          className="h-auto whitespace-normal py-1.5 leading-snug items-start rounded-md"
                                        >
                                          <NavLink
                                            to={sub.url}
                                            end
                                            className="text-[12px] text-foreground/60 transition-colors hover:text-foreground hover:bg-accent/50 block w-full px-2 py-1 rounded-md"
                                            activeClassName="text-primary font-semibold bg-primary/10"
                                          >
                                            {sub.title}
                                          </NavLink>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    ))}
                                  </SidebarMenuSub>
                                </div>
                              )}
                            </SidebarMenuItem>
                          );
                        }

                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild className="h-8">
                              <NavLink
                                to={item.url}
                                end
                                className="rounded-md text-[13px] text-foreground/80 transition-colors hover:bg-accent/60 hover:text-foreground"
                                activeClassName="bg-primary/10 text-primary font-semibold"
                              >
                                {collapsed ? (
                                  <item.icon className="h-4 w-4 shrink-0" />
                                ) : (
                                  <span>{item.title}</span>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}

        {/* ── Sankhya Tax — group header style, banner collapses inline ── */}
        {(!q || "sankhya tax contratar".includes(q)) && (
          <Collapsible
            open={taxBannerOpen}
            onOpenChange={setTaxBannerOpen}
          >
            <SidebarGroup className="py-0 mt-auto shrink-0">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel
                  className={cn(
                    "flex items-center gap-1.5 cursor-pointer px-3 py-2 text-[13px] font-semibold text-foreground hover:bg-accent/40 rounded-md transition-colors select-none",
                    collapsed && "justify-center px-0"
                  )}
                >
                  {collapsed ? (
                    <Zap className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                          !taxBannerOpen && "-rotate-90"
                        )}
                      />
                      <span>Sankhya Tax</span>
                      <span className="ml-auto text-[9px] font-bold uppercase tracking-wide bg-emerald-500 text-white rounded-full px-2 py-0.5 shrink-0">
                        Contratar
                      </span>
                    </>
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>

              <CollapsibleContent>
                {!collapsed && (
                  <div className="px-2 pb-3">
                    <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-indigo-600 p-4 text-primary-foreground">
                      {/* Decorative blobs */}
                      <div className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/10" />
                      <div className="pointer-events-none absolute -bottom-4 right-2 h-16 w-16 rounded-full bg-indigo-400/20" />
                      <div className="pointer-events-none absolute top-8 -left-4 h-12 w-12 rounded-full bg-white/5" />

                      {/* Close button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setTaxBannerOpen(false); }}
                        className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/15 transition-colors z-10"
                        title="Fechar"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2 relative">
                        <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                          <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                        </div>
                        <span className="text-[13px] font-bold tracking-tight">Sankhya Tax</span>
                        <span className="ml-auto mr-5 text-[8px] font-black uppercase tracking-widest bg-yellow-400 text-yellow-900 rounded-full px-2 py-0.5 shrink-0">
                          Premium
                        </span>
                      </div>

                      {/* Body */}
                      <p className="text-[11px] text-white/80 leading-relaxed mb-3 relative">
                        Contrate o Sankhya Tax para trazer ainda mais inteligência para as rotinas do Portal da Reforma Tributária.
                      </p>

                      {/* CTA */}
                      <button className="relative w-full flex items-center justify-center gap-1.5 bg-white text-primary text-[12px] font-bold py-1.5 rounded-lg hover:bg-white/90 active:scale-[0.98] transition-all">
                        Contratar agora
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
