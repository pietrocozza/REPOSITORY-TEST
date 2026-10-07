'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  caricaAggiornamenti,
  caricaModifiche,
  type Aggiornamento,
  type ElencoAggiornamenti,
  type FileCambiato,
  type RigaCodice,
} from '@/lib/chat'
import { evidenzia } from '@/lib/evidenzia'
import { Pioggia } from '@/lib/pioggia'

// La sezione "Codice": mostra gli aggiornamenti di Ambrogio come se il codice si stesse scrivendo in quel momento,
// su fondo scuro, con i caratteri che scendono sullo sfondo nei colori dell'interfaccia.

export const CHIAVE_VISTO = 'ambrogio-codice-visto'

/** l'aggiornamento più recente (prima quelli in arrivo da GitHub) */
export const piuRecente = (e: ElencoAggiornamenti | null) => (e?.disponibile ? (e.inArrivo[0] ?? e.installati[0] ?? null) : null)

// caratteri al secondo
const VELOCITA = [
  { nome: '1×', cps: 70 },
  { nome: '3×', cps: 210 },
  { nome: '10×', cps: 700 },
]
// "costo" in caratteri di ogni elemento: le righe aggiunte si scrivono lettera per lettera, il resto compare
const COSTO_FILE = 45
const costoRiga = (r: RigaCodice) => (r.tipo === 'aggiunta' ? r.testo.length + 2 : r.tipo === 'tolta' ? 6 : 1)

// Cosa contiene ogni parte del progetto, detto semplice
const ZONE: [RegExp, string][] = [
  [/^backend\/test\//, 'test automatici'],
  [/^backend\/src\/http\//, 'server locale (collega interfaccia e cervello)'],
  [/^backend\/src\/agent\//, 'cervello: come Ambrogio parla con Claude'],
  [/^backend\/src\/database\//, 'memoria (database)'],
  [/^backend\/src\/permessi\//, 'permessi e sicurezza'],
  [/^backend\/src\/strumenti\//, 'strumenti di Ambrogio'],
  [/^backend\/src\/mcp\//, 'collegamento strumenti ↔ Claude'],
  [/^backend\/src\/codice\//, 'lettura degli aggiornamenti'],
  [/^backend\//, 'motore (backend)'],
  [/^frontend\/app\/globals\.css$/, 'colori, forme e disposizione'],
  [/^frontend\/components\//, 'pezzi dell’interfaccia'],
  [/^frontend\/lib\/nucleo-neurale/, 'rete neurale 3D'],
  [/^frontend\/lib\/voce/, 'voce e microfono'],
  [/^frontend\//, 'interfaccia'],
  [/^scripts\//, 'avvio e installazione'],
  [/^docs\/|README/, 'istruzioni'],
  [/^(package|\.env|\.gitignore)/, 'impostazioni del progetto'],
]
const zona = (percorso: string) => ZONE.find(([r]) => r.test(percorso))?.[1] ?? 'progetto'

const STATO_FILE: Record<FileCambiato['stato'], string> = {
  nuovo: 'nuovo',
  modificato: 'modificato',
  eliminato: 'eliminato',
  rinominato: 'rinominato',
}

const quando = (data: string) =>
  new Date(data).toLocaleString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

/** Una riga del codice: si ridisegna solo quando cambiano i caratteri visibili */
const Riga = memo(function Riga({ riga, percorso, mostrati, cursore }: { riga: RigaCodice; percorso: string; mostrati: number; cursore: boolean }) {
  const pezzi = useMemo(() => (riga.tipo === 'salto' ? [] : evidenzia(riga.testo, percorso)), [riga, percorso])
  if (riga.tipo === 'salto') {
    return (
      <div className="j-cod-riga salto">
        <span className="j-cod-num">⋯</span>
        <code>{riga.testo ? `… ${riga.testo}` : '…'}</code>
      </div>
    )
  }
  let resto = mostrati
  const visibili = []
  for (const [i, p] of pezzi.entries()) {
    if (resto <= 0) break
    visibili.push(
      <span key={i} className={p.c ? `t-${p.c}` : undefined}>
        {p.t.slice(0, resto)}
      </span>,
    )
    resto -= p.t.length
  }
  return (
    <div className={`j-cod-riga ${riga.tipo}${cursore ? ' attiva' : ''}`}>
      <span className="j-cod-num">{riga.tipo === 'tolta' ? '−' : riga.numero}</span>
      <code>
        {visibili}
        {cursore && <i className="j-cod-cursore" aria-hidden="true" />}
      </code>
    </div>
  )
})

export default function Codice({ onChiudi }: { onChiudi: () => void }) {
  const tela = useRef<HTMLCanvasElement>(null)
  const editor = useRef<HTMLDivElement>(null)
  const [elenco, setElenco] = useState<ElencoAggiornamenti | null>(null)
  const [scelto, setScelto] = useState<Aggiornamento | null>(null)
  const [file, setFile] = useState<FileCambiato[] | null>(null)
  const [progresso, setProgresso] = useState(0)
  const [inPausa, setInPausa] = useState(false)
  const [velocita, setVelocita] = useState(1)
  const [errore, setErrore] = useState(false)

  // sfondo animato
  useEffect(() => {
    if (!tela.current) return
    const p = new Pioggia(tela.current)
    return () => p.distruggi()
  }, [])

  // elenco degli aggiornamenti; mentre la sezione è aperta si ricontrolla GitHub ogni minuto
  useEffect(() => {
    let attivo = true
    const carica = async () => {
      const e = await caricaAggiornamenti(true)
      if (!attivo) return
      if (!e) return setErrore(true)
      setErrore(false)
      setElenco(e)
      const recente = piuRecente(e)
      if (recente) {
        try {
          localStorage.setItem(CHIAVE_VISTO, recente.sha)
        } catch {}
      }
      setScelto((s) => s ?? recente)
    }
    carica()
    const t = setInterval(carica, 60_000)
    return () => {
      attivo = false
      clearInterval(t)
    }
  }, [])

  // un altro aggiornamento: si riparte da capo
  const scegli = (a: Aggiornamento) => {
    if (a.sha === scelto?.sha) return
    setScelto(a)
    setFile(null)
    setProgresso(0)
    setInPausa(false)
  }

  // modifiche dell'aggiornamento scelto
  useEffect(() => {
    if (!scelto) return
    let attivo = true
    caricaModifiche(scelto.sha).then((d) => {
      if (attivo) setFile(d?.file ?? [])
    })
    return () => {
      attivo = false
    }
  }, [scelto])

  // dove inizia ogni file e quanto "costa" scriverlo tutto
  const inizi = useMemo(() => {
    const out: number[] = []
    let somma = 0
    for (const f of file ?? []) {
      out.push(somma)
      somma += COSTO_FILE + f.righe.reduce((a, r) => a + costoRiga(r), 0)
    }
    out.push(somma)
    return out
  }, [file])
  const totale = inizi.at(-1) ?? 0
  const finito = file !== null && progresso >= totale

  // il motore della scrittura
  useEffect(() => {
    if (!file || inPausa || finito) return
    let ultimo = performance.now()
    let raf = 0
    const passo = (ora: number) => {
      const dt = Math.min(0.1, Math.max(0, (ora - ultimo) / 1000))
      ultimo = ora
      setProgresso((p) => Math.min(totale, p + dt * VELOCITA[velocita].cps))
      raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [file, inPausa, finito, totale, velocita])

  // quale file e quale riga si stanno scrivendo
  const indiceFile = file ? Math.max(0, Math.min(file.length - 1, inizi.findLastIndex((i) => i <= progresso))) : 0
  const corrente = file?.[indiceFile]
  const mostrati: number[] = []
  let rigaAttiva = -1
  if (corrente) {
    let resto = progresso - inizi[indiceFile] - COSTO_FILE
    for (const [i, r] of corrente.righe.entries()) {
      const c = costoRiga(r)
      if (resto >= c) mostrati.push(r.testo.length)
      else if (resto > 0) {
        mostrati.push(r.tipo === 'aggiunta' ? Math.floor(resto) : r.testo.length)
        rigaAttiva = i
      } else mostrati.push(-1)
      resto -= c
    }
  }

  // il codice scorre da solo per tenere in vista la riga che si sta scrivendo
  useEffect(() => {
    const el = editor.current
    if (!el || inPausa) return
    const attiva = el.querySelector<HTMLElement>('.j-cod-riga.attiva')
    if (!attiva) return
    const obiettivo = attiva.offsetTop - el.clientHeight * 0.45
    if (Math.abs(el.scrollTop - obiettivo) > 4) el.scrollTop = obiettivo
  }, [rigaAttiva, indiceFile, inPausa])
  useEffect(() => {
    if (editor.current) editor.current.scrollTop = 0
  }, [indiceFile, scelto])

  const vaiAlFile = (i: number) => {
    setProgresso(inizi[i])
    setInPausa(false)
  }

  // Esc chiude, la barra spaziatrice mette in pausa (senza attivare il microfono di Ambrogio)
  const tasto = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        onChiudi()
      } else if (e.code === 'Space' && !(e.target as HTMLElement).closest('input, textarea, button, select')) {
        e.preventDefault()
        e.stopImmediatePropagation()
        setInPausa((p) => !p)
      }
    },
    [onChiudi],
  )
  useEffect(() => {
    window.addEventListener('keydown', tasto, true)
    return () => window.removeEventListener('keydown', tasto, true)
  }, [tasto])

  const tutti = elenco?.disponibile ? [...elenco.inArrivo, ...elenco.installati] : []
  const percentuale = totale ? Math.round((Math.min(progresso, totale) / totale) * 100) : 0

  return (
    <div className="j-codice" role="dialog" aria-modal="true" aria-label="Codice di Ambrogio">
      <canvas ref={tela} className="j-codice-pioggia" aria-hidden="true" />

      <header className="j-codice-testa">
        <span className="j-emblem" aria-hidden="true">
          <b />
        </span>
        <div>
          <span className="j-overline">AMBROGIO / CODICE</span>
          <strong>Come sto cambiando</strong>
        </div>
        {elenco?.disponibile && elenco.github === false && <small className="j-codice-avviso">GitHub non raggiungibile: vedi solo gli aggiornamenti già sul PC</small>}
        <button type="button" className="j-codice-chiudi" onClick={onChiudi} aria-label="Chiudi" title="Chiudi (Esc)">
          ✕
        </button>
      </header>

      <div className="j-codice-corpo">
        <nav className="j-codice-elenco" aria-label="Aggiornamenti">
          {errore && <p className="j-codice-vuoto">Il motore di Ambrogio non risponde: è acceso?</p>}
          {elenco && !elenco.disponibile && <p className="j-codice-vuoto">{elenco.motivo}</p>}
          {elenco?.disponibile && elenco.inArrivo.length > 0 && <h3>In arrivo da GitHub</h3>}
          {tutti.map((a, i) => (
            <div key={a.sha}>
              {elenco?.disponibile && i === elenco.inArrivo.length && <h3>Installati</h3>}
              <button type="button" aria-current={scelto?.sha === a.sha || undefined} data-arrivo={a.inArrivo || undefined} onClick={() => scegli(a)}>
                <b>{a.titolo.replace(/^(?:Ambrogio|Jarvis):\s*/, '')}</b>
                <small>{quando(a.data)}</small>
              </button>
            </div>
          ))}
        </nav>

        <main className="j-codice-schermo">
          {scelto && (
            <section className="j-codice-spiega">
              <span className="j-overline">{scelto.inArrivo ? 'NUOVO · NON ANCORA INSTALLATO' : `AGGIORNAMENTO ${scelto.breve}`}</span>
              <h2>{scelto.titolo.replace(/^(?:Ambrogio|Jarvis):\s*/, '')}</h2>
              {scelto.spiegazione && <p>{scelto.spiegazione}</p>}
              {scelto.inArrivo && (
                <p className="j-codice-installa">
                  Per installarlo: chiudi Ambrogio, poi in <b>PowerShell</b> nella cartella <code>ambrogio</code> scrivi <code>git pull</code>, premi Invio e
                  riapri Ambrogio dall’icona.
                </p>
              )}
            </section>
          )}

          {file && file.length > 0 && (
            <div className="j-codice-schede" role="tablist" aria-label="File cambiati">
              {file.map((f, i) => (
                <button
                  key={f.percorso}
                  type="button"
                  role="tab"
                  aria-selected={i === indiceFile}
                  data-fatto={progresso >= inizi[i + 1] || undefined}
                  onClick={() => vaiAlFile(i)}
                  title={f.percorso}
                >
                  <span>{f.percorso.split('/').pop()}</span>
                  <em>
                    {f.aggiunte > 0 && <i className="piu">+{f.aggiunte}</i>}
                    {f.tolte > 0 && <i className="meno">−{f.tolte}</i>}
                  </em>
                </button>
              ))}
            </div>
          )}

          <div className="j-codice-editor" ref={editor}>
            {!scelto && !errore && <p className="j-codice-vuoto">Carico gli aggiornamenti…</p>}
            {scelto && file === null && <p className="j-codice-vuoto">Apro le modifiche…</p>}
            {file?.length === 0 && <p className="j-codice-vuoto">Questo aggiornamento non cambia file di Ambrogio.</p>}
            {corrente && (
              <>
                <div className="j-cod-file">
                  <b>{corrente.percorso}</b>
                  <span>
                    {STATO_FILE[corrente.stato]} · {zona(corrente.percorso)}
                  </span>
                </div>
                {corrente.righe.map((r, i) =>
                  mostrati[i] < 0 ? null : <Riga key={i} riga={r} percorso={corrente.percorso} mostrati={mostrati[i]} cursore={i === rigaAttiva} />,
                )}
                {corrente.nota && <p className="j-cod-nota">{corrente.nota}</p>}
              </>
            )}
          </div>

          <footer className="j-codice-comandi">
            <button type="button" onClick={() => (finito ? setProgresso(0) : setInPausa(!inPausa))} disabled={!file?.length}>
              {finito ? 'Ricomincia' : inPausa ? 'Riprendi' : 'Pausa'}
            </button>
            <div className="j-segmenti" role="group" aria-label="Velocità di scrittura">
              {VELOCITA.map((v, i) => (
                <button key={v.nome} type="button" aria-pressed={velocita === i} onClick={() => setVelocita(i)}>
                  {v.nome}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setProgresso(totale)} disabled={!file?.length || finito}>
              Mostra tutto
            </button>
            <div className="j-codice-barra" aria-label={`Scritto il ${percentuale}%`}>
              <i style={{ width: `${percentuale}%` }} />
            </div>
            <span className="j-codice-conta">
              {file?.length ? `file ${indiceFile + 1} di ${file.length}` : ''}
            </span>
          </footer>
        </main>
      </div>
    </div>
  )
}
