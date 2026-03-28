import { motion } from "framer-motion";
import { MessageCircle, Users, Heart, Flame, AlertTriangle } from "lucide-react";

interface FanSentimentProps {
  team: string;
  mood: "empolgado" | "confiante" | "nervoso" | "revoltado" | "dividido";
  percentage: number;
  topComment: string;
}

const moodConfig = {
  empolgado: { icon: Flame, color: "text-neon-green", bg: "bg-neon-green/10", label: "🔥 Empolgada" },
  confiante: { icon: Heart, color: "text-neon-blue", bg: "bg-neon-blue/10", label: "💪 Confiante" },
  nervoso: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10", label: "😰 Nervosa" },
  revoltado: { icon: Flame, color: "text-destructive", bg: "bg-destructive/10", label: "😤 Revoltada" },
  dividido: { icon: Users, color: "text-muted-foreground", bg: "bg-muted/50", label: "🤔 Dividida" },
};

export const FanSentiment = ({ team, mood, percentage, topComment }: FanSentimentProps) => {
  const config = moodConfig[mood];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="font-display font-bold text-sm">O que a torcida do {team} tá achando</span>
      </div>

      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg} mb-3`}>
        <span className="text-lg">{config.label.split(" ")[0]}</span>
        <span className={`text-sm font-bold ${config.color}`}>
          {config.label.split(" ").slice(1).join(" ")} — {percentage}% da torcida
        </span>
      </div>

      {/* Sentiment bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${
            mood === "empolgado" || mood === "confiante"
              ? "gradient-primary"
              : mood === "nervoso" || mood === "dividido"
              ? "bg-amber-400"
              : "bg-destructive"
          }`}
        />
      </div>

      {/* Top comment */}
      <div className="flex items-start gap-2 bg-secondary/50 rounded-lg p-2.5">
        <span className="text-lg">💬</span>
        <p className="text-xs text-muted-foreground italic leading-relaxed">"{topComment}"</p>
      </div>
    </motion.div>
  );
};
