# J.A.R.V.I.S.

Assistente personale vocale ispirato a quello di Iron Man, con il "cervello" di **Claude** (Anthropic).
Gli parli al microfono (o scrivi) e lui ti risponde a voce, in italiano. Al centro dello schermo c'è una
rete di neuroni in 3D: gli impulsi corrono lungo le sinapsi e la rete si accende quando ascolta, pensa e parla.

- **Voce → testo**: riconoscimento vocale del browser (Chrome / Edge)
- **Cervello**: Claude Opus 5.5 tramite l'API di Anthropic, con ricerca web per meteo, notizie e cose recenti
- **Testo → voce**: sintesi vocale del sistema operativo (parla mentre la risposta sta ancora arrivando)

## Cosa ti serve

1. [Node.js](https://nodejs.org) 20.9 o successivo
2. Una **chiave API di Anthropic**: vai su [console.anthropic.com](https://console.anthropic.com),
   aggiungi un po' di credito (*Billing*) e crea una chiave in *API Keys*.
   L'API si paga a consumo ed è separata dall'abbonamento a claude.ai.
3. **Google Chrome** o **Microsoft Edge** per parlare a voce (Firefox e Safari permettono solo di scrivere)

## Avviarlo sul tuo PC

```bash
cd jarvis
npm install                 # una volta sola
cp .env.example .env.local  # su Windows: copy .env.example .env.local
```

Apri `.env.local` e incolla la tua chiave al posto di `sk-ant-...`. Poi:

```bash
npm run dev
```

e apri **http://localhost:3000** in Chrome o Edge. Premi **Attiva** e consenti l'uso del microfono.

## Come si usa

| Azione | Come |
| --- | --- |
| Parlare | Pulsante del microfono, oppure **barra spaziatrice** |
| Interrompere | Di nuovo il pulsante, oppure **Esc** |
| Ruotare la rete | Trascina con il mouse; rotella per avvicinarti |
| Scrivere | Casella in basso, poi Invio |
| Parola d'attivazione | Pulsante **"Jarvis"**: resta in ascolto e risponde quando dici *"Jarvis, …"* |
| Silenziare la voce | Pulsante **Voce** |
| Rileggere la conversazione | Pulsante **Conversazione** |

## Personalizzarlo

- **Come ti chiama**: in `.env.local` metti `JARVIS_APPELLATIVO=capo` (o il tuo nome)
- **Carattere e regole**: la funzione `istruzioni()` in `app/api/chat/route.ts`
- **Modello**: costante `MODELLO` nello stesso file (es. `claude-sonnet-5-5` costa meno)
- **Voce**: `lib/voce.ts` sceglie la migliore voce italiana installata; su Windows puoi aggiungerne
  altre da *Impostazioni → Ora e lingua → Voce*. In Edge le voci "Online (Natural)" sono le più realistiche.
- **Colori e grafica**: variabili in cima ad `app/globals.css`; la rete 3D (numero di neuroni, colori,
  comportamento in ogni stato) in cima a `lib/rete-neurale.ts`

## Come è fatto

```
app/page.tsx              → mostra l'interfaccia
app/api/chat/route.ts     → parla con Claude (la chiave API resta qui, sul server)
components/Jarvis.tsx     → interfaccia, stati, microfono, voce e invio delle domande
components/ReteNeurale.tsx →  collega la rete 3D a React
lib/rete-neurale.ts       → la rete di neuroni 3D (Three.js): neuroni, sinapsi, impulsi, bagliore
lib/chat.ts               → manda la conversazione al server e riceve la risposta in streaming
lib/voce.ts               → riconoscimento e sintesi vocale del browser
```

> Nota: è un progetto personale per divertimento, non affiliato a Marvel.
