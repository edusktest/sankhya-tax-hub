import { FileText, CheckCircle2, AlertTriangle, AlertCircle, Construction, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ERoutes } from "@/routes/interface";
import { cn } from "@/lib/utils";
import { ALERTAS } from "@/pages/AlertasPendentes";

interface HomeCard {
  icon: React.ReactNode;
  title: string;
  count?: number;
  route?: ERoutes;
}

const CARDS: HomeCard[] = [
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Documentos Processados",
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "Apurações Concluídas",
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: "Alertas Pendentes",
    count: ALERTAS.length,
    route: ERoutes.ALERTAS_PENDENTES,
  },
  {
    icon: <AlertCircle className="h-5 w-5" />,
    title: "Inconsistências",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[20px] font-semibold text-foreground leading-tight">Dashboard</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Visão geral do Portal da Reforma Tributária
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((card) => {
          const clickable = !!card.route;
          return (
            <div
              key={card.title}
              onClick={() => card.route && navigate(card.route)}
              className={cn(
                "bg-card border rounded-xl p-5 flex flex-col gap-3 card-shadow",
                clickable && "cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors group",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {card.icon}
                </div>
                {clickable && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
              <div>
                <p className="text-[12px] text-muted-foreground">{card.title}</p>
                <p className="text-[28px] font-bold text-foreground leading-none mt-1">
                  {card.count ?? "—"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5">
        <Construction className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-[13px] text-muted-foreground leading-snug">
          Esta área está em construção. Os dados serão exibidos em versões futuras do Portal da Reforma Tributária.
        </p>
      </div>
    </div>
  );
}
