import { z } from 'zod'
import { PRODOTTI, ZONE } from './menu'
import { FASCE_CONSEGNA } from './info'

// Regole di validazione dell'ordine: le stesse nel browser e nella route API.

const ids = <T extends { id: string }>(arr: readonly T[]) => arr.map((x) => x.id) as [T['id'], ...T['id'][]]

export const ORARI_CONSEGNA = ['asap', ...FASCE_CONSEGNA] as const

export const datiSchema = z.object({
  nome: z.string().trim().min(2, 'Scrivi nome e cognome.'),
  telefono: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{8,16}$/, 'Numero non valido: solo cifre, almeno 8 (es. 333 1234567).'),
  indirizzo: z
    .string()
    .trim()
    .min(5, 'Scrivi via e numero civico.')
    .regex(/\d/, 'Manca il numero civico.'),
  zona: z.enum(ids(ZONE), { error: 'Scegli la tua zona di Viterbo.' }),
  orario: z.enum(ORARI_CONSEGNA, { error: 'Scegli quando vuoi la consegna.' }),
  note: z.string().max(300, 'Massimo 300 caratteri.').optional(),
  pagamento: z.enum(['contanti', 'carta'], { error: 'Scegli come pagare alla consegna.' }),
  consenso: z.boolean().refine((v) => v, 'Serve il tuo consenso per gestire l’ordine.'),
})

export type Dati = z.input<typeof datiSchema>

export const ordineSchema = z.object({
  carrello: z
    .array(z.object({ id: z.enum(ids(PRODOTTI)), qty: z.number().int().min(1).max(20) }))
    .min(1, 'Il carrello è vuoto.')
    .max(30),
  dati: datiSchema,
})
