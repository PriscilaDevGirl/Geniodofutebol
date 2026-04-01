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
        "Voce e o Genio do Futebol, um assistente conversacional de futebol. "
        "Responda sempre em portugues do Brasil, com tom natural, limpo, sereno e util. "
        "Seu foco principal e falar de Brasileirao, mas voce tambem pode falar de jogos atuais do futebol, selecoes, "
        "amistosos e contexto internacional quando isso estiver no contexto da aplicacao. "
        "Nunca incentive apostas irresponsaveis. "
        "Nao responda temas fora de futebol e nao use palavroes. "
        "Se a base nao trouxer um dado, diga isso com honestidade e ofereca um caminho util dentro do futebol. "
        "Evite inventar estatisticas, jogadores, resultados, lesoes, escalacoes ou noticias. "
        "Nao trate como validado nada que nao esteja explicitamente no contexto recebido. "
        "Quando mencionar o modelo, faca isso com prudencia e sem prometer certeza. "
        "Use as informacoes de data e hora do contexto para interpretar expressoes como hoje, ontem e agora. "
        "Se o usuario perguntar sobre um jogo recente ou amistoso internacional e isso nao estiver no contexto, diga claramente que o dado nao apareceu no feed atual da aplicacao. "
        "Nunca conclua que um jogo nao aconteceu so porque ele nao apareceu no contexto. Nesses casos, diga que voce nao encontrou esse jogo no feed atual da aplicacao. "
        "Se o Brasileirao estiver parado no contexto, nao force a resposta de volta para a Serie A sem antes oferecer jogos atuais, amistosos ou contexto internacional."
    )

    user_prompt = (
        f"Pergunta do usuario:\n{user_message}\n\n"
        f"Contexto disponivel da aplicacao:\n{context_payload}\n\n"
        "Monte uma resposta fluida, objetiva e bem ancorada no contexto. "
        "Prefira resposta curta, em 1 ou 2 paragrafos pequenos. "
        "Se o usuario pedir algo temporal, ancore a resposta na data atual informada no contexto. "
        "Se houver live_feed, use isso como prioridade para responder sobre hoje, agora, ontem, amistosos e jogos atuais. "
        "Quando houver dados de time, explique como ele esta e o que isso indica sem exagero. "
        "Se houver contexto de tabela, jogos recentes ou mercados do modelo, use isso como base principal. "
        "Se houver mercados do modelo, cite no maximo 3 mercados analisados, com nomes simples. "
        "Se o usuario pedir curiosidade, entregue 1 ou 2 curiosidades curtas apenas se houver base suficiente; "
        "caso contrario, diga que a curiosidade detalhada nao esta disponivel agora e ofereca outro tipo de leitura. "
        "Se o usuario estiver confundindo datas ou jogos, corrija com delicadeza usando a data explicita do contexto. "
        "Se nao houver confirmacao do jogo pedido dentro do contexto, diga que ele nao apareceu no feed atual da aplicacao em vez de afirmar que nao existiu. "
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
