'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import type { Grafico as TipoGrafico } from '@/lib/articoli'
import { EASE_LUSSO } from '@/lib/animazioni'

// Colori delle serie, sempre in questo ordine (validati per daltonismo e contrasto)
const COLORI = ['#d9481f', '#2f6db5']

// Formato italiano scritto a mano: identico sul server e nel browser (8.000 · 3,5)
const formatta = (v: number) => {
  const [intera, decimali] = String(Math.round(v * 100) / 100).split('.')
  const conPunti = intera.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decimali ? `${conPunti},${decimali}` : conPunti
}

/** Grafico a barre orizzontali (una o due serie) o a intervalli min–max, con dettagli al passaggio */
export default function Grafico({ g }: { g: TipoGrafico }) {
  const [attivo, setAttivo] = useState<string | null>(null)
  const intervalli = g.tipo === 'intervalli'
  const valori = g.serie.flatMap((s) => s.valori)
  const massimo = Math.max(...valori) * 1.12
  const piuSerie = g.serie.length > 1

  return (
    <figure className="my-10 rounded-[2rem] bg-white p-5 shadow-[0_20px_50px_-35px_rgba(29,34,54,0.45)] md:p-8">
      <figcaption className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-xl font-bold tracking-tight md:text-2xl">{g.titolo}</span>
        <span className="text-sm text-pietra">in {g.unita}</span>
      </figcaption>

      {piuSerie && (
        <ul className="mb-5 flex flex-wrap gap-4 text-sm" aria-label="Legenda">
          {g.serie.map((s, i) => (
            <li key={s.nome} className="flex items-center gap-2">
              <span className="size-3 rounded-sm" style={{ background: COLORI[i] }} aria-hidden="true" />
              {s.nome}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-4" role="img" aria-label={`${g.titolo}. Dati nella tabella qui sotto.`}>
        {g.categorie.map((c, ci) => (
          <div key={c} className="grid gap-1.5 sm:grid-cols-[11rem_1fr] sm:items-center sm:gap-4">
            <span className="text-sm font-semibold text-inchiostro">{c}</span>
            <div className="space-y-1.5">
              {intervalli ? (
                (() => {
                  const [min, max] = [g.serie[0].valori[ci * 2], g.serie[0].valori[ci * 2 + 1]]
                  const chiave = `${c}`
                  return (
                    <div className="relative h-8" onPointerEnter={() => setAttivo(chiave)} onPointerLeave={() => setAttivo(null)}>
                      <div className="absolute inset-y-[45%] right-0 left-0 rounded-full bg-linea" />
                      <motion.div
                        className="absolute inset-y-1 rounded-[4px]"
                        style={{ left: `${(min / massimo) * 100}%`, background: COLORI[0], opacity: attivo && attivo !== chiave ? 0.45 : 1 }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${((max - min) / massimo) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: EASE_LUSSO, delay: ci * 0.1 }}
                      />
                      <span className="absolute top-1/2 -translate-y-1/2 pr-2 text-xs font-semibold tabular-nums" style={{ right: `${100 - (min / massimo) * 100}%` }}>
                        {formatta(min)}
                      </span>
                      <span className="absolute top-1/2 -translate-y-1/2 pl-2 text-xs font-semibold tabular-nums" style={{ left: `${(max / massimo) * 100}%` }}>
                        {formatta(max)}
                      </span>
                    </div>
                  )
                })()
              ) : (
                g.serie.map((s, si) => {
                  const v = s.valori[ci]
                  const chiave = `${c}-${s.nome}`
                  return (
                    <div
                      key={s.nome}
                      className="flex items-center gap-2"
                      onPointerEnter={() => setAttivo(chiave)}
                      onPointerLeave={() => setAttivo(null)}
                      title={`${c}${piuSerie ? ` · ${s.nome}` : ''}: ${formatta(v)} ${g.unita}`}
                    >
                      <motion.div
                        className="h-7 rounded-r-[4px] transition-opacity duration-200"
                        style={{ background: COLORI[si], opacity: attivo && attivo !== chiave ? 0.45 : 1 }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(v / massimo) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: EASE_LUSSO, delay: ci * 0.08 + si * 0.05 }}
                      />
                      <span className="shrink-0 text-sm font-bold tabular-nums">
                        {formatta(v)}
                        {g.unita === '%' ? '%' : ''}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {g.nota && <p className="mt-6 text-sm text-pietra">{g.nota}</p>}

      <details className="mt-5 text-sm">
        <summary className="cursor-pointer font-semibold text-pietra hover:text-inchiostro">Vedi i dati in tabella</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left tabular-nums">
            <thead>
              <tr className="border-b border-linea">
                <th className="py-2 pr-4 font-semibold">Voce</th>
                {intervalli ? (
                  <>
                    <th className="py-2 pr-4 font-semibold">Da</th>
                    <th className="py-2 font-semibold">A</th>
                  </>
                ) : (
                  g.serie.map((s) => (
                    <th key={s.nome} className="py-2 pr-4 font-semibold">
                      {s.nome}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {g.categorie.map((c, ci) => (
                <tr key={c} className="border-b border-linea/60">
                  <td className="py-2 pr-4">{c}</td>
                  {intervalli ? (
                    <>
                      <td className="py-2 pr-4">{formatta(g.serie[0].valori[ci * 2])}</td>
                      <td className="py-2">{formatta(g.serie[0].valori[ci * 2 + 1])}</td>
                    </>
                  ) : (
                    g.serie.map((s) => (
                      <td key={s.nome} className="py-2 pr-4">
                        {formatta(s.valori[ci])}
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="mt-4 border-t border-linea pt-4 text-xs text-pietra">
        Fonte:{' '}
        {g.fonti.map((f, i) => (
          <span key={f.url}>
            {i > 0 && ' · '}
            <a href={f.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-corallo">
              {f.nome}
            </a>
          </span>
        ))}
      </p>
    </figure>
  )
}
