# Sankhya Tax Hub — Guia de Estrutura do Projeto

> Portal da Reforma Tributária (CBS / IBS / IS / DeRE) integrado ao ERP Sankhya.

---

## Stack Principal

| Camada | Tecnologia |
|---|---|
| Framework | React 18.3 + TypeScript 5.8 |
| Build | Vite 5 + SWC |
| Roteamento | React Router DOM 6 |
| Estado servidor | TanStack React Query 5 |
| Formulários | React Hook Form 7 + Zod |
| UI base | shadcn/ui (Radix UI) |
| Estilos | Tailwind CSS 3 |
| Ícones | Lucide React |
| Temas | next-themes (dark/light) |
| Notificações | Sonner (toast) |
| Gráficos | Recharts |
| Datas | date-fns |
| Componentes Sankhya | @sankhyalabs/ezui + sankhyablocks |
| Testes | Vitest 3 + Testing Library |

---

## Árvore de Pastas

```
sankhya-tax-hub/
├── src/
│   ├── components/             # Componentes reutilizáveis da aplicação
│   │   ├── AppLayout.tsx           # Layout principal com painel esq/centro/dir e animação de transição
│   │   ├── AppSidebar.tsx          # Menu lateral hierárquico com busca e grupos retráteis
│   │   ├── BIAChat.tsx             # Painel esquerdo do assistente BIA (colapsável 340px → 48px)
│   │   ├── ConversationalLanding.tsx # Tela inicial conversacional antes da interação
│   │   ├── HomeQueryBox.tsx        # Caixa de busca/query da tela Home
│   │   ├── NavPanel.tsx            # Painel de navegação direito
│   │   ├── NavLink.tsx             # Link de navegação com estado ativo
│   │   └── ui/                     # Biblioteca shadcn/ui (40+ primitivos)
│   │
│   ├── pages/                  # Uma página por rota (nomenclatura PascalCase)
│   │   ├── Home.tsx                              # Dashboard principal com status de módulos e empresas
│   │   ├── ApuracaoCBS.tsx                       # Lista de apurações CBS com filtros
│   │   ├── ApuracaoDetalhe.tsx                   # Detalhe de uma apuração CBS (contas, alertas, eventos)
│   │   ├── ApuracaoDere.tsx                      # Gestão DeRE — prop initialScreen controla tela ativa
│   │   │                                         #   (plano-ref | d1001-list | d1011-list | historico)
│   │   ├── ConfigEmpresasPage.tsx                # Habilitar/desabilitar módulos por empresa/filial
│   │   ├── AssistenteExcecoesPage.tsx            # Configuração de exceções de tributação IBS/CBS
│   │   ├── TributacaoPersonalizadaWizard.tsx     # Wizard de configuração de alíquotas personalizadas
│   │   ├── TabelaOficialPage.tsx                 # Tabelas oficiais (reutilizada em 4 rotas de tabelas)
│   │   ├── MovimentacoesReceitasMovimento.tsx    # Movimentações de receitas
│   │   ├── MovimentacoesReceitasMultaJuros.tsx   # Multas e juros sobre receitas
│   │   ├── MovimentacoesDespedasMovimento.tsx    # Movimentações de despesas
│   │   ├── MovimentacoesDocumentosMovimento.tsx  # Movimentações de documentos
│   │   ├── PlaceholderPage.tsx                   # Stub para páginas futuras (IBS, IS, Processos…)
│   │   ├── Index.tsx                             # Redireciona / → /home
│   │   └── NotFound.tsx                          # Página 404
│   │
│   ├── context/
│   │   └── BIAChatContext.tsx      # Estado global do chat BIA (mensagens, thinking, pendingAction)
│   │
│   ├── routes/
│   │   └── interface/index.ts      # Enum ERoutes com todos os paths da aplicação
│   │
│   ├── data/
│   │   ├── mockData.ts             # Dados mock usados no lugar de APIs reais
│   │   └── storage/
│   │       └── ServiceStore.ts     # Camada de cache/store (singleton, pronto para API)
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx          # Hook para detectar breakpoint mobile
│   │   └── use-toast.ts            # Hook para disparar toasts
│   │
│   ├── utils/
│   │   └── getSnkApp.ts            # Interface de integração com o ERP Sankhya
│   │
│   ├── lib/
│   │   └── utils.ts                # Utilitário cn() para merge de classes Tailwind
│   │
│   ├── test/
│   │   ├── setup.ts                # Setup do Vitest (mock matchMedia)
│   │   └── example.test.ts         # Exemplo de teste
│   │
│   ├── App.tsx                     # Providers + definição das rotas (React Router)
│   ├── App.css                     # Estilos globais do app
│   ├── index.css                   # Tailwind layers + variáveis CSS de tema
│   └── main.tsx                    # Ponto de entrada (ReactDOM.render)
│
├── public/
│   ├── logosk.jpg                  # Logo Sankhya
│   ├── favicon.ico
│   └── placeholder.svg
│
├── index.html                      # HTML raiz (id="root")
├── vite.config.ts                  # Configuração do Vite (porta 8080, alias @/*)
├── tailwind.config.ts              # Tema Tailwind (cores Sankhya, dark mode)
├── tsconfig.json                   # TypeScript config raiz
├── components.json                 # Metadata shadcn/ui
└── package.json                    # Dependências e scripts
```

---

## Páginas Existentes

| Arquivo | Rota(s) | O que faz |
|---|---|---|
| `Home.tsx` | `/home` | Dashboard com status de empresas habilitadas e módulos tributários |
| `ApuracaoCBS.tsx` | `/apuracao-cbs` | Lista de apurações CBS com filtros (período, empresa, situação) |
| `ApuracaoDetalhe.tsx` | `/apuracao-cbs/:id` | Detalhe de uma apuração: contas, alertas, eventos |
| `ApuracaoDere.tsx` | `/apuracao-dere`, `/apuracao-dere/plano-ref`, `/apuracao-dere/d1001`, `/apuracao-dere/d1011`, `/apuracao-dere/historico` | Telas DeRE: plano-ref, D-1001, D-1011, histórico (prop `initialScreen` controla a tela ativa) |
| `ConfigEmpresasPage.tsx` | `/configuracoes/empresas` | Habilitar módulos (CBS, IBS, IS, DeRE) por empresa/filial |
| `AssistenteExcecoesPage.tsx` | `/configuracoes/assistente/excecoes-ibs-cbs` | Configurar exceções de tributação IBS/CBS |
| `TributacaoPersonalizadaWizard.tsx` | `/tributacao-personalizada` | Wizard multi-etapa de alíquotas personalizadas |
| `TabelaOficialPage.tsx` | `/configuracoes/tabelas/classificacao-tributaria`, `/configuracoes/tabelas/credito-presumido`, `/configuracoes/tabelas/anexos`, `/configuracoes/tabelas/indicadores-locais-operacao` | Tabelas oficiais de tributação (reutilizada em 4 rotas) |
| `MovimentacoesReceitasMovimento.tsx` | `/movimentacoes/receitas/movimento` | Movimentos de receitas |
| `MovimentacoesReceitasMultaJuros.tsx` | `/movimentacoes/receitas/multa-juros` | Multas e juros sobre receitas |
| `MovimentacoesDespedasMovimento.tsx` | `/movimentacoes/despesas/movimento` | Movimentos de despesas |
| `MovimentacoesDocumentosMovimento.tsx` | `/movimentacoes/documentos/movimento` | Movimentos de documentos |
| `PlaceholderPage.tsx` | `/apuracao-ibs`, `/apuracao-is`, `/gestao-eventos`, `/processos`, `/financeiro`, `/tributacao-integral`, alíquotas CBS/IBS/IS, digital workers | Stub para funcionalidades ainda não implementadas |

---

## Rotas Definidas (`ERoutes`)

```typescript
// src/routes/interface/index.ts

// Raiz
INDEX                              → /                                              (redireciona para /home)
HOME                               → /home

// Operações tributárias
APURACAO_CBS                       → /apuracao-cbs
APURACAO_CBS_DETALHE               → /apuracao-cbs/:id
APURACAO_IBS                       → /apuracao-ibs                                 (placeholder)
APURACAO_IS                        → /apuracao-is                                  (placeholder)
APURACAO_DERE                      → /apuracao-dere                                (ApuracaoDere — tela padrão)
APURACAO_DERE_PLANO_REF            → /apuracao-dere/plano-ref                      (ApuracaoDere initialScreen="plano-ref")
APURACAO_DERE_D1001                → /apuracao-dere/d1001                          (ApuracaoDere initialScreen="d1001-list")
APURACAO_DERE_D1011                → /apuracao-dere/d1011                          (ApuracaoDere initialScreen="d1011-list")
APURACAO_DERE_HISTORICO            → /apuracao-dere/historico                      (ApuracaoDere initialScreen="historico")
GESTAO_EVENTOS                     → /gestao-eventos                               (placeholder)
PROCESSOS                          → /processos                                    (placeholder)
FINANCEIRO                         → /financeiro                                   (placeholder)

// Tributação
TRIBUTACAO_INTEGRAL                → /tributacao-integral                          (placeholder)
TRIBUTACAO_PERSONALIZADA           → /tributacao-personalizada

// Movimentações
MOVIMENTACOES_RECEITAS_MOVIMENTO   → /movimentacoes/receitas/movimento
MOVIMENTACOES_RECEITAS_MULTA_JUROS → /movimentacoes/receitas/multa-juros
MOVIMENTACOES_DESPESAS_MOVIMENTO   → /movimentacoes/despesas/movimento
MOVIMENTACOES_DOCUMENTOS_MOVIMENTO → /movimentacoes/documentos/movimento

// Configurações — Assistente
CONFIG_ASSISTENTE_EXCECOES         → /configuracoes/assistente/excecoes-ibs-cbs
CONFIG_ASSISTENTE_NFE_DEBITO       → /configuracoes/assistente/nfe-debito-ibs-cbs  (no enum, sem rota registrada)
CONFIG_ASSISTENTE_NFE_CREDITO      → /configuracoes/assistente/nfe-credito-ibs-cbs (no enum, sem rota registrada)

// Configurações — Empresa
CONFIG_EMPRESAS                    → /configuracoes/empresas

// Configurações — Alíquotas
CONFIG_ALIQUOTAS_CBS               → /configuracoes/aliquotas/cbs                  (placeholder)
CONFIG_ALIQUOTAS_IBS               → /configuracoes/aliquotas/ibs                  (placeholder)
CONFIG_ALIQUOTAS_IS                → /configuracoes/aliquotas/is                   (placeholder)

// Configurações — Tabelas
CONFIG_TABELAS_CLASSIFICACAO       → /configuracoes/tabelas/classificacao-tributaria
CONFIG_TABELAS_CREDITO_PRESUMIDO   → /configuracoes/tabelas/credito-presumido
CONFIG_TABELAS_ANEXOS              → /configuracoes/tabelas/anexos
CONFIG_TABELAS_INDICADORES         → /configuracoes/tabelas/indicadores-locais-operacao

// Digital Workers
DIGITAL_WORKERS_CONFIG_GLOBAL      → /digital-workers/configuracoes-globais        (placeholder)
DIGITAL_WORKERS_CONFIG_WORKER      → /digital-workers/configuracao-por-worker      (placeholder)
```

---

## Arquitetura de Layout

Layout de 3 colunas gerenciado por `AppLayout.tsx`:

```
┌─────────────────────────────────────────────────────────┐
│                        HEADER                           │
│  Logo Sankhya | Portal da Reforma Tributária | Notif | Perfil │
├─────────────┬──────────────────────────┬────────────────┤
│             │                          │                │
│  BIA CHAT   │     CONTEÚDO DA PÁGINA   │  NAV PANEL     │
│  (esquerdo) │     (centro)             │  (direito)     │
│             │                          │                │
│  - Mensagens│  - Dashboard / Páginas   │  - Menu de     │
│  - Input    │  - Tabelas / Formulários │    navegação   │
│  - Respostas│  - Animação "Pensando…"  │                │
│    rápidas  │                          │                │
│  340px →    │                          │                │
│  48px colaп │                          │                │
└─────────────┴──────────────────────────┴────────────────┘
```

**AppLayout.tsx** gerencia:
- Animação de transição entre telas ("Pensando...", "Buscando tela...", "Analisando dados...")
- Integração com `BIAChatContext` para controle de layout imediato
- Renderização condicional de `ConversationalLanding` vs conteúdo principal

---

## Componente BIA Chat

Painel lateral **esquerdo** presente em todas as telas. Colapsável (340px → 48px).

**Estado gerenciado via `BIAChatContext`** (`src/context/BIAChatContext.tsx`):

| Propriedade | Tipo | Descrição |
|---|---|---|
| `messages` | `BIAMessage[]` | Histórico de mensagens |
| `isOpen` | `boolean` | Painel expandido ou colapsado |
| `thinking` | `boolean` | Estado de "carregando" (spinner) |
| `hasInteracted` | `boolean` | Oculta o ConversationalLanding após 1ª interação |
| `immediateLayout` | `boolean` | Pula animação de transição |
| `pendingAction` | `() => void` | Callback para execução após resposta BIA |

**Tipos de mensagem:**
- `alerta` → fundo amarelo (aviso)
- `insight` → fundo azul (análise)
- `info` → fundo neutro (informacional)

Localização: `src/components/BIAChat.tsx`

---

## Dados Mock

Toda a aplicação roda com dados simulados em `src/data/mockData.ts`:

```typescript
apuracoes[]         // 5 apurações CBS (CNPJ, período, situação, valores)
contas[]            // Contas contábeis de uma apuração
outrasInfos[]       // Seções de informações adicionais
eventosApuracao[]   // Histórico de eventos de uma apuração
EMPRESAS_MOCK[]     // Empresas com filiais e módulos configurados
```

Para trocar por API real: substituir os `useState` que consomem mock por queries do **React Query** apontando para o `ServiceStore`.

---

## Integração com Sankhya ERP

**`src/utils/getSnkApp.ts`**

Interface mínima para rodar dentro do contexto do ERP:

```typescript
interface SnkApp {
  message(title: string, msg: string, type: "success" | "error" | "warning" | "info"): void
  alert(title: string, msg: string): void
  getDataFetcher(): Promise<{
    callServiceBroker(service: string, params: unknown): Promise<unknown>
  }>
}

// Em dev: retorna implementação mock
// Em prod: retorna window.SnkApplication (contexto do ERP)
```

**ServiceStore** (`src/data/storage/ServiceStore.ts`): cache singleton com métodos `getInstance()`, `insert()`, `get()`, `remove()`, `clear()`. Pronto para receber chamadas via ServiceBroker.

---

## Sistema de Temas e Cores

Definidos em `src/index.css` como variáveis CSS (HSL):

| Token | Valor | Uso |
|---|---|---|
| `--primary` | `152 69% 31%` | Verde Sankhya |
| `--secondary` | cinza neutro | Elementos secundários |
| `--destructive` | `0 84% 60%` | Erros e exclusões |
| `--success` | verde | Confirmações |
| `--warning` | `38 92% 50%` | Alertas amarelos |
| `--info` | `210 100% 50%` | Informações em azul |
| `--sidebar-*` | `210 20% 97%` | Cores do menu lateral |

Dark mode habilitado via classe `dark` no `<html>` (next-themes).

Fonte: **Inter** (Google Fonts). Sombra de cards via utilitário `card-shadow`.

---

## Como Adicionar Conteúdo

### Nova página
1. Criar `src/pages/NomeDaPagina.tsx`
2. Adicionar rota em `src/routes/interface/index.ts` (enum `ERoutes`)
3. Registrar `<Route>` em `src/App.tsx`
4. Adicionar item no menu em `src/components/AppSidebar.tsx`

### Novo componente reutilizável
- Compartilhado entre páginas → `src/components/`
- Primitivo UI (botão, input etc.) → `src/components/ui/` (shadcn/ui)

### Nova rota de API / query
1. Criar função em `src/data/storage/ServiceStore.ts`
2. Consumir com `useQuery` / `useMutation` do React Query na página

### Integrar BIA Chat em uma nova página
1. Usar o hook `useBIAChat()` do contexto `BIAChatContext`
2. Adicionar mensagens via `addMessage(content, type)`
3. Definir `pendingAction` para ações após resposta do usuário

---

## Convenções de Nomenclatura

| Tipo | Padrão | Exemplo |
|---|---|---|
| Componentes / Páginas | PascalCase | `ApuracaoCBS.tsx` |
| Hooks customizados | `use-kebab-case` | `use-mobile.tsx` |
| Utilitários | camelCase | `getSnkApp.ts` |
| UI primitivos (shadcn) | kebab-case | `input-otp.tsx` |
| Rotas (enum) | UPPER_SNAKE | `APURACAO_CBS` |
| Interfaces TS | PascalCase | `Apuracao`, `EmpresaConfig` |
| Alias de import | `@/` | `import { cn } from '@/lib/utils'` |

---

## Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento (porta 8080)
npm run build        # Build de produção (dist/)
npm run build:dev    # Build em modo desenvolvimento
npm run preview      # Preview do build
npm run test         # Vitest (execução única)
npm run test:watch   # Vitest (modo watch)
npm run lint         # ESLint
```

---

## Glossário de Domínio

| Termo | Significado |
|---|---|
| CBS | Contribuição sobre Bens e Serviços |
| IBS | Imposto sobre Bens e Serviços |
| IS | Imposto Seletivo |
| DeRE | Declaração de Regimes Específicos |
| D-1001 | Documento de informações do contribuinte |
| D-1011 | Plano de contas comentado geral |
| Apuração | Cálculo/levantamento tributário de um período |
| Raiz | CNPJ raiz da empresa (8 dígitos) |
| Filial | Estabelecimento vinculado ao CNPJ raiz |
| Regime Tributário | Enquadramento fiscal (Lucro Real, Presumido etc.) |
| BIA | Business Intelligence Assistant (assistente de IA do painel esquerdo) |
| Digital Workers | Robôs/automações de processamento tributário |
| ServiceBroker | API de comunicação com o back-end do ERP Sankhya |
