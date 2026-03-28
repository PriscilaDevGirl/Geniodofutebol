import warnings
warnings.filterwarnings("ignore")
import warnings
warnings.filterwarnings("ignore")

from src.env_loader import load_local_env

load_local_env()

from src.features import load_data, create_features
from src.model import train_model
from src.predictor import predict_game
from src.assistant import generate_analysis

from src.assistant import generate_analysis, analyze_bet

odd = 2.0  # simulação por enquanto


value_analysis = analyze_bet(prob, odd)

print("📊 Probabilidade:", prob)
print("💸 Odd:", odd)
print("🧠 Análise:", analysis)
print("🎯 Decisão:", value_analysis)

from src.assistant import generate_analysis, analyze_bet

value_analysis = analyze_bet(prob, odd)

print("📊 Probabilidade:", prob)
print("💸 Odd:", odd)
print("🧠 Análise:", analysis)
print("🎯 Decisão:", value_analysis)

# carregar dados
df = load_data()
df = create_features(df)

# treinar modelo
model = train_model(df)

# simulação de jogo
game = {
    "goal_diff": 1,
    "total_goals": 3
}

# previsão (AGORA CORRETO)
prob = predict_game(model, game)

# análise
analysis = generate_analysis(prob, is_home=True)

print("Probabilidade:", prob)
print("Análise:", analysis)
