# Sankhya Tax Hub — Guia de Estrutura do Projeto

> Portal da Reforma Tributária (CBS / IBS / IS / DeRE) integrado ao ERP Sankhya.

---

## Stack Principal

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + TypeScript 5 |
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
| Testes | Vitest + Testing Library |

---

## Árvore de Pastas

```
sankhya-tax-hub/
├── src/
│   ├── components/         # Componentes reutilizáveis da aplicação
│   │   ├── AppLayout.tsx       # Layout principal: sidebar + header + conteúdo
│   │   ├── AppSidebar.tsx      # Menu lateral hierárquico com busca
│   │   ├── BIAChat.tsx         # Painel direito do assistente BIA
│   │   ├── NavLink.tsx         # Link de navegação com estado ativo
│   │   └── ui/                 # Biblioteca shadcn/ui (40+ primitivos)
│   │
│   ├── pages/              # Uma página por rota (nomenclatura PascalCase)
│   │   ├── ApuracaoCBS.tsx         # Lista de apurações CBS
│   │   ├── ApuracaoDetalhe.tsx     # Detalhe de uma apuração CBS
│   │   ├── ApuracaoDere.tsx        # Gestão DeRE (4 telas internas)
│   │   ├── ConfigEmpresasPage.tsx  # Habilitar/desabilitar módulos por empresa
│   │   ├── Index.tsx               # Página inicial
│   │   ├── PlaceholderPage.tsx     # Stub para páginas futuras
│   │   └── NotFound.tsx            # Página 404
│   │
│   ├── routes/
│   │   └── interface/index.ts  # Enum ERoutes com todos os paths da aplicação
│   │
│   ├── data/
│   │   ├── mockData.ts         # Dados mock usados no lugar de APIs reais
│   │   └── storage/
│   │       └── ServiceStore.ts # Camada de cache/store (placeholder p/ API)
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx      # Hook para detectar breakpoint mobile
│   │   └── use-toast.ts        # Hook para disparar toasts
│   │
│   ├── utils/
│   │   └── getSnkApp.ts        # Interface de integração com o ERP Sankhya
│   │
│   ├── lib/
│   │   └── utils.ts            # Utilitário cn() para merge de classes Tailwind
│   │
│   ├── test/
│   │   ├── setup.ts            # Setup do Vitest (mock matchMedia)
│   │   └── example.test.ts     # Exemplo de teste
│   │
│   ├── App.tsx                 # Providers + definição das rotas (React Router)
│   ├── App.css                 # Estilos globais do app
│   ├── index.css               # Tailwind layers + variáveis CSS de tema
│   └── main.tsx                # Ponto de entrada (ReactDOM.render)
│
├── public/
│   └── logosk.jpg              # Logo Sankhya
│
├── index.html                  # HTML raiz (id="root")
├── vite.config.ts              # Configuração do Vite (porta 8080, alias @/*)
├── tailwind.config.ts          # Tema Tailwind (cores Sankhya, dark mode)
├── tsconfig.json               # TypeScript config raiz
├── components.json             # Metadata shadcn/ui
└── package.json                # Dependências e scripts
```

---

## Páginas Existentes

| Arquivo | Rota | O que faz |
|---|---|---|
| `Index.tsx` | `/` | Home |
| `ApuracaoCBS.tsx` | `/apuracao-cbs` | Lista de apurações CBS com filtros (período, empresa, situação) |
| `ApuracaoDetalhe.tsx` | `/apuracao-cbs/:id` | Detalhe de uma apuração: contas, alertas, eventos |
| `ApuracaoDere.tsx` | `/apuracao-dere/*` | Telas DeRE: listagem, D-1001, D-1011, consolidação |
| `ConfigEmpresasPage.tsx` | `/configuracoes/empresas` | Habilitar módulos (CBS, IBS, IS, DeRE) por empresa/filial |
| `PlaceholderPage.tsx` | várias | Stub para IBS, IS, Financeiro, Tributação etc. |

---

## Rotas Definidas (`ERoutes`)

```typescript
// src/routes/interface/index.ts
HOME                  → /
APURACAO_CBS          → /apuracao-cbs
APURACAO_CBS_DETALHE  → /apuracao-cbs/:id
APURACAO_IBS          → /apuracao-ibs        (placeholder)
APURACAO_IS           → /apuracao-is         (placeholder)
APURACAO_DERE         → /apuracao-dere/*
GESTAO                → /gestao              (placeholder)
PROCESSOS             → /processos           (placeholder)
FINANCEIRO            → /financeiro          (placeholder)
TRIBUTACAO_INTEGRAL   → /tributacao/integral (placeholder)
TRIBUTACAO_PERSONALIZADA → /tributacao/personalizada (placeholder)
CONFIG_EMPRESAS       → /configuracoes/empresas
```

---

## Arquitetura de Layout

```
AppLayout
├── SidebarProvider
│   └── AppSidebar
│       ├── Logo + busca
│       └── Menu: Operações (CBS, IBS, IS, DeRE, Eventos)
│                Configurações (Empresas, Alíquotas)
├── Header
│   ├── Toggle sidebar | Logo | Título
│   └── Notificações | Ajuda | Perfil
└── Main
    ├── <page content>      ← children das rotas
    └── BIAChat             ← painel fixo do assistente BIA
```

---

## Componente BIA Chat

Painel lateral direito presente em todas as telas. Exibe mensagens do assistente:

- `alerta` → aviso com fundo amarelo
- `insight` → análise com fundo azul  
- `info` → informacional com fundo neutro

Localização: `src/components/BIAChat.tsx`

---

## Dados Mock

Toda a aplicação roda com dados simulados. Os mocks estão em:

**`src/data/mockData.ts`**
```typescript
apuracoes[]         // Lista de 5 apurações CBS (CNPJ, período, situação, valores)
contas[]            // Contas contábeis de uma apuração
outrasInfos[]       // Seções de informações adicionais
eventosApuracao[]   // Histórico de eventos de uma apuração
EMPRESAS_MOCK[]     // Empresas com filiais para ConfigEmpresas
```

Para trocar por API real: substituir os `useState` que consomem mock por queries do **React Query** apontando para o `ServiceStore`.

---

## Integração com Sankhya ERP

**`src/utils/getSnkApp.ts`**

Interface mínima para rodar dentro do contexto do ERP:

```typescript
interface SnkApp {
  message(msg: string): void
  alert(msg: string): void
  getDataFetcher(): DataFetcher   // Acesso ao ServiceBroker
}

// Em dev: retorna mock; em prod: retorna window.SnkApplication
```

---

## Sistema de Temas e Cores

Definidos em `src/index.css` como variáveis CSS (HSL):

| Token | Uso |
|---|---|
| `--primary` | Verde Sankhya `152 69% 31%` |
| `--secondary` | Cinza neutro |
| `--destructive` | Vermelho para erros |
| `--success` | Verde confirmação |
| `--warning` | Amarelo alertas |
| `--info` | Azul informações |
| `--sidebar-*` | Cores exclusivas do menu lateral |

Dark mode habilitado via classe `dark` no `<html>` (next-themes).

Personalização: editar `tailwind.config.ts` (cores estendidas) ou `src/index.css` (variáveis).

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
npm run dev      # Servidor de desenvolvimento (porta 8080)
npm run build    # Build de produção (dist/)
npm run preview  # Preview do build
npm run test     # Vitest (modo watch)
npm run lint     # ESLint
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
| D-1011 | Plano de contas geral |
| Apuração | Cálculo/levantamento tributário de um período |
| Raiz | CNPJ raiz da empresa (8 dígitos) |
| Filial | Estabelecimento vinculado ao CNPJ raiz |
| Regime Tributário | Enquadramento fiscal (Lucro Real, Presumido etc.) |
| BIA | Business Intelligence Assistant (assistente do painel direito) |
