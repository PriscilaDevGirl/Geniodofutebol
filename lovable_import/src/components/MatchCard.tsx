import { motion } from "framer-motion";

interface MatchCardProps {
  homeTeam: string;
  awayTeam: string;
  homeEmoji: string;
  awayEmoji: string;
  date: string;
  league: string;
  hot?: boolean;
  onClick: () => void;
}

export const MatchCard = ({
  homeTeam,
  awayTeam,
  homeEmoji,
  awayEmoji,
  date,
  league,
  hot = false,
  onClick,
}: MatchCardProps) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors relative overflow-hidden group"
    >
      {hot && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
          🔥 QUENTE
        </div>
      )}

      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">
        {league} • {date}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{homeEmoji}</span>
          <span className="font-display font-bold text-sm text-foreground">{homeTeam}</span>
        </div>
        <span className="text-xs text-muted-foreground font-display font-bold px-2 py-1 bg-secondary rounded-md">
          VS
        </span>
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm text-foreground">{awayTeam}</span>
          <span className="text-2xl">{awayEmoji}</span>
        </div>
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-r from-primary/5 via-transparent to-neon-blue/5" />
    </motion.button>
  );
};
