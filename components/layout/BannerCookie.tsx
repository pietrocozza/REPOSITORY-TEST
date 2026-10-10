'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { GOOGLE_ADS_CONVERSIONE, GOOGLE_ADS_ID, salvaConsenso, useConsenso } from '@/lib/consenso'
import { EASE_LUSSO } from '@/lib/animazioni'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Banner del consenso e tag di Google Ads.
 * Il tag si carica solo dopo "Accetta": prima nessun cookie e nessuna chiamata a Google.
 * Un clic su WhatsApp, telefono o email conta come contatto (conversione) nelle campagne.
 */
export default function BannerCookie() {
  const consenso = useConsenso()
  const accettato = consenso === 'si'

  // Se il visitatore ritira il consenso, Google smette subito di usare i cookie
  useEffect(() => {
    if (consenso !== 'si') window.gtag?.('consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' })
  }, [consenso])

  useEffect(() => {
    if (!accettato || !GOOGLE_ADS_CONVERSIONE) return
    const alClic = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a')
      const href = link?.getAttribute('href') ?? ''
      if (/^(https:\/\/wa\.me|mailto:|tel:)/.test(href)) {
        window.gtag?.('event', 'conversion', { send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_CONVERSIONE}`, value: 1.0, currency: 'EUR' })
      }
    }
    document.addEventListener('click', alClic, { capture: true })
    return () => document.removeEventListener('click', alClic, { capture: true })
  }, [accettato])

  if (!GOOGLE_ADS_ID) return null

  return (
    <>
      {accettato && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
          <Script id="google-ads" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;
gtag('consent','default',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});
gtag('js',new Date());gtag('config','${GOOGLE_ADS_ID}');`}
          </Script>
        </>
      )}

      <AnimatePresence>
        {consenso === null && (
          <motion.div
            role="dialog"
            aria-label="Preferenze cookie"
            className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl rounded-3xl bg-white p-5 text-inchiostro shadow-[0_30px_80px_-20px_rgba(29,34,54,0.55)] md:bottom-6 md:p-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6, ease: EASE_LUSSO }}
          >
            <p className="font-display text-lg font-bold tracking-tight">Usiamo i cookie solo se ci dici di sì 🍪</p>
            <p className="mt-2 text-sm text-pietra">
              Con il tuo consenso usiamo i cookie di Google Ads per misurare le nostre pubblicità e mostrarti annunci pertinenti. Senza consenso il sito funziona
              uguale.{' '}
              <Link href="/cookie" className="underline underline-offset-2">
                Cookie policy
              </Link>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => salvaConsenso('si')}
                className="rounded-full bg-corallo px-6 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
              >
                Accetta
              </button>
              <button
                type="button"
                onClick={() => salvaConsenso('no')}
                className="rounded-full border border-inchiostro px-6 py-3 text-sm font-semibold transition-colors duration-300 hover:bg-inchiostro hover:text-crema"
              >
                Rifiuta
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
