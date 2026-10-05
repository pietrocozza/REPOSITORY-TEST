import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Configurazione di Vite: attiva React e Tailwind (lo stile)
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
