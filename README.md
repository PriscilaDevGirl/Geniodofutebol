# neurobit-ai

Projeto de analise preditiva para futebol com:

- treino de modelo local
- leitura de jogos ao vivo via BetsAPI
- deteccao de tilt
- sentimento da torcida
- narrativa estilo comentarista
- monitor ao vivo com logs em JSON
- integracao opcional com OpenAI

## Requisitos

- Python 3.11+
- token da BetsAPI para jogos ao vivo
- chave OpenAI opcional para analise em linguagem natural

## Instalacao

Instale as dependencias:

```powershell
pip install -r requirements/requirements.txt
```

Se o `pip` nao estiver no PATH, use o Python diretamente:

```powershell
python -m pip install -r requirements/requirements.txt
```

## Configuracao

Crie um arquivo `.env` local com base em [`.env.example`](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\.env.example).

Para teste rapido com WhatsApp + ngrok, voce tambem pode usar [`.env.test.example`](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\.env.test.example).

Exemplo:

```env
OPENAI_API_KEY=sua_chave_openai_aqui
BETSAPI_TOKEN=seu_token_betsapi_aqui
KAGGLE_API_TOKEN=seu_token_kaggle_aqui
DATA_SOURCE=local
KAGGLE_DATASET_FILE=
KAGGLE_DATASET_SPECS=
LOCAL_TRAINING_FILE=data/matches.csv
EXTRA_TRAIN_FILES=
BETSAPI_EVENT_ID=
LIVE_MONITOR=0
MONITOR_INTERVAL_SECONDS=15
MONITOR_MAX_UPDATES=0
ENABLE_OPENAI_ANALYSIS=0
WHATSAPP_VERIFY_TOKEN=neurobit-verify-token
WHATSAPP_ACCESS_TOKEN=seu_access_token_whatsapp_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id_aqui
WHATSAPP_API_VERSION=v23.0
```

## Seguranca

- nunca suba `.env` para o GitHub
- nunca coloque `OPENAI_API_KEY` no codigo
- nunca deixe tokens em commits, prints ou screenshots
- o projeto ja possui [`.gitignore`](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\.gitignore) para bloquear arquivos sensiveis

## Execucao

Rodar uma analise unica:

```powershell
python main.py
```

Subir a API FastAPI:

```powershell
uvicorn src.app:app --reload
```

Rodar monitor ao vivo:

```powershell
$env:LIVE_MONITOR="1"
$env:MONITOR_INTERVAL_SECONDS="15"
$env:MONITOR_MAX_UPDATES="0"
python main.py
```

Para analisar um jogo especifico:

```powershell
$env:BETSAPI_EVENT_ID="ID_DO_JOGO"
python main.py
```

## OpenAI

A integracao com OpenAI e opcional.

Ative com:

```powershell
$env:ENABLE_OPENAI_ANALYSIS="1"
$env:OPENAI_API_KEY="SUA_CHAVE"
python main.py
```

O cliente seguro esta em [`src/openai_client.py`](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\openai_client.py).

## API

Endpoints principais:

- `GET /health`
- `GET /dashboard`
- `POST /analyze`
- `GET /opportunities`
- `POST /chat`
- `POST /whatsapp/send-test`
- `GET /webhook/whatsapp`
- `POST /webhook/whatsapp`

Dashboard web:

- suba a API com `uvicorn src.app:app --reload`
- abra `http://127.0.0.1:8000/dashboard`
- o painel consome `POST /chat` e `GET /opportunities` para mostrar:
  - jogo e mercado principal
  - probabilidade e decisao
  - Zen-Guard
  - tilt e torcida
  - XAI
  - narrativa
  - mesa de oportunidades

Exemplo de chat:

```json
{
  "message": "quais sao as melhores oportunidades ao vivo?"
}
```

Webhook WhatsApp:

- verificacao Meta: `GET /webhook/whatsapp?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...`
- recepcao de mensagem: `POST /webhook/whatsapp`
- envio manual de teste: `POST /whatsapp/send-test`

## Dados e logs

Arquivos gerados pelo monitor:

- snapshot mais recente: [`data/live_monitor_latest.json`](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\data\live_monitor_latest.json)
- historico append-only: [`data/live_monitor_logs.jsonl`](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\data\live_monitor_logs.jsonl)

Dataset local de treino:

- [`data/matches.csv`](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\data\matches.csv)

Multiplas fontes de treino:

- `DATA_SOURCE=local`: usa o dataset local principal e CSVs extras em `data/datasets/*.csv`
- `DATA_SOURCE=kaggle`: usa o dataset Kaggle principal
- `DATA_SOURCE=hybrid`: combina datasets locais e Kaggle
- `EXTRA_TRAIN_FILES`: CSVs locais adicionais separados por `;`
- `KAGGLE_DATASET_SPECS`: datasets Kaggle extras no formato `handle|arquivo.csv;handle2|arquivo2.csv`

Observacao:

- so entram no treino datasets compativeis com colunas de partida, como `home_goals` e `away_goals`
- mais dados ajudam a melhorar a leitura, mas nao garantem ganho nem substituem disciplina de banca

Trazer novos datasets para o projeto:

- coloque CSVs compativeis em `data/datasets/`
- use `data/datasets/sample_matches_template.csv` como referencia minima
- para um exemplo mais completo com data, liga, mandante, visitante e placar textual, use `data/datasets/sample_rich_matches.csv`
- o mapeador automatico tambem reconhece aliases comuns como `Home Score`, `Away Score`, `team1_goals`, `team2_goals`, `score1` e `score2`
- ele tambem consegue extrair gols de colunas de placar textual, como `2-1`, `0 x 0` e `FT 1:3`
- valide um CSV:
  - `python -m src.dataset_tools validate caminho_do_arquivo.csv`
- converta um CSV para o formato padrao:
  - `python -m src.dataset_tools convert caminho_origem.csv data/datasets/arquivo_normalizado.csv`

## Estrutura

- [`main.py`](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\main.py): fluxo principal, monitor e logs
- [`src/api.py`](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\api.py): cliente da BetsAPI
- [`src/features.py`](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\features.py): carga e preparacao de dados
- [`src/model.py`](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\model.py): treino do modelo
- [`src/predictor.py`](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\predictor.py): inferencia
- [`src/assistant.py`](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\assistant.py): tilt, torcida e narrativa
- [`src/openai_client.py`](c:\Users\Convidado!\OneDrive\Área de Trabalho\neurobit-ai\src\openai_client.py): integracao opcional com OpenAI

## Limitacoes atuais

- o modelo ainda e simples e usa poucas features
- a analise ainda nao esta conectada aos mercados da Esporte da Sorte
- a odd pode nao estar disponivel em alguns eventos ao vivo
- ainda nao ha testes automatizados

## Proximos passos sugeridos

1. integrar odds e mercados reais da Esporte da Sorte
2. treinar modelos por mercado de aposta
3. adicionar calculo de value betting
4. expor isso em uma interface de chat
