'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { LayerId } from '@/components/burger/layers'
import type { ExtraId } from './menu'
import type { CartItem, CotturaId } from './pricing'
import { audio } from './audio'

// Carrello condiviso tra menu, modulo d'ordine, navbar e mascotte.

export type Bozza = {
  burgerId: string
  qty: number
  cottura: CotturaId
  extra: ExtraId[]
  senza: LayerId[]
  contorno?: string
  bibita?: string
}

export const BOZZA_VUOTA: Bozza = { burgerId: 'peperino', qty: 1, cottura: 'media', extra: [], senza: [] }

type CartCtx = {
  items: CartItem[]
  count: number
  add: (b: Bozza) => void
  remove: (key: string) => void
  clear: () => void
  /** il panino in preparazione nel passaggio 1 */
  bozza: Bozza
  setBozza: (b: Bozza | ((prev: Bozza) => Bozza)) => void
  /** chiamato dal pulsante "Ordina" delle card del menu */
  preseleziona: (burgerId: string) => void
  /** cresce a ogni preselezione: il modulo torna al passaggio 1 */
  preselezioneTick: number
  /** cresce a ogni aggiunta: fa rimbalzare icona carrello e mascotte */
  addTick: number
}

const Ctx = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [bozza, setBozza] = useState<Bozza>(BOZZA_VUOTA)
  const [preselezioneTick, setPre] = useState(0)
  const [addTick, setAddTick] = useState(0)

  const add = useCallback((b: Bozza) => {
    setItems((prev) => [...prev, { ...b, key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }])
    setAddTick((t) => t + 1)
    audio.ding()
  }, [])
  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), [])
  const clear = useCallback(() => setItems([]), [])
  const preseleziona = useCallback((burgerId: string) => {
    setBozza({ ...BOZZA_VUOTA, burgerId })
    setPre((t) => t + 1)
  }, [])

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      add,
      remove,
      clear,
      bozza,
      setBozza,
      preseleziona,
      preselezioneTick,
      addTick,
    }),
    [items, add, remove, clear, bozza, preseleziona, preselezioneTick, addTick],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart va usato dentro <CartProvider>')
  return c
}
