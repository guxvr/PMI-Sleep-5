# Guia do desafio e da solução

Krilltech · PMI Sleep 5 · Versão 2 · 12 de setembro de 2026

## 01. O problema que estamos resolvendo

**A decisão central é como estruturar a próxima venda para preservar receita e reduzir exposição a risco.** O sistema recebe o cliente e a operação pretendida, reúne evidências, aplica regras explícitas e apresenta alternativas para o analista.

Segundo o contexto fornecido pela equipe, a Krilltech comercializa tecnologia agrícola e atende produtores e empresas do agro. Uma venda com pagamento futuro cria exposição: a empresa entrega agora e depende de receber depois. No barter, o pagamento também depende da produção agrícola. Na CPR, é preciso conhecer a espécie do título, o lastro e os documentos da operação.

O problema combina informação fragmentada, mudanças no risco entre uma venda e outra e falta de visão consolidada da carteira. Um cadastro aparentemente regular ou a ausência de atraso observado não comprovam capacidade de pagamento. Uma restrição, por sua vez, precisa ser interpretada pela situação, origem e vínculo com a operação.

**Proposta de valor:** apoiar a equipe comercial e de crédito na escolha de modalidade, prazo, garantia e diligências, com evidências rastreáveis e revisão humana. A hipótese de alerta precoce precisa ser validada com datas e desfechos reais; ainda não há comprovação de capacidade de prever recuperação judicial.

### O que mudou nesta versão

- A solução atualizada em `solucao.md` passa a ser a referência de produto: cliente + modalidade + valor + prazo, com recomendação por operação.
- O frontend transforma essa proposta em uma jornada navegável. O código Python e os CSVs normalizados foram inspecionados; a leitura foi adaptada à atualização da equipe, preservando o cálculo do agente.
- Pesos, cortes de rating e roadmap foram atualizados. Prazo de oito semanas, amostra de cem clientes e orçamento de R$ 62,1 mil do material anterior eram propostas, não compromissos; não são mantidos como decisões aprovadas.
- O canvas permanece sob responsabilidade da outra pessoa da equipe e não foi alterado.

### Como ler este guia

**Documento da equipe** significa intenção ou contexto informado. **Código inspecionado** significa comportamento verificável no repositório. **Mock** significa demonstração sintética. **Proposta a validar** significa escolha ainda sem aprovação, dados suficientes ou implantação. A aparência funcional da interface não muda esse estágio.

## 02. Quem participa e como o trabalho circula

O cliente institucional da solução é a Krilltech. O usuário principal é o analista que precisa avaliar uma operação. O produtor ou empresa analisada é a contraparte comercial e, quando aplicável, titular de dados tratados. Esses papéis não devem ser confundidos.

| Participante | Interesse e responsabilidade no projeto |
| --- | --- |
| Direção e patrocinador da Krilltech | Definir apetite a risco, prioridades e critérios de sucesso |
| Comercial e canais de venda | Informar a operação, compreender condições e negociar alternativas |
| Crédito, financeiro e cobrança | Conferir capacidade, exposição, vencimentos e histórico; registrar parecer |
| Jurídico e responsável por privacidade | Validar instrumentos, regras críticas, uso de dados e exceções |
| Especialista agronômico | Validar cultura, safra, imóvel, lastro e significado dos indicadores agrícolas |
| Produtores, distribuidores e agroindústrias | Fornecer documentos, esclarecer achados e participar da negociação |
| Equipe frontend | Jornada, visualização, acessibilidade e consumo do contrato de API |
| Equipe backend e agentes | Coleta, identidade, motor, explicação, persistência e monitoramento |
| Fontes e fornecedores | Disponibilidade, atualização, termos de acesso e custo dos dados |

### Fluxo operacional pretendido

1. O comercial identifica o cliente e propõe uma venda, com valor, prazo, modalidade e garantia.
2. O sistema verifica identidade e cobertura, coleta fatos e registra suas datas e referências.
3. O motor produz classificação e condições; o agente explica o resultado com base nas evidências.
4. O analista revisa fontes, compara alternativas e pede informações adicionais quando necessário.
5. Crédito e jurídico tratam exceções dentro das alçadas que a empresa vier a aprovar.
6. O parecer e sua justificativa ficam associados à versão da análise. O monitoramento volta a avaliar clientes ativos quando surgirem fatos novos.

**A definir com a empresa:** nomes dos responsáveis, alçadas, prazo de atendimento dos alertas e quais mudanças comerciais exigem validação conjunta. O perfil “Ana Costa” da interface é fictício. Não há autenticação ou segregação de acesso no mock.

## 03. Quais dados existem de fato

O repositório contém seis arquivos demonstrativos, cada um com mil registros. A versão normalizada da equipe foi incorporada a partir de d139da3. Ela padroniza IDs, CNPJ, valores e o layout INMET. Esses arquivos permitem construir experiências de consulta e evidência; não são a carteira real da Krilltech nem demonstram consultas a órgãos públicos em funcionamento.

| Arquivo ou conjunto | Uso no frontend | Limite que deve ficar claro |
| --- | --- | --- |
| `auto_infracao_normalizado.csv` | Inspeção de autos, situação de cancelamento, valores e origem | Auto não comprova embargo vigente ou vínculo com lastro |
| PGFN não previdenciário | Evidência fiscal e valores no arquivo | Situação e atualização precisam ser interpretadas |
| PGFN previdenciário | Evidência de dívida inscrita no mock | Presença no arquivo não equivale a insolvência |
| FGTS | Débitos demonstrativos e situação informada | Ausência de registro não comprova regularidade integral |
| `inmet_normalizado.csv` | Chuva diária e temperatura agregadas | Dados sintéticos de estação, sem previsão ou vínculo com cada imóvel |
| `siszarc_normalizado.csv` | Catálogo de cultura/cultivar e campos disponíveis | Não contém a janela completa de risco de plantio |

O frontend monta quarenta clientes: quatro casos fixos do roteiro do Python e trinta e seis registros selecionados entre os CSVs fiscais e ambientais. Identificadores mascarados de pessoa física não são convertidos em identidades completas. Cada evidência derivada de CSV mantém ID normalizado, arquivo, linha e registro bruto; o catálogo de fontes também preserva hash do arquivo.

**Dados acrescentados para a demonstração:** exposição, proporção de garantias, modalidade, prazo, grupo, notas por pilar, evolução e sinais antecedentes. Eles são identificados como sintéticos. Os gráficos não devem ser apresentados como números operacionais da empresa.

### O que falta para sustentar “precoce”

Protestos, distribuição processual, alterações societárias e Junta Comercial são fontes pretendidas, ainda sem conexão no frontend. Os prazos de antecedência mencionados em `solucao.md` são hipóteses, não resultados de backtest. Dívida ativa e FGTS ficam como sinais confirmatórios; RJ é um evento crítico, não um alerta antecipado do próprio pedido.

Mudança societária ou registro empresarial isolado não provam preparação para RJ. O sistema precisa observar contexto, sequência temporal e qualidade do vínculo. O ganho de antecedência será medido entre a disponibilidade do sinal e o evento definido pela equipe.

## 04. Política proposta e cálculo existente

Há uma divergência concreta entre o documento e o agente. Escondê-la criaria uma integração em que a mesma operação teria classificações diferentes sem explicação. O frontend mostra as duas versões em Políticas e auditoria.

| Critério | Projeto v0.2, baseado no documento | Agente v4, código existente |
| --- | --- | --- |
| Método | Pilares ponderados e regras críticas | Multiplicadores logarítmicos sobre base 1000 |
| A | 800 a 1000 | 800 a 1000 |
| B | 600 a 799 | 650 a 799 |
| C | 400 a 599 | 500 a 649 |
| D | 0 a 399 | 0 a 499 |
| Entrada atual | Simulação de cliente e operação completa | Identificador, modalidade, finalidade e agro opcional |
| Saída atual | Objetos TypeScript na interface | Texto retornado pela ferramenta Python |

**Pesos do MVP proposto:** processual/jurídico 30%; societário/cadastral 20%; agronômico/climático 20%; fiscal/trabalhista 15%; ambiental 15%. Na fase com dados internos, a proposta é 25% processual, 25% comportamento interno, 15% societário, 15% agro, 10% fiscal e 10% ambiental.

O documento não define como converter cada fato em índice numérico. Para viabilizar o mock, foram criados índices sintéticos de risco de 0 a 100 e a fórmula demonstrativa: **score base = 1000 - soma(peso × índice / 10)**. Essa fórmula é uma escolha de implementação da demonstração, não uma política validada pela empresa.

No mock v0.2, RJ confirmada no cenário ou embargo vinculado ao lastro de barter/CPR limita o resultado a 399, preservando D. O corte por valor de protesto e a propagação de RJ pelo grupo não são ativados: faltam limiares e vínculos confirmados. Cobertura insuficiente retorna **NC**, sem nota final.

O Python v4 (commit 23c2dab) calcula pontos = -(100 / ln 2) × ln(multiplicador), sem bônus por combinação. Os subcampos fiscais, ambientais e agro modulam o cálculo. A interface usa snapshots gerados pelo próprio Python para quatro modalidades, com finalidade produção e sem parâmetros agro. Os testes comparam 160 combinações e conferem o hash do código de origem; não há chamada ao agente no navegador.

**Score não é PD.** Não há calibração para converter uma nota em probabilidade de inadimplência. A interface inclui variação de pesos em ±10 pontos percentuais, redistribuindo os demais para manter 100%. No caso âncora a prazo, reduzir o peso ambiental de 15% para 5%, redistribuindo os demais, muda 540/C para 604/B. Essa sensibilidade exige revisão; o teste não comprova poder preditivo.

## 05. Como interpretar as modalidades

O produto deve explicar por que uma estrutura merece diligência e quais alternativas podem ser avaliadas. A matriz traduz as regras para a negociação, sem prometer recebimento ou adequação jurídica automática.

| Modalidade | O que avaliar | Comportamento demonstrado |
| --- | --- | --- |
| À vista | Liquidação antes da entrega e demais verificações comerciais | Mantém alternativa de negociação, reduzindo exposição de crédito |
| A prazo | Capacidade, exposição acumulada, vencimento e garantia | Sugere revisar prazo e documentação conforme o risco |
| Barter | Produção esperada, cultura, safra, área e compromisso da colheita | Desaconselha o lastro atingido por embargo no cenário |
| CPR | Espécie física/financeira, lastro, contrato e registro/garantias | Exige classificação do instrumento e revisão documental |

O mock usa uma opção CPR genérica por compatibilidade com o agente. A integração deve separar CPR física e financeira e receber dados do lastro. Alienação fiduciária aparece como estrutura a avaliar; não como proteção universal ou automática.

### Caso âncora reproduzível

Cliente fictício: **Fazenda Campo Verde**, CNPJ `33444555000103`. Operação inicial de **R$ 180 mil**, a prazo, em **120 dias**. Na política Projeto v0.2, os índices sintéticos [40, 30, 50, 20, 100] produzem **540, rating C**.

Ao trocar para barter com a área embargada vinculada ao lastro, a média continua 540, mas a regra crítica limita a classificação exibida a **399, rating D**. O relatório permite comparar à vista e revisão da estrutura a prazo, esclarecer o lastro e registrar parecer. O embargo deste caso é uma fixture de apresentação, não uma conclusão extraída do CSV de autos.

Isso resolve a tensão do documento entre “mesmo score” e sobrescrita para D: o **score base** pode permanecer igual, enquanto a classificação final muda por uma regra da operação. No Agente v4, o mesmo caso produz 540/C à vista, 455/D a prazo e 381/D em barter. A equipe precisa alinhar a política e o caso de apresentação.

**Valor, prazo e garantia** entram no contexto e na recomendação da interface. Não foi inventada uma fórmula que mude a nota conforme esses campos. Limites quantitativos, capacidade de pagamento e precificação dependem de política e dados internos ainda indisponíveis.

## 06. Arquitetura e papel dos agentes

O fluxo pretendido separa fatos, regras e linguagem. A coleta gera evidências; código calcula indicadores; a recuperação por chave encontra trechos definidos da base de conhecimento; o Sintetizador apresenta uma explicação; o analista decide e registra o parecer.

**Web → backend autenticado → orquestração/coleta → motor determinístico → conhecimento por código → Sintetizador → validação → relatório e revisão.** O monitoramento recorrente roda no servidor e gera alertas deduplicados para clientes ativos.

| Componente | Responsabilidade pretendida | Estado verificado |
| --- | --- | --- |
| Frontend React | Operação, dashboard, fontes, conversa e parecer | Implementado como mock local |
| Ferramenta Python | Consulta dos mocks e score logarítmico | Presente no repositório |
| Backend | API, autenticação, jobs, ERP e persistência | A implementar pela equipe |
| Orchestrate | Encadear ferramentas, estados e revisão | Arquitetura proposta no documento |
| Sintetizador / watsonx.ai | Explicar fatos e alternativas com referências | Equipe informa desenvolvimento; fluxo completo não comprovado pelo repo |
| Governança de IA | Versões, avaliações e evidências de qualidade | Proposta; não conectada ao frontend |

O documento informa um Sintetizador funcional. A inspeção local encontrou a ferramenta `consultar_red_flags.py` v4, com finalidade e campos agro opcionais; isso não basta para confirmar implantação, endpoint ou avaliação do agente inteiro. Essa confirmação deve vir da equipe que o desenvolve.

### Limites da recuperação e da explicação

RAG por chave significa que um código como `DIVIDA_ATIVA_PGFN` busca uma definição específica. Isso torna o caminho de recuperação previsível, mas uma chave errada, fonte desatualizada ou texto normativo incorreto continua produzindo uma explicação ruim. A narrativa precisa citar os fatos e evitar acrescentar números ou conclusões não suportados.

A avaliação de fidelidade ao contexto proposta no documento deve ter métrica, versão e critérios de aceite definidos na implantação. Fidelidade não comprova veracidade ou atualidade da origem. O mock de conversa usa templates locais, e não executa avaliação watsonx.

O contrato sugerido em `docs/frontend-integracao.md` devolve score estruturado, evidências, cobertura, versões e exigência de revisão. Credenciais e permissões ficam no servidor. O navegador não deve decidir autorização nem recalcular a nota oficial depois da integração.

## 07. Dashboard e indicadores de exposição

**Quanto está exposto, onde se concentra o risco e quais casos precisam de ação agora?** Essas perguntas orientam o dashboard. Um gráfico só é útil se houver definição, unidade, data-base e possibilidade de entender sua origem.

| Indicador | Definição para produção | Situação no mock |
| --- | --- | --- |
| Exposição em aberto | Soma dos saldos elegíveis dos recebíveis na data-base | Soma das exposições sintéticas dos 40 clientes |
| Exposição C/D | Saldos de clientes/operações classificados C ou D na política indicada | Calculada na carteira conforme a política selecionada |
| Garantias | Montante relacionado a garantias válidas, com critérios de cobertura | Proporção fictícia, sem validação jurídica |
| Concentração top 10 | Exposição dos dez maiores / exposição total | Derivada dos valores sintéticos |
| Mix de modalidades | Exposição por estrutura comercial | Cada cliente tem uma modalidade ilustrativa |
| Evolução da exposição | Snapshots históricos reconciliados | Série criada para demonstração, sem histórico do ERP |
| Alertas prioritários | Casos acionáveis, com tipo, evidência, data e estado | Fila demonstrativa com tratamento local |

No cenário inicial da interface, a exposição total exibida é **R$ 15,21 milhões**. Esse valor serve para demonstrar o painel e não pode ser citado como exposição da Krilltech. A comparação de ratings muda com a política; os valores financeiros não são estimados pelo LLM.

### Correções de mensuração

O produto real deve somar recebíveis em aberto. A expressão faturamento × percentual a prazo × prazo médio/365 do documento é apenas uma aproximação de estoque em condições estáveis, quando o faturamento tem base anual compatível. Não substitui saldo contábil, vencimentos, sazonalidade e liquidação de títulos.

Perda esperada requer exposição, probabilidade de default calibrada e perda dado o default. Não calcular esse número com o score demonstrativo. Tampouco chamar toda exposição com garantia de “juridicamente protegida”: existência, valor, prioridade e possibilidade de execução precisam de verificação.

A integração deve permitir mais de uma operação e mais de uma modalidade por cliente, agregar grupos sem duplicar saldos e preservar a data-base. Dados ausentes devem aparecer como indisponíveis; zero só quando houver medição válida de zero.

## 08. Ajustes de contexto jurídico e cadastral

Estes pontos corrigem simplificações de `solucao.md` que alterariam regras do produto e respostas no pitch.

**Pedido e deferimento são eventos distintos.** A data do pedido delimita, como regra, os créditos existentes sujeitos à RJ. O deferimento inicia as suspensões previstas no art. 6º, com hipóteses de antecipação judicial e exceções. Os 180 dias e a prorrogação do §4º não esgotam todos os cenários, como o plano alternativo. Não afirmar que qualquer cobrança fica proibida ou que depois do protocolo o credor “só assiste”. A garantia fiduciária também exige enquadramento e análise de bens essenciais. Fonte: [Lei 11.101/2005, arts. 6º e 49](https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11101compilado.htm).

**CPR não tem um único tratamento.** A regra do art. 11 trata da CPR física nas condições legais de antecipação de preço ou troca por insumos e inclui ressalva de caso fortuito ou força maior impeditivo da entrega. A simples escolha “CPR” ou “barter” na tela não prova exclusão dos efeitos da RJ. Fonte: [Lei 8.929/1994, art. 11](https://www.planalto.gov.br/ccivil_03/leis/l8929.htm).

**Atividade rural não se mede pela idade do CNPJ.** Para o produtor rural, o Tema 1.145 do STJ considera exercício empresarial por mais de dois anos e inscrição na Junta Comercial no momento do pedido, independentemente do tempo do registro. Não concluir que a inscrição recente, isoladamente, antecipa RJ. Fonte: [STJ, Tema 1.145](https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?cod_tema_final=1145&cod_tema_inicial=1145&novaConsulta=true&tipo_pesquisa=T).

**A cobertura por CNPJ continua parcial em 2026.** A Receita informou efeitos a partir de 1º de janeiro de 2027 para as pessoas físicas e produtores rurais abrangidos pelas regras citadas da CBS, mantendo os mecanismos atuais de identificação até dezembro de 2026. O comunicado não sustenta resumir a prorrogação como benefício apenas para receita até R$ 3,6 milhões. Fonte: [Receita Federal, comunicado de 22/07/2026](https://www.gov.br/receitafederal/pt-br/assuntos/noticias/emissao-do-cnpj-e-de-documentos-fiscais-por-pessoas-fisicas-contribuintes-da-cbs-comecara-em-1o-de-janeiro-de-2027/).

**Implicações de produto:** manter identificador interno independente de CPF/CNPJ, preservar letras em novos identificadores e validar vínculos; não trocar idade do CNPJ por idade do CAR como prova automática de maturidade. Recusa a uma autorização de consulta tampouco deve receber penalidade automática inventada. Garantias, dados pessoais e alçadas precisam de regras formalizadas com os responsáveis da empresa.

## 09. O que demonstrar no frontend

O workspace foi desenhado como uma sequência de trabalho, com tabelas e painéis prontos do Mantine, gráficos Recharts e uma identidade visual verde e neutra. A apresentação pode começar pela carteira, entrar numa operação e terminar no registro da decisão.

1. **Visão geral:** mostrar exposição, ratings, concentração, evolução ilustrativa e casos prioritários. Explicar que os números são sintéticos.
2. **Carteira:** pesquisar por nome ou CNPJ, filtrar rating/modalidade/UF e abrir um cliente. CSV permite exportar a seleção.
3. **Nova análise:** usar o caso Fazenda Campo Verde, escolher a prazo, R$ 180 mil e 120 dias; abrir o resultado C/540.
4. **Relatório:** trocar para barter e mostrar a regra do lastro levando a D/399. Examinar recomendações e abrir a evidência de origem.
5. **Assistente de risco:** pedir comparação de modalidades e informações faltantes. Mostrar que a conversa preserva o contexto da operação; as respostas ainda são locais.
6. **Parecer e alertas:** registrar uma justificativa, recarregar a página e mostrar persistência; tratar um alerta e encontrar o registro na auditoria.
7. **Fontes e políticas:** abrir registros brutos, mostrar a lacuna do ZARC e a diferença entre as políticas do documento e do agente.

### Comportamentos já implementados

Busca, filtros, paginação, ordenação, exportação, formulários, carregamento, respostas de erro, estados vazios, simulação, versão salva, conversa contextual, tratamento de alerta, trilha local e adaptação a celular. O relatório oferece JSON e impressão para PDF pelo navegador.

### Limites visíveis

Não há login real, consulta oficial, agente IBM conectado, integração ERP, envio externo, monitoramento agendado ou mudança efetiva de crédito. Os históricos ficam no localStorage deste navegador e não são compartilhados entre membros. Restaurar a demonstração apaga apenas esse histórico local.

Um CNPJ fora dos dados retorna **informação insuficiente (NC)**. A ausência de achados não pode ser convertida em “empresa segura”. Essa situação também faz parte do roteiro e demonstra como o produto deve lidar com cobertura incompleta.

## 10. Roadmap e validação do valor

O roadmap segue a solução atualizada. As janelas são propostas da equipe, condicionadas a acesso, capacidade e patrocínio. Não equivalem a cronograma contratado ou orçamento aprovado.

| Etapa | Entregas e dependências | Critério de passagem proposto |
| --- | --- | --- |
| Fundação, 0 a 30 dias | Inventário de carteira; identificadores; definição de default/RJ; contrato e política canônica | Amostra reconciliada, responsáveis e regras documentados |
| Modo sombra, 31 a 90 dias | Relatórios paralelos à decisão atual; dados internos; análise de divergências | Cobertura e qualidade medidas, com revisão de erros |
| Piloto, 3 a 6 meses | Segmento ou região limitada; alertas ativos; treinamento; alçadas | Adoção e impacto avaliados sem exceder exposição acordada |
| Escala, 6 a 12 meses | Fontes adicionais; fontes pagas sob gatilho; revalidação | Expansão baseada em evidências, custos e governança |

O texto da solução chama os dados internos de fase 2 e também os coloca no modo sombra. Isso pode ser coerente se a primeira versão do motor for pública e o histórico interno entrar em seguida para validação. A equipe deve fixar esse marco e a versão da política correspondente.

### Métricas que precisam de linha de base

- **Eficiência:** mediana e percentil 90 do tempo entre solicitação completa e relatório revisado; separar tempo de máquina e tempo do analista.
- **Cobertura:** percentual da carteira com identidade resolvida e cada fonte consultada com sucesso dentro de sua validade.
- **Qualidade:** taxa de achados confirmados, alertas sem ação útil, divergências justificadas e afirmações não sustentadas por evidência.
- **Antecedência:** intervalo entre disponibilidade do sinal e desfecho; medir somente com histórico datado e definição de evento.
- **Negócio:** exposição e perdas por coorte/modalidade, mudanças de estrutura aceitas e relacionamento mantido. Não atribuir causalidade apenas a comparação antes/depois.
- **Operação:** custo por cliente monitorado, custo por análise, falhas por fonte e tempo até tratamento de alertas.

**Objetivo SMART ainda aberto:** escolher segmento, volume, prazo, meta de tempo, cobertura mínima e tolerância a erro após medir a operação atual. Não preencher esses números como fatos sem concordância da Krilltech. Dados públicos gratuitos não eliminam custos de integração, infraestrutura, IA, análise humana e eventuais consultas pagas.

## 11. Decisões pendentes e riscos

| Decisão pendente | Quem deve resolver | Por que afeta a entrega |
| --- | --- | --- |
| Política canônica, cortes e índices por pilar | Crédito + agentes + backend | Evita scores divergentes e regras inventadas |
| Limiar de protesto e regra de grupo | Crédito + jurídico | Evita transformar qualquer ocorrência em D |
| Espécies de CPR e documentos de garantia | Jurídico + comercial | Define campos, condições e explicação adequada |
| Identidade, grupo e vínculo do imóvel | Dados + jurídico + agronomia | Evita atribuir dívida ou embargo ao cliente errado |
| Acesso a CENPROT, DataJud e demais fontes | Backend + responsáveis pelos dados | Define cobertura, termos, latência e custo real |
| Campos e qualidade do ERP | Financeiro + backend | Permite exposição e validação contra desfechos |
| Critério de sucesso e alçadas | Patrocinador + gestores | Converte protótipo em piloto avaliável |

### Riscos e respostas propostas

**Falso positivo:** uma restrição mal atribuída pode interromper negociação ou impor condição inadequada. Exibir fonte e data, permitir esclarecimento e revisão; saída não binária reduz alguns impactos, mas não elimina o custo do erro.

**Falso negativo:** cobertura incompleta pode omitir um evento relevante. Mostrar fontes ausentes, não transformar falha em “sem ocorrência” e avaliar consulta adicional conforme o caso.

**Fonte tardia ou desatualizada:** separar data do evento, publicação e coleta. Uma evidência com aparência recente pode refletir fato antigo.

**Alucinação ou regra mal codificada:** narrativa vinculada a evidências, testes de regras, versão de conhecimento e avaliação de afirmações. Recuperação por chave não elimina erros de mapeamento.

**Conflito comercial:** envolver quem negocia na definição das recomendações e medir alternativas aceitas. Alterar modalidade não assegura viabilidade econômica.

**Validação sem histórico:** testes sintéticos comprovam execução de regras, não capacidade de antecipação. Sem desfechos históricos, restringir a alegação ao apoio à diligência e iniciar coleta prospectiva no modo sombra.

**Dependência de fornecedor:** contratos de API internos e adaptadores substituíveis; registrar lacunas e custo observado. Acesso público não significa API comercial irrestrita ou disponibilidade garantida.

## 12. Referências e passagem para a equipe

### Fontes do projeto

- `Desafio Hackathon PMI & Krillteck.pdf`: origem do problema apresentado. Este guia trata da solução de negócio, sem reproduzir programação do evento.
- Base de conhecimento inicialmente anexada: contexto de pesquisa da equipe; as decisões de produto posteriores estão em `solucao.md`.
- `solucao.md`: versão atualizada enviada pelo usuário; intenção do produto e roadmap. Afirmações jurídicas e quantitativas não se tornam fatos apenas por constarem nele.
- Repositório `guxvr/PMI-Sleep-5`: ferramenta Python e seis CSVs inspecionados; frontend e documentação acrescentados nesta entrega. [Repositório](https://github.com/guxvr/PMI-Sleep-5).

### Referências oficiais para conferir regras e fontes

- [Lei 11.101/2005](https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11101compilado.htm): eventos processuais e sujeição de créditos.
- [Lei 8.929/1994](https://www.planalto.gov.br/ccivil_03/leis/l8929.htm): CPR e condições do art. 11.
- [STJ, Tema 1.145](https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?cod_tema_final=1145&cod_tema_inicial=1145&novaConsulta=true&tipo_pesquisa=T): atividade rural e registro empresarial.
- [Receita Federal, cronograma cadastral](https://www.gov.br/receitafederal/pt-br/assuntos/noticias/emissao-do-cnpj-e-de-documentos-fiscais-por-pessoas-fisicas-contribuintes-da-cbs-comecara-em-1o-de-janeiro-de-2027/): atualização de julho de 2026.
- [PGFN, dados abertos](https://www.gov.br/pgfn/pt-br/assuntos/divida-ativa-da-uniao/transparencia-fiscal-1/dados-abertos), [IBAMA, áreas embargadas](https://www.gov.br/ibama/pt-br/servicos/consultas/autuacoes-e-embargos/areas-embargadas) e [CNJ, API DataJud](https://www.cnj.jus.br/sistemas/datajud/api-publica/): pontos oficiais para validação dos adaptadores.

### Arquivos de trabalho entregues

**README do repositório:** execução local, tecnologias e comandos de validação. **frontend/README.md:** navegação, casos e manutenção. **docs/frontend-integracao.md:** arquitetura, endpoints e payloads propostos, com divergências do Python. **Este guia em Markdown e PDF:** referência de contexto e limites da solução.

Os números de clientes reais, estados atendidos, participações societárias e estatísticas de RJ citados na pesquisa da equipe não foram adotados como métricas verificadas deste projeto. Para apresentação pública desses números, obter fonte primária ou confirmação institucional, com data e recorte.

**Mensagem final de produto para a apresentação:** o sistema organiza evidências e ajuda a avaliar como negociar uma operação. O protótipo demonstra essa jornada; a validação de fontes, política e impacto acontece no piloto com a Krilltech.
