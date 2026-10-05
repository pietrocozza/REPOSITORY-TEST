'use client'

import { useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'
import Burger from '@/components/burger/Burger'
import KineticText from '@/components/ui/KineticText'
import Magnetic from '@/components/ui/Magnetic'
import ProductIcon from '@/components/illustrations/ProductIcon'
import { BURGERS, CONTORNI, DOLCI, euro, type Burger as BurgerT, type Prodotto } from '@/lib/menu'
import { useCart } from '@/lib/cart'
import { scrollToId } from '@/lib/scroll'
import { EASE_OUT, VIEWPORT_ONCE } from '@/lib/animations'
import { useRiduciMovimento } from '@/lib/hooks'

export default function Menu() {
  return (
    <section id="menu" data-bg="#E63B2E" aria-labelledby="menu-titolo" className="relative px-4 pb-32 pt-32 text-crema md:px-10 md:pb-44 md:pt-44">
      <header className="mx-auto max-w-7xl">
        <p className="eyebrow mb-6 flex items-center gap-3">
          <span className="inline-block h-px w-10 bg-current" /> Il menu completo
        </p>
        <h2 id="menu-titolo" className="font-display text-fluid-xl">
          <KineticText as="span" text="Scegli il tuo" className="block" />
          <KineticText as="span" text="peccato." className="block italic text-cheddar" delay={0.3} />
        </h2>
        <p className="mt-8 max-w-lg text-lg leading-relaxed text-crema/85">
          Sei burger, tre contorni, tre dolci. Tutto qui, tutto fatto a mano, ogni giorno. Premi “Ordina” e il panino ti aspetta nel modulo
          qui sotto.
        </p>
      </header>

      <Blocco numero="01" titolo="I burger">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {BURGERS.map((b, i) => (
            <motion.li
              key={b.id}
              initial={{ opacity: 0, y: 80, rotate: i % 2 ? 3 : -3 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: (i % 3) * 0.1 }}
            >
              <CardBurger burger={b} />
            </motion.li>
          ))}
        </ul>
      </Blocco>

      <Blocco numero="02" titolo="I contorni">
        <ListaProdotti prodotti={CONTORNI} />
      </Blocco>

      <Blocco numero="03" titolo="I dolci">
        <ListaProdotti prodotti={DOLCI} />
      </Blocco>
    </section>
  )
}

function Blocco({ numero, titolo, children }: { numero: string; titolo: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-24 max-w-7xl md:mt-32">
      <div className="mb-10 flex items-end justify-between gap-4 md:mb-14">
        <h3 className="font-display text-fluid-lg italic">
          <KineticText as="span" text={titolo} per="parole" />
        </h3>
        <span className="eyebrow pb-2 text-crema/70">{numero} / 03</span>
      </div>
      {/* linea sottile che si disegna da sinistra */}
      <motion.div
        aria-hidden="true"
        className="mb-10 h-px origin-left bg-crema/40 md:mb-14"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: EASE_OUT }}
      />
      {children}
    </div>
  )
}

/** Card del burger: si inclina in 3D seguendo il mouse, il panino salta e si apre */
function CardBurger({ burger }: { burger: BurgerT }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useRiduciMovimento()
  const { preseleziona } = useCart()
  const [attiva, setAttiva] = useState(false)
  const rx = useSpring(0, { stiffness: 220, damping: 18 })
  const ry = useSpring(0, { stiffness: 220, damping: 18 })
  const lucidoX = useTransform(ry, [-12, 12], ['-100%', '200%'])

  const muovi = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ry.set(px * 16)
    rx.set(-py * 16)
  }
  const esci = () => {
    rx.set(0)
    ry.set(0)
    setAttiva(false)
  }

  const ordina = () => {
    preseleziona(burger.id)
    scrollToId('ordina')
  }

  return (
    <div className="group relative h-full [perspective:1100px]" data-cursor="ordina">
      {/* ombra: si allarga e si sposta quando la card si solleva (solo transform) */}
      <div
        aria-hidden="true"
        className="absolute inset-3 rounded-[2rem] bg-nero/35 blur-xl transition-transform duration-500 ease-out group-hover:translate-x-3 group-hover:translate-y-6 group-hover:scale-[1.03]"
      />
      <motion.article
        ref={ref}
        onPointerMove={muovi}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setAttiva(true)}
        onPointerLeave={esci}
        // su mobile: al tocco il panino si apre per un attimo
        onTap={(e) => {
          if ((e as PointerEvent).pointerType !== 'mouse') {
            setAttiva(true)
            setTimeout(() => setAttiva(false), 1200)
          }
        }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-crema p-6 text-nero transition-transform duration-500 ease-out group-hover:-translate-y-2 md:p-7"
      >
        {/* riflesso che segue l'inclinazione */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ x: lucidoX }}
        />
        <div className="flex items-start justify-between gap-3">
          {burger.badge ? (
            <span className="eyebrow rounded-full bg-nero px-3 py-1.5 text-[0.6rem] text-crema">{burger.badge}</span>
          ) : (
            <span />
          )}
          <span className="font-display text-2xl italic">{euro(burger.prezzo)}</span>
        </div>

        <motion.div
          className="mx-auto my-6 w-[72%] max-w-[230px]"
          animate={attiva && !reduce ? { y: [0, -18, 0, -6, 0] } : { y: 0 }}
          transition={{ duration: 0.7 }}
          style={{ translateZ: 40 }}
        >
          <Burger strati={burger.strati} separa={attiva && !reduce ? 7 : 0} label={`Illustrazione del burger ${burger.nome}`} />
        </motion.div>

        <h4 className="font-display text-3xl leading-tight">{burger.nome}</h4>
        <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-nero/70">{burger.descrizione}</p>

        <div className="mt-6 flex items-center justify-between">
          <Magnetic>
            <button
              type="button"
              onClick={ordina}
              className="group/btn relative flex h-12 items-center gap-2 overflow-hidden rounded-full bg-nero pl-5 pr-1.5 text-sm font-semibold text-crema"
              aria-label={`Ordina ${burger.nome}`}
            >
              <span className="absolute inset-0 translate-y-full rounded-full bg-pomodoro transition-transform duration-500 ease-out group-hover/btn:translate-y-0" />
              <span className="relative">Ordina</span>
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-crema text-nero">↓</span>
            </button>
          </Magnetic>
          <span className="eyebrow text-[0.6rem] text-nero/50">{burger.strati.length} strati</span>
        </div>
      </motion.article>
    </div>
  )
}

/** Contorni e dolci: impaginati come la carta di un ristorante, con puntini fino al prezzo */
function ListaProdotti({ prodotti }: { prodotti: Prodotto[] }) {
  const reduce = useRiduciMovimento()
  return (
    <ul className="grid gap-x-16 md:grid-cols-3">
      {prodotti.map((p, i) => (
        <motion.li
          key={p.id}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: i * 0.12 }}
          className="group border-b border-crema/25 py-8 md:border-b-0 md:py-0"
        >
          <motion.div
            className="mb-6 w-36 md:w-44"
            whileHover={reduce ? undefined : { rotate: [0, -8, 6, 0], y: -8 }}
            transition={{ duration: 0.6 }}
          >
            <div className="rounded-full bg-crema/95 p-4 transition-transform duration-500 group-hover:scale-105">
              <ProductIcon tipo={p.icona} className="h-auto w-full" />
            </div>
          </motion.div>
          <div className="flex items-baseline gap-3">
            <h4 className="font-display text-2xl leading-tight md:text-[1.7rem]">{p.nome}</h4>
            <span aria-hidden="true" className="mb-1.5 flex-1 border-b border-dotted border-crema/60" />
            <span className="font-display text-xl italic">{euro(p.prezzo)}</span>
          </div>
          <p className="mt-2 max-w-xs leading-relaxed text-crema/80">{p.descrizione}</p>
        </motion.li>
      ))}
    </ul>
  )
}
