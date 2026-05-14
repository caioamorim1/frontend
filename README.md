# Dimensiona — Frontend

Aplicação web para gestão de dimensionamento de pessoal em hospitais, construída com React, TypeScript e Vite.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Execução](#instalação-e-execução)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Autenticação e Papéis](#autenticação-e-papéis)
- [Módulos e Funcionalidades](#módulos-e-funcionalidades)
- [Rotas](#rotas)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Deploy com Docker](#deploy-com-docker)

---

## Visão Geral

O **Dimensiona** é uma plataforma de apoio à decisão clínico-administrativa que permite:

- Gerenciar a estrutura hospitalar (redes, grupos, regiões, hospitais, setores, unidades e leitos)
- Coletar e avaliar dados de ocupação e carga de trabalho por meio do método SCP
- Analisar indicadores de baseline, Pareto e desempenho financeiro
- Administrar usuários, cargos e sítios funcionais
- Aplicar questionários qualitativos

---

## Tecnologias

| Camada | Biblioteca / Ferramenta |
|---|---|
| Framework UI | React 18 |
| Linguagem | TypeScript 5 |
| Build | Vite 6 |
| Roteamento | React Router DOM 7 |
| Requisições HTTP | Axios |
| Estilização | Tailwind CSS 3 |
| Componentes base | Radix UI |
| Ícones | Lucide React, React Icons |
| Gráficos | Recharts |
| Autenticação | JWT (jwt-decode) |

---

## Pré-requisitos

- **Node.js** ≥ 20
- **npm** ≥ 10

---

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento (porta 8080)
npm run dev

# Build de produção
npm run build

# Preview do build (porta 80)
npm run preview

# Lint
npm run lint
```

---

## Estrutura do Projeto

```
src/
├── App.tsx                  # Definição de todas as rotas
├── main.tsx                 # Entry point — providers globais
├── index.css
│
├── assets/                  # Imagens e recursos estáticos
│
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx       # Guard de rota autenticada
│   ├── shared/                      # Componentes reutilizáveis
│   │   ├── AnaliseFinanceira.tsx
│   │   ├── CurrencyInput.tsx
│   │   ├── HospitalHeader.tsx
│   │   ├── MaskedInputs.tsx
│   │   ├── SessionExpirationWarning.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TaxaOcupacaoDia.tsx
│   │   ├── UnidadeCard.tsx
│   │   └── UnifiedLayout.tsx        # Layout padrão com sidebar
│   └── ui/                          # Primitivos de UI (shadcn/Radix)
│
├── contexts/
│   ├── AuthContext.tsx      # Estado de autenticação e JWT
│   ├── AlertContext.tsx     # Sistema de alertas globais
│   └── ModalContext.tsx     # Controle de modais globais
│
├── features/
│   ├── admin-global/        # Módulo de administração global
│   ├── admin-hospital/      # Módulo de administração por hospital
│   ├── colab/               # Módulo do colaborador / avaliador
│   └── qualitativo/         # Módulo de questionários qualitativos
│
├── hooks/
│   ├── use-toast.ts
│   └── useOccupationAnalysis.ts
│
├── lib/
│   ├── api.ts               # Cliente Axios + endpoints
│   ├── apiLogger.ts         # Interceptor de log de requisições
│   ├── dataUtils.ts         # Utilitários de dados
│   ├── functionSectores.ts  # Lógica de setores
│   ├── generateMultiColorScale.ts
│   ├── permissions.ts       # Definição de permissões por papel
│   ├── processRedeSnapshots.ts
│   └── utils.ts
│
├── mocks/                   # Dados mockados para desenvolvimento
└── pages/                   # Páginas públicas (login, recuperação de senha)
```

---

## Autenticação e Papéis

A autenticação usa JWT armazenado em `localStorage`. O token é decodificado via `jwt-decode` e exposto pelo `AuthContext`. O sistema monitora automaticamente a expiração e exibe um aviso antes de efetuar logout.

### Papéis disponíveis (`tipo`)

| Papel | Descrição |
|---|---|
| `ADMIN` | Administrador global — acesso total |
| `GESTOR_ESTRATEGICO_REDE` | Gestor estratégico de rede hospitalar |
| `GESTOR_ESTRATEGICO_HOSPITAL` | Gestor estratégico do hospital |
| `GESTOR_TATICO_TEC_ADM` | Gestor tático técnico-administrativo |
| `GESTOR_TATICO_TECNICO` | Gestor tático técnico |
| `GESTOR_TATICO_ADM` | Gestor tático administrativo |
| `AVALIADOR` | Avaliador / colaborador de coleta |

As permissões por página estão centralizadas em [`src/lib/permissions.ts`](src/lib/permissions.ts).

---

## Módulos e Funcionalidades

### Admin Global (`/admin`)

Acessível apenas para `ADMIN` e `GESTOR_ESTRATEGICO_REDE`.

| Página | Rota | Descrição |
|---|---|---|
| Dashboard Global | `/admin/redes/:redeId/dashboard` | Visão geral da rede |
| Hospitais | `/admin/hospitais` | CRUD de hospitais |
| Redes | `/admin/redes` | CRUD de redes hospitalares |
| Grupos | `/admin/grupos` | CRUD de grupos |
| Regiões | `/admin/regioes` | CRUD de regiões |
| Métodos SCP | `/admin/scp-metodos` | Configuração de métodos de avaliação |
| Questionários | `/admin/questionarios` | Gestão de questionários qualitativos |
| Admins | `/admin/admins` | Gestão de administradores |
| Ajustes | `/admin/ajustes` | Configurações globais |

### Admin Hospital (`/hospital/:hospitalId`)

Gestão operacional de um hospital específico.

| Página | Rota | Descrição |
|---|---|---|
| Home | `/hospital/:id/home` | Página inicial do hospital |
| Dashboard | `/hospital/:id/dashboard` | Indicadores e analytics |
| Unidades e Leitos | `/hospital/:id/unidades-leitos` | Visão de unidades |
| Setores | `/hospital/:id/setores` | Visualização em card dos setores |
| Gerir Setores | `/hospital/:id/gerir-setores` | Gestão completa de setores |
| Parâmetros | `/hospital/:id/gerir-setores/:setorId/parametros` | Parâmetros do setor |
| Usuários | `/hospital/:id/usuarios` | Gestão de usuários do hospital |
| Cargos | `/hospital/:id/cargos` | Gestão de cargos |
| Pareto | `/hospital/:id/pareto` | Análise de Pareto |
| Baseline | `/hospital/:id/baseline` | Análise de baseline |
| Histórico de Coletas | `/hospital/:id/coletas` | Histórico de coletas de dados |

### Colaborador / Avaliador (`/meu-hospital`)

Módulo para colaboradores realizarem avaliações e consultas.

| Página | Rota | Descrição |
|---|---|---|
| Minhas Unidades | `/meu-hospital` | Unidades do colaborador |
| Visão de Leitos | `/unidade/:unidadeId/leitos` | Situação dos leitos |
| Avaliação SCP | `/unidade/:unidadeId/sessao/avaliar` | Aplicação do método SCP |
| Coletas | `/coletas` | Registro e histórico de coletas |

### Qualitativo

Módulo de questionários qualitativos acessível pelo admin global em `/admin/questionarios`.

---

## Rotas

O roteamento é definido em [`src/App.tsx`](src/App.tsx). O redirecionamento inicial (`/`) depende do papel do utilizador logado:

- `ADMIN` → `/admin/hospitais`
- `GESTOR_ESTRATEGICO_REDE` → `/admin/redes/:redeId/dashboard`
- Demais papéis → `/hospital/:hospitalId/home`

Rotas não autenticadas são protegidas pelo componente `ProtectedRoute`. O guarda `AdminGuard` restringe o acesso ao prefixo `/admin`.

---

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3110` | URL base da API backend |

Crie um arquivo `.env.local` na raiz para sobrescrever durante o desenvolvimento:

```env
VITE_API_URL=http://localhost:3110
```

> **Nota:** A URL da API em produção (`https://dimensiona.genustecnologia.com.br/apinode`) está configurada diretamente em [`src/lib/api.ts`](src/lib/api.ts).

---

## Deploy com Docker

O `Dockerfile` usa uma build multi-stage baseada em `node:20-slim`. O artefato é servido via `vite preview` na porta **80**.

```bash
# Build da imagem
docker build --build-arg VITE_API_URL=https://sua-api.com/api -t dimensiona-frontend .

# Executar o container
docker run -p 80:80 dimensiona-frontend
```

O container inclui um `HEALTHCHECK` que verifica `http://localhost` a cada 30 segundos.
