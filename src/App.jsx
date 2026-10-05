import { MotionConfig } from 'motion/react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Intro from './components/Intro'
import Gallery from './components/Gallery'
import Services from './components/Services'
import HorizontalScroll from './components/HorizontalScroll'
import Contact from './components/Contact'

// La pagina è fatta di "blocchi" (componenti), uno sotto l'altro.
// MotionConfig reducedMotion="user": se nelle impostazioni del telefono/computer
// la persona ha chiesto "riduci movimento", le animazioni vengono attenuate.
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Intro />
        <Gallery />
        <Services />
        <HorizontalScroll />
        <Contact />
      </main>
    </MotionConfig>
  )
}
