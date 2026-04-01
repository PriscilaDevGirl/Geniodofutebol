import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Flame, LayoutDashboard, Mic, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AnimatedMascot } from "./AnimatedMascot";
import { FanSentiment } from "./FanSentiment";
import { InsightCard } from "./InsightCard";
import { MarketOdds } from "./MarketOdds";
import { MatchProbabilityBar } from "./MatchProbabilityBar";
import { NeuroEducation } from "./NeuroEducation";
import { WhatsAppCTA } from "./WhatsAppCTA";
import { postJsonWithFallback } from "@/lib/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  channel?: "chat" | "whatsapp";
  insights?: Array<{
    type: "probability" | "risk" | "opportunity" | "momentum" | "warning";
    title: string;
    value: string;
    description: string;
  }>;
  matchProb?: {
    homeTeam: string;
    awayTeam: string;
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  markets?: Array<{
    name: string;
    probability: number;
    edge: string;
    recommendation: "alta" | "media" | "baixa";
  }>;
  fanSentiment?: {
    team: string;
    mood: "empolgado" | "confiante" | "nervoso" | "revoltado" | "dividido";
    percentage: number;
    topComment: string;
  };
  eventScenarios?: Array<{
    title: string;
    probability: number;
    description: string;
  }>;
  quickReplies?: string[];
}

const FALLBACK_RESPONSE: ChatMessage = {
  id: "fallback",
  role: "assistant",
  content:
    "Posso te ajudar com analises do Brasileirao, jogos atuais do futebol e amistosos de selecoes.\n\nSe o Brasileirao estiver sem rodada no momento, eu sigo com leitura de jogos do dia, contexto ao vivo e alternativas internacionais no chat.",
  quickReplies: [
    "Quem joga hoje?",
    "Quais sao as oportunidades ao vivo?",
    "Me fala dos amistosos da copa do mundo",
    "Me fala do Flamengo",
  ],
};

interface ChatScreenProps {
  initialMessage?: string;
  onBack: () => void;
  onOpenDashboard: () => void;
}

interface ChatApiResponse {
  reply: string;
  mode?: string;
  source?: string;
  suggested_actions?: string[];
  quick_actions?: string[];
  snapshot?: {
    game?: {
      home_team?: string;
      away_team?: string;
    };
    market_probabilities?: Record<string, number>;
    analysis?: {
      tilt?: {
        level?: string;
        summary?: string;
      };
      zen_guard?: {
        status?: string;
        reason?: string;
      };
      crowd_sentiment?: {
        mood?: "empolgado" | "confiante" | "nervoso" | "revoltado" | "dividido";
        score?: number;
        summary?: string;
      };
      opportunities?: Array<{
        label?: string;
        edge?: number;
        value?: boolean;
      }>;
      markets?: Array<{
        label?: string;
        probability?: number;
      }>;
    };
  };
  board?: {
    top_opportunities?: Array<{
      market_label?: string;
      edge?: number;
      value?: boolean;
    }>;
  };
}

interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionEventLike extends Event {
  results: {
    [index: number]: SpeechRecognitionResultLike;
    length: number;
  };
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

function toPercent(value?: number) {
  return Math.round((value ?? 0) * 100);
}

function toEdgeLabel(value?: number) {
  if (typeof value !== "number") return "0.0%";
  const percentage = (value * 100).toFixed(1);
  return `${value >= 0 ? "+" : ""}${percentage}%`;
}

function normalizeRecommendation(value?: boolean, edge?: number): "alta" | "media" | "baixa" {
  if (value && (edge ?? 0) > 0.1) return "alta";
  if ((edge ?? 0) > 0) return "media";
  return "baixa";
}

function buildAssistantMessage(payload: ChatApiResponse): ChatMessage {
  const snapshot = payload.snapshot;
  const analysis = snapshot?.analysis;
  const probabilities = snapshot?.market_probabilities;
  const topOpportunities = payload.board?.top_opportunities ?? analysis?.opportunities ?? [];
  const marketRows = analysis?.markets ?? [];
  const mood = analysis?.crowd_sentiment?.mood ?? "dividido";
  const crowdScore = analysis?.crowd_sentiment?.score ?? 0.5;

  const insights: ChatMessage["insights"] = [];

  if (analysis?.tilt) {
    insights.push({
      type: analysis.tilt.level === "alto" ? "warning" : "risk",
      title: "Tilt",
      value: analysis.tilt.level || "baixo",
      description: analysis.tilt.summary || "Sem leitura emocional detalhada.",
    });
  }

  if (analysis?.zen_guard) {
    insights.push({
      type: analysis.zen_guard.status === "liberar" ? "opportunity" : "warning",
      title: "Zen Guard",
      value: analysis.zen_guard.status || "alertar",
      description: analysis.zen_guard.reason || "Cautela na exposicao.",
    });
  }

  if (topOpportunities[0]) {
    insights.push({
      type: topOpportunities[0].value ? "opportunity" : "probability",
      title: "Melhor mercado",
      value: topOpportunities[0].label || "Oportunidade ao vivo",
      description: `Edge ${toEdgeLabel(topOpportunities[0].edge)}`,
    });
  }

  const eventScenarios: ChatMessage["eventScenarios"] = [
    {
      title: "Gol",
      probability: toPercent(probabilities?.goal_next_10m),
      description: "Chance de gol nos proximos 10 minutos.",
    },
    {
      title: "Cartao",
      probability: toPercent(probabilities?.card_next_10m),
      description: "Chance de cartao no recorte imediato do jogo.",
    },
    {
      title: "Penalti",
      probability: toPercent(probabilities?.penalty_in_match),
      description: "Chance de penalti ate o fim da partida.",
    },
  ].filter((scenario) => scenario.probability > 0);

  return {
    id: `${Date.now()}`,
    role: "assistant",
    channel: payload.mode === "whatsapp_webhook_simulation" ? "whatsapp" : "chat",
    content: payload.reply || FALLBACK_RESPONSE.content,
    insights: insights.length ? insights : undefined,
    matchProb:
      snapshot?.game?.home_team && snapshot?.game?.away_team && probabilities
        ? {
            homeTeam: snapshot.game.home_team,
            awayTeam: snapshot.game.away_team,
            homeWin: toPercent(probabilities.home_win),
            draw: toPercent(probabilities.draw),
            awayWin: toPercent(probabilities.away_win),
          }
        : undefined,
    markets: marketRows.length
      ? marketRows.slice(0, 4).map((market) => {
          const opportunity = topOpportunities.find((item) => item.label === market.label);
          return {
            name: market.label || "Mercado",
            probability: toPercent(market.probability),
            edge: toEdgeLabel(opportunity?.edge),
            recommendation: normalizeRecommendation(opportunity?.value, opportunity?.edge),
          };
        })
      : undefined,
    fanSentiment: snapshot?.game?.home_team
      ? {
          team: snapshot.game.home_team,
          mood,
          percentage: Math.max(5, Math.min(95, Math.round(crowdScore * 100))),
          topComment: analysis?.crowd_sentiment?.summary || "Sem leitura social detalhada no momento.",
        }
      : undefined,
    eventScenarios: eventScenarios.length ? eventScenarios : undefined,
    quickReplies: payload.quick_actions ?? payload.suggested_actions,
  };
}

export const ChatScreen = ({ initialMessage, onBack, onOpenDashboard }: ChatScreenProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(
    "Toque no microfone para falar. O navegador vai pedir permissao so quando voce clicar."
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const welcome: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content:
        "Estou aqui para te ajudar com o **Brasileirao**, jogos atuais do futebol e amistosos de selecoes.\n\nSe o Brasileirao estiver em pausa, eu posso puxar alternativas de jogos do dia, ao vivo e contexto internacional.",
      quickReplies: [
        "Quem joga hoje?",
        "Quais sao as oportunidades ao vivo?",
        "Me fala dos amistosos da copa do mundo",
        "Me fala do Flamengo",
      ],
    };
    setMessages([welcome]);
  }, []);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: `${Date.now()}-user`, role: "user", content: text, channel: "chat" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const { data } = await postJsonWithFallback<ChatApiResponse>("/chat", { message: text });
      const response = buildAssistantMessage(data);
      setMessages((prev) => [...prev, response]);
    } catch {
      setMessages((prev) => [...prev, { ...FALLBACK_RESPONSE, id: `${Date.now()}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSimulateWhatsApp = async (text: string) => {
    const messageText = text.trim() || "me fala do Flamengo";
    const userMsg: ChatMessage = {
      id: `${Date.now()}-wa-user`,
      role: "user",
      content: `Simulacao WhatsApp: ${messageText}`,
      channel: "whatsapp",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const { data } = await postJsonWithFallback<ChatApiResponse>("/webhook/whatsapp/test", {
        message: messageText,
        user_profile: "iniciante",
      });
      const response = buildAssistantMessage(data);
      setMessages((prev) => [...prev, response]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          ...FALLBACK_RESPONSE,
          id: `${Date.now()}-wa-fallback`,
          channel: "whatsapp",
          content:
            "A simulacao do WhatsApp nao respondeu agora. O fluxo principal do chat continua online para a demo.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (!initialMessage) return;
    const timeout = window.setTimeout(() => void handleSendMessage(initialMessage), 400);
    return () => window.clearTimeout(timeout);
  }, [initialMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const stopVoiceRecognition = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  };

  const startVoiceRecognition = () => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceStatus("Seu navegador nao suporta reconhecimento de voz nesta pagina.");
      return;
    }
    if (isListening || isTyping) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }

      const normalizedTranscript = transcript.trim();
      setInput(normalizedTranscript);
      setVoiceStatus("Ouvindo sua pergunta sobre os times...");

      const finalResult = event.results[event.results.length - 1];
      if (finalResult?.isFinal) {
        stopVoiceRecognition();
        if (normalizedTranscript) {
          setVoiceStatus(`Pergunta capturada: "${normalizedTranscript}"`);
          void handleSendMessage(normalizedTranscript);
        }
      }
    };

    recognition.onerror = () => {
      setVoiceStatus("Nao consegui ouvir bem. Tente novamente falando o nome do time.");
      stopVoiceRecognition();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    setVoiceStatus("Pode falar: pergunte sobre Flamengo, Botafogo, Palmeiras e outros times.");
    recognition.start();
  };

  useEffect(() => {
    return () => stopVoiceRecognition();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    void handleSendMessage(input.trim());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#08120f_0%,#0b1d17_16%,#101b18_16%,#101b18_100%)] px-3 py-4 md:px-6">
      <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-2xl flex-col overflow-hidden rounded-[30px] border border-[#1f3d34] bg-[#111b21] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 border-b border-[#20372f] bg-[#075e54] p-3"
      >
        <button onClick={onBack} className="rounded-lg p-1.5 transition-colors hover:bg-secondary">
          <ArrowLeft className="h-5 w-5 text-white/90" />
        </button>
        <AnimatedMascot size="sm" speaking={isTyping || isListening} />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-1.5 text-sm font-bold text-white font-display">
            Gênio do Futebol
            <Flame className="h-3.5 w-3.5 text-[#ffd54f]" />
          </h1>
          <p className="truncate text-[10px] text-white/75">
            {isListening ? "Ouvindo voce..." : isTyping ? "Analisando..." : "Brasileirao • Online"}
          </p>
        </div>
        <button
          onClick={onOpenDashboard}
          className="rounded-xl border border-white/10 bg-white/10 p-2 text-white/85 transition-colors hover:bg-white/15"
          title="Abrir painel"
        >
          <LayoutDashboard className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-0.5">
          <div className="h-1.5 w-1.5 rounded-full bg-[#25d366] animate-pulse-glow" />
          <span className="text-[10px] font-semibold text-white">online</span>
        </div>
      </motion.header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto bg-[#0b141a] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:22px_22px] p-4 scrollbar-thin"
      >
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" ? (
                <div className="mt-1 flex-shrink-0">
                  <AnimatedMascot size="sm" />
                </div>
              ) : null}

              <div className={`max-w-[85%] space-y-3 ${msg.role === "user" ? "items-end" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-sm border border-[#1f6f5c] bg-[#005c4b] font-medium text-[#e9fff8]"
                      : "rounded-bl-sm border border-[#202c33] bg-[#202c33]"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <>
                      {msg.channel === "whatsapp" ? (
                        <div className="mb-2 inline-flex rounded-full border border-[#25d366]/25 bg-[#0f2d27] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7df0c0]">
                          Simulacao WhatsApp
                        </div>
                      ) : null}
                      <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ul]:ml-4 [&_strong]:text-white [&_li]:text-[#d1d7db]">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </>
                  ) : (
                    msg.content
                  )}
                </div>

                {msg.insights ? (
                  <div className="grid grid-cols-2 gap-2">
                    {msg.insights.map((insight, index) => (
                      <InsightCard key={`${msg.id}-${index}`} {...insight} delay={index * 0.08} />
                    ))}
                  </div>
                ) : null}

                {msg.eventScenarios ? (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="font-display text-sm font-bold text-foreground">Cenarios ao Vivo</h4>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {msg.eventScenarios.map((scenario, index) => (
                        <InsightCard
                          key={`${msg.id}-scenario-${scenario.title}`}
                          type={scenario.title === "Cartao" ? "warning" : scenario.title === "Penalti" ? "momentum" : "probability"}
                          title={scenario.title}
                          value={`${scenario.probability}%`}
                          description={scenario.description}
                          delay={index * 0.06}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {msg.matchProb ? <MatchProbabilityBar {...msg.matchProb} /> : null}
                {msg.fanSentiment ? <FanSentiment {...msg.fanSentiment} /> : null}
                {msg.markets ? <MarketOdds markets={msg.markets} /> : null}

                {msg.quickReplies ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-1.5">
                    {msg.quickReplies.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => !isTyping && void handleSendMessage(reply)}
                        disabled={isTyping}
                        className="rounded-full border border-[#1f6f5c] bg-[#0f2d27] px-3 py-1.5 text-xs font-medium text-[#7df0c0] transition-colors hover:bg-[#143a32] disabled:opacity-40"
                      >
                        {reply}
                      </button>
                    ))}
                  </motion.div>
                ) : null}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2.5">
            <AnimatedMascot size="sm" speaking />
            <div className="rounded-2xl rounded-bl-sm border border-[#202c33] bg-[#202c33] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((index) => (
                    <motion.div
                      key={index}
                      className="h-2 w-2 rounded-full bg-primary"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: index * 0.15 }}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#aebac1]">Analisando o jogo...</span>
              </div>
            </div>
          </motion.div>
        ) : null}

      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-t border-[#20372f] bg-[#111b21] p-3"
      >
        <div className="mb-3 flex flex-wrap gap-2">
          <WhatsAppCTA
            label="Ir para o WhatsApp"
            message="Sou o Genio do Futebol. Acompanhe sua analise aqui."
          />
          <button
            onClick={() => !isTyping && void handleSimulateWhatsApp(input)}
            disabled={isTyping}
            className="rounded-full border border-[#1f6f5c] bg-[#0f2d27] px-4 py-2 text-xs font-semibold text-[#7df0c0] transition-colors hover:bg-[#143a32] disabled:opacity-40"
          >
            Simular WhatsApp
          </button>
        </div>
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-[#1f3d34] bg-[#0f2d27] px-3 py-2 text-xs text-[#c0d0cf]">
          <button
            onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
            disabled={isTyping}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              isListening ? "bg-[#25d366] text-[#0b141a]" : "bg-[#202c33] text-[#7df0c0]"
            } disabled:opacity-50`}
            title="Falar no chat de voz"
          >
            <Mic className="h-4 w-4" />
          </button>
          <span>{voiceStatus}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre qualquer time ou jogo..."
            className="flex-1 rounded-xl border border-[#202c33] bg-[#202c33] px-4 py-2.5 text-sm text-white placeholder:text-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#25d366]/30"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="rounded-xl bg-[#25d366] p-2.5 text-[#0b141a] transition-opacity disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3">
          <NeuroEducation />
        </div>
      </motion.div>
      </div>
    </div>
  );
};
