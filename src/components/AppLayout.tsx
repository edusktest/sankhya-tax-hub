import { useState, useEffect } from "react";
import { HelpCircle, Bell, ChevronDown, Sparkles, ArrowLeft, LayoutDashboard, Search, X, LayoutGrid, Home, FileText, BarChart2, Settings, Users } from "lucide-react";
import { BIAChatProvider, useBIAChat } from "@/context/BIAChatContext";
import { BIAChat } from "@/components/BIAChat";
import { NavPanel } from "@/components/NavPanel";
import { EIPSidebar } from "@/components/EIPSidebar";
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
  const { hasInteracted, immediateLayout, eipMode, setEipMode, skipToLayout } = useBIAChat();
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

  // EIP mode: traditional left-sidebar layout, no BIA, no NavPanel
  if (eipMode) {
    return (
      <div className="h-screen flex w-full overflow-hidden">

        {/* ── Faixa Sankhya full-height (logo no topo) ───────────── */}
        <div className="w-14 bg-[#1A2B47] shrink-0 flex flex-col items-center py-3 gap-1">
          <div className="mb-3 flex items-center justify-center">
            <img src="/sankhyalogo.png" alt="Sankhya" className="h-9 w-9 object-contain" />
          </div>
          {[
            { icon: Home,      label: "Home"       },
            { icon: BarChart2, label: "Dashboard"  },
            { icon: FileText,  label: "Documentos" },
            { icon: Users,     label: "Usuários"   },
            { icon: Settings,  label: "Config"     },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              title={label}
              className="w-9 h-9 flex items-center justify-center rounded-md text-white/55 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icon className="h-[18px] w-[18px]" />
            </button>
          ))}
        </div>

        {/* ── Coluna direita: barra superior + conteúdo ─────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          <header className="h-[60px] flex items-end justify-between bg-white border-b border-[#E3E6EA] shrink-0 pl-3 pr-3 pb-2">
            <div className="flex items-end gap-2">
              {/* Aba ativa */}
              <div className="flex items-center gap-2 px-3 h-9 bg-white border border-[#C9D3CE] rounded-lg shadow-sm text-[13px] text-[#333333]">
                <span className="font-medium truncate max-w-[220px]">Portal da Reforma Tributária</span>
                <button
                  onClick={() => { setEipMode(false); skipToLayout(); }}
                  className="text-[#999999] hover:text-[#555555] shrink-0 transition-colors"
                  title="Fechar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <button className="text-[#555555] hover:text-[#222222] transition-colors mb-2">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Ações à direita */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => { setEipMode(false); skipToLayout(); }}
                className="flex items-center gap-1 text-[#444444] hover:text-primary hover:bg-accent/60 rounded px-2 py-1 text-[11px] font-medium transition-colors mr-1"
                title="Abrir Portal IA"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Portal IA</span>
              </button>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#777777] pointer-events-none" />
                <input
                  placeholder="Buscar"
                  readOnly
                  className="h-8 pl-7 pr-3 text-[12px] bg-white border border-[#DCE1E6] rounded-md w-[140px] placeholder:text-[#999999] focus:outline-none cursor-default"
                />
              </div>
              <button className="relative p-1.5 text-[#444444] hover:bg-muted rounded transition-colors">
                <Bell className="h-[16px] w-[16px]" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-warning" />
              </button>
              <button className="p-1.5 text-[#444444] hover:bg-muted rounded transition-colors">
                <HelpCircle className="h-[16px] w-[16px]" />
              </button>
              <button className="p-1.5 text-[#444444] hover:bg-muted rounded transition-colors">
                <LayoutGrid className="h-[16px] w-[16px]" />
              </button>
              <div className="w-px h-4 bg-[#DDDDDD] mx-1" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 hover:bg-muted rounded-full pl-0.5 pr-2 py-0.5 transition-colors">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-primary-foreground font-semibold text-[10px]">AS</span>
                    </div>
                    <span className="text-[#333333] text-[12px] font-medium hidden sm:block">Ana Silva</span>
                    <ChevronDown className="h-3 w-3 text-[#888888] hidden sm:block" />
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

          <div className="flex-1 flex min-w-0 overflow-hidden">
            <EIPSidebar />
            <main className="flex-1 p-6 bg-background overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    );
  }


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
                  onClick={() => setEipMode(true)}
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
                        <span className="text-primary-foreground font-semibold text-xs">AS</span>
                      </div>
                      <span className="text-primary-foreground text-[13px] font-medium hidden sm:block">Ana Silva</span>
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
