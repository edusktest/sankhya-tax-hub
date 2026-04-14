import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BIAChat } from "@/components/BIAChat";
import { Search, HelpCircle, Bell, User, Grid3X3 } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Top bar — Sankhya style */}
          <header className="h-11 flex items-center justify-between border-b bg-card px-3">
            <div className="flex items-center gap-1">
              <SidebarTrigger className="text-muted-foreground hover:bg-muted" />
              <div className="flex items-center gap-1.5 ml-1">
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23158f52' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 6v6l4 2'/%3E%3C/svg%3E"
                  alt=""
                  className="h-5 w-5"
                />
                <span className="text-sm font-bold text-foreground tracking-tight">
                  Sankhya
                </span>
              </div>
              {/* Tab-style navigation */}
              <div className="flex items-center ml-4 gap-0.5">
                <div className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-t-md border border-b-0 text-xs font-medium text-foreground">
                  Apuração CBS
                  <button className="ml-1 text-muted-foreground hover:text-foreground text-[10px]">×</button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="relative mr-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  placeholder="Pesquisar"
                  className="h-7 w-[140px] rounded-md border bg-background pl-7 pr-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                <HelpCircle className="h-4 w-4" />
              </button>
              <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                <Bell className="h-4 w-4" />
              </button>
              <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                <User className="h-4 w-4" />
              </button>
            </div>
          </header>
          <main className="flex-1 p-6 bg-background">{children}</main>
          <BIAChat />
        </div>
      </div>
    </SidebarProvider>
  );
}
