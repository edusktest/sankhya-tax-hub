import {
  Calculator,
  FileText,
  Landmark,
  DollarSign,
  Settings,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Landmark className="h-6 w-6 text-primary" />
          {!collapsed && (
            <div>
              <h2 className="text-sm font-semibold text-foreground">Portal</h2>
              <p className="text-xs text-muted-foreground">Reforma Tributária</p>
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
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer">
                    {!collapsed && group.group}
                    {!collapsed && <ChevronDown className="h-3 w-3" />}
                  </SidebarGroupLabel>
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
                              className="hover:bg-accent/50"
                              activeClassName="bg-accent text-accent-foreground font-medium"
                            >
                              <item.icon className="mr-2 h-4 w-4" />
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
