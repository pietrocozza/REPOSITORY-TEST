'use client'

import { useEffect } from 'react'

/** Niente "Salva immagine" col tasto destro sulle foto. Il resto della pagina (testi, numeri, indirizzi) resta copiabile */
export default function ProteggiFoto() {
  useEffect(() => {
    const blocca = (e: MouseEvent) => {
      if (e.target instanceof HTMLImageElement) e.preventDefault()
    }
    document.addEventListener('contextmenu', blocca)
    return () => document.removeEventListener('contextmenu', blocca)
  }, [])
  return null
}
