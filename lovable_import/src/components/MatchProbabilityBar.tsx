import { motion } from "framer-motion";

interface MatchProbabilityBarProps {
  homeTeam: string;
  awayTeam: string;
  homeWin: number;
  draw: number;
  awayWin: number;
}

export const MatchProbabilityBar = ({ homeTeam, awayTeam, homeWin, draw, awayWin }: MatchProbabilityBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="flex justify-between items-center mb-3">
        <span className="font-display font-bold text-sm">{homeTeam}</span>
        <span className="text-xs text-muted-foreground font-display">vs</span>
        <span className="font-display font-bold text-sm">{awayTeam}</span>
      </div>
      
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${homeWin}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="gradient-primary rounded-l-full"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${draw}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="bg-muted-foreground/40"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${awayWin}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="gradient-accent rounded-r-full"
        />
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="text-neon-green font-semibold">{homeWin}%</span>
        <span>Empate {draw}%</span>
        <span className="text-neon-blue font-semibold">{awayWin}%</span>
      </div>
    </motion.div>
  );
};
