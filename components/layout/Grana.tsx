// Grana sottile da sabbia stampata sopra tutta la pagina (rumore SVG, nessuna immagine esterna)
const RUMORE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`

export default function Grana() {
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] opacity-[0.06] mix-blend-multiply" style={{ backgroundImage: RUMORE }} />
}
