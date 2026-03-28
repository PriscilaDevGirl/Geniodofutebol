import { motion } from "framer-motion";
import { TrendingUp, Shield, Target, Zap, AlertTriangle } from "lucide-react";

interface InsightCardProps {
  type: "probability" | "risk" | "opportunity" | "momentum" | "warning";
  title: string;
  value: string;
  description: string;
  delay?: number;
}

const iconMap = {
  probability: Target,
  risk: Shield,
  opportunity: TrendingUp,
  momentum: Zap,
  warning: AlertTriangle,
};

const colorMap = {
  probability: "text-neon-green border-neon-green/20 bg-neon-green/5",
  risk: "text-neon-blue border-neon-blue/20 bg-neon-blue/5",
  opportunity: "text-neon-green border-neon-green/20 bg-neon-green/5",
  momentum: "text-amber-400 border-amber-400/20 bg-amber-400/5",
  warning: "text-destructive border-destructive/20 bg-destructive/5",
};

export const InsightCard = ({ type, title, value, description, delay = 0 }: InsightCardProps) => {
  const Icon = iconMap[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`rounded-lg border p-3 ${colorMap[type]}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-display font-semibold uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-lg font-display font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </motion.div>
  );
};
