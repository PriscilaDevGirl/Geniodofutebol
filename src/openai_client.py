import os

from src.env_loader import load_local_env

load_local_env()


def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("Defina OPENAI_API_KEY no ambiente para usar a integracao com OpenAI.")

    try:
        from openai import OpenAI
    except ImportError as exc:
        raise ImportError("Instale a dependencia com: pip install openai") from exc

    return OpenAI(api_key=api_key)


def generate_chatgpt_analysis(snapshot, model="gpt-4.1-mini"):
    client = get_openai_client()

    prompt = (
        "Voce e um analista de apostas esportivas em futebol. "
        "Receba um snapshot de jogo e gere uma analise objetiva em portugues com foco em contexto, risco e oportunidade.\n\n"
        f"Snapshot:\n{snapshot}"
    )

    response = client.responses.create(
        model=model,
        input=prompt,
    )

    return response.output_text


def generate_brasileirao_chat_reply(user_message, context_payload, model=None):
    client = get_openai_client()
    model = model or os.getenv("OPENAI_CHAT_MODEL", "gpt-4.1-mini")

    system_prompt = (
        "Voce e o Genio do Futebol, um assistente conversacional focado exclusivamente no Brasileirao Serie A. "
        "Responda sempre em portugues do Brasil, com tom natural, limpo, sereno e util. "
        "Seu foco e falar de times, jogadores, placar, posicao, momento do time, ultimos jogos, proximos confrontos, "
        "curiosidades e contexto esportivo do Brasileirao. "
        "Nunca incentive apostas irresponsaveis. "
        "Nao responda temas fora de futebol e nao use palavroes. "
        "Se a base nao trouxer um dado, diga isso com honestidade e ofereca um caminho util dentro do Brasileirao. "
        "Evite inventar estatisticas, jogadores, resultados, lesoes, escalacoes ou noticias. "
        "Nao trate como validado nada que nao esteja explicitamente no contexto recebido. "
        "Quando mencionar o modelo, faca isso com prudencia e sem prometer certeza."
    )

    user_prompt = (
        f"Pergunta do usuario:\n{user_message}\n\n"
        f"Contexto disponivel da aplicacao:\n{context_payload}\n\n"
        "Monte uma resposta fluida, objetiva e bem ancorada no contexto. "
        "Prefira resposta curta, em 1 ou 2 paragrafos pequenos. "
        "Quando houver dados de time, explique como ele esta e o que isso indica sem exagero. "
        "Se houver contexto de tabela, jogos recentes ou mercados do modelo, use isso como base principal. "
        "Se houver mercados do modelo, cite no maximo 3 mercados analisados, com nomes simples. "
        "Se o usuario pedir curiosidade, entregue 1 ou 2 curiosidades curtas apenas se houver base suficiente; "
        "caso contrario, diga que a curiosidade detalhada nao esta disponivel agora e ofereca outro tipo de leitura. "
        "Nao cite fontes externas invisiveis nem pesquise fora do contexto fornecido por esta aplicacao."
    )

    response = client.responses.create(
        model=model,
        input=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    return response.output_text
