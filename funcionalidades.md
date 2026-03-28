# Funcionalidades do Produto

## 1. Visao geral

O **Gênio do Futebol / Neurobit AI** foi desenhado para funcionar como um assistente de analise esportiva. A plataforma nao apenas mostra dados: ela interpreta o jogo, organiza cenarios e entrega contexto claro para o usuario.

## 2. Funcionalidades principais

### 2.1 Analise preditiva por mercado

O sistema calcula probabilidades explicitas para:

- vitoria do mandante;
- empate;
- vitoria do visitante;
- over 2.5 gols;
- under 2.5 gols;
- ambas marcam;
- gol nos proximos 10 minutos;
- cartao nos proximos 10 minutos;
- penalti ate o fim da partida.

### 2.2 Leitura contextual do jogo ao vivo

Durante uma partida, o sistema interpreta sinais como:

- placar atual;
- minuto da partida;
- volume de ataques;
- ataques perigosos;
- cartoes;
- momentum;
- pressao do jogo;
- odds disponiveis.

Esses sinais sao convertidos em leitura objetiva para o usuario.

### 2.3 Chat de analise esportiva

O usuario pode conversar com o assistente para:

- pedir analise de um time;
- perguntar sobre um confronto;
- pedir melhores oportunidades ao vivo;
- entender o momento do jogo;
- receber explicacoes em linguagem natural.

### 2.4 Dashboard do Brasileirao

O painel do Brasileirao mostra:

- times ao vivo;
- times que jogam hoje;
- rodada recente;
- proximos jogos;
- artilharia;
- tabela;
- noticias e insights;
- mercados analisados.

### 2.5 Cards de cenarios ao vivo

No fluxo conversacional, o produto destaca visualmente:

- chance de gol;
- chance de cartao;
- chance de penalti;
- sentimento da torcida;
- risco da leitura;
- principal mercado detectado.

### 2.6 Melhor oportunidade e edge

O sistema compara a probabilidade estimada com a odd disponivel para identificar:

- edge;
- valor potencial;
- melhor mercado naquele momento;
- nivel de risco da leitura.

### 2.7 Zen Guard

Camada de protecao para evitar leituras impulsivas. O Zen Guard:

- alerta quando o contexto esta instavel;
- sugere cautela quando o edge e curto;
- ajuda a manter disciplina na interpretacao do jogo.

### 2.8 Tilt e pressao emocional

O produto estima:

- tensao emocional da partida;
- nivel de frustracao;
- risco de leitura contaminada por contexto quente;
- intensidade da pressao competitiva.

### 2.9 Sentimento da torcida

O sistema gera uma leitura do ambiente emocional da torcida com base em:

- apoio;
- volume do ambiente;
- nivel de frustracao;
- momento da partida.

### 2.10 Narrativa automatica

O produto transforma a analise numerica em texto legivel, explicando:

- o que esta acontecendo;
- qual mercado lidera a leitura;
- por que esse mercado faz sentido;
- qual cuidado o usuario deve ter.

### 2.11 Monitoramento ao vivo

O projeto salva snapshots de analise para:

- acompanhar o estado mais recente;
- manter historico em JSONL;
- alimentar paineis e comparacoes;
- sustentar demonstracao e auditoria.

### 2.12 Oportunidades ao vivo

O sistema monta uma mesa de oportunidades com:

- jogos monitorados;
- melhor mercado de cada jogo;
- edge;
- odd;
- status do Zen Guard.

### 2.13 WhatsApp como canal de continuidade

O usuario pode continuar o atendimento fora da interface principal por meio de:

- CTA para WhatsApp;
- webhook de entrada;
- respostas guiadas;
- envio de mensagens e botoes.

### 2.14 Suporte a multiplas fontes de dados

O projeto foi estruturado para trabalhar com:

- BetsAPI;
- datasets CSV locais;
- datasets compativeis via Kaggle;
- enriquecimento futuro com StatsBomb e FBref.

## 3. Funcionalidades por camada

### Frontend

- tela inicial com confrontos em destaque;
- chat com quick replies;
- cards de insight;
- barras de probabilidade;
- dashboard do Brasileirao;
- visualizacao de mercados e cenarios.

### Backend

- API FastAPI;
- motor de analise;
- treinamento e inferencia;
- integracao com BetsAPI;
- construcao de snapshots;
- mesa de oportunidades.

### Dados e modelo

- carga de dados historicos;
- normalizacao de CSVs;
- feature engineering;
- modelos por mercado;
- heuristicas explicaveis;
- calculo de edge e risco.

## 4. Funcionalidades com maior valor para a banca

As funcionalidades mais fortes para demonstracao sao:

- previsao explicita de vencedor, gol, cartao e penalti;
- explicacao em linguagem natural;
- comparacao entre mercados;
- camada visual clara;
- painel do Brasileirao;
- deteccao de risco e pressao emocional;
- UX conversacional.

## 5. Conclusao

O produto entrega um conjunto coerente de funcionalidades para funcionar como um verdadeiro assistente de analise esportiva. Ele combina previsao, contexto, explicacao e visualizacao, oferecendo uma experiencia mais util do que um dashboard tradicional de numeros crus.
