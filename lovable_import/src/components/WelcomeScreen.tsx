import { motion } from "framer-motion";
import { AnimatedMascot } from "./AnimatedMascot";
import { WhatsAppCTA } from "./WhatsAppCTA";

interface WelcomeScreenProps {
  onStart: () => void;
  onPickMatch: (match: string) => void;
  onOpenDashboard: () => void;
}

const hotMatches = [
  { label: "Flamengo x Palmeiras", emoji: "FP" },
  { label: "Corinthians x Sao Paulo", emoji: "CS" },
  { label: "Botafogo x Fluminense", emoji: "BF" },
  { label: "Gremio x Inter", emoji: "GI" },
];

export const WelcomeScreen = ({ onStart, onPickMatch, onOpenDashboard }: WelcomeScreenProps) => {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 p-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
      >
        <AnimatedMascot size="xl" variant="hero" />
      </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-2"
        >
          <h1 className="font-display text-3xl font-bold text-foreground">
            Fala, craque! <span className="text-gradient-green">⚽</span>
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
            Eu sou o <strong className="text-primary">Gênio do Futebol</strong>, seu parceiro de analise do
            Brasileirao. Escolha um jogo, converse no chat, acompanhe os times no painel e, se
            quiser, continue o atendimento no WhatsApp.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 w-full max-w-sm space-y-3"
        >
          <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
            Jogos em destaque
          </p>
          <div className="grid grid-cols-2 gap-2">
            {hotMatches.map((match, index) => (
              <motion.button
                key={match.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onPickMatch(match.label)}
                className="rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40"
              >
                <span className="text-lg font-display font-bold text-primary">{match.emoji}</span>
                <p className="mt-1 text-xs font-medium text-foreground">{match.label}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={onStart}
            className="rounded-xl px-8 py-3 text-sm font-bold text-primary-foreground gradient-primary glow-green transition-opacity hover:opacity-90"
          >
            Bora conversar
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            onClick={onOpenDashboard}
            className="rounded-xl border border-primary/30 bg-primary/5 px-8 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
          >
            Ver painel do Brasileirao
          </motion.button>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            <WhatsAppCTA />
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.3 }}
          className="mt-4 text-[10px] text-muted-foreground"
        >
          Gênio do Futebol • Analise inteligente do futebol brasileiro
        </motion.p>
      </div>
    </div>
  );
};
