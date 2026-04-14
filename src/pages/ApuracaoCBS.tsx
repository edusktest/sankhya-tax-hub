import { useNavigate } from "react-router-dom";
import { apuracoes } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileDown } from "lucide-react";
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground">Apuração</p>
          <h1 className="text-xl font-semibold text-foreground">
            Relação de Apurações – CBS
          </h1>
        </div>
        <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-accent">
          Continuar de onde parou
        </Button>
      </div>

      <div className="bg-card rounded-lg card-shadow border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Período</TableHead>
              <TableHead>CNPJ Raiz</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Tipo de Resultado</TableHead>
              <TableHead>Resultado da Apuração</TableHead>
              <TableHead>Saldo a Pagar Atual</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apuracoes.map((a) => (
              <TableRow key={a.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{a.periodo}</TableCell>
                <TableCell>{a.cnpjRaiz}</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
          <span>Exibir: 100</span>
          <span>1-{apuracoes.length} de {apuracoes.length} itens</span>
          <span>Página 1</span>
        </div>
      </div>
    </div>
  );
}
