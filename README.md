# Genio do Futebol

Assistente de analise esportiva focado em **interpretar o jogo**, e nao apenas mostrar numeros. O projeto combina dados esportivos, modelos preditivos, heuristicas explicaveis e linguagem natural para ajudar o usuario a entender cenarios, probabilidades e oportunidades de leitura no Brasileirao.

## Links

- Frontend: `https://geniodofutebol-bz22.vercel.app`
- Backend: `https://geniodofutebol.onrender.com`
- Healthcheck: `https://geniodofutebol.onrender.com/health`

## O que o produto entrega

- chat com respostas em linguagem natural;
- dashboard do Brasileirao com contexto da rodada;
- probabilidades por mercado;
- cenarios de gol, cartao e penalti;
- melhor mercado do momento com edge estimado;
- simulacao tecnica do fluxo de WhatsApp;
- fallback local para manter a demo funcional.

## Arquitetura

```text
Datasets e APIs
      |
      v
Coleta e normalizacao
      |
      v
Feature engineering
      |
      v
Modelos por mercado
      |
      v
Engine de interpretacao
      |
      +------------------------+
      |                        |
      v                        v
 FastAPI API             Camada OpenAI
      |
      +-------------------------------+
      |                               |
      v                               v
React/Vite frontend          WhatsApp / simulacao
```

## Stack

### Backend

- Python
- FastAPI
- Uvicorn
- pandas
- scikit-learn
- requests
- OpenAI API

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Radix UI

### Infra

- Render
- Vercel
- GitHub
- BetsAPI
- WhatsApp Cloud API

## Estrutura principal

```text
.
|-- data/
|-- lovable_import/
|   |-- src/
|   |-- package.json
|   `-- vercel.json
|-- src/
|   |-- app.py
|   |-- api.py
|   |-- assistant.py
|   |-- engine.py
|   |-- model.py
|   |-- openai_client.py
|   `-- whatsapp_client.py
|-- main.py
|-- render.yaml
|-- documentacao.md
`-- README.md
```

## Endpoints principais

- `GET /health`
- `POST /chat`
- `POST /analyze`
- `GET /opportunities`
- `GET /brasileirao/teams`
- `GET /brasileirao/overview`
- `POST /whatsapp/send-test`
- `GET /webhook/whatsapp`
- `POST /webhook/whatsapp`
- `POST /webhook/whatsapp/test`

## Como rodar localmente

### 1. Instale as dependencias do backend

```powershell
python -m pip install -r requirements/requirements.txt
```

### 2. Instale as dependencias do frontend

```powershell
cd lovable_import
npm install
```

### 3. Configure o `.env`

Use o arquivo `.env.example` como base.

Variaveis principais:

```env
OPENAI_API_KEY=sua_chave
BETSAPI_TOKEN=seu_token
DATA_SOURCE=local
ENABLE_OPENAI_ANALYSIS=1
OPENAI_CHAT_MODEL=gpt-4.1-mini
WHATSAPP_VERIFY_TOKEN=neurobit-verify-token
WHATSAPP_ACCESS_TOKEN=seu_token_meta
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_API_VERSION=v23.0
```

### 4. Rode o backend

```powershell
python -m uvicorn src.app:app --host 127.0.0.1 --port 8001
```

Ou use:

```powershell
run-backend.bat
```

### 5. Rode o frontend

```powershell
cd lovable_import
$env:VITE_API_BASE_URL="http://127.0.0.1:8001"
npm run dev -- --host 127.0.0.1 --port 8080
```

Ou use:

```powershell
run-frontend.bat
```

## Deploy

### Backend no Render

Configuracao principal:

- Build Command: `pip install -r requirements/requirements.txt`
- Start Command: `uvicorn src.app:app --host 0.0.0.0 --port $PORT`

Variaveis importantes:

- `OPENAI_API_KEY`
- `BETSAPI_TOKEN`
- `DATA_SOURCE=local`
- `OPENAI_CHAT_MODEL=gpt-4.1-mini`
- `FRONTEND_ORIGINS=https://geniodofutebol-bz22.vercel.app`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_API_VERSION=v23.0`

### Frontend no Vercel

Configuracao principal:

- Framework Preset: `Vite`
- Root Directory: `lovable_import`
- Build Command: `npm run build`
- Output Directory: `dist`

Variavel importante:

- `VITE_API_BASE_URL=https://geniodofutebol.onrender.com`

## WhatsApp

O projeto possui dois modos:

- envio real via WhatsApp Cloud API;
- simulacao controlada via `/webhook/whatsapp/test`.

Esse segundo modo foi mantido para garantir uma demo confiavel mesmo quando a Meta limita o inbound real em ambiente de app nao publicado.

## OpenAI

A OpenAI e usada na camada de explicacao em linguagem natural. O motor preditivo continua no backend, e a resposta final transforma o snapshot tecnico em um texto mais claro para o usuario.

Para validar online:

- abra `GET /health`
- confirme `openai_enabled: true`

## Documentacao adicional

- Documentacao tecnica: [documentacao.md](documentacao.md)
- PDF tecnico: [documentacao_jurados.pdf](documentacao_jurados.pdf)
- Funcionalidades: [funcionalidades.md](funcionalidades.md)
- PDF de funcionalidades: [funcionalidades_produto.pdf](funcionalidades_produto.pdf)
- Pitch: [pitch.md](pitch.md)

## Estado atual

No estado atual do repositorio, o projeto ja possui:

- frontend publicado;
- backend publicado;
- chat online;
- OpenAI ativa no backend;
- simulacao de WhatsApp;
- documentacao tecnica pronta para banca.

## Proximos passos

1. Expor calibracao e confianca por mercado na interface.
2. Enriquecer a modelagem com novas fontes de dados.
3. Ampliar observabilidade e testes automatizados.
4. Evoluir o fluxo comercial de WhatsApp.
5. Expandir para novos campeonatos e cenarios.
