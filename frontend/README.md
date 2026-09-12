# Frontend de demonstração

Veja o [README do projeto](../README.md) para executar e o [contrato de integração](../docs/frontend-integracao.md) para conectar ao backend.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm ci` | Instala as versões do lockfile |
| `npm run dev` | Desenvolvimento com atualização automática |
| `npm run build` | TypeScript e build de produção |
| `npm run preview` | Inspeção local do build |
| `npm run lint` | Análise estática com Oxlint |
| `npm run format` | Formatação com Prettier |
| `npm run test` | Regras, dados e paridade Python |
| `npm run test:e2e` | Jornadas Playwright em duas larguras |
| `npm run data:prepare` | Recria JSON e cópias dos CSVs a partir da raiz |

O script de dados exige Python 3 e não altera os CSVs originais. A interface executa sem Python.

## Navegação

`/` dashboard; `/carteira` clientes; `/clientes/:id` cenário; `/analises/:analysisId` versão salva; `/alertas` triagem; `/agente` conversa; `/fontes` dados; `/governanca` políticas.

Na tela Políticas e auditoria, o modo Agente v4 usa snapshots do Python (finalidade produção, sem parâmetros agro). O preparo dos dados também carrega o código do motor; o frontend continua funcionando sem backend e sem SDK IBM.

O caso âncora é Fazenda Campo Verde, CNPJ `33444555000103`. Na política Projeto v0.2, a simulação a prazo tem score 540 (C); barter com o vínculo da área marcado tem 399 (D). Abra **Nova análise** para reproduzir. CNPJ desconhecido retorna NC. A validação local é de formato, sem validar dígito verificador ou existência cadastral.

## Estado e acessibilidade

O localStorage usa a chave versionada `krill-risk-demo-v1`. Conversas são separadas por cliente, operação e política. O menu Políticas e auditoria permite restaurar a demonstração, após confirmação. Não inclua dados reais neste armazenamento de demonstração.

Há rótulos nos campos, links e botões com nomes acessíveis, atalho Ctrl/Cmd+K, foco visível, link para pular ao conteúdo, diálogo de menu móvel e respeito a movimento reduzido. Tabelas largas rolam dentro do próprio painel em telas pequenas. Gráficos têm resumos numéricos; cor não é o único indicador de rating. Os testes de navegador não substituem uma auditoria completa de acessibilidade.

## Escolhas de implementação

Mantine fornece os componentes e os adaptadores de gráficos baseados em Recharts. O tema visual está em `src/main.tsx` e `src/index.css`. As rotas usam carregamento sob demanda. Dados são locais e o navegador não envia mensagens para IBM ou outras APIs. Links de evidência abrem o registro original do mock, com arquivo e linha; nomes das fontes não indicam conexão oficial ativa.

`src/services/gateway.ts` é a primeira fronteira a substituir na integração, mas a carteira, fontes e regras locais também deverão migrar para dados de servidor. Não basta trocar somente a função de chat para afirmar que o produto está integrado.
