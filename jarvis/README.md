# J.A.R.V.I.S.

Assistente personale che funziona sul tuo PC Windows. Il "cervello" è **Claude Code**, collegato al tuo
abbonamento Claude: **nessuna API a consumo**. L'interfaccia è la "Neural Interface", con la rete neurale 3D
che reagisce a quello che Jarvis sta facendo.

Stato attuale (fase 1 di 17): chat reale con Claude (scritta o a voce), ricerca web, conversazione ricordata
anche dopo il riavvio. Email, calendario, memoria, strumenti e permessi arrivano nelle prossime fasi
(vedi [docs/ARCHITETTURA.md](docs/ARCHITETTURA.md)).

## Cosa serve sul PC

| Programma | Perché | Come installarlo (PowerShell) |
| --- | --- | --- |
| **Node.js 24 LTS** (minimo 22.18) | fa funzionare backend e interfaccia | `winget install OpenJS.NodeJS.LTS` |
| **Git** | per scaricare e aggiornare il progetto | `winget install Git.Git` |
| **Claude Code** | il cervello di Jarvis, con il tuo login | già installato |
| Chrome o Edge | per l'interfaccia e il microfono | già presente |

Python **non serve** in questa fase. VS Code è facoltativo.

Per controllare cosa hai già, nella cartella `jarvis` apri PowerShell e scrivi:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\controlla-ambiente.ps1
```

## Installazione (una volta sola)

In **PowerShell**:

```powershell
cd $HOME\Documents
git clone https://github.com/pietrocozza/repository-test.git jarvis-progetto
cd jarvis-progetto
git checkout claude/vibrant-newton-5ifs9d
cd jarvis
npm install
npm run controlla
```

`npm run controlla` deve mostrare tre **OK** (Node.js, Claude Code, Account Claude).
Se l'account non è collegato: scrivi `claude`, premi Invio, poi `/login` e scegli il tuo account Claude.

## Avvio (ogni volta)

In **PowerShell**, dentro la cartella `jarvis`:

```powershell
npm start
```

Si apre il browser su http://127.0.0.1:3000. Per spegnere Jarvis premi **Ctrl+C** nella finestra di PowerShell.

## Come si usa

- **Al centro** la rete neurale: cambia colore e ritmo a seconda di quello che fa Jarvis. Trascinala per ruotarla.
- **A destra** tutto il resto: il menu, la conversazione e, in fondo, la barra per scrivere (sempre visibile).
- **A sinistra** i numeri: attività in corso, messaggi, strumenti usati, tempo medio di risposta.

| Azione | Come |
| --- | --- |
| Scrivere | barra in basso a destra, poi Invio |
| Parlare | pulsante del microfono oppure **barra spaziatrice** (consenti il microfono la prima volta) |
| Interrompere | lo stesso pulsante (diventa un quadrato) oppure **Esc** |
| Voce on/off | icona dell'altoparlante in alto a destra |
| Tema chiaro/scuro, scelta della voce, velocità, ascolto continuo | **Impostazioni** nel menu |
| Nuova conversazione | **Nuova**, sopra la chat |

Le voci più naturali (gratuite) sono quelle "Natural" di **Microsoft Edge**: apri Jarvis con Edge e scegli la voce
in Impostazioni (quelle con la ★).

## Impostazioni

Copia `.env.example` in `.env` e modifica lì (il nome con cui ti chiama, il modello, il percorso di Claude Code).
Il file `.env` e la cartella `data/` restano sul tuo PC e non vanno mai su GitHub.

## Comandi utili

| Comando | A cosa serve |
| --- | --- |
| `npm start` | avvia Jarvis |
| `npm run controlla` | controlla Node.js, Claude Code e login |
| `npm test` | test automatici del backend (non consumano nulla) |
| `npm run verifica` | controllo completo del codice |
