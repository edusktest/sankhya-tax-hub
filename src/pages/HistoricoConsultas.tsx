import { ChevronRight } from "lucide-react";

export default function HistoricoConsultas() {
  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
          <span>Apuração</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">CBS</span>
        </div>
        <h1 className="text-[20px] font-semibold text-foreground leading-tight">Histórico de consultas</h1>
      </div>

      <div className="bg-card rounded-lg card-shadow border p-10 text-center text-sm text-muted-foreground">
        🚧 Em construção
      </div>
    </div>
  );
}
