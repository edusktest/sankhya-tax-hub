import {
  Calculator,
  FileText,
  DollarSign,
  Settings,
  ChevronRight,
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
    <Sidebar
      collapsible="icon"
      style={
        {
          "--sidebar-width": "210px",
          "--sidebar-width-icon": "44px",
        } as React.CSSProperties
      }
    >
      {/* Header — filtro estilo Sankhya */}
      <SidebarHeader className="border-b border-sidebar-border px-3 py-2">
        {!collapsed ? (
          <div className="relative">
            <input
              type="text"
              placeholder="Digite um filtro"
              className="w-full h-7 pl-3 pr-3 text-xs rounded border border-border bg-muted/40 outline-none focus:ring-1 focus:ring-[#00a050] focus:border-[#00a050]"
            />
          </div>
        ) : (
          <div className="flex justify-center py-0.5">
            <div
              className="flex items-center justify-center rounded-sm font-extrabold text-white text-[13px] leading-none"
              style={{
                width: 24,
                height: 24,
                background: "linear-gradient(135deg, #00b050 60%, #009040 100%)",
              }}
            >
              S
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="py-1">
        {menuItems.map((group) => {
          const isGroupActive = group.items.some((i) =>
            location.pathname.startsWith(i.url)
          );

          return (
            <Collapsible
              key={group.group}
              defaultOpen={isGroupActive || true}
              className="group/collapsible"
            >
              {/* Group label colapsável */}
              <CollapsibleTrigger asChild>
                <button
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-left
                    transition-colors hover:bg-muted/50 ${collapsed ? "justify-center px-2" : ""}`}
                >
                  {!collapsed && (
                    <>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide leading-none">
                        {group.group}
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform duration-150 group-data-[state=open]/collapsible:rotate-90" />
                    </>
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <SidebarGroup className="py-0">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.url;
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={item.url}
                                end
                                className={`flex items-center gap-2 px-4 py-1.5 text-xs leading-snug
                                  transition-colors rounded-none w-full
                                  ${
                                    isActive
                                      ? "bg-[hsl(152,60%,94%)] text-[hsl(152,100%,24%)] font-medium border-l-2 border-[#00a050]"
                                      : "text-sidebar-foreground hover:bg-muted/50 border-l-2 border-transparent"
                                  }`}
                                activeClassName=""
                              >
                                <item.icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
