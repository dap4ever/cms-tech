# Taskrow API no Tema F2F Dashboard (Documentacao Consolidada)

## Objetivo deste documento

Este arquivo consolida tudo que foi identificado no codigo do tema sobre a integracao com a API do Taskrow, com foco em reutilizacao em outro projeto/ambiente.

Escopo:

- Endpoints Taskrow consumidos pelo tema.
- Fluxos de importacao e enriquecimento de tarefas.
- Estrutura de dados local (tabela no WordPress).
- Actions AJAX e contratos de entrada/saida.
- Regras de seguranca, permissoes e nonces.
- Dependencias com ClickUp.
- Riscos, gaps e checklist de portabilidade.

Nao-escopo:

- Implementacao interna da API Taskrow (apenas consumo pelo tema).
- Rotas nao usadas pelo tema.

---

## 1) Arquitetura da integracao

A integracao Taskrow esta distribuida principalmente em 4 pontos:

1. `inc/class-taskrow-api.php`

- Classe de acesso central a API Taskrow.
- Responsavel por autenticacao, chamadas HTTP, metodos utilitarios e `TaskDetail`.

2. `inc/taskrow-integration.php`

- Orquestra importacao, persistencia em banco, proxy de imagem, anexos, acoes AJAX e ponte com ClickUp.

3. `functions.php`

- Registra menu admin de configuracao Taskrow.
- Salva host/token em options do WP.
- Exponibiliza objeto JS `f2f_ajax` (ajaxurl + nonce) para frontend.
- Handler AJAX para descricao detalhada (`f2f_get_taskrow_description`).

4. `page-demandas-taskrow.php`

- Interface de gestao das demandas importadas.
- Dispara acoes AJAX (importar, limpar, testar conexao, listar clientes, enviar para ClickUp, descricao detalhada etc).

---

## 2) Configuracao e credenciais

## 2.1 Options do WordPress usadas

Principais chaves de configuracao Taskrow:

- `f2f_taskrow_host_name`
- `f2f_taskrow_api_token`

Chaves legadas/fallback tambem aparecem no codigo:

- `taskrow_host_name`
- `taskrow_api_token`

## 2.2 Header de autenticacao

Todas as chamadas Taskrow usam header custom:

- `__identifier: <token>`

Header adicional comum:

- `Content-Type: application/json`

## 2.3 URL base

Padrao na classe:

- `https://{host}/api/v1/`

Tambem ha chamadas diretas para v2 em varios fluxos:

- `https://{host}/api/v2/...`

## 2.4 Pagina de configuracao

No admin:

- Menu: `Taskrow API`
- Slug: `f2f-taskrow-config`
- Persistencia via `admin_post_f2f_save_taskrow_api`

## 2.5 Observacao critica de seguranca

Existe no codigo um fallback com token/host hardcoded em constantes (para teste):

- `F2F_TASKROW_FALLBACK_TOKEN`
- `F2F_TASKROW_FALLBACK_HOST`

Recomendacao forte para outro ambiente:

- Remover fallback hardcoded.
- Usar apenas secrets seguros (env/secret manager).

---

## 3) Endpoints Taskrow mapeados no tema

Abaixo, endpoints efetivamente referenciados no codigo.

## 3.1 Endpoints de tarefas

1. Busca avancada de tarefas (principal)

- `POST /api/v2/search/tasks/advancedsearch`
- Uso:
  - Importacao em massa por projeto/job.
  - Testes de busca.
  - Buscar task por ID via filtro `TaskIDs`.
  - Buscar tasks e filtrar por owner localmente.

2. Detalhe de tarefa (descricao detalhada)

- `GET /api/v1/Task/TaskDetail`
- Query usada:
  - `clientNickname`
  - `jobNumber`
  - `taskNumber`
  - `connectionID` (GUID gerado no client)

3. Horas da tarefa

- `GET /api/v1/Task/GetTaskMinutesSpent`
- Metodo presente na classe (`get_task_hours`).

4. Busca por codigo externo

- `GET /api/v1/Task/GetTaskByExternalCode`
- Metodo presente na classe.

5. Tentativas/compatibilidade

- `GET /api/v1/Task/ListTasks` (tentativa em `get_demands`).
- `GET /api/v1/Task/GetTaskByExternalCode` (tentativa em `get_demands`).
- `GET /api/v1/Task/Get?taskID=...` (debug/inspecao).
- `GET /api/v2/Task/Get?taskID=...` (debug/inspecao).

## 3.2 Endpoints de clientes

1. Lista de clientes (Search)

- `GET /api/v1/Search/SearchClients?q=&showInactives=false`
- Usos:
  - Teste de conexao.
  - Listagem de clientes para UI.

2. Lista de clientes (Client)

- `GET /api/v1/Client/ListClients`
- Usos:
  - Metodo de classe `get_clients`.
  - Rotinas de teste.

3. Busca cliente por codigo externo

- `GET /api/v1/Client/GetClientByExternalCode`
- Metodo presente na classe.

4. Cidades

- `GET /api/v1/Client/ListCities`
- Metodo presente na classe (`get_cities`).

## 3.3 Endpoints de usuarios

1. Lista de usuarios

- `GET /api/v1/User/ListUsers`
- Usos:
  - Mapeamento `ownerUserID -> ownerUserLogin`.
  - Testes.
  - Validacoes auxiliares.

2. Entidades pendentes de usuario

- `GET /api/v1/User/GetUserPendingEntities?userID=...`
- `GET /api/v1/User/GetUserPendingEntities/{userID}`
- Usado com multiplas tentativas de compatibilidade.

## 3.4 Endpoints de jobs/projetos

1. Lista de jobs

- `GET /api/v2/core/job/list`
- Usos:
  - Descoberta de projetos para importacao.
  - Teste de conectividade.

2. Busca de jobs

- `GET /api/v1/Search/SearchJobs?q=...`
- Uso:
  - Resolver `jobID` a partir de `jobNumber` em importacao por jobs permitidos.

3. Busca job por codigo externo

- `GET /api/v1/Job/GetJobByExternalCode`
- Metodo presente na classe (`get_project_by_external_code`).

4. Subtipos de job

- `GET /api/v1/Administrative/ListJobSubType`
- Metodo presente na classe (`get_job_subtypes`).

## 3.5 Endpoint de arquivo/imagem Taskrow

1. Download/proxy de imagem

- `GET /File/TaskImageByGuid/?identification=...&mimeType=...&time=...`
- Usos:
  - Proxy interno no WP para exibir imagens em HTML.
  - Download de anexos/imagens em importacao.

---

## 4) Classe `F2F_Taskrow_API` (contratos principais)

## 4.1 Configuracao

- Singleton: `get_instance()`.
- Configurado quando host + token existem (`is_configured`).

## 4.2 Metodo interno `request($endpoint, $method='GET', $body=[])`

Comportamento:

- Monta URL em `https://{host}/api/v1/{endpoint}`.
- Envia header `__identifier`.
- Para `POST/PUT`, serializa JSON no body.
- Timeout: 30s.
- Em erro HTTP fora de 2xx, retorna `WP_Error('taskrow_api_error', ...)`.

Limitacao importante:

- Em chamadas GET, os parametros passados em `$body` nao sao anexados em query string nesse helper.
- Portanto, metodos GET que dependem de query params precisam URL completa (como foi feito em `get_task_detail`) ou ajuste no helper.

## 4.3 Metodo `test_connection()`

Testa varios endpoints:

- `User/ListUsers`
- `Client/ListClients`
- `/api/v2/core/job/list`
- `Administrative/ListJobSubType`

Regra de sucesso:

- Se pelo menos um endpoint responder 2xx, conexao considerada valida.

## 4.4 Metodo `get_task_detail($client_nickname, $job_number, $task_number)`

- Chama `GET /api/v1/Task/TaskDetail` com query completa.
- Gera `connectionID` local (GUID-like).
- Busca descricao em multiplos caminhos:
  - `TaskData.TaskItemComment`
  - `TaskData.TaskItems[0].TaskItemComment`
  - `TaskData.NewTaskItems[0].TaskItemComment`
  - `TaskData.ExternalTaskItems[0].TaskItemComment`
  - Busca recursiva por chave `TaskItemComment`

Retorno:

- `description` (HTML/texto da Taskrow)
- `description_path` (origem do campo)
- `raw` (payload completo)
- dados de contexto (`clientNickname`, `jobNumber`, `taskNumber`, `endpoint`, `connectionID`)

---

## 5) Persistencia local de demandas

## 5.1 Tabela

Nome:

- `{wp_prefix}f2f_taskrow_demands`

Criacao:

- Hook `after_setup_theme` via `f2f_create_taskrow_demands_table()`.

## 5.2 Colunas principais

- `id` (PK)
- `taskrow_id` (UNIQUE)
- `job_number`
- `task_number`
- `client_nickname`
- `clickup_id`
- `owner_user_id`
- `owner_user_login`
- `title`
- `description`
- `client_name`
- `status`
- `priority`
- `due_date`
- `attachments` (JSON)
- `hours_tracked`
- `hours_synced`
- `last_sync`
- `created_at`
- `updated_at`

Indices:

- unique em `taskrow_id`
- index em `clickup_id`
- index em `status`

---

## 6) Fluxos de importacao Taskrow

Existem multiplas estrategias no codigo.

## 6.1 Importacao principal asincrona (UI de demandas)

Frontend:

- Acao inicial: `f2f_start_import_by_clients`
- Polling de progresso: `f2f_get_import_progress`
- Execucao real em background: `f2f_run_import_by_clients` (nopriv)

Backend real:

- Handler: `f2f_ajax_import_by_clients`

Caracteristicas:

- Cria `session_id` e grava progresso em transient (`f2f_import_progress_{session}`).
- Busca clientes em `SearchClients(showInactives=true)`.
- Processa um conjunto fixo de jobs permitidos (`clientNickname + jobNumber`).
- Resolve `jobID` via `SearchJobs`.
- Busca tarefas por `advancedsearch` com `JobID`, `Closed=false`, `StartDate` (2 meses), paginacao.
- Upsert por `taskrow_id`.
- Quando descricao vazia, tenta enriquecer com `TaskDetail`.
- Processa anexos e salva na Media Library (quando possivel).

## 6.2 Importacao completa por projetos (`f2f_import_taskrow_demands`)

- Lista todos jobs via `/api/v2/core/job/list`.
- Para cada projeto, busca tasks via `advancedsearch` + paginacao.
- Upsert local.
- Preserva vinculo ClickUp existente (mantem `clickup_id` e status enviado).

## 6.3 Importacao de projeto unico (`f2f_import_single_project`)

- Recebe `project_id`.
- Faz paginacao em `advancedsearch` apenas para esse projeto.
- Upsert local.

## 6.4 Filtro de Grupo "Tech" na pagina de demandas

O filtro "Grupo" exibido na UI de `page-demandas-taskrow.php` tem, atualmente, apenas a opcao:

- `tech` (label: `Tech (Ingrid Bisi)`).

Importante:

- Esse grupo nao vem pronto da API Taskrow.
- Ele e inferido localmente no momento de renderizar cada linha da tabela.

### Regra de classificacao para `data-group="tech"`

Uma demanda recebe grupo `tech` quando qualquer uma das condicoes abaixo e verdadeira:

- `status` contem "tech" (case-insensitive)
- `title` contem "tech"
- `description` contem "tech"
- `owner_user_login` contem "ingrid"
- `owner_user_login` contem "raissa"

Se nenhuma condicao casar, `data-group` fica vazio.

### Como o filtro e aplicado no front

No JavaScript, o select `#filter-group` compara o valor selecionado com o atributo `data-group` da linha:

- `matchesGroup = !groupFilter || group.includes(groupFilter)`

Na pratica atual:

- Como so existe a opcao `tech`, o comportamento e equivalente a filtrar linhas classificadas como `tech`.

### Defaults de tela relacionados ao grupo

Ao carregar a pagina:

- `#filter-group` recebe `tech` automaticamente.
- `#filter-created-date` recebe `last-2-months`.
- O filtro de responsavel tenta preselecionar um owner contendo "raissa".

Ao clicar em "Limpar filtros":

- O grupo volta para `tech`.
- Data volta para `last-2-months`.
- Responsavel tenta novamente "raissa" (ou vazio se nao encontrar).

### Implicacao para portabilidade

Como o grupo `tech` e heuristico (texto + owner) e nao um campo canonico do Taskrow, ao reutilizar em outro ambiente recomenda-se:

1. Tornar essa regra configuravel (lista de palavras-chave e owners por grupo).
2. Ou substituir por um campo de classificacao persistido no banco.
3. Documentar quem sao os owners de referencia por equipe/area para evitar falso positivo.

---

## 7) Anexos e imagens Taskrow

## 7.1 Download de anexos

Funcao:

- `f2f_download_taskrow_attachments($attachments, $api_token, $host_name, $demand_id=null)`

Comportamento:

- Aceita anexos com `Identification`/`Name`/`MimeType` ou URL direta.
- Se URL direta (ex.: S3), baixa sem header `__identifier`.
- Caso contrario monta URL `TaskImageByGuid` com token no header.
- Tenta seguir redirect automatico e manual.
- Salva em media library com `media_handle_sideload`.
- Armazena metadados `_taskrow_identification` e `_taskrow_demand_id`.
- Salva JSON dos anexos baixados no campo `attachments` da demanda.

## 7.2 Proxy de imagem para frontend

Action publica:

- `f2f_proxy_taskrow_image`
- Tambem registrada em `nopriv`.

Uso:

- Reescrever `src` de imagens Taskrow no HTML para URL local `admin-ajax.php?action=f2f_proxy_taskrow_image...`.
- Evita erro de autenticacao do browser ao carregar imagens que exigem header `__identifier`.

Risco:

- Endpoint e publico; controle depende de parametros e do segredo do `identification`.

---

## 8) Actions AJAX Taskrow no tema (catalogo)

Abaixo as principais actions relacionadas ao Taskrow e seu objetivo.

1. `f2f_test_taskrow_connection`

- Testa conectividade usando `SearchClients`.
- Permissao: `manage_options`.

2. `f2f_import_taskrow_demands`

- Importacao ampla por todos projetos.
- Permissao: `manage_options`.

3. `f2f_import_single_project`

- Importa um projeto especifico.
- Param: `project_id`.

4. `f2f_start_import_by_clients`

- Inicia importacao assincrona.

5. `f2f_run_import_by_clients` (nopriv)

- Execucao assincrona real do import.

6. `f2f_get_import_progress`

- Retorna progresso via transient.
- Param: `session_id`.

7. `f2f_clear_all_taskrow_demands`

- Limpa demandas locais.
- Modo padrao: deleta apenas pendentes (`clickup_id` vazio).
- `force=true`: `TRUNCATE` total.

8. `f2f_get_taskrow_description`

- Busca descricao detalhada via `TaskDetail`.
- Params: `clientNickname`, `jobNumber`, `taskNumber`, `nonce`.
- Nonce esperado: `f2f_taskrow_desc`.

9. `f2f_fill_missing_descriptions`

- Preenche descricoes vazias em lote via `TaskDetail`.
- Param opcional: `batch`.

10. `f2f_list_taskrow_clients`

- Lista clientes via `SearchClients(showInactives=false)`.

11. `f2f_list_clients`

- Lista clientes com formato padronizado (`ClientID`, `ClientNickname`, `ClientName`).

12. `f2f_test_list_clients`, `f2f_test_list_users`, `f2f_test_list_projects`, `f2f_test_search_tasks`

- Rotas de diagnostico/teste.

13. `f2f_get_user_pending_entities`

- Tenta buscar entidades pendentes de um usuario com multiplas formas de endpoint.

14. `f2f_get_task_by_id`

- Debug de task por ID, tentando multiplos endpoints.

15. `f2f_get_tasks_by_owner`

- Busca tarefas e filtra por `ownerUserID` no PHP.

16. `f2f_proxy_taskrow_image` (+ nopriv)

- Proxy de imagem/autenticacao.

17. `f2f_ack_taskrow_updates`

- Marca aviso de atualizacao como lido por usuario (`user_meta`).

18. Integracao com ClickUp a partir de demanda Taskrow:

- `f2f_send_demand_to_clickup`
- `f2f_update_clickup_task`
- `f2f_check_clickup_task_status`
- `f2f_relink_clickup_task`
- `f2f_get_demand_clickup_id`
- `f2f_remove_clickup_tag`

---

## 9) Contratos de dados usados na importacao

## 9.1 Campos esperados em tasks Taskrow

O codigo tenta ler (com fallback de nomes):

- IDs: `taskID` ou `TaskID`
- Titulo: `taskTitle` ou `title`
- Descricao: `taskDescription` ou `description`
- Cliente nickname: `clientNickName` ou `clientNickname`
- Cliente nome: `clientDisplayName`
- Status: `pipelineStep`
- Prioridade: `priority` ou `Priority`
- Entrega: `dueDate` ou `due_date`
- Criacao: `createdDate` ou `created_at` ou `dateCreated`
- Owner: `ownerUserID`, `ownerUserLogin`
- Anexos: `attachments` ou `Attachments` ou `TaskAttachments`

## 9.2 Regra de upsert

Chave de deduplicacao local:

- `taskrow_id` (UNIQUE)

Se existe:

- `UPDATE`
  Se nao existe:
- `INSERT`

---

## 10) Integracao Taskrow -> ClickUp

## 10.1 Envio inicial

Action:

- `f2f_send_demand_to_clickup`

Requisitos:

- Demanda local existente.
- `clickup_id` vazio (evita duplicidade).
- Lista padrao ClickUp configurada (`f2f_clickup_default_list`).

Descricao enviada:

- Montada em markdown com cabecalho de origem Taskrow.
- Converte HTML de descricao para markdown (`f2f_html_to_markdown`).
- Tenta tratar imagens `TaskImageByGuid` para URL/proxy.

Pos-sucesso:

- Salva `clickup_id` e status `sent_to_clickup` na tabela local.

## 10.2 Atualizacao de tarefa ja vinculada

Action:

- `f2f_update_clickup_task`

Uso:

- Reenviar descricao convertida para markdown.

## 10.3 Relink manual

Action:

- `f2f_relink_clickup_task`

Uso:

- Vincular demanda a outra task ClickUp (ID ou URL).
- Ajusta tags no ClickUp (`indashboard`, remove `excluida` quando possivel).

---

## 11) Seguranca, permissoes e controles

## 11.1 Permissoes

Predominancia:

- Quase todas as actions sensiveis exigem `current_user_can('manage_options')`.

Excecoes relevantes:

- `f2f_proxy_taskrow_image`: publico (`nopriv`).
- `f2f_run_import_by_clients`: publico (`nopriv`) para execucao assincrona.

## 11.2 Nonces

Principais nonces:

- `f2f_taskrow_desc` (descricao detalhada).
- `f2f_ajax_nonce` (varias actions, validacao opcional em alguns handlers).
- `f2f_save_taskrow_api` (salvar config admin).
- `f2f_taskrow_updates_ack` (ack de atualizacoes).

Objeto JS global:

- `f2f_ajax.ajaxurl`
- `f2f_ajax.nonce` (gerado com `f2f_taskrow_desc`)

## 11.3 Riscos observados

1. Fallback de credencial hardcoded.
2. Endpoints `nopriv` para importacao e proxy.
3. Em alguns handlers, nonce e opcional ou nao exigido.
4. `sslverify => false` em alguns requests de teste/fallback.

---

## 12) Problemas e inconsistencias tecnicas identificadas

1. Dupla familia de options

- Uso misto de `f2f_*` e `taskrow_*`.
- Pode causar confusao de configuracao em outro ambiente.

2. Metodo `request()` para GET nao anexa query params

- Metodos GET que passam array de params ao helper podem nao funcionar como esperado sem ajuste.

3. Divergencia de shape de resposta em `advancedsearch`

- Codigo alterna entre `data`, `items` e array raiz.
- Necessario manter parse defensivo.

4. Importacao assincrona via `nopriv`

- Funcional para background, mas exige protecao adicional em producao.

5. Uso de `sslverify=false` em alguns pontos

- Facilita debug, mas nao recomendado para producao.

---

## 13) Checklist de portabilidade (usar em outro local)

## 13.1 Configuracao minima

1. Criar tabela local equivalente a `f2f_taskrow_demands`.
2. Configurar host/token Taskrow em segredo seguro.
3. Implementar cliente HTTP com header `__identifier`.
4. Implementar parse defensivo de respostas (`data/items/raiz`).

## 13.2 Fluxo minimo recomendado

1. Conectividade:

- Testar `SearchClients` e `ListUsers`.

2. Importacao:

- Buscar jobs (`core/job/list` ou `SearchJobs`).
- Buscar tasks via `advancedsearch` com paginacao.
- Upsert por `taskID`.

3. Enriquecimento:

- Para tarefas sem descricao, chamar `TaskDetail`.

4. Midia:

- Decidir estrategia para `TaskImageByGuid`:
  - Proxy autenticado, ou
  - Download e armazenamento local.

5. Integracao externa (opcional ClickUp):

- Persistir ID do sistema destino para idempotencia.

## 13.3 Endpoints para validar primeiro

1. `GET /api/v1/Search/SearchClients?q=&showInactives=false`
2. `GET /api/v1/User/ListUsers`
3. `GET /api/v2/core/job/list`
4. `POST /api/v2/search/tasks/advancedsearch`
5. `GET /api/v1/Task/TaskDetail?...`

---

## 14) Matriz rapida de referencia

## 14.1 Taskrow -> finalidade no tema

- `SearchClients`: teste conexao + listagem clientes.
- `ListUsers`: resolver owner e diagnostico.
- `core/job/list`: descoberta de projetos.
- `SearchJobs`: resolver `jobID` por `jobNumber`.
- `advancedsearch`: importacao principal de tarefas.
- `TaskDetail`: descricao detalhada com fallback robusto.
- `TaskImageByGuid`: imagens/anexos via proxy/download.

## 14.2 Dados chave por demanda

- Identidade: `taskrow_id`, `job_number`, `task_number`, `client_nickname`
- Negocio: `title`, `description`, `status`, `priority`, `due_date`
- Responsavel: `owner_user_id`, `owner_user_login`
- Integracao externa: `clickup_id`
- Midia: `attachments`

---

## 15) Recomendacoes praticas para evolucao

1. Padronizar options em apenas um namespace (`f2f_*`).
2. Remover credenciais hardcoded do repositorio.
3. Exigir nonce em todas as actions state-changing.
4. Reavaliar e restringir endpoints `nopriv`.
5. Ajustar helper `request()` para suportar query params em GET.
6. Centralizar parser de resposta Taskrow (`data/items/raiz`) em uma funcao unica.
7. Registrar telemetria de importacao (duracao, paginas, erros por endpoint).
8. Criar testes de contrato para payloads Taskrow esperados.

---

## 16) Fontes utilizadas nesta consolidacao

- `inc/class-taskrow-api.php`
- `inc/taskrow-integration.php`
- `functions.php`
- `page-demandas-taskrow.php`
- `docs/pagina-demandas-taskrow-funcionalidades.txt`
- `docs/documentoAPI.MD`

---

## 17) Resumo executivo

A integracao atual com Taskrow no tema e funcional e relativamente robusta para importacao de tarefas e enriquecimento de descricao, com suporte a anexos/imagens e ponte para ClickUp. O nucleo operacional esta em `advancedsearch` (v2), `TaskDetail` (v1) e `SearchClients`/`ListUsers` para suporte. Para reuso em outro local, o caminho mais seguro e replicar o fluxo de importacao por paginacao com upsert idempotente, reforcando controles de seguranca (remocao de hardcoded e revisao de endpoints publicos) e padronizando configuracoes.
