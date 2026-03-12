# Importação e Exibição de Imagens das Tasks do Taskrow

## Visão geral do fluxo

```
API Taskrow (campo attachments)
        ↓
  f2f_download_taskrow_attachments()
        ↓
  Download do arquivo (URL S3 ou endpoint TaskImageByGuid)
        ↓
  media_handle_sideload() → WordPress Media Library
        ↓
  JSON salvo na coluna `attachments` da tabela de demandas
        ↓
  data-attachments na <tr> da listagem
        ↓
  Modal de detalhes exibe miniaturas clicáveis (URL WP direta)

  ─── em paralelo, para imagens dentro de descrições ───

  HTML da descrição contém <img src="...TaskImageByGuid...">
        ↓
  f2f_rewrite_taskrow_images_php() (PHP) ou
  rewriteTaskrowImagesInHTML() (JS)
        ↓
  src reescrito para: admin-ajax.php?action=f2f_proxy_taskrow_image&...
        ↓
  f2f_ajax_proxy_taskrow_image() busca a imagem com o token e serve o binário
```

---

## 1. Dados recebidos da API

A API Taskrow retorna os anexos de uma task nos campos:

- `attachments`
- `Attachments`
- `TaskAttachments`

Cada item do array pode conter:

| Campo da API                        | Descrição                                          |
| ----------------------------------- | -------------------------------------------------- |
| `Identification` / `identification` | GUID único do arquivo no Taskrow                   |
| `Name` / `name`                     | Nome original do arquivo                           |
| `MimeType` / `mimeType`             | Tipo MIME (ex: `image/png`, `application/pdf`)     |
| `Url` / `url` / `URL`               | URL direta (quando o arquivo está no S3 da Amazon) |

Se a URL direta (`Url`) vier preenchida, ela já é uma URL S3 assinada — não precisa de autenticação. Caso contrário, a URL é construída via endpoint do Taskrow usando o `Identification`.

---

## 2. Download e sideload — `f2f_download_taskrow_attachments()`

**Arquivo:** `inc/taskrow-integration.php`

**Chamada durante a importação:**

```php
$taskrow_attachments = $task['attachments'] ?? $task['Attachments'] ?? $task['TaskAttachments'] ?? [];
$downloaded = f2f_download_taskrow_attachments($taskrow_attachments, $api_token, $host_name, $demand_id);
```

### Lógica de URL de download

```
Se tem Url direta → usa a URL S3 (sem token)
Senão            → constrói: /File/TaskImageByGuid/?identification={GUID}&mimeType={type}&time={timestamp}
                              com header `__identifier: {api_token}`
```

### Lógica de autenticação

- URLs com `amazonaws.com` no domínio → **sem header** de autenticação (S3 já é assinado)
- Outras URLs → adiciona `__identifier: {api_token}` no header

### Tratamento de redirects

O Taskrow às vezes responde com HTTP 301/302 apontando para o S3. O código:

1. Tenta seguir automaticamente (`'redirection' => 5`)
2. Se ainda assim falhar, lê o header `Location` e faz uma segunda requisição manual sem token

### Salvamento na Media Library

```php
$file_array = [
    'name'     => sanitize_file_name($name),
    'tmp_name' => $temp_file,
    'type'     => $mime_type,
];
$attachment_id = media_handle_sideload($file_array, 0, "Taskrow: {$name}");
```

- Arquivo é salvo na pasta de uploads do WordPress normalmente
- Post meta adicionados para rastreabilidade:
  - `_taskrow_identification` → GUID original do Taskrow
  - `_taskrow_demand_id` → ID da demanda na tabela local (quando disponível)

### Dados salvos no banco

Após o sideload, o campo `attachments` da tabela `wp_f2f_taskrow_demands` é atualizado com JSON:

```json
[
  {
    "id": 123,
    "url": "https://seusite.com/wp-content/uploads/2026/03/arquivo.png",
    "name": "arquivo.png",
    "mime_type": "image/png",
    "identification": "guid-do-taskrow"
  }
]
```

---

## 3. Proxy de imagens — `f2f_ajax_proxy_taskrow_image()`

**Arquivo:** `inc/taskrow-integration.php`

**Problema que resolve:** as imagens dentro do HTML de descrição das tasks chegam com URLs do tipo:

```
https://f2f.taskrow.com/File/TaskImageByGuid/?identification=...&mimeType=image/png
```

Essas URLs requerem o header `__identifier` para autenticar. Um `<img src="...">` no browser não consegue enviar headers customizados, então a imagem quebraria.

**Solução:** o proxy reescreve a URL para passar pelo WordPress:

```
/wp-admin/admin-ajax.php?action=f2f_proxy_taskrow_image&identification=...&mimeType=...
```

O WordPress então busca a imagem internamente com o token e serve o binário diretamente ao browser.

**Endpoint:**

```
action: f2f_proxy_taskrow_image
Parâmetros GET: identification, mimeType, time
Registrado em: wp_ajax e wp_ajax_nopriv (público)
```

---

## 4. Reescrita das URLs — onde acontece

### No PHP (renderização da lista)

Função `f2f_rewrite_taskrow_images_php($html)` em `page-demandas-taskrow.php`:

- Chamada ao renderizar o HTML da descrição nas linhas da tabela
- Percorre tags `<img>` com regex, detecta `File/TaskImageByGuid` no `src` e substitui pela URL do proxy

### No JS (abertura do modal)

`window.rewriteTaskrowImagesInHTML(htmlString)` — executada antes de inserir o HTML no modal:

- Regex sobre a string HTML completa
- Extrai `identification`, `mimeType` e `time` da URL original
- Reconstrói o `src` como URL do proxy

Também há uma varredura imediata no DOM ao carregar a página via IIFE `rewriteHiddenDescImages()`:

- Percorre todos os `img` dentro de `.task-description-full`
- Substitui qualquer `src` com `File/TaskImageByGuid` pelo proxy

---

## 5. Exibição no modal de detalhes

Os dados de anexos ficam no atributo `data-attachments` da `<tr>` da demanda (JSON serializado).

Ao abrir o modal, o JS lê esse JSON e renderiza uma grade de miniaturas:

```js
let attachments = JSON.parse($row.data("attachments") || "[]");

attachments.forEach((att) => {
  const isImage = att.mime_type && att.mime_type.startsWith("image/");
  // Exibe <img src="{att.url}"> para imagens (URL direto do WP Media)
  // Exibe ícone fa-file para outros tipos
  // Ambos são links clicáveis para abrir o arquivo em nova aba
});
```

Como os anexos já foram baixados e salvos na Media Library do WordPress, as URLs em `att.url` são URLs normais do site — sem necessidade de proxy.

---

## 6. Resumo dos arquivos envolvidos

| Arquivo                       | Responsabilidade                                                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `inc/taskrow-integration.php` | `f2f_download_taskrow_attachments()` (sideload), `f2f_ajax_proxy_taskrow_image()` (proxy)                            |
| `page-demandas-taskrow.php`   | `f2f_rewrite_taskrow_images_php()` (PHP), `rewriteTaskrowImagesInHTML()` (JS), exibição do modal com grade de anexos |
