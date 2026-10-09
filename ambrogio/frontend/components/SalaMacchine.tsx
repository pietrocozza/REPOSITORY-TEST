'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { caricaStatistiche, type Statistiche } from '@/lib/chat'
import type { Modo } from '@/lib/nucleo-neurale'
import { COLORI_TIPO, TAVOLOZZA, disegnaAnello, disegnaBarre, disegnaGradini, disegnaGriglia, disegnaIstogramma, disegnaRosa } from '@/lib/sala'
import { MODULI, Osservatorio, type DatiOsservatorio, type IngressiOsservatorio } from '@/lib/osservatorio'

// La "Sala macchine": al centro l'Osservatorio 3D (il nucleo di Ambrogio con il suo stato vero, il quadrante
// delle 24 ore con il lavoro fatto, i moduli in orbita e gli eventi del registro come comete),
// intorno i numeri veri presi dal registro. La modalità demo è dichiarata e simula solo gli stati del nucleo.

export type StatoSala = { modo: Modo; strumento: string | null; errore: string | null; livelloIn: number; livelloOut: number; bande: number[] }

const GB = (b: number) => (b / 1024 ** 3).toFixed(1)
const MB = (b: number) => Math.round(b / 1024 ** 2)
const durata = (s: number) => (s < 3600 ? `${Math.floor(s / 60)} min` : `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min`)
const sec = (ms: number) => (ms / 1000).toFixed(1)
const mediana = (v: number[]) => {
  if (!v.length) return 0
  const o = [...v].sort((a, b) => a - b)
  return o[Math.floor(o.length / 2)]
}
const ora = (d: string) => new Date(d).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

const STATI: Record<Modo, string> = {
  idle: 'In attesa',
  listening: 'In ascolto',
  thinking: 'In elaborazione',
  working: 'Uso uno strumento',
  waiting: 'Attendo il tuo permesso',
  speaking: 'Sto parlando',
  success: 'Fatto',
  error: 'Serve attenzione',
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
// eventi del registro legati a ciascun modulo
const TIPI_MODULO: Record<string, string[]> = {
  Linguaggio: ['messaggio'],
  Memoria: ['memoria'],
  Ricerca: ['azione'],
  Email: ['azione'],
  Telefono: ['telefono'],
  Voce: ['voce'],
  Pratiche: ['azione'],
  Affitti: [],
}

/** quale modulo sta lavorando, dalla descrizione dello strumento in uso */
function moduloDa(strumento: string | null, modo: Modo) {
  const t = (strumento ?? '').toLowerCase()
  if (t) {
    if (/mail|posta|bozza/.test(t)) return MODULI.indexOf('Email')
    if (/cerc|web|ricerca|pagina|search|fetch/.test(t)) return MODULI.indexOf('Ricerca')
    if (/memoria|ricord/.test(t)) return MODULI.indexOf('Memoria')
    if (/pratic/.test(t)) return MODULI.indexOf('Pratiche')
    if (/telefon|chiam/.test(t)) return MODULI.indexOf('Telefono')
  }
  if (modo === 'thinking') return MODULI.indexOf('Linguaggio')
  if (modo === 'speaking' || modo === 'listening') return MODULI.indexOf('Voce')
  return -1
}

/** cosa serve all'Osservatorio, dai numeri veri del registro */
function datiOsservatorio(s: Statistiche): DatiOsservatorio {
  const strumenti = Object.entries(s.strumenti)
  const conta = (r: RegExp) => strumenti.filter(([n]) => r.test(n)).reduce((a, [, v]) => a + v, 0)
  const uso: Record<(typeof MODULI)[number], number> = {
    Linguaggio: s.tipi.messaggio ?? 0,
    Memoria: (s.tipi.memoria ?? 0) + conta(/ricorda|memoria|dimentica/i),
    Ricerca: conta(/websearch|webfetch|cerca|ricerca|web/i),
    Email: conta(/email|mail|bozza/i),
    Telefono: s.tipi.telefono ?? 0,
    Voce: s.tipi.voce ?? 0,
    Pratiche: conta(/pratic/i),
    Affitti: conta(/prenotazion|info_casa|rendiment|spes|airbnb/i),
  }
  return {
    attivita: s.attivita,
    uso: MODULI.map((m) => uso[m]),
    disponibili: MODULI.map((m) => (m === 'Email' ? s.email : m === 'Telefono' ? s.telefono.configurato : m === 'Voce' ? s.voce.disponibile : true)),
    eventi: s.eventi,
  }
}

// Demo: una sequenza di stati simulati, per vedere il nucleo reagire
const DEMO: { modo: Modo; durata: number; strumento?: string }[] = [
  { modo: 'idle', durata: 4 },
  { modo: 'listening', durata: 4 },
  { modo: 'thinking', durata: 3.5 },
  { modo: 'working', durata: 3.5, strumento: 'Ricerca sul web' },
  { modo: 'speaking', durata: 5 },
  { modo: 'success', durata: 2 },
  { modo: 'working', durata: 3, strumento: 'Leggo le email' },
  { modo: 'error', durata: 2.5 },
]
function statoDemo(t: number): StatoSala {
  const giro = DEMO.reduce((a, d) => a + d.durata, 0)
  let x = t % giro
  const d = DEMO.find((d) => (x -= d.durata) < 0) ?? DEMO[0]
  const sillabe = Math.max(0, Math.sin(t * 9) * Math.sin(t * 2.3)) * (0.6 + 0.4 * Math.sin(t * 0.7))
  return {
    modo: d.modo,
    strumento: d.strumento ?? null,
    errore: d.modo === 'error' ? 'Esempio: Gmail non risponde' : null,
    livelloIn: d.modo === 'listening' ? 0.3 + 0.3 * Math.abs(Math.sin(t * 5)) : 0,
    livelloOut: d.modo === 'speaking' ? sillabe : 0,
    bande: Array.from({ length: 8 }, (_, i) => (d.modo === 'speaking' ? sillabe * (0.4 + 0.6 * Math.abs(Math.sin(t * (3 + i) + i))) : 0)),
  }
}

/** un grafico sempre vivo: si ridisegna di continuo (circa 30 volte al secondo) con i numeri più recenti */
function Grafico({ disegna, classe }: { disegna: (t: HTMLCanvasElement, tempo: number) => void; classe?: string }) {
  const tela = useRef<HTMLCanvasElement>(null)
  const funzione = useRef(disegna)
  useEffect(() => {
    funzione.current = disegna
  })
  useEffect(() => {
    let raf = 0
    let ultimo = 0
    const giro = (t: number) => {
      raf = requestAnimationFrame(giro)
      if (document.hidden || t - ultimo < 33 || !tela.current) return
      ultimo = t
      funzione.current(tela.current, t)
    }
    raf = requestAnimationFrame(giro)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={tela} className={classe ?? 'j-sm-grafico'} aria-hidden="true" />
}

function Barra({ nome, valore, max = 100, testo, colore = '#eaf5ff' }: { nome: string; valore: number; max?: number; testo: string; colore?: string }) {
  const p = Math.max(0, Math.min(1, max ? valore / max : 0))
  return (
    <div className="j-sm-barra" style={{ '--c': colore } as CSSProperties}>
      <span>{nome}</span>
      <i>
        <b style={{ width: `${p * 100}%` }} />
      </i>
      <em>{testo}</em>
    </div>
  )
}

const CHIAVE = 'ambrogio-sala'

export default function SalaMacchine({ onChiudi, leggiStato }: { onChiudi: () => void; leggiStato: () => StatoSala }) {
  const [s, setS] = useState<Statistiche | null>(null)
  const [errore, setErrore] = useState(false)
  const [demo, setDemo] = useState(false)
  const [ridotto, setRidotto] = useState(false)
  const [espanso, setEspanso] = useState(false)
  const [selezione, setSelezione] = useState(-1)
  const [senza3d, setSenza3d] = useState(false)
  const [vivo, setVivo] = useState<StatoSala>({ modo: 'idle', strumento: null, errore: null, livelloIn: 0, livelloOut: 0, bande: [] })
  const [qualita, setQualita] = useState('')
  const tela = useRef<HTMLCanvasElement>(null)
  const etichette = useRef<(HTMLDivElement | null)[]>([])
  const richiamo = useRef<HTMLDivElement>(null)
  const metri = useRef<{ in: HTMLElement | null; out: HTMLElement | null; bande: (HTMLElement | null)[] }>({ in: null, out: null, bande: [] })
  const dati = useRef<Statistiche | null>(null)
  const ingressi = useRef({ demo, selezione, leggiStato })

  useEffect(() => {
    ingressi.current = { demo, selezione, leggiStato }
  }, [demo, selezione, leggiStato])

  // preferenze ricordate (demo spenta di serie; movimento ridotto se il sistema lo chiede)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const p = JSON.parse(localStorage.getItem(CHIAVE) ?? '{}') as { ridotto?: boolean }
        setRidotto(p.ridotto ?? matchMedia('(prefers-reduced-motion: reduce)').matches)
      } catch {
        setRidotto(matchMedia('(prefers-reduced-motion: reduce)').matches)
      }
    }, 0)
    return () => clearTimeout(t)
  }, [])
  const cambiaRidotto = () => {
    setRidotto((r) => {
      try {
        localStorage.setItem(CHIAVE, JSON.stringify({ ridotto: !r }))
      } catch {}
      return !r
    })
  }

  // i numeri veri si aggiornano ogni 4 secondi
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

  // l'Osservatorio (canvas); se proprio non si può, l'anello semplificato
  useEffect(() => {
    if (!tela.current) return
    const inizio = performance.now()
    let datiScena: DatiOsservatorio | null = null
    let datiDa: Statistiche | null = null
    const leggi = (): IngressiOsservatorio => {
      const { demo, selezione, leggiStato } = ingressi.current
      const st = demo ? statoDemo((performance.now() - inizio) / 1000) : leggiStato()
      // i dati della scena si ricalcolano solo quando arrivano numeri nuovi
      if (dati.current && dati.current !== datiDa) {
        datiDa = dati.current
        datiScena = datiOsservatorio(dati.current)
      }
      return { modo: st.modo, livelloIn: st.livelloIn, livelloOut: st.livelloOut, bande: st.bande, settore: moduloDa(st.strumento, st.modo), selezione, dati: datiScena }
    }
    let v: Osservatorio | null = null
    let raf2d = 0
    try {
      v = new Osservatorio(tela.current, leggi, { ridotto })
    } catch (err) {
      console.error('[sala] osservatorio non disponibile:', err)
      const t = setTimeout(() => setSenza3d(true), 0)
      const giro = (t2: number) => {
        try {
          if (tela.current && dati.current) disegnaAnello(tela.current, dati.current.eventi, ridotto ? t2 * 0.3 : t2, 0)
        } catch {
          return // riquadro inutilizzabile: resta l'avviso
        }
        raf2d = requestAnimationFrame(giro)
      }
      raf2d = requestAnimationFrame(giro)
      return () => {
        clearTimeout(t)
        cancelAnimationFrame(raf2d)
      }
    }
    // etichette dei nodi, richiamo del modulo attivo e misuratori audio: aggiornati a ogni fotogramma senza ridisegnare la pagina
    let raf = 0
    let ultimoTesto = 0
    const giro = (t: number) => {
      raf = requestAnimationFrame(giro)
      if (document.hidden || !v) return
      const ing = leggi()
      const nodi = v.posizioniNodi()
      nodi.forEach((n) => {
        const el = etichette.current[n.indice]
        if (!el) return
        el.style.transform = `translate(${n.x.toFixed(1)}px, ${n.y.toFixed(1)}px)`
        el.dataset.acceso = n.indice === ing.settore || n.indice === ing.selezione || n.indice === v.hover ? '1' : ''
        el.dataset.dietro = n.davanti ? '' : '1'
      })
      const r = richiamo.current
      if (r) {
        const n = ing.settore >= 0 ? nodi[ing.settore] : null
        r.style.opacity = n ? '1' : '0'
        if (n) r.style.transform = `translate(${n.x.toFixed(1)}px, ${n.y.toFixed(1)}px)`
      }
      const m = metri.current
      if (m.in) m.in.style.width = `${Math.round((ing.modo === 'listening' ? ing.livelloIn : 0) * 100)}%`
      if (m.out) m.out.style.width = `${Math.round(Math.max(0, ing.livelloOut) * 100)}%`
      m.bande.forEach((b, i) => {
        if (b) b.style.height = `${Math.round(4 + (ing.bande[i] ?? 0) * 26)}px`
      })
      // i testi si aggiornano piano, per poterli leggere
      if (t - ultimoTesto > 400) {
        ultimoTesto = t
        const st = ingressi.current.demo ? statoDemo((performance.now() - inizio) / 1000) : ingressi.current.leggiStato()
        setVivo(st)
        setQualita(`${v.fps} fps · qualità ${v.qualita}`)
      }
    }
    raf = requestAnimationFrame(giro)
    const click = () => {
      if (v && v.hover >= 0) setSelezione((sel) => (sel === v!.hover ? -1 : v!.hover))
    }
    tela.current.addEventListener('click', click)
    const elTela = tela.current
    return () => {
      cancelAnimationFrame(raf)
      elTela.removeEventListener('click', click)
      v?.distruggi()
    }
  }, [ridotto])

  // Esc chiude (o riduce l'osservatorio espanso)
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      if (espanso) setEspanso(false)
      else onChiudi()
    }
    window.addEventListener('keydown', tasto, true)
    return () => window.removeEventListener('keydown', tasto, true)
  }, [onChiudi, espanso])

  const disponibile = (nome: string) =>
    !s ? false : nome === 'Email' ? s.email : nome === 'Telefono' ? s.telefono.configurato : nome === 'Voce' ? s.voce.disponibile : nome !== 'Affitti'
  const settoreVivo = moduloDa(vivo.strumento, vivo.modo)
  const strumenti = Object.entries(s?.strumenti ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const totRisposte = (s?.risposte.pronte ?? 0) + (s?.risposte.conClaude ?? 0)
  const totPermessi = (s?.totali.concesse ?? 0) + (s?.totali.negate ?? 0)
  const recenti = (s?.eventi ?? []).slice(-14).reverse()
  const modSel = selezione >= 0 ? MODULI[selezione] : null

  return (
    <div className="j-sala" data-espanso={espanso || undefined} role="dialog" aria-modal="true" aria-label="Sala macchine di Ambrogio">
      <header className="j-sm-testa">
        <div className="j-sm-nome">
          <b>AMBROGIO / SALA MACCHINE</b>
          <span className="j-sm-stato" data-modo={vivo.modo}>
            <i />
            {STATI[vivo.modo]}
            {vivo.strumento && vivo.modo === 'working' ? ` · ${vivo.strumento}` : ''}
          </span>
        </div>
        <nav className="j-sm-moduli" aria-label="Moduli di Ambrogio">
          {MODULI.map((nome, i) => (
            <button
              key={nome}
              type="button"
              data-disponibile={disponibile(nome) || undefined}
              data-attivo={settoreVivo === i || undefined}
              aria-pressed={selezione === i}
              onClick={() => setSelezione(selezione === i ? -1 : i)}
              title={disponibile(nome) ? `${nome}: evidenzialo nell'osservatorio` : `${nome}: non ancora collegato`}
            >
              {nome}
            </button>
          ))}
        </nav>
        {demo && <span className="j-sm-demo">DEMO · stati simulati</span>}
        <button type="button" className="j-sm-chiudi" onClick={onChiudi} aria-label="Chiudi" title="Chiudi (Esc)">
          ✕
        </button>
      </header>

      <div className="j-sm-corpo">
        <main className="j-sm-centro">
          <canvas ref={tela} className="j-sm-anello" role="img" aria-label="Osservatorio: il nucleo di Ambrogio, il quadrante delle 24 ore con il lavoro fatto e i moduli in orbita" />
          {!senza3d &&
            MODULI.map((nome, i) => (
              <div key={nome} ref={(el) => void (etichette.current[i] = el)} className="j-sm-nodo" data-spento={!disponibile(nome) || undefined}>
                <span>{nome}</span>
              </div>
            ))}
          {!senza3d && (
            <div ref={richiamo} className="j-sm-richiamo" aria-live="polite">
              <i />
              <div>
                {settoreVivo >= 0 ? MODULI[settoreVivo].toUpperCase() : ''}
                {vivo.modo === 'working' && vivo.strumento ? ` · ${vivo.strumento}` : vivo.modo === 'error' && vivo.errore ? ` · ${vivo.errore}` : ''}
              </div>
            </div>
          )}
          {senza3d && <p className="j-sm-avviso">Grafica 3D non disponibile su questo computer: vista semplificata.</p>}
          {errore && <p className="j-sm-vuoto">Il motore di Ambrogio non risponde.</p>}
          {modSel && (
            <div className="j-sm-scheda">
              <b>{modSel}</b>
              <span>{disponibile(modSel) ? (settoreVivo === selezione ? 'al lavoro adesso' : 'disponibile') : 'non ancora collegato'}</span>
              <span>
                eventi 30 giorni: {TIPI_MODULO[modSel].length ? TIPI_MODULO[modSel].reduce((a, t) => a + (s?.tipi[t] ?? 0), 0) : 'Non disponibile'}
              </span>
              <button type="button" onClick={() => setSelezione(-1)}>
                Chiudi
              </button>
            </div>
          )}
          <p className="j-sm-spiega">
            Nucleo: Ambrogio adesso · torri: lavoro di ogni mezz’ora nelle ultime 24 ore · lancetta: l’ora attuale · moduli: grandi quanto
            sono usati · comete: gli eventi del registro
          </p>
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
            <h3>ATTIVITÀ CORRENTE</h3>
            <p className="j-sm-grande" data-modo={vivo.modo}>
              {STATI[vivo.modo]}
            </p>
            <p className="j-sm-riga">{vivo.strumento ?? (vivo.modo === 'idle' ? 'Nessuna operazione in corso' : '—')}</p>
            {vivo.errore && <p className="j-sm-riga rossa">{vivo.errore}</p>}
          </section>
          <section>
            <h3>AUDIO</h3>
            <div className="j-sm-metro">
              <span>microfono</span>
              <i>
                <b ref={(el) => void (metri.current.in = el)} />
              </i>
            </div>
            <div className="j-sm-metro">
              <span>voce Ambrogio</span>
              <i>
                <b ref={(el) => void (metri.current.out = el)} />
              </i>
            </div>
            <div className="j-sm-bande" aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <b key={i} ref={(el) => void (metri.current.bande[i] = el)} />
              ))}
            </div>
            <p className="j-sm-nomi">{vivo.livelloOut < 0 ? 'voce di Edge: livello non misurabile' : 'livelli dal vivo'}</p>
          </section>
          <section>
            <h3>
              ATTIVITÀ 24 ORE <em>{s ? `${s.attivita.reduce((a, b) => a + b, 0)} eventi` : ''}</em>
            </h3>
            <Grafico disegna={(t, tempo) => disegnaGradini(t, s?.attivita ?? new Array(48).fill(0), tempo)} />
          </section>
          <section>
            <h3>
              STRUMENTI USATI <em>{strumenti.length ? `${strumenti.length} tipi` : ''}</em>
            </h3>
            {strumenti.length ? (
              <>
                <Grafico disegna={(t, tempo) => disegnaBarre(t, strumenti.map(([, n]) => n), { tempo })} />
                <p className="j-sm-nomi">{strumenti.map(([n, v]) => `${n} ${v}`).join(' · ')}</p>
              </>
            ) : (
              <p className="j-sm-riga">Non ancora disponibile</p>
            )}
          </section>
          <section>
            <h3>SEGNALI</h3>
            <Grafico
              classe="j-sm-grafico basso"
              disegna={(t, tempo) =>
                disegnaGriglia(t, s ? [...s.perOra, ...s.giorni.flatMap((g) => [g.richieste, g.azioni, g.errori ? -g.errori : 0]), s.voce.richiesteOggi, s.totali.memorie, s.totali.praticheAperte] : new Array(48).fill(0), tempo)
              }
            />
          </section>
          <section>
            <h3>
              TEMPI DI RISPOSTA <em>{s?.tempi.length ? `mediana ${sec(mediana(s.tempi))} s` : ''}</em>
            </h3>
            <Grafico disegna={(t, tempo) => disegnaIstogramma(t, s?.tempi ?? [], tempo)} />
          </section>
          <section>
            <h3>
              RISORSE <em>{qualita}</em>
            </h3>
            {s ? (
              <>
                <Barra nome="processore" valore={s.sistema.cpu} testo={`${s.sistema.cpu}%`} colore={s.sistema.cpu > 85 ? TAVOLOZZA.rosso : TAVOLOZZA.giallo} />
                <Barra nome="memoria PC" valore={s.sistema.ramUsata} max={s.sistema.ramTotale} testo={`${GB(s.sistema.ramUsata)}/${GB(s.sistema.ramTotale)} GB`} colore={TAVOLOZZA.ciano} />
                <Barra nome="motore" valore={s.sistema.memoriaAmbrogio} max={1024 ** 3} testo={`${MB(s.sistema.memoriaAmbrogio)} MB`} colore={TAVOLOZZA.verde} />
                <p className="j-sm-nomi">acceso da {durata(s.sistema.accesoDaS)} · cervello {s.cervello}</p>
              </>
            ) : (
              <p className="j-sm-riga">Non disponibile</p>
            )}
          </section>
          <section>
            <h3>SERVIZI</h3>
            {s && (
              <div className="j-sm-servizi">
                <span data-stato={s.voce.disponibile ? 'ok' : 'no'}>VOCE GEMINI</span>
                <em>
                  {s.voce.richiesteOggi} oggi · {s.voce.frasiArchivio} frasi pronte
                </em>
                <span data-stato={s.telefono.inCorso ? 'vivo' : s.telefono.stato === 'pronto' ? 'ok' : s.telefono.configurato ? 'attesa' : 'no'}>TELEFONO</span>
                <em>
                  {s.telefono.inCorso ? 'in chiamata' : s.telefono.stato}
                  {s.telefono.ultima ? ` · ultima: ${s.telefono.ultima}` : ''}
                </em>
                <span data-stato={s.email ? 'ok' : 'no'}>GMAIL</span>
                <em>{s.email ? 'collegato' : 'non collegato'}</em>
              </div>
            )}
          </section>
        </aside>
      </div>

      <div className="j-sm-fascia">
        <section>
          <h3>A CHE ORA LAVORA</h3>
          <Grafico classe="j-sm-rosa" disegna={(t, tempo) => disegnaRosa(t, s?.perOra ?? new Array(24).fill(0), tempo)} />
        </section>
        <section>
          <h3>COME RISPONDE</h3>
          <Barra nome="risposte pronte" valore={s?.risposte.pronte ?? 0} max={totRisposte} testo={`${s?.risposte.pronte ?? 0}`} colore={TAVOLOZZA.verde} />
          <Barra nome="con Claude" valore={s?.risposte.conClaude ?? 0} max={totRisposte} testo={`${s?.risposte.conClaude ?? 0}`} colore={TAVOLOZZA.blu} />
          <Barra nome="permessi dati" valore={s?.totali.concesse ?? 0} max={totPermessi} testo={`${s?.totali.concesse ?? 0}`} colore={TAVOLOZZA.giallo} />
          <Barra nome="permessi negati" valore={s?.totali.negate ?? 0} max={totPermessi} testo={`${s?.totali.negate ?? 0}`} colore={TAVOLOZZA.rosso} />
          <Barra nome="voci Gemini oggi" valore={s?.voce.richiesteOggi ?? 0} max={100} testo={`${s?.voce.richiesteOggi ?? 0}/100`} colore={TAVOLOZZA.arancio} />
        </section>
        <section>
          <h3>
            ULTIMI 7 GIORNI <em>richieste ▮ azioni —</em>
          </h3>
          <Grafico
            classe="j-sm-grafico alto"
            disegna={(t, tempo) =>
              disegnaBarre(t, s?.giorni.map((g) => g.richieste) ?? new Array(7).fill(0), {
                linea: s?.giorni.map((g) => g.azioni),
                colori: [TAVOLOZZA.blu, TAVOLOZZA.blu, TAVOLOZZA.blu, TAVOLOZZA.blu, TAVOLOZZA.blu, TAVOLOZZA.blu, TAVOLOZZA.arancio],
                tempo,
              })
            }
          />
        </section>
      </div>

      <footer className="j-sm-piede">
        <ol className="j-sm-timeline" aria-label="Eventi recenti">
          {recenti.length ? (
            recenti.map((e, i) => (
              <li key={`${e.quando}${i}`} data-tipo={e.tipo}>
                <time>{ora(e.quando)}</time>
                <i style={{ background: COLORI_TIPO[e.tipo] ?? '#8fa6b2' }} />
                <span>{e.descrizione}</span>
              </li>
            ))
          ) : (
            <li>
              <span>Nessun evento ancora</span>
            </li>
          )}
        </ol>
        <div className="j-sm-comandi">
          <button type="button" onClick={() => setEspanso(!espanso)} aria-pressed={espanso}>
            {espanso ? 'Riduci osservatorio' : 'Espandi osservatorio'}
          </button>
          <button type="button" onClick={() => setDemo(!demo)} aria-pressed={demo} title="Simula gli stati di Ambrogio per vedere le reazioni del nucleo">
            {demo ? 'Esci dalla demo' : 'Demo'}
          </button>
          <button type="button" onClick={cambiaRidotto} aria-pressed={ridotto}>
            Movimento ridotto
          </button>
        </div>
      </footer>
    </div>
  )
}
