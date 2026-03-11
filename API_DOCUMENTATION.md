# Documentação da API — Dimensiona Frontend

> **Base URL padrão:** `http://localhost:3110`  
> **Produção:** `https://dimensiona.genustecnologia.com.br/apinode`  
> Configurável via constante `API_BASE_URL` em `src/lib/api.ts`.

Todas as rotas privadas exigem o header:

```
Authorization: Bearer <authToken>
```

O token é lido automaticamente do `localStorage` pelo interceptor do Axios. Em caso de `401` ou `403`, o token é removido e o usuário é redirecionado para `/login`.

---

## Sumário

1. [Autenticação / Reset de Senha](#1-autenticação--reset-de-senha)
2. [Hospitais](#2-hospitais)
3. [Redes, Grupos e Regiões](#3-redes-grupos-e-regiões)
4. [Unidades de Internação](#4-unidades-de-internação)
5. [Unidades de Não-Internação](#5-unidades-de-não-internação)
6. [Unidades Neutras](#6-unidades-neutras)
7. [Leitos](#7-leitos)
8. [Cargos](#8-cargos)
9. [Usuários (Colaboradores)](#9-usuários-colaboradores)
10. [Admins Globais](#10-admins-globais)
11. [Métodos SCP](#11-métodos-scp)
12. [Avaliações / Sessões de Leito](#12-avaliações--sessões-de-leito)
13. [Parâmetros de Dimensionamento](#13-parâmetros-de-dimensionamento)
14. [Sítios Funcionais](#14-sítios-funcionais)
15. [Dimensionamento (Análise)](#15-dimensionamento-análise)
16. [Projetado Final](#16-projetado-final)
17. [Taxa de Ocupação](#17-taxa-de-ocupação)
18. [Taxa de Ocupação Customizada](#18-taxa-de-ocupação-customizada)
19. [Controle de Período](#19-controle-de-período)
20. [Baseline](#20-baseline)
21. [Snapshots](#21-snapshots)
22. [Agregação de Setores Hospitalares](#22-agregação-de-setores-hospitalares)
23. [Dashboard Global](#23-dashboard-global)
24. [Qualitativo — Categorias](#24-qualitativo--categorias)
25. [Qualitativo — Questionários](#25-qualitativo--questionários)
26. [Qualitativo — Avaliações](#26-qualitativo--avaliações)
27. [Qualitativo — Coletas](#27-qualitativo--coletas)
28. [Exportação de PDF](#28-exportação-de-pdf)
29. [Utilitários](#29-utilitários)

---

## 1. Autenticação / Reset de Senha

> Rotas **públicas** — usam instância sem token (`publicApi`).

### Solicitar reset de senha
```
POST /password-reset/request
Body: { email: string }
Response: { success: boolean, message: string }
```
Função: `requestPasswordReset(email)`

---

### Verificar token de reset
```
GET /password-reset/verify/:token
Response: { valid: boolean, email?: string }
```
Função: `verifyResetToken(token)`

---

### Redefinir senha
```
POST /password-reset/reset
Body: { token: string, newPassword: string }
Response: { success: boolean, message: string }
```
Função: `resetPassword(token, newPassword)`

---

## 2. Hospitais

### Listar todos os hospitais
```
GET /hospitais
Response: Hospital[]
```
Função: `getHospitais()`

---

### Buscar hospital por ID
```
GET /hospitais/:id
Response: Hospital
```
Função: `getHospitalById(id)`

---

### Última atualização de cargo do hospital
```
GET /hospitais/:hospitalId/ultima-atualizacao-cargo
Response: { ultimaAtualizacao: string | null }
```
Função: `getUltimaAtualizacaoCargoHospital(hospitalId)`

---

### Criar hospital
```
POST /hospitais
Body: CreateHospitalDTO | FormData (quando envia foto)
Response: Hospital
```
Função: `createHospital(data)`

> Quando `data` é `FormData`, o `Content-Type` é `multipart/form-data`.

---

### Atualizar hospital
```
PUT /hospitais/:hospitalId
Body: UpdateHospitalDTO | FormData
Response: Hospital
```
Função: `updateHospital(hospitalId, data)`

---

### Deletar hospital
```
DELETE /hospitais/:hospitalId
```
Função: `deleteHospital(hospitalId)`

---

### Buscar setores do hospital (Pareto / Baseline)
```
GET /hospital-sectors/:hospitalId
Response: HospitalSectorsData
```
Função: `getHospitalSectors(hospitalId)`

```typescript
interface HospitalSectorsData {
  id: string;
  internation: InternationSector[];   // Unidades de internação
  assistance: AssistanceSector[];      // Unidades de não-internação
  neutral: NeutralSector[];            // Unidades neutras
}
```

---

### Estatísticas do hospital
```
GET /estatisticas/hospital/:hospitalId/json
Response: HospitalStats
```
Função: `getHospitalStats(hospitalId)`

```typescript
interface HospitalStats {
  totalLeitos: number;
  taxaOcupacaoMedia: number;
  unidades: Array<{ distribuicao, ocupacao, totalLeitos, unidade }>;
}
```

---

## 3. Redes, Grupos e Regiões

### Redes
| Método | Rota | Função |
|--------|------|--------|
| `GET` | `/redes` | `getRedes()` |
| `POST` | `/redes` | `createRede(nome)` |
| `PUT` | `/redes/:redeId` | `updateRede(redeId, nome)` |
| `DELETE` | `/redes/:redeId` | `deleteRede(redeId)` |

---

### Grupos
| Método | Rota | Função |
|--------|------|--------|
| `GET` | `/grupos` | `getGrupos()` |
| `POST` | `/grupos` | `createGrupo(data)` |
| `PUT` | `/grupos/:grupoId` | `updateGrupo(grupoId, data)` |
| `DELETE` | `/grupos/:grupoId` | `deleteGrupo(grupoId)` |

---

### Regiões
| Método | Rota | Função |
|--------|------|--------|
| `GET` | `/regioes` | `getRegioes()` |
| `POST` | `/regioes` | `createRegiao(data)` |
| `PUT` | `/regioes/:regiaoId` | `updateRegiao(regiaoId, data)` |
| `DELETE` | `/regioes/:regiaoId` | `deleteRegiao(regiaoId)` |

---

## 4. Unidades de Internação

### Listar por hospital
```
GET /unidades?hospitalId=:hospitalId
Response: UnidadeInternacao[]
```
Função: `getUnidadesInternacao(hospitalId)`

---

### Buscar por ID
```
GET /unidades/:unidadeId
Response: UnidadeInternacao
```
Função: `getUnidadeById(unidadeId)` *(tenta internação primeiro, depois não-internação)*

---

### Criar
```
POST /unidades
Body: CreateUnidadeInternacaoDTO
Response: UnidadeInternacao
```
Função: `createUnidadeInternacao(data)`

```typescript
interface CreateUnidadeInternacaoDTO {
  hospitalId: string;
  nome: string;
  numeroLeitos: number;
  scpMetodoId?: string;
  horas_extra_reais?: string;
  horas_extra_projetadas?: string;
  cargos_unidade: { cargoId: string; quantidade_funcionarios: number }[];
}
```

---

### Atualizar
```
PUT /unidades/:setorId
Body: UpdateUnidadeInternacaoDTO
```
Função: `updateUnidadeInternacao(setorId, data)`

---

### Deletar
```
DELETE /unidades/:setorId
```
Função: `deleteUnidadeInternacao(setorId)`

---

## 5. Unidades de Não-Internação

### Listar por hospital
```
GET /unidades-nao-internacao/hospital/:hospitalId
Response: UnidadeNaoInternacao[]
```
Função: `getUnidadesNaoInternacao(hospitalId)`

---

### Criar
```
POST /unidades-nao-internacao
Body: CreateUnidadeNaoInternacaoDTO
```
Função: `createUnidadeNaoInternacao(data)`

---

### Atualizar
```
PUT /unidades-nao-internacao/:setorId
```
Função: `updateUnidadeNaoInternacao(setorId, data)`

---

### Deletar
```
DELETE /unidades-nao-internacao/:setorId
```
Função: `deleteUnidadeNaoInternacao(setorId)`

---

## 6. Unidades Neutras

### Listar por hospital
```
GET /unidades-neutras/hospital/:hospitalId
Response: UnidadeNeutra[]
```
Função: `getUnidadesNeutras(hospitalId)`

---

### Criar
```
POST /unidades-neutras
Body: CreateUnidadeNeutraDTO { hospitalId, nome, custoTotal, status?, descricao? }
```
Função: `createUnidadeNeutra(data)`

---

### Atualizar
```
PUT /unidades-neutras/:setorId
```
Função: `updateUnidadeNeutra(setorId, data)`

---

### Deletar
```
DELETE /unidades-neutras/:setorId
```
Função: `deleteUnidadeNeutra(setorId)`

---

## 7. Leitos

### Listar por unidade
```
GET /leitos?unidadeId=:unidadeId
Response: Leito[]
```
Função: `getLeitosByUnidade(unidadeId)`

---

### Criar leito
```
POST /leitos
Body: CreateLeitoDTO { unidadeId: string, numero: string }
Response: Leito
```
Função: `createLeito(data)`

---

### Atualizar status do leito
```
PATCH /leitos/:leitoId/status
Body: UpdateLeitoDTO { status?, justificativa?, numero? }
Response: Leito
```
Função: `updateLeito(leitoId, data)`

**Status possíveis:** `ATIVO` | `PENDENTE` | `VAGO` | `INATIVO`

---

### Deletar leito
```
DELETE /leitos/:leitoId
```
Função: `deleteLeito(leitoId)`

---

### Dar alta (liberar leito)
```
POST /leitos/:leitoId/alta
Body: { motivo?: string }
```
Função: `darAltaLeito(leitoId, payload?)`

---

### Taxa de ocupação por status (hospital)
```
GET /leitos/taxa-ocupacao-status?hospitalId=:hospitalId
Response: TaxaOcupacaoHospital
```
Função: `getTaxaOcupacaoHospital(hospitalId)`

---

### Taxa de ocupação agregada
```
GET /leitos/taxa-ocupacao-agregada?aggregationType=:tipo&entityId=:id
Response: TaxaOcupacaoHospital[]
```
Função: `getTaxaOcupacaoAgregada(aggregationType, entityId?)`

`aggregationType`: `'hospital'` | `'grupo'` | `'regiao'` | `'rede'`

---

## 8. Cargos

### Listar por hospital
```
GET /hospitais/:hospitalId/cargos
Response: Cargo[]
```
Função: `getCargosByHospitalId(hospitalId)`

---

### Criar cargo
```
POST /hospitais/:hospitalId/cargos
Body: CreateCargoDTO { hospitalId, nome, salario?, carga_horaria?, descricao?, adicionais_tributos? }
Response: Cargo
```
Função: `createCargo(data)`

---

### Atualizar cargo
```
PATCH /hospitais/:hospitalId/cargos/:cargoId
Body: UpdateCargoDTO
Response: Cargo
```
Função: `updateCargo(hospitalId, cargoId, data)`

---

### Deletar cargo
```
DELETE /hospitais/:hospitalId/cargos/:cargoId
```
Função: `deleteCargo(hospitalId, cargoId)`

---

## 9. Usuários (Colaboradores)

### Listar por hospital
```
GET /colaboradores?hospitalId=:hospitalId
Response: Usuario[]
```
Função: `getUsuariosByHospitalId(hospitalId)`

---

### Criar usuário
```
POST /colaboradores
Body: CreateUsuarioDTO
Response: Usuario
```
Função: `createUsuario(data)`

```typescript
interface CreateUsuarioDTO {
  hospitalId: string;
  nome: string;
  email: string;
  cpf?: string;
  tipo?: 'ADMIN' | 'GESTOR_ESTRATEGICO' | 'GESTOR_TATICO' | 'AVALIADOR' | 'CONSULTOR' | 'COMUM';
  senha?: string;
  coren?: string;
}
```

---

### Atualizar usuário
```
PATCH /colaboradores/:usuarioId
Body: UpdateUsuarioDTO
Response: Usuario
```
Função: `updateUsuario(usuarioId, data)`

---

### Deletar usuário
```
DELETE /colaboradores/:usuarioId
```
Função: `deleteUsuario(usuarioId)`

---

### Alterar senha
```
PATCH /colaboradores/:colaboradorId/senha
Body: { senha: string }
```
Função: `changePassword(colaboradorId, novaSenha)`

---

## 10. Admins Globais

| Método | Rota | Função |
|--------|------|--------|
| `GET` | `/colaboradores/admin` | `getAdmins()` |
| `POST` | `/colaboradores/admin` | `createAdmin(data)` |
| `DELETE` | `/colaboradores/admin/:id` | `deleteAdmin(id)` |

---

## 11. Métodos SCP

| Método | Rota | Função |
|--------|------|--------|
| `GET` | `/scp-metodos` | `getScpMetodos()` |
| `POST` | `/scp-metodos` | `createScpMetodo(data)` |
| `PUT` | `/scp-metodos/:id` | `updateScpMetodo(id, data)` |
| `DELETE` | `/scp-metodos/:id` | `deleteScpMetodo(id)` |

---

## 12. Avaliações / Sessões de Leito

### Sessões ativas por unidade
```
GET /avaliacoes/sessoes-ativas?unidadeId=:unidadeId
Response: SessaoAtiva[]
```
Função: `getSessoesAtivasByUnidadeId(unidadeId)`

---

### Admitir paciente (abrir sessão)
```
POST /avaliacoes/sessao
Body: {
  leito_id, unidade_id, prontuario,
  colaborador_id, scp, itens: {}
}
Response: SessaoAtiva
```
Função: `admitirPaciente(data)`

---

### Buscar schema do SCP
```
GET /avaliacoes/schema?scp=:scpKey
Response: ScpSchema
```
Função: `getScpSchema(scpKey)`

---

### Criar sessão
```
POST /avaliacoes/sessao
Body: UpdateSessaoDTO
Response: SessaoAtiva
```
Função: `createSessao(data)`

---

### Atualizar sessão
```
PUT /avaliacoes/sessao/:sessaoId
Body: Partial<UpdateSessaoDTO>
Response: SessaoAtiva
```
Função: `updateSessao(sessaoId, data)`

---

### Liberar sessão (alta)
```
POST /avaliacoes/sessao/:sessaoId/liberar
```
Função: `liberarSessao(sessaoId)`

---

### Último prontuário de um leito
```
GET /avaliacoes/leito/:leitoId/ultimo-prontuario
Response: { prontuario: string | null, dataAplicacao: string | null, avaliacaoId: string | null }
```
Função: `getUltimoProntuarioLeito(leitoId)`

---

### Taxa de ocupação do dia por avaliações ativas

#### Por unidade
```
GET /avaliacoes/taxa-ocupacao-dia?unidadeId=:unidadeId
Response: TaxaOcupacaoUnidade
```
Função: `getTaxaOcupacaoUnidade(unidadeId)`

#### Geral (todas as unidades)
```
GET /avaliacoes/taxa-ocupacao-dia
Response: TaxaOcupacaoGeral
```
Função: `getTaxaOcupacaoGeral()`

---

## 13. Parâmetros de Dimensionamento

### Internação

| Método | Rota | Função |
|--------|------|--------|
| `GET` | `/parametros/unidade/:unidadeId` | `getParametros(unidadeId)` |
| `POST` | `/parametros/unidade/:unidadeId` | `saveParametros(unidadeId, data)` |
| `DELETE` | `/parametros/unidade/:unidadeId` | `deleteParametros(unidadeId)` |

```typescript
interface CreateParametrosDTO {
  nome_enfermeiro?: string;
  numero_coren?: string;
  aplicarIST?: boolean;
  ist?: number;
  diasSemana?: string;
  cargaHorariaEnfermeiro?: number;
  cargaHorariaTecnico?: number;
  metodoCalculo?: string;
}
```

---

### Não-Internação

| Método | Rota | Função |
|--------|------|--------|
| `GET` | `/parametros/nao-internacao/:unidadeId` | `getParametrosNaoInternacao(unidadeId)` |
| `POST` | `/parametros/nao-internacao/:unidadeId` | `saveParametrosNaoInternacao(unidadeId, data)` |
| `DELETE` | `/parametros/nao-internacao/:unidadeId` | `deleteParametrosNaoInternacao(unidadeId)` |

```typescript
interface CreateParametrosNaoInternacaoDTO {
  jornadaSemanalEnfermeiro?: number;
  jornadaSemanalTecnico?: number;
  indiceSegurancaTecnica?: number;
  equipeComRestricao?: boolean;
  diasFuncionamentoMensal?: number;
  diasSemana?: number;
}
```

---

## 14. Sítios Funcionais

### Listar sítios de uma unidade (com cargos detalhados)
```
GET /sitios/unidades-nao-internacao/:unidadeId/sitios
Response: SitioFuncional[]
```
Função: `getSitiosFuncionaisByUnidadeId(unidadeId)`

---

### Criar sítio
```
POST /unidades-nao-internacao/:unidadeId/sitios
Body: CreateSitioFuncionalDTO
Response: SitioFuncional
```
Função: `createSitioFuncional(unidadeId, data)`

---

### Atualizar sítio
```
PUT /sitios/sitios-funcionais/:sitioId
Body: Partial<CreateSitioFuncionalDTO>
Response: SitioFuncional
```
Função: `updateSitioFuncional(sitioId, data)`

---

### Deletar sítio
```
DELETE /sitios/sitios-funcionais/:sitioId
```
Função: `deleteSitioFuncional(sitioId)`

---

### Buscar distribuições de um sítio
```
GET /sitios/sitios-funcionais/:sitioId/distribuicoes
Response: SitioDistribuicao[]
```
Função: `getSitioDistribuicoes(sitioId)`

---

### Cargos em sítios

| Método | Rota | Função |
|--------|------|--------|
| `GET` | `/sitios/sitios-funcionais/:sitioId/cargos` | `getCargosPorSitio(sitioId)` |
| `POST` | `/sitios/sitios-funcionais/:sitioId/cargos` | `addCargoASitio(sitioId, data)` |
| `DELETE` | `/sitios/sitios-funcionais/cargos/:cargoSitioId` | `deleteCargoDeSitio(cargoSitioId)` |

---

## 15. Dimensionamento (Análise)

### Análise de Internação
```
GET /dimensionamento/internacao/:unidadeId
Query: { inicio?: string, fim?: string }  (formato YYYY-MM-DD)
Response: AnaliseInternacaoResponse
```
Função: `getAnaliseInternacao(unidadeId, params?)`

Retorna:
- `agregados`: período, taxas de ocupação, KM de enfermagem, quadro de pessoal, distribuição de classificação SCP
- `tabela`: linhas com cargos, custos, quantidade atual vs. projetada

> Este é o endpoint chamado pelo botão **"Calcular"** na tela "Cálculo por Data Específica".

---

### Análise de Não-Internação
```
GET /dimensionamento/nao-internacao/:unidadeId
Response: AnaliseNaoInternacaoResponse
```
Função: `getAnaliseNaoInternacao(unidadeId)`

Retorna:
- `tabela`: grupos de cargos por sítio com custos
- `parametros`: jornada, IST, dias de funcionamento
- `distribuicao`: resumo por sítio (ENF/TEC, turno)
- `dimensionamento`: KM, pessoal arredondado

---

## 16. Projetado Final

### Internação

| Método | Rota | Função |
|--------|------|--------|
| `POST` | `/dimensionamento/internacao/:unidadeId/projetado-final` | `saveProjetadoFinalInternacao(unidadeId, data)` |
| `GET` | `/dimensionamento/internacao/:unidadeId/projetado-final` | `getProjetadoFinalInternacao(unidadeId)` |

```typescript
interface SaveProjetadoFinalInternacaoDTO {
  hospitalId: string;
  unidadeId: string;
  cargos: { cargoId: string; projetadoFinal: number; observacao?: string; status?: string }[];
}
```

---

### Não-Internação

| Método | Rota | Função |
|--------|------|--------|
| `POST` | `/dimensionamento/nao-internacao/:unidadeId/projetado-final` | `saveProjetadoFinalNaoInternacao(unidadeId, data)` |
| `GET` | `/dimensionamento/nao-internacao/:unidadeId/projetado-final` | `getProjetadoFinalNaoInternacao(unidadeId)` |

---

## 17. Taxa de Ocupação

### Por avaliações ativas

| Rota | Descrição | Função |
|------|-----------|--------|
| `GET /avaliacoes/taxa-ocupacao-dia?unidadeId=:id` | Taxa de uma unidade | `getTaxaOcupacaoUnidade(unidadeId)` |
| `GET /avaliacoes/taxa-ocupacao-dia` | Taxa geral (todas) | `getTaxaOcupacaoGeral()` |

### Por status dos leitos

| Rota | Descrição | Função |
|------|-----------|--------|
| `GET /leitos/taxa-ocupacao-status?hospitalId=:id` | Taxa consolidada do hospital | `getTaxaOcupacaoHospital(hospitalId)` |
| `GET /leitos/taxa-ocupacao-agregada?aggregationType=:tipo&entityId=:id` | Taxa agregada por tipo | `getTaxaOcupacaoAgregada(tipo, id?)` |

### Análise setorial de ocupação

| Rota | Descrição | Função |
|------|-----------|--------|
| `GET /hospital-sectors/:hospitalId/occupation-analysis` | Análise por setor do hospital | `getHospitalOccupationAnalysis(hospitalId)` |
| `GET /hospital-sectors/rede/:redeId/occupation-analysis` | Análise por setor da rede | `getNetworkOccupationAnalysis(redeId)` |
| `GET /hospital-sectors/:hospitalId/occupation-dashboard` | Dashboard histórico 4 meses | `getHospitalOccupationDashboard(hospitalId)` |
| `GET /hospital-sectors/rede/:redeId/occupation-dashboard` | Dashboard 4 meses — rede | `getNetworkOccupationDashboard(redeId)` |

---

## 18. Taxa de Ocupação Customizada

### Buscar por unidade
```
GET /taxa-ocupacao/:unidadeId
Response: TaxaOcupacaoCustomizada | null
```
Função: `getTaxaOcupacaoCustomizadaByUnidadeId(unidadeId)`

---

### Salvar / atualizar
```
POST /taxa-ocupacao
Body: { unidadeId: string, taxa: number }
Response: TaxaOcupacaoCustomizada
```
Função: `saveTaxaOcupacaoCustomizada(payload)`

---

## 19. Controle de Período

### Buscar por unidade
```
GET /controle-periodo/:unidadeId
Response: ControlePeriodo | null
```
Função: `getControlePeriodoByUnidadeId(unidadeId)`

---

### Buscar período travado
```
GET /controle-periodo/:unidadeId/travado
Response: ControlePeriodo | null
```
Função: `getPeriodoTravado(unidadeId)`

---

### Salvar período
```
POST /controle-periodo
Body: { unidadeId, travado: boolean, dataInicial, dataFinal }
Response: ControlePeriodo
```
Função: `saveControlePeriodo(payload)`

---

## 20. Baseline

### Buscar por hospital
```
GET /baselines/hospital/:hospitalId
Response: Baseline
```
Função: `getBaselinesByHospitalId(hospitalId)`

---

### Criar baseline
```
POST /baselines
Body: CreateBaselineDTO { hospitalId, nome, quantidade_funcionarios, custo_total, setores[] }
Response: Baseline
```
Função: `createBaseline(data)`

---

### Atualizar baseline
```
PUT /baselines/:baselineId
Response: Baseline
```
Função: `updateBaseline(baselineId, data)`

---

### Atualizar status de setor
```
PATCH /baselines/:baselineId/setores/:setorNome/status
```
Função: `updateBaselineSetores(baselineId, setorNome)`

---

### Deletar baseline
```
DELETE /baselines/:baselineId
```
Função: `deleteBaseline(baselineId)`

---

## 21. Snapshots

### Criar snapshot do hospital
```
POST /snapshot/hospital/:hospitalId
Body: { observacao?: string }
```
Função: `createSnapshotHospitalSectors(hospitalId, nome?)`

---

### Listar snapshots do hospital
```
GET /snapshot/hospital/:hospitalId?limite=10
Response: SnapshotsListResponse
```
Função: `getHospitalSnapshots(hospitalId, limite?)`

---

### Buscar snapshot selecionado do hospital
```
GET /snapshot/hospital/:hospitalId/selecionado
Response: HospitalSectorsData
```
Função: `getSnapshotHospitalSectors(hospitalId)`

---

### Marcar snapshot como selecionado
```
PATCH /snapshot/:snapshotId/selecionado
Body: { selecionado: boolean }
```
Função: `updateSnapshotSelecionado(snapshotId, selecionado)`

---

### Resumo do último snapshot
```
GET /hospitals/:hospitalId/snapshots/latest/summary
Response: SnapshotSummaryResponse
```
Função: `getLatestSnapshotSummary(hospitalId)`

---

### Snapshot agregado por agrupamento
```
GET /snapshot/aggregated?snapshotId=:id&groupBy=:groupBy
```
Função: `getSnapshotAggregated(snapshotId, groupBy?)`

`groupBy`: `'hospital'` | `'regiao'` | `'grupo'` | `'rede'`

---

### Todos os snapshots agregados
```
GET /snapshot/aggregated/all
```
Função: `getSnapshotAggregatedAll()`

---

### Snapshots selecionados por grupo
```
GET /snapshot/selected-by-group?tipo=:tipo&id=:id
Response: SnapshotSelecionadoItem[]
```
Função: `getSnapshotSelectedByGroup(tipo, id)`

`tipo`: `'rede'` | `'grupo'` | `'regiao'`

---

### Dashboard de snapshot
```
GET /snapshot/dashboard?tipo=:tipo&id=:id
Response: any (payload aninhado rede → grupo → região → hospital)
```
Função: `getSnapshotDashboard(tipo, id)`

---

## 22. Agregação de Setores Hospitalares

### Comparativo de hospital
```
GET /hospital-sectors-aggregate/hospitals/:hospitalId/comparative
Query: Record<string, any> (opcional)
Response: HospitalComparativeResponse
```
Função: `getHospitalComparative(hospitalId, params?)`

---

### Comparativo de rede
```
GET /hospital-sectors-aggregate/rede/:redeId/comparative
Response: NetworkComparativeResponse
```
Função: `getNetworkComparative(redeId, params?)`

---

### Projetado de hospital (setores agregados)
```
GET /hospital-sectors-aggregate/hospitals/:hospitalId/projected
Response: HospitalProjectedResponse
```
Função: `getHospitalProjectedSectors(hospitalId, params?)`

---

### Projetado de rede (setores agregados)
```
GET /hospital-sectors-aggregate/rede/:redeId/projected
Response: HospitalProjectedResponse
```
Função: `getNetworkProjectedSectors(redeId, params?)`

---

### Setores da rede
```
GET /hospital-sectors-network/rede/:redeId
Response: HospitalSectorsData
```
Função: `getNetworkSectors(redeId)`

---

### Listas "all-aggregated" (1 chamada cada)

| Rota | Função |
|------|--------|
| `GET /hospital-sectors/networks/all-aggregated` | `getAllNetworksAggregated()` |
| `GET /hospital-sectors/groups/all-aggregated` | `getAllGroupsAggregated()` |
| `GET /hospital-sectors/regions/all-aggregated` | `getAllRegionsAggregated()` |
| `GET /hospital-sectors/hospitals/all-aggregated` | `getAllHospitalsAggregated()` |

Todas retornam `GlobalAggregatedList`:
```typescript
interface GlobalAggregatedList {
  aggregatedBy: 'network' | 'group' | 'region' | 'hospital';
  items: GlobalEntity[];
}
```

---

### Todos os hospitais (legado)
```
GET /hospital-sectors-aggregate/all
```
Função: `getHospitaisAggregated()`

---

## 23. Dashboard Global

### Rota consolidada (atual + projetado + baseline)
```
GET /hospital-sectors-aggregate/:entityType/:entityId/dashboard
Response: { atual: any, projetado: any, baseline: any }
```
Função: `getGlobalDashboardData(entityType, entityId)`

`entityType`: `'rede'` | `'grupo'` | `'regiao'`

> Substitui as rotas `@deprecated`: `getRedesAggregated`, `getGruposAggregated`, `getRegioesAggregated`, `getRedesProjectedAggregated`, `getGruposProjectedAggregated`, `getRegioesProjectedAggregated`, `getHospitaisProjectedAggregated`.

---

## 24. Qualitativo — Categorias

| Método | Rota | Função |
|--------|------|--------|
| `GET` | `/qualitative/categories` | `getListQualitativesCategories()` |
| `POST` | `/qualitative/categories` | `createCategory(data)` |
| `PUT` | `/qualitative/categories/:id` | `updateCategory(id, data)` |
| `DELETE` | `/qualitative/categories/:id` | `deleteCategory(id)` |

---

## 25. Qualitativo — Questionários

| Método | Rota | Função |
|--------|------|--------|
| `GET` | `/qualitative/questionnaires` | `getQuestionarios()` |
| `POST` | `/qualitative/questionnaires` | `createQuestionario(data)` |
| `PUT` | `/qualitative/questionnaires/:id` | `updateQuestionario(id, data)` |
| `DELETE` | `/qualitative/questionnaires/:id` | `deleteQuestionario(id)` |

---

## 26. Qualitativo — Avaliações

### Listar todas
```
GET /qualitative/evaluations
Response: Evaluation[]
```
Função: `getAvaliacoes()`

---

### Listar por setor
```
GET /qualitative/evaluations-by-sector?sectorId=:sectorId
Response: Evaluation[]
```
Função: `getAvaliacoesBySector(sectorId)`

---

### Buscar por ID
```
GET /qualitative/evaluations/:id
Response: Evaluation
```
Função: `getAvaliacaoById(id)`

---

### Criar
```
POST /qualitative/evaluations
Response: Evaluation
```
Função: `createAvaliacao(data)`

---

### Atualizar
```
PUT /qualitative/evaluations/:id
Response: Evaluation
```
Função: `updateAvaliacao(id, data)`

---

### Deletar
```
DELETE /qualitative/evaluations/:id
```
Função: `deleteAvaliacao(id)`

---

### Avaliações concluídas com categorias
```
GET /qualitative/completed-with-categories?hospitalId=:hospitalId
Response: any[]
```
Função: `getCompletedEvaluationsWithCategories(hospitalId)`

---

### Agregados por categoria
```
GET /qualitative/aggregates/by-category?hospitalId=:hospitalId
Response: QualitativeAggregatesResponse
```
Função: `getQualitativeAggregatesByCategory(hospitalId)`

Retorna médias por categoria: global do hospital, por tipo de unidade e por setor.

---

### Agregados por setor
```
GET /qualitative/aggregates/by-sector?sectorId=:sectorId
```
Função: `getQualitativeAggregatesBySector(sectorId)`

---

## 27. Qualitativo — Coletas

### Criar coleta (multipart)
```
POST /coletas
Body: FormData
Headers: Content-Type: multipart/form-data
```
Função: `createColeta(data)`

---

### Listar coletas por hospital
```
GET /coletas/hospital/:hospitalId
Response: Coleta[]
```
Função: `getColetasPorHospital(hospitalId)`

---

### Deletar coleta
```
DELETE /coletas/:id
```
Função: `deleteColeta(id)`

---

## 28. Exportação de PDF

### Relatório de dimensionamento
```
GET /export/dimensionamento/:unidadeId/pdf
Query: { inicio?: string, fim?: string }
Response: Blob (application/pdf) → download automático
```
Função: `exportDimensionamentoPdf(unidadeId, params?)`

Nome do arquivo: `dimensionamento-{unidadeId}.pdf`

---

### Relatório de variação de snapshot
```
GET /export/snapshot/:hospitalId/variacao/pdf
Query: { tipo: 'MAPA' | 'DETALHAMENTO', escopo: 'QUANTIDADE' | 'FINANCEIRO' | 'GERAL' }
Response: Blob (application/pdf) → download automático
```
Função: `exportSnapshotVariacaoPdf(hospitalId, tipo, escopo)`

Nome do arquivo: `relatorio-{tipo}-{escopo}-{hospitalId}.pdf`

---

## 29. Utilitários

### `buildFileUrl(path?)`
Constrói a URL absoluta para arquivos servidos pelo backend (ex: fotos de hospital em `/uploads/`), usando o mesmo host do `API_BASE_URL`.

```typescript
buildFileUrl("/uploads/hospital/foto.png")
// → "http://localhost:3110/uploads/hospital/foto.png"
```

---

## Observações Gerais

| Item | Detalhe |
|------|---------|
| **Autenticação** | JWT via `Authorization: Bearer <token>` no header. Token lido do `localStorage`. |
| **Expiração** | Status `401` ou `403` limpa o token e redireciona para `#/login`. |
| **Upload de arquivos** | Endpoints que recebem `FormData` usam `Content-Type: multipart/form-data` automaticamente. |
| **Paginação** | Não há paginação padronizada; alguns endpoints aceitam `limite` como query param. |
| **Formato de data** | Datas no formato `YYYY-MM-DD`. |
| **Ajustes qualitativos** | `getAjustesQualitativos` e `saveAjustesQualitativos` são **mock** usando `localStorage` — sem chamada real à API. |
