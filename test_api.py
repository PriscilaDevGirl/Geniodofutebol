from src.api import get_live_football_events

games = get_live_football_events()

print("RETORNO COMPLETO:")
print(games)
print("\nTOTAL DE JOGOS:", len(games))
