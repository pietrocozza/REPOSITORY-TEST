'use client'

import { useEffect, useRef, useState } from 'react'
import type { Voce } from '@/lib/stato'

// ───────── Cornice comune dei pannelli olografici ─────────
function Pannello({ titolo, codice, className = '', children }: { titolo: string; codice: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`pannello ${className}`} aria-label={titolo}>
      <header className="pannello-testa">
        <span>{titolo}</span>
        <span className="codice">{codice}</span>
      </header>
      {children}
    </section>
  )
}

const due = (n: number) => String(n).padStart(2, '0')

function durata(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${due(Math.floor(s / 3600))}:${due(Math.floor((s % 3600) / 60))}:${due(s % 60)}`
}

type Batteria = { level: number; charging: boolean; addEventListener: (t: string, f: () => void) => void; removeEventListener: (t: string, f: () => void) => void }

// ───────── Pannello di sinistra: ora e stato del sistema ─────────
export function Diagnostica({
  avvioAlle,
  latenza,
  voce,
  microfono,
  scambi,
}: {
  avvioAlle: number | null
  latenza: number | null
  voce: string
  microfono: boolean
  scambi: number
}) {
  const [adesso, setAdesso] = useState<Date | null>(null)
  const [batteria, setBatteria] = useState<{ livello: number; carica: boolean } | null>(null)
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const tick = () => setAdesso(new Date())
    const primo = setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(primo)
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    const aggiorna = () => setOnline(navigator.onLine)
    const primo = setTimeout(aggiorna, 0)
    window.addEventListener('online', aggiorna)
    window.addEventListener('offline', aggiorna)
    return () => {
      clearTimeout(primo)
      window.removeEventListener('online', aggiorna)
      window.removeEventListener('offline', aggiorna)
    }
  }, [])

  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<Batteria> }
    if (!nav.getBattery) return
    let b: Batteria | null = null
    const leggi = () => b && setBatteria({ livello: b.level, carica: b.charging })
    nav.getBattery().then((bat) => {
      b = bat
      leggi()
      bat.addEventListener('levelchange', leggi)
      bat.addEventListener('chargingchange', leggi)
    }).catch(() => {})
    return () => {
      b?.removeEventListener('levelchange', leggi)
      b?.removeEventListener('chargingchange', leggi)
    }
  }, [])

  const ora = adesso ? `${due(adesso.getHours())}:${due(adesso.getMinutes())}` : '--:--'
  const secondi = adesso ? due(adesso.getSeconds()) : '--'
  const data = adesso
    ? adesso.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <Pannello titolo="Diagnostica" codice="SYS-01" className="sinistra">
      <div className="orologio">
        <span className="ora">{ora}</span>
        <span className="secondi">{secondi}</span>
      </div>
      <p className="data">{data}</p>

      <dl className="dati">
        <div>
          <dt>Sessione</dt>
          <dd>{avvioAlle && adesso ? durata(adesso.getTime() - avvioAlle) : '00:00:00'}</dd>
        </div>
        <div>
          <dt>Rete</dt>
          <dd className={online ? '' : 'allarme'}>{online ? 'CONNESSA' : 'ASSENTE'}</dd>
        </div>
        <div>
          <dt>Energia</dt>
          <dd>
            {batteria ? `${Math.round(batteria.livello * 100)}%${batteria.carica ? ' ⚡' : ''}` : 'RETE ELETTRICA'}
          </dd>
        </div>
        <div>
          <dt>Latenza</dt>
          <dd>{latenza == null ? '—' : `${latenza} ms`}</dd>
        </div>
        <div>
          <dt>Scambi</dt>
          <dd>{scambi}</dd>
        </div>
        <div>
          <dt>Microfono</dt>
          <dd className={microfono ? '' : 'avviso'}>{microfono ? 'DISPONIBILE' : 'NON SUPPORTATO'}</dd>
        </div>
        <div>
          <dt>Voce</dt>
          <dd className="piccolo">{voce}</dd>
        </div>
      </dl>

      {batteria && (
        <div className="misuratore" aria-hidden="true">
          <span style={{ width: `${batteria.livello * 100}%` }} />
        </div>
      )}

      {/* grafica decorativa */}
      <div className="onde" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} style={{ animationDelay: `${(i * 97) % 1300}ms` }} />
        ))}
      </div>
    </Pannello>
  )
}

// ───────── Pannello di destra: il registro della conversazione ─────────
export function Registro({ voci, parziale }: { voci: Voce[]; parziale: string }) {
  const fondo = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fondo.current?.scrollIntoView({ block: 'end' })
  }, [voci, parziale])

  return (
    <Pannello titolo="Registro comunicazioni" codice="LOG-02" className="destra">
      <div className="registro" aria-live="polite">
        {voci.length === 0 && !parziale && <p className="vuoto">Nessuna comunicazione. Premi il nucleo o la barra spaziatrice per parlare.</p>}
        {voci.map((v) => (
          <article key={v.id} className={`riga ${v.ruolo}${v.errore ? ' errore' : ''}`}>
            <span className="mittente">{v.ruolo === 'user' ? '› TU' : v.errore ? '! SISTEMA' : '◆ JARVIS'}</span>
            <p>{v.testo || <span className="cursore" />}</p>
          </article>
        ))}
        {parziale && (
          <article className="riga user fantasma">
            <span className="mittente">› TU</span>
            <p>{parziale}</p>
          </article>
        )}
        <div ref={fondo} />
      </div>
    </Pannello>
  )
}
