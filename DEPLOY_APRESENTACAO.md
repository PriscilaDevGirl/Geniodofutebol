# Deploy para Apresentação

## Arquitetura recomendada

- Backend FastAPI no Render
- Frontend Vite no Vercel

Motivo:

- o backend usa `pandas` e `scikit-learn`, então fica melhor em Web Service Python
- o frontend já está pronto para Vercel em `lovable_import/`
- separar front e API reduz risco na demo

## 1. Subir o backend no Render

O projeto já tem [`render.yaml`](/c:/Users/Convidado!/OneDrive/Área%20de%20Trabalho/neurobit-ai/render.yaml).

No Render:

1. Crie um novo Blueprint ou Web Service apontando para este repositório.
2. Confirme:
   - Build Command: `pip install -r requirements/requirements.txt`
   - Start Command: `uvicorn src.app:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/health`
3. Configure as variáveis:
   - `BETSAPI_TOKEN=248558-x464EYT2kttm4b`
   - `DATA_SOURCE=local`
   - `ENABLE_OPENAI_ANALYSIS=0`
   - `FRONTEND_ORIGINS=https://SEU-FRONT.vercel.app`
4. Após deploy, valide:
   - `https://SUA-API.onrender.com/health`
   - `https://SUA-API.onrender.com/opportunities?max_games=1`

## 2. Subir o frontend no Vercel

No Vercel:

1. Importe o repositório.
2. Em `Root Directory`, escolha `lovable_import`.
3. Use:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Defina:
   - `VITE_API_BASE_URL=https://SUA-API.onrender.com`
5. Faça o deploy e valide:
   - home
   - painel do Brasileirao
   - chat

## 3. Checklist para amanhã

- abrir `GET /health` antes da apresentação
- abrir `GET /opportunities?max_games=1` antes da apresentação
- testar o painel no frontend já publicado
- deixar uma aba com frontend e outra com backend health
- se o provedor estiver lento, atualizar a página 2 a 3 minutos antes da demo

## 4. Plano B

Se a API ao vivo oscilar, use também:

- `https://SUA-API.onrender.com/dashboard/brasileirao`

Assim você ainda consegue mostrar backend online, endpoints e painel publicado mesmo que a BetsAPI demore em algum momento.
