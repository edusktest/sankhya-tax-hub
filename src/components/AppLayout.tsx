import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BIAChat } from "@/components/BIAChat";
import { BIAChatProvider } from "@/context/BIAChatContext";
import { HomeQueryBox } from "@/components/HomeQueryBox";
import { HelpCircle, Bell, ChevronDown, Sparkles } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

function getQueryBoxPref(): boolean {
  try { return localStorage.getItem("bia-query-open") !== "0"; } catch { return true; }
}

function setQueryBoxPref(v: boolean) {
  try { localStorage.setItem("bia-query-open", v ? "1" : "0"); } catch { /* noop */ }
}

export function AppLayout({ children }: AppLayoutProps) {
  const [queryBoxOpen, setQueryBoxOpenState] = useState(getQueryBoxPref);

  function handleCollapse() {
    setQueryBoxOpenState(false);
    setQueryBoxPref(false);
  }

  function handleExpand() {
    setQueryBoxOpenState(true);
    setQueryBoxPref(true);
  }

  return (
    <BIAChatProvider>
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 flex items-center justify-between border-b bg-primary px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-primary-foreground hover:bg-white/10 rounded transition-colors" />
              <div className="flex items-center gap-2">
                <span className="text-primary-foreground font-bold text-sm tracking-tight">Sankhya</span>
                <span className="text-primary-foreground/30 text-sm select-none">|</span>
                <span className="text-primary-foreground/90 text-sm">Portal da Reforma Tributária</span>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              <button className="relative text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 rounded p-2 transition-colors">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-warning border border-primary" />
              </button>
              <button className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 rounded p-2 transition-colors">
                <HelpCircle className="h-[18px] w-[18px]" />
              </button>

              <div className="w-px h-5 bg-white/20 mx-1.5" />

              <button className="flex items-center gap-2 hover:bg-white/10 rounded-full pl-1 pr-3 py-1 transition-colors">
                <div className="h-7 w-7 rounded-full bg-white/25 border border-white/30 flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-xs">EL</span>
                </div>
                <span className="text-primary-foreground text-[13px] font-medium hidden sm:block">Eduardo Lino</span>
                <ChevronDown className="h-3 w-3 text-primary-foreground/50 hidden sm:block" />
              </button>
            </div>
          </header>

          {/* BIA + main content side-by-side — BIA takes full height after header */}
          <div className="flex-1 flex overflow-hidden">
            <main className="flex-1 p-6 bg-background overflow-auto">
              {/* Query box scrolls with page content */}
              <div className="mb-6">
                {queryBoxOpen ? (
                  <HomeQueryBox onCollapse={handleCollapse} />
                ) : (
                  <button
                    onClick={handleExpand}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
                  >
                    <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center shrink-0">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-[13px] font-medium text-primary flex-1">O que você está pensando?</span>
                    <ChevronDown className="h-3.5 w-3.5 text-primary/60" />
                  </button>
                )}
              </div>
              {children}
            </main>
            <BIAChat />
          </div>
        </div>
      </div>
    </SidebarProvider>
    </BIAChatProvider>
  );
}
