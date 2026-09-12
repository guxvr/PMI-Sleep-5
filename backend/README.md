# Conexão local com watsonx Orchestrate

A API Node.js conecta o chat do frontend ao agente publicado, usando IBM IAM e a API de execução de agentes. O mesmo handler funciona no servidor local e nas funções da Vercel. Não depende do SDK Python nem modifica o agente implantado.

## Executar

1. Requer Node.js 22.12+ (o mesmo requisito do frontend).
2. Copie `.env.example` para `.env` nesta pasta, se o arquivo ainda não existir.
3. Preencha a chave, a Service instance URL, o UUID do agente, o UUID do ambiente **live** e a versão publicada.
4. Na pasta `frontend`, execute `npm run dev:api` e, em outro terminal, `npm run dev`.
5. Abra `/agente` e use “watsonx · agente publicado”. O botão “Atualizar conexão” mostra configuração e última resposta recebida.

O `.env` local é ignorado pelo Git. Nunca use prefixo `VITE_` para segredos. Após alterar o arquivo, reinicie a API. Não sobrescreva um `.env` já configurado com o exemplo vazio.

## Fluxo implementado

- `GET /api/watsonx/status`: configuração, campos faltantes, versão e horário da última resposta. Configuração completa não é prova de acesso ao deploy.
- `POST /api/chat`: recebe CNPJ, operação e pergunta; envia à IBM como contexto de demonstração. Valor, prazo, garantia e vínculo de área são explicitamente simulados.
- O servidor troca a chave por um token IAM e reutiliza esse token até perto da expiração.
- Chama `POST {instance}/v1/orchestrate/runs/stream`, com `agent_id`, `environment_id` e `version` explícitos. Continua a conversa com o `thread_id` recebido da IBM.
- Consome eventos NDJSON/SSE, exige conclusão da execução e devolve apenas texto da mensagem do assistente. Eventos internos de raciocínio e ferramentas não aparecem na interface.
- Uma falha remota aparece como erro; não há substituição silenciosa por resposta mock.
- Nova conversa ou troca de operação inicia um histórico separado. O modo mock continua acessível pelo seletor da tela.

## Deploy localizado

Em 12/09/2026, a API retornou `agente-sintetizador-risco`, com ambiente live na versão 2, atualizado às 15:13 UTC (12:13 GMT-3), na instância de Toronto informada pela equipe. A descrição corresponde ao sintetizador de risco de crédito da Krill Tech. O nome informado inicialmente com sufixo “4” não é o nome exibido pela API.

A consulta real do CNPJ fictício `33444555000103`, modalidade prazo, executou `consultar_red_flags` e retornou score 455 / rating D. Isso confirma o acesso ao agente e à ferramenta nesse caso; não transforma os mocks de origem em dados públicos atualizados. A versão de deploy v2 não é a mesma numeração da versão v4 do motor Python do repositório.

## Publicação na Vercel

O diretório raiz do projeto na Vercel deve ser a raiz deste repositório, e não `frontend`. `vercel.json` instala e compila o frontend e publica `api/chat.mjs` e `api/watsonx/status.mjs` como funções Node.js, com limite de 180 segundos por execução. As rotas do React funcionam ao abrir links diretamente.

Configure as seis variáveis de `backend/.env.example` que começam com `WATSONX_` no ambiente **Production** do projeto. Marque `WATSONX_API_KEY` como **Sensitive**. Elas são lidas exclusivamente pelo servidor; nenhum segredo usa prefixo `VITE_`. O arquivo `.env` local não é enviado à Vercel nem versionado no Git. Após configurar ou alterar variáveis, faça um novo deploy.

As requisições do navegador usam `/api` no próprio domínio publicado. Os hosts automáticos da Vercel são reconhecidos pelas variáveis de sistema; para um domínio adicional, configure `APP_HOSTS` com a lista de hosts separados por vírgula, sem protocolo. Não há CORS aberto para outras origens.

A URL de produção será compartilhável com os juízes sem depender deste computador. O projeto deve manter o domínio de produção sem exigência de login da Vercel; URLs de preview podem continuar protegidas.

## Limites

Localmente, a API escuta exclusivamente em `127.0.0.1:3001`. Na Vercel, aceita chamadas do domínio publicado. Há limite de tamanho de requisição e de concorrência por instância em execução; esse limite em memória não é uma quota global entre funções. A publicação é uma demonstração pública do hackathon, sem login, autorização por carteira ou auditoria centralizada. Mensagens podem consumir a cota do watsonx da equipe. Um produto empresarial exigirá esses controles e gestão de acesso.

A integração atual é do **chat**. Score lateral, dashboard, dados da carteira, alertas e relatórios salvos continuam demonstrativos. A resposta do agente não aplica aprovação nem altera a carteira. As referências do painel lateral são do mock e não são apresentadas como citações verificadas da resposta remota.

## Referências IBM

- [Credenciais e Service instance URL](https://developer.watson-orchestrate.ibm.com/environment/production_import)
- [Execução de agente com ambiente e versão](https://developer.watson-orchestrate.ibm.com/apis/orchestrate-agent/chat-with-orchestrate-assistant-as-stream)
- [Autenticação IAM](https://cloud.ibm.com/docs/apis/iam-identity-token-api)
