# Architettura di Jarvis

Jarvis è diviso in pezzi indipendenti, così ogni parte si può cambiare o spostare (per esempio su un mini PC sempre acceso) senza toccare le altre.

```
 Browser (Chrome/Edge)                    Il tuo PC (solo 127.0.0.1)
┌───────────────────────┐   /api/...   ┌──────────────────────────────────────────┐
│ frontend/  (Next.js)  │ ───────────▶ │ backend/  (Node.js, nessuna libreria)     │
│ interfaccia, rete 3D, │ ◀─ eventi ── │  http/      riceve le richieste           │
│ voce, comandi         │   (NDJSON)   │  agent/     parla con Claude Code ──────┐ │
└───────────────────────┘              │  (in arrivo) tools/ permissions/        │ │
                                       │  database/ scheduler/ integrations/     │ │
                                       └─────────────────────────────────────────┼─┘
                                                                                 ▼
                                                        Claude Code installato (claude.exe)
                                                        con il login del tuo abbonamento
```

## Cartelle

| Cartella | Cosa contiene |
| --- | --- |
| `frontend/` | L'interfaccia "Neural Interface": pagina, rete neurale WebGL, voce del browser |
| `backend/src/http/` | Server locale: accetta solo richieste dall'interfaccia di Jarvis |
| `backend/src/agent/` | Avvio di Claude Code, istruzioni di Jarvis, conversazione attiva |
| `backend/src/config.ts` | Configurazione (letta dal file `.env`) |
| `backend/src/diagnostica.ts` | Controlli: Node.js, Claude Code, login |
| `backend/test/` | Test automatici (con un finto Claude Code, non consumano nulla) |
| `scripts/` | Avvio con un comando, controllo dell'ambiente Windows |
| `data/` | **Dati personali** (conversazione, in futuro memoria e token): mai su GitHub |

Le prossime fasi aggiungeranno, ognuna nella sua cartella del backend:
`database/` (SQLite), `tools/` (strumenti controllati), `permissions/` (gestore dei permessi e log),
`scheduler/` (attività persistenti), `integrations/` (Gmail, Calendar, browser, notifiche), `voice/`, `revenue/`.

## Come Jarvis usa Claude (e perché non costa nulla in più)

Il backend avvia Claude Code in modalità non interattiva:

```
claude -p --input-format stream-json --output-format stream-json --tools WebSearch,WebFetch \
       --setting-sources "" --strict-mcp-config --system-prompt-file … --effort low \
       --session-id/--resume <conversazione>
```

- **Abbonamento, non API a consumo.** Il backend toglie dall'ambiente le variabili che farebbero usare
  chiavi API (`ANTHROPIC_API_KEY`, ecc.) e controlla la "fonte della chiave" che Claude Code dichiara all'avvio:
  se non è il tuo login, la richiesta viene fermata. Si può sbloccare solo scrivendo
  `JARVIS_CONSENTI_API_A_CONSUMO=1` nel file `.env`.
- **Niente accesso al sistema.** Gli strumenti integrati di Claude Code sono spenti tranne la ricerca web e la
  lettura di pagine. Niente terminale, niente modifica di file, niente impostazioni personali di Claude Code.
  Claude lavora in `data/agente/`, una cartella vuota e isolata.
- **Il messaggio passa da stdin**, mai dalla riga di comando: il testo non può diventare un comando.
- **Velocità.** Claude Code viene acceso all'avvio di Jarvis e resta acceso (`--input-format stream-json`):
  i messaggi gli arrivano uno dopo l'altro senza riavviarlo. Se questa modalità non funziona, Jarvis passa
  da solo a un avvio per messaggio. Il livello di ragionamento è `--effort low` (modificabile con `JARVIS_EFFORT`).
- **Memoria della conversazione.** Claude Code salva la conversazione e il backend la riprende con `--resume`,
  anche dopo un riavvio. "Nuova conversazione" ne apre una pulita.

## Eventi verso l'interfaccia

Il backend risponde a `POST /api/chat` con una riga JSON per evento:

| Evento | Esempio | Effetto nell'interfaccia |
| --- | --- | --- |
| `stato` | `{"tipo":"stato","stato":"WORKING","strumento":"WebSearch","descrizione":"Ricerca sul web"}` | la rete cambia colore e ritmo |
| `testo` | `{"tipo":"testo","testo":"Oggi a Roma…"}` | testo a schermo e voce |
| `fine` | `{"tipo":"fine","strumentiUsati":["WebSearch"]}` | ritorno in attesa (con "completato") |
| `errore` | `{"tipo":"errore","messaggio":"…"}` | messaggio in italiano, rete rossa |

Stati: `IDLE`, `LISTENING`, `THINKING`, `SPEAKING`, `WORKING`, `WAITING_FOR_CONFIRMATION`, `SUCCESS`, `ERROR`.

## Memoria, strumenti, permessi e registro

**Memoria (SQLite).** Tutto sta in `data/jarvis.sqlite` (SQLite è integrato in Node.js): conversazioni,
memorie (preferenze, persone, contatti, regole, note), pratiche, richieste di autorizzazione, permessi
"consenti sempre" e registro delle attività. All'inizio di ogni conversazione Claude riceve un riassunto
di ciò che Jarvis ricorda.

**Strumenti.** Ogni capacità è una funzione del backend (`backend/src/strumenti/catalogo.ts`) con uno schema
degli argomenti e un livello di permesso. Claude Code li usa attraverso un **server MCP** integrato nel backend
(`/mcp`, protetto da una chiave segreta nuova a ogni avvio). Strumenti attuali:

| Strumento | Cosa fa | Livello |
| --- | --- | --- |
| `ricorda` | salva una preferenza, persona, contatto, regola o nota | 1 |
| `cerca_memoria` | cerca nella memoria | 1 |
| `dimentica` | cancella una memoria | 3 |
| `apri_pratica` / `aggiorna_pratica` / `elenca_pratiche` | attività che durano nel tempo | 1 |

**Gestore dei permessi** (`backend/src/permessi/gestore.ts`). Il controllo sta nel backend, non nel modello:

1. **Automatiche**: letture, ricerche, analisi, bozze, appunti interni → eseguite subito.
2. **Con conferma**: invii, modifiche al calendario, messaggi, prezzi → serve il tuo sì
   (puoi concedere "consenti sempre", revocabile dalle Impostazioni).
3. **Sensibili**: eliminazioni, pagamenti, acquisti, contratti → serve SEMPRE il tuo sì esplicito,
   dopo aver spuntato "Ho capito: è un'azione definitiva". Nessun "consenti sempre".

Durante l'attesa lo strumento non esegue nulla, la rete diventa gialla (`WAITING_FOR_CONFIRMATION`) e la
richiesta compare sopra la barra per scrivere. Senza risposta entro 10 minuti la richiesta scade.
Le richieste rimaste aperte quando Jarvis si spegne non valgono più alla riaccensione.

**Registro.** Ogni passo finisce nel registro con l'orario (sezione Registro dell'interfaccia):
richiesta ricevuta, strumento usato, richiesta di autorizzazione, autorizzazione ricevuta o negata,
azione eseguita, errori.

## Spostare tutto su un mini PC

Il backend non dipende dall'interfaccia né da Windows: è Node.js puro e tiene i dati in `data/`.
Per spostarlo basterà copiare la cartella, installare Node.js e Claude Code sul mini PC, fare il login
e indicare all'interfaccia il nuovo indirizzo (`JARVIS_BACKEND_URL`). Prima di aprirlo alla rete di casa
andrà aggiunta un'autenticazione (oggi il backend accetta solo connessioni dallo stesso computer).
