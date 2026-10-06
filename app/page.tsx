import Preloader from '@/components/Preloader'
import Cursor from '@/components/ui/Cursor'
import Grain from '@/components/ui/Grain'
import Navbar from '@/components/sections/Navbar'
import HeroPanino from '@/components/sections/HeroPanino'
import SecondoBurger from '@/components/sections/SecondoBurger'
import MenuOrdine from '@/components/sections/MenuOrdine'
import Footer from '@/components/sections/Footer'
import BarraOrdine from '@/components/sections/BarraOrdine'

// Una sola pagina, cinque sezioni: hero + panino che si apre, secondo panino, menu e ordine, footer.
export default function Home() {
  return (
    <>
      <Preloader />
      <Navbar />
      <main>
        <HeroPanino />
        <SecondoBurger />
        <MenuOrdine />
      </main>
      <Footer />
      <BarraOrdine />
      <Cursor />
      <Grain />
    </>
  )
}
