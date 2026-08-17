import { FileText, Info, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Subtipos de tpNFCredito serão mapeados na próxima iteração deste assistente.

export default function AssistenteNfeCreditoPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-5">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold text-foreground leading-tight">
            Assistente — Nota de Crédito IBS/CBS
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Configure os Tipos de Operação (TOP) e alíquotas para emissão de Notas de Crédito
            {" "}(<span className="font-medium">finNFe = 5</span>).
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 flex gap-3">
        <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[13px] font-semibold text-emerald-800 dark:text-emerald-300">
            O que é uma Nota de Crédito?
          </p>
          <p className="text-[12px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
            Documenta situações em que o emitente registra uma <strong>redução no imposto devido</strong> —
            como devoluções de mercadorias, incentivos fiscais, reduções de preço ou créditos
            não escriturados pelo fornecedor. Finalidade <strong>finNFe = 5</strong> na NF-e.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-3">
        <p className="text-[13px] font-semibold text-foreground">Estrutura prevista (2 etapas):</p>
        <div className="space-y-3">
          {[
            {
              n: 1,
              title: "Configuração de TOP",
              desc: "Seleção do subtipo da nota de crédito (tpNFCredito), nome da TOP e empresas aplicáveis.",
            },
            {
              n: 2,
              title: "Alíquotas e Resumo",
              desc: "Alíquotas de IBS e CBS, vigência e confirmação do cadastro.",
            },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                {n}
              </div>
              <div>
                <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
                <p className="text-[12px] text-muted-foreground/70">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Em desenvolvimento.</strong> O assistente de configuração de TOP e alíquotas para
          Notas de Crédito IBS/CBS será disponibilizado em breve. A estrutura de 2 etapas será
          idêntica ao Assistente de Nota de Débito.
        </p>
      </div>

      <Button disabled className="w-full gap-2" size="lg">
        Em breve
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
