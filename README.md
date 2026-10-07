# Brace & Peperino

Sito a pagina unica di un'hamburgeria **inventata** nel centro storico di Viterbo.
Ha un solo scopo: far venire fame e far ordinare. Cinque sezioni, fondo scuro, panini 3D enormi e sospesi,
pulsante "Ordina" sempre a portata di mano.

Stack: Next.js (App Router) + TypeScript, Tailwind CSS, Motion (Framer Motion), Lenis,
Three.js + React Three Fiber (panini 3D), react-hook-form + zod, Web Audio API.

> ⚠️ Il locale non esiste. Indirizzo, telefono, orari e social sono **dati fittizi** (`lib/info.ts`).
> L'ordine non viene inviato a nessuno: la route `app/api/ordine/route.ts` risponde con un numero finto.

## Avviare il sito

Serve [Node.js](https://nodejs.org) 20.9 o successivo.

```bash
npm install      # una volta sola
npm run dev      # poi apri http://localhost:3000
```

```bash
npm run lint     # controlla il codice
npm run build    # versione ottimizzata per la pubblicazione
npm run start    # avvia la versione ottimizzata
```

## Pubblicarlo su Vercel

1. Vai su [vercel.com](https://vercel.com), accedi con GitHub, **Add New → Project**, scegli questo repository e premi **Deploy**.
2. (Facoltativo) In **Settings → Environment Variables** aggiungi `NEXT_PUBLIC_SITE_URL` con l'indirizzo definitivo, per le anteprime sui social.
3. Ogni modifica salvata su GitHub viene pubblicata da sola.

## I panini in 3D

Tutti i panini e i contorni sono **modelli 3D costruiti nel codice** con [Three.js](https://threejs.org)
e [React Three Fiber](https://r3f.docs.pmnd.rs): librerie gratuite e open source. Non servono foto né file da scaricare.

- Ogni ingrediente (pane con sesamo, lattuga, pomodoro, cipolla, formaggio fuso, carne, bacon, uovo, nocciole, salsa)
  è un modello a sé in `components/three/ingredienti.tsx`: forma, colori, lucidità.
- Le ricette dei panini (quali strati e in che ordine) sono in `lib/ricette.ts`: cambiando l'elenco cambia il panino.
- Luci da studio e ombra morbida: `components/three/Studio.tsx`.
- Il 3D si accende solo quando è sullo schermo e le card del menu si animano solo in hover, per non scaricare la batteria.

## Dove si trova cosa

| Percorso | Contenuto |
|---|---|
| `app/page.tsx` | Le 5 sezioni della pagina |
| `lib/menu.ts` | Panini, contorni, prezzi, zone di consegna |
| `lib/ricette.ts` | Gli strati di ogni panino 3D e le scritte del panino che si apre |
| `lib/info.ts` | Dati del locale (fittizi): indirizzo, telefono, orari, fasce di consegna |
| `lib/animations.ts` | Tempi delle animazioni (quando si apre e si richiude il panino, ecc.) |
| `lib/order-schema.ts` | Regole e messaggi d'errore del modulo d'ordine |
| `lib/audio.ts` | Musica di sottofondo generata nel codice |
| `components/sections/` | Navbar, hero + panino che si apre, secondo panino, menu e ordine, footer, barra mobile |
| `components/three/` | I modelli 3D, le luci, la scena del panino che si apre e le vetrine del menu |
| `app/api/ordine/route.ts` | Riceve e controlla l'ordine (qui si collegherà email o gestionale) |

## Musica

Parte al primo clic o tocco, a volume basso; l'icona con le barre nella navbar la spegne e riaccende
(la scelta viene ricordata). È un sottofondo lounge generato nel codice: per usare un brano tuo
mettilo in `public/audio/tema.mp3`.

## Accessibilità

Con "Riduci movimento" attivo: niente smooth scroll, parallax o inclinazioni, e il panino è mostrato già aperto e fermo.
Navigazione da tastiera con focus visibile, errori del modulo letti dagli screen reader, cursore personalizzato disattivato sui dispositivi touch.

## Ambrogio

Nella cartella [`ambrogio/`](ambrogio/) c'è un'app separata: Ambrogio, il maggiordomo personale con intelligenza artificiale che usa Claude.
Ha le sue dipendenze e le sue istruzioni: vedi [`ambrogio/README.md`](ambrogio/README.md).
