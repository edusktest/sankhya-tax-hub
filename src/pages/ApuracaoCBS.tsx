import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apuracoes } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, FileDown, AlertTriangle, CheckCircle2 } from "lucide-react";
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground">Apuração</p>
          <h1 className="text-xl font-semibold text-foreground">
            Relação de Apurações – CBS
          </h1>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
          <SelectTrigger className="w-[160px]">
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
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Unidade/Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as empresas</SelectItem>
            {empresas.map(e => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="Em andamento">Em andamento</SelectItem>
            <SelectItem value="Concluído">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg card-shadow border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Período</TableHead>
              <TableHead>CNPJ Raiz</TableHead>
              <TableHead>Razão Social</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Tipo de Resultado</TableHead>
              <TableHead>Resultado da Apuração</TableHead>
              <TableHead>Saldo a Pagar</TableHead>
              <TableHead className="text-center">Alertas</TableHead>
              <TableHead>Ações</TableHead>
              <TableHead>Consulta API</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TooltipProvider>
              {filtered.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{a.periodo}</TableCell>
                  <TableCell>{a.cnpjRaiz}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{a.razaoSocial}</TableCell>
                  <TableCell>
                    <Badge
                      variant={a.situacao === "Em andamento" ? "outline" : "default"}
                      className={
                        a.situacao === "Em andamento"
                          ? "border-warning text-warning bg-warning/10"
                          : "bg-success text-success-foreground"
                      }
                    >
                      {a.situacao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        a.tipoResultado === "Credor"
                          ? "text-success font-medium"
                          : a.tipoResultado === "Devedor"
                          ? "text-destructive font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {a.tipoResultado}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {a.resultadoApuracao}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium">
                    {a.saldoPagarAtual}
                  </TableCell>
                  <TableCell className="text-center">
                    {a.alertas > 0 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="inline-flex items-center gap-1 text-warning hover:opacity-80"
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
                        <TooltipContent>Não há alertas neste período</TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary hover:bg-accent"
                        onClick={() => navigate(`/apuracao-cbs/${a.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        Gerar Guia
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    Última consulta:<br />{a.ultimaConsulta}
                  </TableCell>
                </TableRow>
              ))}
            </TooltipProvider>
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
          <span>Exibir: 100</span>
          <span>1-{filtered.length} de {filtered.length} itens</span>
          <span>Página 1</span>
        </div>
      </div>
    </div>
  );
}
