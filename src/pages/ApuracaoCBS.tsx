import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apuracoes } from "@/data/mockData";
import { debitosApuracaoAssistida, creditosApuracaoAssistida } from "@/data/debitosApuracaoAssistida";
import { totalAlertasConciliacao } from "@/data/alertasConciliacao";
import { ANOS_DASHBOARD, EMPRESAS_DASHBOARD, apuracaoPorMes } from "@/data/apuracaoMensal";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as GraficoTooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, FileDown, AlertTriangle, CheckCircle2, Filter, Info, RefreshCw, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

// "NOV/2026" -> "11/2026", como vem na Apuração Assistida
const periodoNumerico = (periodo: string) => {
  const [mes, ano] = periodo.split("/");
  return `${String(MESES.indexOf(mes) + 1).padStart(2, "0")}/${ano}`;
};

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const consultaNaoRealizada = (a: (typeof apuracoes)[number]) => a.consultaRealizada === false;
const textoSemConsulta = <span className="text-xs text-muted-foreground whitespace-nowrap">Consulta não realizada</span>;

// Alertas da apuração: os da conciliação (a apuração de NOV/2026 é a que tem conciliação cadastrada)
const alertasDaApuracao = (a: (typeof apuracoes)[number]) => a.alertas + (a.id === "1" ? totalAlertasConciliacao() : 0);

// Total de CBS apurado nas abas Débito e Crédito da apuração (soma de cbs_apurado)
const totalApurado = (linhas: typeof debitosApuracaoAssistida, periodo: string) =>
  Math.round(
    linhas
      .filter(d => d.periodoApuracao === periodoNumerico(periodo))
      .reduce((acc, d) => acc + d.cbsApurado * 100, 0),
  ) / 100;

function ApuracaoLista() {
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
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Débito apurado</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Crédito apurado</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-center">Alertas</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ações</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Última consulta API</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 cursor-help">
                        Data do último registro
                        <Info className="h-3 w-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px] normal-case font-normal tracking-normal">
                      Essa é a data do último documento disponível na API. Observamos que existe um delay de 2 dias entre API e Apuração Assistida.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TooltipProvider>
              {filtered.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-sm">{a.periodo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.cnpjRaiz}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{a.razaoSocial}</TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {moeda(consultaNaoRealizada(a) ? 0 : totalApurado(debitosApuracaoAssistida, a.periodo))}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {moeda(consultaNaoRealizada(a) ? 0 : totalApurado(creditosApuracaoAssistida, a.periodo))}
                  </TableCell>
                  <TableCell className="text-center">
                    {alertasDaApuracao(a) > 0 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="inline-flex items-center gap-1 text-warning hover:opacity-80 transition-opacity"
                            onClick={() => navigate(`/apuracao-cbs/${a.id}`, { state: { tab: "conciliacao" } })}
                          >
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs font-semibold">{alertasDaApuracao(a)}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{alertasDaApuracao(a)} alerta(s) neste período</TooltipContent>
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
                        disabled
                        className="h-7 text-xs text-muted-foreground gap-1 px-2"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        Gerar Guia
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs whitespace-nowrap">{consultaNaoRealizada(a) ? textoSemConsulta : a.ultimaConsulta}</TableCell>
                  <TableCell className="font-mono text-xs whitespace-nowrap">{consultaNaoRealizada(a) ? textoSemConsulta : a.ultimaDataApi}</TableCell>
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

function ApuracaoDashboard() {
  const navigate = useNavigate();
  const [mesHover, setMesHover] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState("");
  const [ano, setAno] = useState("");
  const [gerado, setGerado] = useState<{ empresa: string; ano: string } | null>(null);

  const dados = useMemo(() => (gerado ? apuracaoPorMes(gerado.empresa, gerado.ano) : []), [gerado]);
  const totalDebito = dados.reduce((acc, m) => acc + (m.debito ?? 0), 0);
  const totalCredito = dados.reduce((acc, m) => acc + (m.credito ?? 0), 0);
  const totalAlertas = dados.reduce((acc, m) => acc + m.alertas, 0);
  const idDoMes = (mes: string | null | undefined) => dados.find(m => m.mes === mes)?.apuracaoId;

  function abrirMes(mes: string | null | undefined) {
    const id = idDoMes(mes);
    if (id) navigate(`/apuracao-cbs/${id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 px-3 py-3 bg-muted/40 rounded-lg border">
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground">Empresa *</p>
          <Select value={empresa} onValueChange={setEmpresa}>
            <SelectTrigger className="w-[280px] h-8 text-sm">
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent>
              {EMPRESAS_DASHBOARD.map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground">Ano *</p>
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger className="w-[120px] h-8 text-sm">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {ANOS_DASHBOARD.map(a => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="h-8" disabled={!empresa || !ano} onClick={() => setGerado({ empresa, ano })}>
          Gerar dashboard
        </Button>
      </div>

      {!gerado ? (
        <div className="bg-card rounded-lg card-shadow border p-10 text-center text-sm text-muted-foreground">
          Informe a empresa e o ano para gerar o dashboard.
        </div>
      ) : (
        <div className="bg-card rounded-lg card-shadow border">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-semibold text-foreground">Débito e crédito apurados por mês</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {gerado.empresa} · {gerado.ano}
            </p>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-[960px]">
              <div className="rounded-md border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">Total débito apurado no ano</p>
                <p className="text-lg font-semibold font-mono mt-1">{moeda(totalDebito)}</p>
              </div>
              <div className="rounded-md border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">Total crédito apurado no ano</p>
                <p className="text-lg font-semibold font-mono mt-1">{moeda(totalCredito)}</p>
              </div>
              <div className="rounded-md border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">Alertas</p>
                <p className="text-lg font-semibold font-mono mt-1">{totalAlertas}</p>
              </div>
            </div>
            <div className={`h-[340px] ${idDoMes(mesHover) ? "cursor-pointer" : ""}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dados}
                  margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                  onMouseMove={state => setMesHover(state?.activeLabel ?? null)}
                  onMouseLeave={() => setMesHover(null)}
                  onClick={state => abrirMes(state?.activeLabel)}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tickFormatter={(v: number) => v.toLocaleString("pt-BR", { notation: "compact" })}
                  />
                  <GraficoTooltip
                    formatter={(v: number) => moeda(v)}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="debito" name="Débito apurado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="credito" name="Crédito apurado" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {dados.some(m => m.apuracaoId) && (
              <p className="text-xs text-muted-foreground">
                Clique no mês para abrir o detalhe da apuração (disponível para os meses com apuração cadastrada).
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApuracaoCBS() {
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
            Minhas Apurações da CBS
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

      <Tabs defaultValue="producao">
        <TabsList className="bg-muted border mb-4">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-card data-[state=active]:text-primary">Dashboard</TabsTrigger>
          <TabsTrigger value="producao" className="data-[state=active]:bg-card data-[state=active]:text-primary">Apurações</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-0"><ApuracaoDashboard /></TabsContent>
        <TabsContent value="producao" className="mt-0"><ApuracaoLista /></TabsContent>
      </Tabs>
    </div>
  );
}
