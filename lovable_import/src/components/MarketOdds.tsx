import { motion } from "framer-motion";

interface MarketOddsProps {
  markets: Array<{
    name: string;
    probability: number;
    edge: string;
    recommendation: "alta" | "média" | "baixa";
  }>;
}

const recColors = {
  alta: "bg-neon-green/10 text-neon-green border-neon-green/30",
  média: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  baixa: "bg-destructive/10 text-destructive border-destructive/30",
};

export const MarketOdds = ({ markets }: MarketOddsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-lg border border-border bg-card p-4 space-y-3"
    >
      <h4 className="font-display font-bold text-sm text-foreground">📊 Mercados Analisados</h4>
      {markets.map((m, i) => (
        <motion.div
          key={m.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center justify-between py-2 border-b border-border last:border-0"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{m.name}</p>
            <p className="text-xs text-muted-foreground">Edge: {m.edge}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-display font-bold text-foreground">{m.probability}%</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${recColors[m.recommendation]}`}>
              {m.recommendation}
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
