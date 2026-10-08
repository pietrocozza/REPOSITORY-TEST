import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CalendarioGoogle, rispostaAgenda } from '../src/integrazioni/calendario.ts'
import type { AccessoGoogle } from '../src/integrazioni/google.ts'

function finto(permesso = true) {
  const chiamate: { url: string; init?: RequestInit }[] = []
  const google = {
    collegato: true,
    ha: (p: string) => permesso && p === 'calendar',
    chiama: async (url: string, init?: RequestInit) => {
      chiamate.push({ url, init })
      if (url.includes('/calendarList')) return { items: [{ id: 'pietro@gmail.com', summary: 'Pietro' }, { id: 'it.italian#holiday', summary: 'Festività', hidden: true }] }
      if (url.includes('/events?'))
        return {
          items: [
            { summary: 'Commercialista', location: 'Via Roma 1', start: { dateTime: '2026-10-09T15:30:00+02:00' }, end: { dateTime: '2026-10-09T16:30:00+02:00' } },
            { summary: 'Pulizie Trastevere', start: { date: '2026-10-09' }, end: { date: '2026-10-10' } },
            { summary: 'annullato', status: 'cancelled', start: { date: '2026-10-09' } },
          ],
        }
      return { htmlLink: 'https://calendar.google.com/x' }
    },
  } as unknown as AccessoGoogle
  return { cal: new CalendarioGoogle(google), chiamate }
}

test('agenda: impegni di tutti i calendari visibili, risposta parlata immediata', async () => {
  const { cal, chiamate } = finto()
  const r = await rispostaAgenda('cosa ho domani in agenda?', cal, new Date('2026-10-08T10:00:00+02:00'))
  assert.match(r ?? '', /^Domani hai 2 impegni: /)
  assert.match(r ?? '', /Commercialista, venerdì 9 ottobre alle 15:30, a Via Roma 1/)
  assert.match(r ?? '', /Pulizie Trastevere, venerdì 9 ottobre \(tutto il giorno\)/)
  assert.ok(!chiamate.some((c) => c.url.includes('holiday')), 'i calendari nascosti non si leggono')
  assert.equal(await rispostaAgenda('aggiungi in agenda la cena di domani', cal), null, 'aggiungere passa da Claude (con permesso)')
  assert.equal(await rispostaAgenda('chi arriva su airbnb?', cal), null)
})

test('agenda: senza il permesso del calendario lo dice; aggiungere un impegno', async () => {
  assert.match((await rispostaAgenda('che impegni ho oggi?', finto(false).cal)) ?? '', /Scollega.*Collega/)
  const { cal, chiamate } = finto()
  await cal.aggiungi({ titolo: 'Check-in ospiti', inizio: '2026-10-12T15:00' })
  const corpo = JSON.parse(String(chiamate.at(-1)?.init?.body))
  assert.equal(corpo.summary, 'Check-in ospiti')
  assert.deepEqual(corpo.start, { dateTime: '2026-10-12T15:00', timeZone: 'Europe/Rome' })
  assert.ok(corpo.end.dateTime)
})
