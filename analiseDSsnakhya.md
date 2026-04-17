# Análise de Migração: shadcn/ui → Design System Sankhya

## 1. Mapa de Componentes

| shadcn/ui | Sankhya DS | Pacote |
|---|---|---|
| `Table` / `TableHeader` / `TableRow` | `SnkGrid` | `@sankhyalabs/sankhyablocks` |
| `Select` (filtros) | `filterCustomConfig` no `SnkGrid` (SnkFilterBar integrada) | `@sankhyalabs/sankhyablocks` |
| `Badge` (status) | `statusResolver` na coluna da grid | `@sankhyalabs/sankhyablocks` |
| `Button` (ações) | `taskbarManager` + `actionsList` | `@sankhyalabs/sankhyablocks` |
| `Sidebar` + `Collapsible` | Sem equivalente direto — DS Sankhya assume navegação via framework host (Sankhya Om). Manter sidebar atual ou usar `EzApplication` como shell. | `@sankhyalabs/ezui` |
| `Tooltip` | Hint nativo nos action buttons do taskbar | `@sankhyalabs/sankhyablocks` |
| `Card` | `SnkApplication` já provê o container e tema | — |

---

## 2. Código da página `ApuracaoCBS`

### Instalação

```bash
npm install @sankhyalabs/sankhyablocks @sankhyalabs/ezui
```

### `src/pages/ApuracaoCBS.tsx`

```tsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  SnkApplication,
  SnkDataUnit,
  SnkGrid,
} from "@sankhyalabs/sankhyablocks/react/components";
import { apuracoes } from "@/data/mockData";

const CONFIG_NAME = "apuracao-cbs";

// taskbarManager: remove FORM_MODE (tela somente leitura) e adiciona ação "Ver Detalhes"
const buildTaskbarManager = (onVerDetalhe: () => void) => ({
  getButtons: (
    taskbarId: string,
    dataState: unknown,
    currentButtons: Array<{ name: string }>
  ) => {
    // Remove o botão de edição/formulário — esta tela é só consulta
    const filtered = currentButtons.filter((b) => b.name !== "FORM_MODE");

    // Botão customizado de detalhe
    const btnDetalhe = {
      name: "VER_DETALHE",
      hint: "Ver detalhes da apuração",
      iconName: "visibility",
      text: "Ver Detalhes",
    };

    return [...filtered, btnDetalhe];
  },
});

// Configuração dos filtros da SnkFilterBar (integrada ao SnkGrid)
const filterCustomConfig = [
  {
    id: "periodo",
    label: "Período",
    type: "text",
  },
  {
    id: "razaoSocial",
    label: "Razão Social / Empresa",
    type: "text",
  },
  {
    id: "situacao",
    label: "Situação",
    type: "select",
    dataSource: [
      { value: "Em andamento", label: "Em andamento" },
      { value: "Concluído", label: "Concluído" },
    ],
  },
];

export default function ApuracaoCBS() {
  const navigate = useNavigate();
  const [dataUnitInstance, setDataUnitInstance] = useState<unknown>(null);
  const selectedIdRef = useRef<string | null>(null);

  const handleDataUnitReady = (event: CustomEvent) => {
    const du = event.detail;
    setDataUnitInstance(du);

    // DataUnitInMemoryLoader: conecta os dados mock ao DataUnit
    // quando NÃO há backend Sankhya disponível
    if (du.setFetcher) {
      du.setFetcher({
        fetch: async () => ({ records: apuracoes, total: apuracoes.length }),
      });
    }

    du.loadData();
  };

  const handleRowSelected = (event: CustomEvent) => {
    const record = event.detail?.record;
    selectedIdRef.current = record?.id ?? null;
  };

  const handleActionClick = (event: CustomEvent) => {
    const action = event.detail;

    if (action === "VER_DETALHE" && selectedIdRef.current) {
      navigate(`/apuracao-cbs/${selectedIdRef.current}`);
    }
  };

  // statusResolver: mapeia os valores de 'situacao' para cores do DS Sankhya
  const statusResolver = (data: Record<string, unknown>) => {
    if (data.situacao === "Em andamento") return "warning";
    if (data.situacao === "Concluído") return "success";
    return "default";
  };

  const taskbarManager = buildTaskbarManager(() => {
    if (selectedIdRef.current) {
      navigate(`/apuracao-cbs/${selectedIdRef.current}`);
    }
  });

  return (
    <SnkApplication
      configName={CONFIG_NAME}
      enableLockManagerLoadingApp={false}
      formLegacyConfigName={CONFIG_NAME}
    >
      <SnkDataUnit
        entityName="ApuracaoCBS"
        configName={CONFIG_NAME}
        className="ez-size-height--full"
        onDataUnitReady={handleDataUnitReady}
      >
        {dataUnitInstance && (
          <SnkGrid
            className="ez-flex-item--auto"
            configName={CONFIG_NAME}
            gridLegacyConfigName={`${CONFIG_NAME}-grid`}
            filterBarLegacyConfigName={`${CONFIG_NAME}-filterbar`}
            filterBarTitle="Apurações CBS"
            filterCustomConfig={filterCustomConfig}
            autoLoad={false}
            compact={false}
            isDetail={false}
            multipleSelection={false}
            suppressCheckboxColumn={false}
            disablePersonalizedFilter={false}
            actionsList={[]}
            taskbarManager={taskbarManager}
            statusResolver={statusResolver}
            onActionClick={handleActionClick}
            onRowSelected={handleRowSelected}
          />
        )}
      </SnkDataUnit>
    </SnkApplication>
  );
}
```

---

## 3. Arquitetura necessária

```
SnkApplication                ← Container raiz obrigatório
│  ├─ configName              ← chave global para preferências salvas
│  └─ enableLockManagerLoadingApp
│
└── SnkDataUnit               ← Gerenciador de dados (estado + operações)
    │  ├─ entityName          ← identifica a entidade (mesmo sem backend real)
    │  ├─ configName          ← herda config da aplicação
    │  ├─ onDataUnitReady     ← hook: recebe instância do DataUnit
    │  └─ [du.setFetcher()]   ← conecta DataUnitInMemoryLoader com mock data
    │
    └── SnkGrid               ← Grid + TaskBar + FilterBar integrados
        ├─ taskbarManager     ← controla botões (remove FORM_MODE, adiciona customizados)
        ├─ filterCustomConfig ← define os campos da SnkFilterBar
        ├─ statusResolver     ← mapeia campo → cor da linha (substitui Badge)
        ├─ gridLegacyConfigName
        ├─ filterBarLegacyConfigName
        ├─ onActionClick      ← reage a cliques na taskbar (VER_DETALHE, etc.)
        └─ onRowSelected      ← captura linha selecionada para navegação
```

### Fluxo de dados

1. `SnkApplication` inicializa o contexto global (i18n, mensagens, configs)
2. `SnkDataUnit.onDataUnitReady` dispara → conecta o `fetcher` (InMemory ou API real)
3. `du.loadData()` popula a grid automaticamente
4. A `SnkFilterBar` (integrada) aplica filtros client-side via `filterCustomConfig`
5. `taskbarManager.getButtons()` é chamado sempre que o estado da seleção muda — use para habilitar/desabilitar "Ver Detalhes" com base em `dataState.selectedRecord`

---

## 4. SnkGrid ou SnkCrud?

**Use `SnkGrid`** para esta tela (consulta somente leitura).

| Critério | SnkGrid ✅ | SnkCrud ❌ |
|---|---|---|
| Propósito | Consulta / listagem somente leitura | CRUD completo (inclusão, edição, exclusão) |
| Formulário | Não inclui | Inclui `SnkForm` integrado |
| Botão FORM_MODE | Remover via `taskbarManager` | Nativo |
| Master-detail simples | Navegação manual via `onActionClick` | Automático via `entityName` + relacionamentos |
| **ApuracaoCBS** | **Sim** — visualizar + exportar + navegar para detalhe | Somente se precisar editar as apurações |

> **Regra do DS Sankhya (rules 16–18):** "Se a tela não exige cadastro de novos registros, use o `SnkGrid`".  
> A tela `ApuracaoDetalhe` também deve usar `SnkGrid` se for somente leitura, ou `SnkCrud` se permitir edições.

---

## 5. Regras obrigatórias do Design System Sankhya (resumo)

- Sempre use `SnkApplication` como container raiz
- `SnkDataUnit` sempre recebe `className="ez-size-height--full"`
- Telas somente leitura: use `SnkGrid` e remova `FORM_MODE` via `taskbarManager`
- Sempre adicione `gridLegacyConfigName` e `filterBarLegacyConfigName` ao `SnkGrid`
- Botões customizados do `taskbarManager` exigem: `name`, `hint`, `iconName`, `text`
- Para `onActionClick`, use apenas `evt.detail` para identificar a ação
- Use `DataUnitInMemoryLoader` (via `du.setFetcher`) quando os dados não vêm do backend Sankhya
- Um arquivo por tela — não criar pastas desnecessárias
- Nunca use nomes de ícones que não existam no Design System Sankhya
