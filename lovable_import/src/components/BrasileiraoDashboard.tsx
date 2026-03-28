import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Newspaper, RefreshCw, Radio, Shield, Sparkles, Timer, Trophy } from "lucide-react";
import { WhatsAppCTA } from "./WhatsAppCTA";
import { fetchJsonWithFallback, getApiBaseCandidates } from "@/lib/api";
import {
  FALLBACK_BRASILEIRAO_OVERVIEW,
  FALLBACK_BRASILEIRAO_TEAM_BOARD,
  OFFICIAL_BRASILEIRAO_TEAMS_2026,
} from "@/lib/brasileiraoFallback";

type TeamStatus = "live" | "upcoming" | "ended" | "sem_dados";

interface TeamBoardRow {
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

interface TeamBoardResponse {
  api_status: string;
  teams: TeamBoardRow[];
}

interface OverviewStandingRow {
  position: number;
  team: string;
  points: number;
  games: number;
  goal_diff: number;
}

interface OverviewMatchRow {
  round: number;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  stadium: string;
}

interface OverviewScorerRow {
  player: string;
  team: string;
  goals: number;
}

interface OverviewResponse {
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
  standings: OverviewStandingRow[];
  recent_matches: OverviewMatchRow[];
  next_matches?: Array<{
    round: number;
    date: string;
    home_team: string;
    away_team: string;
    stadium: string;
  }>;
  top_scorers: OverviewScorerRow[];
  news?: Array<{
    title: string;
    tag: string;
    summary: string;
  }>;
  insights: string[];
}

interface BrasileiraoDashboardProps {
  onBack: () => void;
  onOpenChat: (message: string) => void;
}

const statusCopy: Record<TeamStatus, { label: string; badge: string }> = {
  live: { label: "Ao vivo agora", badge: "bg-neon-green/10 text-neon-green border-neon-green/20" },
  upcoming: { label: "Joga hoje", badge: "bg-neon-blue/10 text-neon-blue border-neon-blue/20" },
  ended: { label: "Último jogo", badge: "bg-amber-400/10 text-amber-400 border-amber-400/20" },
  sem_dados: { label: "Sem dados no momento", badge: "bg-destructive/10 text-destructive border-destructive/20" },
};

const officialTeamNames = new Set<string>(OFFICIAL_BRASILEIRAO_TEAMS_2026);

function sanitizeTeamBoard(payload: TeamBoardResponse | null | undefined): TeamBoardResponse {
  const fallbackMap = new Map(FALLBACK_BRASILEIRAO_TEAM_BOARD.teams.map((team) => [team.team_name, team]));
  const incomingTeams = payload?.teams ?? [];
  const sanitized: TeamBoardRow[] = [];

  for (const team of incomingTeams) {
    if (!officialTeamNames.has(team.team_name)) {
      continue;
    }
    sanitized.push(team);
  }

  const merged = [...sanitized];
  for (const officialTeam of OFFICIAL_BRASILEIRAO_TEAMS_2026) {
    if (merged.some((team) => team.team_name === officialTeam)) {
      continue;
    }
    const fallbackTeam = fallbackMap.get(officialTeam);
    if (fallbackTeam) {
      merged.push(fallbackTeam);
    }
  }

  merged.sort((a, b) => {
    const left = a.position ?? 999;
    const right = b.position ?? 999;
    if (left !== right) {
      return left - right;
    }
    return a.team_name.localeCompare(b.team_name);
  });

  const hasOfficialCoverage = merged.length === OFFICIAL_BRASILEIRAO_TEAMS_2026.length;

  return hasOfficialCoverage
    ? {
        api_status: payload?.api_status ?? FALLBACK_BRASILEIRAO_TEAM_BOARD.api_status,
        teams: merged,
      }
    : FALLBACK_BRASILEIRAO_TEAM_BOARD;
}

const marketLabels = [
  "Casa vence",
  "Empate",
  "Visitante vence",
  "Over 2.5",
  "Under 2.5",
  "Ambas marcam",
];

const teamBranding: Record<string, { short: string; colors: string }> = {
  "Palmeiras": { short: "PAL", colors: "from-emerald-500 to-emerald-700" },
  "Sao Paulo": { short: "SAO", colors: "from-red-500 to-zinc-800" },
  "Fluminense": { short: "FLU", colors: "from-emerald-600 to-rose-700" },
  "Flamengo": { short: "FLA", colors: "from-red-600 to-zinc-900" },
  "Bahia": { short: "BAH", colors: "from-blue-600 to-red-600" },
  "Athletico Paranaense": { short: "CAP", colors: "from-red-600 to-zinc-900" },
  "Chapecoense": { short: "CHA", colors: "from-emerald-500 to-green-700" },
  "Coritiba": { short: "CFC", colors: "from-emerald-500 to-zinc-700" },
  "Gremio": { short: "GRE", colors: "from-sky-500 to-zinc-800" },
  "Vasco": { short: "VAS", colors: "from-zinc-200 to-zinc-800" },
  "Vitoria": { short: "VIT", colors: "from-red-500 to-zinc-900" },
  "Botafogo": { short: "BOT", colors: "from-zinc-200 to-zinc-800" },
  "Corinthians": { short: "COR", colors: "from-zinc-100 to-zinc-700" },
  "Internacional": { short: "INT", colors: "from-red-500 to-red-700" },
  "Atletico Mineiro": { short: "CAM", colors: "from-zinc-200 to-zinc-800" },
  "Bragantino": { short: "RBB", colors: "from-red-500 to-zinc-700" },
  "Cruzeiro": { short: "CRU", colors: "from-blue-500 to-blue-700" },
  "Santos": { short: "SAN", colors: "from-zinc-100 to-zinc-700" },
  "Mirassol": { short: "MIR", colors: "from-yellow-400 to-green-600" },
  "Remo": { short: "REM", colors: "from-sky-500 to-indigo-700" },
};

function TeamShield({ team }: { team: string }) {
  const brand = teamBranding[team] || { short: team.slice(0, 3).toUpperCase(), colors: "from-slate-500 to-slate-700" };

  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br ${brand.colors} text-xs font-display font-bold text-white shadow-sm`}>
      {brand.short}
    </div>
  );
}

export const BrasileiraoDashboard = ({ onBack, onOpenChat }: BrasileiraoDashboardProps) => {
  const [data, setData] = useState<TeamBoardResponse | null>(null);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(getApiBaseCandidates()[0] || "mesma origem");

  const loadTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: payload, baseUrl } = await fetchJsonWithFallback<TeamBoardResponse>("/brasileirao/teams");
      setData(sanitizeTeamBoard(payload));
      setApiBaseUrl(baseUrl || "mesma origem");

      try {
        const { data: overviewPayload } = await fetchJsonWithFallback<OverviewResponse>("/brasileirao/overview");
        setOverview(overviewPayload);
      } catch {
        setOverview(FALLBACK_BRASILEIRAO_OVERVIEW);
      }
    } catch (err) {
      setData(FALLBACK_BRASILEIRAO_TEAM_BOARD);
      setOverview(FALLBACK_BRASILEIRAO_OVERVIEW);
      setApiBaseUrl("dataset local 2026");
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTeams();
  }, []);

  const teams = data?.teams ?? [];
  const mensGamesToday = overview?.summary?.mens_games_today;
  const liveCount = mensGamesToday === false ? 0 : teams.filter((team) => team.status === "live").length;
  const upcomingCount = mensGamesToday === false ? 0 : teams.filter((team) => team.status === "upcoming").length;
  const endedCount = teams.filter((team) => team.status === "ended").length;
  const topStandings = overview?.standings?.slice(0, 7) ?? [];
  const recentMatches = overview?.recent_matches?.slice(0, 6) ?? [];
  const nextMatches = overview?.next_matches?.slice(0, 4) ?? [];
  const topScorers = overview?.top_scorers?.slice(0, 5) ?? [];
  const news = overview?.news?.slice(0, 4) ?? [];
  const insights = overview?.insights?.slice(0, 4) ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 border-b border-border glass-surface"
      >
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4">
          <button
            onClick={onBack}
            className="rounded-xl border border-border bg-secondary p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-display font-semibold uppercase tracking-[0.24em] text-primary">
              Painel do Brasileirão
            </p>
            <h1 className="font-display text-xl font-bold text-foreground">
              Acompanhamento rápido dos times
            </h1>
            <p className="text-sm text-muted-foreground">
              Veja quem está ao vivo, quem joga hoje e abra a análise no chat com um toque.
            </p>
          </div>
          <button
            onClick={() => void loadTeams()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
      </motion.header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-5">
        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-neon-green/20 bg-neon-green/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-neon-green">
              <Radio className="h-4 w-4" />
              <span className="text-xs font-display font-semibold uppercase tracking-wider">Ao vivo</span>
            </div>
            <p className="font-display text-3xl font-bold text-foreground">{liveCount}</p>
            <p className="text-sm text-muted-foreground">
              {mensGamesToday === false ? "Sem jogo da Série A masculina hoje." : "Times com jogo acontecendo agora."}
            </p>
          </div>
          <div className="rounded-2xl border border-neon-blue/20 bg-neon-blue/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-neon-blue">
              <Timer className="h-4 w-4" />
              <span className="text-xs font-display font-semibold uppercase tracking-wider">Hoje</span>
            </div>
            <p className="font-display text-3xl font-bold text-foreground">{upcomingCount}</p>
            <p className="text-sm text-muted-foreground">
              {mensGamesToday === false
                ? `Próxima rodada a partir de ${overview?.summary?.next_round_start || "abril"}.`
                : "Times com jogo programado para hoje."}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-amber-400">
              <Trophy className="h-4 w-4" />
              <span className="text-xs font-display font-semibold uppercase tracking-wider">Últimos jogos</span>
            </div>
            <p className="font-display text-3xl font-bold text-foreground">{endedCount}</p>
            <p className="text-sm text-muted-foreground">Times com histórico recente identificado.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/70 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Status da integração</h2>
              <p className="text-sm text-muted-foreground">
                {error
                  ? "Não foi possível carregar os dados ao vivo agora."
                  : `Fonte atual: ${data?.api_status ?? "carregando"}`}
              </p>
            </div>
            <div className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
              API base: {apiBaseUrl}
            </div>
          </div>
          {overview?.summary?.mens_games_today_note ? (
            <div className="mt-3 rounded-xl border border-neon-blue/20 bg-neon-blue/5 px-3 py-2 text-sm text-muted-foreground">
              {overview.summary.mens_games_today_note}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <WhatsAppCTA message="Oi! Quero continuar meu atendimento do painel do Brasileirão no WhatsApp." />
          </div>
        </section>

        {overview ? (
          <section className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr_0.9fr]">
            <article className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-display font-semibold uppercase tracking-[0.24em] text-primary">
                    Tabela 2026
                  </p>
                  <h2 className="font-display text-lg font-bold text-foreground">Topo do Brasileirão</h2>
                </div>
                <div className="text-xs text-muted-foreground">Atualizado em {overview.updated_at || "-"}</div>
              </div>
              <div className="space-y-2">
                {topStandings.map((row) => (
                  <div key={row.team} className="grid grid-cols-[36px_1fr_52px_52px] items-center rounded-xl bg-secondary px-3 py-2.5">
                    <div className="font-display text-lg font-bold text-primary">{row.position}</div>
                    <div className="flex items-center gap-3">
                      <TeamShield team={row.team} />
                      <div>
                        <div className="font-semibold text-foreground">{row.team}</div>
                      <div className="text-xs text-muted-foreground">{row.games} jogos</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] uppercase text-muted-foreground">Pts</div>
                      <div className="font-display text-lg font-bold text-foreground">{row.points}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] uppercase text-muted-foreground">SG</div>
                      <div className="font-display text-lg font-bold text-foreground">{row.goal_diff}</div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4">
                <p className="text-[10px] font-display font-semibold uppercase tracking-[0.24em] text-primary">
                  Últimos jogos
                </p>
                <h2 className="font-display text-lg font-bold text-foreground">Rodada recente</h2>
              </div>
              <div className="space-y-2">
                {recentMatches.map((match) => (
                  <button
                    key={`${match.date}-${match.home_team}-${match.away_team}`}
                    onClick={() => onOpenChat(`me explica como foi ${match.home_team} x ${match.away_team} no Brasileirão`)}
                    className="w-full rounded-xl border border-border bg-secondary px-3 py-3 text-left transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <TeamShield team={match.home_team} />
                        <div>
                        <div className="font-semibold text-foreground">
                          {match.home_team} {match.home_score} x {match.away_score} {match.away_team}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Rodada {match.round} • {match.stadium}
                        </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{match.date}</div>
                    </div>
                  </button>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4">
                <p className="text-[10px] font-display font-semibold uppercase tracking-[0.24em] text-primary">
                  Destaques
                </p>
                <h2 className="font-display text-lg font-bold text-foreground">Artilharia e insights</h2>
              </div>
              <div className="space-y-2">
                {topScorers.map((row, index) => (
                  <div key={`${row.player}-${row.team}`} className="rounded-xl bg-secondary px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TeamShield team={row.team} />
                        <div>
                        <div className="font-semibold text-foreground">{index + 1}. {row.player}</div>
                        <div className="text-xs text-muted-foreground">{row.team}</div>
                        </div>
                      </div>
                      <div className="font-display text-xl font-bold text-primary">{row.goals}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {insights.map((insight) => (
                  <div key={insight} className="rounded-xl border border-primary/10 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
                    {insight}
                  </div>
                ))}
              </div>
            </article>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[10px] font-display font-semibold uppercase tracking-[0.24em] text-primary">
                      Notícias do momento
                    </p>
                    <h2 className="font-display text-lg font-bold text-foreground">O que mexe com a rodada</h2>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {news.map((item) => (
                    <div key={item.title} className="rounded-xl border border-border bg-secondary p-4">
                      <div className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        {item.tag}
                      </div>
                      <h3 className="mt-3 font-display text-base font-bold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[10px] font-display font-semibold uppercase tracking-[0.24em] text-primary">
                      Onde funciona a análise
                    </p>
                    <h2 className="font-display text-lg font-bold text-foreground">Mercados analisados pelo modelo</h2>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {marketLabels.map((label) => (
                    <div key={label} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-foreground">
                      {label}
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
                  A leitura funciona melhor quando você entra por time, confronto ou jogo ao vivo. O bot traz uma visão simples do momento do clube e, se fizer sentido, mostra os mercados analisados sem inventar dado fora da base.
                </div>
              </article>
            </div>

            {nextMatches.length ? (
              <article className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4">
                  <p className="text-[10px] font-display font-semibold uppercase tracking-[0.24em] text-primary">
                    Próxima rodada
                  </p>
                  <h2 className="font-display text-lg font-bold text-foreground">Jogos confirmados da retomada</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {nextMatches.map((match) => (
                    <button
                      key={`${match.date}-${match.home_team}-${match.away_team}`}
                      onClick={() => onOpenChat(`me prepara para ${match.home_team} x ${match.away_team} no Brasileirão`)}
                      className="rounded-xl border border-border bg-secondary px-4 py-3 text-left transition-colors hover:border-primary/30"
                    >
                      <div className="font-semibold text-foreground">{match.home_team} x {match.away_team}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Rodada {match.round} • {match.date}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{match.stadium}</div>
                    </button>
                  ))}
                </div>
              </article>
            ) : null}
          </section>
        ) : null}

        {error ? (
          <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
            Erro ao carregar o painel: {error}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading && !teams.length ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="h-48 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))
          ) : (
            teams.map((team, index) => {
              const status = statusCopy[team.status] ?? statusCopy.sem_dados;
              const prompt = `quero análise do jogo do ${team.team_name}`;

              return (
                <motion.article
                  key={team.team_key}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <TeamShield team={team.team_name} />
                      <div>
                      <h3 className="font-display text-lg font-bold text-foreground">{team.team_name}</h3>
                      <p className="text-sm text-muted-foreground">{team.match_label}</p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.badge}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-secondary p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Posição</p>
                      <p className="mt-1 font-display text-xl font-bold text-foreground">
                        {team.position ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-secondary p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pontos</p>
                      <p className="mt-1 font-display text-xl font-bold text-foreground">
                        {team.points ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-secondary p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Jogos</p>
                      <p className="mt-1 font-display text-xl font-bold text-foreground">
                        {team.games_played ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-secondary p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Placar</p>
                      <p className="mt-1 font-display text-xl font-bold text-foreground">{team.score || "-"}</p>
                    </div>
                    <div className="rounded-xl bg-secondary p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Minuto</p>
                      <p className="mt-1 font-display text-xl font-bold text-foreground">{team.minute || "-"}</p>
                    </div>
                    <div className="rounded-xl bg-secondary p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Event ID</p>
                      <p className="mt-1 truncate font-display text-sm font-bold text-foreground">
                        {team.event_id || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-secondary p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Próximo jogo</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {team.next_match_label || "Sem proximo jogo confirmado"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Forma recente: {team.form || "indisponível"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Escalação: {team.status === "live" ? "acompanhando ao vivo" : team.status === "upcoming" ? "provável a confirmar" : "sem confirmação no momento"}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => onOpenChat(prompt)}
                      className="w-full rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      Abrir análise no chat
                    </button>
                    <button
                      onClick={() => onOpenChat(`quais sao as melhores oportunidades ao vivo para ${team.team_name}?`)}
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/30"
                    >
                      Ver mercados do time
                    </button>
                    <button
                      onClick={() => onOpenChat(`me diga onde a análise funciona melhor para apostar no ${team.team_name}`)}
                      className="w-full rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:opacity-90"
                    >
                      Onde funciona a análise
                    </button>
                  </div>
                </motion.article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
};
