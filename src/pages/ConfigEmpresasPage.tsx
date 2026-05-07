import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, CheckCircle2, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────
type ModuloKey = "cbs" | "ibs" | "dere";

const MODULOS: { key: ModuloKey; label: string }[] = [
  { key: "cbs", label: "Apuração CBS" },
  { key: "ibs", label: "Apuração IBS" },
  { key: "dere", label: "DeRE" },
];

interface EmpresaConfig {
  codEmpresa: number;
  nomeFantasia: string;
  cnpj: string;
  simplesNacional: boolean;
  codRegimeTributario: string;
  empresaMatriz: number;
  habilitacoes: Record<ModuloKey, boolean>;
}

type WizardAction = "habilitar" | "desabilitar";
type WizardState = Record<number, Record<ModuloKey, boolean>>;

// ── Mock Data ─────────────────────────────────────────────────────
const EMPRESAS_MOCK: EmpresaConfig[] = [
  {
    codEmpresa: 1,
    nomeFantasia: "Financeira Alpha S.A.",
    cnpj: "12.345.678/0001-99",
    simplesNacional: false,
    codRegimeTributario: "Regime Normal",
    empresaMatriz: 1,
    habilitacoes: { cbs: true, ibs: true, dere: true },
  },
  {
    codEmpresa: 2,
    nomeFantasia: "Alpha Filial SP",
    cnpj: "12.345.678/0002-80",
    simplesNacional: false,
    codRegimeTributario: "Regime Normal",
    empresaMatriz: 1,
    habilitacoes: { cbs: true, ibs: false, dere: false },
  },
  {
    codEmpresa: 3,
    nomeFantasia: "Beta Factoring Ltda.",
    cnpj: "98.765.432/0001-01",
    simplesNacional: false,
    codRegimeTributario: "Regime Normal",
    empresaMatriz: 3,
    habilitacoes: { cbs: false, ibs: false, dere: false },
  },
  {
    codEmpresa: 4,
    nomeFantasia: "Gamma Seguros S.A.",
    cnpj: "55.444.333/0001-55",
    simplesNacional: false,
    codRegimeTributario: "Regime Normal",
    empresaMatriz: 4,
    habilitacoes: { cbs: true, ibs: true, dere: false },
  },
  {
    codEmpresa: 5,
    nomeFantasia: "Delta Comercio ME",
    cnpj: "11.222.333/0001-44",
    simplesNacional: true,
    codRegimeTributario: "Simples Nacional",
    empresaMatriz: 5,
    habilitacoes: { cbs: false, ibs: false, dere: false },
  },
  {
    codEmpresa: 25,
    nomeFantasia: "Empresa Teste",
    cnpj: "01.001.001/0001-00",
    simplesNacional: false,
    codRegimeTributario: "Regime Normal",
    empresaMatriz: 1,
    habilitacoes: { cbs: false, ibs: false, dere: false },
  },
];

// ── Shared Components ─────────────────────────────────────────────
function HabilitacaoBadge({ enabled }: { enabled: boolean }) {
  if (enabled)
    return (
      <Badge variant="outline" className="border-success/50 text-success bg-success/10 text-xs font-medium">
        Habilitado
      </Badge>
    );
  return <span className="text-muted-foreground/40 text-xs">—</span>;
}

const TH = "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

// ── Page ──────────────────────────────────────────────────────────
export default function ConfigEmpresasPage() {
  const [empresas, setEmpresas] = useState<EmpresaConfig[]>(EMPRESAS_MOCK);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [wizardAction, setWizardAction] = useState<WizardAction | null>(null);
  const [wizardState, setWizardState] = useState<WizardState>({});
  const [wizardDone, setWizardDone] = useState(false);

  const filtered = empresas.filter(
    (e) =>
      search === "" ||
      e.nomeFantasia.toLowerCase().includes(search.toLowerCase()) ||
      e.cnpj.includes(search) ||
      String(e.codEmpresa).includes(search)
  );

  const selectableCods = filtered.map((e) => e.codEmpresa);
  const allSelected =
    selectableCods.length > 0 && selectableCods.every((c) => selected.includes(c));
  const someSelected = selected.length > 0;
  const headerCheckState: boolean | "indeterminate" = allSelected
    ? true
    : selectableCods.some((c) => selected.includes(c))
    ? "indeterminate"
    : false;

  function toggleAll() {
    setSelected(allSelected ? [] : selectableCods);
  }
  function toggleOne(cod: number) {
    setSelected((s) => (s.includes(cod) ? s.filter((x) => x !== cod) : [...s, cod]));
  }

  // ── Wizard helpers ─────────────────────────────────────────────
  function openWizard(action: WizardAction) {
    const initial: WizardState = {};
    empresas
      .filter((e) => selected.includes(e.codEmpresa))
      .forEach((e) => {
        initial[e.codEmpresa] = { ...e.habilitacoes };
      });
    setWizardState(initial);
    setWizardAction(action);
    setWizardDone(false);
  }

  function closeWizard() {
    setWizardAction(null);
    setWizardState({});
    setWizardDone(false);
  }

  function confirmWizard() {
    setEmpresas((prev) =>
      prev.map((e) =>
        wizardState[e.codEmpresa]
          ? { ...e, habilitacoes: wizardState[e.codEmpresa] }
          : e
      )
    );
    setWizardDone(true);
  }

  function doneWizard() {
    setSelected([]);
    closeWizard();
  }

  function setModulo(codEmpresa: number, modulo: ModuloKey, value: boolean) {
    setWizardState((prev) => ({
      ...prev,
      [codEmpresa]: { ...prev[codEmpresa], [modulo]: value },
    }));
  }

  function setModuloAll(modulo: ModuloKey, value: boolean) {
    setWizardState((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((cod) => {
        next[Number(cod)] = { ...next[Number(cod)], [modulo]: value };
      });
      return next;
    });
  }

  function getModuloHeaderState(modulo: ModuloKey): boolean | "indeterminate" {
    const vals = Object.values(wizardState).map((v) => v[modulo]);
    if (vals.length === 0) return false;
    if (vals.every(Boolean)) return true;
    if (vals.some(Boolean)) return "indeterminate";
    return false;
  }

  const selectedEmpresas = empresas.filter((e) => selected.includes(e.codEmpresa));

  // ── Wizard: sucesso ────────────────────────────────────────────
  if (wizardAction && wizardDone) {
    return (
      <div className="flex flex-col items-center py-16 gap-4">
        <div className="h-14 w-14 rounded-full bg-success/10 border border-success/30 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">
            Configurações aplicadas com sucesso!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedEmpresas.length} empresa
            {selectedEmpresas.length > 1 ? "s" : ""} atualizada
            {selectedEmpresas.length > 1 ? "s" : ""}.
          </p>
        </div>
        <Button onClick={doneWizard}>Voltar à lista</Button>
      </div>
    );
  }

  // ── Wizard: seleção ────────────────────────────────────────────
  if (wizardAction) {
    const isHabilitar = wizardAction === "habilitar";
    return (
      <div>
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-3 flex items-center justify-between gap-4 -mx-6 -mt-6 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-0.5 flex-wrap">
              <span>Configurações</span>
              <ChevronRight className="h-3 w-3" />
              <span>Empresas</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">
                {isHabilitar ? "Habilitar" : "Desabilitar"} módulos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-[16px] font-semibold text-foreground leading-tight">
                {isHabilitar ? "Habilitar" : "Desabilitar"} módulos
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium",
                  isHabilitar
                    ? "border-success/50 text-success bg-success/10"
                    : "border-destructive/50 text-destructive bg-destructive/10"
                )}
              >
                {selectedEmpresas.length} empresa
                {selectedEmpresas.length > 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={closeWizard} className="text-muted-foreground">
              Cancelar
            </Button>
            <Button size="sm" onClick={confirmWizard}>
              Confirmar
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          {isHabilitar
            ? "Marque os módulos que deseja habilitar para cada empresa selecionada."
            : "Desmarque os módulos que deseja desabilitar para cada empresa selecionada."}
        </p>

        <div className="bg-card rounded-lg border card-shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className={TH}>Empresa</TableHead>
                {MODULOS.map((m) => {
                  const hState = getModuloHeaderState(m.key);
                  return (
                    <TableHead key={m.key} className="text-center w-40">
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <span className={TH}>{m.label}</span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Checkbox
                            checked={hState}
                            onCheckedChange={(v) => setModuloAll(m.key, !!v)}
                          />
                          <span className="text-[10px] text-muted-foreground font-normal normal-case tracking-normal">
                            Todos
                          </span>
                        </label>
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedEmpresas.map((e) => (
                <TableRow key={e.codEmpresa} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs text-muted-foreground w-7 shrink-0">
                        {e.codEmpresa}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {e.nomeFantasia}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {e.cnpj}
                        </p>
                      </div>
                      {e.empresaMatriz !== e.codEmpresa && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-border text-muted-foreground shrink-0"
                        >
                          Filial
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {MODULOS.map((m) => (
                    <TableCell key={m.key} className="text-center">
                      <Checkbox
                        checked={wizardState[e.codEmpresa]?.[m.key] ?? false}
                        onCheckedChange={(v) => setModulo(e.codEmpresa, m.key, !!v)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // ── Grid view ──────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
            <span>Configurações</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Empresas</span>
          </div>
          <h1 className="text-[20px] font-semibold text-foreground leading-tight">Empresas</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Gerencie os módulos habilitados por empresa no Portal da Reforma Tributária
          </p>
        </div>

        {/* Action bar — aparece ao selecionar */}
        {someSelected && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[12px] text-muted-foreground">
              {selected.length} selecionada{selected.length > 1 ? "s" : ""}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-success/50 text-success hover:bg-success/10"
              onClick={() => openWizard("habilitar")}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Habilitar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => openWizard("desabilitar")}
            >
              <X className="h-3.5 w-3.5" />
              Desabilitar
            </Button>
          </div>
        )}
      </div>

      {/* Filtro */}
      <div className="flex items-center mb-4 px-3 py-2.5 bg-muted/40 rounded-lg border">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Código, nome ou CNPJ"
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-lg card-shadow border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10">
                <Checkbox checked={headerCheckState} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className={TH}>Cód. Empresa</TableHead>
              <TableHead className={TH}>Nome Fantasia</TableHead>
              <TableHead className={TH}>CNPJ</TableHead>
              <TableHead className={TH}>Optante SIMPLES</TableHead>
              <TableHead className={TH}>Cód. Regime Tribut.</TableHead>
              <TableHead className={TH}>Empresa Matriz</TableHead>
              <TableHead className={cn(TH, "text-center")}>Apuração CBS</TableHead>
              <TableHead className={cn(TH, "text-center")}>Apuração IBS</TableHead>
              <TableHead className={cn(TH, "text-center")}>DeRE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow
                key={e.codEmpresa}
                className={cn(
                  "hover:bg-muted/30 transition-colors",
                  selected.includes(e.codEmpresa) && "bg-primary/5"
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selected.includes(e.codEmpresa)}
                    onCheckedChange={() => toggleOne(e.codEmpresa)}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm font-semibold">
                  {e.codEmpresa}
                </TableCell>
                <TableCell className="text-sm font-medium">{e.nomeFantasia}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {e.cnpj}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      e.simplesNacional
                        ? "border-blue-400/50 text-blue-600 bg-blue-50"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {e.simplesNacional ? "Sim" : "Não"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {e.codRegimeTributario}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm">{e.empresaMatriz}</span>
                    {e.empresaMatriz !== e.codEmpresa && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-border text-muted-foreground"
                      >
                        Filial
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <HabilitacaoBadge enabled={e.habilitacoes.cbs} />
                </TableCell>
                <TableCell className="text-center">
                  <HabilitacaoBadge enabled={e.habilitacoes.ibs} />
                </TableCell>
                <TableCell className="text-center">
                  <HabilitacaoBadge enabled={e.habilitacoes.dere} />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-8 text-sm text-muted-foreground"
                >
                  Nenhuma empresa encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-2.5 border-t text-[11px] text-muted-foreground bg-muted/20">
          <span>
            {selected.length > 0 && (
              <>
                <strong>{selected.length}</strong> selecionada
                {selected.length > 1 ? "s" : ""} ·{" "}
              </>
            )}
            Exibindo{" "}
            <strong className="text-foreground">{filtered.length}</strong> de{" "}
            <strong className="text-foreground">{empresas.length}</strong> empresas
          </span>
        </div>
      </div>
    </div>
  );
}
