import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BIAChat } from "@/components/BIAChat";
import {
  HelpCircle,
  Bell,
  User,
  Search,
  Grid3x3,
  ChevronRight,
  Landmark,
} from "lucide-react";
import { useLocation } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

const routeLabels: Record<string, string> = {
  "/apuracao-cbs": "Apuração CBS",
  "/apuracao-ibs": "Apuração IBS",
  "/apuracao-is": "Apuração IS",
  "/gestao-eventos": "Gestão Eventos",
  "/processos": "Processos",
  "/financeiro": "Financeiro",
};

const parentLabels: Record<string, string> = {
  "/apuracao-cbs": "Apuração",
  "/apuracao-ibs": "Apuração",
  "/apuracao-is": "Apuração",
  "/gestao-eventos": "Documentos",
  "/processos": "Operações",
  "/financeiro": "Operações",
};

function SankhyaLogo() {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <div
        className="flex items-center justify-center rounded-sm font-extrabold text-white text-[14px] leading-none"
        style={{
          width: 24,
          height: 24,
          background: "linear-gradient(135deg, #00b050 60%, #009040 100%)",
        }}
      >
        S
      </div>
      <span className="font-bold" style={{ color: "#00a050", fontSize: 14 }}>
        Sankhya
      </span>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const pageLabel = routeLabels[location.pathname] ?? "Portal da Reforma Tributária";
  const parentLabel = parentLabels[location.pathname] ?? "";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* ── Top bar ── estilo Sankhya: fundo branco */}
          <header
            className="h-11 flex items-center justify-between bg-white px-3 sticky top-0 z-40"
            style={{
              minHeight: 44,
              boxShadow: "0 1px 0 0 hsl(214 18% 88%)",
            }}
          >
            {/* Esquerda: toggle + logo + abas */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted/50 -ml-1" />
              <SankhyaLogo />

              {/* Abas de navegação no header (estilo Sankhya) */}
              <div className="flex items-center ml-1">
                <button className="flex items-center gap-1 px-3 h-11 text-[12px] text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-[#00a050] transition-colors whitespace-nowrap">
                  Portal da Reforma Tributária
                </button>
                {pageLabel !== "Portal da Reforma Tributária" && (
                  <button
                    className="flex items-center gap-1 px-3 h-11 text-[12px] font-medium border-b-2 whitespace-nowrap"
                    style={{ borderColor: "#00a050", color: "#00a050" }}
                  >
                    {pageLabel}
                    <span className="ml-1 text-[10px] text-muted-foreground">…</span>
                  </button>
                )}
              </div>
            </div>

            {/* Direita: busca + ícones + botão ação */}
            <div className="flex items-center gap-1.5">
              {/* Busca */}
              <div className="relative hidden md:flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquisar"
                  className="h-7 pl-8 pr-3 text-xs rounded border border-border bg-muted/30 outline-none focus:ring-1 focus:ring-[#00a050] focus:border-[#00a050] w-40"
                />
              </div>

              {/* Ícones de ação */}
              <button
                title="Ajuda"
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
              <button
                title="Notificações"
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <Bell className="h-4 w-4" />
              </button>
              <button
                title="Apps"
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                title="Perfil"
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <User className="h-4 w-4" />
              </button>

              {/* Botão de ação */}
              <button
                className="flex items-center gap-1 px-3 py-1.5 rounded text-white text-xs font-medium transition-opacity hover:opacity-90 ml-1"
                style={{ background: "#1a7d45" }}
              >
                Continuar do ponto parado
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          {/* ── Main content ── */}
          <main className="flex-1 px-6 py-5">
            {/* Breadcrumb interno da página */}
            {parentLabel && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                <Landmark className="h-3 w-3" />
                Portal da Reforma Tributária
                <ChevronRight className="h-3 w-3" />
                <span>{parentLabel}</span>
              </p>
            )}
            {children}
          </main>

          <BIAChat />
        </div>
      </div>
    </SidebarProvider>
  );
}
