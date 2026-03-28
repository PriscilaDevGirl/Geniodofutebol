import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export const NeuroEducation = () => {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-card px-4 py-3 text-left"
      >
        <div>
          <p className="text-[11px] font-display font-semibold uppercase tracking-[0.24em] text-primary">
            Comece por aqui
          </p>
          <h2 className="mt-1 font-display text-base font-bold text-foreground">
            Como ver a probabilidade
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Toque para entender de forma rápida como ler probabilidade, odd e risco.
          </p>
        </div>
        <ChevronDown className={`h-5 w-5 text-primary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <p className="text-xs font-display font-semibold uppercase tracking-wider text-primary">
              1. Entenda a probabilidade
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Se o modelo aponta 65%, isso quer dizer que esse cenário parece mais provável naquele momento, não que ele vai acontecer com certeza.
            </p>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <p className="text-xs font-display font-semibold uppercase tracking-wider text-primary">
              2. Compare com a odd
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A odd mostra o preço do mercado. Quando ela combina com a probabilidade estimada, a leitura fica mais clara.
            </p>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <p className="text-xs font-display font-semibold uppercase tracking-wider text-primary">
              3. Leia o risco com calma
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Mesmo com uma boa leitura, existe risco. O ideal é evitar impulso e usar a análise como apoio para decidir melhor.
            </p>
          </motion.article>
        </div>
      ) : null}
    </section>
  );
};
