import { HelpCircle, Bell, ChevronDown } from "lucide-react";
import { BIAChatProvider } from "@/context/BIAChatContext";
import { useBIAChat } from "@/context/BIAChatContext";
import { BIAChat } from "@/components/BIAChat";
import { NavPanel } from "@/components/NavPanel";
import { ConversationalLanding } from "@/components/ConversationalLanding";

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayoutInner({ children }: AppLayoutProps) {
  const { hasInteracted } = useBIAChat();

  if (!hasInteracted) {
    return <ConversationalLanding />;
  }

  return (
    <div className="h-screen flex w-full overflow-hidden">
      {/* LEFT: BIA Chat */}
      <BIAChat />

      {/* CENTER: Header + Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between border-b bg-primary px-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-primary-foreground font-bold text-sm tracking-tight">Sankhya</span>
            <span className="text-primary-foreground/30 text-sm select-none">|</span>
            <span className="text-primary-foreground/90 text-sm">Portal da Reforma Tributária</span>
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

        <main className="flex-1 p-6 bg-background overflow-auto">
          {children}
        </main>
      </div>

      {/* RIGHT: Nav Panel */}
      <NavPanel />
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <BIAChatProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </BIAChatProvider>
  );
}
