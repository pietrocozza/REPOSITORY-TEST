# Ambrogio

Il tuo maggiordomo personale, che funziona sul tuo PC Windows. Il "cervello" è **Claude Code**, collegato al tuo
abbonamento Claude: **nessuna API a consumo**. L'interfaccia è la "Neural Interface", con la rete neurale 3D
che reagisce a quello che Ambrogio sta facendo.

Stato attuale: chat reale con Claude (scritta o a voce), ricerca web, memoria permanente (persone, preferenze,
regole), pratiche che durano nel tempo, permessi a tre livelli e registro di tutto ciò che fa.
Email, calendario e telefono arrivano nelle prossime fasi (vedi [docs/ARCHITETTURA.md](docs/ARCHITETTURA.md)).

## Cosa serve sul PC

| Programma | Perché | Come installarlo (PowerShell) |
| --- | --- | --- |
| **Node.js 24 LTS** (minimo 22.18) | fa funzionare backend e interfaccia | `winget install OpenJS.NodeJS.LTS` |
| **Git** | per scaricare e aggiornare il progetto | `winget install Git.Git` |
| **Claude Code** | il cervello di Ambrogio, con il tuo login | già installato |
| Chrome o Edge | per l'interfaccia e il microfono | già presente |

Python **non serve** in questa fase. VS Code è facoltativo.

Per controllare cosa hai già, nella cartella `ambrogio` apri PowerShell e scrivi:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\controlla-ambiente.ps1
```

## Installazione (una volta sola)

In **PowerShell**:

```powershell
cd $HOME
git clone https://github.com/pietrocozza/repository-test.git jarvis-progetto
cd jarvis-progetto
git checkout claude/vibrant-newton-5ifs9d
cd ambrogio
npm install
npm run controlla
```

`npm run controlla` deve mostrare tre **OK** (Node.js, Claude Code, Account Claude).
Se l'account non è collegato: scrivi `claude`, premi Invio, poi `/login` e scegli il tuo account Claude.

## Se avevi già Jarvis (una volta sola)

Jarvis ora si chiama **Ambrogio**, e anche la cartella è passata da `jarvis` ad `ambrogio`.
Chiudi Jarvis, poi in **PowerShell**:

```powershell
cd $HOME\jarvis-progetto
git pull
cd ambrogio
npm run trasloco
```

`npm run trasloco` sposta memoria, conversazioni e impostazioni nella nuova cartella, cancella i resti della
vecchia, riscarica i programmi e mette sul desktop l'icona **Ambrogio** al posto di quella di Jarvis.

## Avvio (ogni volta)

In **PowerShell**, dentro la cartella `ambrogio`:

```powershell
npm start
```

Ambrogio si apre in una finestra tutta sua (Microsoft Edge in modalità app, con un profilo separato:
microfono e impostazioni valgono solo per Ambrogio). Per spegnerlo premi **Ctrl+C** nella finestra di PowerShell,
oppure chiudi quella finestra.

### Icona sul desktop (consigliato)

Una volta sola, in PowerShell nella cartella `ambrogio`:

```powershell
npm run collegamento
```

Sul desktop compare l'icona **Ambrogio**: con un doppio clic si accende e si apre. La finestra di PowerShell
parte ridotta a icona nella barra in basso: è il "motore" di Ambrogio, chiudendola si spegne.
Se Ambrogio è già acceso, il doppio clic riapre solo la finestra.

## Come si usa

Normalmente vedi solo Ambrogio: la rete neurale al centro, su fondo scuro, con sotto quello che dice e il microfono.
Tutto il resto sta nel **Menu** in alto a destra, che scende a tendina solo quando ti serve.

**Come Alexa.** Di' **«Ambrogio, …»** e la domanda, per esempio «Ambrogio, che tempo fa domani a Roma?».
Quando ti sente fa un piccolo suono e la rete diventa verde. Puoi anche dire solo «Ambrogio», aspettare il suono
e poi parlare. Funziona anche mentre sta parlando: «Ambrogio, basta» lo ferma.
La prima volta la finestra di Ambrogio chiede il permesso per il microfono: rispondi **Consenti**.

| Azione | Come |
| --- | --- |
| Parlare | «Ambrogio, …», oppure il microfono sotto la rete, oppure la **barra spaziatrice** |
| Scrivere | inizia a scrivere con la tastiera: si apre la chat; poi Invio |
| Interrompere | «Ambrogio, basta», il pulsante sotto la rete (diventa un quadrato) oppure **Esc** |
| Aprire/chiudere il menu | **Menu** in alto a destra; **Esc** lo chiude |
| Voce on/off | icona dell'altoparlante nel menu |
| Attivazione con la voce on/off, personalità, tema, voce, velocità | **Impostazioni** nel menu |
| Nuova conversazione | **Nuova**, sopra la chat |
| Guardare come cambia Ambrogio (il codice di ogni aggiornamento che si scrive da solo) | icona **</>** nel menu; il pallino azzurro indica un aggiornamento nuovo. **Esc** per chiudere |

Il riconoscimento della voce lo fa il browser: in Edge passa dai server Microsoft (in Chrome da quelli Google),
mentre l'attivazione è accesa. Se preferisci, si spegne in **Impostazioni → Attivazione con la voce**.
In una fase successiva si potrà fare tutto sul PC, senza Internet.

Le voci più naturali (gratuite) sono quelle "Natural" di **Microsoft Edge**: apri Ambrogio con Edge e scegli la voce
in Impostazioni (quelle con la ★).

## Voce milanese (Google Gemini, gratis)

Ambrogio può parlare con accento milanese grazie a Google Gemini. Serve una "chiave" gratuita (senza carta di credito):

1. Apri https://aistudio.google.com e accedi con il tuo account Google.
2. Premi **Get API key** → **Create API key**, poi **copia** la chiave (una lunga riga che inizia con `AIza…`).
3. In **PowerShell** scrivi `notepad $HOME\jarvis-progetto\ambrogio\.env` e premi Invio
   (se chiede di creare il file, rispondi **Sì**).
4. Aggiungi una riga così, incollando la tua chiave dopo l'uguale, poi salva (Ctrl+S) e chiudi:
   `AMBROGIO_GEMINI_CHIAVE=AIza...`
5. Riavvia Ambrogio. In **Impostazioni → Chi parla** scegli **Ambrogio milanese** e prova le voci.

La versione gratuita ha poche richieste al giorno. Ambrogio le risparmia: dice ogni risposta con una sola
richiesta e le frasi già dette (saluti, «Cerco subito»…) le riusa. Quando finiscono, parla con la voce di Edge
e riprova da solo più tardi. Nella versione gratuita Google può usare i testi inviati per migliorare i suoi servizi.

## Impostazioni

Copia `.env.example` in `.env` e modifica lì (il nome con cui ti chiama, il modello, il percorso di Claude Code).
Il file `.env` e la cartella `data/` restano sul tuo PC e non vanno mai su GitHub.

## Comandi utili

| Comando | A cosa serve |
| --- | --- |
| `npm start` | avvia Ambrogio |
| `npm run controlla` | controlla Node.js, Claude Code e login |
| `npm test` | test automatici del backend (non consumano nulla) |
| `npm run verifica` | controllo completo del codice |
