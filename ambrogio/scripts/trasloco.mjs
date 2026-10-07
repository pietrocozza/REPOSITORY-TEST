// Trasloco da "jarvis" ad "Ambrogio", una volta sola dopo il git pull che ha cambiato nome alla cartella.
// Git sposta il codice, ma non tocca i file che non sono su GitHub: memoria e impostazioni (data/),
// il file .env e i programmi scaricati (node_modules). Questo script:
//  1. sposta data/ e .env dalla vecchia cartella "jarvis" a quella nuova "ambrogio" (non si perde nulla)
//  2. cancella quello che resta della vecchia cartella (solo programmi scaricati, si riscaricano)
//  3. riscarica i programmi (npm install) e rifà l'icona sul desktop
// Uso (in PowerShell, nella cartella ambrogio):  npm run trasloco

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const vecchia = path.resolve(radice, '..', 'jarvis')
const ok = (m) => console.log(`  OK  ${m}`)
const stop = (m) => {
  console.error(`\n  ATTENZIONE: ${m}\n`)
  process.exit(1)
}

console.log('\nTrasloco da Jarvis ad Ambrogio\n')

// Se Jarvis/Ambrogio è acceso i suoi file sono in uso e non si possono spostare
try {
  const res = await fetch('http://127.0.0.1:8787/api/stato', { signal: AbortSignal.timeout(1500) })
  if (res.ok) stop('Jarvis è ancora acceso. Chiudi la sua finestra e la finestra di PowerShell ridotta a icona, poi riprova.')
} catch {
  // spento: si può procedere
}

if (!fs.existsSync(vecchia)) {
  ok('nessuna vecchia cartella "jarvis" da spostare')
} else {
  // sicurezza: se nella vecchia cartella c'è ancora il codice, il git pull non è stato fatto
  if (fs.existsSync(path.join(vecchia, 'package.json'))) stop('nella cartella "jarvis" c\'è ancora il codice: prima fai "git pull".')

  const spostaTutto = (da, a) => {
    fs.mkdirSync(a, { recursive: true })
    for (const nome of fs.readdirSync(da)) {
      const sorgente = path.join(da, nome)
      const destinazione = path.join(a, nome)
      // se Ambrogio era già partito e ha creato file nuovi, quelli vecchi (con la tua memoria) hanno la precedenza
      if (fs.existsSync(destinazione)) fs.renameSync(destinazione, `${destinazione}.nuovo-${Date.now()}`)
      fs.renameSync(sorgente, destinazione)
    }
  }

  try {
    const dati = path.join(vecchia, 'data')
    if (fs.existsSync(dati)) {
      spostaTutto(dati, path.join(radice, 'data'))
      // la memoria cambia nome anche lei (se Ambrogio ne aveva creata una vuota, resta come copia di sicurezza)
      const dbVecchio = path.join(radice, 'data', 'jarvis.sqlite')
      const dbNuovo = path.join(radice, 'data', 'ambrogio.sqlite')
      if (fs.existsSync(dbVecchio)) {
        for (const coda of ['', '-wal', '-shm']) {
          if (fs.existsSync(dbNuovo + coda)) fs.renameSync(dbNuovo + coda, `${dbNuovo}${coda}.vuota-${Date.now()}`)
          if (fs.existsSync(dbVecchio + coda)) fs.renameSync(dbVecchio + coda, dbNuovo + coda)
        }
      }
      ok('memoria, conversazioni e impostazioni spostate in ambrogio\\data')
    }

    const envVecchio = path.join(vecchia, '.env')
    if (fs.existsSync(envVecchio)) {
      const envNuovo = path.join(radice, '.env')
      if (!fs.existsSync(envNuovo)) fs.writeFileSync(envNuovo, fs.readFileSync(envVecchio, 'utf8').replace(/^(\s*)JARVIS_/gm, '$1AMBROGIO_'))
      fs.rmSync(envVecchio)
      ok('impostazioni (.env) spostate')
    }
  } catch (err) {
    stop(`non riesco a spostare i file (${err.code ?? err.message}). Chiudi tutte le finestre di Jarvis ed Edge aperte da Jarvis, poi riprova.`)
  }

  try {
    fs.rmSync(vecchia, { recursive: true, force: true })
    ok('vecchia cartella "jarvis" cancellata (c\'erano solo programmi scaricati)')
  } catch {
    console.log('  --  la vecchia cartella "jarvis" non si cancella del tutto: puoi eliminarla tu più tardi, non contiene più dati.')
  }
}

console.log('\n  Scarico i programmi che servono (qualche minuto)…\n')
const install = spawnSync('npm', ['install'], { cwd: radice, stdio: 'inherit', shell: process.platform === 'win32' })
if (install.status !== 0) stop('"npm install" non è riuscito. Controlla la connessione a Internet e riprova con: npm run trasloco')
ok('programmi pronti')

if (process.platform === 'win32') {
  spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(radice, 'scripts', 'crea-collegamento.ps1')], {
    cwd: radice,
    stdio: 'inherit',
  })
}

console.log('\nFatto! Ora fai doppio clic sull\'icona "Ambrogio" sul desktop.\n')
