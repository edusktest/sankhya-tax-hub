import React from "react";
import { Calculator, ChevronRight, Construction } from "lucide-react";

export default function ConciliacaoFiscal() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-1">
          <Calculator className="h-3.5 w-3.5" />
          <span>Apuração CBS</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Conciliação Fiscal</span>
        </div>
        <h1 className="text-[18px] font-semibold">Conciliação Fiscal</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Conciliação de créditos CBS/IBS obtidos via Apuração Assistida
        </p>
      </div>

      {/* Em desenvolvimento */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="h-16 w-16 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center border border-amber-200 dark:border-amber-800">
          <Construction className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="max-w-sm">
          <p className="text-[15px] font-semibold text-foreground mb-1">Em desenvolvimento</p>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Esta tela apresentará a conciliação dos valores de créditos CBS e IBS obtidos
            via API da Apuração Assistida, com a baixa cronológica dos impostos por título
            e documento fiscal referenciado.
          </p>
        </div>
      </div>
    </div>
  );
}
