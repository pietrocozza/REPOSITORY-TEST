'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type * as THREE from 'three'
import type { MotionValue } from 'motion/react'
import Burger3D from './Burger3D'
import Studio from './Studio'
import Sicuro3D from './Sicuro3D'
import { Anelli, Patatine } from './ingredienti'
import { altezzeChiuse, type Ingrediente } from '@/lib/ricette'

export type Soggetto = { ricetta: Ingrediente[] } | { contorno: 'patatine' | 'anelli' }

type Props = {
  soggetto: Soggetto
  /** true = grande e sempre animato (secondo panino); false = card del menu, animata solo in hover */
  grande?: boolean
  nx?: MotionValue<number>
  ny?: MotionValue<number>
  fermo?: boolean
  vicino: boolean
  /** il cibo entra ruotando la prima volta che appare */
  entrata: boolean
}

/** Un cibo 3D in vetrina: si inclina verso il mouse, in hover si avvicina, si apre appena e gira */
export default function Vetrina3D(props: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visibile, setVisibile] = useState(false)
  const [montato, setMontato] = useState(false)
  const [animando, setAnimando] = useState(true)

  // il Canvas si crea solo quando la card si avvicina allo schermo, e si ferma quando esce
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        setVisibile(e.isIntersecting)
        if (e.isIntersecting) setMontato(true)
      },
      { rootMargin: '300px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // le card piccole si animano solo all'ingresso e in hover (risparmia batteria)
  useEffect(() => {
    if (!props.entrata) return
    const t = setTimeout(() => setAnimando(false), 2200)
    return () => clearTimeout(t)
  }, [props.entrata])

  const sempre = props.grande || props.vicino || animando
  return (
    <div ref={ref} className="absolute inset-0">
      {montato && (
        <Sicuro3D>
          <Canvas
            dpr={[1, props.grande ? 1.75 : 1.5]}
            frameloop={!visibile ? 'never' : sempre ? 'always' : 'demand'}
            gl={{ antialias: true, alpha: true }}
            camera={{ fov: 30, position: [0, 2.6, 6.5] }}
            style={{ pointerEvents: 'none' }}
          >
            <Studio />
            <Oggetto {...props} />
          </Canvas>
        </Sicuro3D>
      )}
    </div>
  )
}

function Oggetto({ soggetto, grande, nx, ny, fermo, vicino, entrata }: Props) {
  const gruppo = useRef<THREE.Group>(null)
  const { camera, invalidate } = useThree()
  const stato = useRef({ apertura: 0, giro: -2.4, scala: 1 })

  const altezza = useMemo(() => ('ricetta' in soggetto ? altezzeChiuse(soggetto.ricetta).totale : soggetto.contorno === 'patatine' ? 1.5 : 1.15), [soggetto])

  useEffect(() => {
    const d = Math.max(5.6, altezza * 2.4 + 2.2)
    camera.position.set(0, altezza / 2 + 1.7, d)
    camera.lookAt(0, altezza / 2 - 0.05, 0)
    invalidate()
  }, [altezza, camera, invalidate])

  useEffect(() => invalidate(), [vicino, entrata, invalidate])

  useFrame((s, dt) => {
    const g = gruppo.current
    if (!g) return
    const k = 1 - Math.exp(-dt * 5)
    const st = stato.current
    const t = s.clock.elapsedTime
    const base = entrata ? 0.45 : -2.4
    const verso = fermo ? 0.45 : base + (vicino ? t * 0.9 : 0) + (grande && nx ? nx.get() * 0.6 : 0)
    st.giro += (verso - st.giro) * (fermo ? 1 : k)
    st.apertura += ((vicino && !fermo ? 0.22 : 0) - st.apertura) * k
    st.scala += ((vicino && !fermo ? 1.08 : 1) - st.scala) * k
    g.rotation.y = st.giro
    g.rotation.x = grande && ny && !fermo ? ny.get() * 0.1 : 0
    g.position.y = fermo ? 0 : Math.sin(t * 1.2) * 0.05 + (vicino ? 0.12 : 0)
    g.scale.setScalar(st.scala)
  })

  return (
    <group ref={gruppo}>
      {'ricetta' in soggetto ? (
        <Burger3D strati={soggetto.ricetta} distanza={0.35} apertura={() => stato.current.apertura} />
      ) : soggetto.contorno === 'patatine' ? (
        <Patatine />
      ) : (
        <Anelli />
      )}
    </group>
  )
}
