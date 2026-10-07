// Finto servizio telefonico (stesso protocollo di telefono/servizio.py) per i test
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline'

const ev = (evento, dati = {}) => console.log('@@AMBROGIO ' + JSON.stringify({ evento, ...dati }))
const scenario = process.env.FINTO_TELEFONO ?? 'ok'
console.log('righe di Linphone che non interessano')
if (scenario === 'rotto') {
  ev('errore', { messaggio: 'Linphone ha rifiutato nome o password di Ambrogio.' })
  process.exit(1)
}
ev('pronto', { versione: 'finta' })
const frase = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'finto-tel-')), 'frase.wav')
fs.writeFileSync(frase, Buffer.from('RIFF finto'))
let parlati = 0
readline.createInterface({ input: process.stdin }).on('line', (riga) => {
  const c = JSON.parse(riga)
  if (c.cmd === 'chiama') {
    ev('squilla')
    if (scenario === 'occupato') return setTimeout(() => ev('fine', { motivo: 'Declined' }), 20)
    setTimeout(() => ev('risposto'), 20)
  }
  if (c.cmd === 'parla') {
    if (!fs.existsSync(c.file)) return ev('parlato', { id: c.id, errore: 'file mancante' })
    parlati++
    setTimeout(() => {
      ev('parlato', { id: c.id })
      // parla dopo l'apertura (1) e dopo la prima risposta (3: la 2 è la parolina d'attesa)
      if (parlati === 1 || parlati === 3) setTimeout(() => ev('frase', { file: frase }), 20)
    }, 20)
  }
  if (c.cmd === 'riattacca') setTimeout(() => ev('fine', { motivo: 'riattaccato' }), 20)
  if (c.cmd === 'esci') process.exit(0)
})
