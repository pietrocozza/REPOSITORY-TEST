// Silhouette stilizzata dei tetti e delle torri medievali di Viterbo, a linea sottile.
// (Ispirata a: Palazzo dei Papi con la loggia ad archi, campanile a fasce, torri di San Pellegrino.)
export default function Skyline({ className, colore = '#1A1A1A', riempimento = 'none' }: { className?: string; colore?: string; riempimento?: string }) {
  return (
    <svg viewBox="0 0 1440 220" preserveAspectRatio="xMidYMax slice" className={className} role="img" aria-label="Profilo dei tetti e delle torri medievali di Viterbo">
      <g fill={riempimento} stroke={colore} strokeWidth="1.5" strokeLinejoin="round">
        {/* case basse */}
        <path d="M0 220 V170 L40 150 L80 170 V140 L130 120 L180 140 V220" />
        {/* torre */}
        <path d="M180 220 V60 H220 V220" />
        <path d="M176 60 L184 52 H216 L224 60" />
        <path d="M192 90 h16 M192 130 h16" />
        {/* case con profferlo (scala esterna) */}
        <path d="M220 220 V150 L270 128 L320 150 V220" />
        <path d="M232 220 L262 186 H296" />
        <path d="M320 220 V160 H380 V220" />
        {/* Palazzo dei Papi con loggia */}
        <path d="M380 220 V110 H600 V220" />
        <path d="M380 110 L390 98 H590 L600 110" />
        {[400, 440, 480, 520, 560].map((x) => (
          <path key={x} d={`M${x} 220 V170 A16 16 0 0 1 ${x + 32} 170 V220`} />
        ))}
        <path d="M392 140 H588" />
        {/* campanile a fasce */}
        <path d="M640 220 V40 H690 V220" />
        <path d="M636 40 L665 12 L694 40" />
        {[70, 100, 130, 160, 190].map((y) => (
          <path key={y} d={`M640 ${y} H690`} />
        ))}
        <path d="M655 52 v12 M675 52 v12" />
        {/* tetti */}
        <path d="M690 220 V150 L740 130 L790 150 V220" />
        <path d="M790 220 V170 L830 152 L870 170 V220" />
        {/* torre merlata */}
        <path d="M870 220 V80 H920 V220" />
        <path d="M870 80 V68 H880 V80 M890 80 V68 H900 V80 M910 80 V68 H920 V80" />
        <path d="M886 110 h18" />
        {/* chiesa */}
        <path d="M920 220 V140 L980 100 L1040 140 V220" />
        <circle cx="980" cy="150" r="14" />
        <path d="M980 100 V80 M972 88 H988" />
        {/* case */}
        <path d="M1040 220 V160 H1100 V220" />
        <path d="M1100 220 V146 L1150 124 L1200 146 V220" />
        <path d="M1112 220 L1140 190 H1170" />
        {/* torre sottile */}
        <path d="M1200 220 V70 H1236 V220" />
        <path d="M1196 70 L1218 46 L1240 70" />
        <path d="M1236 220 V160 L1290 136 L1340 160 V220" />
        <path d="M1340 220 V176 L1390 156 L1440 176 V220" />
        <path d="M0 219 H1440" />
      </g>
    </svg>
  )
}
