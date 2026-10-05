import { ImageResponse } from 'next/og'

// Immagine di anteprima per i social (generata in automatico, nessun file esterno)
export const alt = 'Brace & Peperino — Smash burger nel cuore della Tuscia'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#FFF4E0', padding: 72, flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 26, letterSpacing: 6, textTransform: 'uppercase', color: '#1A1A1A' }}>Viterbo · San Pellegrino</div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 150, lineHeight: 0.9, color: '#1A1A1A', fontFamily: 'serif' }}>
          <span>Brace</span>
          <span style={{ fontStyle: 'italic' }}>
            <span style={{ color: '#E63B2E' }}>&amp;</span>&nbsp;Peperino
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 38, fontStyle: 'italic', color: '#1A1A1A', fontFamily: 'serif' }}>Smash burger nel cuore della Tuscia</div>
          <div style={{ display: 'flex', width: 120, height: 120, borderRadius: 60, background: '#E63B2E' }} />
        </div>
      </div>
    ),
    size,
  )
}
