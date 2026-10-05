import type { LayerId } from '@/components/burger/layers'
import {
  BIBITE,
  CONTORNI,
  EXTRA,
  SOGLIA_CONSEGNA_GRATIS,
  ZONE,
  findBurger,
  type ExtraId,
} from './menu'

// Calcoli di prezzi e ricette, usati sia nel browser sia dalla route API
// (così il totale viene sempre ricalcolato anche lato server).

export type CotturaId = 'sangue' | 'media' | 'benCotta'

export type CartItem = {
  key: string
  burgerId: string
  qty: number
  cottura: CotturaId
  extra: ExtraId[]
  senza: LayerId[]
  contorno?: string
  bibita?: string
}

/** Ingredienti che si possono togliere (il pane e la carne restano!) */
export const RIMOVIBILI: LayerId[] = ['lettuce', 'tomato', 'onion', 'cheese', 'pecorino', 'bacon', 'egg', 'sauce', 'hazelnut']

export function prezzoUnitario(item: Omit<CartItem, 'key' | 'qty'>) {
  const burger = findBurger(item.burgerId)
  if (!burger) return 0
  const extra = item.extra.reduce((s, id) => s + (EXTRA.find((e) => e.id === id)?.prezzo ?? 0), 0)
  const contorno = CONTORNI.find((c) => c.id === item.contorno)?.prezzo ?? 0
  const bibita = BIBITE.find((b) => b.id === item.bibita)?.prezzo ?? 0
  return burger.prezzo + extra + contorno + bibita
}

export const prezzoRiga = (item: CartItem) => prezzoUnitario(item) * item.qty

export const subtotale = (items: CartItem[]) => items.reduce((s, i) => s + prezzoRiga(i), 0)

export function costoConsegna(zonaId: string | undefined, sub: number) {
  if (sub >= SOGLIA_CONSEGNA_GRATIS) return 0
  return ZONE.find((z) => z.id === zonaId)?.costo ?? 0
}

/** Strati del panino personalizzato: base del menu + extra − ingredienti tolti */
export function ricetta(burgerId: string, extra: ExtraId[], senza: LayerId[]): LayerId[] {
  const burger = findBurger(burgerId)
  if (!burger) return []
  const strati = burger.strati.filter((s) => !senza.includes(s))
  const carne = strati.findIndex((s) => s === 'patty' || s === 'veggie')
  const inserisci = (pos: number, id: LayerId) => strati.splice(Math.max(1, pos), 0, id)
  if (extra.includes('formaggio') && carne >= 0) inserisci(carne, 'cheese')
  if (extra.includes('bacon')) {
    const c = strati.findIndex((s) => s === 'patty' || s === 'veggie')
    inserisci(c >= 0 ? c : strati.length - 1, 'bacon')
  }
  if (extra.includes('doppiaCarne')) {
    const c = strati.findIndex((s) => s === 'patty' || s === 'veggie')
    if (c >= 0) inserisci(c, strati[c])
  }
  if (extra.includes('uovo')) inserisci(1, 'egg')
  return strati
}
