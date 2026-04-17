import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apuracoes } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, FileDown, AlertTriangle, CheckCircle2, Filter, RefreshCw, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ApuracaoCBS() {
  const navigate = useNavigate();
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos");
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("todas");
  const [filtroSituacao, setFiltroSituacao] = useState<string>("todas");

  const periodos = useMemo(() => [...new Set(apuracoes.map(a => a.periodo))], []);
  const empresas = useMemo(() => [...new Set(apuracoes.map(a => a.razaoSocial))], []);

  const filtered = useMemo(() => {
    return apuracoes
      .filter(a => filtroPeriodo === "todos" || a.periodo === filtroPeriodo)
      .filter(a => filtroEmpresa === "todas" || a.razaoSocial === filtroEmpresa)
      .filter(a => filtroSituacao === "todas" || a.situacao === filtroSituacao);
  }, [filtroPeriodo, filtroEmpresa, filtroSituacao]);

  const hasFilters = filtroPeriodo !== "todos" || filtroEmpresa !== "todas" || filtroSituacao !== "todas";

  function clearFilters() {
    setFiltroPeriodo("todos");
    setFiltroEmpresa("todas");
    setFiltroSituacao("todas");
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
            <span>Apuração</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">CBS</span>
          </div>
          <h1 className="text-[20px] font-semibold text-foreground leading-tight">
            Relação de Apurações – CBS
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <FileDown className="h-3.5 w-3.5" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 px-3 py-2.5 bg-muted/40 rounded-lg border">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="flex flex-wrap gap-2 flex-1">
          <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
            <SelectTrigger className="w-[150px] h-8 text-sm">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os períodos</SelectItem>
              {periodos.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
            <SelectTrigger className="w-[260px] h-8 text-sm">
              <SelectValue placeholder="Unidade / Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as empresas</SelectItem>
              {empresas.map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
            <SelectTrigger className="w-[150px] h-8 text-sm">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="Em andamento">Em andamento</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-[12px] text-primary hover:underline shrink-0 font-medium"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="bg-card rounded-lg card-shadow border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Período</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">CNPJ Raiz</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Razão Social</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Situação</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tipo de Resultado</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Resultado da Apuração</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Saldo a Pagar</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-center">Alertas</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ações</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Consulta API</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TooltipProvider>
              {filtered.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-sm">{a.periodo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.cnpjRaiz}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{a.razaoSocial}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        a.situacao === "Em andamento"
                          ? "border-warning/60 text-warning bg-warning/10 text-xs font-medium"
                          : "border-success/50 text-success bg-success/10 text-xs font-medium"
                      }
                    >
                      {a.situacao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        a.tipoResultado === "Credor"
                          ? "text-success font-medium text-sm"
                          : a.tipoResultado === "Devedor"
                          ? "text-destructive font-medium text-sm"
                          : "text-muted-foreground text-sm"
                      }
                    >
                      {a.tipoResultado}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums">
                    {a.resultadoApuracao}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-semibold tabular-nums">
                    {a.saldoPagarAtual}
                  </TableCell>
                  <TableCell className="text-center">
                    {a.alertas > 0 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="inline-flex items-center gap-1 text-warning hover:opacity-80 transition-opacity"
                            onClick={() => navigate(`/apuracao-cbs/${a.id}`)}
                          >
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs font-semibold">{a.alertas}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{a.alertas} alerta(s) neste período</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex text-success">
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Sem alertas neste período</TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-primary hover:text-primary hover:bg-accent gap-1 px-2"
                        onClick={() => navigate(`/apuracao-cbs/${a.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        Gerar Guia
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                    Última consulta:<br />{a.ultimaConsulta}
                  </TableCell>
                </TableRow>
              ))}
            </TooltipProvider>
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-2.5 border-t text-[11px] text-muted-foreground bg-muted/20">
          <span>Exibindo <span className="font-medium text-foreground">{filtered.length}</span> de <span className="font-medium text-foreground">{apuracoes.length}</span> registros</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );
}
