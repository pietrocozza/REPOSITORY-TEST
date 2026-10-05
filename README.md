# Brace & Peperino

Sito a pagina unica di un'hamburgeria **inventata** nel centro storico di Viterbo.
Ha un solo scopo: far venire fame e far ordinare. Cinque sezioni, fondo scuro, cibo enorme e sospeso,
pulsante "Ordina" sempre a portata di mano.

Stack: Next.js (App Router) + TypeScript, Tailwind CSS, Motion (Framer Motion), Lenis,
react-hook-form + zod, Web Audio API.

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

## Le foto da fornire

Il sito funziona già senza foto: al loro posto mostra **segnaposto neutri** (forme sfumate con il nome del file).
Appena metti una foto in `public/images/` con il nome giusto, il sito la usa al posto del segnaposto
(in sviluppo basta ricaricare la pagina; online serve una nuova pubblicazione, che Vercel fa da solo).

**Regole per tutte le foto**
- Fotografie reali del cibo, **scontornate** (sfondo trasparente), in **WebP** (consigliato) o PNG.
- Luce calda che arriva dall'alto, nessuna ombra "cotta" sotto il cibo: l'ombra la aggiunge il sito.
- Il cibo centrato e con un po' di margine intorno (circa 8% per lato).
- Peso: WebP qualità 80–85, possibilmente sotto i 300 KB.
- Per scontornare vanno bene Photoshop, Photoroom o remove.bg.

| File (in `public/images/`) | Dimensioni | Cosa deve mostrare |
|---|---|---|
| `hero-burger.webp` | 1600 × 1200 | **Il Peperino**, il panino protagonista. Vista **frontale**, macchina appena sopra l'altezza del panino (10–15°). Occupa circa l'85% della larghezza. |
| `secondo-burger.webp` | 1600 × 1200 | **Il Papale** (bacon, uovo, doppio pecorino). Vista di **tre quarti**, molto "da pubblicità": formaggio che cola, uovo visibile. |
| `strati/pane-sopra.webp` | 1600 × 800 | Solo la parte superiore del pane. |
| `strati/lattuga.webp` | 1600 × 800 | Solo la foglia (o le foglie) di lattuga. |
| `strati/pomodoro.webp` | 1600 × 800 | Due o tre fette di pomodoro affiancate. |
| `strati/cipolla.webp` | 1600 × 800 | Cipolla caramellata. |
| `strati/formaggio.webp` | 1600 × 800 | Fetta di pecorino fuso. |
| `strati/carne.webp` | 1600 × 800 | Lo smash di manzo. |
| `strati/bacon.webp` | 1600 × 800 | Due fette di bacon croccante. |
| `strati/pane-sotto.webp` | 1600 × 800 | La base del pane. |
| `menu/burger-1.webp` | 800 × 600 | Il Peperino |
| `menu/burger-2.webp` | 800 × 600 | Il Papale |
| `menu/burger-3.webp` | 800 × 600 | Il Cimino (nocciole, cipolla caramellata, pecorino) |
| `menu/burger-4.webp` | 800 × 600 | Il Pellegrino (lattuga, pomodoro, bacon) |
| `menu/burger-5.webp` | 800 × 600 | La Macchina (tre smash, tre formaggi: il più alto) |
| `menu/burger-6.webp` | 800 × 600 | L'Orto (burger vegetariano) |
| `menu/patatine.webp` | 800 × 600 | Patatine in un cono o una pila ordinata |
| `menu/anelli-cipolla.webp` | 800 × 600 | Tre o quattro anelli di cipolla impilati |

Le foto del menu: vista di **tre quarti**, tutte con la **stessa inquadratura e la stessa luce**, così la griglia resta ordinata.

### Gli strati del panino che si apre (importante)

Gli 8 strati vengono impilati dal sito per ricomporre il panino, poi separati mentre scorri. Perché combacino:
- **stessa macchina fotografica, stessa distanza, stessa angolazione** per tutti (laterale, appena dall'alto, 5–10°);
- **stessa scala**: ogni ingrediente largo come sarebbe nel panino vero (circa 1350 px su 1600);
- ogni ingrediente **centrato** nell'immagine, sia in orizzontale sia in verticale;
- l'ideale è fotografare il panino vero smontandolo pezzo per pezzo, senza muovere la macchina.

Se con le foto vere gli strati risultano troppo staccati o sovrapposti quando il panino è chiuso,
in `lib/strati.ts` si regola solo il numero `spessore` di ciascuno strato
(quanto è alto l'ingrediente rispetto alla larghezza della foto, ad esempio `0.1` = 160 px su 1600).

## Dove si trova cosa

| Percorso | Contenuto |
|---|---|
| `app/page.tsx` | Le 5 sezioni della pagina |
| `lib/menu.ts` | Panini, contorni, prezzi, zone di consegna, foto di ogni prodotto |
| `lib/strati.ts` | Gli strati del panino che si apre, con le scritte accanto |
| `lib/info.ts` | Dati del locale (fittizi): indirizzo, telefono, orari, fasce di consegna |
| `lib/animations.ts` | Tempi delle animazioni (quando si apre e si richiude il panino, ecc.) |
| `lib/order-schema.ts` | Regole e messaggi d'errore del modulo d'ordine |
| `lib/audio.ts` | Musica di sottofondo generata nel codice |
| `components/sections/` | Navbar, hero + panino che si apre, secondo panino, menu e ordine, footer, barra mobile |
| `components/ui/CiboSospeso.tsx` | L'effetto "cibo sospeso": ombra, bagliore, galleggiamento, inclinazione 3D, parallax |
| `components/ui/Foto.tsx` | Mostra la foto reale o il segnaposto |
| `app/api/ordine/route.ts` | Riceve e controlla l'ordine (qui si collegherà email o gestionale) |

## Musica

Parte al primo clic o tocco, a volume basso; l'icona con le barre nella navbar la spegne e riaccende
(la scelta viene ricordata). È un sottofondo lounge generato nel codice: per usare un brano tuo
mettilo in `public/audio/tema.mp3`.

## Accessibilità

Con "Riduci movimento" attivo: niente smooth scroll, parallax o inclinazioni, e il panino è mostrato già aperto e fermo.
Navigazione da tastiera con focus visibile, errori del modulo letti dagli screen reader, cursore personalizzato disattivato sui dispositivi touch.
