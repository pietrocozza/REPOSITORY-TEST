# J.A.R.V.I.S.

Assistente personale vocale ispirato a quello di Iron Man, con il "cervello" di **Claude** (Anthropic).
Gli parli al microfono (o scrivi) e lui ti risponde a voce, in italiano. L'interfaccia è la "Neural Interface":
al centro una rete di neuroni 3D in WebGL, con neuroni che si muovono, impulsi lungo le connessioni e colori
che cambiano quando Jarvis ascolta, pensa e parla.

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

e apri **http://localhost:3000** in Chrome o Edge. Premi **Parla con Jarvis** e consenti l'uso del microfono.

## Come si usa

| Azione | Come |
| --- | --- |
| Parlare | **Parla con Jarvis** (o il modulo Conversazione), oppure **barra spaziatrice** |
| Interrompere | **Interrompi**, oppure **Esc** |
| Ruotare la rete | Trascina con il mouse; rotella per avvicinarti |
| Scrivere | Casella in basso, poi Invio |
| Ascolto continuo | Resta in ascolto e risponde quando dici *"Jarvis, …"* |
| Silenziare la voce | **Voce attiva / disattivata** |
| Rileggere la conversazione | **Cronologia** |
| Nascondere i pannelli | **VISTA** in alto a destra |

## Personalizzarlo

- **Come ti chiama**: in `.env.local` metti `JARVIS_APPELLATIVO=capo` (o il tuo nome)
- **Carattere e regole**: la funzione `istruzioni()` in `app/api/chat/route.ts`
- **Modello**: costante `MODELLO` nello stesso file (es. `claude-sonnet-5-5` costa meno)
- **Voce**: `lib/voce.ts` sceglie la migliore voce italiana installata; su Windows puoi aggiungerne
  altre da *Impostazioni → Ora e lingua → Voce*. In Edge le voci "Online (Natural)" sono le più realistiche.
- **Il tuo nome** nel pannello Sessione: `NOME_UTENTE` in `components/Jarvis.tsx`
- **Colori e grafica**: `PALETTES` (un colore per stato) e la forma della rete in `lib/nucleo-neurale.ts`;
  stile dell'interfaccia in `app/globals.css`

## Come è fatto

```
app/page.tsx              → mostra l'interfaccia
app/api/chat/route.ts     → parla con Claude (la chiave API resta qui, sul server)
components/Jarvis.tsx     → l'interfaccia: stati, microfono, voce, comandi, cronologia
lib/nucleo-neurale.ts     → la rete neurale in WebGL: neuroni in movimento, connessioni, dendriti, impulsi
lib/hud.ts                → anelli dell'HUD e onda del canale vocale
lib/chat.ts               → manda la conversazione al server e riceve la risposta in streaming
lib/voce.ts               → riconoscimento e sintesi vocale del browser
```

> Nota: è un progetto personale per divertimento, non affiliato a Marvel.
