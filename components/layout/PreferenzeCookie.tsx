'use client'

import { GOOGLE_ADS_ID, riapriConsenso } from '@/lib/consenso'

/** Link nel footer per cambiare la scelta sui cookie (solo se il sito usa Google Ads) */
export default function PreferenzeCookie({ className = '' }: { className?: string }) {
  if (!GOOGLE_ADS_ID) return null
  return (
    <>
      {' · '}
      <button type="button" onClick={riapriConsenso} className={className}>
        Preferenze cookie
      </button>
    </>
  )
}
