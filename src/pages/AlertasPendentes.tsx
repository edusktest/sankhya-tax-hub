import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ERoutes } from "@/routes/interface";
import {
  MOCK_MULTA_JUROS,
  getMultaJurosPendencias,
} from "@/pages/MovimentacoesReceitasMultaJuros";
import {
  MOCK_DOCUMENTOS_MOVIMENTO,
  getDocumentoPendencias,
} from "@/pages/MovimentacoesDocumentosMovimento";

// ── Types ──────────────────────────────────────────────────────────

interface AlertaItem {
  codigo: string;
  descricao: string;
  menuOrigem: string;
  registro: string;
  routeTo?: string;
  routeState?: Record<string, unknown>;
}

// ── Pendências computadas — Documentos > Movimento ────────────────

const ALERTAS_DOCUMENTOS: AlertaItem[] = MOCK_DOCUMENTOS_MOVIMENTO.flatMap((d) =>
  getDocumentoPendencias(d).map((p) => ({
    codigo: p.codigo,
    descricao: p.descricao,
    menuOrigem: "Documentos > Movimento",
    registro: d.numero,
    routeTo: ERoutes.MOVIMENTACOES_DOCUMENTOS_MOVIMENTO,
    routeState: { openNroUnico: d.id },
  }))
);

// ── Pendências computadas — Receitas > Multa e Juros ───────────────

const ALERTAS_MULTA_JUROS: AlertaItem[] = MOCK_MULTA_JUROS.flatMap((r) =>
  getMultaJurosPendencias(r).map((p) => ({
    codigo: p.codigo,
    descricao: p.descricao,
    menuOrigem: "Receitas > Multa e Juros",
    registro: r.nroUnico,
    routeTo: ERoutes.MOVIMENTACOES_RECEITAS_MULTA_JUROS,
    routeState: { openNroUnico: r.nroUnico },
  }))
);

export const ALERTAS: AlertaItem[] = [...ALERTAS_DOCUMENTOS, ...ALERTAS_MULTA_JUROS];
const TODOS_ALERTAS = ALERTAS;

// ── Badge por prefixo ─────────────────────────────────────────────

function BadgeCodigo({ codigo }: { codigo: string }) {
  const prefix = codigo.replace(/\d+$/, "");
  const colors: Record<string, string> = {
    PRT: "border-amber-400/60 text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30",
  };
  return (
    <Badge
      variant="outline"
      className={cn("font-mono text-[11px] shrink-0", colors[prefix] ?? "border-border")}
    >
      {codigo}
    </Badge>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function AlertasPendentes() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  const rows = useMemo(() => {
    if (!busca.trim()) return TODOS_ALERTAS;
    const q = busca.toLowerCase();
    return TODOS_ALERTAS.filter(
      (a) =>
        a.codigo.toLowerCase().includes(q) ||
        a.descricao.toLowerCase().includes(q) ||
        a.menuOrigem.toLowerCase().includes(q) ||
        a.registro.toLowerCase().includes(q)
    );
  }, [busca]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h1 className="text-[18px] font-semibold text-foreground">Alertas Pendentes</h1>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Pendências identificadas que requerem ação do usuário
        </p>
      </div>

      {/* Filter bar */}
      <div className="px-6 py-3 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-3">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, descrição, menu ou registro…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8 h-8 text-[13px]"
            />
          </div>
          {busca.trim() !== "" && (
            <Button variant="ghost" size="sm" className="text-[12px] h-8" onClick={() => setBusca("")}>
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-[12px] w-36">Alerta</TableHead>
                  <TableHead className="text-[12px]">Descrição</TableHead>
                  <TableHead className="text-[12px] w-52">Menu de Origem</TableHead>
                  <TableHead className="text-[12px] w-32">Registro</TableHead>
                  <TableHead className="text-[12px] w-24 text-center">Ir ao registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-[13px] text-muted-foreground py-10">
                      Nenhum alerta encontrado para os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((alerta, idx) => (
                    <TableRow key={`${alerta.codigo}-${alerta.registro}-${idx}`} className="hover:bg-muted/40 text-[13px]">
                      <TableCell className="py-3">
                        <BadgeCodigo codigo={alerta.codigo} />
                      </TableCell>
                      <TableCell className="py-3 leading-snug">{alerta.descricao}</TableCell>
                      <TableCell className="py-3 text-muted-foreground text-[12px]">
                        {alerta.menuOrigem}
                      </TableCell>
                      <TableCell className="py-3 font-mono text-[12px]">{alerta.registro}</TableCell>
                      <TableCell className="py-3 text-center">
                        {alerta.routeTo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[12px] gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              navigate(alerta.routeTo!, { state: alerta.routeState })
                            }
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                            Ir
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-[12px] text-muted-foreground mt-2">
            {rows.length} {rows.length === 1 ? "alerta" : "alertas"}
            {busca.trim() !== "" && ` encontrado${rows.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>
    </div>
  );
}
