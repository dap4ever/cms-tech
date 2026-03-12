# Filtro de Cliente e Usuário — Página de Demandas

## Filtro de Cliente (`#filter-client`)

**O que usar:** o campo `client_nickname` da tarefa.

- É o apelido curto do cliente cadastrado no Taskrow.
- Vem do campo `clientNickName` ou `clientNickname` da API Taskrow.
- Quando ausente na tarefa, herda o `clientNickname` do **projeto** ao qual a tarefa pertence.
- Se ainda assim estiver vazio, usa `clientDisplayName` (nome de exibição).
- Valor salvo no banco: coluna `client_nickname` da tabela de demandas.
- No HTML da linha da tabela: atributo `data-client` em minúsculas.

**Fallback de exibição:**

```
client_nickname → client_name (clientDisplayName) → "Cliente Desconhecido"
```

**O que NÃO usar:** `client_name` diretamente como valor do filtro. O filtro compara contra `data-client`, que sempre usa `client_nickname` (em minúsculas) como prioridade.

### Clientes ativos e seus IDs

| Nickname (valor do filtro) | Nome de exibição      | Job Number |
| -------------------------- | --------------------- | ---------- |
| `GLP`                      | GLP                   | 116        |
| `ChegoLa`                  | Chego Lá              | 500        |
| `ProjetoStella`            | Merz IDT (Tech e SEO) | 508        |
| `Medtronic`                | Medtronic             | 581        |
| `F2FInstitucional`         | F2F Mkt Institucional | 450        |
| `ABRAFATI`                 | ABRAFATI              | 341        |

> O **ClientID numérico** do Taskrow não é fixo no código — é dinâmico e buscado via API (`/api/v1/Search/SearchClients`). O valor usado no filtro da página é sempre o **nickname** (coluna da esquerda).

---

## Filtro de Usuário/Responsável (`#filter-owner`)

**O que usar:** o campo `owner_user_login` da tarefa.

- É o login (nome de usuário) do responsável pela tarefa no Taskrow.
- Vem do campo `ownerUserLogin` da API Taskrow.
- Se `ownerUserLogin` não vier na resposta, é resolvido via mapa de usuários (`ownerUserID` → login).
- Valor salvo no banco: coluna `owner_user_login` da tabela de demandas.
- No HTML da linha da tabela: atributo `data-owner` em minúsculas.
- O filtro compara em minúsculas (`toLowerCase`).

### Usuários conhecidos e seus IDs

| Nome             | ownerUserID (Taskrow) | Fragmento do login usado no filtro |
| ---------------- | --------------------- | ---------------------------------- |
| Raissa Rodrigues | `29116`               | `raissa`                           |
| Ingrid Bisi      | `55070647`            | `ingrid`                           |
| Kaique Oliveira  | `29857`               | `Kaique`                           |

> O filtro `#filter-owner` usa o **login completo** (ex: `raissa.rodrigues`) em minúsculas. A lógica de grupo `tech` e o default de carregamento da página usam apenas o fragmento (`raissa`, `ingrid`) como busca parcial via `includes()`.

> **Atenção:** o filtro `#filter-owner` está **oculto** na interface (classe `d-none`), mas está **ativo** — o JS processa e aplica o filtro normalmente. Para exibi-lo, remova a classe `d-none` do elemento `#filter-owner-wrapper`.

**Grupo Tech (filtro `#filter-group`):**
Usuários cujo login contenha `ingrid` ou `raissa` são automaticamente classificados no grupo `tech`, ativado pelo filtro de grupo.
