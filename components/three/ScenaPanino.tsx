'use client'

import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { MotionValue } from 'motion/react'
import Burger3D from './Burger3D'
import Studio from './Studio'
import Sicuro3D from './Sicuro3D'
import { APERTURA } from '@/lib/animations'
import { APERTO, SPESSORE, altezzeChiuse } from '@/lib/ricette'

const STRATI = APERTO.map((s) => s.ingrediente)
const N = STRATI.length
const DISTANZA = 0.42
const { totale: ALTEZZA } = altezzeChiuse(STRATI)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** 0 = chiuso, 1 = aperto, per lo strato i al progresso v dello scroll */
function aperturaStrato(i: number, v: number) {
  const s = APERTURA.inizio + i * APERTURA.sfasamento
  const { durata, chiusuraInizio: CI, chiusuraFine: CF } = APERTURA
  if (v <= s) return 0
  if (v < s + durata) return easeInOut((v - s) / durata)
  if (v <= CI) return 1
  if (v < CF) return 1 - easeInOut((v - CI) / (CF - CI))
  return 0
}

type Props = {
  p: MotionValue<number>
  nx: MotionValue<number>
  ny: MotionValue<number>
  mobile: boolean
  touch: boolean
  fermo: boolean
  attivo: boolean
  etichetteRef: React.RefObject<(HTMLDivElement | null)[]>
}

export default function ScenaPanino(props: Props) {
  return (
    <Sicuro3D>
      <Canvas
        dpr={[1, 1.75]}
        frameloop={props.attivo ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ fov: 30, position: [0, 2, 8], near: 0.1, far: 60 }}
        style={{ pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <Studio />
        <Contenuto {...props} />
      </Canvas>
    </Sicuro3D>
  )
}

function Contenuto({ p, nx, ny, mobile, touch, fermo, etichetteRef }: Props) {
  const esterno = useRef<THREE.Group>(null)
  const interno = useRef<THREE.Group>(null)
  const aperture = useRef<number[]>(new Array(N).fill(0))
  const centri = useRef<number[]>(new Array(N).fill(0))
  const { camera, size } = useThree()
  const v3 = useRef(new THREE.Vector3())
  const target = useRef(new THREE.Vector3())

  useFrame((state, dt) => {
    const ap = aperture.current
    const vec = v3.current
    const tgt = target.current
    const v = p.get()
    const k = 1 - Math.exp(-dt * 7) // ammorbidisce i movimenti
    let media = 0
    for (let i = 0; i < N; i++) {
      ap[i] += (aperturaStrato(i, v) - ap[i]) * (fermo ? 1 : k)
      media += ap[i] / N
    }
    const heroT = fermo ? 1 : Math.min(1, v / (APERTURA.heroFine + 0.02))

    // camera: si allontana mentre il panino si apre, così tutto resta inquadrato
    const lontananza = (mobile ? 1.7 : 1) * (8.6 - heroT * 1.6 + media * 4.4)
    const centroY = ALTEZZA / 2 + (media * ((N - 1) * DISTANZA)) / 2
    tgt.set(0, centroY + (1 - heroT) * (mobile ? 0.2 : 0.55), 0)
    camera.position.lerp(vec.set(0, tgt.y + 1.5 + media * 0.6, lontananza), fermo ? 1 : k)
    camera.lookAt(tgt)

    // su mobile il panino va a sinistra per lasciare spazio alle scritte
    if (esterno.current) esterno.current.position.x = mobile ? -1.35 * media : 0

    // inclinazione: segue il mouse (su touch lo scorrimento), più un lento movimento continuo
    if (interno.current) {
      const t = state.clock.elapsedTime
      const gy = fermo ? 0.35 : (touch ? (v - 0.3) * 1.4 : nx.get() * 0.55) + Math.sin(t * 0.35) * 0.25
      const gx = fermo ? 0 : touch ? 0 : ny.get() * 0.12
      interno.current.rotation.y += (gy - interno.current.rotation.y) * k
      interno.current.rotation.x += (gx - interno.current.rotation.x) * k
      interno.current.position.y = fermo ? 0 : Math.sin(t * 1.1) * 0.05 * (1 - media)
    }

    // etichette HTML allineate agli strati
    const els = etichetteRef.current
    if (esterno.current && els) {
      for (let i = 0; i < N; i++) {
        const el = els[i]
        if (!el) continue
        const lato = mobile ? 1 : i % 2 ? 1 : -1
        vec.set(lato * (mobile ? 1.08 : 1.22), centri.current[i] + SPESSORE[STRATI[i]] / 2, 0)
        esterno.current.localToWorld(vec)
        vec.project(camera)
        const x = ((vec.x + 1) / 2) * size.width
        const y = ((1 - vec.y) / 2) * size.height
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`
        el.style.opacity = String(Math.max(0, (ap[i] - 0.55) / 0.45))
      }
    }
  })

  return (
    <group ref={esterno}>
      <group ref={interno}>
        <Burger3D strati={STRATI} distanza={DISTANZA} apertura={(i) => aperture.current[i]} onFrame={(c) => (centri.current = c)} />
      </group>
    </group>
  )
}
