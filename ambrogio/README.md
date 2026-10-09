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

### Icona di Ambrogio nella barra delle applicazioni

All'inizio nella barra in basso si vede l'icona di Edge. Per avere quella di Ambrogio (una volta sola):

1. apri Ambrogio: in alto al centro compare il bottone **Metti l'icona di Ambrogio nella barra**;
2. cliccalo e poi premi **Installa**;
3. chiudi Ambrogio (finestra e PowerShell) e riaprilo dall'icona sul desktop.

Da quel momento Ambrogio si apre con la sua icona. Se il bottone non compare, è già installato.

## Come si usa

Normalmente vedi solo Ambrogio: la rete neurale al centro, su fondo scuro, con sotto quello che dice e il microfono.
Tutto il resto sta nel **Menu** in alto a destra, che scende a tendina solo quando ti serve.

**Come Alexa.** Di' **«Uè Ambrogio, …»** e la domanda, per esempio «Uè Ambrogio, che tempo fa domani a Roma?».
Quando ti sente fa un piccolo suono e la rete diventa verde. Puoi anche dire solo «Uè Ambrogio», aspettare il suono
e poi parlare. Funziona anche mentre sta parlando: «Uè Ambrogio, basta» lo ferma.
La prima volta la finestra di Ambrogio chiede il permesso per il microfono: rispondi **Consenti**.

| Azione | Come |
| --- | --- |
| Parlare | «Uè Ambrogio, …», oppure il microfono sotto la rete, oppure la **barra spaziatrice** |
| Scrivere | inizia a scrivere con la tastiera: si apre la chat; poi Invio |
| Interrompere | «Uè Ambrogio, basta», il pulsante sotto la rete (diventa un quadrato) oppure **Esc** |
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

## Collegare Gmail (una volta sola, gratis, circa 10 minuti)

Ambrogio legge la posta con l'**accesso ufficiale di Google**: la tua password non passa mai da lui. Prima si crea
una piccola "app" Google tutta tua (serve solo a te), poi si preme «Collega Gmail».

**1. Crea il progetto su Google Cloud**
1. Apri https://console.cloud.google.com ed entra con **l'account Gmail da collegare** (es. pietrocozza.business@gmail.com).
2. In alto, accanto a «Google Cloud», apri l'elenco dei progetti → **Nuovo progetto** → nome **Ambrogio** → **Crea**.
   Poi assicurati che in alto sia selezionato il progetto Ambrogio.

**2. Attiva Gmail**
3. Nella barra di ricerca in alto scrivi **Gmail API**, aprila e premi **Abilita**.

**3. La schermata del permesso** (la pagina che vedrai quando colleghi Gmail)
4. Cerca **Google Auth Platform** (o «Schermata consenso OAuth») e premi **Inizia**.
5. Nome app: **Ambrogio** · Email di assistenza: la tua → Avanti. Pubblico: **Esterno** → Avanti. Email di contatto: la tua → Avanti → accetta → **Crea**.
6. Nella sezione **Pubblico** premi **Pubblica app** e conferma: così il permesso non scade ogni 7 giorni.
   (Se preferisci lasciarla «in test», aggiungi la tua email tra gli **utenti di test**, ma ogni settimana dovrai ricollegare Gmail.)

**4. Le credenziali per Ambrogio**
7. Sezione **Client** → **Crea client** → Tipo di applicazione: **App desktop** → nome **Ambrogio** → **Crea**.
8. Compaiono **ID client** e **Client secret**: copiali (non mandarli a nessuno).
9. In PowerShell: `notepad $HOME\jarvis-progetto\ambrogio\.env`, aggiungi queste righe con i tuoi valori, salva (Ctrl+S) e chiudi:
   ```
   AMBROGIO_GOOGLE_CLIENT_ID=il-tuo-id-client
   AMBROGIO_GOOGLE_CLIENT_SECRET=il-tuo-client-secret
   AMBROGIO_GMAIL_INDIRIZZO=pietrocozza.business@gmail.com
   ```

**5. Collega**
10. Riavvia Ambrogio → **Menu → Email → Collega Gmail**. Si apre la pagina di Google: scegli l'account.
11. Google avvisa «**Google non ha verificato questa app**»: è normale, l'app l'hai creata tu. Premi **Avanzate** → **Vai ad Ambrogio**.
12. Spunta **tutte** le caselle dei permessi di Gmail e premi **Continua**. La finestra si chiude da sola e nella rete si accende la zona **Email**.

Il permesso resta solo sul PC (`data/google-token.json`). Per toglierlo: **Menu → Email → Scollega**, oppure dal tuo
account Google (Sicurezza → App di terze parti). Ambrogio può leggere e preparare bozze da solo; **per inviare chiede
sempre il tuo permesso**.

## Voce di Ambrogio con ElevenLabs (milanese autentico)

La voce migliore: una voce clonata da un vero milanese, sempre la stessa. Costa il piano **Starter** di ElevenLabs
(circa 6 $ al mese, circa 30 minuti di parlato con la qualità "Massima" o il doppio con "Veloce").

1. Vai su https://elevenlabs.io, crea l'account e attiva il piano **Starter**.
2. **Clona la voce**: **Voices** → **Add a new voice** → **Instant Voice Clone**. Carica o registra 1–2 minuti
   di una persona milanese che parla in modo naturale, con un po' di dialetto (tu stesso o un amico, **con il suo permesso**).
   Spunta la conferma del consenso e chiama la voce **Ambrogio**.
3. **Crea la chiave**: in basso a sinistra il tuo profilo → **API Keys** → **Create API Key**. Copiala (non mandarla a nessuno).
4. In PowerShell: `notepad $HOME\jarvis-progetto\ambrogio\.env`, aggiungi la riga
   `AMBROGIO_ELEVENLABS_CHIAVE=la-tua-chiave`, salva (Ctrl+S) e chiudi.
5. Riavvia Ambrogio. In **Impostazioni → Chi parla** scegli **Ambrogio milanese**, poi la voce **Ambrogio (la tua voce)** e premi **Prova**.

Le frasi già dette si salvano sul PC e non si pagano due volte. Nelle Impostazioni vedi i crediti usati del mese.
Se i crediti finiscono, Ambrogio parla con la voce di Edge fino al rinnovo. I testi letti passano dai server di ElevenLabs.

## Voce milanese (Google Gemini, gratis)

Ambrogio può parlare con accento milanese grazie a Google Gemini. Serve una "chiave" gratuita (senza carta di credito):

1. Apri https://aistudio.google.com e accedi con il tuo account Google.
2. Premi **Get API key** → **Create API key**, poi **copia** la chiave (una lunga riga di lettere e numeri, per esempio `AQ.…` o `AIza…`). Non mandarla a nessuno.
3. In **PowerShell** scrivi `notepad $HOME\jarvis-progetto\ambrogio\.env` e premi Invio
   (se chiede di creare il file, rispondi **Sì**).
4. Aggiungi una riga così, incollando la tua chiave dopo l'uguale, poi salva (Ctrl+S) e chiudi:
   `AMBROGIO_GEMINI_CHIAVE=la-tua-chiave`
5. Riavvia Ambrogio. In **Impostazioni → Chi parla** scegli **Ambrogio milanese** e prova le voci.

La versione gratuita ha poche richieste al giorno. Ambrogio le risparmia: dice ogni risposta con una sola
richiesta e le frasi già dette (saluti, «Cerco subito»…) le riusa. Quando finiscono, parla con la voce di Edge
e riprova da solo più tardi. Nella versione gratuita Google può usare i testi inviati per migliorare i suoi servizi.

**Senza limiti (a consumo, pochi centesimi al giorno):** su https://aistudio.google.com, nella pagina delle chiavi API,
premi **Set up billing** (o **Imposta fatturazione**) accanto al progetto della chiave e aggiungi una carta.
Poi nel file `.env` aggiungi la riga `AMBROGIO_GEMINI_A_PAGAMENTO=1` e riavvia Ambrogio: parlerà frase per frase, senza limite giornaliero.
Consiglio: su Google Cloud imposta un **avviso di budget** (Fatturazione → Budget e avvisi), per esempio 5 €.

## Telefonate con Linphone (gratis)

Ambrogio telefona dal suo account Linphone al tuo Linphone sul telefono. Il pezzo ufficiale di Linphone per Python
esiste solo per Linux, quindi gira in un piccolo Linux dentro Windows (WSL, gratis di Microsoft).
Spazio: circa 1 GB da scaricare, 3 GB sul disco; serve un riavvio la prima volta.

1. **PowerShell come amministratore** (tasto destro su Start → *Terminale (amministratore)*): `wsl --install -d Ubuntu`.
   Poi riavvia il PC.
2. Dopo il riavvio si apre la finestra **Ubuntu**: scegli un nome utente e una password (mentre scrivi la password
   non si vede nulla, è normale). Tienila per te.
3. Nel file `.env` (Blocco note) aggiungi:
   ```
   AMBROGIO_LINPHONE_UTENTE=ambrogio.ai
   AMBROGIO_LINPHONE_PASSWORD=la password dell'account Linphone di Ambrogio
   AMBROGIO_LINPHONE_CHIAMA=sip:pietrocozza@sip.linphone.org
   ```
4. Nella finestra **Ubuntu**:
   ```bash
   cd /mnt/c/Users/cozza/jarvis-progetto/ambrogio
   bash telefono/installa.sh
   bash telefono/prova.sh
   ```
   La prova fa squillare Linphone sul telefono: rispondi, senti tre bip, poi parla per qualche secondo.
5. Telefonata vera: in Ambrogio, **Menu → Impostazioni → Telefono → «Chiamami adesso (prova)»**. Ambrogio accende da solo
   il telefono in Ubuntu, ti chiama, parla con la sua voce, ascolta cosa rispondi e ti risponde; per finire basta salutarlo.
   La conversazione resta scritta sotto il bottone e nel Registro.

## Collegare Google Calendar (e il calendario dell'iPhone)

1. Su console.cloud.google.com, nel progetto «Ambrogio», cerca **Google Calendar API** e clicca **Abilita**.
2. In Ambrogio: **Menu → Email → Scollega**, poi **Collega Gmail** di nuovo, e accetta anche i permessi del calendario.
3. Sull'iPhone, per vedere e creare gli impegni nello stesso calendario: **Impostazioni → App → Calendario → Account →
   Aggiungi account → Google** (lo stesso account), con **Calendari** acceso; poi in **Calendario predefinito** scegli
   quello di Google.

Poi: «cosa ho domani?», «che impegni ho venerdì?», «segnami il commercialista giovedì alle 15» (chiede il permesso).

## Collegare Airbnb (case vacanza)

Airbnb non permette ai normali host di collegare programmi al proprio account, e far entrare un robot sul sito con la
password è vietato. Ambrogio usa quindi i canali ufficiali:

1. **Calendario**: su Airbnb (dal computer) apri l'annuncio → **Disponibilità** → **Collega calendari** → **Esporta
   calendario** → copia il link. Nel file `.env`:
   ```
   AMBROGIO_AIRBNB_CASA_1_NOME=Trastevere
   AMBROGIO_AIRBNB_CASA_1_ICAL=il link copiato
   ```
2. **Scheda della casa**: al primo avvio Ambrogio crea `data\case\casa-1.txt`. Aprila con il Blocco note e riempila
   (check-in, wifi, regole, zona, risposte pronte…). Niente codici di porte o cassette.
3. **Messaggi degli ospiti**: arrivano per email a Gmail; collega Gmail (sezione sopra).

Poi chiedi: «chi arriva questa settimana?», «quanto sono occupato a novembre?», «che prezzo mi consigli per i buchi?».
Ambrogio non cambia mai i prezzi: li suggerisce soltanto.

**Aggiornamenti automatici**: con Gmail collegato, Ambrogio legge da solo ogni minuto le email nuove di Airbnb
(prenotazioni, modifiche, cancellazioni, messaggi, recensioni, pagamenti), ne ricava ospiti e guadagni e ti avvisa;
la mattina ti dice chi arriva e chi parte, la sera chi arriva domani.

**Rendimento**:
- *File di Airbnb*: in Impostazioni → Airbnb → **Carica file Airbnb** (anche più file insieme):
  - i PDF «Report dei guadagni» di ogni anno (Guadagni → Report): guadagni mese per mese, letti con Gemini;
  - il CSV «Report mensile» delle prestazioni (Statistiche): prenotazioni, prezzo medio, conversioni per annuncio;
  - il CSV della cronologia delle transazioni: prenotazione per prenotazione;
  - un CSV di spese (Data, Descrizione, Categoria, Importo, Casa): finisce nel foglio delle spese.
- *Spese*: in Impostazioni → Airbnb → **Foglio delle spese** Ambrogio crea un foglio Google (vede solo quello, non il
  resto del Drive) con affitto e condominio già scritti; le altre spese le scrivi lì o le dici ad Ambrogio
  («ho pagato la bolletta della luce, 85 euro»). Serve **Google Sheets API** attiva su Google Cloud e ricollegare Google.
- Poi chiedi: «qual è il rendimento di ottobre?», «quanto ho guadagnato quest'anno al netto delle spese?».

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
