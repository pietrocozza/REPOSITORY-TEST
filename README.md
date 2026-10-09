# Soluzione Affitto

Nuovo sito di [soluzioneaffitto.com](https://www.soluzioneaffitto.com): gestione di affitti brevi a Roma e Milano.

Tutti i testi, i numeri, le recensioni e le foto vengono dal sito WordPress attuale. Le foto di Roma sono quelle già caricate lì.

Stack: Next.js (App Router) + TypeScript, Tailwind CSS 4, Motion e Lenis per animazioni e scorrimento fluido.

## Avviare il sito

Serve [Node.js](https://nodejs.org) 20.9 o successivo.

```bash
npm install      # una volta sola
npm run dev      # poi apri http://localhost:3000
```

Per la versione di produzione: `npm run build` e poi `npm start`.

## Dove si cambiano le cose

| Cosa | File |
| --- | --- |
| Telefono, WhatsApp, email, sedi, P.IVA, menu | `lib/site.ts` |
| Tutti i testi: vantaggi, servizi, piani, appartamenti, recensioni, FAQ, cantieri | `lib/contenuti.ts` |
| Foto | `public/img/` |
| Colori e caratteri | `app/globals.css` (blocco `@theme`) |

## Pagine

- `/` Home
- `/gestione` Piani (12% e 20%) e servizi
- `/ristruttura-gratis` Storia di Via Leonina, vantaggi della locazione, testimonianze, FAQ
- `/operazioni-immobiliari` Cantieri di Roma e Milano
- `/chi-siamo` Team e recensioni Airbnb
- `/domande-e-risposte` FAQ sulla gestione
- `/contatti` Contatti, sedi e simulatore
- `/calcola-guadagno` Simulatore di guadagno

I vecchi indirizzi di WordPress (`/?page_id=14` e simili) vengono reindirizzati alle nuove pagine (`proxy.ts`), così i link già indicizzati su Google continuano a funzionare.

## Simulatore di guadagno

Il simulatore fa le stesse domande del modulo attuale. Alla fine il visitatore invia la richiesta, già compilata, su WhatsApp (+39 333 612 1597) o via email (info.soluzioneaffitto@gmail.com). Non serve nessun server né servizio esterno.

## Recensioni

Le recensioni di Google e Airbnb sono riportate testualmente da quelle mostrate da Trustindex sul sito attuale (tutte a 5 stelle). Per aggiungerne di nuove, modifica `RECENSIONI_GOOGLE` e `RECENSIONI_AIRBNB` in `lib/contenuti.ts`.

## Pubblicazione

Il modo più semplice è [Vercel](https://vercel.com): si importa il repository e si collega il dominio `soluzioneaffitto.com`.
