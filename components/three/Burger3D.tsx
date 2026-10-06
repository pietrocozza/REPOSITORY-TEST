'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import { Strato } from './ingredienti'
import { altezzeChiuse, type Ingrediente } from '@/lib/ricette'

/**
 * Un panino 3D composto dagli strati indicati (dall'alto verso il basso).
 * "apertura(i)" (0 = chiuso, 1 = aperto) viene letta a ogni fotogramma:
 * gli strati salgono, ruotano appena e si allontanano, il pane di sotto resta appoggiato.
 */
export default function Burger3D({
  strati,
  apertura,
  distanza = 0.42,
  onFrame,
}: {
  strati: Ingrediente[]
  apertura?: (i: number) => number
  distanza?: number
  /** riceve la posizione verticale (centro) di ogni strato, per allineare le etichette */
  onFrame?: (centri: number[]) => void
}) {
  const refs = useRef<(THREE.Group | null)[]>([])
  const { y: base } = useMemo(() => altezzeChiuse(strati), [strati])
  const N = strati.length
  const centri = useRef<number[]>([])

  useFrame(() => {
    for (let i = 0; i < N; i++) {
      const g = refs.current[i]
      if (!g) continue
      const a = apertura ? apertura(i) : 0
      const verso = i % 2 ? 1 : -1
      g.position.y = base[i] + a * (N - 1 - i) * distanza
      g.position.x = a * verso * 0.06
      g.rotation.z = a * verso * 0.05
      g.rotation.y = a * verso * 0.35
      g.rotation.x = a * 0.12
      centri.current[i] = g.position.y
    }
    onFrame?.(centri.current)
  })

  return (
    <group>
      {strati.map((s, i) => (
        <group key={`${s}-${i}`} ref={(el) => void (refs.current[i] = el)} position={[0, base[i], 0]}>
          <Strato tipo={s} />
        </group>
      ))}
    </group>
  )
}
