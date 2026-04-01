interface WhatsAppCTAProps {
  className?: string;
  label?: string;
  message?: string;
}

const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER || "5581985771955").replace(/\D/g, "");
const DEFAULT_MESSAGE =
  import.meta.env.VITE_WHATSAPP_MESSAGE ||
  "Sou o Genio do Futebol. Acompanhe sua analise aqui.";

function buildWhatsAppUrl(message?: string) {
  if (!WHATSAPP_NUMBER) {
    return null;
  }

  const text = encodeURIComponent(message || DEFAULT_MESSAGE);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export const WhatsAppCTA = ({
  className = "",
  label = "Continuar no WhatsApp",
  message,
}: WhatsAppCTAProps) => {
  const href = buildWhatsAppUrl(message);

  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 gradient-primary glow-green ${className}`.trim()}
    >
      {label}
    </a>
  );
};
