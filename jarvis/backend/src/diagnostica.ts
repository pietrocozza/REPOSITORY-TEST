import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as configPredefinita, type Config } from './config.ts'
import { trovaClaude, type Eseguibile } from './agent/eseguibile.ts'

// Controlli di salute: Node.js, Claude Code, login all'account Claude.
// Usati all'avvio, dall'interfaccia (/api/stato) e dal comando "npm run controlla".

export type Controllo = { nome: string; ok: boolean; dettaglio: string; aiuto?: string }

const VERSIONE_NODE_MINIMA = [22, 18]

function esegui(e: Eseguibile, args: string[], env: NodeJS.ProcessEnv): Promise<{ ok: boolean; out: string }> {
  return new Promise((resolve) => {
    const argomenti = [...e.prefisso, ...args].map((a) => (e.shell ? `"${a}"` : a))
    const figlio = execFile(e.comando, argomenti, { timeout: 20000, env, shell: e.shell, windowsHide: true }, (err, stdout, stderr) =>
      resolve({ ok: !err, out: (stdout || stderr || String(err ?? '')).trim() }),
    )
    figlio.stdin?.end()
  })
}

export async function diagnostica(config: Config = configPredefinita) {
  const controlli: Controllo[] = []

  const [maj, min] = process.versions.node.split('.').map(Number)
  const nodeOk = maj > VERSIONE_NODE_MINIMA[0] || (maj === VERSIONE_NODE_MINIMA[0] && min >= VERSIONE_NODE_MINIMA[1])
  controlli.push({
    nome: 'Node.js',
    ok: nodeOk,
    dettaglio: `versione ${process.versions.node}`,
    aiuto: nodeOk ? undefined : 'Serve Node.js 22.18 o più recente (consigliato: 24 LTS). In PowerShell: winget install OpenJS.NodeJS.LTS',
  })

  const claude = trovaClaude(config.claude.percorso || undefined)
  if (!claude) {
    controlli.push({
      nome: 'Claude Code',
      ok: false,
      dettaglio: 'non trovato',
      aiuto: 'Installa Claude Code oppure scrivi il percorso di claude.exe in JARVIS_CLAUDE_PATH nel file .env.',
    })
    return { ok: false, claude: null, controlli }
  }

  const env = { ...process.env }
  if (!config.claude.consentiApiAConsumo) for (const v of ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN']) delete env[v]

  const versione = await esegui(claude, ['--version'], env)
  controlli.push({
    nome: 'Claude Code',
    ok: versione.ok,
    dettaglio: versione.ok ? `${versione.out.split('\n')[0]} · ${claude.descrizione}` : versione.out.slice(0, 200),
  })

  const auth = await esegui(claude, ['auth', 'status', '--json'], env)
  let accesso: Controllo = {
    nome: 'Account Claude',
    ok: false,
    dettaglio: 'stato del login non leggibile',
    aiuto: 'In PowerShell scrivi: claude   poi, dentro Claude Code: /login',
  }
  try {
    const dati = JSON.parse(auth.out) as { loggedIn?: boolean; authMethod?: string; apiProvider?: string }
    const metodo = String(dati.authMethod ?? 'sconosciuto')
    const aConsumo = /api.?key/i.test(metodo) || (dati.apiProvider && dati.apiProvider !== 'firstParty')
    if (!dati.loggedIn) {
      accesso = { ...accesso, dettaglio: 'non hai fatto il login' }
    } else if (aConsumo && !config.claude.consentiApiAConsumo) {
      accesso = {
        nome: 'Account Claude',
        ok: false,
        dettaglio: `collegato con un metodo a consumo (${metodo})`,
        aiuto: 'Jarvis usa solo il tuo abbonamento: in Claude Code esegui /logout e poi /login scegliendo il tuo account Claude (Pro/Max).',
      }
    } else {
      accesso = { nome: 'Account Claude', ok: true, dettaglio: `collegato (${metodo})` }
    }
  } catch {
    // lasciato il messaggio predefinito
  }
  controlli.push(accesso)

  return { ok: controlli.every((c) => c.ok), claude: claude.descrizione, controlli }
}

// Avvio da terminale: npm run controlla
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const esito = await diagnostica()
  console.log('\nControllo di Jarvis\n')
  for (const c of esito.controlli) {
    console.log(`${c.ok ? '  OK ' : '  NO '} ${c.nome}: ${c.dettaglio}`)
    if (c.aiuto) console.log(`       → ${c.aiuto}`)
  }
  console.log(esito.ok ? '\nTutto pronto.\n' : '\nC’è qualcosa da sistemare (vedi sopra).\n')
  process.exitCode = esito.ok ? 0 : 1
}
