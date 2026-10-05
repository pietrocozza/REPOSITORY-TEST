# Brace & Peperino

Sito dimostrativo di un'hamburgeria **inventata** nel quartiere medievale di San Pellegrino, Viterbo.
Una sola pagina, responsive, con animazioni (Motion), smooth scroll (Lenis), cursore interattivo,
musica generata nel codice e un modulo d'ordine a domicilio in 3 passaggi.

> ⚠️ Il locale non esiste. Indirizzo, telefono, email, orari e social sono **dati fittizi**
> (vedi `lib/info.ts`). Il modulo d'ordine non invia nulla a nessuno.

## Avviare il sito sul tuo computer

Serve [Node.js](https://nodejs.org) 20.9 o successivo.

```bash
npm install      # scarica le dipendenze (una volta sola)
npm run dev      # avvia il sito in modalità sviluppo
```

Poi apri **http://localhost:3000**. Ogni modifica ai file si vede subito nel browser.

Altri comandi utili:

```bash
npm run lint     # controlla il codice
npm run build    # prepara la versione ottimizzata per la pubblicazione
npm run start    # avvia la versione ottimizzata (dopo "build")
```

## Pubblicarlo su Vercel

1. Carica il progetto su GitHub (è già in questo repository).
2. Vai su [vercel.com](https://vercel.com), accedi con GitHub e clicca **Add New → Project**.
3. Scegli il repository: Vercel riconosce da solo che è un progetto Next.js. Premi **Deploy**.
4. (Facoltativo) In **Settings → Environment Variables** aggiungi `NEXT_PUBLIC_SITE_URL`
   con l'indirizzo definitivo del sito (es. `https://www.braceepeperino.it`):
   serve per le anteprime sui social.
5. Per un dominio tuo: **Settings → Domains**.

Da quel momento ogni modifica salvata su GitHub viene pubblicata in automatico.

## Dove si trova cosa

| Percorso | Contenuto |
|---|---|
| `app/page.tsx` | L'ordine delle sezioni della pagina |
| `app/layout.tsx` | Caratteri, titolo e descrizione per Google e i social |
| `app/globals.css` | Palette colori e tipografia fluida |
| `app/api/ordine/route.ts` | Riceve l'ordine, lo valida e risponde con un numero finto (qui si collegherà email o gestionale) |
| `lib/menu.ts` | **Menu**: panini, contorni, dolci, bibite, extra, zone di consegna e prezzi |
| `lib/info.ts` | **Dati del locale** (fittizi): indirizzo, telefono, orari, fasce di consegna |
| `lib/animations.ts` | Valori delle animazioni (velocità, molle, tempi del panino esploso) |
| `lib/order-schema.ts` | Regole di validazione del modulo e messaggi d'errore |
| `lib/audio.ts` | Musica e suoni generati con la Web Audio API |
| `components/burger/` | Gli strati del panino in SVG e il componente che li impila |
| `components/sections/` | Una sezione per file: Navbar, Hero, Panino esploso, Marquee, Menu, Storia, Numeri, Dove siamo, Footer |
| `components/order/` | Il modulo d'ordine in 3 passaggi e la conferma |
| `components/ui/` | Cursore, pulsanti magnetici, adesivi trascinabili, mascotte, sfondo, divisori… |
| `components/illustrations/` | Tetti di Viterbo, scooter, contorni e dolci |

## Musica

La musica è generata dal codice, quindi non serve nessun file.
Se vuoi usare un brano tuo, mettilo in `public/audio/tema.mp3`: il sito lo userà al posto del motivetto.
I browser bloccano l'audio finché l'utente non tocca la pagina: la musica parte al primo clic, tocco o tasto.
L'icona in basso a destra la spegne e riaccende (la scelta viene ricordata).

## Accessibilità

- Con "Riduci movimento" attivo nel sistema: niente smooth scroll né parallax,
  schermata di caricamento ridotta e panino mostrato già aperto con le etichette.
- Navigazione completa da tastiera, focus visibile, testi alternativi sulle illustrazioni.
- Il cursore personalizzato non viene usato sui dispositivi touch.
