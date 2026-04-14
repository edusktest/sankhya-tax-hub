import { useParams, useNavigate } from "react-router-dom";
import { apuracoes, contasApuracao, outrasInfos, eventosApuracao } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, FileDown, AlertTriangle } from "lucide-react";
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
  return (
    <div className="bg-card rounded-lg card-shadow border">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-foreground">Contas da Apuração</h3>
        <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-accent">
          <FileDown className="h-4 w-4 mr-1" />
          Exportar Extratos
        </Button>
      </div>
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
            const isSubItem = c.conta.startsWith("  ");
            const isTotal = c.conta === "Resultado da apuração";
            return (
              <TableRow key={i} className={`${isTotal ? "bg-muted/30 font-semibold" : ""} hover:bg-muted/20`}>
                <TableCell className={isSubItem ? "pl-10 text-muted-foreground text-sm" : ""}>
                  <span className="inline-flex items-center gap-2">
                    {c.conta.trim()}
                    {c.hasAlert && (
                      <span className="inline-flex items-center gap-1 text-warning">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">!</span>
                      </span>
                    )}
                    {c.status && (
                      <Badge variant="outline" className="text-xs border-success text-success bg-success/10">
                        {c.status}
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{c.valorCBS}</TableCell>
                <TableCell className="text-center">
                  {c.hasDetail && (
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-accent">
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

      {/* Header Card */}
      <div className="bg-card rounded-lg card-shadow border p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Período da apuração</p>
            <h1 className="text-lg font-semibold text-foreground">{apuracao.periodo}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{apuracao.razaoSocial}</p>
          </div>
          <Badge
            variant="outline"
            className={
              apuracao.situacao === "Em andamento"
                ? "border-warning text-warning bg-warning/10"
                : "bg-success text-success-foreground"
            }
          >
            {apuracao.situacao}
          </Badge>
        </div>
        <div className="mt-3 flex gap-8">
          <div>
            <p className="text-xs text-muted-foreground">Resultado da apuração</p>
            <p className="text-sm font-mono font-semibold">{apuracao.resultadoApuracao}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo a pagar atual</p>
            <p className="text-sm font-mono font-semibold">{apuracao.saldoPagarAtual}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tipo de resultado</p>
            <p className={`text-sm font-semibold ${
              apuracao.tipoResultado === "Credor" ? "text-success" :
              apuracao.tipoResultado === "Devedor" ? "text-destructive" : "text-muted-foreground"
            }`}>{apuracao.tipoResultado}</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <AlertBanner alertas={apuracao.alertas} />

      {/* Tabs */}
      <Tabs defaultValue="apuracao">
        <TabsList className="bg-muted border">
          <TabsTrigger value="apuracao" className="data-[state=active]:bg-card data-[state=active]:text-primary">Apuração</TabsTrigger>
          <TabsTrigger value="eventos" className="data-[state=active]:bg-card data-[state=active]:text-primary">Eventos</TabsTrigger>
          <TabsTrigger value="outras" className="data-[state=active]:bg-card data-[state=active]:text-primary">Outras Informações</TabsTrigger>
        </TabsList>

        <TabsContent value="apuracao" className="mt-4"><ContasTab /></TabsContent>
        <TabsContent value="eventos" className="mt-4"><EventosTab /></TabsContent>
        <TabsContent value="outras" className="mt-4"><OutrasInfosTab /></TabsContent>
      </Tabs>
    </div>
  );
}
