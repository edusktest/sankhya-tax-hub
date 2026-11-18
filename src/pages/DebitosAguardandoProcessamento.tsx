import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApuracaoHeaderCard } from "@/components/ApuracaoHeaderCard";
import { apuracoes } from "@/data/mockData";
import { debitosAguardando, TOTAL_DEBITOS_AGUARDANDO, type DebitoAguardando } from "@/data/debitosAguardando";

type SortKey = "emissao" | "inclusao" | "valorOriginal" | "aguardandoProcessamento";

const moeda = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dataHora = (ts: number) => {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const th = "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

export default function DebitosAguardandoProcessamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const apuracao = apuracoes.find(a => a.id === id) || apuracoes[0];

  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);
  const [porPagina, setPorPagina] = useState(100);
  const [pagina, setPagina] = useState(1);

  const linhas = useMemo<DebitoAguardando[]>(() => {
    if (!sort) return debitosAguardando;
    const mult = sort.dir === "asc" ? 1 : -1;
    return [...debitosAguardando].sort((a, b) => (a[sort.key] - b[sort.key]) * mult);
  }, [sort]);

  const total = linhas.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const inicio = (pagina - 1) * porPagina;
  const visiveis = linhas.slice(inicio, inicio + porPagina);

  function ordenar(key: SortKey) {
    setPagina(1);
    setSort(prev => (prev?.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function voltar() {
    navigate(`/apuracao-cbs/${apuracao.id}`, { state: { tab: "processamento" } });
  }

  const sortHead = (k: SortKey, label: string) => (
    <TableHead className={th}>
      <button type="button" onClick={() => ordenar(k)} className="inline-flex items-center gap-1 uppercase">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  );

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={voltar}
        className="mb-4 text-primary hover:text-primary hover:bg-accent"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar
      </Button>

      <ApuracaoHeaderCard apuracao={apuracao} />

      <h1 className="text-[24px] font-semibold text-foreground leading-tight">Débitos Aguardando Processamento</h1>
      <p className="text-sm text-muted-foreground mt-2 mb-5">
        Demonstrativo de débitos aguardando processamento nessa apuração.
      </p>

      <div className="bg-card rounded-lg card-shadow border p-4 mb-5 max-w-[460px]">
        <p className="text-xs font-semibold text-foreground">Em Processamento</p>
        <p className="text-base font-mono mt-2">{moeda(TOTAL_DEBITOS_AGUARDANDO)}</p>
      </div>

      <div className="bg-card rounded-lg card-shadow border">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Relação de Débitos</h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" aria-label="Filtrar">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" aria-label="Configurar colunas">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {sortHead("emissao", "Emissão")}
              {sortHead("inclusao", "Inclusão")}
              <TableHead className={th}>Documento fiscal</TableHead>
              <TableHead className={th}>NI do adquirente</TableHead>
              {sortHead("valorOriginal", "Valor original")}
              {sortHead("aguardandoProcessamento", "Aguardando processamento")}
              <TableHead className={`${th} w-20 text-center`}>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.map((d, i) => (
              <TableRow key={inicio + i} className="hover:bg-muted/20">
                <TableCell className="text-sm tabular-nums">{dataHora(d.emissao)}</TableCell>
                <TableCell className="text-sm tabular-nums">{dataHora(d.inclusao)}</TableCell>
                <TableCell className="text-sm font-mono">…{d.documentoFiscal}</TableCell>
                <TableCell className="text-sm tabular-nums">{d.niAdquirente}</TableCell>
                <TableCell className="text-sm font-semibold tabular-nums">{moeda(d.valorOriginal)}</TableCell>
                <TableCell className="text-sm font-semibold tabular-nums">{moeda(d.aguardandoProcessamento)}</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-accent">
                    <Search className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t text-[12px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Exibir:</span>
              <Select
                value={String(porPagina)}
                onValueChange={v => {
                  setPorPagina(Number(v));
                  setPagina(1);
                }}
              >
                <SelectTrigger className="h-8 w-[80px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map(n => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span>
              {inicio + 1}-{Math.min(inicio + porPagina, total)} de {total.toLocaleString("pt-BR")} itens
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Página:</span>
            <Select value={String(pagina)} onValueChange={v => setPagina(Number(v))}>
              <SelectTrigger className="h-8 w-[80px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              disabled={pagina <= 1}
              onClick={() => setPagina(p => p - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina(p => p + 1)}
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={voltar}
        className="mt-4 text-primary hover:text-primary hover:bg-accent"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar
      </Button>
    </div>
  );
}
