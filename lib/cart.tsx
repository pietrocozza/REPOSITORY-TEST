'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { subtotale, type Riga } from './menu'

// Carrello condiviso: hero, secondo panino, menu, navbar e barra mobile.

type CartCtx = {
  righe: Riga[]
  count: number
  totaleProdotti: number
  aggiungi: (id: string) => void
  imposta: (id: string, qty: number) => void
  svuota: () => void
  /** cresce a ogni aggiunta: fa reagire l'icona del carrello */
  addTick: number
}

const Ctx = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [righe, setRighe] = useState<Riga[]>([])
  const [addTick, setAddTick] = useState(0)

  const aggiungi = useCallback((id: string) => {
    setRighe((prev) => {
      const r = prev.find((x) => x.id === id)
      return r ? prev.map((x) => (x.id === id ? { ...x, qty: Math.min(20, x.qty + 1) } : x)) : [...prev, { id, qty: 1 }]
    })
    setAddTick((t) => t + 1)
  }, [])

  const imposta = useCallback((id: string, qty: number) => {
    setRighe((prev) => (qty <= 0 ? prev.filter((x) => x.id !== id) : prev.map((x) => (x.id === id ? { ...x, qty: Math.min(20, qty) } : x))))
  }, [])

  const svuota = useCallback(() => setRighe([]), [])

  const value = useMemo(
    () => ({
      righe,
      count: righe.reduce((s, r) => s + r.qty, 0),
      totaleProdotti: subtotale(righe),
      aggiungi,
      imposta,
      svuota,
      addTick,
    }),
    [righe, aggiungi, imposta, svuota, addTick],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart va usato dentro <CartProvider>')
  return c
}
