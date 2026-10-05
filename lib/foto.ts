import 'server-only'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Elenco delle foto presenti in public/images (letto sul server, al momento della build).
 * Le foto mancanti vengono mostrate con un segnaposto neutro.
 */
export function fotoDisponibili(): string[] {
  const radice = path.join(process.cwd(), 'public', 'images')
  const trovate: string[] = []
  const visita = (dir: string) => {
    if (!fs.existsSync(dir)) return
    for (const voce of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, voce.name)
      if (voce.isDirectory()) visita(p)
      else if (/\.(webp|png)$/i.test(voce.name)) trovate.push(path.relative(radice, p).split(path.sep).join('/'))
    }
  }
  visita(radice)
  return trovate
}
