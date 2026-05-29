import { useState, useEffect } from "react";
import { HelpCircle, Bell, ChevronDown, Sparkles, ArrowLeft, LayoutDashboard } from "lucide-react";
import { BIAChatProvider, useBIAChat } from "@/context/BIAChatContext";
import { BIAChat } from "@/components/BIAChat";
import { NavPanel } from "@/components/NavPanel";
import { ConversationalLanding } from "@/components/ConversationalLanding";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  children: React.ReactNode;
}

// ── Transition animation ──────────────────────────────────────────
const TRANSITION_STEPS = [
  "Pensando...",
  "Buscando tela...",
  "Carregando dados...",
  "Preparando o portal...",
];

function TransitionScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setStepIndex((i) => Math.min(i + 1, TRANSITION_STEPS.length - 1));
        setVisible(true);
      }, 150);
    }, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background gap-8 min-h-0">
      {/* Avatar with ripple */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute h-24 w-24 rounded-3xl bg-primary/10 animate-ping"
          style={{ animationDuration: "1.8s" }}
        />
        <div
          className="absolute h-20 w-20 rounded-2xl bg-primary/15 animate-ping"
          style={{ animationDuration: "1.8s", animationDelay: "0.3s" }}
        />
        <div className="relative h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
      </div>

      {/* Status message */}
      <div className="flex flex-col items-center gap-3">
        <p
          className="text-[15px] font-medium text-foreground transition-opacity duration-150"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {TRANSITION_STEPS[stepIndex]}
        </p>
        <div className="flex gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms",   animationDuration: "900ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "180ms", animationDuration: "900ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "360ms", animationDuration: "900ms" }} />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/40">
        BIA · Assistente de IA · Reforma Tributária
      </p>
    </div>
  );
}

// ── Inner layout ──────────────────────────────────────────────────
function AppLayoutInner({ children }: AppLayoutProps) {
  const { hasInteracted, immediateLayout } = useBIAChat();
  const [showMain, setShowMain] = useState(false);

  useEffect(() => {
    if (!hasInteracted || showMain) return;
    if (immediateLayout) {
      setShowMain(true);
      return;
    }
    const t = setTimeout(() => setShowMain(true), 2800);
    return () => clearTimeout(t);
  }, [hasInteracted, immediateLayout]);

  // Landing: full-screen conversational page
  if (!hasInteracted) {
    return <ConversationalLanding />;
  }

  // After interaction: 3-column layout; center shows loader or actual content
  return (
    <div className="h-screen flex w-full overflow-hidden">
      {/* LEFT: BIA Chat — already open */}
      <BIAChat />

      {/* CENTER: loader while transitioning, then header + content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!showMain ? (
          <TransitionScreen />
        ) : (
          <>
            <header className="h-14 flex items-center justify-between border-b bg-primary px-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-primary-foreground font-bold text-sm tracking-tight">Sankhya</span>
                <span className="text-primary-foreground/30 text-sm select-none">|</span>
                <span className="text-primary-foreground/90 text-sm">Portal da Reforma Tributária</span>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  className="flex items-center gap-1.5 text-primary-foreground/80 hover:text-primary-foreground border border-white/30 hover:border-white/60 hover:bg-white/10 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors mr-1"
                  title="Voltar para layout EIP"
                >
                  <LayoutDashboard className="h-[15px] w-[15px]" />
                  <span className="hidden sm:inline">Voltar para layout EIP</span>
                </button>
                <button className="relative text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 rounded p-2 transition-colors">
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-warning border border-primary" />
                </button>
                <button className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 rounded p-2 transition-colors">
                  <HelpCircle className="h-[18px] w-[18px]" />
                </button>

                <div className="w-px h-5 bg-white/20 mx-1.5" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 hover:bg-white/10 rounded-full pl-1 pr-3 py-1 transition-colors">
                      <div className="h-7 w-7 rounded-full bg-white/25 border border-white/30 flex items-center justify-center">
                        <span className="text-primary-foreground font-semibold text-xs">EL</span>
                      </div>
                      <span className="text-primary-foreground text-[13px] font-medium hidden sm:block">Avelino</span>
                      <ChevronDown className="h-3 w-3 text-primary-foreground/50 hidden sm:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px]">
                    <DropdownMenuItem asChild>
                      <a href="https://cognito-layout-dream.lovable.app/" className="flex items-center gap-2 cursor-pointer">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para Team Workers
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <main className="flex-1 p-6 bg-background overflow-auto">
              {children}
            </main>
          </>
        )}
      </div>

      {/* RIGHT: Nav Panel — already present */}
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
