import React, { useState, useEffect } from "react";
import {
  Calculator,
  FileText,
  DollarSign,
  ChevronDown,
  Calendar,
  Settings2,
  SlidersHorizontal,
  Shield,
  Banknote,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
    group: "Apuração",
    items: [
      { title: "Apuração CBS", url: "/apuracao-cbs", icon: Calculator },
      { title: "Apuração IBS", url: "/apuracao-ibs", icon: Calculator },
      { title: "Apuração IS", url: "/apuracao-is", icon: Calculator },
      {
        title: "DeRE",
        url: "/apuracao-dere",
        icon: FileText,
        subItems: [
          { title: "Plano Referencial", url: "/apuracao-dere/plano-ref" },
          { title: "D1001 – Inf. Contribuinte", url: "/apuracao-dere/d1001" },
          { title: "D1011 – Plano Geral de Contas Comentado", url: "/apuracao-dere/d1011" },
          { title: "Histórico de Eventos", url: "/apuracao-dere/historico" },
        ],
      },
    ],
  },
  {
    group: "Documentos",
    items: [
      { title: "Gestão Eventos", url: "/gestao-eventos", icon: Calendar },
    ],
  },
  {
    group: "Operações",
    items: [
      { title: "Processos", url: "/processos", icon: Settings2 },
      { title: "Financeiro", url: "/financeiro", icon: Banknote },
    ],
  },
  {
    group: "Configurações",
    items: [
      { title: "Tributação Integral", url: "/tributacao-integral", icon: Shield },
      { title: "Tributação Personalizada", url: "/tributacao-personalizada", icon: SlidersHorizontal },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

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

  function toggleSubMenu(url: string) {
    setOpenSubMenus((prev) => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  }

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
        {menuItems.map((group) => {
          const isGroupActive = group.items.some((i) =>
            location.pathname.startsWith(i.url)
          );
          return (
            <Collapsible key={group.group} defaultOpen={isGroupActive || true}>
              <SidebarGroup>
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer uppercase tracking-wider text-[10px] font-semibold">
                    {!collapsed && group.group}
                    {!collapsed && <ChevronDown className="h-3 w-3" />}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        if (item.subItems) {
                          const isParentActive = location.pathname.startsWith(item.url);
                          const isOpen = openSubMenus.has(item.url);
                          return (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                onClick={() => toggleSubMenu(item.url)}
                                className={cn(
                                  "hover:bg-accent/60 border-l-[3px] transition-colors",
                                  isParentActive
                                    ? "bg-accent text-accent-foreground font-semibold border-l-primary"
                                    : "border-transparent"
                                )}
                              >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {!collapsed && (
                                  <>
                                    <span className="flex-1 ml-2">{item.title}</span>
                                    <ChevronDown
                                      className={cn(
                                        "h-3 w-3 transition-transform duration-200",
                                        isOpen && "rotate-180"
                                      )}
                                    />
                                  </>
                                )}
                              </SidebarMenuButton>
                              {isOpen && !collapsed && (
                                <SidebarMenuSub>
                                  {item.subItems.map((sub) => (
                                    <SidebarMenuSubItem key={sub.title}>
                                      <SidebarMenuSubButton
                                        asChild
                                        className="h-auto whitespace-normal py-1.5 leading-snug items-start"
                                      >
                                        <NavLink
                                          to={sub.url}
                                          end
                                          className="transition-colors"
                                          activeClassName="text-primary font-semibold bg-sidebar-accent"
                                        >
                                          {sub.title}
                                        </NavLink>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarMenuSub>
                              )}
                            </SidebarMenuItem>
                          );
                        }
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={item.url}
                                end
                                className="hover:bg-accent/60 border-l-[3px] border-transparent transition-colors"
                                activeClassName="bg-accent text-accent-foreground font-semibold border-l-[3px] border-primary"
                              >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {!collapsed && <span className="ml-2">{item.title}</span>}
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
