# Especificação de API — Dashboard Termômetro (Análise Técnica)

> **Contexto:** O frontend possui o componente `DashboardTermometroScreen` com duas abas — **Global** e **Detalhamento** — atualmente alimentadas por dados mock. Este documento descreve as rotas que o backend precisa implementar para substituir esses mocks.

> **Base URL:** `http://localhost:3110` (prod: `https://dimensiona.genustecnologia.com.br/apinode`)
> **Autenticação:** `Authorization: Bearer <token>` (padrão já existente)

---

## Sumário das Rotas

| # | Método | Rota | Finalidade |
|---|--------|------|------------|
| 1 | `GET` | `/termometro/:hospitalId/global` | Dados da aba Global |
| 2 | `GET` | `/termometro/:hospitalId/detalhamento` | Dados da aba Detalhamento (cards + donuts de perfil) |
| 3 | `GET` | `/termometro/:hospitalId/serie-historica` | Série histórica (ocupação + níveis ao longo do tempo) |

---

## 1. Aba Global

### `GET /termometro/:hospitalId/global`

Retorna o panorama geral do hospital para o dia corrente: taxa de ocupação global, ranking de setores, distribuição por nível de cuidados e desvios de perfil.

#### Path Params


| Param | Tipo | Descrição |
|-------|------|-----------|
| `hospitalId` | `string (UUID)` | ID do hospital |

#### Response `200 OK`

```jsonc
{
  // ── Indicadores globais ──
  "taxaOcupacaoHospital": 72,          // % de leitos ocupados hoje
  "leitosAvaliadosHospital": 72,       // % de leitos que foram avaliados (SCP) hoje
  "data": "31/03/2026",                // data de referência (dd/MM/yyyy)
  "nivelPredominante": "Semi-Intensivos", // label do nível com maior % de pacientes
  "desviosPerfil": 8,                  // total de desvios (subutilização + risco)

  // ── Ranking de setores por taxa de ocupação ──
  // Compara hoje vs. ontem para cada setor (unidade de internação)
  "setoresOcupacao": [
    {
      "nome": "UTI Adulta",     // nome da unidade
      "hoje": 48,               // % ocupação hoje
      "ontem": 52               // % ocupação ontem
    },
    { "nome": "UTI Pediátrica",    "hoje": 35, "ontem": 40 },
    { "nome": "Pronto Atendimento","hoje": 55, "ontem": 50 },
    { "nome": "CME",               "hoje": 10, "ontem": 8  },
    { "nome": "Clínica Médica",    "hoje": 8,  "ontem": 10 }
  ],

  // ── Desvios de perfil por setor ──
  // Subutilização = paciente num nível de cuidado MENOR que o exigido pelo setor
  // Risco = paciente num nível de cuidado MAIOR que a capacidade do setor
  "setoresDesvio": [
    {
      "nome": "UTI Adulta",
      "subutilizacao": 8,   // nº de pacientes subutilizados
      "risco": 0             // nº de pacientes em risco
    },
    { "nome": "UTI Pediátrica",    "subutilizacao": 6, "risco": 0 },
    { "nome": "Pronto Atendimento","subutilizacao": 0, "risco": 0 },
    { "nome": "CME",               "subutilizacao": 0, "risco": 3 },
    { "nome": "Clínica Médica",    "subutilizacao": 0, "risco": 1 }
  ],

  // ── Distribuição de pacientes por nível de cuidados (SCP) ──
  "niveis": [
    {
      "nivel": "MINIMOS",                  // enum fixo (ver Enum abaixo)
      "label": "Mínimos",                  // label para exibição
      "totalPacientes": 18,                // nº absoluto de pacientes neste nível
      "percentualTotal": 25,               // % do total de pacientes avaliados
      "setores": [                          // ranking de setores dentro deste nível
        { "nome": "Clínica Médica",      "percentual": 18 },
        { "nome": "CME",                "percentual": 12 },
        { "nome": "Pronto Atendimento", "percentual": 10 },
        { "nome": "UTI Pediátrica",     "percentual": 6  },
        { "nome": "UTI Adulta",         "percentual": 4  }
      ]
    },
    {
      "nivel": "INTERMEDIARIOS",
      "label": "Intermed.",
      "totalPacientes": 12,
      "percentualTotal": 17,
      "setores": [/* mesma estrutura */]
    },
    {
      "nivel": "ALTA_DEPENDENCIA",
      "label": "Alta Dep.",
      "totalPacientes": 9,
      "percentualTotal": 12,
      "setores": [/* mesma estrutura */]
    },
    {
      "nivel": "SEMI_INTENSIVOS",
      "label": "Semi-Intens.",
      "totalPacientes": 22,
      "percentualTotal": 30,
      "setores": [/* mesma estrutura */]
    },
    {
      "nivel": "INTENSIVOS",
      "label": "Intensivos",
      "totalPacientes": 11,
      "percentualTotal": 15,
      "setores": [/* mesma estrutura */]
    }
  ]
}
```

#### Enum `NivelCuidado`

```
MINIMOS | INTERMEDIARIOS | ALTA_DEPENDENCIA | SEMI_INTENSIVOS | INTENSIVOS
```

Esses valores vêm diretamente da classificação SCP (ex: Fugulin). Se o hospital usar outro método SCP, manter o mesmo enum mapeando os scores correspondentes.

#### Lógica de cálculo esperada

| Campo | Como calcular |
|-------|---------------|
| `taxaOcupacaoHospital` | `(leitos ocupados / total de leitos ativos) × 100` — considerar sessões ativas no dia |
| `leitosAvaliadosHospital` | `(leitos com avaliação SCP hoje / total de leitos ocupados) × 100` |
| `data` | Data atual do servidor em formato `dd/MM/yyyy` |
| `nivelPredominante` | Label do `nivel` com maior `percentualTotal` |
| `desviosPerfil` | Soma de todos os `subutilizacao` + `risco` de `setoresDesvio` |
| `setoresOcupacao[].hoje` | Taxa de ocupação do setor hoje |
| `setoresOcupacao[].ontem` | Taxa de ocupação do setor no dia anterior |
| `setoresDesvio[].subutilizacao` | Nº de pacientes que estão em setor de nível mais alto que o exigido pela sua classificação SCP |
| `setoresDesvio[].risco` | Nº de pacientes que estão em setor de nível mais baixo que o exigido pela sua classificação SCP |
| `niveis[].totalPacientes` | COUNT de sessões ativas com aquele nível de classificação |
| `niveis[].percentualTotal` | `(totalPacientes do nível / total de pacientes avaliados) × 100` |
| `niveis[].setores[].percentual` | `(pacientes daquele nível naquele setor / total de pacientes daquele setor) × 100` |

---

## 2. Aba Detalhamento

### `GET /termometro/:hospitalId/detalhamento`

Retorna os dados consolidados de detalhamento (cards de resumo + dados de perfil para os donuts). Suporta filtro por setor e por período.

#### Path Params

| Param | Tipo | Descrição |
|-------|------|-----------|
| `hospitalId` | `string (UUID)` | ID do hospital |

#### Query Params

| Param | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `setorId` | `string (UUID)` | Não | todos | Filtrar por setor específico (unidade). Se omitido, considera todos os setores. |
| `dataInicial` | `string (yyyy-MM-dd)` | Não | hoje | Início do período |
| `dataFinal` | `string (yyyy-MM-dd)` | Não | hoje | Fim do período |

#### Response `200 OK`

```jsonc
{
  // ── Cards de resumo ──
  "taxaOcupacaoMedia": 18.2,            // % média de ocupação no período
  "leitosAvaliadosPerc": 42,            // % de leitos avaliados no período
  "totalLeitos": 15,                    // nº total de leitos (do setor ou hospital)
  "totalAvaliacoes": 42,                // nº total de avaliações SCP no período
  "metodoScp": "Fugulin",              // nome do método SCP do hospital/setor
  "nivelPredominante": "SEMI_INTENSIVOS",    // enum do nível predominante
  "nivelPredominanteLabel": "Semi-Intensivos", // label de exibição
  "desvios": 5,                         // total de desvios
  "riscos": 3,                          // desvios do tipo "risco"
  "subutilizacao": 2,                   // desvios do tipo "subutilização"

  // ── Donuts de perfil ──
  // Estado dos leitos (para donut de "Estados dos Leitos")
  "estadosLeitos": [
    { "name": "Leito Ocupado",       "value": 71, "color": "#005D97" },
    { "name": "Leito Não Avaliado",  "value": 29, "color": "#7DB9D9" },
    { "name": "Leito Inativo",       "value": 0,  "color": "#9CA3AF" },
    { "name": "Leito Vago",          "value": 0,  "color": "#D1D5DB" }
  ],

  // Distribuição de pacientes por nível de cuidado (para donut de "Níveis de Cuidado")
  "niveisCuidado": [
    { "name": "Cuidado Mínimo",        "value": 16, "color": "#BAE6FD" },
    { "name": "Cuidado Intermediário",  "value": 28, "color": "#38BDF8" },
    { "name": "Alta Dependência",       "value": 9,  "color": "#FCD34D" },
    { "name": "Semi-Intensivo",         "value": 22, "color": "#FB923C" },
    { "name": "Intensivo",             "value": 25, "color": "#EF4444" }
  ],

  // Lista de setores disponíveis para o filtro (dropdown)
  "setores": [
    { "id": null,       "nome": "Todos os setores" },
    { "id": "uuid-1",   "nome": "UTI Adulta" },
    { "id": "uuid-2",   "nome": "UTI Pediátrica" },
    { "id": "uuid-3",   "nome": "Pronto Atendimento" },
    { "id": "uuid-4",   "nome": "CME" },
    { "id": "uuid-5",   "nome": "Clínica Médica" }
  ]
}
```

#### Lógica de cálculo esperada

| Campo | Como calcular |
|-------|---------------|
| `taxaOcupacaoMedia` | Média aritmética da taxa de ocupação diária no período selecionado |
| `leitosAvaliadosPerc` | `(leitos com pelo menos 1 avaliação SCP / total de leitos ocupados) × 100` — média do período |
| `totalLeitos` | Contagem de leitos ativos no setor/hospital |
| `totalAvaliacoes` | COUNT total de avaliações SCP registradas no período |
| `metodoScp` | Nome do método SCP associado ao hospital ou ao setor filtrado |
| `estadosLeitos[].value` | Percentual de leitos naquele estado. Os 4 valores devem somar ~100% |
| `niveisCuidado[].value` | Percentual de pacientes avaliados naquele nível de cuidado. Os 5 valores devem somar ~100% |

> **Nota sobre as cores:** As cores (`color`) dos donuts podem ser fixas no frontend. Se preferir, o backend pode omitir o campo `color` e o frontend atribui as cores pelo nome/posição. Recomendo que o backend **não envie cores** e o frontend as defina.

---

## 3. Série Histórica — Adaptação do Serviço `occupation-analysis` existente

### Serviços existentes que já calculam dados de ocupação

O backend **já possui** dois serviços de análise de ocupação que calculam grande parte dos dados necessários:

#### 3.1 `GET /hospital-sectors/:hospitalId/occupation-analysis`

> **Arquivo de referência no frontend:** `src/lib/api.ts` — interface `OccupationAnalysisResponse`

Retorna dados **em tempo real** (snapshot):

```ts
interface SectorOccupation {
  sectorId: string;
  sectorName: string;
  sectorType: "internacao" | "nao_internacao";
  taxaOcupacao: number;              // Taxa mensal/histórica         ← JÁ EXISTE
  taxaOcupacaoDia: number;           // Taxa média do dia inteiro     ← JÁ EXISTE
  taxaOcupacaoHoje: number;          // Taxa de ocupação no momento   ← JÁ EXISTE
  ocupacaoMaximaAtendivel: number;   // Teto operacional              ← JÁ EXISTE (= taxaMaxima)
  totalLeitos: number;               //                                ← JÁ EXISTE
  leitosOcupados: number;            //                                ← JÁ EXISTE
  leitosVagos: number;               //                                ← JÁ EXISTE
  leitosInativos: number;            //                                ← JÁ EXISTE
  leitosAvaliados: number;           //                                ← JÁ EXISTE
  // ...
}
```

**O que já serve para o Termômetro:** `taxaOcupacaoHoje` → snapshot de ocupação; `ocupacaoMaximaAtendivel` → linha vermelha do gráfico.

#### 3.2 `GET /hospital-sectors/:hospitalId/occupation-dashboard`

> **Arquivo de referência no frontend:** `src/lib/api.ts` — interface `OccupationDashboardResponse`

Retorna **histórico de 4 meses** por setor:

```ts
interface OccupationHistoryMonth {
  month: string;      // "2025-09"
  monthLabel: string;  // "Setembro/2025"
  taxaOcupacao: number;
}

interface SectorOccupationDashboard {
  sectorId: string;
  sectorName: string;
  ocupacaoMaximaAtendivel: number;
  historico4Meses: OccupationHistoryMonth[];
}
```

**O que já serve:** Histórico mensal de `taxaOcupacao` por setor + `ocupacaoMaximaAtendivel`.

---

### O que FALTA e precisa ser adicionado

A Série Histórica do Termômetro precisa de **3 coisas que os serviços atuais não fornecem:**

| # | Lacuna | Detalhe |
|---|--------|---------|
| 1 | **Período flexível** | `occupation-dashboard` retorna apenas últimos 4 meses fixos. O Termômetro precisa de qualquer range `dataInicial → dataFinal`. |
| 2 | **Granularidade diária** | Quando o intervalo é < 31 dias, precisa de um ponto **por dia** (os serviços atuais só agrupam por mês). |
| 3 | **Distribuição de Níveis de Cuidado ao longo do tempo** | Nenhum serviço retorna a evolução temporal dos 5 níveis SCP (mínimos, intermediários, alta dependência, semi-intensivos, intensivos). |
| 4 | **Filtro por setor individual** | `occupation-analysis` retorna todos os setores de uma vez; o Termômetro precisa de dados filtrados por `setorId`. |

---

### Proposta: Estender o serviço existente OU criar rota dedicada

#### Opção A — Estender `occupation-analysis` (recomendado)

Adicionar um novo endpoint ao **mesmo controller** que já calcula ocupação:

### `GET /hospital-sectors/:hospitalId/occupation-analysis/serie-historica`

Reaproveita a lógica interna de cálculo de `taxaOcupacao` e `ocupacaoMaximaAtendivel` que já existe no service de `occupation-analysis`, mas adicionando:
- Iteração temporal (agrupar por dia ou por mês)
- Cálculo de distribuição SCP por período

#### Opção B — Rota separada no controller do Termômetro

### `GET /termometro/:hospitalId/serie-historica`

Cria um controller novo, mas **importa e reutiliza a função de cálculo** do service `OccupationAnalysisService` (ou equivalente) para não duplicar lógica.

---

### Especificação do endpoint (vale para ambas as opções)

#### Path Params

| Param | Tipo | Descrição |
|-------|------|-----------|
| `hospitalId` | `string (UUID)` | ID do hospital |

#### Query Params

| Param | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `setorId` | `string (UUID)` | Não | todos | Filtrar por setor |
| `dataInicial` | `string (yyyy-MM-dd)` | **Sim** | — | Início do período |
| `dataFinal` | `string (yyyy-MM-dd)` | **Sim** | — | Fim do período |
| `granularidade` | `"dia"` ou `"mes"` | Não | auto | Se omitido: `dia` se intervalo < 31 dias, `mes` caso contrário |

#### Response `200 OK`

```jsonc
{
  "granularidade": "mes",   // "dia" ou "mes" — indica como os pontos estão agrupados

  // ── Taxa de Ocupação ao longo do tempo ──
  "ocupacao": [
    {
      "label": "JAN",         // label para o eixo X (mês abreviado ou dd/MM)
      "data": "2026-01-01",   // data ISO para referência
      "taxa": 42.0,           // % taxa de ocupação do período
      "taxaMaxima": 68.5      // ← REAPROVEITAR o cálculo de `ocupacaoMaximaAtendivel` do service existente
    },
    { "label": "FEV", "data": "2026-02-01", "taxa": 47.0, "taxaMaxima": 68.5 },
    { "label": "MAR", "data": "2026-03-01", "taxa": 50.0, "taxaMaxima": 68.5 }
    // ... um ponto por mês ou por dia conforme granularidade
  ],

  // ── Distribuição de Níveis de Cuidado ao longo do tempo ── (NOVO)
  // Valores em % de pacientes avaliados naquele nível
  "niveis": [
    {
      "label": "JAN",
      "data": "2026-01-01",
      "minimos": 55,
      "intermediarios": 20,
      "altaDependencia": 8,
      "semiIntensivos": 10,
      "intensivos": 10
    },
    {
      "label": "FEV",
      "data": "2026-02-01",
      "minimos": 52,
      "intermediarios": 22,
      "altaDependencia": 9,
      "semiIntensivos": 12,
      "intensivos": 8
    }
    // ... um ponto por mês ou por dia
  ],

  // ── Snapshot "Hoje" (retornado quando dataInicial == dataFinal == hoje) ──
  // O frontend alterna para este modo quando o toggle está em "Hoje"
  "snapshotHoje": {            // null se não for consulta de "hoje"
    "taxaOcupacao": 53,        // ← REAPROVEITAR `taxaOcupacaoHoje` do service existente
    "taxaMaxima": 68,          // ← REAPROVEITAR `ocupacaoMaximaAtendivel` do service existente
    "niveis": [
      { "name": "Mínimos",          "value": 28 },
      { "name": "Intermediários",   "value": 16 },
      { "name": "Alta Dependência", "value": 9  },
      { "name": "Semi-Intensivo",   "value": 22 },
      { "name": "Intensivos",       "value": 25 }
    ]
  }
}
```

---

### Mapeamento: campos existentes → campos da Série Histórica

Este mapeamento mostra **exatamente** o que reaproveitar do service `occupation-analysis` existente:

| Campo no response da Série Histórica | Origem no service existente | Adaptação necessária |
|---|---|---|
| `ocupacao[].taxa` | **`SectorOccupation.taxaOcupacao`** (mensal) ou **`taxaOcupacaoDia`** (diário) | Generalizar para qualquer período: `AVG(taxa_ocupacao_diaria)` agrupado por dia ou mês no range solicitado |
| `ocupacao[].taxaMaxima` | **`SectorOccupation.ocupacaoMaximaAtendivel`** | Já calculado. Para série temporal, usar o valor vigente em cada período (se o quadro mudou, o teto muda). Se estático, replicar o mesmo valor em todos os pontos. |
| `snapshotHoje.taxaOcupacao` | **`SectorOccupation.taxaOcupacaoHoje`** | Nenhuma — usar diretamente |
| `snapshotHoje.taxaMaxima` | **`SectorOccupation.ocupacaoMaximaAtendivel`** | Nenhuma — usar diretamente |
| `niveis[].minimos` ... `intensivos` | **NÃO EXISTE** — precisa ser calculado | Ver lógica abaixo |
| `snapshotHoje.niveis[].value` | **NÃO EXISTE** — precisa ser calculado | Idem |

---

### Lógica de cálculo — o que CRIAR de novo

#### A) Taxa de ocupação temporal (reutiliza lógica existente)

```
Para cada ponto temporal (dia ou mês):
  1. Buscar sessões ativas no período (mesma query que o service já faz)
  2. Se setorId informado, filtrar por unidade
  3. taxaOcupacao = (leitos_ocupados / total_leitos_ativos) × 100
  4. taxaMaxima = ocupacaoMaximaAtendivel do setor/hospital
     → MESMA função que já calcula no OccupationAnalysisService
```

**Pseudo-código de adaptação no service:**
```typescript
// No OccupationAnalysisService existente, extrair a lógica de cálculo de taxa para uma função reutilizável:
async calcularTaxaOcupacaoPeriodo(
  hospitalId: string,
  setorId?: string,
  data: Date  // dia específico
): Promise<{ taxa: number; taxaMaxima: number }>

// E na nova rota, iterar:
for (const dia of diasNoPeriodo) {
  const resultado = await this.calcularTaxaOcupacaoPeriodo(hospitalId, setorId, dia);
  ocupacao.push({ label, data: dia, taxa: resultado.taxa, taxaMaxima: resultado.taxaMaxima });
}
// Se granularidade === "mes", agrupar por mês e tirar média
```

#### B) Distribuição de níveis de cuidado temporal (NOVA lógica)

```
Para cada ponto temporal (dia ou mês):
  1. Buscar todas as avaliações SCP no período
     → Tabela de avaliações/sessões com o campo de classificação SCP
  2. Contar pacientes por nível:
     - minimos        = COUNT(classificacao = 'MINIMOS')
     - intermediarios = COUNT(classificacao = 'INTERMEDIARIOS')
     - altaDependencia = COUNT(classificacao = 'ALTA_DEPENDENCIA')
     - semiIntensivos = COUNT(classificacao = 'SEMI_INTENSIVOS')
     - intensivos     = COUNT(classificacao = 'INTENSIVOS')
  3. totalAvaliados = SUM de todos os níveis
  4. Converter para percentual:
     - minimos_pct = (minimos / totalAvaliados) × 100
     - ... (idem para os demais)
```

**Query SQL de referência:**
```sql
-- Distribuição diária de níveis SCP
SELECT
  DATE(a.data_avaliacao) AS dia,
  a.classificacao_scp,
  COUNT(*) AS total
FROM avaliacoes a
  JOIN sessoes s ON s.id = a.sessao_id
  JOIN leitos l ON l.id = s.leito_id
  JOIN unidades u ON u.id = l.unidade_id
WHERE u.hospital_id = :hospitalId
  AND (:setorId IS NULL OR u.id = :setorId)
  AND a.data_avaliacao BETWEEN :dataInicial AND :dataFinal
GROUP BY dia, a.classificacao_scp
ORDER BY dia;
```

```sql
-- Agrupar por mês (quando granularidade = 'mes')
SELECT
  DATE_TRUNC('month', a.data_avaliacao) AS mes,
  a.classificacao_scp,
  COUNT(*) AS total
FROM avaliacoes a
  JOIN sessoes s ON s.id = a.sessao_id
  JOIN leitos l ON l.id = s.leito_id
  JOIN unidades u ON u.id = l.unidade_id
WHERE u.hospital_id = :hospitalId
  AND (:setorId IS NULL OR u.id = :setorId)
  AND a.data_avaliacao BETWEEN :dataInicial AND :dataFinal
GROUP BY mes, a.classificacao_scp
ORDER BY mes;
```

#### C) Snapshot "Hoje" (reutiliza + complementa)

```
taxaOcupacao → chamar o service existente e pegar taxaOcupacaoHoje
  Se setorId: filtrar pelo setor
  Se todos: somar todos os setores

taxaMaxima → pegar ocupacaoMaximaAtendivel do mesmo service

niveis → executar a mesma query de distribuição SCP do item B,
         mas filtrado para DATE(data_avaliacao) = CURRENT_DATE
```

---

### Resumo da implementação para o backend

```
1. NO SERVICE EXISTENTE (OccupationAnalysisService ou equivalente):
   ├── Extrair calcularTaxaOcupacao() como método público reutilizável
   ├── Extrair calcularOcupacaoMaximaAtendivel() como método público
   └── Ambos já existem como lógica interna, só precisam ser expostos

2. NOVO: Criar método calcularDistribuicaoNiveisSCP(hospitalId, setorId?, dataInicial, dataFinal)
   ├── Query agrupada por dia ou mês + classificação SCP
   ├── Retorna array de pontos temporais com os 5 níveis em %
   └── Reutilizar tabelas/joins que o service já conhece

3. NOVO: Criar endpoint GET /hospital-sectors/:hospitalId/occupation-analysis/serie-historica
   ├── Chamar calcularTaxaOcupacao() iterativamente OU em query agrupada
   ├── Chamar calcularDistribuicaoNiveisSCP()
   ├── Se dataInicial == dataFinal == hoje → retornar snapshotHoje
   └── Senão → retornar arrays ocupacao[] e niveis[]
```

---

## Resumo dos Dados de Origem

Todos os dados necessários para estas rotas derivam de entidades que **já existem** no sistema:

| Dado necessário | Origem no sistema existente |
|---|---|
| Lista de setores (unidades de internação) | Tabela `unidades` (`GET /unidades?hospitalId=`) |
| Leitos e seus estados (ocupado, vago, inativo) | Tabela `leitos` (`GET /leitos?unidadeId=`) |
| Sessões ativas (paciente internado) | Tabela `sessoes` / `avaliacoes` (`GET /avaliacoes/sessoes-ativas`) |
| Classificação SCP do paciente (nível de cuidado) | Campo na avaliação/sessão — resultado do instrumento SCP aplicado |
| Taxa de ocupação por dia | Rota existente `GET /avaliacoes/taxa-ocupacao-dia` |
| Taxa de ocupação do hospital | Rota existente `GET /leitos/taxa-ocupacao-status?hospitalId=` |
| Método SCP do hospital/unidade | Tabela `scp_metodos` associada à unidade |
| Taxa máxima atendível | Calculada a partir do dimensionamento projetado (quadro de pessoal vs. demanda) |
| Dados de ontem (ocupação) | Consulta à mesma tabela de sessões filtrando por `data = hoje - 1` |

---

## Definição de "Desvio de Perfil"

Um **desvio de perfil** ocorre quando o nível de cuidado exigido pelo paciente (classificação SCP) não é compatível com o perfil do setor onde ele está internado.

- **Subutilização:** Paciente com classificação SCP de baixa complexidade (ex: Mínimos) internado em setor de alta complexidade (ex: UTI). O setor está sendo "desperdiçado" para um paciente que não precisa daquele nível de recurso.

- **Risco:** Paciente com classificação SCP de alta complexidade (ex: Intensivos) internado em setor de baixa complexidade (ex: Clínica Médica). O paciente está em risco por não receber o nível de cuidado necessário.

Para calcular, é necessário que cada unidade/setor tenha um **perfil de nível de cuidado esperado** (ex: UTI = INTENSIVOS, Clínica Médica = MINIMOS). Comparar com a classificação SCP de cada paciente internado.

---

## Notas para o Backend

1. **Performance:** A aba Global é carregada sempre que o usuário abre o Termômetro. Considerar cache de curta duração (1-5 min) para os dados do dia corrente.

2. **Granularidade automática:** Se o frontend não enviar `granularidade`, usar a regra: intervalo < 31 dias → `dia`, senão → `mes`.

3. **Formato de data:** O frontend espera `label` como string legível (`"JAN"`, `"01/03"`, etc.) além do campo `data` ISO para referência.

4. **Setores vazios:** Se um setor não tem leitos ocupados, ainda deve aparecer nos rankings com valor 0.

5. **Cores dos donuts:** Preferencialmente **não enviar cores** do backend. O frontend mapeia as cores pelos nomes. Se for enviado, o frontend usa como override.

6. **Hospital sem avaliações:** Retornar todos os campos com valores zerados, arrays vazios onde aplicável. Não retornar 404.
