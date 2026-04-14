import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BIAChat } from "@/components/BIAChat";
import { Landmark, HelpCircle, Bell, User } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center justify-between border-b bg-primary px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-primary-foreground hover:bg-primary/80" />
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary-foreground" />
                <span className="text-sm font-semibold text-primary-foreground">
                  Portal da Reforma Tributária
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-primary-foreground/80 hover:text-primary-foreground">
                <HelpCircle className="h-4 w-4" />
              </button>
              <button className="text-primary-foreground/80 hover:text-primary-foreground">
                <Bell className="h-4 w-4" />
              </button>
              <button className="text-primary-foreground/80 hover:text-primary-foreground">
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
