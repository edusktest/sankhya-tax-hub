import type { Apuracao } from "@/data/mockData";

export function ApuracaoHeaderCard({ apuracao, resumido = false }: { apuracao: Apuracao; resumido?: boolean }) {
  return (
    <div className="bg-card rounded-lg card-shadow border p-5 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Período da apuração</p>
          <h1 className="text-lg font-semibold text-foreground">{apuracao.periodo}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{apuracao.razaoSocial}</p>
        </div>
      </div>
      {!resumido && (
      <div className="mt-3 flex gap-8">
        <div>
          <p className="text-xs text-muted-foreground">Resultado da apuração</p>
          <p className="text-sm font-mono font-semibold">{apuracao.resultadoApuracao}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Saldo atualizado</p>
          <p className="text-sm font-mono font-semibold">{apuracao.saldoPagarAtual}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Tipo de resultado</p>
          <p className={`text-sm font-semibold ${
            apuracao.tipoResultado === "Credor" ? "text-success" :
            apuracao.tipoResultado === "Devedor" ? "text-destructive" : "text-muted-foreground"
          }`}>{apuracao.tipoResultado}</p>
        </div>
      </div>
      )}
    </div>
  );
}
