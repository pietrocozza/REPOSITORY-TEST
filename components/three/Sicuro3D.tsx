'use client'

import { Component, useSyncExternalStore, type ReactNode } from 'react'

let supporto: boolean | null = null
function webglDisponibile() {
  if (supporto === null) {
    try {
      const c = document.createElement('canvas')
      supporto = !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      supporto = false
    }
  }
  return supporto
}

class Barriera extends Component<{ children: ReactNode; riserva: ReactNode }, { errore: boolean }> {
  state = { errore: false }
  static getDerivedStateFromError() {
    return { errore: true }
  }
  render() {
    return this.state.errore ? this.props.riserva : this.props.children
  }
}

/**
 * Mostra il 3D solo se il browser lo supporta; se qualcosa va storto,
 * al suo posto resta un bagliore caldo e il resto del sito continua a funzionare.
 */
export default function Sicuro3D({ children }: { children: ReactNode }) {
  const ok = useSyncExternalStore(
    () => () => {},
    webglDisponibile,
    () => false,
  )
  const riserva = (
    <div
      aria-hidden="true"
      className="absolute inset-[15%] rounded-full"
      style={{ background: 'radial-gradient(closest-side, rgba(255,176,32,0.25), transparent 70%)' }}
    />
  )
  if (!ok) return riserva
  return <Barriera riserva={riserva}>{children}</Barriera>
}
