import Preloader from '@/components/Preloader'
import Cursor from '@/components/ui/Cursor'
import ScrollProgress from '@/components/ui/ScrollProgress'
import BackgroundColor from '@/components/ui/BackgroundColor'
import Grain from '@/components/ui/Grain'
import Doodles from '@/components/ui/Doodles'
import AudioToggle from '@/components/ui/AudioToggle'
import Divider from '@/components/ui/Divider'
import Navbar from '@/components/sections/Navbar'
import Hero from '@/components/sections/Hero'
import BurgerEsploso from '@/components/sections/BurgerEsploso'
import Marquee from '@/components/sections/Marquee'
import Menu from '@/components/sections/Menu'
import Storia from '@/components/sections/Storia'
import Numeri from '@/components/sections/Numeri'
import OrderSection from '@/components/order/OrderSection'
import DoveSiamo from '@/components/sections/DoveSiamo'
import Footer from '@/components/sections/Footer'

// Il sito è una sola pagina: tutte le informazioni si scoprono scorrendo dall'alto in basso.
// Ogni sezione dichiara il suo colore di sfondo (data-bg): crema → giallo → rosso → nero → crema.
export default function Home() {
  return (
    <>
      <Preloader />
      <a href="#menu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-nero focus:px-5 focus:py-3 focus:text-crema">
        Salta al menu
      </a>
      <BackgroundColor />
      <ScrollProgress />
      <Navbar />
      <main className="relative">
        <Doodles />
        <Hero />
        <Divider variante="colata" colore="#FFF4E0" />
        <BurgerEsploso />
        <Marquee />
        <Divider variante="colata" colore="#FFC53D" />
        <Menu />
        <Divider variante="morso" colore="#E63B2E" />
        <Storia />
        <Numeri />
        <Divider variante="colata" colore="#1A1A1A" />
        <OrderSection />
        <DoveSiamo />
      </main>
      <Footer />
      <AudioToggle />
      <Cursor />
      <Grain />
    </>
  )
}
