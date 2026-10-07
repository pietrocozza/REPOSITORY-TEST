import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// Trova Claude Code sul computer, senza dare per scontato dove sia installato.
// Su Windows può essere claude.exe (installer ufficiale) o claude.cmd (installazione con npm).

export type Eseguibile = {
  /** programma da avviare */
  comando: string
  /** argomenti da mettere prima di quelli di Jarvis (es. il file cli.js quando si passa da node) */
  prefisso: string[]
  /** true solo se serve passare dal prompt dei comandi di Windows (ultima risorsa) */
  shell: boolean
  /** da dove è stato trovato, per la diagnostica */
  descrizione: string
}

const WINDOWS = process.platform === 'win32'

function esiste(file: string) {
  try {
    return fs.statSync(file).isFile()
  } catch {
    return false
  }
}

function daFile(file: string): Eseguibile {
  if (WINDOWS && /\.(cmd|bat)$/i.test(file)) {
    // Installazione via npm: claude.cmd è solo un collegamento. Meglio avviare direttamente il programma vero,
    // senza passare dal prompt dei comandi (versioni recenti: bin/claude.exe; versioni vecchie: cli.js)
    const pacchetto = path.join(path.dirname(file), 'node_modules', '@anthropic-ai', 'claude-code')
    const exe = path.join(pacchetto, 'bin', 'claude.exe')
    if (esiste(exe)) return { comando: exe, prefisso: [], shell: false, descrizione: exe }
    const cli = path.join(pacchetto, 'cli.js')
    if (esiste(cli)) return { comando: process.execPath, prefisso: [cli], shell: false, descrizione: cli }
    return { comando: file, prefisso: [], shell: true, descrizione: file }
  }
  return { comando: file, prefisso: [], shell: false, descrizione: file }
}

export function trovaClaude(percorsoConfigurato?: string): Eseguibile | null {
  if (percorsoConfigurato) return esiste(percorsoConfigurato) ? daFile(percorsoConfigurato) : null

  const nomi = WINDOWS ? ['claude.exe', 'claude.cmd'] : ['claude']
  const cartelle = (process.env.PATH ?? '').split(path.delimiter).filter(Boolean)
  // posizioni tipiche anche se non sono nel PATH
  const casa = os.homedir()
  cartelle.push(path.join(casa, '.local', 'bin'), path.join(casa, '.claude', 'local'))
  if (WINDOWS && process.env.APPDATA) cartelle.push(path.join(process.env.APPDATA, 'npm'))

  for (const cartella of cartelle) {
    for (const nome of nomi) {
      const file = path.join(cartella, nome)
      if (esiste(file)) return daFile(file)
    }
  }
  return null
}
