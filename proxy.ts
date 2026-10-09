import { NextResponse, type NextRequest } from 'next/server'

// Il vecchio sito WordPress usava indirizzi come /?page_id=14.
// Li rimandiamo (redirect permanente) alle nuove pagine, così link e posizionamento su Google non si perdono.
const VECCHIE_PAGINE: Record<string, string> = {
  '14': '/contatti',
  '19': '/ristruttura-gratis',
  '30': '/chi-siamo',
  '375': '/ristruttura-gratis',
  '510': '/',
  '893': '/domande-e-risposte',
  '937': '/calcola-guadagno',
  '1400': '/operazioni-immobiliari',
  '2283': '/gestione',
  '2713': '/ristruttura-gratis',
}

export function proxy(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('page_id')
  if (!id) return NextResponse.next()
  const url = request.nextUrl.clone()
  url.pathname = VECCHIE_PAGINE[id] ?? '/'
  url.search = ''
  return NextResponse.redirect(url, 308)
}

export const config = {
  matcher: '/',
}
