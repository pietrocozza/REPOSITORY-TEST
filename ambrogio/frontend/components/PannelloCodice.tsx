'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { caricaAggiornamenti, caricaModifiche, type Aggiornamento, type FileCambiato } from '@/lib/chat'
import { Pioggia } from '@/lib/pioggia'
import { COSTO_FILE, Riga, costoRiga } from '@/components/Codice'

// La finestra fissa sulla sinistra: il codice degli ultimi aggiornamenti di Ambrogio che si scrive da solo,
// in verde sulla pioggia di Matrix. Finito un aggiornamento passa al precedente, e poi ricomincia.

const CPS = 90 // caratteri al secondo
const QUANTI = 6 // aggiornamenti che girano nella finestra
const PAUSA_MS = 2500 // sosta a fine aggiornamento

export default function PannelloCodice({ onChiudi, onApriTutto }: { onChiudi: () => void; onApriTutto: () => void }) {
  const tela = useRef<HTMLCanvasElement>(null)
  const editor = useRef<HTMLDivElement>(null)
  const [elenco, setElenco] = useState<Aggiornamento[]>([])
  const [indice, setIndice] = useState(0)
  const [file, setFile] = useState<FileCambiato[] | null>(null)
  const [progresso, setProgresso] = useState(0)
  const [vuoto, setVuoto] = useState<string | null>(null)

  useEffect(() => {
    if (!tela.current) return
    const p = new Pioggia(tela.current)
    return () => p.distruggi()
  }, [])

  // gli ultimi aggiornamenti; si ricontrolla ogni 5 minuti
  useEffect(() => {
    let attivo = true
    const carica = async () => {
      const e = await caricaAggiornamenti()
      if (!attivo) return
      if (!e) return setVuoto('Il motore di Ambrogio non risponde.')
      if (!e.disponibile) return setVuoto(e.motivo)
      const tutti = [...e.inArrivo, ...e.installati].slice(0, QUANTI)
      setVuoto(tutti.length ? null : 'Nessun aggiornamento da mostrare.')
      setElenco((prima) => (prima.map((a) => a.sha).join() === tutti.map((a) => a.sha).join() ? prima : tutti))
    }
    carica()
    const t = setInterval(carica, 300_000)
    return () => {
      attivo = false
      clearInterval(t)
    }
  }, [])

  const scelto = elenco.length ? elenco[indice % elenco.length] : null

  useEffect(() => {
    if (!scelto) return
    let attivo = true
    caricaModifiche(scelto.sha).then((d) => {
      if (!attivo) return
      // si scrivono solo i file con righe nuove: è lì che "nasce" il codice
      setFile((d?.file ?? []).filter((f) => f.aggiunte > 0))
      setProgresso(0)
    })
    return () => {
      attivo = false
    }
  }, [scelto])

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

  // scrittura continua
  useEffect(() => {
    if (!file || finito) return
    let ultimo = performance.now()
    let raf = 0
    const passo = (ora: number) => {
      const dt = Math.min(0.1, Math.max(0, (ora - ultimo) / 1000))
      ultimo = ora
      setProgresso((p) => Math.min(totale, p + dt * CPS))
      raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [file, finito, totale])

  // finito: dopo una pausa, il prossimo aggiornamento
  useEffect(() => {
    if (!finito) return
    const t = setTimeout(() => {
      setFile(null)
      setIndice((i) => i + 1)
    }, PAUSA_MS)
    return () => clearTimeout(t)
  }, [finito])

  const indiceFile = file?.length ? Math.max(0, Math.min(file.length - 1, inizi.findLastIndex((i) => i <= progresso))) : 0
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

  useEffect(() => {
    const el = editor.current
    if (!el) return
    const attiva = el.querySelector<HTMLElement>('.j-cod-riga.attiva')
    if (!attiva) return
    const obiettivo = attiva.offsetTop - el.clientHeight * 0.6
    if (Math.abs(el.scrollTop - obiettivo) > 4) el.scrollTop = obiettivo
  }, [rigaAttiva, indiceFile])
  useEffect(() => {
    if (editor.current) editor.current.scrollTop = 0
  }, [indiceFile, scelto])

  return (
    <aside className="j-codice j-pannello-codice" aria-label="Codice di Ambrogio">
      <canvas ref={tela} className="j-codice-pioggia" aria-hidden="true" />
      <header className="j-pc-testa">
        <button type="button" className="j-pc-titolo" onClick={onApriTutto} title="Apri la sezione Codice completa">
          <span className="j-overline">AMBROGIO / CODICE</span>
          <b>{scelto ? scelto.titolo.replace(/^(?:Ambrogio|Jarvis):\s*/, '') : '…'}</b>
        </button>
        <button type="button" className="j-codice-chiudi" onClick={onChiudi} aria-label="Chiudi la finestra del codice" title="Chiudi">
          ✕
        </button>
      </header>
      <div className="j-codice-editor j-pc-editor" ref={editor}>
        {vuoto && <p className="j-codice-vuoto">{vuoto}</p>}
        {!vuoto && !corrente && <p className="j-codice-vuoto">Carico il codice…</p>}
        {corrente && (
          <>
            <div className="j-cod-file">
              <b>{corrente.percorso}</b>
            </div>
            {corrente.righe.map((r, i) =>
              mostrati[i] < 0 ? null : <Riga key={i} riga={r} percorso={corrente.percorso} mostrati={mostrati[i]} cursore={i === rigaAttiva} />,
            )}
          </>
        )}
      </div>
    </aside>
  )
}
