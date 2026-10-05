# Studio Esempio

Sito di esempio **responsive** (si adatta a telefono, tablet e computer) con **animazioni** fatte con [Motion](https://motion.dev) (ex Framer Motion).

## Come vederlo sul tuo computer

1. Installa [Node.js](https://nodejs.org) (versione LTS).
2. Apri il terminale nella cartella del progetto e scrivi:
   ```
   npm install
   npm run dev
   ```
3. Apri nel browser l'indirizzo che compare (di solito `http://localhost:5173`).

Ogni volta che salvi un file, la pagina si aggiorna da sola.

## Dove si trova cosa

| File | Cosa contiene |
|---|---|
| `src/index.css` | Colori e caratteri del sito |
| `src/App.jsx` | L'ordine delle sezioni nella pagina |
| `src/components/Navbar.jsx` | Barra in alto + menu a tutto schermo per il telefono |
| `src/components/Hero.jsx` | Prima schermata con il titolo che entra |
| `src/components/Marquee.jsx` | Striscia di testo che scorre all'infinito |
| `src/components/Intro.jsx` | Testo con le parole che si accendono scorrendo |
| `src/components/Gallery.jsx` | Griglia dei lavori con effetto parallasse |
| `src/components/Services.jsx` | Elenco servizi che compare allo scroll |
| `src/components/HorizontalScroll.jsx` | Sezione che scorre di lato mentre scendi |
| `src/components/Contact.jsx` | Contatti e piè di pagina |

## Metterlo online

Carica il progetto su GitHub e collegalo a [Vercel](https://vercel.com) o [Netlify](https://netlify.com): riconoscono da soli che è un progetto Vite.
