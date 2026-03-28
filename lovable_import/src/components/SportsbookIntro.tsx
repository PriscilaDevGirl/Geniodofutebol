import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Gift,
  MessageCircle,
  Mic,
  Radar,
  Search,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { AnimatedMascot } from "./AnimatedMascot";
import { WhatsAppCTA } from "./WhatsAppCTA";

interface SportsbookIntroProps {
  onContinue: () => void;
  onVoiceStart: () => void;
}

const leagues = [
  "Brasileirao Serie A",
  "Brasileirao Serie B",
  "Copa do Brasil",
  "UEFA Champions",
  "UEFA Europa League",
  "Copa Libertadores",
  "Copa Sul-Americana",
  "Premier League",
  "NBA",
  "LaLiga Espanha",
  "Bundesliga",
  "Serie A Italia",
  "MLS",
];

const liveRows = [
  { minute: "81:23", home: "Marrocos", away: "Equador", result: "3 4 1", other: "+98" },
  { minute: "08:57", home: "Botafogo", away: "Corinthians", result: "0 0 0", other: "+211" },
  { minute: "01:57", home: "Santos FC", away: "Ferroviaria", result: "2 3 2", other: "+212" },
  { minute: "44:54", home: "Cidade do Cabo", away: "Apoel", result: "3 2 4", other: "+180" },
];

const bets = [
  ["Palmeiras - Gremio", "1.72"],
  ["Cruzeiro - Santos", "2.05"],
  ["Remo - Bahia", "2.64"],
  ["Coritiba - Vasco", "2.28"],
  ["Fluminense - Atletico Mineiro", "1.93"],
];

const brasileiraoPulse = [
  { team: "Flamengo", mood: "Ataque em alta", tone: "from-[#16c47f] to-[#0d7a55]" },
  { team: "Botafogo", mood: "Pressao alta", tone: "from-[#2b6fff] to-[#1239b8]" },
  { team: "Palmeiras", mood: "Controle total", tone: "from-[#c5ff4d] to-[#4dbf38]" },
  { team: "Bahia", mood: "Bloco competitivo", tone: "from-[#ff7a45] to-[#d94a1f]" },
];

const rodadaSignals = [
  { label: "Duelo mais quente", value: "Palmeiras x Gremio", accent: "text-[#8eff79]" },
  { label: "Clube em ascensao", value: "Fluminense", accent: "text-[#4cc9ff]" },
  { label: "Pressao da rodada", value: "Cruzeiro na retomada", accent: "text-[#ffd84d]" },
  { label: "Ataque em evidencia", value: "Flamengo", accent: "text-[#ff8a7a]" },
  { label: "Time para observar", value: "Bahia", accent: "text-[#9ecbff]" },
  { label: "Reacao que chama atencao", value: "Botafogo", accent: "text-[#d8e1ff]" },
];

const radarCuriosidades = [
  { label: "Recorte da rodada", value: "3 jogos noturnos concentram a atencao do torcedor hoje." },
  { label: "Olho no mando", value: "Palmeiras e Cruzeiro chegam com ambiente favoravel jogando em casa." },
  { label: "Conversa quente", value: "Bahia entra como o time que mais pode surpreender no recorte atual." },
];

const radarLeituras = [
  { title: "Momento ofensivo", text: "Flamengo e Palmeiras sustentam o pulso mais agressivo entre os destaques." },
  { title: "Pressao emocional", text: "Botafogo e Cruzeiro sao os gatilhos mais fortes para perguntas no chat hoje." },
];

const agendaHoje = [
  { hour: "01/04 19:00", match: "Remo x Bahia", tag: "Baenao" },
  { hour: "01/04 20:30", match: "Cruzeiro x Santos", tag: "Mineirao" },
  { hour: "01/04 21:30", match: "Palmeiras x Gremio", tag: "Arena Barueri" },
];

const tabelaFlash = [
  { pos: "1", team: "Palmeiras", pts: "19" },
  { pos: "2", team: "Sao Paulo", pts: "16" },
  { pos: "3", team: "Fluminense", pts: "16" },
  { pos: "4", team: "Flamengo", pts: "14" },
];

const jogadoresEmAlta = [
  { name: "Vinicius", team: "Gremio", note: "Artilheiro atual com 6 gols" },
  { name: "Danilo Santos", team: "Botafogo", note: "Vice-artilheiro com 5 gols" },
  { name: "Calleri", team: "Sao Paulo", note: "Referencia ofensiva do topo da tabela" },
];

export const SportsbookIntro = ({ onContinue, onVoiceStart }: SportsbookIntroProps) => {
  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-700">
      <div className="mx-auto max-w-[1320px] px-4 py-3">
        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>27/03/26, 19:01</span>
            <Bell className="h-3.5 w-3.5" />
          </div>
          <p className="font-medium text-slate-600">Esportes da Sorte - A gente aposta em voce!</p>
          <div className="flex items-center gap-2">
            <span>PROMOCOES</span>
          </div>
        </div>

        <div className="rounded-[28px] bg-[#0d1452] p-3 shadow-[0_18px_40px_rgba(13,20,82,0.18)]">
          <div className="mb-3 flex items-center justify-between rounded-[20px] bg-[#121b63] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black leading-none">
                <span className="text-[#8eff79]">Esportes</span>
                <span className="block text-white">daSorte</span>
              </div>
              <div className="hidden h-8 w-px bg-white/15 md:block" />
              <div className="hidden items-center gap-4 text-[12px] font-semibold text-white/80 md:flex">
                <span>ESPORTES</span>
                <span>APOSTAS AO VIVO</span>
                <span>CASSINO</span>
                <span>CASSINO AO VIVO</span>
                <span className="text-[#8eff79]">AVIATOR</span>
                <span>VIRTUAIS</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white px-4 py-1.5 text-[11px] font-semibold text-slate-700">ryu27</div>
              <div className="rounded-full bg-white px-4 py-1.5 text-[11px] font-semibold text-slate-700">
                ••••••••••••••
              </div>
              <div className="rounded-full border border-[#7cff63] px-3 py-1 text-[10px] font-semibold text-[#7cff63]">
                LOGIN
              </div>
              <div className="rounded-full bg-[#7cff63] px-3 py-1 text-[10px] font-semibold text-[#0d1452]">
                CADASTRE-SE
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[215px_minmax(0,1fr)_290px]">
            <aside className="space-y-3 self-start">
              <div className="rounded-[20px] bg-white/95 p-3">
                <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500">
                  <Search className="h-3.5 w-3.5" />
                  Pesquisa Detalhada
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
                  Buscar (min. 4 caracteres)
                </div>
              </div>

              <div className="rounded-[20px] bg-white/95 p-3">
                <div className="mb-3 space-y-2">
                  {["Premio diario", "Bau", "Missoes", "Torneios"].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-white ${
                          index % 2 === 0 ? "bg-[#7cff63]" : "bg-[#2b6fff]"
                        }`}
                      >
                        <Gift className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Acesso</p>
                        <p className="text-xs font-semibold text-slate-700">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  {leagues.map((item, index) => (
                    <div
                      key={item}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-[12px] ${
                        index === 0 ? "bg-[#0f2a79] text-white" : "border border-slate-100 bg-white text-slate-600"
                      }`}
                    >
                      <span>{item}</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <main className="space-y-3 self-start">
              <div className="grid gap-3 md:grid-cols-[1fr_0.9fr]">
                <div className="rounded-[20px] bg-white/95 p-3">
                  <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-slate-500">
                    <span>Promocoes</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                  <div className="grid h-[108px] grid-cols-3 gap-2 rounded-2xl bg-[#eff4ff] p-2">
                    <div className="rounded-xl bg-gradient-to-br from-[#fa7c55] to-[#ffce4e]" />
                    <div className="rounded-xl bg-gradient-to-br from-[#0d63ff] to-[#28c6ff]" />
                    <div className="rounded-xl bg-gradient-to-br from-[#4816d8] to-[#12b66e]" />
                  </div>
                </div>

                <div className="rounded-[20px] bg-white/95 p-3">
                  <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-slate-500">
                    <span>Jogos-Online</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                  <div className="grid h-[108px] grid-cols-3 gap-2">
                    {["Fortune Tiger", "JetX", "Aviator"].map((label, index) => (
                      <div
                        key={label}
                        className={`rounded-xl p-2 text-white ${
                          index === 0
                            ? "bg-gradient-to-br from-[#ff8a00] to-[#ffcc33]"
                            : index === 1
                              ? "bg-gradient-to-br from-[#191b28] to-[#39425e]"
                              : "bg-gradient-to-br from-[#6d0d3b] to-[#de2e64]"
                        }`}
                      >
                        <div className="text-[9px] uppercase opacity-70">Novo</div>
                        <div className="mt-9 text-[11px] font-bold">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] bg-white/95 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700">Ao Vivo</span>
                    <span className="rounded-full bg-[#76ff6c] px-3 py-1 text-[10px] font-bold text-[#11452c]">
                      Futebol
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Mostrar todos</div>
                </div>

                <div className="space-y-2">
                  {liveRows.map((row) => (
                    <div
                      key={`${row.home}-${row.away}`}
                      className="grid items-center gap-3 rounded-xl border border-slate-100 px-3 py-3 md:grid-cols-[74px_1fr_84px_60px]"
                    >
                      <div>
                        <div className="text-[11px] font-semibold text-[#2cd95d]">{row.minute}</div>
                        <div className="text-[10px] text-slate-400">2º parte</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-700">{row.home}</div>
                        <div className="text-sm text-slate-400">{row.away}</div>
                      </div>
                      <div className="text-center text-lg font-black text-slate-700">{row.result}</div>
                      <div className="text-center text-xs font-semibold text-slate-400">{row.other}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
                <div className="rounded-[20px] bg-white/95 p-4">
                  <div className="mb-2 text-sm font-bold text-slate-700">Cassino ao Vivo</div>
                  <div className="grid grid-cols-3 gap-2">
                    {["Bac Bo", "Super Trunfo", "Crazy Time"].map((card) => (
                      <div key={card} className="rounded-xl bg-slate-100 p-3 text-center text-[11px] font-semibold text-slate-500">
                        {card}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[20px] bg-white/95 p-4">
                  <div className="mb-2 text-sm font-bold text-slate-700">Partidas Populares</div>
                  <div className="space-y-2 text-[12px] text-slate-500">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span>Bragantino x Flamengo</span>
                      <span>+538</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span>Botafogo x Corinthians</span>
                      <span>+322</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr_1fr]">
                <div className="h-full rounded-[22px] border border-white/8 bg-[#11206e] p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8eff79]">Agenda quente</div>
                      <div className="mt-1 text-lg font-black">Jogos de hoje</div>
                    </div>
                    <Activity className="h-5 w-5 text-[#8eff79]" />
                  </div>
                  <div className="space-y-2">
                    {agendaHoje.map((game) => (
                      <div key={game.match} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold">{game.match}</div>
                          <div className="rounded-full bg-[#8eff79] px-2.5 py-1 text-[10px] font-bold text-[#09133d]">
                            {game.hour}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-white/68">{game.tag}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-full rounded-[22px] border border-white/8 bg-[#0f1c63] p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#4cc9ff]">Tabela flash</div>
                      <div className="mt-1 text-lg font-black">Top 4 agora</div>
                    </div>
                    <Zap className="h-5 w-5 text-[#4cc9ff]" />
                  </div>
                  <div className="space-y-2">
                    {tabelaFlash.map((row) => (
                      <div key={row.team} className="grid grid-cols-[32px_1fr_42px] items-center rounded-2xl border border-white/10 bg-white/8 px-3 py-2.5">
                        <div className="text-sm font-black text-[#ffd84d]">{row.pos}</div>
                        <div className="text-sm font-semibold">{row.team}</div>
                        <div className="text-right text-sm font-bold text-white/72">{row.pts}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-full rounded-[22px] border border-white/8 bg-[#132878] p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ffd84d]">Jogadores em foco</div>
                      <div className="mt-1 text-lg font-black">Quem chega forte</div>
                    </div>
                    <Sparkles className="h-5 w-5 text-[#ffd84d]" />
                  </div>
                  <div className="space-y-2">
                    {jogadoresEmAlta.map((player) => (
                      <div key={player.name} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold">{player.name}</div>
                          <div className="text-[11px] font-semibold text-[#8eff79]">{player.team}</div>
                        </div>
                        <div className="mt-1 text-xs text-white/68">{player.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </main>

            <aside className="space-y-3 self-start">
              <div className="rounded-[20px] bg-white/95 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-700">Bilhete 7</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">Simples</div>
                  </div>
                  <Shield className="h-5 w-5 text-slate-300" />
                </div>

                <div className="space-y-2">
                  {bets.map(([label, odd]) => (
                    <div key={label} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm">
                      <div>
                        <div className="font-medium text-slate-700">{label}</div>
                        <div className="text-[11px] text-slate-400">Resultado</div>
                      </div>
                      <div className="font-semibold text-slate-500">{odd}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[20px] border border-[#2262ff]/15 bg-white">
                <div className="flex items-center gap-3 bg-[#245cff] px-4 py-3 text-white">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full">
                    <div className="scale-[0.98]">
                      <AnimatedMascot size="md" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Online</div>
                    <div className="text-sm font-bold">Esportes da Sorte</div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-2xl font-black text-[#19234d]">Olá, tudo bem?</h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
                    Fale com o Gênio do Futebol por voz ou continue a conversa no WhatsApp.
                  </p>

                  <div className="mt-4 rounded-[22px] border border-[#dbe8ff] bg-[#f4f8ff] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#245cff] text-white shadow-lg shadow-blue-500/20">
                        <Mic className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#19234d]">Chat de voz</div>
                        <div className="text-[12px] text-slate-500">Toque para começar uma conversa rápida com o Gênio.</div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={onVoiceStart}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#245cff] px-4 py-3 text-sm font-semibold text-white"
                    >
                      <Mic className="h-4 w-4" />
                      Falar com o Gênio
                    </motion.button>
                  </div>

                  <div className="mt-4 rounded-[22px] border border-[#dff6df] bg-[#f4fff4] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#19a750] text-white shadow-lg shadow-emerald-500/20">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#123321]">Vamos conversar no WhatsApp</div>
                        <div className="text-[12px] text-slate-500">Abrir a conversa com seu atendimento esportivo em poucos toques.</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <WhatsAppCTA
                        className="w-full rounded-xl bg-[#19a750] bg-none px-4 py-3 text-white shadow-none hover:opacity-95"
                        label="Conversar no WhatsApp"
                        message="Oi! Quero falar com o Gênio do Futebol no WhatsApp."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] bg-white/95 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CircleHelp className="h-4 w-4 text-[#2b6fff]" />
                  Gênio do Futebol
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
                  O avatar do atendimento agora fica do lado direito, na bolinha online.
                </p>
              </div>
            </aside>
          </div>

          <section className="mt-3 overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(89,196,255,0.22),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(142,255,121,0.18),transparent_22%),linear-gradient(135deg,#101a66_0%,#0b144f_52%,#07103e_100%)] p-5 text-white">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr]">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
                  <Radar className="h-4 w-4 text-[#8eff79]" />
                  Radar do Brasileirao
                </div>
                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="max-w-xl text-3xl font-black leading-tight text-white">
                      O mapa vivo da rodada com energia, pressao e momento dos times.
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72">
                      Um painel mais emocional e tatico para o torcedor entender quem chega em alta, quem entra pressionado
                      e onde a rodada pode virar conversa quente no chat.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onVoiceStart}
                      className="inline-flex items-center gap-2 rounded-full bg-[#8eff79] px-4 py-2 text-sm font-bold text-[#07103e]"
                    >
                      <Mic className="h-4 w-4" />
                      Ler rodada com o Gênio
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onContinue}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-white"
                    >
                      <Sparkles className="h-4 w-4 text-[#ffd84d]" />
                      Explorar times
                    </motion.button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  {brasileiraoPulse.map((item, index) => (
                    <motion.div
                      key={item.team}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="rounded-[22px] border border-white/10 bg-white/8 p-3 backdrop-blur-sm"
                    >
                      <div className={`rounded-2xl bg-gradient-to-r ${item.tone} p-[1px]`}>
                        <div className="rounded-[15px] bg-[#0b1450] px-3 py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">Pulso</span>
                            <Activity className="h-4 w-4 text-white/80" />
                          </div>
                          <div className="mt-3 text-lg font-black">{item.team}</div>
                          <div className="mt-1 text-xs text-white/72">{item.mood}</div>
                          <div className="mt-3 flex items-end gap-1">
                            {[44, 68, 52, 80, 61, 90].map((height, barIndex) => (
                              <div
                                key={`${item.team}-${barIndex}`}
                                className="w-2 rounded-full bg-white/85"
                                style={{ height: `${height / 4}px`, opacity: 0.35 + barIndex * 0.1 }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">Curiosidades da rodada</p>
                        <h4 className="mt-1 text-lg font-black">Leituras que completam o mapa</h4>
                      </div>
                      <Sparkles className="h-5 w-5 text-[#8eff79]" />
                    </div>

                    <div className="mt-4 space-y-3">
                      {radarCuriosidades.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/8 bg-[#0b1450]/80 px-4 py-3">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">{item.label}</div>
                          <div className="mt-1 text-sm font-medium leading-relaxed text-white/82">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">Raio x da conversa</p>
                        <h4 className="mt-1 text-lg font-black">O que o torcedor tende a buscar</h4>
                      </div>
                      <MessageCircle className="h-5 w-5 text-[#4cc9ff]" />
                    </div>

                    <div className="mt-4 space-y-3">
                      {radarLeituras.map((item) => (
                        <div key={item.title} className="rounded-2xl border border-white/8 bg-[#0b1450]/80 px-4 py-3">
                          <div className="text-sm font-bold text-white">{item.title}</div>
                          <div className="mt-1 text-sm leading-relaxed text-white/72">{item.text}</div>
                        </div>
                      ))}
                      <div className="rounded-2xl border border-[#ffd84d]/20 bg-[#ffd84d]/10 px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[#ffd84d]">Sugestao de uso</div>
                        <div className="mt-1 text-sm leading-relaxed text-white/82">
                          Misturar momento, pressao e mando deixa o painel mais util do que mostrar so placar seco.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[22px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">Sintonia da rodada</p>
                      <h4 className="mt-1 text-xl font-black">Termometro do Brasileirao</h4>
                    </div>
                    <Zap className="h-5 w-5 text-[#ffd84d]" />
                  </div>

                  <div className="mt-4 space-y-3">
                    {rodadaSignals.map((signal) => (
                      <div key={signal.label} className="rounded-2xl border border-white/8 bg-[#0b1450]/80 px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">{signal.label}</div>
                        <div className={`mt-1 text-sm font-bold ${signal.accent}`}>{signal.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">Conversa pronta</p>
                      <h4 className="mt-1 text-xl font-black">Perguntas que puxam contexto</h4>
                    </div>
                    <CircleHelp className="h-5 w-5 text-[#8eff79]" />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      "Como chega o Bahia?",
                      "Quem esta pressionado na rodada?",
                      "Ultimos jogos do Flamengo",
                      "Qual time vive melhor fase?",
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold text-white/88 transition hover:bg-white/14"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-[#8eff79]/20 bg-[#09133d] px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#8eff79]">Insight do Gênio</div>
                    <p className="mt-2 text-sm leading-relaxed text-white/78">
                      Quando o torcedor pergunta por um time, a melhor leitura nao e so placar. E momento, pressao,
                      forma recente e o peso daquela rodada.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
