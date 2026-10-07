import path from "node:path";
import type { NextConfig } from "next";

// Indirizzo del backend locale di Ambrogio (vedi ../backend)
const BACKEND = process.env.AMBROGIO_BACKEND_URL ?? `http://127.0.0.1:${process.env.AMBROGIO_PORTA ?? "8787"}`;

const nextConfig: NextConfig = {
  // niente icona di sviluppo di Next.js sopra l'interfaccia
  devIndicators: false,
  // Le dipendenze sono installate nella cartella ambrogio (npm workspaces): è quella la radice
  turbopack: {
    root: path.join(import.meta.dirname, ".."),
  },
  // L'interfaccia chiama /api/...: Next.js inoltra la richiesta al backend locale
  rewrites() {
    return [{ source: "/api/:percorso*", destination: `${BACKEND}/api/:percorso*` }];
  },
};

export default nextConfig;
