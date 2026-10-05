import { ImageResponse } from 'next/og'

// Anteprima per i social, generata in automatico
export const alt = 'Brace & Peperino — Smash burger nel cuore della Tuscia'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'radial-gradient(60% 70% at 50% 0%, #3a2a17, #0E0C0A 70%)',
          color: '#F5EBDD',
        }}
      >
        <div style={{ fontSize: 150, fontWeight: 900, letterSpacing: -2, textTransform: 'uppercase', lineHeight: 0.9, display: 'flex' }}>
          Brace&nbsp;<span style={{ color: '#FFB020' }}>&amp;</span>&nbsp;Peperino
        </div>
        <div style={{ marginTop: 30, fontSize: 36, color: '#B8AB9A' }}>Smash burger nel cuore della Tuscia</div>
        <div style={{ marginTop: 40, padding: '18px 44px', borderRadius: 999, background: '#FFB020', color: '#0E0C0A', fontSize: 30, fontWeight: 700 }}>Ordina ora</div>
      </div>
    ),
    size,
  )
}
