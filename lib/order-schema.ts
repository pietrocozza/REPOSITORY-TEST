import { z } from 'zod'
import type { LayerId } from '@/components/burger/layers'
import { BIBITE, BURGERS, CONTORNI, EXTRA, ZONE } from './menu'
import { FASCE_CONSEGNA } from './info'
import { RIMOVIBILI } from './pricing'

// Regole di validazione del modulo d'ordine.
// Le stesse regole valgono nel browser (messaggi accanto ai campi)
// e nella route API (che ricontrolla tutto prima di rispondere).

const ids = <T extends { id: string }>(arr: readonly T[]) => arr.map((x) => x.id) as [T['id'], ...T['id'][]]

export const itemSchema = z.object({
  key: z.string(),
  burgerId: z.enum(ids(BURGERS)),
  qty: z.number().int().min(1).max(20),
  cottura: z.enum(['sangue', 'media', 'benCotta']),
  extra: z.array(z.enum(ids(EXTRA))),
  senza: z.array(z.enum(RIMOVIBILI as [LayerId, ...LayerId[]])),
  contorno: z.enum(ids(CONTORNI)).optional(),
  bibita: z.enum(ids(BIBITE)).optional(),
})

export const datiSchema = z
  .object({
    nome: z.string().trim().min(2, 'Scrivi nome e cognome, così il rider sa chi cercare.'),
    telefono: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ]{8,16}$/, 'Numero non valido: solo cifre, almeno 8 (es. 333 1234567).'),
    indirizzo: z.string().trim().min(3, 'Indica via o piazza.'),
    civico: z
      .string()
      .trim()
      .min(1, 'Manca il numero civico.')
      .max(8, 'Civico troppo lungo.'),
    citofono: z.string().trim().min(1, 'A che nome suoniamo il citofono?'),
    note: z.string().max(300, 'Massimo 300 caratteri, il rider ha fretta.').optional(),
    zona: z.enum(ids(ZONE), { error: 'Scegli la tua zona di Viterbo.' }),
    quando: z.enum(['asap', 'fascia'], { error: 'Dicci quando vuoi il panino.' }),
    fascia: z.string().optional(),
    pagamento: z.enum(['contanti', 'carta'], { error: 'Scegli come pagare alla consegna.' }),
    consenso: z.boolean().refine((v) => v, 'Serve il tuo consenso per gestire l’ordine.'),
  })
  .superRefine((d, ctx) => {
    if (d.quando === 'fascia' && !FASCE_CONSEGNA.includes(d.fascia as (typeof FASCE_CONSEGNA)[number])) {
      ctx.addIssue({ code: 'custom', path: ['fascia'], message: 'Scegli una fascia oraria.' })
    }
  })

export type Dati = z.input<typeof datiSchema>

export const ordineSchema = z.object({
  carrello: z.array(itemSchema).min(1, 'Il carrello è vuoto.').max(30),
  dati: datiSchema,
})

export type Ordine = z.infer<typeof ordineSchema>

/** Campi controllati prima di passare dal passaggio 2 al 3 */
export const CAMPI_CONSEGNA = ['nome', 'telefono', 'indirizzo', 'civico', 'citofono', 'note', 'zona', 'quando', 'fascia'] as const
export const CAMPI_CONFERMA = ['pagamento', 'consenso'] as const
