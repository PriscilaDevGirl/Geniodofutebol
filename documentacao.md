# Documentacao Tecnica para Jurados

## 1. Resumo executivo

O **Gênio do Futebol / Neurobit AI** e um assistente digital de analise esportiva focado em transformar dados de jogo em **contexto, interpretacao e suporte a decisao**. Em vez de exibir numeros crus, a plataforma combina:

- ingestao de dados historicos e ao vivo;
- modelos estatisticos e heuristicas;
- camada explicativa em linguagem natural;
- visualizacoes orientadas a leitura rapida;
- interface conversacional para reduzir friccao de uso.

O produto foi concebido para atender exatamente ao nucleo do desafio: **explicar o que pode acontecer em uma partida e por que isso faz sentido**, e nao apenas listar metricas.

## 2. O desafio e como a solucao atende

### O que o desafio pede

O edital busca:

- um assistente de analise esportiva;
- previsoes e cenarios interpretaveis;
- clareza visual;
- fundamentacao tecnica;
- potencial real de evolucao para produto.

### O que o projeto entrega hoje

O projeto ja entrega:

- previsao probabilistica para mercados de resultado e gols;
- leitura contextual de jogo ao vivo com base em placar, minuto, ataques, cartoes e odds;
- explicacao em linguagem natural do momento da partida;
- priorizacao visual de mercados e oportunidades;
- painel do Brasileirao com status dos times, rodada, artilharia, noticias e insights;
- chat que responde em linguagem simples e guiada;
- integracao com BetsAPI para eventos ao vivo;
- monitoramento e persistencia de snapshots em JSON.

### Conclusao de aderencia

**Sim, a solucao atinge o objetivo central do desafio.**

Ela entrega uma experiencia digital que funciona como um **assistente interpretativo de analise esportiva**, com previsoes, cenarios, contexto e camada visual.

### Ajuste recomendado para aderencia maxima ao edital

Para ficar ainda mais forte perante a banca, existe um refinamento importante que ja foi incorporado ao produto:

- hoje o sistema cobre muito bem **vencedor, empate, over/under e ambas marcam**;
- para aderencia total aos exemplos citados no edital, a solucao agora tambem expoe probabilidades explicitas para:
  - probabilidade de gol nos proximos minutos;
  - probabilidade de cartao;
  - probabilidade de penalti.

Ou seja: **o desafio foi atingido no nucleo interpretativo e tambem nos cenarios exemplificados pelo edital**, combinando mercados classicos com sinais contextuais dedicados.

## 3. Criterios de avaliacao: como atendemos

### 3.1 Qualidade e consistencia das previsoes e analises

Atendemos com:

- modelos supervisionados por mercado;
- features historicas por time e por liga;
- uso de odds e contexto ao vivo;
- heuristicas de risco e consistencia;
- priorizacao do melhor mercado com edge.

### 3.2 Clareza da visualizacao e facilidade de entendimento

Atendemos com:

- tela inicial orientada a confrontos;
- painel do Brasileirao com cards e tabelas;
- chat com respostas explicativas;
- barras de probabilidade;
- cards de sentimento, risco, edge e oportunidade;
- linguagem nao tecnica para o usuario final.

### 3.3 Fundamentacao dos modelos

Atendemos com:

- engenharia de features historicas;
- Random Forest para classificacao por mercado;
- calculo de probabilidades implicitas e edge;
- heuristicas explicaveis para tilt, risco e sentimento;
- possibilidade de enriquecimento com datasets externos.

### 3.4 Criatividade na escolha de cenarios e indicadores

Atendemos com:

- Zen Guard para disciplina de exposicao;
- tilt emocional do jogo;
- leitura de pressao da torcida;
- narrativas automaticas;
- radar da rodada e insights do Brasileirao.

### 3.5 Viabilidade tecnica e potencial de evolucao

Atendemos com:

- arquitetura modular;
- API desacoplada do frontend;
- monitoramento por snapshots;
- integracao pronta com fontes externas;
- stack moderna e facilmente escalavel;
- roadmap claro para MVP comercial.

## 4. Arquitetura da solucao

### 4.1 Visao geral

O sistema segue uma arquitetura em camadas:

1. **Coleta de dados**
   BetsAPI para eventos ao vivo, odds, lineup e agenda.
2. **Dados historicos**
   CSVs locais e datasets adicionais via Kaggle/arquivos compativeis.
3. **Feature engineering**
   Criacao de features de gols, forma, taxa de empate, desempenho por time e liga.
4. **Modelagem**
   Treinamento de modelos por mercado.
5. **Engine de interpretacao**
   Junta probabilidade, odds, edge, risco e narrativa.
6. **API**
   Explica e expõe os resultados para chat, dashboard e painel web.
7. **Frontend**
   Converte o resultado tecnico em experiencia visual e conversacional.

### 4.2 Diagrama resumido

```text
Datasets historicos / CSV / Kaggle
                |
                v
      src/features.py
                |
                v
        src/model.py
                |
                v
      src/predictor.py
                |
                +-------------------+
                |                   |
                v                   v
          src/engine.py       src/assistant.py
                |                   |
                +---------+---------+
                          |
                          v
                     src/app.py
                          |
        +-----------------+------------------+
        |                                    |
        v                                    v
lovable_import (React/Vite)         dashboard HTML estatico
```

## 5. Arquitetura do backend

### 5.1 Stack principal

- **Python 3.11+**
- **FastAPI**
- **Uvicorn**
- **pandas**
- **scikit-learn**
- **requests**
- **OpenAI API** opcional
- **kagglehub** para datasets adicionais

### 5.2 Modulos principais

- [main.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\main.py)
  fluxo de execucao, treino e monitor.

- [src/app.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\app.py)
  API principal, CORS, rotas, dashboard e endpoints de chat.

- [src/api.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\api.py)
  cliente BetsAPI para eventos ao vivo, ended, upcoming, odds e lineup.

- [src/features.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\features.py)
  leitura, normalizacao e enriquecimento de datasets.

- [src/model.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\model.py)
  treinamento dos modelos por mercado.

- [src/predictor.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\predictor.py)
  inferencia de probabilidades a partir do bundle treinado.

- [src/engine.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\engine.py)
  orquestracao da leitura ao vivo, odds, score, minuto, lineup e board de oportunidades.

- [src/assistant.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\assistant.py)
  heuristicas de tilt, sentimento, edge, Zen Guard e narrativas.

- [src/openai_client.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\openai_client.py)
  camada opcional de linguagem natural com LLM.

### 5.3 Endpoints relevantes

Rotas ja implementadas:

- `GET /health`
- `POST /analyze`
- `GET /opportunities`
- `POST /chat`
- `POST /whatsapp/send-test`
- `GET /webhook/whatsapp`
- `POST /webhook/whatsapp`
- `GET /dashboard`
- `GET /brasileirao/teams`
- `GET /brasileirao/overview`
- `GET /dashboard/brasileirao`

### 5.4 Logica do backend

O backend segue este fluxo:

1. Treina ou carrega o bundle de modelo.
2. Consulta jogo ao vivo ou agenda via BetsAPI.
3. Extrai placar, minuto, cartoes, ataques e odds.
4. Monta as features do confronto.
5. Gera probabilidades por mercado.
6. Calcula edge contra odds.
7. Aplica heuristicas de risco e contexto.
8. Gera resposta interpretativa para API e frontend.

## 6. Arquitetura do frontend

### 6.1 Stack principal

- **React 18**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **framer-motion**
- **React Router**
- **Radix UI**
- **Vitest** para testes

### 6.2 Componentes principais

- [lovable_import/src/components/WelcomeScreen.tsx](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\lovable_import\src\components\WelcomeScreen.tsx)
  entrada do produto e selecao rapida de confrontos.

- [lovable_import/src/components/ChatScreen.tsx](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\lovable_import\src\components\ChatScreen.tsx)
  assistente conversacional com quick replies, insight cards e probabilidade.

- [lovable_import/src/components/BrasileiraoDashboard.tsx](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\lovable_import\src\components\BrasileiraoDashboard.tsx)
  painel com overview, tabela, rodada, noticias e mercados.

- [lovable_import/src/components/SportsbookIntro.tsx](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\lovable_import\src\components\SportsbookIntro.tsx)
  mock visual da experiencia sportsbook com radar, agenda, termometro e contexto.

- [lovable_import/src/components/MarketOdds.tsx](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\lovable_import\src\components\MarketOdds.tsx)
  apresentacao de odds, probabilidades e edge.

- [lovable_import/src/components/MatchProbabilityBar.tsx](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\lovable_import\src\components\MatchProbabilityBar.tsx)
  comparacao visual de cenarios.

### 6.3 Papel do frontend no desafio

O frontend nao e apenas cosmetico. Ele cumpre um papel central no criterio de avaliacao porque:

- traduz previsao em leitura visual;
- reduz carga cognitiva;
- orienta o usuario por perguntas prontas;
- contextualiza rodada, forma e oportunidades;
- apresenta a analise como produto, e nao como planilha.

## 7. Modelagem e fundamentacao tecnica

### 7.1 Features utilizadas atualmente

O modelo usa features como:

- saldo de gols;
- total de gols;
- taxa de empates da liga;
- media de gols da liga;
- media de gols do mandante;
- media de gols do visitante;
- taxa de vitoria em casa/fora;
- forma recente em gols;
- forma recente em pontos.

### 7.2 Mercados modelados hoje

Mercados explicitamente implementados:

- `home_win`
- `draw`
- `away_win`
- `over_2_5`
- `under_2_5`
- `both_teams_score`
- `goal_next_10m`
- `card_next_10m`
- `penalty_in_match`

### 7.3 Heuristicas complementares

Para enriquecer a interpretacao, o sistema tambem gera:

- **tilt**
  detecta tensao emocional da partida.

- **crowd sentiment**
  estima confianca ou pressao da torcida.

- **market value**
  compara probabilidade do modelo com probabilidade implicita da odd.

- **Zen Guard**
  camada de disciplina que evita superconfianca em cenarios instaveis.

- **narrativa**
  converte o estado do jogo em explicacao textual.

### 7.4 Por que essa abordagem e boa para a banca

Porque ela combina:

- estatistica;
- machine learning;
- heuristica explicavel;
- camada de UX;
- interpretacao automatica.

Isso se alinha de forma direta com o criterio "nao mostrar so dado, mas interpretacao".

## 8. Fontes de dados

### 8.1 Ja integradas

- **BetsAPI**
  usada para eventos ao vivo, agenda, resultados, odds e lineup.

- **CSVs locais**
  base para treino e fallback.

- **Kaggle / datasets compativeis**
  suporte para enriquecimento do treino via arquivos externos.

### 8.2 Fontes do edital e aderencia

O desafio cita:

- BetsAPI;
- StatsBomb Open Data;
- FBref Players 2025-26.

### 8.3 Situacao atual do projeto

Hoje o projeto utiliza de forma operacional:

- BetsAPI;
- dados historicos locais;
- datasets estruturados compativeis com o pipeline atual.

### 8.4 Recomendacao para a apresentacao

Na apresentacao para jurados, a melhor formulacao e:

> A solucao ja opera com dados ao vivo da BetsAPI e com base historica estruturada. A arquitetura foi desenhada para incorporar StatsBomb e FBref como camadas de enriquecimento de eventos e jogadores, ampliando a profundidade analitica sem mudar a experiencia do usuario.

Essa frase e verdadeira, forte e tecnicamente defensavel.

## 9. O que ja prova interpretacao, e nao exibicao bruta

O produto ja nao se comporta como dashboard bruto porque:

- responde em linguagem natural;
- compara cenarios em vez de listar campos tecnicos;
- destaca mercados prioritarios;
- explica risco e edge;
- mostra contexto do time e da rodada;
- usa cards com headlines interpretativas;
- oferece perguntas guiadas ao usuario.

## 10. O que ainda recomendamos mudar para aderencia maxima

### 10.1 Mudancas recomendadas no produto

1. Evoluir a calibracao dos mercados dedicados ja adicionados:
   - chance de gol nos proximos 10 minutos;
   - chance de cartao no restante do jogo;
   - chance de penalti na partida.

2. Exibir no frontend a fundamentacao de cada previsao em formato padrao:
   - sinais usados;
   - peso relativo;
   - dado ao vivo;
   - historico recente.

3. Adicionar uma secao pequena de confianca/calibracao:
   - acerto historico;
   - backtest;
   - taxa de acerto por mercado.

4. Incluir claramente a fonte do dado em cada tela:
   - ao vivo;
   - historico;
   - fallback local.

### 10.2 O que nao e obrigatorio para a demo

Nao e necessario transformar o projeto inteiro antes da banca. O ganho marginal mais importante esta em:

- explicitar **mais tres cenarios probabilisticos**;
- mostrar **fundamentacao visual**;
- comunicar **viabilidade tecnica e roadmap**.

## 11. Tecnologias utilizadas

### Backend

- Python
- FastAPI
- Uvicorn
- pandas
- scikit-learn
- requests
- OpenAI API
- kagglehub

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- Framer Motion
- React Router
- Vitest

### Infra e integracoes

- BetsAPI
- Vercel ou deploy estatico frontend
- Render ou servidor Python para API
- WhatsApp API
- arquivos JSON/JSONL para snapshots

## 12. Custos aproximados do projeto

Os valores abaixo sao aproximacoes realistas para **prototipo funcional** e **MVP comercial inicial**, considerando Brasil e uma equipe enxuta.

### 12.1 Custo de desenvolvimento do prototipo atual

Se este projeto fosse orcado do zero como entrega de software:

- produto/UX: 40 a 80 horas
- frontend: 80 a 140 horas
- backend e modelagem: 120 a 220 horas
- integracoes e ajustes: 40 a 80 horas

Faixa total:

- **280 a 520 horas**

Com valor medio de equipe entre **R$ 70/h e R$ 130/h**, o custo estimado seria:

- **R$ 19.600 a R$ 67.600**

### 12.2 Custo mensal de operacao para piloto

Para um piloto com baixo a medio trafego:

- frontend hospedado: R$ 0 a R$ 100/mes
- backend/API: R$ 80 a R$ 400/mes
- logs/monitoramento: R$ 0 a R$ 150/mes
- LLM opcional: R$ 100 a R$ 1.000/mes
- WhatsApp/API externa: R$ 50 a R$ 500/mes

Faixa mensal estimada:

- **R$ 230 a R$ 2.150/mes**

### 12.3 Custo para MVP comercial mais robusto

Com autenticacao, observabilidade, calibracao de modelos, novos mercados e operacao mais confiavel:

- **R$ 80 mil a R$ 180 mil** de desenvolvimento
- **R$ 1.500 a R$ 8.000/mes** de operacao inicial

## 13. Em quanto tempo pode chegar ao cliente

### Cenário 1: piloto fechado

Com a base atual, o tempo para colocar com usuarios piloto e curto.

Estimativa:

- **2 a 4 semanas** para piloto controlado

Necessario fazer:

- endurecimento de deploy;
- ajuste fino de copy;
- logs e monitoramento;
- validacao de fluxo de chat e dashboard;
- definicao de escopo comercial.

### Cenário 2: primeiro cliente pagante

Estimativa:

- **6 a 10 semanas**

Necessario fazer:

- estabilidade de API;
- calibracao minima dos modelos;
- politicas de fallback;
- melhoria de explicabilidade;
- empacotamento comercial.

### Cenário 3: produto pronto para escalar comercialmente

Estimativa:

- **3 a 5 meses**

Necessario fazer:

- autenticao e multi-tenant;
- persistencia de usuarios e historico;
- observabilidade;
- mais mercados preditivos;
- testes automatizados;
- compliance e governanca de dados.

## 14. Viabilidade comercial

O projeto tem viabilidade por tres motivos:

1. Resolve dor real.
   O usuario quer contexto e leitura, nao apenas odds ou numeros.

2. Tem formato vendavel.
   Pode virar B2B2C para sportsbook, afiliado premium, produto editorial ou assistente de second-screen.

3. Tem arquitetura evolutiva.
   A base atual comporta enriquecimento com dados de jogador, evento, tracking e LLM sem reescrever o produto.

## 15. Diferenciais competitivos

- assistente com linguagem natural;
- UX de interpretacao, nao de planilha;
- camada de risco e edge;
- foco em usabilidade;
- modularidade tecnica;
- possibilidade de operar em chat, painel e WhatsApp;
- boa narrativa para demo e boa base para virar produto.

## 16. Riscos e limitacoes atuais

Para ser tecnicamente honesto com a banca, estes sao os principais pontos de atencao:

- o modelo atual ja expoe eventos micro, mas ainda e mais forte em mercados classicos de resultado e gols do que em cartao e penalti;
- ainda faltam testes automatizados mais robustos;
- o backtest/calibracao nao esta exposto de forma forte na UX;
- ha dependencia de disponibilidade da API externa;
- parte da base historica ainda pode ser enriquecida com mais granularidade.

Nenhum desses pontos invalida a proposta. Eles indicam apenas o caminho natural de maturacao do MVP.

## 17. Roadmap recomendado

### Fase 1: banca / demo

- consolidar apresentacao;
- expor claramente probabilidades e interpretacao;
- destacar vencedor, gols, momentum e risco;
- reforcar a calibracao visual e estatistica dos mercados de gol/cartao/penalti.

### Fase 2: piloto

- incluir persistencia de sessoes;
- tracking de uso;
- dashboards internos;
- calibracao de modelos;
- monitoramento de falhas.

### Fase 3: comercial

- contas de usuario;
- perfis de cliente;
- recomendacao personalizada;
- mais campeonatos;
- enrichment com StatsBomb e FBref.

## 18. Frase de defesa para o pitch

> Nosso projeto nao mostra dados crus. Ele interpreta o jogo para o usuario. Combinamos dados ao vivo, historico, machine learning, heuristicas explicaveis e UX conversacional para transformar informacao esportiva em leitura clara, visual e acionavel.

## 19. Conclusao final para os jurados

O **Gênio do Futebol / Neurobit AI** atende o desafio porque entrega:

- previsao;
- interpretacao;
- fundamentacao tecnica;
- visualizacao clara;
- viabilidade de evolucao para produto real.

Mais do que um dashboard, a solucao ja funciona como um **assistente de analise esportiva**. O projeto esta em um ponto muito bom para banca e, com um ciclo curto adicional, pode entrar em piloto com clientes reais.
