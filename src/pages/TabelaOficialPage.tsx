import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Construction, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TITLES: Record<string, string> = {
  "classificacao-tributaria": "Classificação Tributária",
  "credito-presumido": "Crédito Presumido",
  "anexos": "Anexos",
  "indicadores-locais-operacao": "Indicadores dos Locais de Operação",
};

export default function TabelaOficialPage() {
  const location = useLocation();
  const slug = location.pathname.split("/").pop() ?? "";
  const title = TITLES[slug] ?? slug.replace(/-/g, " ");
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  function handleSync() {
    setSyncing(true);
    setSynced(false);
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
      setTimeout(() => setSynced(false), 4000);
    }, 1800);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
            <span>Configurações</span>
            <span className="mx-1">›</span>
            <span>Tabelas Oficiais</span>
            <span className="mx-1">›</span>
            <span className="text-foreground font-medium">{title}</span>
          </div>
          <h1 className="text-[18px] font-semibold text-foreground">{title}</h1>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 shrink-0"
          onClick={handleSync}
          disabled={syncing}
        >
          {synced ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span className="text-green-600">Agendado</span>
            </>
          ) : (
            <>
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Agendando…" : "Agendar Atualização"}
            </>
          )}
        </Button>
      </div>

      {synced && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-lg border border-green-500/30 bg-green-50 text-green-700 text-[13px] dark:bg-green-950/30 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Sincronização agendada com sucesso. As tabelas serão baixadas da API oficial da Receita Federal e estarão disponíveis em breve.
        </div>
      )}

      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
        <Construction className="h-12 w-12 mb-4 text-primary/40" />
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm mt-1">Em desenvolvimento</p>
      </div>
    </div>
  );
}
