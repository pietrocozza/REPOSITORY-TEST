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

## Strumenti e permessi (fase 8)

Ogni capacità (`read_email`, `send_email`, `create_calendar_event`, …) sarà una funzione del backend esposta a
Claude Code tramite un server MCP locale. Il controllo dei permessi sta **nel backend**, non nel modello:

1. **Automatiche**: letture, ricerche, analisi, bozze.
2. **Con conferma**: invio email, modifiche al calendario, messaggi, prezzi.
3. **Sensibili**: pagamenti, acquisti, eliminazioni, contratti. Sempre conferma esplicita.

Quando serve una conferma, lo strumento non esegue nulla: registra la richiesta, l'interfaccia passa allo stato
`WAITING_FOR_CONFIRMATION` e l'azione parte solo dopo il tuo sì. Ogni passo finisce nel log delle attività.

## Spostare tutto su un mini PC

Il backend non dipende dall'interfaccia né da Windows: è Node.js puro e tiene i dati in `data/`.
Per spostarlo basterà copiare la cartella, installare Node.js e Claude Code sul mini PC, fare il login
e indicare all'interfaccia il nuovo indirizzo (`JARVIS_BACKEND_URL`). Prima di aprirlo alla rete di casa
andrà aggiunta un'autenticazione (oggi il backend accetta solo connessioni dallo stesso computer).
