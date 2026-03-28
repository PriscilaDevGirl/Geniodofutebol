# Neurobit AI

## Pitch executivo

### Transformando dados de futebol em decisoes mais inteligentes

O Neurobit AI e uma plataforma de analise preditiva para futebol que combina machine learning, leitura de partidas ao vivo, motor de recomendacao, API conversacional e dashboard operacional em uma unica stack. A proposta e simples: reduzir decisao baseada em intuicao e aumentar decisao baseada em probabilidade, contexto de jogo e disciplina de risco.

Hoje o projeto ja possui um MVP funcional com treino local de modelo, integracao com feed ao vivo, analise de mercados, mesa de oportunidades, dashboard web e camada conversacional preparada para web e WhatsApp.

## O problema

O mercado esportivo e altamente fragmentado. Dados, odds, leitura tatica, contexto emocional e recomendacao operacional costumam ficar espalhados entre varias telas e fontes. Isso gera quatro dores centrais:

- excesso de ruido informacional
- pouca traducao de dados em acao pratica
- ausencia de gestao de risco contextual
- baixa integracao entre previsao, consumo e distribuicao

Na pratica, muitos usuarios acompanham o jogo, consultam odds e tomam decisao sem uma camada consistente de probabilidade, explicabilidade e filtro de risco.

## A solucao

O Neurobit AI organiza esse fluxo em cinco camadas integradas:

1. ingestao de dados historicos e ao vivo
2. engenharia de features e treino de modelos por mercado
3. inferencia probabilistica e calculo de edge/value
4. narrativa assistida para leitura humana
5. distribuicao via API, dashboard e WhatsApp

O resultado e uma plataforma que entrega:

- probabilidade por mercado
- leitura principal do jogo
- analise de risco via Zen-Guard
- detecao de tilt e sentimento de torcida
- relatorio estruturado em 12 blocos
- ranking de oportunidades ao vivo

## Produto atual

O MVP existente no repositorio cobre:

- treino local do modelo com datasets CSV e suporte a multiplas fontes
- API FastAPI com endpoints de saude, analise, oportunidades, chat e webhook
- integracao com BetsAPI para eventos, detalhes, odds e escalacoes
- integracao opcional com OpenAI para narrativa expandida
- dashboard web responsivo para analise e acompanhamento
- camada de mensagens para WhatsApp com botoes rapidos
- persistencia de snapshots e logs JSON/JSONL

## Como o Neurobit AI funciona

### 1. O sistema junta os dados

O Neurobit AI começa reunindo informações de jogos passados e de partidas ao vivo. Hoje ele consegue trabalhar com:

- arquivos CSV locais
- bases extras em `data/datasets/`
- datasets do Kaggle
- eventos ao vivo, odds e escalações pela BetsAPI

Na prática, isso significa que o produto não fica preso a uma única fonte de dados.

### 2. Ele organiza e entende esses dados

Depois de carregar as informações, o sistema transforma esses dados em sinais úteis para análise, como:

- diferença de gols
- total de gols
- frequência de empates
- força do mandante e do visitante
- média recente de gols
- desempenho recente das equipes

Essa etapa é importante porque ajuda a transformar números soltos em contexto de jogo.

### 3. Ele treina os modelos

Hoje o projeto treina `6` modelos, um para cada mercado principal:

- vitória do mandante
- empate
- vitória do visitante
- over 2.5 gols
- under 2.5 gols
- ambos marcam

Isso é positivo porque cada mercado tem um comportamento diferente. Em vez de usar uma resposta genérica para tudo, o sistema trata cada cenário de forma separada.

### 4. Ele calcula as probabilidades

Quando um jogo entra para análise, o sistema compara esse jogo com o histórico aprendido e calcula a chance de cada mercado acontecer.

Em resumo, ele faz o seguinte:

1. recebe os dados do jogo
2. organiza essas informações no formato certo
3. consulta os modelos treinados
4. devolve as probabilidades por mercado

Depois disso, ele destaca qual leitura parece mais forte naquele momento.

### 5. Ele adiciona o contexto do jogo ao vivo

Quando existe partida ao vivo, o Neurobit AI não olha só para o histórico. Ele também considera sinais do momento, como:

- placar atual
- minuto do jogo
- ataques e ataques perigosos
- cartões
- pressão da partida
- momento emocional do jogo
- status de escalação

Com isso, a resposta fica mais próxima da realidade da partida e não apenas de uma previsão fria.

### 6. Ele entrega a análise de forma simples

Depois de calcular tudo, o sistema entrega a leitura em diferentes canais:

- API
- dashboard web
- WhatsApp
- logs para histórico e auditoria

Ou seja, não é só um modelo técnico. Já existe uma experiência de produto pronta para uso.

## Arquitetura da plataforma

### Visao em camadas

```text
Datasets CSV / Kaggle / BetsAPI / WhatsApp
                |
                v
      Data loading + normalization
                |
                v
        Feature engineering + priors
                |
                v
   Random Forest por mercado de aposta
                |
                v
 Inference engine + edge/value + Zen-Guard
                |
                v
 Structured report + narrative + board
                |
                v
 FastAPI / Dashboard / WhatsApp / Logs
```

### Componentes principais

- `src/features.py`: carga de dados, normalizacao e enriquecimento contextual
- `src/model.py`: treinamento dos modelos por mercado
- `src/predictor.py`: inferencia de probabilidades
- `src/engine.py`: orquestracao, snapshot analitico e mesa de oportunidades
- `src/app.py`: API, chat, dashboard e webhook
- `src/assistant.py`: narrativa, tilt, crowd sentiment e guidance
- `src/api.py` e `src/providers/`: integracoes com dados externos
- `src/static/`: dashboard web

### Fluxo operacional

1. o sistema carrega dados historicos locais ou hibridos
2. calcula features estatisticas e priors por liga e por time
3. treina um conjunto de modelos para mercados especificos
4. consulta um evento ao vivo ou usa fallback controlado
5. gera probabilidades, edge, risco e recomendacao
6. publica a resposta em API, dashboard, WhatsApp e logs

## Tecnologia

### Stack principal

- Python 3.11+
- FastAPI para exposicao da aplicacao
- scikit-learn para machine learning
- pandas para processamento de dados
- requests para integracoes externas
- Uvicorn para execucao da API
- HTML, CSS e JavaScript no dashboard
- JSON e JSONL para rastreabilidade operacional

### Caracteristicas tecnicas

- arquitetura modular e simples de evoluir
- treino local, sem dependencia obrigatoria de nuvem
- suporte a configuracao por variaveis de ambiente
- modo simulado para operacao quando o feed ao vivo nao responde
- logs auditaveis para snapshots de analise e oportunidades

## O modelo de inteligencia

### Estrategia de modelagem

O motor atual usa Random Forest Classifier com treinamento separado por mercado. Em vez de um unico score generico, a plataforma estima probabilidade individual para cada tipo de decisao relevante.

### Mercados cobertos hoje

- vitoria do mandante
- empate
- vitoria do visitante
- over 2.5 gols
- under 2.5 gols
- ambos marcam

### Features utilizadas

O pipeline atual trabalha com sinais como:

- diferenca de gols
- total de gols
- indicador de empate
- clean sheet
- taxa media de gols da liga
- taxa media de empate da liga
- media ofensiva e defensiva por time
- taxa de vitoria em casa e fora
- desempenho recente dos ultimos jogos

### Camada de contexto ao vivo

Durante a analise de um evento, o engine acrescenta sinais operacionais como:

- minuto de jogo
- placar atual
- ataques e ataques perigosos
- cartoes
- momentum index
- pressure index
- frustration index
- status de escalacao

### Camada decisoria

A leitura final nao se resume a probabilidade bruta. O sistema calcula:

- mercado principal
- probabilidade implicita da odd
- edge
- value
- score inteligente
- nivel de risco
- stake sugerida
- filtro Zen-Guard

## APIs e integracoes

### Endpoints principais

- `GET /health`: status do servico
- `GET /dashboard`: entrega do painel web
- `POST /analyze`: snapshot analitico de um jogo
- `GET /opportunities`: mesa de oportunidades ao vivo
- `POST /chat`: interface conversacional
- `POST /whatsapp/send-test`: envio manual de teste
- `GET /webhook/whatsapp`: verificacao Meta
- `POST /webhook/whatsapp`: recebimento de mensagens

### Integracoes externas

- BetsAPI: feed ao vivo, detalhes do jogo, odds e lineup
- OpenAI: analise narrativa opcional
- Kaggle: datasets adicionais para treino
- WhatsApp Cloud API: distribuicao conversacional

### Exemplo de uso da plataforma

Um usuario pode perguntar no chat:

`quais sao as melhores oportunidades ao vivo?`

O sistema responde com:

- top oportunidades priorizadas por edge/value
- leitura de risco
- sugestoes de proximos passos
- acoes rapidas para continuar a jornada

## Dashboard

O dashboard atual nao e apenas visual; ele opera como cockpit do produto.

### Blocos do painel

- leitura atual
- risco e Zen-Guard
- melhor edge identificado
- controle de auto refresh
- resposta do assistente
- mercado principal
- contexto do jogo
- tilt e torcida
- XAI e fatores explicativos
- narrativa do jogo
- relatorio profissional estruturado
- probabilidades por mercado
- comparador por perfil de usuario
- top oportunidades ao vivo
- historico da sessao

### Valor do dashboard

- reduz tempo entre leitura e acao
- centraliza analise, risco e contexto
- facilita demonstracao comercial do produto
- abre caminho para operacao B2C e B2B

## Resposta direta aos 5 criterios da banca

### 1. Qualidade e consistencia das previsoes e analises

O principal ponto aqui é que o projeto segue um processo claro e repetível. A análise não nasce de opinião solta. Ela vem de:

- dados organizados
- indicadores calculados de forma padronizada
- modelos separados por mercado
- leitura de risco e contexto do jogo

Isso ajuda a manter a análise mais estável e coerente de um jogo para outro.

Ponto importante:

o projeto já tem uma boa base técnica, mas ainda pode evoluir com mais métricas de validação e backtests para medir desempenho com ainda mais precisão.

### 2. Clareza da visualizacao e facilidade de entendimento

O produto foi pensado para traduzir informação técnica em algo fácil de entender.

No dashboard, o cliente consegue ver:

- qual mercado está mais forte
- qual é o risco da leitura
- onde existe valor
- como está o jogo ao vivo
- quais são as probabilidades
- uma explicação em linguagem natural

Além disso, a parte conversacional ajuda bastante porque o usuário pode perguntar de forma simples e receber uma resposta mais direta.

### 3. Fundamentacao dos modelos: estatistica, ML e heuristica

O Neurobit AI não depende de um único tipo de análise. Ele junta três camadas:

- estatística, para entender o histórico e o contexto
- machine learning, para calcular probabilidades
- heurística, para transformar a leitura em decisão prática

Em outras palavras:

- a estatística ajuda a entender o padrão
- o modelo ajuda a estimar a chance
- a heurística ajuda a orientar a decisão com mais responsabilidade

Isso torna o produto mais completo e mais confiável para uso real.

### 4. Criatividade na escolha de cenarios e indicadores

O projeto não ficou preso só ao básico, como vitória, empate ou número de gols. Ele também tenta captar o momento da partida e o comportamento do jogo.

Entre os diferenciais, estão:

- leitura de pressão da partida
- momento do jogo
- sinais emocionais, como tilt e sentimento da torcida
- Zen-Guard para risco
- mesa de oportunidades ao vivo
- comparador por perfil de usuário

Essa criatividade é importante porque mostra que o produto pensa na decisão como um todo, e não só no dado bruto.

### 5. Viabilidade tecnica e potencial de evolucao do produto

Esse é um ponto forte porque o projeto já funciona como MVP real.

Hoje ele já tem:

- API
- dashboard
- modelos treinados
- integração com dados ao vivo
- WhatsApp
- estrutura modular

Isso mostra que não é apenas uma ideia. Já existe uma base concreta para crescer.

O potencial de evolução também é claro:

- melhorar a validação dos modelos
- ampliar mercados e indicadores
- adicionar notificações em tempo real
- criar experiências mais personalizadas
- expandir para novos esportes e parceiros B2B

Em resumo, o projeto já está em um estágio em que pode ser apresentado como produto e também como plataforma em evolução.

## Diferenciais competitivos

- modelo por mercado em vez de uma resposta unica generica
- combinacao de estatistica, contexto ao vivo e camada narrativa
- filtro de risco embutido no fluxo de recomendacao
- arquitetura pronta para API, painel e mensageria
- operacao local com rastreabilidade simples

## Modelo de negocio

### Frentes de monetizacao

- assinatura premium para usuarios finais
- licenciamento de API para plataformas e parceiros
- dashboard white-label para operacoes de analise
- consultoria e projetos especiais para clubes, midia e betting tech

### Possivel estrutura comercial

- plano starter: acesso ao dashboard e leituras basicas
- plano pro: oportunidade ao vivo, relatorio completo e comparador de perfis
- plano business: API, webhook, integrações customizadas e white-label

## Mercado

O posicionamento do Neurobit AI fica na intersecao entre:

- sports analytics
- betting intelligence
- decision support systems
- conversational AI para operacao esportiva

Oportunidade de entrada:

- creators e analistas independentes
- comunidades premium de futebol
- afiliados e operacoes de conteudo
- plataformas que desejam enriquecer experiencia com IA

## Roadmap sugerido

### Curto prazo

- consolidar metricas de performance do modelo
- ampliar cobertura de datasets
- tornar o board mais robusto por liga e mercado
- reforcar testes automatizados

### Medio prazo

- ranking de value bets com historico
- score de confianca calibrado
- autenticacao e perfis de usuario persistentes
- notificacoes em tempo real

### Longo prazo

- suporte a multiplos esportes
- arquitetura multi-tenant
- recomendacao personalizada por perfil e banca
- analytics B2B com SLA e observabilidade

## Riscos e mitigacao

### Riscos atuais

- dependencia da qualidade dos dados externos
- modelo ainda simples para cenarios de alta variabilidade
- cobertura incompleta de informacoes como clima, arbitragem e noticias
- projeto ainda sem suite ampla de testes automatizados

### Mitigacoes

- fallback simulado para continuidade operacional
- marcacao explicita de campos nao disponiveis
- logs persistidos para auditoria
- arquitetura modular que facilita refinamento incremental

## Tese de investimento

O Neurobit AI nao e apenas um modelo de previsao. E uma base de produto para transformar dado esportivo em camada operacional de decisao. O MVP ja demonstra:

- capacidade de ingestao e inferencia
- distribuicao multicanal
- componente visual de produto
- potencial de monetizacao por assinatura e API
- caminho claro para evolucao tecnica e comercial

Com investimento direcionado em dados, calibracao, UX, testes e distribuicao, o projeto pode evoluir de MVP funcional para plataforma de inteligencia esportiva com proposta clara para usuarios finais e parceiros B2B.

## Encerramento

Neurobit AI e a ponte entre dado bruto, leitura probabilistica e decisao acionavel no futebol. O ativo principal do projeto e a combinacao de arquitetura simples, produto demonstravel e capacidade de evolucao rapida.

Em resumo:

- ja existe um produto funcional
- a arquitetura suporta crescimento
- a narrativa comercial e clara
- o espaco de mercado e real
- a execucao pode escalar por modulos
