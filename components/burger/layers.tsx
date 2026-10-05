import type { ReactNode } from 'react'

// Gli strati del panino, disegnati a mano in SVG.
// Ogni strato ha la stessa larghezza (320 unità) e una sua altezza:
// così si possono impilare in qualsiasi ordine per creare panini diversi.

const S = '#1A1A1A' // colore del contorno
const W = 5 // spessore del contorno

export type LayerId =
  | 'bunTop'
  | 'lettuce'
  | 'tomato'
  | 'onion'
  | 'cheese'
  | 'pecorino'
  | 'patty'
  | 'veggie'
  | 'bacon'
  | 'egg'
  | 'sauce'
  | 'hazelnut'
  | 'bunBottom'

export type LayerDef = {
  nome: string
  descrizione: string
  /** altezza del disegno (la larghezza è sempre 320) */
  h: number
  /** quanto lo strato si infila sotto quello sopra quando il panino è chiuso */
  overlap: number
  disegno: ReactNode
}

const seed = (x: number, y: number, r: number) => (
  <ellipse
    key={`${x}-${y}`}
    cx={x}
    cy={y}
    rx={7}
    ry={4}
    transform={`rotate(${r} ${x} ${y})`}
    fill="#FFF4E0"
    stroke={S}
    strokeWidth={3}
  />
)

export const LAYERS: Record<LayerId, LayerDef> = {
  bunTop: {
    nome: 'Pane al sesamo',
    descrizione: 'Lievitato 48 ore, tostato sulla piastra.',
    h: 132,
    overlap: 0,
    disegno: (
      <>
        <path
          d="M14 118 C14 44 80 8 160 8 C240 8 306 44 306 118 Q306 128 296 128 L24 128 Q14 128 14 118 Z"
          fill="#C9812E"
          stroke={S}
          strokeWidth={W}
          strokeLinejoin="round"
        />
        <path d="M52 60 C78 32 118 22 150 22" fill="none" stroke="#E9AE62" strokeWidth={10} strokeLinecap="round" />
        {seed(110, 44, -20)}
        {seed(160, 34, 5)}
        {seed(212, 46, 25)}
        {seed(80, 78, -35)}
        {seed(136, 70, 10)}
        {seed(188, 74, -15)}
        {seed(240, 82, 30)}
        {seed(104, 104, 15)}
        {seed(220, 108, -10)}
      </>
    ),
  },
  lettuce: {
    nome: 'Lattuga croccante',
    descrizione: "Dall'orto vicino, ancora con la rugiada.",
    h: 46,
    overlap: 22,
    disegno: (
      <path
        d="M8 14 Q160 2 312 14 Q316 26 304 30 Q292 42 278 32 Q262 44 246 32 Q230 44 214 32 Q198 44 182 32 Q166 44 150 32 Q134 44 118 32 Q102 44 86 32 Q70 44 54 32 Q38 44 24 32 Q4 30 8 14 Z"
        fill="#5DBB63"
        stroke={S}
        strokeWidth={W}
        strokeLinejoin="round"
      />
    ),
  },
  tomato: {
    nome: 'Pomodoro',
    descrizione: 'Rosso come la facciata del Palazzo dei Priori al tramonto.',
    h: 38,
    overlap: 16,
    disegno: (
      <>
        <rect x={22} y={6} width={136} height={26} rx={13} fill="#E63B2E" stroke={S} strokeWidth={W} />
        <rect x={162} y={6} width={136} height={26} rx={13} fill="#E63B2E" stroke={S} strokeWidth={W} />
        <path d="M50 19 h20 M92 19 h20 M190 19 h20 M232 19 h20" stroke="#FF8A7A" strokeWidth={6} strokeLinecap="round" />
      </>
    ),
  },
  onion: {
    nome: 'Cipolla',
    descrizione: 'Caramellata piano piano, senza far piangere nessuno.',
    h: 32,
    overlap: 14,
    disegno: (
      <>
        {[60, 130, 200, 260].map((x, i) => (
          <ellipse key={x} cx={x} cy={16} rx={i % 2 ? 46 : 40} ry={10} fill="#F4D6EE" stroke={S} strokeWidth={W} />
        ))}
        {[60, 130, 200, 260].map((x) => (
          <ellipse key={`i${x}`} cx={x} cy={16} rx={20} ry={4} fill="none" stroke="#B2569E" strokeWidth={3} />
        ))}
      </>
    ),
  },
  cheese: {
    nome: 'Cheddar fuso',
    descrizione: 'Si scioglie appena lo guardi.',
    h: 52,
    overlap: 22,
    disegno: (
      <path
        d="M14 8 L306 8 L306 22 L290 22 L280 46 L268 22 L210 22 L198 38 L186 22 L120 22 L106 48 L92 22 L40 22 L30 36 L20 22 L14 22 Z"
        fill="#FFA41F"
        stroke={S}
        strokeWidth={W}
        strokeLinejoin="round"
      />
    ),
  },
  pecorino: {
    nome: 'Pecorino della Tuscia',
    descrizione: 'Stagionato nelle grotte di tufo, carattere deciso.',
    h: 40,
    overlap: 16,
    disegno: (
      <>
        <rect x={18} y={6} width={284} height={24} rx={8} fill="#FFE9A8" stroke={S} strokeWidth={W} />
        <circle cx={70} cy={18} r={4} fill={S} />
        <circle cx={150} cy={16} r={5} fill={S} />
        <circle cx={232} cy={19} r={4} fill={S} />
      </>
    ),
  },
  patty: {
    nome: 'Smash di manzo maremmano',
    descrizione: 'Schiacciato sulla piastra rovente: crosticina obbligatoria.',
    h: 62,
    overlap: 24,
    disegno: (
      <>
        <rect x={12} y={6} width={296} height={48} rx={24} fill="#7A3E1D" stroke={S} strokeWidth={W} />
        <path d="M44 22 q20 -6 40 0 M120 34 q20 -6 40 0 M196 22 q20 -6 40 0 M250 38 q14 -4 28 0" fill="none" stroke="#A65A2E" strokeWidth={5} strokeLinecap="round" />
        <circle cx={92} cy={40} r={3} fill="#4A230F" />
        <circle cx={176} cy={20} r={3} fill="#4A230F" />
        <circle cx={232} cy={42} r={3} fill="#4A230F" />
      </>
    ),
  },
  veggie: {
    nome: 'Burger di legumi',
    descrizione: "Ceci, lenticchie e patate dell'Alto Viterbese.",
    h: 60,
    overlap: 24,
    disegno: (
      <>
        <rect x={14} y={6} width={292} height={46} rx={23} fill="#9A8A3A" stroke={S} strokeWidth={W} />
        {[50, 96, 140, 190, 236, 270].map((x, i) => (
          <circle key={x} cx={x} cy={i % 2 ? 22 : 36} r={5} fill="#5DBB63" stroke={S} strokeWidth={2} />
        ))}
      </>
    ),
  },
  bacon: {
    nome: 'Bacon croccante',
    descrizione: 'Affumicato quanto basta per farti girare la testa.',
    h: 40,
    overlap: 16,
    disegno: (
      <>
        <path d="M18 14 q34 -14 68 0 t68 0 t68 0 t68 0 l0 14 q-34 -14 -68 0 t-68 0 t-68 0 t-68 0 z" fill="#C8432F" stroke={S} strokeWidth={W} strokeLinejoin="round" />
        <path d="M30 18 q30 -10 60 0 t60 0 t60 0 t60 0" fill="none" stroke="#FFD2B8" strokeWidth={4} strokeLinecap="round" />
      </>
    ),
  },
  egg: {
    nome: 'Uovo all’occhio di bue',
    descrizione: 'Il tuorlo cola: tieni pronto un tovagliolo.',
    h: 48,
    overlap: 18,
    disegno: (
      <>
        <path d="M30 26 C20 6 90 2 130 8 C170 0 250 2 290 14 C312 24 296 40 260 40 C200 46 120 46 60 42 C30 40 24 34 30 26 Z" fill="#FFFFFF" stroke={S} strokeWidth={W} strokeLinejoin="round" />
        <ellipse cx={168} cy={22} rx={34} ry={14} fill="#FFC53D" stroke={S} strokeWidth={W} />
        <ellipse cx={158} cy={18} rx={8} ry={4} fill="#FFE9A8" />
      </>
    ),
  },
  sauce: {
    nome: 'Salsa della casa',
    descrizione: 'Ricetta segreta. Anche per noi, a volte.',
    h: 34,
    overlap: 14,
    disegno: (
      <path
        d="M20 10 Q160 2 300 10 Q306 20 292 20 Q284 32 274 22 Q240 26 210 20 Q200 30 190 20 Q150 24 110 20 Q100 32 88 20 Q60 24 34 20 Q16 22 20 10 Z"
        fill="#F2883A"
        stroke={S}
        strokeWidth={W}
        strokeLinejoin="round"
      />
    ),
  },
  hazelnut: {
    nome: 'Nocciole dei Cimini',
    descrizione: 'Tostate e sbriciolate: il croccante della montagna.',
    h: 34,
    overlap: 14,
    disegno: (
      <>
        <rect x={26} y={10} width={268} height={14} rx={7} fill="#E3B27A" stroke={S} strokeWidth={4} />
        {[48, 84, 118, 156, 192, 228, 264].map((x, i) => (
          <circle key={x} cx={x} cy={i % 2 ? 12 : 22} r={8} fill="#A0612B" stroke={S} strokeWidth={3} />
        ))}
      </>
    ),
  },
  bunBottom: {
    nome: 'Pane, la base',
    descrizione: 'Regge tutto senza lamentarsi. Un eroe.',
    h: 66,
    overlap: 22,
    disegno: (
      <path
        d="M16 10 L304 10 Q310 10 310 18 L306 40 Q300 58 280 58 L40 58 Q20 58 14 40 L10 18 Q10 10 16 10 Z"
        fill="#C9812E"
        stroke={S}
        strokeWidth={W}
        strokeLinejoin="round"
      />
    ),
  },
}

/** Un singolo strato come SVG autonomo */
export function Layer({ id, className }: { id: LayerId; className?: string }) {
  const l = LAYERS[id]
  return (
    <svg
      viewBox={`0 0 320 ${l.h}`}
      className={className}
      style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}
      aria-hidden="true"
    >
      {l.disegno}
    </svg>
  )
}

/** Margine negativo (in % della larghezza) per "compattare" uno strato sotto quello sopra */
export const overlapMargin = (id: LayerId, first: boolean) =>
  first ? '0%' : `-${(LAYERS[id].overlap / 320) * 100}%`
