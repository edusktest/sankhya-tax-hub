import {
  Calculator,
  FileText,
  DollarSign,
  Settings,
  ChevronRight,
  Search,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const menuItems = [
  {
    group: "Apuração",
    items: [
      { title: "Apuração CBS", url: "/apuracao-cbs", icon: Calculator },
      { title: "Apuração IBS", url: "/apuracao-ibs", icon: Calculator },
      { title: "Apuração IS", url: "/apuracao-is", icon: Calculator },
    ],
  },
  {
    group: "Documentos",
    items: [
      { title: "Gestão Eventos", url: "/gestao-eventos", icon: FileText },
    ],
  },
  {
    group: "Operações",
    items: [
      { title: "Processos", url: "/processos", icon: Settings },
      { title: "Financeiro", url: "/financeiro", icon: DollarSign },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-2.5">
        {!collapsed && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Digite um filtro"
              className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="pt-1">
        {menuItems.map((group) => {
          const isGroupActive = group.items.some((i) =>
            location.pathname.startsWith(i.url)
          );
          return (
            <Collapsible key={group.group} defaultOpen={isGroupActive || true}>
              <SidebarGroup className="py-0">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground cursor-pointer">
                    <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                    {!collapsed && group.group}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end
                              className="text-sm text-sidebar-foreground hover:bg-accent/50 pl-6"
                              activeClassName="bg-accent text-accent-foreground font-medium"
                            >
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
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
