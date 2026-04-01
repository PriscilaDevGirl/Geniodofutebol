# Documentacao Tecnica

## 1. Visao geral

O **Genio do Futebol** e uma plataforma de analise esportiva focada em transformar dados de partidas em **contexto, previsao e explicacao clara**. O produto foi desenhado para funcionar como um assistente interpretativo, e nao como um painel de numeros crus.

Hoje a solucao opera com:

- frontend web conversacional e visual;
- backend de inferencia e interpretacao;
- integracao com dados esportivos ao vivo;
- camada opcional de linguagem natural com OpenAI;
- fluxo de demo para WhatsApp;
- dashboard do Brasileirao com leitura contextual da rodada.

## 2. Objetivo do produto

O sistema foi construido para responder perguntas como:

- quem chega melhor para a partida;
- qual time tem mais chance de vencer;
- qual a chance de gol, cartao ou penalti;
- qual mercado parece mais forte naquele momento;
- por que o sistema chegou nessa leitura.

O foco principal e **interpretacao orientada ao usuario**, com respostas visuais e textuais que reduzam a carga cognitiva.

## 3. Arquitetura de alto nivel

```text
Fontes de dados e datasets
        |
        v
  Coleta e normalizacao
        |
        v
  Engenharia de features
        |
        v
  Modelos por mercado
        |
        v
  Engine de interpretacao
        |
        +--------------------+
        |                    |
        v                    v
    API FastAPI         Camada OpenAI
        |
        +------------------------------+
        |                              |
        v                              v
Frontend React/Vite             Fluxo WhatsApp/demo
```

## 4. Arquitetura do backend

### 4.1 Stack

- Python
- FastAPI
- Uvicorn
- pandas
- scikit-learn
- requests
- OpenAI API

### 4.2 Responsabilidades

O backend concentra:

- integracao com BetsAPI;
- leitura de datasets locais;
- treino e carga do bundle de modelo;
- inferencia de probabilidades;
- calculo de edge e leitura de risco;
- narrativa automatica;
- endpoints de chat, dashboard e WhatsApp.

### 4.3 Modulos principais

- [main.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\main.py): entrada do projeto e execucao local.
- [src/app.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\app.py): API principal, rotas, CORS, healthcheck e fluxos de chat.
- [src/api.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\api.py): integracao com a BetsAPI.
- [src/features.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\features.py): carga, limpeza e engenharia de features.
- [src/model.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\model.py): treinamento dos modelos por mercado.
- [src/predictor.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\predictor.py): inferencia em cima do bundle treinado.
- [src/engine.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\engine.py): motor de leitura de contexto, probabilidades e board de oportunidades.
- [src/assistant.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\assistant.py): heuristicas, narrativa e camada explicativa.
- [src/openai_client.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\openai_client.py): composicao da resposta em linguagem natural.
- [src/whatsapp_client.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\whatsapp_client.py): envio de mensagens via WhatsApp API.
- [src/env_loader.py](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\env_loader.py): carga automatica do `.env`.

### 4.4 Fluxo do backend

1. O sistema carrega configuracoes e modelo.
2. Busca dados ao vivo ou usa fallback local.
3. Monta features do confronto.
4. Gera probabilidades por mercado.
5. Calcula edge e sinais de contexto.
6. Monta snapshot interpretativo.
7. Entrega a resposta para chat, dashboard ou WhatsApp.

## 5. Arquitetura do frontend

### 5.1 Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Radix UI
- React Markdown

### 5.2 Responsabilidades

O frontend e responsavel por:

- transformar previsao em leitura visual;
- conduzir o usuario por perguntas guiadas;
- apresentar insights, cards e barras de probabilidade;
- exibir o dashboard do Brasileirao;
- simular o fluxo de atendimento via WhatsApp.

### 5.3 Componentes principais

- [lovable_import/src/components/WelcomeScreen.tsx](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\lovable_import\src\components\WelcomeScreen.tsx): entrada da experiencia.
- [lovable_import/src/components/ChatScreen.tsx](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\lovable_import\src\components\ChatScreen.tsx): chat principal com quick replies, cards e simulacao do WhatsApp.
- [lovable_import/src/components/BrasileiraoDashboard.tsx](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\lovable_import\src\components\BrasileiraoDashboard.tsx): painel geral do Brasileirao.
- [lovable_import/src/components/SportsbookIntro.tsx](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\lovable_import\src\components\SportsbookIntro.tsx): tela introdutoria com radar da rodada, agenda e termometro.
- [lovable_import/src/components/WhatsAppCTA.tsx](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\lovable_import\src\components\WhatsAppCTA.tsx): CTA para contato e demonstracao do canal.
- [lovable_import/src/lib/api.ts](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\lovable_import\src\lib\api.ts): camada cliente para consumo da API.

## 6. Fontes de dados

### 6.1 Fontes operacionais

- BetsAPI para eventos ao vivo, agenda, odds e contexto de partida.
- Datasets locais em CSV para treino.
- Arquivos JSON e JSONL para snapshots e fallback de leitura.

### 6.2 Fontes previstas na arquitetura

O pipeline foi estruturado para absorver enriquecimento com:

- StatsBomb Open Data;
- bases de jogadores como FBref;
- novos datasets locais compativeis com o mapeamento de colunas.

## 7. Modelagem e fundamentacao

### 7.1 Abordagem atual

O projeto usa uma combinacao de:

- features historicas por time e liga;
- classificadores por mercado;
- leitura contextual ao vivo;
- heuristicas explicaveis;
- narrativa automatica apoiada por OpenAI.

### 7.2 Mercados cobertos

Mercados e cenarios atualmente expostos:

- `home_win`
- `draw`
- `away_win`
- `over_2_5`
- `under_2_5`
- `both_teams_score`
- `goal_next_10m`
- `card_next_10m`
- `penalty_in_match`

### 7.3 Sinais complementares

O produto tambem calcula ou infere:

- melhor mercado do momento;
- edge estimado;
- tilt da partida;
- Zen Guard para cautela;
- crowd sentiment;
- sugestoes de acompanhamento ao vivo.

## 8. Endpoints principais

### 8.1 API publica

- `GET /health`
- `POST /chat`
- `POST /analyze`
- `GET /opportunities`
- `GET /brasileirao/teams`
- `GET /brasileirao/overview`
- `GET /dashboard`
- `GET /dashboard/brasileirao`

### 8.2 WhatsApp e simulacao

- `POST /whatsapp/send-test`
- `GET /webhook/whatsapp`
- `POST /webhook/whatsapp`
- `POST /webhook/whatsapp/test`

O endpoint `/webhook/whatsapp/test` foi criado para demonstracao confiavel da experiencia de WhatsApp mesmo quando a Meta restringe o inbound real em ambiente de desenvolvimento.

## 9. Integracao com OpenAI

### 9.1 Papel da OpenAI

A OpenAI entra na camada de resposta em linguagem natural. Ela nao substitui a engine do sistema; ela **traduz o contexto tecnico em explicacao clara**, baseada no payload montado pelo backend.

### 9.2 Comportamento atual

- com `OPENAI_API_KEY` valida, o chat responde com linguagem natural enriquecida;
- a API expõe o status dessa integracao em `GET /health`;
- o backend online hoje esta apto a responder com `source: openai`.

## 10. Fluxo de WhatsApp

### 10.1 O que existe hoje

- envio real via WhatsApp API;
- validacao de webhook;
- simulacao controlada do webhook para demo;
- CTA visual no frontend;
- narrativa de produto para banca.

### 10.2 Motivo da simulacao

Em ambiente de app nao publicado na Meta, o inbound real pode ser limitado. Para nao depender disso em apresentacao, o projeto possui um fluxo tecnico equivalente de simulacao via API.

## 11. Configuracoes de ambiente

### 11.1 Backend

Variaveis principais:

- `OPENAI_API_KEY`
- `BETSAPI_TOKEN`
- `DATA_SOURCE`
- `ENABLE_OPENAI_ANALYSIS`
- `OPENAI_CHAT_MODEL`
- `FRONTEND_ORIGINS`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_API_VERSION`

### 11.2 Frontend

Variaveis principais:

- `VITE_API_BASE_URL`
- `VITE_WHATSAPP_NUMBER`
- `VITE_WHATSAPP_MESSAGE`

## 12. Deploy

### 12.1 Arquitetura de deploy atual

- backend em Render;
- frontend em Vercel;
- repositorio principal no GitHub.

### 12.2 URLs operacionais

- frontend: `https://geniodofutebol-bz22.vercel.app`
- backend: `https://geniodofutebol.onrender.com`
- repositorio: `https://github.com/PriscilaDevGirl/Geniodofutebol`

### 12.3 Requisitos para frontend conversar com o backend

No Render:

- `FRONTEND_ORIGINS` deve conter a URL do Vercel.

No Vercel:

- `VITE_API_BASE_URL` deve apontar para o backend do Render.

## 13. Observabilidade e operacao

O projeto possui:

- endpoint de healthcheck;
- logs locais e online;
- snapshots de monitoramento;
- fallback local para parte da leitura;
- modo de simulacao para apresentacao.

Arquivos relevantes:

- [data/live_monitor_latest.json](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\data\live_monitor_latest.json)
- [backend8011.out.log](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\backend8011.out.log)
- [backend8011.err.log](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\backend8011.err.log)

## 14. Estado atual do produto

Hoje o projeto entrega:

- chat com OpenAI online;
- dashboard visual do Brasileirao;
- probabilidades para vencedor, gols e cenarios de evento;
- simulacao visual e tecnica do WhatsApp;
- deploy funcional em Vercel e Render;
- documentacao, pitch e materiais de apoio.

## 15. Limites tecnicos atuais

Pontos que ainda podem evoluir:

- calibracao mais forte para cartao e penalti;
- exposicao visual de confianca historica;
- testes automatizados mais amplos;
- observabilidade mais robusta em producao;
- enriquecimento por datasets de eventos e jogadores.

## 16. Proximos passos recomendados

1. Adicionar metricas de calibracao por mercado.
2. Expor confianca e fonte do dado na interface.
3. Persistir sessoes e historico de usuario.
4. Ampliar mercados e cenarios.
5. Evoluir o fluxo comercial de WhatsApp.

## 17. Conclusao

O **Genio do Futebol** ja opera como um assistente tecnico de analise esportiva, com backend modular, frontend explicativo, integracao online e camada conversacional. A arquitetura atual sustenta apresentacao, piloto controlado e evolucao para produto comercial.
