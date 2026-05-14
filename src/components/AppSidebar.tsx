import React, { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  FileText,
  ChevronDown,
  Calendar,
  SlidersHorizontal,
  Search,
  X,
  Building2,
  LayoutDashboard,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { ERoutes } from "@/routes/interface";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
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

const menuItems: { group: string; items: MenuItem[] }[] = [
  {
    group: "Geral",
    items: [
      { title: "Home", url: ERoutes.HOME, icon: LayoutDashboard },
    ],
  },
  {
    group: "Operações",
    items: [
      { title: "Apuração CBS", url: ERoutes.APURACAO_CBS, icon: Calculator },
      { title: "Apuração IBS", url: ERoutes.APURACAO_IBS, icon: Calculator },
      { title: "Apuração IS", url: ERoutes.APURACAO_IS, icon: Calculator },
      {
        title: "DeRE",
        url: ERoutes.APURACAO_DERE,
        icon: FileText,
        subItems: [
          { title: "Plano Referencial", url: ERoutes.APURACAO_DERE_PLANO_REF },
          { title: "D1001 – Inf. Contribuinte", url: ERoutes.APURACAO_DERE_D1001 },
          { title: "D1011 – Plano Geral de Contas Comentado", url: ERoutes.APURACAO_DERE_D1011 },
          { title: "Histórico de Eventos", url: ERoutes.APURACAO_DERE_HISTORICO },
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
          { title: "Tributação Integral - IBS/CBS", url: ERoutes.TRIBUTACAO_INTEGRAL },
          { title: "Tributação Personalizada - IBS/CBS", url: ERoutes.TRIBUTACAO_PERSONALIZADA },
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

  const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(() => {
    const open = new Set<string>();
    menuItems.forEach((group) =>
      group.items.forEach((item) => {
        if (item.subItems && location.pathname.startsWith(item.url))
          open.add(item.url);
      })
    );
    return open;
  });

  useEffect(() => {
    menuItems.forEach((group) =>
      group.items.forEach((item) => {
        if (item.subItems && location.pathname.startsWith(item.url))
          setOpenSubMenus((prev) => new Set([...prev, item.url]));
      })
    );
  }, [location.pathname]);

  // Clear search when sidebar collapses
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

  // Items whose sub-items partially match → force open them
  const forceOpenUrls = useMemo(() => {
    const urls = new Set<string>();
    if (!q) return urls;
    menuItems.forEach((group) =>
      group.items.forEach((item) => {
        if (item.subItems?.some((s) => s.title.toLowerCase().includes(q)))
          urls.add(item.url);
      })
    );
    return urls;
  }, [q]);

  // Filtered menu: keep items/sub-items that match the query
  const filteredMenu = useMemo(() => {
    if (!q) return menuItems;
    return menuItems
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
      .filter(Boolean) as typeof menuItems;
  }, [q]);

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

      <SidebarContent>
        {/* Search input — only in expanded mode */}
        {!collapsed && (
          <div className="px-3 py-2 border-b border-sidebar-border">
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

        {filteredMenu.length === 0 && !collapsed && (
          <p className="px-4 py-6 text-[12px] text-muted-foreground text-center">
            Nenhum item encontrado.
          </p>
        )}

        {filteredMenu.map((group) => {
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
      </SidebarContent>
    </Sidebar>
  );
}
