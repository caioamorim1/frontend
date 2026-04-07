# Permissões por Rota — Backend

## Papéis (Roles)

| Sigla | Papel |
|---|---|
| **ADM** | ADMIN |
| **AV** | AVALIADOR |
| **GTT** | GESTOR_TATICO_TEC_ADM |
| **GTC** | GESTOR_TATICO_TECNICO |
| **GTA** | GESTOR_TATICO_ADM |
| **GEH** | GESTOR_ESTRATEGICO_HOSPITAL |
| **GER** | GESTOR_ESTRATEGICO_REDE |

> **Regra de escopo**: todos os papéis não-ADMIN devem ter acesso apenas ao **seu hospital** (validar `hospitalId` do JWT).  
> **GER** acessa apenas os hospitais da **sua rede** (validar `redeId` do JWT).  
> O backend deve rejeitar com `403` qualquer acesso a `hospitalId` / `redeId` fora do escopo do utilizador.

---

## Rotas necessárias para o AVALIADOR

> O AVALIADOR realiza avaliações SCP de leitos. Abaixo estão **todas** as rotas que o backend deve permitir para este papel.

### Hospital (cabeçalho / sidebar)
| Método | Endpoint | Para quê |
|---|---|---|
| GET | `/hospitais/:id` | Nome e foto do hospital no header *(actualmente retorna 403 — usar fallback do JWT)* |

### Home — Unidades de Internação
| Método | Endpoint | Para quê |
|---|---|---|
| GET | `/unidades?hospitalId=` | Lista de unidades para a Home |
| GET | `/avaliacoes/sessoes-ativas?unidadeId=` | Estado dos leitos por unidade |

### Classificação de Leitos (VisaoLeitosPage)
| Método | Endpoint | Para quê |
|---|---|---|
| GET | `/unidades/:id` | Detalhes da unidade + leitos |
| GET | `/avaliacoes/sessoes-ativas?unidadeId=` | Sessões activas da unidade |
| GET | `/avaliacoes/leito/:leitoId/ultimo-prontuario` | Último prontuário do leito |
| POST | `/leitos/:id/admitir` *(admitir paciente)* | Admitir novo paciente |
| PATCH | `/leitos/:id` | Alterar status / justificativa do leito |
| POST | `/leitos/:id/alta` | Dar alta ao paciente |
| GET | `/unidades/:id/comentarios?data=` | Comentários da unidade por data |
| POST | `/unidades/:id/comentarios` | Criar comentário |
| DELETE | `/unidades/:id/comentarios/:comentarioId` | Apagar próprio comentário |

### Avaliação SCP (AvaliacaoScpPage)
| Método | Endpoint | Para quê |
|---|---|---|
| GET | `/unidades/:id` | Dados da unidade (método SCP) |
| GET | `/avaliacoes/schema?scp=` | Questionário SCP a apresentar |
| POST | `/avaliacoes/sessao` | Criar/submeter avaliação SCP |

### Baseline (leitura)
| Método | Endpoint | Para quê |
|---|---|---|
| GET | `/baselines/hospital/:id` | Ver baseline do hospital |
| GET | `/snapshot/hospital/:hospitalId/selecionado` | Ver snapshot seleccionado |

### Utilizadores (leitura)
| Método | Endpoint | Para quê |
|---|---|---|
| GET | `/colaboradores?hospitalId=` | Ver lista de utilizadores |

---

## Auth / Público (sem token)

| Método | Endpoint | Quem |
|---|---|---|
| POST | `/login` | público |
| POST | `/password-reset/request` | público |
| GET | `/password-reset/verify/:token` | público |
| POST | `/password-reset/reset` | público |

---

## Gestão Global — apenas ADMIN

| Método | Endpoint | Quem |
|---|---|---|
| GET / POST | `/colaboradores/admin` | ADM |
| DELETE | `/colaboradores/admin/:id` | ADM |
| POST | `/hospitais` | ADM |
| PUT / DELETE | `/hospitais/:id` | ADM |
| GET / POST / PUT / DELETE | `/redes` e `/redes/:id` | ADM |
| GET / POST / PUT / DELETE | `/grupos` e `/grupos/:id` | ADM |
| GET / POST / PUT / DELETE | `/regioes` e `/regioes/:id` | ADM |
| GET / POST / PUT / DELETE | `/scp-metodos` e `/scp-metodos/:id` | ADM |
| GET / POST / PUT / DELETE | `/questionarios` e `/questionarios/:id` | ADM |
| GET | `/hospital-sectors-aggregate/all` | ADM |
| GET | `/snapshot/aggregated` | ADM |
| GET | `/snapshot/aggregated/all` | ADM |
| GET | `/hospitals/:id/snapshots/latest/summary` | ADM |

---

## Hospitais — leitura

| Método | Endpoint | Quem |
|---|---|---|
| GET | `/hospitais` | ADM, GER |
| GET | `/hospitais/:id` | ADM, GTT, GTC, GTA, GEH, GER |
| GET | `/hospitais/:id/ultima-atualizacao-cargo` | ADM, GTT, GTC, GTA, GEH, GER |

---

## Redes

| Método | Endpoint | Quem |
|---|---|---|
| GET | `/redes` | ADM |
| GET | `/redes/:redeId` | ADM, GER (própria rede) |
| GET | `/redes/:redeId/hospitais` | ADM, GER (própria rede) |

---

## Dashboard — Hospital Sectors

| Método | Endpoint | Quem |
|---|---|---|
| GET | `/hospital-sectors/:hospitalId` | ADM, GTT, GTC, GTA, GEH, GER |
| GET | `/hospital-sectors/:hospitalId/occupation-analysis` | ADM, GTT, GTC, GTA, GEH, GER |
| GET | `/hospital-sectors/:hospitalId/occupation-dashboard` | ADM, GTT, GTC, GTA, GEH, GER |
| GET | `/hospital-sectors/rede/:redeId/occupation-analysis` | ADM, GER |
| GET | `/hospital-sectors/rede/:redeId/occupation-dashboard` | ADM, GER |

---

## Dashboard — Aggregados (hospital-sectors-aggregate)

| Método | Endpoint | Tab frontend | Quem |
|---|---|---|---|
| GET | `/hospital-sectors-aggregate/rede/:redeId/dashboard` | Dashboard Global Rede | ADM, GER |
| GET | `/hospital-sectors-aggregate/:entityType/:entityId/dashboard` | Dashboard Global | ADM, GER |
| GET | `/hospital-sectors-aggregate/hospitals/:id/comparative` | Tab **Comparativo** | ADM |
| GET | `/hospital-sectors-aggregate/rede/:redeId/comparative` | Comparativo Rede | ADM, GER |
| GET | `/hospital-sectors-aggregate/hospitals/:id/projected` | Tab **Projetado** | ADM |
| GET | `/hospital-sectors-aggregate/rede/:redeId/projected` | Projetado Rede | ADM, GER |
| GET | `/hospital-sectors-network/rede/:redeId` | Dashboard Rede | ADM, GER |

---

## Snapshots

| Método | Endpoint | Quem |
|---|---|---|
| GET | `/snapshot/hospital/:hospitalId/selecionado` | ADM, GTT, GTC, GTA, GEH, GER |
| GET | `/snapshot/hospital/:hospitalId` | ADM, GTT, GTA, GEH, GER |
| POST | `/snapshot/hospital/:hospitalId` | ADM, GTT, GTA, GEH |
| PATCH | `/snapshot/:id/selecionado` | ADM, GTT, GTA, GEH |

---

## Unidades / Setores — Internação

> Criar, editar e apagar setores é exclusivo do **ADM** (tela de Cadastro).  
> A atualização de quantidades de profissionais e parâmetros dentro do **Dimensionar** usa endpoints próprios (ver secção Parâmetros de Dimensionamento).

| Método | Endpoint | Quem |
|---|---|---|
| GET | `/unidades?hospitalId=` | ADM, GTT, GTC, GTA, GEH, GER |
| GET | `/unidades/:id` | ADM, GTT, GTC, GTA, GEH, GER |
| POST | `/unidades` | ADM |
| PUT | `/unidades/:id` | ADM |
| DELETE | `/unidades/:id` | ADM |

## Unidades / Setores — Não-Internação

| Método | Endpoint | Quem |
|---|---|---|
| GET | `/unidades-nao-internacao/hospital/:id` | ADM, GTT, GTC, GTA, GEH, GER |
| GET | `/unidades-nao-internacao/:id` | ADM, GTT, GTC, GTA, GEH, GER |
| POST | `/unidades-nao-internacao` | ADM |
| PUT | `/unidades-nao-internacao/:id` | ADM |
| DELETE | `/unidades-nao-internacao/:id` | ADM |

## Unidades / Setores — Neutras

| Método | Endpoint | Quem |
|---|---|---|
| GET | `/unidades-neutras/hospital/:id` | ADM, GTT, GTC, GTA, GEH, GER |
| POST / PUT / DELETE | `/unidades-neutras/*` | ADM |

---

## Cargos

> Criar, editar e apagar cargos é exclusivo do **ADM** (tela de Cadastro).  
> A atualização da **quantidade de profissionais por cargo numa unidade** (dentro do Dimensionar) usa o endpoint de cargos da unidade — ver secção Parâmetros de Dimensionamento.

| Método | Endpoint | Quem |
|---|---|---|
| GET | `/hospitais/:id/cargos` | ADM, GTT, GTC, GTA, GEH, GER |
| POST | `/hospitais/:id/cargos` | ADM |
| PATCH | `/hospitais/:id/cargos/:cargoId` | ADM |
| DELETE | `/hospitais/:id/cargos/:cargoId` | ADM |

---

## Colaboradores / Usuários do Hospital

> Criar, editar e apagar utilizadores é exclusivo do **ADM** (tela de Cadastro).

| Método | Endpoint | Quem |
|---|---|---|
| GET | `/colaboradores?hospitalId=` | ADM, AV, GTT, GTC, GTA, GEH, GER |
| POST | `/colaboradores` | ADM |
| PATCH | `/colaboradores/:id` | ADM |
| DELETE | `/colaboradores/:id` | ADM |

---

## Baseline / Pareto

| Método | Endpoint | Quem |
|---|---|---|
| GET | `/baselines/hospital/:id` | ADM, AV, GTT, GTC, GTA, GEH, GER |
| POST | `/baselines` | ADM, GTT, GTA |
| PUT | `/baselines/:id` | ADM, GTT, GTA |
| DELETE | `/baselines/:id` | ADM, GTT, GTA |
| PATCH | `/baselines/:id/setores/:nome/status` | ADM, GTT, GTA *(toggle checkbox pareto)* |

---

## Leitos

| Método | Endpoint | Quem |
|---|---|---|
| GET | `/avaliacoes/sessoes-ativas?unidadeId=` | todos autenticados |
| GET | leitos via unidade | ADM, AV, GTT, GTC, GTA, GEH, GER |
| POST | criar leito | ADM, GTT, GTA, GEH |
| PATCH | `/leitos/:id` (status / justificativa) | ADM, AV, GTT, GTC, GTA, GEH |
| DELETE | `/leitos/:id` | ADM, GTT, GTA |

---

## Avaliações SCP / Coletas

| Método | Endpoint | Quem |
|---|---|---|
| GET | `/scp-metodos` | todos autenticados |
| POST | admitir paciente | ADM, AV, GTT, GTC, GTA, GEH |
| POST / PATCH | avaliações SCP | ADM, AV, GTT, GTC |
| GET / POST | `/coletas` | todos autenticados |

---

## Parâmetros de Dimensionamento

| Método | Endpoint | Quem |
|---|---|---|
| GET | parâmetros de unidade | ADM, GTT, GTC, GTA, GEH, GER |
| POST / PUT | parâmetros de unidade | ADM, GTT, GTC, GTA, GEH |

---

## Controle de Período

| Método | Endpoint | Quem |
|---|---|---|
| GET | `/controle-periodo/:unidadeId` | ADM, GTT, GTC, GTA, GEH, GER |
| GET | `/controle-periodo/:unidadeId/travado` | todos autenticados |
| POST | `/controle-periodo` | ADM, GTT, GTA, GEH |

---

## Resumo de permissões por papel

> **Cadastro** = criar/editar/apagar na tela de cadastro (exclusivo ADM).  
> **Dimensionar** = alterar quantidades de profissionais, status de cargo e parâmetros dentro da secção Dimensionar da sidebar.

| Funcionalidade | ADM | AV | GTT | GTC | GTA | GEH | GER |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Gestão global (redes, grupos, regiões, SCP) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dashboard tab Baseline | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Dashboard tab Termômetro | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Dashboard tab Atual | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dashboard tab Projetado | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dashboard tab Comparativo | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver Pareto | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Selecionar setores Pareto (checkbox) | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Criar / Editar / Apagar Baseline (cadastro) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver Baseline | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver Setores | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Criar / Editar / Apagar Setores (cadastro) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Alterar qtd. profissionais / parâmetros (Dimensionar) | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver Leitos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Alterar status / justificativa de Leito | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver Usuários | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Criar / Editar / Apagar Usuários (cadastro) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver Cargos | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Criar / Editar / Apagar Cargos (cadastro) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Avaliações SCP | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Snapshots (criar / selecionar) | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Dashboard Global Rede | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
