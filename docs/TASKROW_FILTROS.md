# Taskrow — Documentacao Completa dos Filtros

Este documento detalha as duas camadas de filtragem independentes que controlam quais tarefas do Taskrow aparecem na pagina de demandas.
O documento e autonomo e nao depende de acesso ao codigo-fonte original para ser compreendido ou reimplementado.

---

## Visao geral

O sistema de filtros opera em duas etapas completamente separadas:

```
[API Taskrow]
    └─ Camada 1: Filtro de importacao (servidor)
         └─ Quais tasks entram no banco local
              ↓
    [Banco local de demandas]
         └─ Camada 2: Filtros de tela (JavaScript)
              └─ O que o usuario ve na tabela
```

Uma tarefa precisa passar pelas **duas camadas** para aparecer na tela.

---

## Camada 1 — Filtro de Importacao (servidor / API Taskrow)

Esta camada e executada no servidor e define o que **entra no banco local**.
Tem dois niveis internos de filtragem.

---

### 1.1 Lista fixa de projetos permitidos

Uma lista fixa define quais projetos podem ser importados.
Somente tasks pertencentes a estes projetos sao salvas no banco local.
Se um projeto nao estiver na lista, **nunca aparece**, independente do que estiver no Taskrow.

Cada entrada da lista contem:

- `clientNickname` — identificador do cliente no Taskrow (ex.: `"GLP"`, `"Medtronic"`)
- `jobNumber` — numero do job no Taskrow (ex.: `116`, `581`)
- `displayName` — nome de exibicao amigavel na interface

**Projetos atualmente configurados:**

| clientNickname     | jobNumber | Nome de exibicao      |
| ------------------ | --------- | --------------------- |
| `GLP`              | 116       | GLP                   |
| `ChegoLa`          | 500       | Chego La              |
| `ProjetoStella`    | 508       | Merz IDT (Tech e SEO) |
| `Medtronic`        | 581       | Medtronic             |
| `F2FInstitucional` | 450       | F2F Mkt Institucional |
| `ABRAFATI`         | 341       | ABRAFATI              |

**Como o jobID e resolvido:**
Para cada entrada da lista, o servidor chama:

```
GET /api/v1/Search/SearchJobs?q={jobNumber}
```

e confirma que `clientNickName` + `jobNumber` da resposta batem exatamente com a entrada.
Se nao bater, o projeto e pulado (log de aviso) e a importacao segue para o proximo.

---

### 1.2 Filtro no payload do advancedsearch

Apos resolver o `jobID`, o servidor chama:

```
POST /api/v2/search/tasks/advancedsearch
```

Com o seguinte corpo:

```json
{
  "JobID": 12345,
  "Closed": false,
  "StartDate": "2025-01-12T00:00:00Z",
  "Pagination": {
    "PageNumber": 1,
    "PageSize": 500
  }
}
```

| Parametro   | Valor                   | Efeito                                   |
| ----------- | ----------------------- | ---------------------------------------- |
| `JobID`     | ID resolvido do projeto | Restringe ao projeto especifico          |
| `Closed`    | `false`                 | Exclui tarefas fechadas/encerradas       |
| `StartDate` | hoje - 2 meses          | Traz apenas tarefas dentro desse periodo |
| `PageSize`  | 500                     | Paginas de ate 500 tasks por chamada     |

A paginacao e automatica: enquanto a resposta retornar exatamente 500 itens, incrementa `PageNumber` e busca a proxima pagina. Quando retornar menos de 500, encerra a paginacao daquele projeto.

---

### 1.3 Enriquecimento apos importacao

Apos salvar cada task no banco, o servidor tenta complementar os dados:

1. **Descricao vazia:** se o campo `description` vier vazio na resposta do advancedsearch, busca via endpoint de detalhe:

   ```
   GET /api/v1/Task/TaskDetail?clientNickname=...&jobNumber=...&taskNumber=...
   ```

2. **Owner sem login:** se `ownerUserLogin` vier nulo, o servidor obtem o mapa completo de usuarios:

   ```
   GET /api/v1/User/ListUsers
   ```

   Monta um dicionario `{ UserID → UserLogin }` em cache durante a execucao e resolve o login pelo `ownerUserID`.

3. **Anexos:** se a task tiver attachments, tenta baixar os arquivos e os armazena localmente.

---

### 1.4 Regra de upsert (insert ou update)

Chave de deduplicacao: `taskrow_id` (campo UNIQUE no banco local).

| Situacao                                   | Acao                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| Task nova (nao existe no banco)            | `INSERT`                                                                |
| Task existente, sem `clickup_id` vinculado | `UPDATE` normal de todos os campos                                      |
| Task existente, com `clickup_id` vinculado | `UPDATE` preservando o `clickup_id` e forcando status `sent_to_clickup` |

A regra garante que tasks ja enviadas ao ClickUp nao percam o vinculo por uma reimportacao.

---

### 1.5 Importacao assincrona com polling de progresso

A importacao e executada em background para nao bloquear o navegador.
O fluxo de comunicacao tem dois requests separados:

1. **Iniciar importacao** — retorna imediatamente um `session_id` e dispara o processamento em background.
2. **Consultar progresso** — o frontend envia o `session_id` periodicamente (polling) e o servidor retorna o estado atual (ex.: "importando projeto 2 de 6", "concluido").

O progresso e armazenado em cache temporario no servidor (key: `session_id`) e consumido pelo polling.

---

## Camada 2 — Filtros de Tela (JavaScript)

Esta camada roda inteiramente no navegador e **nao faz chamadas a API**.
Opera sobre atributos `data-*` das linhas `<tr>` ja renderizadas na tabela HTML.
A linha so aparece se **todas as 6 condicoes** forem verdadeiras simultaneamente (AND logico).

---

### 2.1 Os 6 filtros e seus atributos

| Controle na UI               | Atributo `data-*` na linha                     | Logica de comparacao                                     |
| ---------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| Campo de busca (texto livre) | `data-title`, `data-client`, `data-taskrow-id` | `includes(termo)` — basta um dos tres conter o texto     |
| Select de status             | `data-status`                                  | igualdade exata                                          |
| Select de cliente            | `data-client`                                  | `includes(valor)`                                        |
| Select de grupo              | `data-group`                                   | `includes(valor)`                                        |
| Select de responsavel        | `data-owner`                                   | `includes(login)` — em lowercase dos dois lados          |
| Select de data               | `data-created` + texto da coluna de entrega    | OR: data de criacao OU data de entrega dentro do periodo |

---

### 2.2 Filtro de Grupo — como `data-group` e calculado

O grupo **nao vem da API Taskrow**. E inferido pelo servidor no momento de renderizar cada linha da tabela, com base em uma heuristica textual.

**Regra de classificacao como `"tech"`:**

A linha recebe `data-group="tech"` se **qualquer** uma dessas condicoes for verdadeira (case-insensitive):

- O campo **status** da task contem a palavra `"tech"`
- O **titulo** da task contem a palavra `"tech"`
- A **descricao** da task contem a palavra `"tech"`
- O **login do responsavel** contem `"ingrid"`
- O **login do responsavel** contem `"raissa"`

Se nenhuma condicao casar, `data-group` fica **vazio** (`""`).

**Consequencia pratica:** quando o filtro de grupo esta em `"tech"` (que e o valor padrao), toda linha com `data-group=""` some da tela — mesmo que a task exista no banco.

**Unica opcao disponivel no select de grupo atualmente:** `Tech (Ingrid Bisi)`

---

### 2.3 Filtro de Data — logica exata

O filtro avalia a data de **criacao** (`data-created`) OU a data de **entrega** (coluna "Entrega" da tabela).
A task aparece se **ao menos uma das duas** datas estiver dentro do intervalo selecionado.

| Opcao no select | Condicao                         |
| --------------- | -------------------------------- |
| Ultimos 2 meses | data >= hoje - 2 meses           |
| Este mes        | mesmo mes e ano de hoje          |
| Mes passado     | mes anterior ao atual            |
| Esta semana     | domingo a sabado da semana atual |
| Semana passada  | semana anterior                  |

**Formato de data esperado nas linhas:** `dd/mm/aaaa`

---

### 2.4 Filtro de Responsavel

O select de responsavel e preenchido com os logins unicos de todos os owners presentes nas demandas.
O preenchimento acontece de duas formas:

1. **Pelo servidor** ao renderizar o template: varre todas as demandas e gera uma `<option>` por `owner_user_login` unico.
2. **Pelo JavaScript como fallback:** se o select estiver vazio ao carregar a pagina (somente a opcao "Todos"), o JS varre os atributos `data-owner` das linhas renderizadas e popula dinamicamente.

A comparacao e feita em **lowercase** dos dois lados para evitar diferencas de maiusculas/minusculas.

---

### 2.5 Defaults ao carregar a pagina

Ao abrir a pagina, os filtros sao preenchidos automaticamente antes de exibir a tabela:

| Filtro                 | Valor default                                 |
| ---------------------- | --------------------------------------------- |
| Data                   | Ultimos 2 meses                               |
| Grupo                  | tech                                          |
| Responsavel            | primeiro owner cujo login contenha `"raissa"` |
| Busca, Status, Cliente | vazios (sem filtro)                           |

A funcao de filtro e chamada imediatamente apos aplicar os defaults, entao a tela ja abre filtrada.

---

### 2.6 Botao "Limpar filtros"

Restaura exatamente os mesmos defaults descritos acima — **nao remove todos os filtros**.

Ou seja, apos clicar em "Limpar filtros":

- Grupo volta para `tech`
- Data volta para `ultimos 2 meses`
- Responsavel volta para `raissa`
- Busca, Status e Cliente ficam vazios

---

### 2.7 Ordenacao pos-filtro

Apos cada aplicacao dos filtros, as linhas visiveis sao reordenadas automaticamente por **data de entrega ascendente** (prazo mais proximo aparece primeiro).

Criterio de desempate: `taskrow_id` numericamente ascendente (registro mais antigo aparece primeiro entre tasks com mesma data de entrega).

---

## Diagrama do fluxo completo

```
[Botao "Importar Demandas" na UI]
        |
        v
Servidor inicia importacao em background
Retorna session_id ao frontend
        |
        v
Frontend faz polling periodico com session_id
        |
        v
Servidor processa em background:
        |
        +-- Para cada projeto na lista fixa (6 projetos):
        |       |
        |       +-- SearchJobs?q={jobNumber}  --> resolve jobID
        |       |
        |       +-- advancedsearch POST:
        |               JobID={jobID}
        |               Closed=false
        |               StartDate=hoje-2meses
        |               Paginacao automatica (500/pagina)
        |               |
        |               +-- Para cada task retornada:
        |                       ownerLogin via mapa de usuarios (ListUsers)
        |                       descricao via TaskDetail (se vier vazia)
        |                       anexos via TaskImageByGuid (se existirem)
        |                       UPSERT na tabela local
        |
        v
[Banco local de demandas]
        |
        v
Servidor renderiza a tabela HTML
        |
        +-- Cada linha <tr> recebe atributos:
                data-group   = "tech" ou ""  (heuristica: status/titulo/desc/owner)
                data-owner   = owner_user_login (lowercase)
                data-created = dd/mm/aaaa
                data-status, data-client, data-title, data-taskrow-id, etc.
        |
        v
JavaScript aplica os 6 filtros simultaneamente
        |
        +-- Defaults automaticos: group=tech, date=last-2-months, owner=raissa
        |
        +-- Apos filtrar: ordena por data de entrega ascendente
        |
        v
[Tabela exibida ao usuario]
```

---

## Pontos de atencao para reutilizacao

1. **A lista de projetos e configuracao hardcoded** — para adicionar ou remover projetos, e necessario editar diretamente essa lista no servidor. Recomenda-se tornar isso configuravel por interface.

2. **O grupo "tech" e heuristico** — nao e um campo vindo da API Taskrow. Se os logins dos responsaveis mudarem (ex.: "raissa" for renomeado), o filtro para de funcionar silenciosamente. A lista de logins que mapeiam para "tech" deve ser tratada como configuracao.

3. **`Closed=false` na importacao padrao** — tasks encerradas no Taskrow nao sao trazidas pela importacao padrao. Existe uma rota alternativa que usa `IncludeClosed=true`, mas ela nao e acionada pela interface principal.

4. **`StartDate` de 2 meses** — tasks mais antigas que 2 meses que nao estiverem no banco local nao serao importadas pela rota padrao, mesmo que existam no Taskrow.

5. **"Limpar filtros" nao e neutro** — o botao restaura para `tech + 2 meses + raissa`, nao para "sem nenhum filtro". Isso deve ser comunicado claramente ao usuario para evitar confusao.
