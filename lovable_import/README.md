# Neurobit Frontend

Frontend React/Vite preparado para substituir a versao editada no Lovable e continuar a evolucao por Git + Vercel.

## O que ja esta pronto

- tela inicial
- chat
- painel do Brasileirao
- integracao do painel com a API via `GET /brasileirao/teams`
- navegacao entre welcome, chat e dashboard

## Rodar localmente

Instale as dependencias:

```powershell
npm install
```

Defina a URL da API:

```powershell
$env:VITE_API_BASE_URL="http://127.0.0.1:8000"
```

Suba o frontend:

```powershell
npm run dev
```

## Deploy no Vercel

### Opcao recomendada

Deploy apenas do frontend no Vercel e backend hospedado separadamente.

Motivo:

- o frontend Vite funciona muito bem no Vercel
- o backend atual usa FastAPI + pandas + scikit-learn e pode ficar pesado para Vercel
- separar front e back deixa a manutencao mais simples

### Como configurar no Vercel

1. importe este repositorio no Vercel
2. em `Root Directory`, escolha `lovable_import`
3. framework preset: `Vite`
4. build command: `npm run build`
5. output directory: `dist`
6. adicione a env `VITE_API_BASE_URL` com a URL publica da sua API

Exemplo:

```env
VITE_API_BASE_URL=https://sua-api-publica.com
VITE_WHATSAPP_NUMBER=5511999999999
VITE_WHATSAPP_MESSAGE=Oi! Vim pelo Neurobit e quero ajuda com a analise dos jogos.
```

## Backend e CORS

No backend FastAPI, configure:

```env
FRONTEND_ORIGINS=https://seu-front.vercel.app,https://clever-game-coach.lovable.app
```

Assim o front hospedado no Vercel consegue chamar a API sem bloqueio de navegador.

## Rotas esperadas da API

O frontend atual usa:

- `GET /health`
- `GET /brasileirao/teams`

O chat ainda pode ser conectado depois com:

- `POST /chat`

## Proximo passo sugerido

Ligar o chat do frontend na API real, substituindo as respostas mockadas por chamadas para `POST /chat`.
