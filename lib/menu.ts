import type { LayerId } from '@/components/burger/layers'

// Menu del locale (inventato). I prezzi sono in euro.

export type Burger = {
  id: string
  nome: string
  descrizione: string
  prezzo: number
  /** Strati dall'alto verso il basso: servono per disegnare l'illustrazione */
  strati: LayerId[]
  badge?: string
}

export type Prodotto = {
  id: string
  nome: string
  descrizione: string
  prezzo: number
  icona: 'patatine' | 'anelli' | 'spicchi' | 'tiramisu' | 'cheesecake' | 'gelato'
}

export const BURGERS: Burger[] = [
  {
    id: 'peperino',
    nome: 'Il Peperino',
    descrizione:
      'Il nostro classico: doppio smash di manzo maremmano, cheddar fuso e salsa della casa. Duro come la pietra di Viterbo? No, morbido come un abbraccio.',
    prezzo: 11.5,
    strati: ['bunTop', 'lettuce', 'tomato', 'cheese', 'patty', 'sauce', 'bunBottom'],
    badge: 'Il più amato',
  },
  {
    id: 'papale',
    nome: 'Il Papale',
    descrizione:
      'Così ricco che nel 1268 ci avrebbero messo tre anni a decidere se mangiarlo. Bacon, uovo e doppio formaggio.',
    prezzo: 14,
    strati: ['bunTop', 'egg', 'bacon', 'cheese', 'patty', 'cheese', 'sauce', 'bunBottom'],
    badge: 'Conclave di sapori',
  },
  {
    id: 'cimino',
    nome: 'Il Cimino',
    descrizione:
      'Granella di nocciole dei Monti Cimini, pecorino della Tuscia e cipolla caramellata. Croccante fuori, montanaro dentro.',
    prezzo: 13,
    strati: ['bunTop', 'hazelnut', 'onion', 'pecorino', 'patty', 'sauce', 'bunBottom'],
  },
  {
    id: 'pellegrino',
    nome: 'Il Pellegrino',
    descrizione:
      'Leggero come chi cammina sulla Francigena (ma con il bacon, perché la strada è lunga).',
    prezzo: 12,
    strati: ['bunTop', 'lettuce', 'tomato', 'onion', 'bacon', 'patty', 'bunBottom'],
  },
  {
    id: 'macchina',
    nome: 'La Macchina',
    descrizione:
      'Alto come la Macchina di Santa Rosa: tre smash, tre formaggi, zero paura. Da portare in spalla.',
    prezzo: 16.5,
    strati: ['bunTop', 'cheese', 'patty', 'pecorino', 'patty', 'cheese', 'patty', 'bacon', 'sauce', 'bunBottom'],
    badge: 'Solo per facchini',
  },
  {
    id: 'orto',
    nome: "L'Orto",
    descrizione:
      "Burger di legumi e patate dell'Alto Viterbese, verdure dell'orto e un filo d'olio di Canino. Anche i vegetariani hanno fame.",
    prezzo: 11,
    strati: ['bunTop', 'lettuce', 'tomato', 'onion', 'veggie', 'sauce', 'bunBottom'],
    badge: 'Vegetariano',
  },
]

export const CONTORNI: Prodotto[] = [
  {
    id: 'patatine',
    nome: "Patatine dell'Alto Viterbese",
    descrizione: 'Tagliate a mano, fritte due volte. La seconda per essere sicuri.',
    prezzo: 4.5,
    icona: 'patatine',
  },
  {
    id: 'anelli',
    nome: 'Anelli di cipolla',
    descrizione: 'Croccanti, dorati, impossibili da dividere con chi ami.',
    prezzo: 5,
    icona: 'anelli',
  },
  {
    id: 'spicchi',
    nome: 'Spicchi al rosmarino',
    descrizione: "Con buccia, rosmarino e olio di Canino. Il nonno approverebbe.",
    prezzo: 5,
    icona: 'spicchi',
  },
]

export const DOLCI: Prodotto[] = [
  {
    id: 'tiramisu',
    nome: 'Tiramisù alle nocciole',
    descrizione: 'Mascarpone, caffè e nocciole dei Cimini. Ti tira su, appunto.',
    prezzo: 5.5,
    icona: 'tiramisu',
  },
  {
    id: 'cheesecake',
    nome: 'Cheesecake al pecorino dolce',
    descrizione: 'Sembra una follia, sa di genio. Con miele di castagno.',
    prezzo: 6,
    icona: 'cheesecake',
  },
  {
    id: 'gelato',
    nome: 'Gelato fiordilatte & olio',
    descrizione: "Un giro d'olio nuovo e un pizzico di sale. Fidati di noi.",
    prezzo: 4.5,
    icona: 'gelato',
  },
]

export const BIBITE = [
  { id: 'acqua', nome: 'Acqua naturale', prezzo: 1.5 },
  { id: 'frizzante', nome: 'Acqua frizzante', prezzo: 1.5 },
  { id: 'cola', nome: 'Cola artigianale', prezzo: 3 },
  { id: 'aranciata', nome: 'Aranciata', prezzo: 3 },
  { id: 'birra', nome: 'Birra artigianale della Tuscia', prezzo: 5.5 },
] as const

export const COTTURE = [
  { id: 'sangue', nome: 'Al sangue' },
  { id: 'media', nome: 'Media' },
  { id: 'benCotta', nome: 'Ben cotta' },
] as const

export const EXTRA = [
  { id: 'doppiaCarne', nome: 'Doppia carne', prezzo: 3 },
  { id: 'bacon', nome: 'Bacon', prezzo: 1.5 },
  { id: 'formaggio', nome: 'Formaggio extra', prezzo: 1 },
  { id: 'uovo', nome: 'Uovo', prezzo: 1.5 },
] as const

export type ExtraId = (typeof EXTRA)[number]['id']

/** Zone di consegna a Viterbo (costi fittizi) */
export const ZONE = [
  { id: 'centro', nome: 'Centro storico', costo: 1.5 },
  { id: 'sanfaustino', nome: 'San Faustino / Pianoscarano', costo: 2 },
  { id: 'murialto', nome: 'Murialto / Ellera', costo: 2.5 },
  { id: 'santabarbara', nome: 'Santa Barbara / Villanova', costo: 3 },
  { id: 'laquercia', nome: 'La Quercia / Bagnaia', costo: 4 },
] as const

/** Sopra questa cifra la consegna è gratuita */
export const SOGLIA_CONSEGNA_GRATIS = 30

export const euro = (n: number) =>
  n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

export const findBurger = (id: string) => BURGERS.find((b) => b.id === id)
