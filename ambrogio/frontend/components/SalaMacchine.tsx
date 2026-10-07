'use client'

import { useEffect, useRef, useState } from 'react'
import { caricaStatistiche, type Statistiche } from '@/lib/chat'
import { COLORI_TIPO, disegnaAnello, disegnaBarre, disegnaGradini, disegnaIstogramma, disegnaRosa } from '@/lib/sala'

// La "Sala macchine": tutti i numeri veri di Ambrogio in una schermata da laboratorio.
// Al centro l'anello degli eventi (ogni filamento è una cosa fatta da Ambrogio), intorno i grafici.

const GB = (b: number) => (b / 1024 ** 3).toFixed(1)
const MB = (b: number) => Math.round(b / 1024 ** 2)
const durata = (s: number) => (s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`)
const sec = (ms: number) => (ms / 1000).toFixed(1)
const mediana = (v: number[]) => {
  if (!v.length) return 0
  const o = [...v].sort((a, b) => a - b)
  return o[Math.floor(o.length / 2)]
}
const NOMI_TIPO: Record<string, string> = {
  messaggio: 'messaggi',
  azione: 'azioni',
  telefono: 'telefono',
  errore: 'errori',
  sistema: 'sistema',
  voce: 'voce',
  autorizzazione: 'permessi',
  memoria: 'memoria',
}

function Grafico({ disegna, classe }: { disegna: (t: HTMLCanvasElement) => void; classe?: string }) {
  const tela = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (tela.current) disegna(tela.current)
  })
  return <canvas ref={tela} className={classe ?? 'j-sm-grafico'} aria-hidden="true" />
}

function Barra({ nome, valore, max = 100, testo }: { nome: string; valore: number; max?: number; testo: string }) {
  const p = Math.max(0, Math.min(1, max ? valore / max : 0))
  return (
    <div className="j-sm-barra">
      <span>{nome}</span>
      <i>
        <b style={{ width: `${p * 100}%` }} />
      </i>
      <em>{testo}</em>
    </div>
  )
}

export default function SalaMacchine({ onChiudi }: { onChiudi: () => void }) {
  const [s, setS] = useState<Statistiche | null>(null)
  const [errore, setErrore] = useState(false)
  const anello = useRef<HTMLCanvasElement>(null)
  const rosa = useRef<HTMLCanvasElement>(null)
  const dati = useRef<Statistiche | null>(null)
  const [mirino, setMirino] = useState<{ x: number; y: number } | null>(null)

  // i numeri si aggiornano ogni 4 secondi
  useEffect(() => {
    let attivo = true
    const carica = async () => {
      const d = await caricaStatistiche()
      if (!attivo) return
      setErrore(!d)
      if (d) {
        dati.current = d
        setS(d)
      }
    }
    carica()
    const t = setInterval(carica, 4000)
    return () => {
      attivo = false
      clearInterval(t)
    }
  }, [])

  // animazione dell'anello e della rosa
  useEffect(() => {
    let raf = 0
    let ultimoMirino = 0
    const ciclo = (t: number) => {
      const d = dati.current
      if (d && anello.current) {
        const energia = Math.min(1, d.sistema.cpu / 100 + (d.telefono.inCorso ? 0.5 : 0))
        const m = disegnaAnello(anello.current, d.eventi, t, energia)
        if (m && t - ultimoMirino > 500) {
          ultimoMirino = t
          setMirino(m)
        }
      }
      if (d && rosa.current) disegnaRosa(rosa.current, d.perOra, t)
      raf = requestAnimationFrame(ciclo)
    }
    raf = requestAnimationFrame(ciclo)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        onChiudi()
      }
    }
    window.addEventListener('keydown', tasto, true)
    return () => window.removeEventListener('keydown', tasto, true)
  }, [onChiudi])

  const ultimo = s?.eventi.at(-1)
  const strumenti = Object.entries(s?.strumenti ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 12)
  const zone: [string, boolean][] = s
    ? [
        ['linguaggio', true],
        ['memoria', true],
        ['voce', s.voce.disponibile],
        ['ricerca web', true],
        ['pratiche', true],
        ['email', s.email],
        ['telefono', s.telefono.configurato],
        ['calendario', false],
        ['telegram', false],
        ['affitti', false],
        ['documenti', false],
      ]
    : []
  const totRisposte = (s?.risposte.pronte ?? 0) + (s?.risposte.conClaude ?? 0)
  const totPermessi = (s?.totali.concesse ?? 0) + (s?.totali.negate ?? 0)

  return (
    <div className="j-sala" role="dialog" aria-modal="true" aria-label="Sala macchine di Ambrogio">
      <header className="j-sm-testa">
        <div>
          <b>AMBROGIO / SALA MACCHINE</b>
          <span>
            CERVELLO {s?.cervello?.toUpperCase() ?? '—'} · PERSONALITÀ {s?.personalita?.toUpperCase() ?? '—'} · ACCESO DA {s ? durata(s.sistema.accesoDaS) : '—'}
          </span>
        </div>
        <div className="j-sm-zone">
          {zone.map(([nome, attiva]) => (
            <span key={nome} data-attiva={attiva || undefined}>
              {nome}
            </span>
          ))}
        </div>
        <span className="j-sm-cifre">
          MESSAGGI {s?.totali.messaggi ?? '—'} | MEMORIE {s?.totali.memorie ?? '—'} | PRATICHE {s?.totali.praticheAperte ?? '—'} | EVENTI 30G{' '}
          {s ? Object.values(s.tipi).reduce((a, b) => a + b, 0) : '—'}
        </span>
        <button type="button" className="j-sm-chiudi" onClick={onChiudi} aria-label="Chiudi" title="Chiudi (Esc)">
          ✕
        </button>
      </header>

      <div className="j-sm-corpo">
        <main className="j-sm-centro">
          <canvas ref={anello} className="j-sm-anello" role="img" aria-label="Anello degli eventi di Ambrogio" />
          {errore && <p className="j-sm-vuoto">Il motore di Ambrogio non risponde.</p>}
          {mirino && ultimo && (
            <div className="j-sm-mirino" style={{ left: mirino.x, top: mirino.y }}>
              <i />
              <div>
                ULTIMO EVENTO · {NOMI_TIPO[ultimo.tipo] ?? ultimo.tipo} · {new Date(ultimo.quando).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}
          <div className="j-sm-legenda">
            {Object.entries(COLORI_TIPO)
              .filter(([t]) => NOMI_TIPO[t])
              .map(([t, c]) => (
                <span key={t}>
                  <i style={{ background: c }} />
                  {NOMI_TIPO[t]} {s?.tipi[t] ?? 0}
                </span>
              ))}
          </div>
        </main>

        <aside className="j-sm-lato">
          <section>
            <h3>
              ATTIVITÀ ULTIME 24 ORE <em>{s ? s.attivita.reduce((a, b) => a + b, 0) : 0} eventi</em>
            </h3>
            {s && <Grafico disegna={(t) => disegnaGradini(t, s.attivita)} />}
          </section>
          <section>
            <h3>
              TEMPI DI RISPOSTA <em>mediana {s ? sec(mediana(s.tempi)) : '—'} s</em>
            </h3>
            {s && <Grafico disegna={(t) => disegnaIstogramma(t, s.tempi)} />}
          </section>
          <section>
            <h3>
              STRUMENTI USATI <em>{strumenti.length} tipi</em>
            </h3>
            {s && <Grafico disegna={(t) => disegnaBarre(t, strumenti.length ? strumenti.map(([, n]) => n) : [0])} />}
            <p className="j-sm-nomi">{strumenti.map(([n, v]) => `${n} ${v}`).join(' · ') || 'nessuno ancora'}</p>
          </section>
          <section>
            <h3>COMPUTER</h3>
            {s && (
              <>
                <Barra nome="processore" valore={s.sistema.cpu} testo={`${s.sistema.cpu}%`} />
                <Barra nome="memoria PC" valore={s.sistema.ramUsata} max={s.sistema.ramTotale} testo={`${GB(s.sistema.ramUsata)}/${GB(s.sistema.ramTotale)} GB`} />
                <Barra nome="motore" valore={s.sistema.memoriaAmbrogio} max={1024 ** 3} testo={`${MB(s.sistema.memoriaAmbrogio)} MB`} />
              </>
            )}
          </section>
          <section>
            <h3>SERVIZI</h3>
            {s && (
              <div className="j-sm-servizi">
                <span data-stato={s.voce.disponibile ? 'ok' : 'no'}>VOCE GEMINI</span>
                <em>
                  {s.voce.richiesteOggi} oggi · {s.voce.frasiArchivio} frasi pronte{s.voce.pagamento ? ' · a consumo' : ''}
                </em>
                <span data-stato={s.telefono.inCorso ? 'vivo' : s.telefono.stato === 'pronto' ? 'ok' : s.telefono.configurato ? 'attesa' : 'no'}>TELEFONO</span>
                <em>{s.telefono.inCorso ? 'in chiamata' : s.telefono.stato}{s.telefono.ultima ? ` · ultima: ${s.telefono.ultima}` : ''}</em>
                <span data-stato={s.email ? 'ok' : 'no'}>GMAIL</span>
                <em>{s.email ? 'collegato' : 'non collegato'}</em>
              </div>
            )}
          </section>
          <section>
            <h3>SEGNALI 7 GIORNI</h3>
            {s && (
              <div className="j-sm-segnali">
                {s.giorni.flatMap((g) =>
                  [g.richieste, g.azioni, g.errori].map((v, k) => (
                    <i key={`${g.giorno}${k}`} data-k={k} style={{ opacity: v ? 0.35 + Math.min(0.65, v / 10) : 0.12 }} title={`${g.giorno}: ${v}`} />
                  )),
                )}
              </div>
            )}
          </section>
        </aside>
      </div>

      <footer className="j-sm-piede">
        <section>
          <h3>A CHE ORA LAVORA</h3>
          <canvas ref={rosa} className="j-sm-rosa" aria-hidden="true" />
        </section>
        <section>
          <h3>COME RISPONDE</h3>
          {s && (
            <>
              <Barra nome="risposte pronte" valore={s.risposte.pronte} max={totRisposte} testo={`${s.risposte.pronte}`} />
              <Barra nome="con Claude" valore={s.risposte.conClaude} max={totRisposte} testo={`${s.risposte.conClaude}`} />
              <Barra nome="permessi dati" valore={s.totali.concesse} max={totPermessi} testo={`${s.totali.concesse}`} />
              <Barra nome="permessi negati" valore={s.totali.negate} max={totPermessi} testo={`${s.totali.negate}`} />
              <Barra nome="errori 7 giorni" valore={s.giorni.reduce((a, g) => a + g.errori, 0)} max={Math.max(1, s.giorni.reduce((a, g) => a + g.richieste, 0))} testo={`${s.giorni.reduce((a, g) => a + g.errori, 0)}`} />
            </>
          )}
        </section>
        <section>
          <h3>
            ULTIMI 7 GIORNI <em>richieste ▮ · azioni —</em>
          </h3>
          {s && (
            <Grafico
              classe="j-sm-grafico alto"
              disegna={(t) => disegnaBarre(t, s.giorni.map((g) => g.richieste), { linea: s.giorni.map((g) => g.azioni), colori: ['#4aa3ff', '#4aa3ff', '#4aa3ff', '#4aa3ff', '#4aa3ff', '#4aa3ff', '#ff9a3c'] })}
            />
          )}
          <p className="j-sm-nomi">{s?.giorni.map((g) => new Date(g.giorno).toLocaleDateString('it-IT', { weekday: 'short' })).join('   ')}</p>
        </section>
      </footer>
    </div>
  )
}

