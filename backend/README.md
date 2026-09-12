# Conexão local com watsonx Orchestrate

A ponte Node.js conecta o chat do frontend ao agente publicado, usando IBM IAM e a API de execução de agentes. Não depende do SDK Python nem modifica o agente implantado.

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

## Limites

A API escuta exclusivamente em `127.0.0.1:3001`, aceita chamadas locais e limita tamanho de requisição e concorrência. É uma ponte de desenvolvimento, sem autenticação de usuários, autorização por carteira ou auditoria centralizada. Antes de publicar para outros usuários, implementar esses controles e uma gestão de segredos no servidor de destino.

A integração atual é do **chat**. Score lateral, dashboard, dados da carteira, alertas e relatórios salvos continuam demonstrativos. A resposta do agente não aplica aprovação nem altera a carteira. As referências do painel lateral são do mock e não são apresentadas como citações verificadas da resposta remota.

## Referências IBM

- [Credenciais e Service instance URL](https://developer.watson-orchestrate.ibm.com/environment/production_import)
- [Execução de agente com ambiente e versão](https://developer.watson-orchestrate.ibm.com/apis/orchestrate-agent/chat-with-orchestrate-assistant-as-stream)
- [Autenticação IAM](https://cloud.ibm.com/docs/apis/iam-identity-token-api)
