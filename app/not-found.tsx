import Pulsante from '@/components/ui/Pulsante'

export default function NotFound() {
  return (
    <section className="contenitore flex min-h-[80svh] flex-col items-start justify-center pt-32 pb-20">
      <p className="etichetta mb-6 text-pietra">Errore 404</p>
      <h1 className="titolo-xl max-w-3xl">
        Questa pagina <span className="text-terracotta italic">non esiste</span> più.
      </h1>
      <p className="mt-6 max-w-lg text-pietra">Il sito è stato rinnovato: alcune pagine hanno cambiato indirizzo.</p>
      <div className="mt-10">
        <Pulsante href="/">Torna alla home</Pulsante>
      </div>
    </section>
  )
}
