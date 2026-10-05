import type { Prodotto } from '@/lib/menu'

// Illustrazioni dei contorni e dei dolci, nello stesso stile cartoon del panino
const S = '#1A1A1A'

export default function ProductIcon({ tipo, className }: { tipo: Prodotto['icona']; className?: string }) {
  return (
    <svg viewBox="0 0 160 140" className={className} aria-hidden="true">
      {tipo === 'patatine' && (
        <>
          {[44, 60, 76, 92, 108].map((x, i) => (
            <rect key={x} x={x} y={18 + (i % 2) * 10} width="14" height="70" rx="3" fill="#FFC53D" stroke={S} strokeWidth="4" transform={`rotate(${(i - 2) * 6} ${x + 7} 88)`} />
          ))}
          <path d="M34 60 L126 60 L116 128 L44 128 Z" fill="#E63B2E" stroke={S} strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M60 86 q20 14 40 0" fill="none" stroke="#FFF4E0" strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      {tipo === 'anelli' && (
        <>
          {[
            [56, 80],
            [100, 70],
            [80, 104],
          ].map(([x, y]) => (
            <g key={`${x}${y}`}>
              <ellipse cx={x} cy={y} rx="32" ry="24" fill="#E9AE62" stroke={S} strokeWidth="4.5" />
              <ellipse cx={x} cy={y} rx="16" ry="11" fill="#FFF4E0" stroke={S} strokeWidth="4" />
            </g>
          ))}
        </>
      )}
      {tipo === 'spicchi' && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d="M20 0 C50 -6 66 22 52 46 L12 46 C0 30 -4 6 20 0 Z"
              transform={`translate(${30 + i * 24} ${40 + (i % 2) * 22}) rotate(${-20 + i * 14})`}
              fill="#FFC53D"
              stroke={S}
              strokeWidth="4"
              strokeLinejoin="round"
            />
          ))}
          <path d="M108 30 l14 -14 M114 34 l16 -6 M104 24 l4 -16" stroke="#5DBB63" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {tipo === 'tiramisu' && (
        <>
          <path d="M38 40 L122 40 L114 128 L46 128 Z" fill="#FFF4E0" stroke={S} strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M42 70 H118 M44 98 H116" stroke="#7A3E1D" strokeWidth="10" />
          <path d="M38 40 H122" stroke="#7A3E1D" strokeWidth="8" />
          {[58, 80, 102].map((x) => (
            <circle key={x} cx={x} cy="30" r="8" fill="#A0612B" stroke={S} strokeWidth="3.5" />
          ))}
        </>
      )}
      {tipo === 'cheesecake' && (
        <>
          <path d="M24 90 L130 54 L136 104 L30 128 Z" fill="#FFE9A8" stroke={S} strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M30 128 L136 104 L136 116 L30 138 Z" fill="#C9812E" stroke={S} strokeWidth="4" strokeLinejoin="round" />
          <path d="M24 90 L130 54 C126 44 112 40 100 46 L20 80 Z" fill="#FFA41F" stroke={S} strokeWidth="4" strokeLinejoin="round" />
          <path d="M70 66 q6 14 0 24" fill="none" stroke="#FFA41F" strokeWidth="6" strokeLinecap="round" />
        </>
      )}
      {tipo === 'gelato' && (
        <>
          <path d="M56 70 L80 136 L104 70 Z" fill="#E9AE62" stroke={S} strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M64 86 L96 86 M70 102 L90 102" stroke={S} strokeWidth="3" />
          <circle cx="80" cy="52" r="30" fill="#FFF4E0" stroke={S} strokeWidth="4.5" />
          <path d="M62 44 q18 -12 34 4" fill="none" stroke="#C9C34A" strokeWidth="6" strokeLinecap="round" />
          <circle cx="98" cy="30" r="4" fill="#5DBB63" stroke={S} strokeWidth="2" />
        </>
      )}
    </svg>
  )
}
