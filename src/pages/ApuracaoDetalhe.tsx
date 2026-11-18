import { useParams, useNavigate, useLocation } from "react-router-dom";
import { apuracoes, contasApuracao, outrasInfos, eventosApuracao, documentosConciliacao, contasEmProcessamento } from "@/data/mockData";
import { debitosApuracaoAssistida, creditosApuracaoAssistida, NAO_ENCONTRADO } from "@/data/debitosApuracaoAssistida";
import { Badge } from "@/components/ui/badge";
import { ERoutes } from "@/routes/interface";
import { ApuracaoHeaderCard } from "@/components/ApuracaoHeaderCard";
import type { Apuracao } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, Filter, Search, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip as GraficoTooltip, XAxis, YAxis } from "recharts";
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

type FiltroConciliacao =
  | { tipo: "encontrados" }
  | { tipo: "naoEncontradosAA" }
  | { tipo: "cbsIguais" }
  | { tipo: "cbsDiferentes" }
  | null;

const rotuloFiltro = (f: NonNullable<FiltroConciliacao>) =>
  f.tipo === "encontrados"
    ? "Documentos encontrados"
    : f.tipo === "naoEncontradosAA"
    ? "Documentos não encontrados na Apuração Assistida"
    : f.tipo === "cbsIguais"
    ? "Documentos com CBS iguais"
    : "Documentos com CBS diferentes";

// Documentos encontrados na Apuração Assistida cujo CBS do EIP é igual (ou diferente) ao CBS apurado
const cbsConfere = (d: (typeof documentosConciliacao)[number]) => paraCentavos(d.totalCBS) === paraCentavos(cbsApuradoDoc(d));

type DocConciliacao = (typeof documentosConciliacao)[number];
type ColKey =
  | "alertas" | "apuracaoAssistida" | "dt" | "empresa" | "parceiro" | "tipoMovimento"
  | "finalidade" | "nroUnico" | "numero" | "chaveDFe" | "valor" | "totalCBS" | "cbsApurado";

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

// CBS apurado: valor que vem da Apuração Assistida para o documento (vazio quando não foi encontrado nela).
function cbsApuradoDoc(d: DocConciliacao): string {
  if (d.apuracaoAssistida === "Não encontrado") return "";
  const linha = [...debitosApuracaoAssistida, ...creditosApuracaoAssistida].find(x => x.nroUnicoEIP === d.nroUnico);
  if (linha) return moedaBR(Math.round(linha.cbsApurado * 100));
  return d.totalCBS;
}

const SEM_ALERTA = "Sem alerta";

// Motivo do alerta do documento (ou "Sem alerta")
function alertaDoc(d: DocConciliacao): string {
  if (d.apuracaoAssistida === "Não encontrado") return "Documento não encontrado na Apuração Assistida";
  if (!cbsConfere(d)) return "CBS do EIP diferente do CBS apurado";
  return SEM_ALERTA;
}

const colunasConciliacao: ColunaConciliacao[] = [
  { key: "alertas", label: "Alertas", texto: d => alertaDoc(d) },
  { key: "apuracaoAssistida", label: "Apuração Assistida", texto: d => d.apuracaoAssistida },
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
  { key: "cbsApurado", label: "CBS Apurado", right: true, texto: d => cbsApuradoDoc(d), ordem: d => paraCentavos(cbsApuradoDoc(d)) },
];

const rotuloValor = (v: string) => (v === "" ? "(Em branco)" : v);

// Cabeçalho de coluna com menu de filtro e ordenação, no estilo do Excel.
function CabecalhoFiltro({
  col,
  maiusculas = true,
  valores,
  selecionados,
  onSelecionados,
  dirOrdem,
  onOrdem,
}: {
  col: { label: string; right?: boolean };
  maiusculas?: boolean;
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
          className={`inline-flex items-center gap-1 ${maiusculas ? "uppercase" : ""} hover:text-foreground ${col.right ? "flex-row-reverse" : ""} ${filtrada || dirOrdem ? "text-primary" : ""}`}
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
      if (!filtro) return true;
      if (filtro.tipo === "encontrados") return d.apuracaoAssistida !== "Não encontrado";
      if (filtro.tipo === "naoEncontradosAA") return d.apuracaoAssistida === "Não encontrado";
      if (d.apuracaoAssistida === "Não encontrado") return false;
      return filtro.tipo === "cbsIguais" ? cbsConfere(d) : !cbsConfere(d);
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
          Documentos do EIP (Documentos — Movimento) na competência e a situação de cada um na Apuração Assistida.
        </p>
        {(filtro || temFiltroColuna) && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {filtro && (
              <>
                <span className="rounded-full border bg-muted px-2.5 py-0.5 text-foreground">
                  Filtrando por:{" "}
                  <strong>{rotuloFiltro(filtro)}</strong>
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
              className="hover:bg-muted/20"
            >
              <TableCell className="text-sm">
                {alertaDoc(d) !== SEM_ALERTA ? (
                  <span title={alertaDoc(d)} className="inline-flex text-warning" aria-label={alertaDoc(d)}>
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                ) : (
                  <span title={SEM_ALERTA} className="inline-flex text-success" aria-label={SEM_ALERTA}>
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">{d.apuracaoAssistida}</TableCell>
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
              <TableCell className="text-right font-mono text-sm whitespace-nowrap">{cbsApuradoDoc(d)}</TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  title="Detalhar documento"
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

const plural = (n: number, singular: string, pluralTxt: string) => `${n} ${n === 1 ? singular : pluralTxt}`;

function ConciliacaoDashboard({
  onFiltro,
  onVerNaoEncontradosEIP,
}: {
  onFiltro: (f: NonNullable<FiltroConciliacao>) => void;
  onVerNaoEncontradosEIP: () => void;
}) {
  const todos = documentosConciliacao;
  const noEIP = todos;
  const encontrados = noEIP.filter(d => d.apuracaoAssistida !== "Não encontrado").length;
  const naoEncontradosAA = noEIP.length - encontrados;
  const naoEncontradosEIP = debitosApuracaoAssistida.filter(d => d.nroUnicoEIP === NAO_ENCONTRADO).length;

  const encontradosAA = noEIP.filter(d => d.apuracaoAssistida !== "Não encontrado");
  const cbsIguais = encontradosAA.filter(cbsConfere).length;
  const docsDiferentes = encontradosAA.filter(d => !cbsConfere(d));
  const cbsDiferentes = docsDiferentes.length;

  // Valores de CBS (em centavos) exibidos abaixo de cada item
  const docsNaoEncontradosAA = noEIP.filter(d => d.apuracaoAssistida === "Não encontrado");
  const cbsNaoEncontradosAA = docsNaoEncontradosAA.reduce((acc, d) => acc + paraCentavos(d.totalCBS), 0);
  const cbsNaoEncontradosEIP = Math.round(
    [...debitosApuracaoAssistida, ...creditosApuracaoAssistida]
      .filter(d => d.nroUnicoEIP === NAO_ENCONTRADO)
      .reduce((acc, d) => acc + d.cbsApurado * 100, 0),
  );
  const cbsDiferentesApurado = docsDiferentes.reduce((acc, d) => acc + paraCentavos(cbsApuradoDoc(d)), 0);
  const cbsDiferentesEIP = docsDiferentes.reduce((acc, d) => acc + paraCentavos(d.totalCBS), 0);

  const linha = "w-full text-left rounded px-2 py-1.5 -mx-2 hover:bg-accent text-sm flex flex-wrap items-center gap-x-2 gap-y-1";
  const sub = "pl-8 -mt-0.5 mb-1 text-xs text-muted-foreground";
  return (
    <div className="bg-card rounded-lg card-shadow border">
      <div className="px-4 py-3 border-b">
        <p className="text-xs text-muted-foreground">
          Resumo da conciliação entre os documentos do EIP (Documentos — Movimento) na competência e a Apuração Assistida.
        </p>
      </div>
      <div className="p-4 space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-2">Conciliação de documentos</h3>
        <ul className="pl-4 space-y-0.5">
          <li>
            <button type="button" className={linha} onClick={() => onFiltro({ tipo: "encontrados" })}>
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              {plural(encontrados, "documento encontrado", "documentos encontrados")}
            </button>
          </li>
          <li>
            <button type="button" className={linha} onClick={() => onFiltro({ tipo: "naoEncontradosAA" })}>
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              {plural(naoEncontradosAA, "documento não encontrado", "documentos não encontrados")} na Apuração Assistida
            </button>
            <p className={sub}>Valor total de CBS: <span className="font-mono">{moedaBR(cbsNaoEncontradosAA)}</span></p>
          </li>
          <li>
            <button type="button" className={linha} onClick={onVerNaoEncontradosEIP}>
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              {plural(naoEncontradosEIP, "documento não encontrado", "documentos não encontrados")} no EIP
            </button>
            <p className={sub}>Valor total de CBS: <span className="font-mono">{moedaBR(cbsNaoEncontradosEIP)}</span></p>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground mb-2">Conciliação de valores</h3>
        <ul className="pl-4 space-y-0.5">
          <li>
            <button type="button" className={linha} onClick={() => onFiltro({ tipo: "cbsIguais" })}>
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              {plural(cbsIguais, "documento com CBS igual", "documentos com CBS iguais")}
            </button>
          </li>
          <li>
            <button type="button" className={linha} onClick={() => onFiltro({ tipo: "cbsDiferentes" })}>
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              {plural(cbsDiferentes, "documento com CBS diferente", "documentos com CBS diferentes")}
            </button>
            <p className={sub}>Total CBS apurado: <span className="font-mono">{moedaBR(cbsDiferentesApurado)}</span></p>
            <p className={sub}>Total CBS EIP: <span className="font-mono">{moedaBR(cbsDiferentesEIP)}</span></p>
          </li>
        </ul>
      </section>
      </div>
    </div>
  );
}

type DebitoAA = (typeof debitosApuracaoAssistida)[number];
type ColDebito = "periodo" | "origem" | "documento" | "chave" | "emissao" | "registro" | "atualizacao" | "apurado" | "saldo" | "extinto" | "nroEIP";

const colunasDebito: {
  key: ColDebito;
  label: string;
  right?: boolean;
  texto: (d: DebitoAA) => string;
  ordem?: (d: DebitoAA) => number;
}[] = [
  { key: "nroEIP", label: "nro_unico_eip", texto: d => d.nroUnicoEIP },
  { key: "periodo", label: "periodo_apuracao", texto: d => d.periodoApuracao },
  { key: "origem", label: "origem", right: true, texto: d => String(d.origem), ordem: d => d.origem },
  { key: "documento", label: "documento", texto: d => d.documento },
  { key: "chave", label: "chave_documento", texto: d => d.chaveDocumento },
  { key: "emissao", label: "data_emissao", texto: d => d.dataEmissao },
  { key: "registro", label: "data_registro", texto: d => d.dataRegistro },
  { key: "atualizacao", label: "data_atualizacao", texto: d => d.dataAtualizacao },
  { key: "apurado", label: "cbs_apurado", right: true, texto: d => reais(d.cbsApurado), ordem: d => d.cbsApurado },
  { key: "saldo", label: "cbs_saldo_corrente", right: true, texto: d => reais(d.cbsSaldoCorrente), ordem: d => d.cbsSaldoCorrente },
  { key: "extinto", label: "cbs_extinto", right: true, texto: d => reais(d.cbsExtinto), ordem: d => d.cbsExtinto },
];

// Grade dos débitos da Apuração Assistida, com o mesmo layout da planilha de referência.
function AssistidaGrade({
  dados,
  descricao,
  somenteNaoEncontradosEIP = false,
  onLimpar = () => {},
}: {
  dados: DebitoAA[];
  descricao: string;
  somenteNaoEncontradosEIP?: boolean;
  onLimpar?: () => void;
}) {
  const [filtros, setFiltros] = useState<Partial<Record<ColDebito, string[]>>>({});
  const [ordem, setOrdem] = useState<{ key: ColDebito; dir: "asc" | "desc" } | null>(null);

  const valoresColuna = (col: (typeof colunasDebito)[number]) => {
    const valores = Array.from(new Set(dados.map(col.texto)));
    const doc = (v: string) => dados.find(d => col.texto(d) === v)!;
    return valores.sort((a, b) =>
      col.ordem ? col.ordem(doc(a)) - col.ordem(doc(b)) : a.localeCompare(b, "pt-BR", { numeric: true }),
    );
  };

  function definirFiltro(key: ColDebito, v: string[] | undefined) {
    setFiltros(prev => {
      const next = { ...prev };
      if (v === undefined) delete next[key];
      else next[key] = v;
      return next;
    });
  }

  const filtrados = dados
    .filter(d => !somenteNaoEncontradosEIP || d.nroUnicoEIP === NAO_ENCONTRADO)
    .filter(d =>
    colunasDebito.every(col => {
      const sel = filtros[col.key];
      return !sel || sel.includes(col.texto(d));
    }),
  );

  const linhas = (() => {
    if (!ordem) return filtrados;
    const col = colunasDebito.find(c => c.key === ordem.key)!;
    const mult = ordem.dir === "asc" ? 1 : -1;
    return [...filtrados].sort((a, b) =>
      col.ordem
        ? (col.ordem(a) - col.ordem(b)) * mult
        : col.texto(a).localeCompare(col.texto(b), "pt-BR", { numeric: true }) * mult,
    );
  })();

  const th = "text-[11px] font-semibold tracking-wide text-muted-foreground whitespace-nowrap";
  const td = "px-4 py-3 text-sm whitespace-nowrap";
  return (
    <div className="bg-card rounded-lg card-shadow border">
      <div className="px-4 py-3 border-b">
        <p className="text-xs text-muted-foreground">
          {descricao}
        </p>
        {somenteNaoEncontradosEIP && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border bg-muted px-2.5 py-0.5 text-foreground">
              Filtrando por: <strong>Documentos não encontrados no EIP</strong>
            </span>
            <button type="button" onClick={onLimpar} className="text-primary hover:underline font-medium">
              Limpar filtro
            </button>
          </div>
        )}
      </div>
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-10 bg-muted [&_tr]:border-b">
            <tr className="border-b">
              {colunasDebito.map(col => (
                <th key={col.key} className={`h-12 px-4 align-middle ${col.right ? "text-right" : "text-left"} ${th}`}>
                  <CabecalhoFiltro
                    col={col}
                    maiusculas={false}
                    valores={valoresColuna(col)}
                    selecionados={filtros[col.key]}
                    onSelecionados={v => definirFiltro(col.key, v)}
                    dirOrdem={ordem?.key === col.key ? ordem.dir : null}
                    onOrdem={dir => setOrdem(dir ? { key: col.key, dir } : null)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {linhas.map((d, i) => (
              <tr key={d.chaveDocumento + i} className="border-b transition-colors hover:bg-muted/20">
                <td className={td}>{d.nroUnicoEIP}</td>
                <td className={td}>{d.periodoApuracao}</td>
                <td className={`${td} text-right`}>{d.origem}</td>
                <td className={td}>{d.documento}</td>
                <td className={`${td} text-xs font-mono`}>{d.chaveDocumento}</td>
                <td className={td}>{d.dataEmissao}</td>
                <td className={td}>{d.dataRegistro}</td>
                <td className={td}>{d.dataAtualizacao}</td>
                <td className={`${td} text-right font-mono`}>{reais(d.cbsApurado)}</td>
                <td className={`${td} text-right font-mono`}>{reais(d.cbsSaldoCorrente)}</td>
                <td className={`${td} text-right font-mono`}>{reais(d.cbsExtinto)}</td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={colunasDebito.length} className="text-center text-sm text-muted-foreground py-8">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 border-t text-[11px] text-muted-foreground bg-muted/20">
        Exibindo <span className="font-medium text-foreground">{linhas.length}</span> de{" "}
        <span className="font-medium text-foreground">{dados.length}</span> registros
      </div>
    </div>
  );
}

const somaReais = (valores: number[]) => Math.round(valores.reduce((a, b) => a + b * 100, 0)) / 100;
const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function IndicadorTile({ titulo, valor, qtd, percentual }: { titulo: string; valor: number; qtd: number; percentual?: number }) {
  return (
    <div className="rounded-md border bg-muted/30 px-4 py-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{titulo}</p>
        {percentual !== undefined && <span className="text-xs font-semibold text-foreground">{percentual}%</span>}
      </div>
      <p className="text-lg font-semibold font-mono mt-1 whitespace-nowrap">{reais(valor)}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{plural(qtd, "documento", "documentos")}</p>
    </div>
  );
}

function IndicadoresSecao({
  titulo,
  dados,
  rotuloSaldo,
  rotuloBaixado,
}: {
  titulo: string;
  dados: DebitoAA[];
  rotuloSaldo: string;
  rotuloBaixado: string;
}) {
  const apurado = somaReais(dados.map(d => d.cbsApurado));
  const saldoLinhas = dados.filter(d => d.cbsSaldoCorrente > 0);
  const baixadoLinhas = dados.filter(d => d.cbsExtinto > 0);
  const saldo = somaReais(dados.map(d => d.cbsSaldoCorrente));
  const baixado = somaReais(dados.map(d => d.cbsExtinto));
  const pctBaixado = apurado > 0 ? Math.round((baixado / apurado) * 100) : 0;
  const pctSaldo = 100 - pctBaixado;

  return (
    <div className="bg-card rounded-lg card-shadow border">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-foreground">{titulo}</h3>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <IndicadorTile titulo="Apurado" valor={apurado} qtd={dados.length} />
        <IndicadorTile titulo={rotuloSaldo} valor={saldo} qtd={saldoLinhas.length} percentual={pctSaldo} />
        <IndicadorTile titulo={rotuloBaixado} valor={baixado} qtd={baixadoLinhas.length} percentual={pctBaixado} />
      </div>
    </div>
  );
}

function GraficoComparativo({ titulo, apurado, eip }: { titulo: string; apurado: number; eip: number }) {
  const dados = [
    { nome: "Apurado (Apuração Assistida)", valor: apurado, cor: "hsl(var(--primary))" },
    { nome: "EIP", valor: eip, cor: "hsl(var(--muted-foreground))" },
  ];
  const diferenca = Math.round((apurado - eip) * 100) / 100;

  return (
    <div className="rounded-md border bg-muted/20 p-4 min-w-0">
      <p className="text-sm font-semibold text-foreground">{titulo}</p>
      <p className="text-xs text-muted-foreground mb-2">
        Diferença (Apuração Assistida − EIP): <span className="font-mono">{reais(diferenca)}</span>
      </p>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 24, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="nome" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v: number) => v.toLocaleString("pt-BR", { notation: "compact" })}
            />
            <GraficoTooltip formatter={(v: number) => reais(v)} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
            <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={72}>
              {dados.map(d => (
                <Cell key={d.nome} fill={d.cor} />
              ))}
              <LabelList dataKey="valor" position="top" formatter={(v: number) => reais(v)} style={{ fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DashboardTab() {
  const ehEntrada = (tipo: string) => tipo === "Compra" || tipo === "Devolução de Venda";
  const cbsEIP = (entrada: boolean) =>
    somaReais(
      documentosConciliacao
        .filter(d => ehEntrada(d.tipoMovimento) === entrada)
        .map(d => paraCentavos(d.totalCBS) / 100),
    );

  return (
    <div className="space-y-4">
      <IndicadoresSecao
        titulo="Débito"
        dados={debitosApuracaoAssistida}
        rotuloSaldo="Saldo devedor"
        rotuloBaixado="Extinto"
      />
      <IndicadoresSecao
        titulo="Crédito"
        dados={creditosApuracaoAssistida}
        rotuloSaldo="A apropriar"
        rotuloBaixado="Apropriado"
      />
      <div className="bg-card rounded-lg card-shadow border">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold text-foreground">Apuração Assistida x EIP</h3>
        </div>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GraficoComparativo
            titulo="Débito apurado x Débito EIP"
            apurado={somaReais(debitosApuracaoAssistida.map(d => d.cbsApurado))}
            eip={cbsEIP(false)}
          />
          <GraficoComparativo
            titulo="Crédito apurado x Crédito EIP"
            apurado={somaReais(creditosApuracaoAssistida.map(d => d.cbsApurado))}
            eip={cbsEIP(true)}
          />
        </div>
      </div>
    </div>
  );
}

function ConciliacaoTab({
  aba,
  setAba,
  onVerNaoEncontradosEIP,
}: {
  aba: string;
  setAba: (aba: string) => void;
  onVerNaoEncontradosEIP: () => void;
}) {
  const [filtro, setFiltro] = useState<FiltroConciliacao>(null);

  function aplicarFiltro(f: NonNullable<FiltroConciliacao>) {
    setFiltro(f);
    setAba("documentos");
  }

  return (
    <div>
      <Tabs value={aba} onValueChange={setAba}>
        <TabsList className="bg-muted border">
          <TabsTrigger value="resumo" className="data-[state=active]:bg-card data-[state=active]:text-primary">Resumo da conciliação</TabsTrigger>
          <TabsTrigger value="documentos" className="data-[state=active]:bg-card data-[state=active]:text-primary">Documentos</TabsTrigger>
        </TabsList>
        <TabsContent value="resumo" className="mt-4">
          <ConciliacaoDashboard onFiltro={aplicarFiltro} onVerNaoEncontradosEIP={onVerNaoEncontradosEIP} />
        </TabsContent>
        <TabsContent value="documentos" className="mt-4">
          <ConciliacaoDocumentos filtro={filtro} onLimpar={() => setFiltro(null)} />
        </TabsContent>
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

// Total de alertas da conciliação: documentos não encontrados (na Apuração Assistida e no EIP) e com CBS diferente
function totalAlertasConciliacao(): number {
  const noAA = documentosConciliacao.filter(d => d.apuracaoAssistida !== "Não encontrado");
  const naoEncontradosAA = documentosConciliacao.length - noAA.length;
  const naoEncontradosEIP = [...debitosApuracaoAssistida, ...creditosApuracaoAssistida].filter(
    d => d.nroUnicoEIP === NAO_ENCONTRADO,
  ).length;
  const cbsDiferentes = noAA.filter(d => !cbsConfere(d)).length;
  return naoEncontradosAA + naoEncontradosEIP + cbsDiferentes;
}

function ApuracaoTopo({ apuracao, onAlertas }: { apuracao: Apuracao; onAlertas: () => void }) {
  const total = totalAlertasConciliacao();
  const temAlerta = total > 0;
  return (
    <div className="flex flex-wrap items-stretch gap-4 mb-6">
      <ApuracaoHeaderCard apuracao={apuracao} resumido className="flex-1 min-w-[260px]" />
      <button
        type="button"
        onClick={onAlertas}
        title={temAlerta ? "Ver o Resumo da conciliação" : "Sem alertas na conciliação"}
        className="bg-card rounded-lg card-shadow border p-5 min-w-[180px] text-left hover:bg-accent transition-colors"
      >
        <p className="text-xs text-muted-foreground mb-1">Total de alertas</p>
        <div className="flex items-center gap-2">
          {temAlerta ? (
            <AlertTriangle className="h-6 w-6 text-warning shrink-0" />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
          )}
          <span className="text-lg font-semibold text-foreground">{total}</span>
        </div>
        {temAlerta && <p className="text-xs text-primary mt-1">Ver resumo da conciliação</p>}
      </button>
    </div>
  );
}

export default function ApuracaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const abaState = (location.state as { tab?: string } | null)?.tab;
  const [abaPrincipal, setAbaPrincipal] = useState(abaState === "conciliacao" ? "conciliacao" : abaState === "apuracao" ? "apuracao" : "dashboard");
  const [abaAssistida, setAbaAssistida] = useState("debito");
  const [somenteNaoEncontradosEIP, setSomenteNaoEncontradosEIP] = useState(false);
  const apuracao = apuracoes.find((a) => a.id === id) || apuracoes[0];

  const [abaConciliacao, setAbaConciliacao] = useState("resumo");

  function verResumoConciliacao() {
    setAbaConciliacao("resumo");
    setAbaPrincipal("conciliacao");
  }

  function verNaoEncontradosEIP() {
    setSomenteNaoEncontradosEIP(true);
    setAbaAssistida("debito");
    setAbaPrincipal("apuracao");
  }

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

      <Tabs value={abaPrincipal} onValueChange={setAbaPrincipal}>
        <TabsList className="bg-muted border mb-4">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-card data-[state=active]:text-primary">Dashboard</TabsTrigger>
          <TabsTrigger value="apuracao" className="data-[state=active]:bg-card data-[state=active]:text-primary">Apuração Assistida</TabsTrigger>
          <TabsTrigger value="conciliacao" className="data-[state=active]:bg-card data-[state=active]:text-primary">Conciliação EIP</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0">
          <ApuracaoTopo apuracao={apuracao} onAlertas={verResumoConciliacao} />
          <DashboardTab />
        </TabsContent>

        <TabsContent value="apuracao" className="mt-0">
          <ApuracaoTopo apuracao={apuracao} onAlertas={verResumoConciliacao} />

          {/* Alert Banner */}
          <AlertBanner alertas={apuracao.alertas} />

          <Tabs value={abaAssistida} onValueChange={setAbaAssistida}>
            <TabsList className="bg-muted border">
              <TabsTrigger value="debito" className="data-[state=active]:bg-card data-[state=active]:text-primary">Débito</TabsTrigger>
              <TabsTrigger value="credito" className="data-[state=active]:bg-card data-[state=active]:text-primary">Crédito</TabsTrigger>
            </TabsList>

            <TabsContent value="debito" className="mt-4"><AssistidaGrade
                dados={debitosApuracaoAssistida}
                descricao="Débitos da Apuração Assistida na competência e o documento correspondente no EIP."
                somenteNaoEncontradosEIP={somenteNaoEncontradosEIP}
                onLimpar={() => setSomenteNaoEncontradosEIP(false)}
              /></TabsContent>
            <TabsContent value="credito" className="mt-4"><AssistidaGrade
                dados={creditosApuracaoAssistida}
                descricao="Créditos da Apuração Assistida na competência e o documento correspondente no EIP."
              /></TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="conciliacao" className="mt-0">
          <ApuracaoTopo apuracao={apuracao} onAlertas={verResumoConciliacao} />
          <ConciliacaoTab aba={abaConciliacao} setAba={setAbaConciliacao} onVerNaoEncontradosEIP={verNaoEncontradosEIP} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
