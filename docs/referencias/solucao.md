# Solução — Sistema de Due Diligence e Alerta Precoce de Risco de Crédito no Agronegócio

**Hackathon PMI-DF 2026 — Desafio Krill Tech**
Documento consolidado de solução e decisões.

---

## 1. Sumário executivo

A Krilltech vende inovação em nanotecnologia agrícola, mas cada venda com prazo, barter ou
CPR é também uma operação de crédito. Num momento em que o agronegócio brasileiro enfrenta
uma escalada de pedidos de Recuperação Judicial, a diferença entre recuperar um recebível e
vê-lo travado por anos num plano com deságio está em agir antes do protocolo do pedido —
porque a partir do deferimento o stay period impede qualquer ação de cobrança.

Nossa solução é um sistema de due diligence automatizada e alerta precoce que cruza sinais
públicos de deterioração processual, societária, fiscal, ambiental e agronômica de um
cliente, e traduz isso não em um veredito binário de aprovação, mas em uma **recomendação de
como a Krilltech pode continuar fazendo negócio com aquele cliente dentro do seu próprio
portfólio de modalidades comerciais**.

Cada conclusão é auditável até a fonte que a originou. Não é caixa-preta e não é um score de
crédito genérico: é desenhado em torno de como a Krilltech especificamente vende, para quem,
e sob quais formatos de risco ela já opera.

**A frase do pitch:** a Krilltech não precisa saber quem vai quebrar; precisa saber como
vender para quem talvez quebre.

---

## 2. O cliente: a Krilltech

Agtech e deep tech brasileira, spin-off de pesquisa em nanotecnologia de carbono nascida da
colaboração entre UnB e Embrapa. Usa nanopartículas de carbono (Carbon Dots) para sinalizar
processos fisiológicos da planta, aumentando eficiência no uso de luz, água e nutrientes.

| Produto | Cultura / uso |
|---|---|
| Arbolina / Arbolin Biogenesis | Multiculturas — primeira solução comercial |
| KrillGrowth | Cana-de-açúcar |
| KrillBloom | Algodão |
| KrillSet | Citros |

**Como vende:** modelo híbrido B2C (produtor final, cerca de 210 clientes em 18 estados) e
B2B (agroindústrias, distribuidores), com canal relevante via Casa Bugre (também acionista,
24%) e expansão internacional via parceria com a Biorizon Biotech na Europa. Venda
consultiva e técnica, com recomendação por cultura e acompanhamento agronômico.

**O que importa para o nosso problema:** parte das vendas não é liquidada à vista. Três
modalidades expõem a empresa a riscos de natureza diferente:

- **Venda a prazo convencional** — risco de crédito clássico.
- **Barter** — insumo entregue no plantio, pago com parte da safra. O risco de crédito vira
  risco agronômico: não basta o cliente querer pagar, a safra precisa existir.
- **CPR** — título lastreado na entrega futura; o risco depende da capacidade produtiva que
  lastreia o título, não só do cadastro do emissor.

O mesmo sinal pesa de forma diferente em cada modalidade. Um embargo ambiental é grave
sempre, mas é crítico em barter, porque pode impedir fisicamente a colheita que seria a
forma de pagamento.

---

## 3. A dor e a janela de ação

O agro brasileiro, historicamente de baixa inadimplência, está em ciclo de reestruturação
financeira sem precedentes. A Serasa Experian registrou 474 pedidos de RJ no agro apenas no
primeiro trimestre de 2026, alta de 21,9% sobre o mesmo período de 2025. Três causas:

1. **Marco legal.** A Lei 14.112/2020 estendeu a RJ ao produtor rural pessoa física. O
   histórico de inadimplência do setor deixou de prever o comportamento futuro, porque o
   instrumento jurídico mudou.
2. **Pressão de margem.** Instabilidade climática, custo de insumos e queda de commodities
   estrangularam a liquidez de produtores sólidos em ciclos anteriores.
3. **Efeito cascata.** A inadimplência do produtor contamina distribuidores, revendas e
   fornecedores de tecnologia — categoria em que a Krilltech se enquadra.

**O núcleo do problema não é a inadimplência financeira, é a inadimplência técnica que a
precede.** Sinais como protesto, execução distribuída, alteração societária ou embargo
aparecem antes de qualquer atraso.

### 3.1 As regras jurídicas que definem o produto

Três regras governam tudo e precisam estar dominadas para o Q&A:

**A data do pedido é a linha de corte.** O artigo 49 sujeita à RJ todos os créditos
existentes na data do pedido, ainda que não vencidos. Consequência contraintuitiva: o que
for vendido depois do pedido é extraconcursal, pago normalmente, fora do plano.

**O stay period só começa no deferimento.** São 180 dias, prorrogáveis por igual período uma
única vez, contados do deferimento do processamento e não do protocolo. Pode chegar a 360
dias. Credores extraconcursais não são alcançados, mas constrições sobre bens de capital
essenciais seguem bloqueadas. Esgotado o prazo, o juízo não pode mais barrar a satisfação de
crédito extraconcursal invocando preservação da empresa.

**O instrumento decide se o crédito entra na fila.**

| Entra no plano, sofre deságio | Fica de fora, extraconcursal |
|---|---|
| Duplicata e venda a prazo simples | Alienação fiduciária |
| CPR financeira sem alienação fiduciária | CPR física e barter (art. 11 da Lei 8.929/94, redação da Lei 14.112/2020) |
| Crédito com penhor comum | Venda realizada após a data do pedido |

Duas nuances relevantes: quando o penhor agrícola está dentro de uma CPR, a jurisprudência
tem tratado como extraconcursal pela regra específica da Lei da CPR; e o STJ já entendeu que
soja e milho não são bens de capital essenciais, de modo que garantia sobre a safra é mais
executável que garantia sobre o maquinário.

### 3.2 Especificidades do produtor rural pessoa física

- Pode pedir RJ sem CNPJ desde a Lei 14.112/2020 (STJ, Tema 1.145), comprovando dois anos de
  atividade e estando inscrito na Junta Comercial no momento do pedido.
- Só se sujeitam à RJ os créditos que constarem na contabilidade do devedor.
- Dívida constituída nos três anos anteriores para aquisição de propriedade rural fica fora.
- Há plano especial simplificado para dívidas sujeitas de até R$ 4,8 milhões.

**Implicação de produto:** a inscrição na Junta Comercial por um produtor pessoa física que
nunca teve registro é pré-requisito para protocolar RJ e exige dois anos de comprovação.
É, portanto, um sinal antecedente forte, público e verificável.

---

## 4. Decisão de escopo: o marco do CNPJ obrigatório

A obrigatoriedade de CNPJ para produtor rural não vem de uma lei de abril de 2026. Vem da
**Lei Complementar 214/2025** (Reforma Tributária), cujo artigo 59 estabeleceu identificação
única por CNPJ para pessoas com atividade econômica e determinou o fim da Inscrição Estadual
até 31/12/2032. O formato alfanumérico foi criado pela **IN RFB 2.229/2024**, valendo para
novas inscrições a partir de julho de 2026. Em **30 de abril de 2026** foram publicados os
regulamentos definitivos do IBS e da CBS (Decreto 12.955/2026 e Resolução CGIBS 6/2026).

Três consequências que assumimos explicitamente:

**O prazo escorregou.** A Receita estendeu a inscrição no CNPJ para 1º de janeiro de 2027
para produtores com receita anual de até R$ 3,6 milhões, porque o sistema simplificado de
inscrição só fica disponível em novembro. Durante 2026 a cobertura por CNPJ é parcial,
justamente nos produtores menores.

**Ter CNPJ não transforma o produtor em pessoa jurídica.** Ele segue pessoa física para
efeitos fiscais e, principalmente, para efeitos de Recuperação Judicial. Todo o regime da
seção 3.2 continua valendo. Mudou o identificador, não o regime.

**Armadilha de modelagem (decisão registrada):** haverá milhões de CNPJs com idade zero
pertencentes a produtores que operam há décadas. **O pilar cadastral do nosso score não pode
usar a data de abertura do CNPJ como proxy de maturidade para produtores migrados da
inscrição estadual.** O sistema desconta esse fator e usa tempo de inscrição estadual ou de
CAR como referência alternativa.

**Decisão de escopo:** o MVP opera por CNPJ, que passa a ser a chave única de junção entre
Receita, PGFN, judiciário e CAR. Produtores ainda não migrados são tratados na fase 2, com
CPF, inscrição estadual e CAR como chaves auxiliares.

---

## 5. A solução: o que é e o que não é

**O que é:** um sistema que consulta fontes públicas de risco sobre um cliente, calcula um
indicador determinístico (score 0–1000, rating A–D), explica cada sinal encontrado em
linguagem de negócio com a fonte citada, e gera uma recomendação de como estruturar a próxima
operação comercial com aquele cliente.

**O que não é:**

- **Não é caixa-preta.** Toda conclusão é rastreável até o dado de origem.
- **Não é um gatilho de aprovar ou reprovar.** O sistema nunca decide "faça ou não faça
  negócio"; decide "dado esse risco, qual das modalidades que a Krilltech já pratica é a mais
  adequada agora".
- **Não é score de crédito genérico.** É desenhado sobre o vocabulário comercial real da
  empresa: CPR, barter, alienação fiduciária contra penhor.

**Entrada do sistema (decisão importante):** a consulta não é apenas o CNPJ. É CNPJ **mais a
modalidade pretendida, o valor e o prazo**. Um bureau devolve um número sobre a empresa; nós
devolvemos uma recomendação sobre a operação. Essa diferença precisa estar visível na tela da
demonstração.

---

## 6. Os três pilares de diferenciação

Ordem deliberada: primeiro por que alguém quereria isso, depois por que só nós conseguimos
fazer, e só então por que dá para confiar.

### Pilar 1 — Orientar como negociar, não se negociar

Não construímos um gate de aprovação de crédito. Construímos uma ferramenta que responde:
dado o risco atual deste cliente, qual das modalidades comerciais que a Krilltech já pratica
é a mais segura para esta operação específica?

O mesmo cliente, com o mesmo score, pode ser uma operação aceitável de uma forma e inviável
de outra.

> **Caso âncora da demonstração.** Cliente com rating C e embargo ambiental ativo não deve ser
> simplesmente recusado. A recomendação correta é: barter desaconselhado enquanto o embargo
> não for esclarecido, porque a colheita que pagaria a dívida pode não existir; venda à vista
> segue viável; venda a prazo pode prosseguir mediante migração da garantia de penhor para
> alienação fiduciária, que permanece fora dos efeitos de uma eventual RJ.

O sistema ajusta modalidade, prazo e garantia; não veta relacionamento comercial. A decisão
final continua humana; a ferramenta amplia as opções visíveis em vez de reduzi-las a um
sim ou não.

### Pilar 2 — Especializada na Krilltech

A base de conhecimento que fundamenta cada explicação foi escrita sobre o vocabulário e a
realidade comercial específicos da empresa: barter e CPR, a distinção entre alienação
fiduciária e penhor, e a gravidade diferenciada de um embargo ambiental conforme a
modalidade. Uma solução genérica trata todos esses sinais com o mesmo peso; a nossa não.

### Pilar 3 — Transparência e auditabilidade

Todo relatório gerado por LLM traz risco de alucinação. A arquitetura resolve isso
estruturalmente:

- **O score e o rating nunca são calculados pelo LLM.** São resultado de função determinística
  sobre os fatos coletados. O papel do LLM é narrar uma decisão já tomada pelo código.
- **Toda explicação é ancorada** a uma fonte identificável mais a definição correspondente na
  base de conhecimento, nunca gerada livremente.
- A saída passa por camada de verificação que audita cada afirmação contra o texto de origem,
  e pela métrica de **Faithfulness do watsonx.governance**.
- Cada ativo de IA é documentado como caso de uso governado, com histórico de qual dado e qual
  versão da política embasou cada relatório.

**Limite assumido publicamente:** Faithfulness mede fidelidade ao contexto fornecido, não
veracidade do contexto. Se a fonte estiver desatualizada, o texto passa no teste e ainda assim
induz a erro. Por isso cada sinal do relatório carrega carimbo de fonte e data de coleta, e a
atualidade é tratada como problema separado da alucinação.

---

## 7. Fontes de dado — decisão do MVP

Critério de seleção: **antecedência do sinal**, não facilidade de acesso. A promessa do
produto é tempo, então uma fonte que só acende junto com o evento não sustenta a palavra
"precoce".

### 7.1 Classificação por antecedência

| Fonte | Antecedência típica | Acesso | Status |
|---|---|---|---|
| Comportamento transacional interno da Krilltech | 6 a 18 meses | Interno | Fase 2 |
| Alteração societária e abertura de empresa do mesmo grupo | 6 a 18 meses | CNPJ Abertos, grátis | **MVP** |
| Protesto de títulos | 3 a 9 meses | CENPROT | **MVP** |
| Distribuição de execução, busca e apreensão, monitória | 3 a 12 meses | DataJud (CNJ), API pública | **MVP** |
| Inscrição na Junta Comercial por produtor PF sem registro | 12 a 24 meses | Junta / Redesim | **MVP** |
| ZARC cruzado com cultura e região do cliente | 3 a 6 meses | MAPA, grátis | **MVP** |
| Registro de CPR para múltiplos credores | 3 a 12 meses | Registradoras, acesso a validar | Fase 2 |
| SCR do Banco Central | 3 a 12 meses | Mediante autorização do titular | Fase 2 |
| Situação cadastral e indicação de RJ ou falência | 0 a 3 meses | Receita Federal | **MVP** |
| Dívida Ativa (PGFN) | frequentemente tardio | Grátis | **MVP**, confirmatório |
| Débito de FGTS | tardio, exige folha formal | Grátis | **MVP**, confirmatório |
| Embargo ambiental (IBAMA) | variável, raro | Grátis | **MVP**, crítico em barter |
| Bases processuais agregadas pagas | 3 a 12 meses | Custo por consulta | Fase 3, sob gatilho |

### 7.2 Decisões registradas

**Sinal antecedente e sinal confirmatório têm papéis diferentes.** Dívida Ativa, FGTS e
situação cadastral entram no score porque descrevem o estado atual, mas **não disparam o
alerta precoce sozinhos** — quando acendem, boa parte da janela já passou. O Alerta Precoce é
disparado pelos sinais antecedentes: protesto, execução distribuída, alteração societária e
inscrição na Junta Comercial.

**ZARC é requisito, não enfeite.** Sem fonte agronômica, a recomendação sobre barter seria uma
afirmação sem motor, já que barter depende de a safra existir. Com ZARC, o sistema consegue
dizer que o cliente está em região com risco climático classificado para aquela cultura
naquela janela de plantio, e que portanto barter é a modalidade errada para ele agora.

**Arquitetura de custo em camadas.** Fase 1 opera integralmente sobre fontes gratuitas e
determinísticas, aplicadas continuamente a toda a carteira. Fontes pagas entram apenas sob
gatilho, quando um sinal antecedente já acendeu. Isso mantém o custo por cliente monitorado
previsível e justifica a exclusão das bases agregadas do MVP como decisão consciente, não
como limitação.

**SCR como funcionalidade de onboarding.** A autorização do titular para consulta ao SCR passa
a fazer parte do cadastro do cliente. A recusa em autorizar é, ela própria, um sinal.

---

## 8. Motor de score e rating

### 8.1 Pesos por pilar

Duas configurações, porque o MVP não tem dado interno e a fase 2 tem.

**MVP, apenas fontes públicas**

| Pilar | Peso |
|---|---|
| Processual e jurídico | 30% |
| Societário e cadastral | 20% |
| Agronômico e climático | 20% |
| Fiscal e trabalhista | 15% |
| Ambiental | 15% |

**Fase 2, com dado transacional da Krilltech**

| Pilar | Peso |
|---|---|
| Processual e jurídico | 25% |
| Comportamento transacional interno | 25% |
| Societário e cadastral | 15% |
| Agronômico e climático | 15% |
| Fiscal e trabalhista | 10% |
| Ambiental | 10% |

### 8.2 Faixas e decisão

| Faixa | Rating | Postura |
|---|---|---|
| 800 a 1000 | A | Todas as modalidades liberadas, garantia padrão |
| 600 a 799 | B | Prazo reduzido, garantia reforçada |
| 400 a 599 | C | Restrição de modalidade, garantia extraconcursal obrigatória |
| 0 a 399 | D | À vista ou operação suspensa, aciona jurídico |

### 8.3 Gatilhos de sobrescrita

Eventos discretos que **não entram na média ponderada** e derrubam o rating para D
diretamente, porque uma média suaviza exatamente o sinal que importa:

- Pedido ou deferimento de RJ, ou falência, no cliente ou em empresa do mesmo grupo societário
- Protesto acima do valor de corte definido pela Krilltech
- Embargo ambiental ativo sobre a área que lastreia a operação de barter ou CPR

### 8.4 Calibração

O score é determinístico, o que responde **como** ele é calculado. A origem dos pesos é uma
questão separada e tem resposta própria:

- Os pesos vêm de julgamento de especialista da Krilltech somado à gravidade jurídica de cada
  sinal, e estão versionados e visíveis na interface.
- A fase de modo sombra (31 a 90 dias do roadmap) existe para confrontar os pesos com o
  desfecho real antes que valham decisão automática.
- Cada override registrado pelo analista é insumo de recalibração: divergência sistemática
  entre sistema e analista é sinal de peso mal ajustado.
- **Teste de sensibilidade obrigatório:** variar cada peso em dez pontos e verificar se o
  rating do caso de exemplo muda. Se mudar, o modelo é frágil e precisa de ajuste antes do
  pitch.

---

## 9. Recomendação de modalidade comercial

A saída do sistema é uma matriz, não um veredito.

| Rating | À vista | A prazo | Barter | CPR |
|---|---|---|---|---|
| A | Livre | Livre, garantia padrão | Livre se ZARC favorável | CPR física ou financeira |
| B | Livre | Prazo reduzido, alienação fiduciária | Condicionado ao ZARC da cultura e região | CPR física preferível |
| C | Livre | Somente com alienação fiduciária e prazo curto | Desaconselhado | Somente CPR física, garantia sobre a safra |
| D | Única modalidade viável | Suspenso | Suspenso | Suspenso |

Regras adicionais que sobrepõem a tabela:

- Embargo ambiental ativo sobre a área bloqueia barter e CPR física independentemente do
  rating, porque compromete fisicamente a colheita.
- Sempre que houver escolha entre penhor e alienação fiduciária, o sistema recomenda
  alienação fiduciária, que permanece fora dos efeitos da RJ.
- Garantia sobre safra é preferível a garantia sobre maquinário, porque o STJ entende que
  grãos não são bens de capital essenciais e portanto não são protegidos pela trava de
  essencialidade durante o stay period.

---

## 10. Visibilidade de exposição da carteira

**Decisão registrada:** não temos hoje os números de exposição da Krilltech — percentual do
faturamento vendido a prazo, barter ou CPR, prazo médio, inadimplência histórica e
concentração nos dez maiores clientes. E isso não é uma lacuna do pitch: **é exatamente uma
das coisas que o sistema passa a entregar.**

Hoje a decisão de crédito é tomada sem que ninguém na empresa consiga dizer quanto está
exposto e quanto dessa exposição está juridicamente protegida. A partir da integração com os
dados internos, o sistema calcula e mantém:

```
Exposição em aberto  =  faturamento no período
                        × % vendido a prazo, barter ou CPR
                        × (prazo médio em dias ÷ 365)

Perda esperada       =  exposição × probabilidade de default × perda dado o default
```

E apresenta a exposição **decomposta em duas partes**, que é a informação que hoje não existe
em lugar nenhum:

- **Exposição protegida** — lastreada em alienação fiduciária, CPR física ou barter, que
  permaneceria extraconcursal em caso de RJ.
- **Exposição sujeita** — duplicata simples, CPR financeira sem garantia real, que entraria no
  plano com deságio.

Somado a isso, exposição consolidada por **grupo econômico** (via quadro societário) e
concentração dos maiores clientes no total a receber. A perda real não é probabilidade de
default sozinha: é probabilidade multiplicada pela perda dado o default, e essa segunda parte
depende inteiramente do instrumento. Um sistema que devolve apenas rating está entregando
metade da conta.

---

## 11. Como funciona — visão do analista

1. O analista busca o cliente e informa **a operação pretendida**: modalidade, valor e prazo.
2. Seleciona a empresa correta na lista de resultados.
3. O sistema apresenta o **Relatório Padronizado de Risco de Crédito**: rating, os sinais
   encontrados explicados em linguagem de negócio com a fonte e a data de cada um e, se o
   rating for crítico ou houver RJ, um **Alerta Precoce** destacado.
4. Abaixo, a **recomendação de modalidade comercial**: qual estrutura e qual garantia fazem
   sentido para aquele cliente agora, dado o risco identificado.
5. O analista aprova, ajusta ou registra um override, que fica no histórico auditável e
   alimenta a recalibração.
6. Para clientes ativos, a mesma engrenagem roda periodicamente e alerta proativamente quando
   um novo sinal aparece.

### Conteúdo do relatório de uma página

- Score, rating e **variação desde a última consulta** — a seta importa mais que o número
- Os três a cinco sinais que mais puxaram o score para baixo, em linguagem natural, com fonte
  e data
- Recomendação operacional: modalidade, limite, prazo e instrumento de garantia
- Exposição atual com o cliente, separada entre protegida e sujeita
- Grupo econômico conectado e status de cada integrante

---

## 12. Arquitetura técnica

```
[Web] Analista busca cliente + informa modalidade, valor e prazo
        │
        ▼
1. CONSULTAR FONTES — skill determinística (watsonx Orchestrate)
   Sinais antecedentes (protesto, distribuição processual, alteração
   societária, Junta Comercial, ZARC) e confirmatórios (cadastral,
   PGFN, FGTS, IBAMA) → fatos brutos, cada um com fonte e data
        │
        ▼
2. CALCULAR INDICADORES — Motor de Scoring (código, sem LLM)
   fatos → códigos de red flag → score 0–1000 → rating
   → gatilhos de sobrescrita aplicados fora da média
        │
        ▼
3. EXPLICAR SINAIS — RAG determinístico por chave + Sintetizador
   Cada código busca sua definição e gravidade na Base de Conhecimento
   da Krilltech; o Agente Sintetizador (watsonx.ai, construído com
   IBM Bob) narra o que é, por que importa e a ação recomendada,
   sempre citando a fonte
        │
        ▼
4. ALERTAR — composição do Relatório + banner de Alerta Precoce
        │
        ▼
5. RECOMENDAR MODALIDADE — segunda recuperação na Base de Conhecimento
   (Ação Recomendada, Barter, CPR, Garantias) cruzada com a operação
   informada → recomendação de estrutura comercial
        │
        ▼
[Web] Analista aprova, ajusta ou registra override
        │
        ▼
Trilha de auditoria completa (watsonx.governance)
```

**Onde cada ferramenta IBM entra:**

- **watsonx Orchestrate** encadeia os passos 1 a 5 como fluxo único, exposto como uma chamada
  que a aplicação dispara. É também onde fica o gate de aprovação humana: rating D ou exposição
  alta pausam o fluxo e exigem validação antes de qualquer ação automática.
- **IBM Bob** construiu o Agente Sintetizador a partir de um contrato de entrada e saída bem
  definido (score e red flags para relatório estruturado). Existe caminho alternativo via SDK
  do watsonx.ai.
- **RAG determinístico por chave, não busca vetorial.** Cada código de red flag aponta para a
  seção exata da Base de Conhecimento. Elimina o risco de recuperação incorreta e mantém o
  processo auditável. Essa é uma decisão arquitetural deliberada, não uma simplificação.
- **watsonx.governance** avalia cada texto gerado com Faithfulness e documenta o Motor de
  Scoring e o Sintetizador como ativos de IA versionados.

**Decisão de modelagem registrada:** o pilar societário e cadastral não usa a data de abertura
do CNPJ como proxy de maturidade, pela razão exposta na seção 4.

---

## 13. Escopo do hackathon

Implementamos funcionalmente **apenas o Agente Sintetizador** (passos 3 e 5), que é o mais
visual numa demonstração ao vivo e o que mais evidencia IA generativa aplicada. Os demais
componentes estão representados conceitualmente neste documento e no Canvas, sustentados por
casos de exemplo gerados de forma controlada — um de baixo risco, um de risco moderado e um
alerta de RJ — preservando a mesma lógica que rodaria em produção.

O desafio não exige implementação funcional do sistema em código, e os entregáveis avaliados
são o Project Canvas e o pitch.

---

## 14. Roadmap

| Fase | Prazo | Entrega |
|---|---|---|
| Fundação | 0–30 dias | Inventário de carteira, identificador único de cliente e grupo, definição formal de default e RJ |
| MVP em modo sombra | 31–90 dias | Integração de dados internos, relatório rodando em paralelo à decisão atual, sem automatizar efeito, calibração dos pesos contra desfecho real |
| Piloto controlado | 3–6 meses | Aplicação em segmento ou região com limite de exposição, alertas ativos, treinamento dos analistas |
| Escala | 6–12 meses | Ampliação de fontes (SCR, registro de CPR, bases pagas sob gatilho), automação de decisões de baixo risco, revalidação contínua |

---

## 15. Premissas, restrições e riscos

**Premissas**

- A Krilltech possui histórico próprio de vendas, pagamentos e inadimplência utilizável
  (premissa crítica: dela depende a fase 2 inteira)
- Clientes identificáveis por CNPJ, com CPF, inscrição estadual e CAR como chaves auxiliares
- Bases públicas seguem abertas e acessíveis por API
- A Krilltech aceita alterar política comercial com base na recomendação
- Há acesso a um especialista de crédito da empresa para validar as regras

**Restrições**

- Não é exigida implementação funcional em código durante o hackathon
- Entregáveis limitados a Project Canvas de uma página e pitch
- Decisão automatizada de crédito exige explicabilidade sob a LGPD
- Tratamento de dado pessoal de produtor pessoa física exige base legal
- Cobertura irregular dos diários de justiça em comarcas pequenas
- Consultas em bases processuais pagas têm custo por requisição

**Riscos e mitigações**

| Risco | Mitigação |
|---|---|
| Falso positivo corta cliente bom e entrega ao concorrente | Saída não binária: recomendação de estrutura em vez de recusa |
| Falso negativo perde a janela pré-RJ | Gatilhos de sobrescrita fora da média ponderada |
| Histórico insuficiente para backtest | Validação inicial somente com sinais públicos |
| Latência de publicação processual | Redundância de fontes e carimbo de data por sinal |
| Resistência do time comercial por conflito com meta | Posicionar como habilitador de venda protegida, não como bloqueio |
| Dependência de fornecedor único de dado processual | Arquitetura com fonte substituível |
| Mudança legislativa altera a sujeição de créditos | Regras de instrumento parametrizáveis, não fixas no código |
| Modelo não explicável barrado pelo jurídico | Score decomponível por pilar, pesos visíveis |
| CNPJs novos de produtores antigos distorcem o pilar cadastral | Desconto explícito da data de abertura para migrados |

---

## 16. Perguntas prováveis da banca

**"Isso não é o Serasa com outro nome?"** A entrada do sistema não é só o CNPJ, é o CNPJ mais
a modalidade, o valor e o prazo. Bureau devolve um número sobre a empresa; nós devolvemos uma
recomendação sobre a operação. E a base de conhecimento fala barter, CPR e alienação
fiduciária, vocabulário que uma solução genérica não tem.

**"E o falso positivo?"** O sistema nunca recusa; ele reestrutura. O custo do erro cai porque
a saída não é binária.

**"O Faithfulness resolve alucinação?"** Resolve aderência ao contexto, não veracidade do
contexto. Atualidade é tratada separadamente, por carimbo de fonte e data em cada sinal.

**"Por que o peso do pilar processual é 30 e não 20?"** Julgamento de especialista mais
gravidade jurídica, pesos versionados e visíveis, e modo sombra para confrontar com desfecho
real antes de valer decisão.

**"Quanto custa?"** Triagem contínua sobre fontes gratuitas em toda a carteira; consulta paga
apenas sob gatilho. Custo por cliente monitorado previsível por construção.

**"Como valida que funciona?"** Backtest sobre a base histórica da Krilltech e operação em
modo sombra por 60 dias antes de qualquer automação.

**"E se o analista ignorar a recomendação?"** O override fica registrado na trilha auditável e
vira insumo de recalibração.

---

## 17. Arco do pitch

1. **Abertura** — a assimetria do stay period em uma frase. Depois do protocolo, a Krilltech
   só assiste. Todo o valor está no intervalo anterior.
2. **O cliente concreto** — Krilltech, nanotecnologia, cerca de 210 clientes, vendas em barter
   e CPR. Prova que houve pesquisa real.
3. **A virada** — não aprovamos nem reprovamos; recomendamos como vender.
4. **A demonstração** — o caso do rating C com embargo ambiental. Mesmo cliente, mesmo score,
   três respostas diferentes conforme a modalidade. Esse é o clímax.
5. **Por que dá para confiar** — score determinístico, LLM só narra, RAG por chave,
   governança e trilha de auditoria.
6. **Fechamento** — roadmap e a frase: o objetivo não é fechar a porta para clientes em
   dificuldade; é abrir a porta certa, na estrutura certa, no momento em que ainda é
   juridicamente possível agir.

---

## 18. Decisões em aberto

- [ ] Objetivo SMART final, com prazo e métrica escolhidos
- [ ] Valor de corte do protesto que dispara sobrescrita para D
- [ ] Confirmar disponibilidade e formato de acesso ao CENPROT e ao DataJud
- [ ] Validar acesso ao registro de CPR nas registradoras
- [ ] Definir a lista final de códigos de red flag da Base de Conhecimento
- [ ] Rodar o teste de sensibilidade dos pesos antes do pitch
- [ ] Composição nominal da equipe e papéis
- [ ] Formato e duração do pitch, a confirmar com a organização
