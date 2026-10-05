// Scooter cartoon del rider (schermata di conferma ordine)
export default function Scooter({ className }: { className?: string }) {
  const S = '#1A1A1A'
  return (
    <svg viewBox="0 0 220 150" className={className} role="img" aria-label="Il rider in scooter sta arrivando">
      {/* fumo */}
      <circle cx="10" cy="112" r="8" fill="#FFF4E0" stroke={S} strokeWidth="3" />
      <circle cx="26" cy="104" r="5" fill="#FFF4E0" stroke={S} strokeWidth="3" />
      {/* bauletto con logo */}
      <rect x="34" y="40" width="54" height="48" rx="8" fill="#E63B2E" stroke={S} strokeWidth="4.5" />
      <path d="M48 64 q13 -16 26 0 Z" fill="#C9812E" stroke={S} strokeWidth="3" />
      <rect x="47" y="66" width="28" height="6" rx="3" fill="#7A3E1D" stroke={S} strokeWidth="2.5" />
      {/* scocca */}
      <path d="M40 112 C40 92 60 88 90 88 L130 88 L150 52 L164 52 L150 96 C170 96 182 104 186 116 L60 120 Z" fill="#FFC53D" stroke={S} strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M160 52 L176 40" stroke={S} strokeWidth="5" strokeLinecap="round" />
      {/* rider */}
      <path d="M100 88 L110 50 L128 50 L134 88 Z" fill="#5DBB63" stroke={S} strokeWidth="4.5" strokeLinejoin="round" />
      <circle cx="118" cy="34" r="17" fill="#FFF4E0" stroke={S} strokeWidth="4.5" />
      <path d="M100 32 a18 18 0 0 1 36 0 Z" fill="#E63B2E" stroke={S} strokeWidth="4" />
      <path d="M128 60 L158 50" stroke={S} strokeWidth="5" strokeLinecap="round" />
      {/* ruote */}
      {[66, 166].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="122" r="20" fill={S} />
          <circle cx={cx} cy="122" r="8" fill="#FFF4E0" />
        </g>
      ))}
    </svg>
  )
}
