// Grana sottile sopra tutta la pagina (rumore SVG, nessuna immagine esterna)
const NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`

export default function Grain() {
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80] opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: NOISE }} />
}
