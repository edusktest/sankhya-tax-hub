import { useParams, useNavigate, useLocation } from "react-router-dom";
import { apuracoes, contasApuracao, outrasInfos, eventosApuracao, documentosConciliacao, contasEmProcessamento } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { ERoutes } from "@/routes/interface";
import { ApuracaoHeaderCard } from "@/components/ApuracaoHeaderCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Filter, Search, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

function AlertBanner({ alertas }: { alertas: number }) {
  if (alertas <= 0) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-warning bg-warning/10 p-4 mb-6">
      <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
      <p className="text-sm text-foreground">
        <strong>Atenção:</strong> Existem Créditos apropriados de documentos que não estão no sistema.
      </p>
    </div>
  );
}

function ContasTab() {
  const [debitosAberto, setDebitosAberto] = useState(true);

  return (
    <div className="bg-card rounded-lg card-shadow border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Conta</TableHead>
            <TableHead className="text-right">CBS</TableHead>
            <TableHead className="w-20 text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contasApuracao.map((c, i) => {
            const isSubItem = (c.level ?? 0) > 0;
            const isDebitos = c.conta === "Débitos";
            if (isSubItem && !debitosAberto) return null;
            const disabled = c.enabled === false;
            return (
              <TableRow
                key={i}
                className={`${c.total ? "bg-muted/30 font-semibold" : ""} ${isSubItem ? "bg-muted/20" : ""} ${disabled ? "opacity-50" : ""} hover:bg-muted/20`}
              >
                <TableCell className={isSubItem ? "pl-10 text-sm" : ""}>
                  <span className="inline-flex items-center gap-2">
                    {c.expandable &&
                      (isDebitos ? (
                        <button
                          type="button"
                          onClick={() => setDebitosAberto(v => !v)}
                          className="text-primary"
                          aria-label={debitosAberto ? "Recolher débitos" : "Expandir débitos"}
                        >
                          {debitosAberto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      ) : (
                        <ChevronDown className="h-4 w-4 text-primary" />
                      ))}
                    {c.conta}
                    {disabled && <span className="text-[10px]">🚧</span>}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{c.valorCBS}</TableCell>
                <TableCell className="text-center">
                  {c.hasDetail && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={disabled}
                      className="text-primary hover:bg-accent"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function EmProcessamentoTab({ apuracaoId }: { apuracaoId: string }) {
  const navigate = useNavigate();
  const [pendenciasAberto, setPendenciasAberto] = useState(true);

  return (
    <div className="bg-card rounded-lg card-shadow border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Conta</TableHead>
            <TableHead className="text-right">CBS</TableHead>
            <TableHead className="w-20 text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contasEmProcessamento.map((c, i) => {
            const isSubItem = (c.level ?? 0) > 0;
            const isPendencias = c.conta === "Pendências de processamento";
            if (isSubItem && !pendenciasAberto) return null;
            const valorTone =
              c.tone === "debito" ? "text-destructive" : c.tone === "credito" ? "text-primary" : "";
            return (
              <TableRow key={i} className={`${isSubItem ? "bg-muted/20" : ""} hover:bg-muted/20`}>
                <TableCell className={isSubItem ? "pl-10 text-sm" : ""}>
                  <span className="inline-flex items-center gap-2">
                    {isPendencias && (
                      <button
                        type="button"
                        onClick={() => setPendenciasAberto(v => !v)}
                        className="text-primary"
                        aria-label={pendenciasAberto ? "Recolher pendências" : "Expandir pendências"}
                      >
                        {pendenciasAberto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                    {c.conta}
                  </span>
                </TableCell>
                <TableCell className={`text-right font-mono text-sm ${valorTone}`}>{c.valorCBS}</TableCell>
                <TableCell className="text-center">
                  {c.hasDetail && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={c.enabled === false}
                      className="text-primary hover:bg-accent"
                      onClick={
                        c.conta === "Débitos aguardando processamento"
                          ? () => navigate(`/apuracao-cbs/${apuracaoId}/debitos-aguardando-processamento`)
                          : undefined
                      }
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function EmConstrucao() {
  return (
    <div className="bg-card rounded-lg card-shadow border p-10 text-center text-sm text-muted-foreground">
      🚧 Em construção
    </div>
  );
}

type FiltroConciliacao = { tipo: "situacao"; nome: string } | { tipo: "foraEIP" } | null;

const mesmoFiltro = (a: FiltroConciliacao, b: FiltroConciliacao) =>
  !!a && !!b && a.tipo === b.tipo && (a.tipo !== "situacao" || (b.tipo === "situacao" && a.nome === b.nome));

type DocConciliacao = (typeof documentosConciliacao)[number];
type ColKey =
  | "apuracaoAssistida" | "existe" | "dt" | "empresa" | "parceiro" | "tipoMovimento"
  | "finalidade" | "nroUnico" | "numero" | "chaveDFe" | "valor" | "totalCBS";

const dataParaTs = (v: string) => {
  const [dd, mm, yyyy] = v.split("/").map(Number);
  return new Date(yyyy, mm - 1, dd).getTime();
};

interface ColunaConciliacao {
  key: ColKey;
  label: string;
  right?: boolean;
  texto: (d: DocConciliacao) => string;
  ordem?: (d: DocConciliacao) => number;
}

const colunasConciliacao: ColunaConciliacao[] = [
  { key: "apuracaoAssistida", label: "Apuração Assistida", texto: d => d.apuracaoAssistida },
  { key: "existe", label: "Existe no EIP", texto: d => (d.existeNoEIP ? "Sim" : "Não") },
  { key: "dt", label: "Dt. Negociação", texto: d => d.dtNegociacao, ordem: d => dataParaTs(d.dtNegociacao) },
  { key: "empresa", label: "Empresa", texto: d => d.empresa },
  { key: "parceiro", label: "Parceiro", texto: d => (d.parceiro ? `${d.parceiro} - ${d.cnpjParceiro}` : "") },
  { key: "tipoMovimento", label: "Tipo de Movimento", texto: d => d.tipoMovimento },
  { key: "finalidade", label: "Finalidade", texto: d => d.finalidade },
  { key: "nroUnico", label: "Nro Único", texto: d => d.nroUnico },
  { key: "numero", label: "Número", texto: d => d.numero },
  { key: "chaveDFe", label: "Chave DFe", texto: d => d.chaveDFe },
  { key: "valor", label: "Valor", right: true, texto: d => d.valor, ordem: d => paraCentavos(d.valor) },
  { key: "totalCBS", label: "Total CBS", right: true, texto: d => d.totalCBS, ordem: d => paraCentavos(d.totalCBS) },
];

const rotuloValor = (v: string) => (v === "" ? "(Em branco)" : v);

// Cabeçalho de coluna com menu de filtro e ordenação, no estilo do Excel.
function CabecalhoFiltro({
  col,
  valores,
  selecionados,
  onSelecionados,
  dirOrdem,
  onOrdem,
}: {
  col: ColunaConciliacao;
  valores: string[];
  selecionados: string[] | undefined;
  onSelecionados: (v: string[] | undefined) => void;
  dirOrdem: "asc" | "desc" | null;
  onOrdem: (dir: "asc" | "desc" | null) => void;
}) {
  const [busca, setBusca] = useState("");
  const filtrada = selecionados !== undefined;
  const visiveis = valores.filter(v => rotuloValor(v).toLowerCase().includes(busca.toLowerCase()));
  const marcado = (v: string) => !selecionados || selecionados.includes(v);
  const todosVisiveisMarcados = visiveis.length > 0 && visiveis.every(marcado);

  function normalizar(lista: string[]) {
    onSelecionados(lista.length === valores.length ? undefined : lista);
  }

  function alternar(v: string) {
    const base = selecionados ?? valores;
    normalizar(base.includes(v) ? base.filter(x => x !== v) : [...base, v]);
  }

  function alternarTodos() {
    const base = selecionados ?? valores;
    if (todosVisiveisMarcados) normalizar(base.filter(x => !visiveis.includes(x)));
    else normalizar(Array.from(new Set([...base, ...visiveis])));
  }

  const IconeOrdem = dirOrdem === "asc" ? ArrowUp : dirOrdem === "desc" ? ArrowDown : null;
  const menuItem = "w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent flex items-center gap-2";

  return (
    <Popover onOpenChange={o => !o && setBusca("")}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Filtrar e ordenar ${col.label}`}
          className={`inline-flex items-center gap-1 uppercase hover:text-foreground ${col.right ? "flex-row-reverse" : ""} ${filtrada || dirOrdem ? "text-primary" : ""}`}
        >
          {col.label}
          {IconeOrdem && <IconeOrdem className="h-3 w-3" />}
          {filtrada ? <Filter className="h-3 w-3 fill-current" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2 normal-case font-normal tracking-normal">
        <button type="button" className={menuItem} onClick={() => onOrdem(dirOrdem === "asc" ? null : "asc")}>
          <ArrowUp className="h-3.5 w-3.5" /> Classificar do menor para o maior (A → Z)
        </button>
        <button type="button" className={menuItem} onClick={() => onOrdem(dirOrdem === "desc" ? null : "desc")}>
          <ArrowDown className="h-3.5 w-3.5" /> Classificar do maior para o menor (Z → A)
        </button>
        <div className="my-2 border-t" />
        <Input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Pesquisar"
          aria-label={`Pesquisar em ${col.label}`}
          className="h-8 text-xs mb-2"
        />
        <div className="max-h-52 overflow-auto border rounded p-1 space-y-0.5">
          <label className="flex items-center gap-2 text-xs px-1.5 py-1 rounded hover:bg-accent cursor-pointer">
            <Checkbox checked={todosVisiveisMarcados} onCheckedChange={alternarTodos} />
            (Selecionar tudo)
          </label>
          {visiveis.map(v => (
            <label key={v} className="flex items-center gap-2 text-xs px-1.5 py-1 rounded hover:bg-accent cursor-pointer">
              <Checkbox checked={marcado(v)} onCheckedChange={() => alternar(v)} />
              <span className="break-all">{rotuloValor(v)}</span>
            </label>
          ))}
          {visiveis.length === 0 && <p className="text-xs text-muted-foreground px-1.5 py-1">Nenhum valor encontrado.</p>}
        </div>
        <button
          type="button"
          disabled={!filtrada}
          onClick={() => onSelecionados(undefined)}
          className="mt-2 text-xs text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          Limpar filtro de "{col.label}"
        </button>
      </PopoverContent>
    </Popover>
  );
}

function ConciliacaoDocumentos({ filtro, onLimpar }: { filtro: FiltroConciliacao; onLimpar: () => void }) {
  const navigate = useNavigate();
  const [filtrosColuna, setFiltrosColuna] = useState<Partial<Record<ColKey, string[]>>>({});
  const [ordem, setOrdem] = useState<{ key: ColKey; dir: "asc" | "desc" } | null>(null);

  const temFiltroColuna = Object.values(filtrosColuna).some(v => v !== undefined);

  const valoresColuna = (col: ColunaConciliacao) => {
    const valores = Array.from(new Set(documentosConciliacao.map(col.texto)));
    const doc = (v: string) => documentosConciliacao.find(d => col.texto(d) === v)!;
    return valores.sort((a, b) => {
      if (a === "") return 1; // "(Em branco)" por último
      if (b === "") return -1;
      if (col.ordem) return col.ordem(doc(a)) - col.ordem(doc(b));
      return a.localeCompare(b, "pt-BR", { numeric: true });
    });
  };

  function definirFiltro(key: ColKey, v: string[] | undefined) {
    setFiltrosColuna(prev => {
      const next = { ...prev };
      if (v === undefined) delete next[key];
      else next[key] = v;
      return next;
    });
  }

  const documentos = documentosConciliacao
    .filter(d => {
      if (filtro?.tipo === "foraEIP") return !d.existeNoEIP;
      if (filtro?.tipo === "situacao") return d.existeNoEIP && d.apuracaoAssistida === filtro.nome;
      return true;
    })
    .filter(d =>
      colunasConciliacao.every(col => {
        const sel = filtrosColuna[col.key];
        return !sel || sel.includes(col.texto(d));
      }),
    );

  const ordenados = (() => {
    if (!ordem) return documentos;
    const col = colunasConciliacao.find(c => c.key === ordem.key)!;
    const mult = ordem.dir === "asc" ? 1 : -1;
    return [...documentos].sort((a, b) => {
      const va = col.texto(a);
      const vb = col.texto(b);
      if (!va && !vb) return 0;
      if (!va) return 1; // vazios sempre por último
      if (!vb) return -1;
      if (col.ordem) return (col.ordem(a) - col.ordem(b)) * mult;
      return va.localeCompare(vb, "pt-BR", { numeric: true }) * mult;
    });
  })();

  const th = "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
  return (
    <div className="bg-card rounded-lg card-shadow border">
      <div className="px-4 py-3 border-b">
        <p className="text-xs text-muted-foreground">
          Documentos do ERP (Documentos — Movimento) na competência e a situação de cada um na Apuração Assistida.
        </p>
        {(filtro || temFiltroColuna) && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {filtro && (
              <>
                <span className="rounded-full border bg-muted px-2.5 py-0.5 text-foreground">
                  Filtrando por:{" "}
                  <strong>{filtro.tipo === "foraEIP" ? "Documentos não localizados no EIP" : filtro.nome}</strong>
                </span>
                <button type="button" onClick={onLimpar} className="text-primary hover:underline font-medium">
                  Limpar filtro
                </button>
              </>
            )}
            {temFiltroColuna && (
              <button type="button" onClick={() => setFiltrosColuna({})} className="text-primary hover:underline font-medium">
                Limpar filtros das colunas
              </button>
            )}
          </div>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {colunasConciliacao.map(col => (
              <TableHead key={col.key} className={`${th} ${col.right ? "text-right" : ""}`}>
                <CabecalhoFiltro
                  col={col}
                  valores={valoresColuna(col)}
                  selecionados={filtrosColuna[col.key]}
                  onSelecionados={v => definirFiltro(col.key, v)}
                  dirOrdem={ordem?.key === col.key ? ordem.dir : null}
                  onOrdem={dir => setOrdem(dir ? { key: col.key, dir } : null)}
                />
              </TableHead>
            ))}
            <TableHead className={`${th} w-20 text-center`}>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenados.length === 0 && (
            <TableRow>
              <TableCell colSpan={colunasConciliacao.length + 1} className="text-center text-sm text-muted-foreground py-8">
                Nenhum documento encontrado.
              </TableCell>
            </TableRow>
          )}
          {ordenados.map((d, i) => (
            <TableRow
              key={d.chaveDFe + d.nroUnico + i}
              className={d.existeNoEIP ? "hover:bg-muted/20" : "bg-destructive/10 text-destructive hover:bg-destructive/15"}
            >
              <TableCell className="text-sm whitespace-nowrap">{d.apuracaoAssistida}</TableCell>
              <TableCell className="text-sm">{d.existeNoEIP ? "Sim" : "Não"}</TableCell>
              <TableCell className="text-sm whitespace-nowrap">{d.dtNegociacao}</TableCell>
              <TableCell className="text-sm">{d.empresa}</TableCell>
              <TableCell className="text-sm">
                <div>{d.parceiro}</div>
                <div className="text-xs opacity-70">{d.cnpjParceiro}</div>
              </TableCell>
              <TableCell className="text-sm">{d.tipoMovimento}</TableCell>
              <TableCell className="text-sm">{d.finalidade}</TableCell>
              <TableCell className="text-sm font-mono">{d.nroUnico}</TableCell>
              <TableCell className="text-sm font-mono">{d.numero}</TableCell>
              <TableCell className="text-xs font-mono break-all min-w-[200px]">{d.chaveDFe}</TableCell>
              <TableCell className="text-right font-mono text-sm whitespace-nowrap">{d.valor}</TableCell>
              <TableCell className="text-right font-mono text-sm whitespace-nowrap">{d.totalCBS}</TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!d.existeNoEIP}
                  title={d.existeNoEIP ? "Detalhar documento" : "Documento não existe no EIP"}
                  aria-label="Detalhar documento"
                  className="text-primary hover:bg-accent"
                  onClick={() =>
                    navigate(ERoutes.MOVIMENTACOES_DOCUMENTOS_MOVIMENTO, { state: { openChaveDFe: d.chaveDFe } })
                  }
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="px-4 py-2.5 border-t text-[11px] text-muted-foreground bg-muted/20">
        Exibindo <span className="font-medium text-foreground">{ordenados.length}</span> de{" "}
        <span className="font-medium text-foreground">{documentosConciliacao.length}</span> documentos
      </div>
    </div>
  );
}

const paraCentavos = (v: string) =>
  v ? Math.round(parseFloat(v.replace(/[^\d,]/g, "").replace(",", ".")) * 100) : 0;
const moedaBR = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ConciliacaoDashboard({
  filtro,
  onFiltro,
}: {
  filtro: FiltroConciliacao;
  onFiltro: (f: FiltroConciliacao) => void;
}) {
  const todos = documentosConciliacao;
  const docs = todos.filter(d => d.existeNoEIP);
  const foraDoEIP = todos.filter(d => !d.existeNoEIP);
  const foraDoEIPCbs = foraDoEIP.reduce((acc, d) => acc + paraCentavos(d.totalCBS), 0);
  const total = docs.length;
  const valorTotal = docs.reduce((acc, d) => acc + paraCentavos(d.valor), 0);
  const ehEntrada = (tipo: string) => tipo === "Compra" || tipo === "Devolução de Venda";
  const cbsSaida = docs.filter(d => !ehEntrada(d.tipoMovimento)).reduce((acc, d) => acc + paraCentavos(d.totalCBS), 0);
  const cbsEntrada = docs.filter(d => ehEntrada(d.tipoMovimento)).reduce((acc, d) => acc + paraCentavos(d.totalCBS), 0);

  const situacoes = Array.from(new Set(docs.map(d => d.apuracaoAssistida))).map(nome => {
    const grupo = docs.filter(d => d.apuracaoAssistida === nome);
    return {
      nome,
      qtd: grupo.length,
      cbs: grupo.reduce((acc, d) => acc + paraCentavos(d.totalCBS), 0),
    };
  });

  const kpis = [
    { label: "Documentos no EIP", valor: String(total) },
    { label: "Valor total", valor: moedaBR(valorTotal) },
    { label: "Total CBS saída", valor: moedaBR(cbsSaida) },
    { label: "Total CBS entrada", valor: moedaBR(cbsEntrada) },
  ];

  return (
    <div className="bg-card rounded-lg card-shadow border p-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="rounded-md border bg-muted/30 px-3 py-2.5 min-w-0">
            <p className="text-[11px] leading-tight text-muted-foreground min-h-[28px]">{k.label}</p>
            <p className="text-sm font-semibold font-mono mt-1 whitespace-nowrap">{k.valor}</p>
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Documentos no EIP por situação na Apuração Assistida
      </p>
      <div className="space-y-2 pl-6">
        {situacoes.map(sit => {
          const vermelho = sit.nome === "Não encontrado";
          const f: FiltroConciliacao = { tipo: "situacao", nome: sit.nome };
          const ativo = mesmoFiltro(filtro, f);
          return (
            <button
              type="button"
              key={sit.nome}
              onClick={() => onFiltro(ativo ? null : f)}
              aria-pressed={ativo}
              className={`w-full text-left grid grid-cols-[minmax(0,240px)_1fr_auto] items-center gap-3 text-sm rounded px-2 py-1 -mx-2 hover:bg-muted/60 ${ativo ? "bg-accent" : ""} ${vermelho ? "text-destructive font-medium" : ""}`}
            >
              <span className="truncate">{sit.nome}</span>
              <div className={`h-2 rounded-full overflow-hidden ${vermelho ? "bg-destructive/10" : "bg-muted"}`}>
                <div
                  className={`h-full ${vermelho ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${(sit.qtd / todos.length) * 100}%` }}
                />
              </div>
              <span className={`font-mono text-xs whitespace-nowrap ${vermelho ? "" : "text-muted-foreground"}`}>
                {sit.qtd} doc. · {moedaBR(sit.cbs)}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-5 mb-2">
        Documentos na Apuração Assistida não localizados no EIP
      </p>
      <div className="pl-6">
        <button
          type="button"
          onClick={() => onFiltro(filtro?.tipo === "foraEIP" ? null : { tipo: "foraEIP" })}
          aria-pressed={filtro?.tipo === "foraEIP"}
          className={`w-full text-left grid grid-cols-[minmax(0,240px)_1fr_auto] items-center gap-3 text-sm text-destructive font-medium rounded px-2 py-1 -mx-2 hover:bg-muted/60 ${filtro?.tipo === "foraEIP" ? "bg-accent" : ""}`}
        >
          <span className="truncate">Não encontrado</span>
          <div className="h-2 rounded-full bg-destructive/10 overflow-hidden">
            <div className="h-full bg-destructive" style={{ width: `${(foraDoEIP.length / todos.length) * 100}%` }} />
          </div>
          <span className="font-mono text-xs whitespace-nowrap">
            {foraDoEIP.length} doc. · {moedaBR(foraDoEIPCbs)}
          </span>
        </button>
      </div>
    </div>
  );
}

function ConciliacaoTab() {
  const [filtro, setFiltro] = useState<FiltroConciliacao>(null);
  const [aba, setAba] = useState("resumo");

  function aplicarFiltro(f: FiltroConciliacao) {
    setFiltro(f);
    setAba("documentos");
  }

  return (
    <div>
      <Tabs value={aba} onValueChange={setAba}>
        <TabsList className="bg-muted border">
          <TabsTrigger value="resumo" className="data-[state=active]:bg-card data-[state=active]:text-primary">Resumo da conciliação</TabsTrigger>
          <TabsTrigger value="documentos" className="data-[state=active]:bg-card data-[state=active]:text-primary">Documentos</TabsTrigger>
          <TabsTrigger value="eventos" className="data-[state=active]:bg-card data-[state=active]:text-primary">Eventos</TabsTrigger>
        </TabsList>
        <TabsContent value="resumo" className="mt-4">
          <ConciliacaoDashboard filtro={filtro} onFiltro={aplicarFiltro} />
        </TabsContent>
        <TabsContent value="documentos" className="mt-4">
          <ConciliacaoDocumentos filtro={filtro} onLimpar={() => setFiltro(null)} />
        </TabsContent>
        <TabsContent value="eventos" className="mt-4"><EmConstrucao /></TabsContent>
      </Tabs>
    </div>
  );
}

function EventosTab() {
  return (
    <div className="bg-card rounded-lg card-shadow border">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-foreground">Eventos da Apuração</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>NI Fornecedor/Adquirente</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {eventosApuracao.map((e, i) => (
            <TableRow key={i} className="hover:bg-muted/20">
              <TableCell className="text-sm">{e.data}</TableCell>
              <TableCell className="text-sm">{e.tipo}</TableCell>
              <TableCell className="font-mono text-sm">{e.documento}</TableCell>
              <TableCell className="text-sm">{e.fornecedor || e.adquirente}</TableCell>
              <TableCell className="text-right font-mono text-sm">{e.valor}</TableCell>
              <TableCell>
                <Badge variant="outline" className="border-success text-success bg-success/10 text-xs">
                  {e.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OutrasInfosTab() {
  return (
    <div className="space-y-3">
      {outrasInfos.map((info, i) => (
        <div key={i} className="bg-card rounded-lg card-shadow border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{info.label}</span>
            <span className="font-mono text-sm font-medium">{info.valor}</span>
          </div>
          {info.subItems && (
            <div className="mt-2 pl-4 space-y-2 border-l-2 border-accent">
              {info.subItems.map((sub, j) => (
                <div key={j} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{sub.label}</span>
                  <span className="font-mono text-sm">{sub.valor}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ApuracaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const abaState = (location.state as { tab?: string } | null)?.tab;
  const abaPrincipal = abaState === "conciliacao" ? "conciliacao" : "apuracao";
  const abaInicial = abaState && abaState !== "conciliacao" ? abaState : "resultado";
  const apuracao = apuracoes.find((a) => a.id === id) || apuracoes[0];

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/apuracao-cbs")}
        className="mb-4 text-primary hover:text-primary hover:bg-accent"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar
      </Button>

      <Tabs defaultValue={abaPrincipal}>
        <TabsList className="bg-muted border mb-4">
          <TabsTrigger value="apuracao" className="data-[state=active]:bg-card data-[state=active]:text-primary">Apuração Assistida</TabsTrigger>
          <TabsTrigger value="conciliacao" className="data-[state=active]:bg-card data-[state=active]:text-primary">Conciliação EIP</TabsTrigger>
        </TabsList>

        <TabsContent value="apuracao" className="mt-0">
          <ApuracaoHeaderCard apuracao={apuracao} />

          {/* Alert Banner */}
          <AlertBanner alertas={apuracao.alertas} />

          <Tabs defaultValue={abaInicial}>
            <TabsList className="bg-muted border">
              <TabsTrigger value="resultado" className="data-[state=active]:bg-card data-[state=active]:text-primary">Resultado</TabsTrigger>
              <TabsTrigger value="saldo" className="data-[state=active]:bg-card data-[state=active]:text-primary">Saldo Atualizado</TabsTrigger>
              <TabsTrigger value="eventos" className="data-[state=active]:bg-card data-[state=active]:text-primary">Eventos</TabsTrigger>
              <TabsTrigger value="processamento" className="data-[state=active]:bg-card data-[state=active]:text-primary">Em Processamento</TabsTrigger>
              <TabsTrigger value="outras" className="data-[state=active]:bg-card data-[state=active]:text-primary">Outras Informações</TabsTrigger>
              <TabsTrigger value="naoaproveitados" className="data-[state=active]:bg-card data-[state=active]:text-primary">Não Aproveitados</TabsTrigger>
            </TabsList>

            <TabsContent value="resultado" className="mt-4"><ContasTab /></TabsContent>
            <TabsContent value="saldo" className="mt-4"><EmConstrucao /></TabsContent>
            <TabsContent value="eventos" className="mt-4"><EmConstrucao /></TabsContent>
            <TabsContent value="processamento" className="mt-4"><EmProcessamentoTab apuracaoId={apuracao.id} /></TabsContent>
            <TabsContent value="outras" className="mt-4"><OutrasInfosTab /></TabsContent>
            <TabsContent value="naoaproveitados" className="mt-4"><EmConstrucao /></TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="conciliacao" className="mt-0"><ConciliacaoTab /></TabsContent>
      </Tabs>
    </div>
  );
}
