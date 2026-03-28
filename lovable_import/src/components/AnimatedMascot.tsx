import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import mascotImg from "@/assets/mascot-latest.png";

interface AnimatedMascotProps {
  size?: "sm" | "md" | "lg" | "xl";
  speaking?: boolean;
  variant?: "default" | "hero";
}

const sizeMap = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-26 h-26",
  xl: "w-40 h-40",
};

export const AnimatedMascot = ({
  size = "md",
  speaking = false,
  variant = "default",
}: AnimatedMascotProps) => {
  const isHero = variant === "hero";

  return (
    <div className="relative inline-block">
      {isHero ? (
        <motion.div
          className="absolute inset-[-8%] mascot-orbit"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <div className="mascot-orbit-label mascot-orbit-top">Brasileirao</div>
          <div className="mascot-orbit-cup">
            <Trophy className="h-3 w-3" />
          </div>
        </motion.div>
      ) : null}

      <motion.div
        className={`absolute rounded-full ${isHero ? "inset-2 border-2 border-primary/25" : "inset-1 border border-primary/18"}`}
        animate={{
          scale: [1, 1.25, 1],
          opacity: isHero ? [0.4, 0, 0.4] : [0.22, 0, 0.22],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute inset-0 rounded-full ${isHero ? "border border-neon-blue/20" : "border border-neon-blue/12"}`}
        animate={{
          scale: [1, 1.4, 1],
          opacity: isHero ? [0.3, 0, 0.3] : [0.18, 0, 0.18],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <motion.div
        animate={{
          y: [0, -8, 0],
          rotate: speaking ? [0, -2, 2, -1, 0] : [0, 0.5, -0.5, 0],
        }}
        transition={{
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          rotate: {
            duration: speaking ? 0.6 : 4,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
        className={`relative ${isHero ? "mascot-stage" : "mascot-stage-compact"}`}
      >
        <div className={`mascot-shell ${sizeMap[size]}`}>
          <div className="mascot-shell-highlight" />
          <div className="mascot-core" />
          <div className="mascot-portrait-wrap">
            <img
              src={mascotImg}
              alt="Mascote do Gênio do Futebol"
              className="mascot-portrait"
            />
          </div>
          <div className="mascot-floor" />
        </div>

        <motion.div
          className={`absolute rounded-full bg-primary border-background ${isHero ? "-bottom-0.5 -right-0.5 h-3.5 w-3.5 border-2" : "bottom-0 right-0 h-3 w-3 border"}`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>

      {/* Speech bubble when speaking */}
      {speaking && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-2 -right-2"
        >
          <div className="flex gap-1 bg-card border border-border rounded-full px-2 py-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
