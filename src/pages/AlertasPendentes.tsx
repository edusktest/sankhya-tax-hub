import { useMemo, useState } from "react";
import { AlertTriangle, Filter, Search } from "lucide-react";
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

// ── Mock ──────────────────────────────────────────────────────────
export const ALERTAS = [
  {
    codigo: "PRTC0001",
    descricao: "Divergência de alíquota detectada no lançamento. Verificar configuração de tributação integral.",
    menuOrigem: "Receitas > Movimento",
    registro: "100.741",
  },
  {
    codigo: "PRTC0002",
    descricao: "Título foi recebido com multa e juros. É necessário gerar uma Nota de Débito.",
    menuOrigem: "Receitas > Multa e Juros",
    registro: "100.803",
  },
  {
    codigo: "PRTC0003",
    descricao: "Documento fiscal sem classificação tributária definida para o produto.",
    menuOrigem: "Documentos > Movimento",
    registro: "100.812",
  },
  {
    codigo: "PRTC0004",
    descricao: "Crédito presumido não configurado para o regime aplicado nesta operação.",
    menuOrigem: "Receitas > Movimento",
    registro: "100.819",
  },
  {
    codigo: "APRC0001",
    descricao: "Resultado da apuração CBS diverge do saldo do período anterior. Revisar antes do envio.",
    menuOrigem: "Apuração > CBS",
    registro: "APR-2026-05",
  },
  {
    codigo: "APRC0002",
    descricao: "Apuração IBS sem retorno do SPED há mais de 48h. Verifique o histórico de eventos.",
    menuOrigem: "Apuração > IBS",
    registro: "APR-2026-05",
  },
  {
    codigo: "DCTE0001",
    descricao: "NF-e com chave de acesso duplicada identificada. Cancelamento necessário.",
    menuOrigem: "Documentos > Movimento",
    registro: "100.835",
  },
  {
    codigo: "DERE0001",
    descricao: "Evento D-1001 da Gamma Seguros S.A. está em processamento há mais de 24h sem recibo.",
    menuOrigem: "DeRE > D-1001",
    registro: "EVT-00042",
  },
  {
    codigo: "DERE0002",
    descricao: "Plano Referencial não configurado para Gamma Seguros S.A. Impede a geração do D-1011.",
    menuOrigem: "DeRE > D-1011",
    registro: "EVT-00043",
  },
  {
    codigo: "PRTC0005",
    descricao: "Despesa sem vínculo com fornecedor habilitado para crédito de CBS.",
    menuOrigem: "Despesas > Movimento",
    registro: "100.867",
  },
];

// ── Badge por prefixo ─────────────────────────────────────────────
function BadgeCodigo({ codigo }: { codigo: string }) {
  const prefix = codigo.replace(/\d+$/, "");
  const colors: Record<string, string> = {
    PRTC: "border-warning/50 text-warning bg-warning/10",
    APRC: "border-destructive/50 text-destructive bg-destructive/10",
    DCTE: "border-destructive/50 text-destructive bg-destructive/10",
    DERE: "border-info/50 text-info bg-info/10",
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
  const [busca, setBusca] = useState("");

  const rows = useMemo(() => {
    if (!busca.trim()) return ALERTAS;
    const q = busca.toLowerCase();
    return ALERTAS.filter(
      (a) =>
        a.codigo.toLowerCase().includes(q) ||
        a.descricao.toLowerCase().includes(q) ||
        a.menuOrigem.toLowerCase().includes(q) ||
        a.registro.toLowerCase().includes(q),
    );
  }, [busca]);

  const hasFilter = busca.trim() !== "";

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
          {hasFilter && (
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
                  <TableHead className="text-[12px] w-36">Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-[13px] text-muted-foreground py-10">
                      Nenhum alerta encontrado para os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((alerta) => (
                    <TableRow key={alerta.codigo} className="hover:bg-muted/40 text-[13px]">
                      <TableCell className="py-3">
                        <BadgeCodigo codigo={alerta.codigo} />
                      </TableCell>
                      <TableCell className="py-3 leading-snug">{alerta.descricao}</TableCell>
                      <TableCell className="py-3 text-muted-foreground text-[12px]">
                        {alerta.menuOrigem}
                      </TableCell>
                      <TableCell className="py-3 font-mono text-[12px]">{alerta.registro}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-[12px] text-muted-foreground mt-2">
            {rows.length} {rows.length === 1 ? "alerta" : "alertas"}
            {hasFilter && ` encontrado${rows.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>
    </div>
  );
}
