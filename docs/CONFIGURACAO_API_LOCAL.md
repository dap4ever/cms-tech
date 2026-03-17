# Integração com API Taskrow - Guia de Configuração Local

Este documento explica como funciona a integração do projeto **F2F CMS** com a API do **Taskrow** e como configurar seu ambiente local para visualizar as tarefas reais (atualmente são 19 tarefas abertas conforme o painel oficial).

## Modo MOCK (Padrão)

Por padrão, se o sistema não detectar as credenciais do Taskrow nas variáveis de ambiente, ele entrará automaticamente no **Modo MOCK**.

- **Sintoma:** A API retorna apenas 3 tarefas de exemplo (ID TR-5042, TR-8931 e TR-1025).
- **Mensagem:** O JSON da API incluirá `"message": "API Proxy ativo com MOCK (Camada 1 Aplicada)."`.
- **Objetivo:** Permitir o desenvolvimento da interface e componentes sem depender de uma conexão ativa ou VPN.

## Configuração para Tarefas Reais

Para que a aba **Caixa de Entrada** liste as 19 tarefas reais visíveis no dashboard, você deve configurar as credenciais de acesso.

### 1. Criar arquivo de ambiente
Crie um arquivo chamado `.env.local` na raiz do projeto (onde está o `package.json`).

### 2. Adicionar as credenciais
Adicione as seguintes linhas ao arquivo, substituindo pelos valores reais fornecidos pela administração do Taskrow:

```env
# Host do Taskrow (ex: f2f.taskrow.com)
TASKROW_HOST=f2f.taskrow.com

# Token de autenticação (__identifier)
TASKROW_TOKEN=SEU_TOKEN_AQUI
```

### 3. Reiniciar o servidor
Após salvar o arquivo `.env.local`, interrompa o processo `npm run dev` e inicie-o novamente para que o Next.js carregue as novas variáveis.

## Detalhes Técnicos da Integração

- **Proxy Backend:** Localizado em `src/app/api/taskrow/tasks/route.ts`. Ele faz a ponte com os endpoints do Taskrow para evitar problemas de CORS e gerenciar a autenticação via headers.
- **Camada de Filtro:** O sistema aplica uma heurística para mostrar apenas demandas do grupo **Tech** (Ingrid, Raissa e Kaique), conforme definido nos requisitos do projeto.
- **Cache:** A aplicação utiliza os recursos de cache do Next.js para otimizar as chamadas, mas as rotas de detalhes da tarefa buscam dados em tempo real.

---
*Documentação gerada em: 16/03/2026*
