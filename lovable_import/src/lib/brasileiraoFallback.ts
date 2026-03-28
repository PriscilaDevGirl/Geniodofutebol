export type TeamStatus = "live" | "upcoming" | "ended" | "sem_dados";

export interface FallbackTeamBoardRow {
  team_key: string;
  team_name: string;
  status: TeamStatus;
  event_id: string | null;
  match_label: string;
  next_match_label?: string;
  score: string;
  minute: string;
  event_day_label?: string | null;
  provider: string | null;
  position?: number | null;
  points?: number | null;
  games_played?: number | null;
  form?: string;
}

export interface FallbackTeamBoardResponse {
  api_status: string;
  teams: FallbackTeamBoardRow[];
}

export interface FallbackOverviewResponse {
  season: number;
  updated_at: string | null;
  summary?: {
    leader?: string;
    leader_points?: number;
    mens_games_today?: boolean;
    mens_games_today_date?: string;
    mens_games_today_note?: string;
    next_round_start?: string;
  };
  standings: Array<{
    position: number;
    team: string;
    points: number;
    games: number;
    goal_diff: number;
  }>;
  recent_matches: Array<{
    round: number;
    date: string;
    home_team: string;
    away_team: string;
    home_score: number;
    away_score: number;
    stadium: string;
  }>;
  next_matches?: Array<{
    round: number;
    date: string;
    home_team: string;
    away_team: string;
    stadium: string;
  }>;
  top_scorers: Array<{
    player: string;
    team: string;
    goals: number;
  }>;
  news?: Array<{
    title: string;
    tag: string;
    summary: string;
  }>;
  insights: string[];
}

export const OFFICIAL_BRASILEIRAO_TEAMS_2026 = [
  "Athletico Paranaense",
  "Atletico Mineiro",
  "Bahia",
  "Botafogo",
  "Bragantino",
  "Chapecoense",
  "Corinthians",
  "Coritiba",
  "Cruzeiro",
  "Flamengo",
  "Fluminense",
  "Gremio",
  "Internacional",
  "Mirassol",
  "Palmeiras",
  "Remo",
  "Santos",
  "Sao Paulo",
  "Vasco",
  "Vitoria",
] as const;

export const FALLBACK_BRASILEIRAO_OVERVIEW: FallbackOverviewResponse = {
  season: 2026,
  updated_at: "2026-03-28",
  summary: {
    leader: "Palmeiras",
    leader_points: 19,
    mens_games_today: false,
    mens_games_today_date: "2026-03-27",
    mens_games_today_note:
      "Nao houve jogos da Serie A masculina em 27/03/2026. A competicao entrou em pausa e a 9a rodada recomeca em 01/04/2026.",
    next_round_start: "2026-04-01",
  },
  standings: [
    { position: 1, team: "Palmeiras", points: 19, games: 8, goal_diff: 9 },
    { position: 2, team: "Sao Paulo", points: 16, games: 8, goal_diff: 5 },
    { position: 3, team: "Fluminense", points: 16, games: 8, goal_diff: 4 },
    { position: 4, team: "Flamengo", points: 14, games: 7, goal_diff: 8 },
    { position: 5, team: "Bahia", points: 14, games: 7, goal_diff: 2 },
    { position: 6, team: "Athletico Paranaense", points: 13, games: 7, goal_diff: 3 },
    { position: 7, team: "Coritiba", points: 13, games: 8, goal_diff: 1 },
    { position: 8, team: "Gremio", points: 11, games: 8, goal_diff: 1 },
    { position: 9, team: "Vasco", points: 11, games: 8, goal_diff: 0 },
    { position: 10, team: "Vitoria", points: 10, games: 7, goal_diff: -2 },
    { position: 11, team: "Corinthians", points: 10, games: 8, goal_diff: 0 },
    { position: 12, team: "Internacional", points: 8, games: 8, goal_diff: -2 },
    { position: 13, team: "Atletico Mineiro", points: 8, games: 8, goal_diff: -3 },
    { position: 14, team: "Bragantino", points: 8, games: 8, goal_diff: -4 },
    { position: 15, team: "Chapecoense", points: 7, games: 7, goal_diff: -2 },
    { position: 16, team: "Santos", points: 7, games: 8, goal_diff: -3 },
    { position: 17, team: "Botafogo", points: 6, games: 6, goal_diff: -2 },
    { position: 18, team: "Mirassol", points: 6, games: 7, goal_diff: -2 },
    { position: 19, team: "Remo", points: 6, games: 8, goal_diff: -5 },
    { position: 20, team: "Cruzeiro", points: 4, games: 8, goal_diff: -8 },
  ],
  recent_matches: [
    { round: 8, date: "2026-03-22", home_team: "Corinthians", away_team: "Flamengo", home_score: 1, away_score: 1, stadium: "Neo Quimica Arena" },
    { round: 8, date: "2026-03-22", home_team: "Internacional", away_team: "Chapecoense", home_score: 2, away_score: 0, stadium: "Beira-Rio" },
    { round: 8, date: "2026-03-22", home_team: "Vasco", away_team: "Gremio", home_score: 2, away_score: 1, stadium: "Sao Januario" },
    { round: 8, date: "2026-03-22", home_team: "Vitoria", away_team: "Mirassol", home_score: 1, away_score: 0, stadium: "Barradao" },
    { round: 8, date: "2026-03-22", home_team: "Palmeiras", away_team: "Sao Paulo", home_score: 1, away_score: 0, stadium: "Arena Barueri" },
    { round: 8, date: "2026-03-22", home_team: "Fluminense", away_team: "Atletico Mineiro", home_score: 1, away_score: 0, stadium: "Maracana" },
  ],
  next_matches: [
    { round: 9, date: "2026-04-01", home_team: "Palmeiras", away_team: "Gremio", stadium: "Arena Barueri" },
    { round: 9, date: "2026-04-01", home_team: "Cruzeiro", away_team: "Santos", stadium: "Mineirao" },
    { round: 9, date: "2026-04-01", home_team: "Remo", away_team: "Bahia", stadium: "Baenao" },
    { round: 9, date: "2026-04-01", home_team: "Coritiba", away_team: "Vasco", stadium: "Couto Pereira" },
  ],
  top_scorers: [
    { player: "Vinicius", team: "Gremio", goals: 6 },
    { player: "Danilo Santos", team: "Botafogo", goals: 5 },
    { player: "Calleri", team: "Sao Paulo", goals: 4 },
    { player: "Thiago Mendes", team: "Vasco", goals: 3 },
    { player: "Gabigol", team: "Flamengo", goals: 3 },
  ],
  news: [
    {
      title: "Palmeiras chega a 19 pontos e lidera a Serie A",
      tag: "Lideranca",
      summary: "O time tem a melhor pontuacao do campeonato apos oito rodadas e tambem o melhor saldo entre os candidatos do topo.",
    },
    {
      title: "Sao Paulo e Fluminense seguem na cola do lider",
      tag: "Disputa no G-4",
      summary: "Os dois aparecem com 16 pontos e sustentam a pressao na briga pela parte mais alta da tabela.",
    },
    {
      title: "Bahia e Athletico mantem arranque competitivo",
      tag: "Perseguidores",
      summary: "As duas equipes seguem perto do bloco principal e deixam o campeonato bem aberto neste inicio.",
    },
    {
      title: "A pausa de fim de marco empurra a rodada 9 para abril",
      tag: "Agenda",
      summary: "Nao houve jogos da Serie A masculina em 27/03/2026, e a retomada confirmada comeca em 01/04/2026.",
    },
  ],
  insights: [
    "Palmeiras lidera a Serie A 2026 com 19 pontos em 8 jogos.",
    "Sao Paulo e Fluminense formam o bloco perseguidor imediato com 16 pontos.",
    "Bahia, Athletico Paranaense e Coritiba sustentam um grupo intermediario forte.",
    "A rodada 9 marca a retomada do calendario em 01/04/2026.",
  ],
};

export const FALLBACK_BRASILEIRAO_TEAM_BOARD: FallbackTeamBoardResponse = {
  api_status: "dataset_local_cbf_2026",
  teams: [
    { team_key: "palmeiras", team_name: "Palmeiras", status: "sem_dados", event_id: null, match_label: "Palmeiras x Gremio", next_match_label: "Palmeiras x Gremio • 01/04", score: "-", minute: "-", provider: "fallback_local", position: 1, points: 19, games_played: 8, form: "" },
    { team_key: "sao paulo", team_name: "Sao Paulo", status: "sem_dados", event_id: null, match_label: "Sem jogo hoje", next_match_label: "Aguardando detalhamento da rodada 9", score: "-", minute: "-", provider: "fallback_local", position: 2, points: 16, games_played: 8, form: "" },
    { team_key: "fluminense", team_name: "Fluminense", status: "sem_dados", event_id: null, match_label: "Sem jogo hoje", next_match_label: "Aguardando detalhamento da rodada 9", score: "-", minute: "-", provider: "fallback_local", position: 3, points: 16, games_played: 8, form: "" },
    { team_key: "flamengo", team_name: "Flamengo", status: "sem_dados", event_id: null, match_label: "Sem jogo hoje", next_match_label: "Aguardando detalhamento da rodada 9", score: "-", minute: "-", provider: "fallback_local", position: 4, points: 14, games_played: 7, form: "" },
    { team_key: "bahia", team_name: "Bahia", status: "sem_dados", event_id: null, match_label: "Remo x Bahia", next_match_label: "Remo x Bahia • 01/04", score: "-", minute: "-", provider: "fallback_local", position: 5, points: 14, games_played: 7, form: "" },
    { team_key: "athletico paranaense", team_name: "Athletico Paranaense", status: "sem_dados", event_id: null, match_label: "Sem jogo hoje", next_match_label: "Aguardando detalhamento da rodada 9", score: "-", minute: "-", provider: "fallback_local", position: 6, points: 13, games_played: 7, form: "" },
    { team_key: "coritiba", team_name: "Coritiba", status: "sem_dados", event_id: null, match_label: "Coritiba x Vasco", next_match_label: "Coritiba x Vasco • 01/04", score: "-", minute: "-", provider: "fallback_local", position: 7, points: 13, games_played: 8, form: "" },
    { team_key: "gremio", team_name: "Gremio", status: "sem_dados", event_id: null, match_label: "Palmeiras x Gremio", next_match_label: "Palmeiras x Gremio • 01/04", score: "-", minute: "-", provider: "fallback_local", position: 8, points: 11, games_played: 8, form: "" },
    { team_key: "vasco", team_name: "Vasco", status: "sem_dados", event_id: null, match_label: "Coritiba x Vasco", next_match_label: "Coritiba x Vasco • 01/04", score: "-", minute: "-", provider: "fallback_local", position: 9, points: 11, games_played: 8, form: "" },
    { team_key: "vitoria", team_name: "Vitoria", status: "sem_dados", event_id: null, match_label: "Sem jogo hoje", next_match_label: "Aguardando detalhamento da rodada 9", score: "-", minute: "-", provider: "fallback_local", position: 10, points: 10, games_played: 7, form: "" },
    { team_key: "corinthians", team_name: "Corinthians", status: "sem_dados", event_id: null, match_label: "Sem jogo hoje", next_match_label: "Aguardando detalhamento da rodada 9", score: "-", minute: "-", provider: "fallback_local", position: 11, points: 10, games_played: 8, form: "" },
    { team_key: "internacional", team_name: "Internacional", status: "sem_dados", event_id: null, match_label: "Sem jogo hoje", next_match_label: "Aguardando detalhamento da rodada 9", score: "-", minute: "-", provider: "fallback_local", position: 12, points: 8, games_played: 8, form: "" },
    { team_key: "atletico mineiro", team_name: "Atletico Mineiro", status: "sem_dados", event_id: null, match_label: "Sem jogo hoje", next_match_label: "Aguardando detalhamento da rodada 9", score: "-", minute: "-", provider: "fallback_local", position: 13, points: 8, games_played: 8, form: "" },
    { team_key: "bragantino", team_name: "Bragantino", status: "sem_dados", event_id: null, match_label: "Sem jogo hoje", next_match_label: "Aguardando detalhamento da rodada 9", score: "-", minute: "-", provider: "fallback_local", position: 14, points: 8, games_played: 8, form: "" },
    { team_key: "chapecoense", team_name: "Chapecoense", status: "sem_dados", event_id: null, match_label: "Sem jogo hoje", next_match_label: "Aguardando detalhamento da rodada 9", score: "-", minute: "-", provider: "fallback_local", position: 15, points: 7, games_played: 7, form: "" },
    { team_key: "santos", team_name: "Santos", status: "sem_dados", event_id: null, match_label: "Cruzeiro x Santos", next_match_label: "Cruzeiro x Santos • 01/04", score: "-", minute: "-", provider: "fallback_local", position: 16, points: 7, games_played: 8, form: "" },
    { team_key: "botafogo", team_name: "Botafogo", status: "sem_dados", event_id: null, match_label: "Sem jogo hoje", next_match_label: "Aguardando detalhamento da rodada 9", score: "-", minute: "-", provider: "fallback_local", position: 17, points: 6, games_played: 6, form: "" },
    { team_key: "mirassol", team_name: "Mirassol", status: "sem_dados", event_id: null, match_label: "Sem jogo hoje", next_match_label: "Aguardando detalhamento da rodada 9", score: "-", minute: "-", provider: "fallback_local", position: 18, points: 6, games_played: 7, form: "" },
    { team_key: "remo", team_name: "Remo", status: "sem_dados", event_id: null, match_label: "Remo x Bahia", next_match_label: "Remo x Bahia • 01/04", score: "-", minute: "-", provider: "fallback_local", position: 19, points: 6, games_played: 8, form: "" },
    { team_key: "cruzeiro", team_name: "Cruzeiro", status: "sem_dados", event_id: null, match_label: "Cruzeiro x Santos", next_match_label: "Cruzeiro x Santos • 01/04", score: "-", minute: "-", provider: "fallback_local", position: 20, points: 4, games_played: 8, form: "" },
  ],
};
