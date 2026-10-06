import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Jarvis vive dentro la cartella di un altro progetto: senza questa riga
  // Next.js userebbe come radice la cartella superiore (e la sua configurazione)
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
