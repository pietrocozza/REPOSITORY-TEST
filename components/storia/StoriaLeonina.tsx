'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import Icona from '@/components/ui/Icona'
import { EASE_LUSSO } from '@/lib/animazioni'

// La storia vera di Via Leonina (dalla pagina "Ristruttura gratis"), in cinque tappe.
type Tipo = 'prima' | 'chat' | 'accordo' | 'cantiere' | 'dopo'

const TAPPE: { tipo: Tipo; quando: string; titolo: string; testo: string; colore: string }[] = [
  { tipo: 'prima', quando: 'Ottobre 2023', titolo: 'La casa ferma', testo: 'Via Leonina, Rione Monti. Palazzina del XV secolo, ferma da anni dopo un inquilino moroso.', colore: 'bg-pesca' },
  { tipo: 'chat', quando: 'La visita', titolo: 'Il proprietario', testo: 'Leonardo S. sa che andrebbe sistemata. Ma solo a pensarci gli passa la voglia.', colore: 'bg-cielo' },
  { tipo: 'accordo', quando: 'L’accordo', titolo: 'Ci pensiamo noi', testo: 'Affitto a lungo termine, lavori a carico nostro, un mese senza canone per lavorare.', colore: 'bg-limone' },
  { tipo: 'cantiere', quando: 'Il cantiere', titolo: 'Un mese di lavori', testo: 'Bagno rifatto, casa tinteggiata, aria condizionata, arredo nuovo. Il carattere storico resta.', colore: 'bg-salvia' },
  { tipo: 'dopo', quando: 'Oggi', titolo: 'Una casa nuova', testo: 'Più bella, con più valore. Leonardo non ha anticipato un euro e riceve un canone costante.', colore: 'bg-pesca' },
]

const PRIMA = '/img/ristrutturazione/leonina-prima.jpg'
const DOPO = '/img/ristrutturazione/leonina-dopo.jpg'

function Etichetta({ children, ritardo, className = '' }: { children: React.ReactNode; ritardo: number; className?: string }) {
  return (
    <motion.span
      className={`absolute rounded-full px-4 py-2 text-sm font-bold shadow-lg ${className}`}
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: ritardo }}
    >
      {children}
    </motion.span>
  )
}

/** La "scena" disegnata per ogni tappa */
function Scena({ tipo }: { tipo: Tipo }) {
  if (tipo === 'prima')
    return (
      <div className="absolute inset-0">
        <motion.div className="absolute inset-0" initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 3, ease: EASE_LUSSO }}>
          <Image src={PRIMA} alt="La camera di Via Leonina prima dei lavori" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover saturate-[0.55] sepia-[0.25]" />
        </motion.div>
        <div className="absolute inset-0 bg-inchiostro/20" />
        <Etichetta ritardo={0.4} className="top-[14%] left-[8%] bg-white text-inchiostro">⚡ Impianti obsoleti</Etichetta>
        <Etichetta ritardo={0.7} className="top-[38%] right-[8%] bg-sole text-inchiostro">🛁 Bagno anni ’60</Etichetta>
        <Etichetta ritardo={1} className="bottom-[26%] left-[12%] bg-white text-inchiostro">🪑 Arredi lasciati lì</Etichetta>
        <Etichetta ritardo={1.3} className="right-[12%] bottom-[10%] bg-corallo text-white">Ferma da anni</Etichetta>
      </div>
    )

  if (tipo === 'chat')
    return (
      <div className="absolute inset-0 flex flex-col justify-center gap-5 bg-cielo p-6 md:p-12">
        <motion.div
          className="max-w-[85%] rounded-3xl rounded-bl-md bg-white p-5 shadow-lg md:p-6"
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE_LUSSO, delay: 0.2 }}
        >
          <p className="text-xs font-bold text-pietra">Leonardo S., proprietario</p>
          <p className="mt-1 font-display text-xl font-semibold tracking-tight md:text-2xl">“Lo so che andrebbe sistemato, ma solo a pensarci mi passa la voglia.”</p>
        </motion.div>
        <motion.div
          className="flex gap-1.5 self-end rounded-full bg-white/70 px-4 py-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.3, delay: 0.9, times: [0, 0.1, 0.85, 1] }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="size-2 rounded-full bg-pietra" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </motion.div>
        <motion.div
          className="max-w-[85%] self-end rounded-3xl rounded-br-md bg-corallo p-5 text-white shadow-lg md:p-6"
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE_LUSSO, delay: 2.2 }}
        >
          <p className="text-xs font-bold text-white/80">Soluzione Affitto</p>
          <p className="mt-1 font-display text-xl font-semibold tracking-tight md:text-2xl">“E se la facessi io la ristrutturazione?”</p>
        </motion.div>
      </div>
    )

  if (tipo === 'accordo')
    return (
      <div className="absolute inset-0 flex flex-col items-stretch justify-center gap-4 bg-limone p-6 md:p-12">
        {[
          { icona: 'documento', titolo: 'Affitto a lungo termine', sotto: 'Un conduttore stabile e professionale' },
          { icona: 'euro', titolo: 'Lavori a carico nostro', sotto: 'Il proprietario non anticipa nulla' },
          { icona: 'calendario', titolo: '1 mese senza canone', sotto: 'Il tempo per fare i lavori' },
        ].map((c, i) => (
          <motion.div
            key={c.titolo}
            className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-lg md:p-5"
            initial={{ opacity: 0, x: i % 2 ? 80 : -80, rotate: i % 2 ? 4 : -4 }}
            animate={{ opacity: 1, x: 0, rotate: i === 1 ? 1.5 : -1.5 }}
            transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.2 + i * 0.25 }}
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sole md:size-14">
              <Icona nome={c.icona} className="size-6 md:size-7" />
            </span>
            <div>
              <p className="font-display text-lg font-bold tracking-tight md:text-xl">{c.titolo}</p>
              <p className="text-sm text-pietra">{c.sotto}</p>
            </div>
          </motion.div>
        ))}
      </div>
    )

  if (tipo === 'cantiere')
    return (
      <div className="absolute inset-0">
        <Image src={PRIMA} alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover saturate-[0.55]" />
        {/* la casa nuova "si dipinge" sopra quella vecchia */}
        <motion.div className="absolute inset-0" initial={{ clipPath: 'inset(0% 100% 0% 0%)' }} animate={{ clipPath: 'inset(0% 0% 0% 0%)' }} transition={{ duration: 2.6, ease: 'easeInOut', delay: 0.3 }}>
          <Image src={DOPO} alt="La camera durante la trasformazione" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
        </motion.div>
        <motion.div
          className="absolute top-0 bottom-0 w-1 bg-sole shadow-[0_0_30px_8px_rgba(247,181,56,0.7)]"
          initial={{ left: '0%' }}
          animate={{ left: '100%', opacity: [1, 1, 0] }}
          transition={{ duration: 2.6, ease: 'easeInOut', delay: 0.3 }}
        />
        <div className="absolute right-4 bottom-4 left-4 rounded-3xl bg-white/95 p-4 shadow-xl backdrop-blur md:right-auto md:w-72 md:p-5">
          {[
            { icona: 'bagno', t: 'Bagno rifatto' },
            { icona: 'pennello', t: 'Casa tinteggiata' },
            { icona: 'neve', t: 'Aria condizionata' },
            { icona: 'divano', t: 'Arredo nuovo' },
          ].map((x, i) => (
            <motion.p
              key={x.t}
              className="flex items-center gap-3 py-1.5 font-semibold"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.6 }}
            >
              <Icona nome={x.icona} className="size-5 text-pietra" />
              <span className="flex-1">{x.t}</span>
              <motion.span
                className="flex size-6 items-center justify-center rounded-full bg-salvia text-inchiostro"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.7 + i * 0.6 }}
              >
                <Icona nome="check" className="size-4" />
              </motion.span>
            </motion.p>
          ))}
        </div>
      </div>
    )

  return (
    <div className="absolute inset-0">
      <motion.div className="absolute inset-0" initial={{ scale: 1.15, filter: 'brightness(0.6)' }} animate={{ scale: 1, filter: 'brightness(1)' }} transition={{ duration: 1.6, ease: EASE_LUSSO }}>
        <Image src={DOPO} alt="La camera di Via Leonina dopo i lavori" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
      </motion.div>
      <Etichetta ritardo={0.6} className="top-[10%] left-[8%] bg-white text-inchiostro">✨ Valore aumentato</Etichetta>
      <Etichetta ritardo={0.85} className="top-[30%] right-[8%] bg-sole text-inchiostro">0 € anticipati</Etichetta>
      <Etichetta ritardo={1.1} className="bottom-[28%] left-[10%] bg-corallo text-white">Canone costante</Etichetta>
      <Etichetta ritardo={1.35} className="right-[10%] bottom-[10%] bg-white text-inchiostro">Niente più morosità</Etichetta>
    </div>
  )
}

function Tappa({ t, i, onAttiva }: { t: (typeof TAPPE)[number]; i: number; onAttiva: (i: number) => void }) {
  const ref = useRef<HTMLLIElement>(null)
  const centrale = useInView(ref, { margin: '-45% 0px -45% 0px' })
  const visto = useInView(ref, { once: true, margin: '0px 0px -25% 0px' })
  useEffect(() => {
    if (centrale) onAttiva(i)
  }, [centrale, i, onAttiva])

  return (
    <li ref={ref} className="lg:flex lg:min-h-[78vh] lg:items-center">
      <div className="w-full">
        {/* su telefono la scena sta sopra il testo */}
        <div className="relative mb-6 aspect-[4/5] overflow-hidden rounded-[2rem] sm:aspect-[4/3] lg:hidden">{visto && <Scena tipo={t.tipo} />}</div>
        <span className={`inline-flex items-center gap-3 rounded-full px-4 py-1.5 text-sm font-bold ${t.colore}`}>
          <span className="font-display">{String(i + 1).padStart(2, '0')}</span>
          {t.quando}
        </span>
        <h3 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">{t.titolo}</h3>
        <p className="mt-4 max-w-md text-lg text-pietra">{t.testo}</p>
      </div>
    </li>
  )
}

export default function StoriaLeonina() {
  const [attiva, setAttiva] = useState(0)

  return (
    <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
      <ol className="space-y-20 lg:space-y-0">
        {TAPPE.map((t, i) => (
          <Tappa key={t.tipo} t={t} i={i} onAttiva={setAttiva} />
        ))}
      </ol>

      <div className="hidden lg:block">
        <div className="sticky top-[12vh] h-[76vh]">
          <div className="relative h-full overflow-hidden rounded-[2.5rem] shadow-[0_40px_80px_-40px_rgba(29,34,54,0.5)]">
            <AnimatePresence initial={false}>
              <motion.div
                key={TAPPE[attiva].tipo}
                className="absolute inset-0"
                initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                animate={{ clipPath: 'circle(80% at 50% 50%)' }}
                exit={{ opacity: 1 }}
                transition={{ duration: 0.9, ease: EASE_LUSSO }}
              >
                <Scena tipo={TAPPE[attiva].tipo} />
              </motion.div>
            </AnimatePresence>
          </div>
          {/* avanzamento della storia */}
          <div className="mt-5 flex items-center gap-2" aria-hidden="true">
            {TAPPE.map((t, i) => (
              <span key={t.tipo} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-linea">
                <motion.span className="absolute inset-0 origin-left rounded-full bg-corallo" initial={false} animate={{ scaleX: i <= attiva ? 1 : 0 }} transition={{ duration: 0.6, ease: EASE_LUSSO }} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
