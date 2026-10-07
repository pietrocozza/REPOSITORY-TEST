// Avvia Jarvis con un solo comando (npm start):
//  1. controlla Node.js e le dipendenze
//  2. accende il backend locale (porta 8787) e l'interfaccia (porta 3000)
//  3. apre il browser su http://127.0.0.1:3000
// Ctrl+C nel terminale spegne tutto.

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORTA_UI = Number(process.env.JARVIS_PORTA_UI ?? 3000)
const INDIRIZZO = `http://127.0.0.1:${PORTA_UI}`

const [maj, min] = process.versions.node.split('.').map(Number)
if (maj < 22 || (maj === 22 && min < 18)) {
  console.error(`\nServe Node.js 22.18 o più recente: hai la ${process.versions.node}.`)
  console.error('In PowerShell: winget install OpenJS.NodeJS.LTS   (poi chiudi e riapri PowerShell)\n')
  process.exit(1)
}

const next = path.join(radice, 'node_modules', 'next', 'dist', 'bin', 'next')
if (!fs.existsSync(next)) {
  console.error('\nMancano le dipendenze. Nella cartella jarvis esegui prima: npm install\n')
  process.exit(1)
}

const processi = []
function avvia(nome, args, cwd) {
  // NEXT_TELEMETRY_DISABLED: Next.js non invia statistiche d'uso anonime
  const p = spawn(process.execPath, args, { cwd, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
  const scrivi = (flusso) => (dati) => {
    for (const riga of dati.toString().split(/\r?\n/)) if (riga.trim()) flusso.write(`[${nome}] ${riga}\n`)
  }
  p.stdout.on('data', scrivi(process.stdout))
  p.stderr.on('data', scrivi(process.stderr))
  p.on('exit', (codice) => {
    if (!spegnimento) {
      console.error(`[${nome}] si è fermato (codice ${codice}). Spengo Jarvis.`)
      spegni(codice ?? 1)
    }
  })
  processi.push(p)
  return p
}

let spegnimento = false
function spegni(codice = 0) {
  spegnimento = true
  for (const p of processi) if (p.exitCode === null) p.kill()
  setTimeout(() => process.exit(codice), 1500).unref()
}
process.on('SIGINT', () => spegni(0))
process.on('SIGTERM', () => spegni(0))

// Apre Jarvis: su Windows in una finestra tutta sua (Microsoft Edge in modalità app, senza barra degli indirizzi,
// con le voci "Natural"); altrove nel browser predefinito. JARVIS_FINESTRA_APP=0 per usare il browser normale.
function apriFinestra() {
  if (process.env.JARVIS_NON_APRIRE_BROWSER) return
  const app = process.platform === 'win32' && process.env.JARVIS_FINESTRA_APP !== '0'
  const comando =
    process.platform === 'win32'
      ? ['cmd', app ? ['/c', 'start', '', 'msedge', `--app=${INDIRIZZO}`] : ['/c', 'start', '', INDIRIZZO]]
      : process.platform === 'darwin'
        ? ['open', [INDIRIZZO]]
        : ['xdg-open', [INDIRIZZO]]
  spawn(comando[0], comando[1], { stdio: 'ignore', detached: true, windowsHide: true }).on('error', () => {}).unref()
}

// Se Jarvis è già acceso (per esempio doppio clic sull'icona una seconda volta) basta riaprire la finestra
try {
  const res = await fetch(`${INDIRIZZO}/api/stato`, { signal: AbortSignal.timeout(1500) })
  if (res.ok) {
    console.log('\nJarvis è già acceso: apro la finestra.\n')
    apriFinestra()
    process.exit(0)
  }
} catch {
  // non è acceso: si avvia
}

console.log('\nAvvio di J.A.R.V.I.S.…\n')
avvia('backend', ['--disable-warning=ExperimentalWarning', path.join('src', 'index.ts')], path.join(radice, 'backend'))
// --hostname 127.0.0.1: l'interfaccia è raggiungibile solo da questo computer
avvia('interfaccia', [next, 'dev', '--port', String(PORTA_UI), '--hostname', '127.0.0.1'], path.join(radice, 'frontend'))

// Apre il browser quando l'interfaccia è pronta
async function apriBrowser() {
  for (let i = 0; i < 120 && !spegnimento; i++) {
    try {
      const res = await fetch(INDIRIZZO)
      if (res.ok) break
    } catch {
      // non ancora pronta
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  if (spegnimento) return
  console.log(`\nJarvis è pronto: ${INDIRIZZO}  (per spegnerlo premi Ctrl+C in questa finestra)\n`)
  apriFinestra()
}
apriBrowser()
