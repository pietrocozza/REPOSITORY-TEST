# Canone concordato a Roma (novembre 2026): Via Rialto 18 (trilocale 100 mq) e Via Sora 17 (quadrilocale 90 mq + terrazzo 30 mq)

Research date: 12 Nov 2026. Primary sources: the accordi territoriali on comune.roma.it (downloaded and read: OCR for the scanned 25/07/2023 accordo, text extraction for the 7/08/2023 one), and the Agenzia Entrate GeoPOI-OMI zone polygons and quotazioni, queried directly.

**Quick answer (main accordo of 25/07/2023, contratto agevolato 3+2, unfurnished, no extra bonuses)**
| | Zona OMI / accordo | Superficie convenzionale | Absolute min (fascia A min) | "Normal" flat min (fascia B min) | Max (fascia C max) |
|---|---|---|---|---|---|
| A – Via Rialto 18 | C18 "Cipro (Via Angelo Emo)" | 100 mq | €630/month (€7,560/yr) | €840/month (€10,080/yr) | €1,350/month (€16,200/yr) |
| B – Via Sora 17 | B32 "Centro storico: Corso Vittorio (Ponte, Parione, Regola, S. Eustachio)", zona di pregio | 97.5 mq | €1,228.50/month (€14,742/yr) | €1,647.75/month (€19,773/yr) | €2,817.75/month (€33,813/yr) |

A longer contract (4/5/6+ years) raises the ceiling by +7/8/9%: A up to €1,471.50, B up to €3,071.35 per month. A transitorio can go +10%: A up to €1,485, B up to €3,099.53. Details and caveats follow.

---

## 1. Do the addresses exist in Roma, and where are they (quartiere / municipio / CAP / zona OMI)?

### Takeaway
Both streets exist in Roma Capitale, and both are in Municipio I.
- **Via Rialto** is in Quartiere XIV Trionfale (the "Mercato Trionfale / Via Andrea Doria" area), CAP 00136. Along its whole length it falls in OMI zone **C18 "Cipro (Via Angelo Emo)"**, fascia Semicentrale.
- **Via Sora** is in Rione VI Parione (off Corso Vittorio Emanuele II), CAP 00186. It falls in OMI zone **B32 "C.Storico: Corso Vittorio (Ponte, Parione, Regola, S. Eustachio)"**, fascia Centrale. The accordo classifies B32 as a "zona di pregio".

Neither street sits near a zone boundary, so the exact civic number does not change the result.

### Cited Findings
- OSM/Nominatim returns "Via Rialto, Municipio Roma I, Roma, Roma Capitale, Lazio, 00136" (way 26802894, centre 41.90786, 12.44611; bbox 41.90743–41.90831 N, 12.44535–12.44689 E). A reverse lookup at the street finds a business at "16, Via Rialto … 00136". — [Nominatim search](https://nominatim.openstreetmap.org/search?q=Via+Rialto+18,+Roma&format=json&addressdetails=1); [Nominatim reverse](https://nominatim.openstreetmap.org/reverse?lat=41.9078583&lon=12.4461113&format=json&zoom=18&addressdetails=1)
- OSM/Nominatim returns "Via Sora, Parione, Municipio Roma I, Roma, 00186" (way 60575529, centre 41.89727, 12.47000, plus a service-road segment, way 43573819, at 41.89805, 12.47033). — [Nominatim search](https://nominatim.openstreetmap.org/search?q=Via+Sora+17,+Roma&format=json&addressdetails=1)
- A hospitality listing places "35 Via Rialto" in "Trionfale, 00136 Rome". A Trionfale street-name list includes via Candia, via Cipro, via della Meloria, via Ostia and via Rialto. — [visitrome.com](https://visitrome.com/places-to-stay/roma-in-rosa); [search summary of wiki Trionfale](https://wiki.riteme.site/wiki/Trionfale)
- **OMI zone, checked directly against the Agenzia Entrate GeoPOI polygons** (`zoneomi.php?richiesta=6&codcom=H501`, semesters 2023/1 and 2026/1, point-in-polygon test run locally):
  - All tested points on Via Rialto (both ends, the centre, and the n.16 node) fall in **C18**, in both 2023/1 and 2026/1.
  - All tested points on Via Sora fall in **B32**, in both semesters.
  - The nearest zone boundary is about 167–300 m from Via Rialto (the C18/C40/C41 edges) and about 255–340 m from Via Sora (the B32/B14 edge along the Tiber). — [GeoPOI OMI](https://www1.agenziaentrate.gov.it/servizi/geopoi_omi/index.php); data endpoint `https://www1.agenziaentrate.gov.it/servizi/geopoi_omi/zoneomi.php?richiesta=6&codcom=H501&semestre=20261`
- The GeoPOI OMI card names the zones:
  - C18: "Fascia: Semicentrale, Zona: CIPRO (VIA ANGELO EMO), Codice zona: C18".
  - B32: "Fascia: Centrale, Zona: C.STORICO:CORSO VITTORIO(PONTE,PARIONE,REGOLA,S.EUSTACHIO), Codice zona: B32". — [stampaomi C18](https://www1.agenziaentrate.gov.it/servizi/geopoi_omi/stampaomi.php?H501/RM00000127/20261/R/C18/12.4461113/41.9078583); [stampaomi B32](https://www1.agenziaentrate.gov.it/servizi/geopoi_omi/stampaomi.php?H501/RM00003264/20261/R/B32/12.4700033/41.8972672)
- Same-named streets elsewhere (not Roma city):
  - In the province of Roma: Via Rialto in Nettuno (00042); Via Sora in Anzio–Lavinio (00042) and Nettuno–Cretarossa (00048).
  - Via Rialto in other cities: Bologna, Padova, Albignasego, Udine, Cremona, Gorizia, Rovereto, Belluno, Marostica, Mira, Agliè, Brentonico.
  - Via Sora elsewhere: Milano (a track inside Parco Bosco in Città, which is not residential), Villongo (BG), Casciago (VA), San Bartolomeo Val Cavargna (CO).
  - Source: [Nominatim "Via Rialto, Italia"](https://nominatim.openstreetmap.org/search?q=Via+Rialto,+Italia&format=json&limit=20); [Nominatim "Via Sora, Italia"](https://nominatim.openstreetmap.org/search?q=Via+Sora,+Italia&format=json&limit=20)

### Inferences
- **Via Rialto has a semantic trap.** It is in Quartiere Trionfale, but its accordo/OMI zone is C18 "Cipro", not C43 "Trionfale Igea (Via Mario Fani)" and not C40 Prati or C41 Della Vittoria. Using the quartiere name would give the wrong band.
- **Municipio I** covers both streets because the former Municipio XVII (Prati/Trionfale/Della Vittoria) was merged into Municipio I. This is my contextual knowledge, consistent with OSM's "Municipio Roma I".
- The pairing "Via Rialto + Via Sora" only works plausibly together in Roma city or in Nettuno, which has both street names. Roma is by far the most plausible match for urban apartments of this size. The Nettuno and Anzio streets are governed by those comuni's own accordi and were not analysed.

### Gaps
- Neither civic number (Via Rialto 18, Via Sora 17) is geocoded as an address point in OSM; Overpass queries failed through the proxy. Since both streets are well inside their zones, this does not affect the zone.
- Microzona catastale was not retrieved. Rome's accordo uses OMI zones, not microzone catastali, so it is not needed.

---

## 2. Which Accordo Territoriale is in force (date, signatories, replacement, ISTAT)?

### Takeaway
Roma Capitale's page states: "Sono in vigore i nuovi accordi territoriali". It lists **two parallel 2023 accordi**, each a valid basis for attestazione by its own signatory associations:
1. The **"main" accordo signed 25/07/2023, deposited 27/07/2023**. On the property side: APPC, ARPE, ASPPI, CONFAPPI, CONFEDILIZIA, UPPI and others. On the tenant side: SUNIA, SICET, UNIAT APS Lazio, Unione Inquilini, SAI CISAL. ANPU later adhered. It comes with a separate students' accordo of the same date.
2. The **Confabitare–Unioncasa–Assocasa accordo of 7/08/2023** (Prot. QC/2023/84927, deposited 26/09/2023, in force from 4/09/2023). It includes ordinary, transitorio and student contracts, with DiSCo adhering for students.

Both have passed their 3-year term:
- The 25/07/2023 accordo ran from 28/07/2023, so it ended around 27/07/2026.
- The 7/08/2023 accordo ended on 3/09/2026.

Both explicitly **stay in force until renewal**. I found no evidence of a newer accordo as of November 2026. Both allow (or provide for) ISTAT revaluation of the bands after expiry.

### Cited Findings
- The comune.roma.it page lists:
  - "Accordo territoriale depositato il 27.07.2023";
  - "Accordo territoriale depositato il 27.07.2023 per studenti universitari fuori sede ed equipollenti";
  - "Adesione all'accordo territoriale depositato il 27.07.2023";
  - "Accordo territoriale depositato il 26.09.2023".
  - The 2019 accordi (deposited 28.02.2019 and 05.03.2019) are under "Archivio". — [Roma Capitale – Accordi territoriali per affitti a canone agevolato](https://www.comune.roma.it/web/it/scheda-servizi.page?contentId=INF241325)
- 25/07/2023 accordo, scanned and OCR'd:
  - Premise: "in data 27 febbraio 2022 è scaduto l'accordo territoriale, prot. QC 7177", and "L'Accordo territoriale stipulato il 27 febbraio 2019 è integralmente sostituito dal presente Accordo".
  - Signed "Roma, 25 luglio 2023". The OCR of the signature block shows APPC, ARPE, ASPPI, CONFAPPI, CONFEDILIZIA, UPPI, SAI CISAL, SICET, SUNIA, UNIAT APS LAZIO and UNIONE INQUILINI; one or two names are illegible.
  - Source: [PDF 25/07/2023](https://www.comune.roma.it/web-resources/cms/documents/QC20230082672-ACCORDO_TERRITORIALE_PER_IL_TERRITORIO_DEL_COMUNE_DI_ROMA_CAPITALE__1_.PDF), pp. 1 and 9.
- 25/07/2023 accordo, Titolo G:
  - "ha validità triennale a decorrere dal giorno successivo a quello del deposito. Nel caso di mancato rinnovo dello stesso i canoni di cui alle fasce di oscillazione saranno rivalutati in base alla variazione ISTAT assoluta" (G.1).
  - "Il presente Accordo resta in vigore sino alla sottoscrizione del nuovo Accordo" (G.4). — same PDF, pp. 8–9
- ANPU adhesion letter of 05/09/2023: "è stato stipulato in data 25/07/2023 l'accordo territoriale … depositato il 27/07/2023". ANPU adheres to both the general and the student accordo. — [Adesione ANPU](https://www.comune.roma.it/web-resources/cms/documents/QC20230092205DOC00021320230905115636.PDF)
- 7/08/2023 accordo:
  - Title page: "Accordo Territoriale di Roma Prot. QC/2023/84927 del 7 agosto 2023 … integrato con Errata Corrige Prot. QC/2023/96946 del 22/09/2023". Parties are CONFABITARE (Roma), UNIONCASA (Lazio) and ASSOCASA Roma e Lazio (tenants). It "sostituisce integralmente il precedente Prot. QC/2019/7722" (the 4 March 2019 accordo, which expired 11 March 2022).
  - Art. 6: "entra in vigore il giorno 4 settembre 2023 … Alla scadenza del 3 settembre 2026 e fino alla stipula … di un nuovo Accordo … continuerà ad applicarsi il presente Accordo." After 3/9/2026 the band limits "possono essere incrementati applicando le variazioni ISTAT FOI … tra l'indice del mese di Settembre 2023 e quello … pubblicato alla data di stipula".
  - Source: [PDF 7/08/2023](https://www.comune.roma.it/web-resources/cms/documents/QC20230097987-ACCORDO_TERRITORIALE_DI_ROMA_DEL_7_AGOSTO_2023_SIGNED.PDF), pp. 1–2 and 5.
- Secondary sources agree that the 2023 accordo is still applied in 2026 and expired in 2026 pending renewal. They conflict on the exact dates, because they mix up the two parallel accordi. — [dokicasa](https://dokicasa.it/dokinews/accordo-territoriale-roma-2023); [bonusimmobiliare](https://bonusimmobiliare.it/blog/accordo-territoriale-roma-canone-concordato/); [dellevittorie](https://m.dellevittorie.it/canone-concordato-roma-aggiornamento-accordo-valori-luglio-2023/)

### Inferences
- **Practical rule:** the contract must be attested by an association that signed the accordo it uses. Most landlords use the 25/07/2023 accordo, which has the larger coalition (Confedilizia/APPC/SUNIA/SICET etc.). The Confabitare/Unioncasa/Assocasa accordo gives slightly different numbers (see §3) and more generous transitorio and student premiums.
- **ISTAT in November 2026:**
  - Under the 25/07 accordo, the bands "saranno rivalutati" by 100% of the ISTAT change, presumably measured from July/August 2023.
  - Under the 7/08 accordo, the bands "possono" be raised by the FOI change from September 2023 to the latest published index.
  - Either way the bands below can be raised by roughly the cumulative FOI inflation since mid-2023. I did not retrieve the exact FOI figures (see Gaps).

### Gaps
- I did not find the exact FOI index values (Jul/Sep 2023 to Oct 2026) or an official revalued table. Get the FOI from ISTAT ("Rivaluta") or from the signatory association at attestazione. **Illustration only:** if cumulative FOI were +3%, every €/mq figure below would rise 3%, e.g. A max €1,390.50 and B max €2,902.28.
- I found no official notice of a 2026 renewal. Searches show nothing, and comune.roma.it still lists the 2023 accordi as in force. A renewal signed in the last few weeks cannot be fully excluded.

---

## 3. €/mq/month bands for zones C18 and B32

### Takeaway
| Accordo | Zona | Fascia A (min–max) | Fascia B | Fascia C | Overall |
|---|---|---|---|---|---|
| 25/07/2023 | C18 Cipro | 6.30–8.40 | 8.40–12.00 | 12.00–13.50 | 6.30–13.50 |
| 25/07/2023 | B32 Corso Vittorio (Parione) – "PREGIO" | 12.60–16.90 | 16.90–24.10 | 24.10–28.90 | 12.60–28.90 |
| 7/08/2023 | C18 Cipro (Zone semicentrali, n.45) | 6.25–8.50 | 8.51–12.15 | 12.16–13.60 | 6.25–13.60 |
| 7/08/2023 | B32 (Zone di pregio in tessuto prevalentemente storico, n.14) | 12.55–17.05 | 17.06–24.30 | 24.31–29.00 | 12.55–29.00 |

### Cited Findings
- 25/07/2023, Allegato 1:
  - "C18 CIPRO (VIA ANGELO EMO) 6,30 – 13,50 | 6,30 8,40 | 8,40 12,00 | 12,00 13,50" (section "CENTRALE_SEMICENTRALE", PDF p.10; OCR, checked against the neighbouring rows of the scan).
  - "B32 CORSO VITTORIO (PONTE, PARIONE, REGOLA, S. EUSTACHIO) 12,60 – 28,90 | 12,60 16,90 | 16,90 24,10 | 24,10 28,90" (section "PREGIO", PDF p.17, landscape page, read visually).
  - Source: [PDF 25/07/2023](https://www.comune.roma.it/web-resources/cms/documents/QC20230082672-ACCORDO_TERRITORIALE_PER_IL_TERRITORIO_DEL_COMUNE_DI_ROMA_CAPITALE__1_.PDF)
- 7/08/2023, Allegato 1:
  - Row 14: "B CENTRO STORICO: CORSO VITTORIO (PONTE, PARIONE, REGOLA, S.EUSTACHIO) B32 12,55 29,00 12,55 17,05 17,06 24,30 24,31 29,00" (PDF p.18).
  - Row 45: "C CIPRO (VIA ANGELO EMO) C18 6,25 13,60 6,25 8,50 8,51 12,15 12,16 13,60" (PDF p.19).
  - Source: [PDF 7/08/2023](https://www.comune.roma.it/web-resources/cms/documents/QC20230097987-ACCORDO_TERRITORIALE_DI_ROMA_DEL_7_AGOSTO_2023_SIGNED.PDF)
- Both accordi map areas to OMI zones:
  - 25/07: "aree omogenee definite alla data odierna dalla ripartizione in microzone realizzata dall'OMI/Agenzia delle Entrate … I confini tra le aree si intendono tracciati sulla linea di mezzeria delle varie strade" (Titolo A.2). Maps are those deposited with prot. QC 7177 of 28/02/2019.
  - 7/08: "si assume che il concetto di 'Area Omogenea' coincida con la 'Zona' OMI … come risultante dalle applicazioni cartografiche web ('GeoPOI')" (Art. 3), covering 218 aree. Art. 5: a building crossed by a boundary takes the higher-value area.
- Both accordi allow the fascia A minimum to be lowered only in special cases. The 7/08 accordo (Art. 5) allows it for humanitarian, income or family reasons, or for relatives up to 2nd degree.

### Inferences
- B32 is a "zona di pregio" in both accordi. In the 7/08 accordo it is specifically "in tessuto urbano prevalentemente storico". This matters for how box/posto auto surfaces count (80% / 50%).
- The two accordi differ by only €0.05–0.15/mq. The choice of accordo matters more for the premiums (transitorio +10% vs +20%, students) than for the base bands.

### Gaps
- The 25/07 Allegato 1 is a scanned PDF. The C18 figures come from OCR; the internal structure (6.30/8.40/12.00/13.50) and the neighbouring rows were checked visually. The B32 figures were read directly from the image.

---

## 4. Superficie convenzionale (terrazzi, balconi, caps, large apartments)

### Takeaway
Both accordi use the same scheme:
- 100% of net internal walkable area (calpestabile);
- balconi, terrazze, cantine and similar at up to 25%;
- garden/uncovered private area at up to 15%;
- box at up to 50% (80% in zona pregio);
- shared posto auto at up to 20% (50% in pregio);
- low rooms under 1.70 m at 70%;
- small flats may be increased (+30% if ≤46 mq, capped at 52.90 mq; +15% if 46–70 mq, capped at 70 mq);
- flats **≥120 mq may be reduced by up to 15%**;
- ±5% tolerance.

**A:** 100 mq. No size adjustment applies (it is in the 70–120 range) → **100 mq**.
**B:** 90 + 30 × 25% = **97.5 mq**. The terrace counts at most 7.5 mq; "fino al/non oltre" 25% means the parties may count less.

### Cited Findings
- 25/07/2023, Titolo A.6 (OCR, PDF p.2):
  - a) "l'intera superficie calpestabile dell'unità immobiliare";
  - b) "non oltre il 50% … box; non oltre l'80% in zona PREGIO";
  - c) "non oltre il 20% … posto macchina … di uso comune; non oltre il 50% in zona PREGIO";
  - d) "non oltre il 25% della superficie di balconi, terrazze, cantine ed altri accessori simili";
  - e) "non oltre il 15% della superficie scoperta di pertinenza … comunque non superiore alla superficie calpestabile";
  - f) 10% verde condominiale (by millesimi);
  - g) 70% for rooms under 1.70 m;
  - h) "fino a 46 mq … aumentata del 30% fino ad un massimo di 52,90 mq";
  - i) "superiore a 46 mq e fino a 70 mq … aumentata del 15% fino ad un massimo di 70 mq";
  - l) "pari o superiore a 120 mq … potrà essere ridotta sino ad un massimo del 15%";
  - m) "tolleranza per eccesso o per difetto sino ad un massimo del 5%".
  - The same list is repeated for transitori (Titolo B.7, pp. 4–5). The Allegato 2/B calculation sheet uses "Balconi, terrazze, cantine e simili … x 0,25" (p.20).
  - Source: [PDF 25/07/2023](https://www.comune.roma.it/web-resources/cms/documents/QC20230082672-ACCORDO_TERRITORIALE_PER_IL_TERRITORIO_DEL_COMUNE_DI_ROMA_CAPITALE__1_.PDF)
- 7/08/2023, Art. 7 (PDF pp. 5–6): the same percentages, i.e. f) "fino al 25% della superficie calpestabile di balconi, terrazze, cantine, soffitte…", j/k/l size adjustments and ±5% tolerance. Shared posto auto is capped at 25 mq (2 stalli). The attestation form shows "Balconi, terrazze … x ____ (max 0,25)". — [PDF 7/08/2023](https://www.comune.roma.it/web-resources/cms/documents/QC20230097987-ACCORDO_TERRITORIALE_DI_ROMA_DEL_7_AGOSTO_2023_SIGNED.PDF)

### Inferences
- The 100 mq and 90 mq figures are assumed to be **superficie calpestabile netta**. If they are commercial (gross) areas, the net area will be roughly 10–15% lower and every rent below falls proportionally. This is the single largest uncertainty.
- Neither flat reaches the 120 mq "large flat" reduction. B's convenzionale is 97.5 mq; even with tolerance it stays under 120.
- With the ±5% tolerance, A can be stated as 95–105 mq and B as 92.6–102.4 mq. At the band maximum that is A €1,282.50–1,417.50 and B €2,676.86–2,958.64. I treat tolerance as a measurement allowance, not a lever.

---

## 5. Elements that move the rent within the band and the % adjustments (3+2, transitorio, studenti)

### Takeaway
**Main accordo (25/07/2023):**
- **Gate.** The flat is placed in fascia A if it lacks any of four essentials: water, gas or induction cooking, sewer, adequate heating.
- **Fascia B or C by parameter count.** A "normal" flat goes into fascia B with ≥3 of the 20 parameters and reaches the top of B with 6. It goes into fascia C with ≥7 and reaches the top of C with 9. Within C the value is proportional to the number of parameters.
- **The 20 parameters:**
  1. posto auto
  2. cortile/verde/impianto sportivo comune
  3. cantina
  4. **terrazzo o balcone**
  5. giardino di pertinenza
  6. aria condizionata
  7. **ascensore**
  8. bagno con finestra o **doppi servizi**
  9. porta blindata
  10. doppi vetri
  11. portierato
  12. built or fully renovated in the last 10 years
  13. allarme
  14. cucina abitabile con finestra
  15. videocitofono
  16. antenna centralizzata/satellitare
  17. **riscaldamento autonomo**
  18. palazzina ≤4 piani
  19. superamento barriere architettoniche
  20. terrazzo/locale condominiale comune
- **Percentage adjustments:**
  - furnished +up to 15%;
  - seminterrato −10%;
  - above the 3rd floor without lift −10%;
  - attico +10%;
  - energy class D/E/F +5% and A/B/C +10%;
  - Ecobonus +5%; Sismabonus +10%.
- **Cap.** These adjustments **cannot take the rent above the fascia C maximum**. The exceptions are duration (+7% for 4 years, +8% for 5, +9% for 6 or more) and, for transitori, +10%. Listed buildings (D.Lgs. 42/2004 or cat. A/1, A/8, A/9) get +15% on the bands.
- **Students** use the same bands, capped at the fascia max. A furnished flat with wi-fi gets +10%.

**Confabitare accordo (7/08/2023)** uses a different scoring:
- 30 parameters (Allegato 2/B). Up to 2 parameters → B min; 6 → B max; 7 → C lower half; 8–9 → C upper half; ≥10 → C max.
- Adjustments to the starting value: furnished up to +15%; attico +10%; seminterrato −10%; above 3rd floor without lift −10%; energy class D/E/F +5%, B/C +10%, A +13%; Eco/Superbonus +5% each, max +10%; Sismabonus +10%; student flat within 800 m of the university up to +10%. All capped at the C max.
- After that cap: duration +7/8/9%, listed buildings +15%, transitorio up to +20%, students +4% (≥24 months) or +6% (≥36 months).
- A third-party guarantee of at least 12 months reduces the max by 4%.

### Cited Findings
- 25/07/2023:
  - Titolo A.4: "L'applicazione delle maggiorazioni previste nell'Allegato 2/A … non potranno comunque consentire di superare il valore massimo delle fasce … ad eccezione della maggiorazione per durata superiore ai tre anni".
  - A.7: "+7% … 4 anni, dell'8% … 5 anni e del 9% per … 6 o più anni".
  - A.8: "Per gli alloggi completamente arredati … aumento fino al 15% … seminterrato e … oltre il terzo piano senza ascensore … diminuito … 10%. … attico … incrementato del 10%. … classe energetica D, E ed F … 5%, per classe energetica A, B e C … 10%. … Eco Bonus … 5%. … Sisma Bonus … 10%".
  - A.9: listed buildings "+15%".
  - A.5: annual update ≤75% ISTAT unless cedolare secca.
  - Source: [PDF 25/07/2023](https://www.comune.roma.it/web-resources/cms/documents/QC20230082672-ACCORDO_TERRITORIALE_PER_IL_TERRITORIO_DEL_COMUNE_DI_ROMA_CAPITALE__1_.PDF), pp. 2–3.
- 25/07/2023, Allegato 2/A (pp. 18–19):
  - "L'appartamento carente anche di una sola delle caratteristiche essenziali … si colloca nella fascia A";
  - "si colloca nella fascia B in presenza di almeno 3 (tre) parametri … al valore massimo della fascia B in presenza di 6";
  - "nella fascia C in presenza di almeno 7 … al valore massimo della fascia C in presenza di 9 (nove) parametri, o anche in presenza di aumenti percentuali … All'interno della fascia C il valore verrà individuato in proporzione al numero dei parametri";
  - "In caso di locazione transitoria l'aumento potrà essere del 10%". The 20-parameter list follows.
  - The Allegato 2/B sheet (p.20) prints "A-Ammobiliato + 8%". This conflicts with the "+15%" in the text (A.8, B.10, Allegato 2/A); the article text should prevail. Flagged.
- 25/07/2023, transitori: Titolo B.4, max 18 months. B.6: "potrà subire variazioni fino ad un massimo del 10%". B.13 lists the qualifying needs. — same PDF, pp. 4–6
- Students' accordo 25/07/2023:
  - Art. 4: rent "calcolato sulla base dei criteri stabiliti nell'accordo territoriale … 25 luglio 2023 … non potranno comunque consentire di superare il valore massimo delle fasce"; deposit ≤2 months.
  - Art. 6: "Per l'alloggio ammobiliato si applica una maggiorazione del 10% qualora l'alloggio sia dotato di connessione [wi-fi]" (OCR partly garbled).
  - Contract form: DM Allegato C. Duration 6–36 months per DM 16/01/2017 (general knowledge).
  - Source: [Accordo studenti](https://www.comune.roma.it/web-resources/cms/documents/QC20230082672-ACC_TERR_STUD_UNIV_FUORI_SEDE_COMUNE_ROMA_CAPITALE.PDF), pp. 1–2.
- 7/08/2023: Art. 12, Art. 16 (transitorio "+ … fino ad un massimo del 20%"), Art. 27 (students +4%/+6%, guarantee −4%), Allegato 2/A (VIA scoring and increments A–H), Allegato 2/B (30 parameters). — [PDF 7/08/2023](https://www.comune.roma.it/web-resources/cms/documents/QC20230097987-ACCORDO_TERRITORIALE_DI_ROMA_DEL_7_AGOSTO_2023_SIGNED.PDF), pp. 8–9, 14, 32–35

### Inferences
- A "normal" flat with 0–2 parameters is not explicitly placed by the 25/07 text, which says only "fascia B in presence of at least 3". In practice associations place it at the bottom of B or in A. I therefore show both the fascia A minimum (absolute floor) and the fascia B minimum (realistic floor for a normal flat).
- **Furniture does not raise the ceiling.** Under both accordi it can only help a flat that is below the fascia C maximum to reach it.
- **Duration is the main lever above the ceiling**: +7/8/9% on both min and max, for the whole contract.
- Terrazzo/balcone (B), ascensore, doppi servizi and riscaldamento autonomo are each one parameter (one point). There is no separate %, except energy class, attico, furniture and the bonuses.

---

## 6. Worked calculations: monthly and annual ranges

### Takeaway
See the summary table at the top. Formula: **canone mensile = €/mq (band value, after adjustments) × superficie convenzionale**; canone annuo = mensile × 12.

### Cited Findings (inputs, all from §3–§5)
- A: C18 bands (25/07): 6.30 / 8.40 / 12.00 / 13.50 €/mq; S = 100 mq.
- B: B32 bands (25/07): 12.60 / 16.90 / 24.10 / 28.90 €/mq; S = 90 + 0.25 × 30 = 97.5 mq.
- Sources: the accordo PDFs cited above.

### Calculations: Property A, Via Rialto 18 (C18, S = 100 mq)
Assumptions: net 100 mq; condominio with lift; no box, cantina or terrace stated. Number of parameters unknown, so scenarios are shown.

| Scenario (contratto 3+2, accordo 25/07/2023) | €/mq | Monthly | Annual |
|---|---|---|---|
| Absolute min: "non normale" flat, fascia A min | 6.30 | 630.00 | 7,560 |
| Normal flat, ≤3 parameters, B min | 8.40 | 840.00 | 10,080 |
| 6 parameters (e.g. lift, porta blindata, doppi vetri, videocitofono, antenna, riscaldamento autonomo), B max | 12.00 | 1,200.00 | 14,400 |
| Same 6 parameters + furnished (+15% → 13.80, capped at 13.50) | 13.50 | 1,350.00 | 16,200 |
| 8 parameters, mid of fascia C | 12.75 | 1,275.00 | 15,300 |
| ≥9 parameters (or %-uplifts), C max = **3+2 ceiling** | 13.50 | **1,350.00** | **16,200** |
| C max + 4-year term (+7%) | 14.445 | 1,444.50 | 17,334 |
| C max + 5-year term (+8%) | 14.58 | 1,458.00 | 17,496 |
| C max + 6+-year term (+9%) | 14.715 | 1,471.50 | 17,658 |
| Transitorio (+10% on bands): min 6.93 / max 14.85 | — | 693.00 – 1,485.00 | 8,316 – 17,820 |
| Studenti (whole flat): same bands, capped at max | 6.30 – 13.50 | 630.00 – 1,350.00 | 7,560 – 16,200 |
| *Alt. accordo 7/08/2023: A min / B min / C max* | 6.25 / 8.51 / 13.60 | 625.00 / 851.00 / 1,360.00 | 7,500 / 10,212 / 16,320 |
| *Alt. 7/08: C max + 9% / transitorio +20% / students 36 months +6%* | 14.824 / 16.32 / 14.416 | 1,482.40 / 1,632.00 / 1,441.60 | 17,788.80 / 19,584 / 17,299.20 |

Step example (A, furnished, 6 parameters, class E, 3+2, 25/07 accordo): 12.00 × 1.15 (furnished) × 1.05 (class E) = 14.49 → capped at 13.50 → 13.50 × 100 = €1,350/month. With a 6-year contract: 13.50 × 1.09 = 14.715 → €1,471.50/month.

### Calculations: Property B, Via Sora 17 (B32, S = 97.5 mq)
Superficie: 90 × 100% = 90.0; terrazzo 30 × 25% = 7.5; total **97.5 mq**. If the parties count the terrace at less than 25%, S lies between 90 and 97.5 mq; at 0% the C max would be 28.90 × 90 = €2,601.

| Scenario (contratto 3+2, accordo 25/07/2023) | €/mq | Monthly | Annual |
|---|---|---|---|
| Absolute min: fascia A min | 12.60 | 1,228.50 | 14,742 |
| Normal flat, ≥3 parameters (terrazzo counts as 1), B min | 16.90 | 1,647.75 | 19,773 |
| 6 parameters, B max | 24.10 | 2,349.75 | 28,197 |
| 6 parameters + furnished (24.10 × 1.15 = 27.715, under the cap) | 27.715 | 2,702.21 | 32,426.55 |
| 8 parameters, mid of fascia C | 26.50 | 2,583.75 | 31,005 |
| ≥9 parameters, C max = **3+2 ceiling** | 28.90 | **2,817.75** | **33,813** |
| C max + 4 years (+7%) | 30.923 | 3,014.99 | 36,179.91 |
| C max + 5 years (+8%) | 31.212 | 3,043.17 | 36,518.04 |
| C max + 6+ years (+9%) | 31.501 | 3,071.35 | 36,856.17 |
| If the building is a listed bene culturale (D.Lgs. 42/2004) or A/1-A/8-A/9: bands +15% → max 33.235 | 33.235 | 3,240.41 | 38,884.95 |
| Transitorio (+10%): min 13.86 / max 31.79 | — | 1,351.35 – 3,099.53 | 16,216.20 – 37,194.30 |
| Studenti (whole flat): same bands, capped | 12.60 – 28.90 | 1,228.50 – 2,817.75 | 14,742 – 33,813 |
| *Alt. accordo 7/08/2023: A min / B min / C max* | 12.55 / 17.06 / 29.00 | 1,223.63 / 1,663.35 / 2,827.50 | 14,683.50 / 19,960.20 / 33,930 |
| *Alt. 7/08: C max + 9% / transitorio +20% / students 36 months +6%* | 31.61 / 34.80 / 30.74 | 3,081.98 / 3,393.00 / 2,997.15 | 36,983.70 / 40,716 / 35,965.80 |

### Inferences
- **Realistic ranges for a typical, functioning flat (normal, unfurnished, 3+2):**
  - A: about **€840–1,350/month**;
  - B: about **€1,650–2,820/month**.
- In the historic centre (B), many buildings are vincolati. If the specific building at Via Sora 17 is individually protected, the ceiling rises to about €3,240/month. This must be checked; being in the centro storico UNESCO area alone is probably not enough.
- After expiry, ISTAT revaluation of the bands (§2) adds roughly the cumulative FOI since 2023 on top of every figure.
- The 7/08 accordo gives a similar 3+2 ceiling but a markedly higher transitorio ceiling (+20%). It can only be used through Confabitare, Unioncasa or Assocasa.

### Gaps
- The actual features (number of parameters, floor, lift, energy class, furniture, building listing) were not provided, so the scenarios bracket them.
- The exact ISTAT uplift was not computed.

---

## 7. Comparison: OMI market rents (Agenzia Entrate, 2026 semester 1)

### Takeaway
OMI 2026/1, residenziale, stato NORMALE, €/mq/month on **gross (L) surface**:
- **C18**: abitazioni civili 13.5–19.0; abitazioni economiche 12.0–17.0.
- **B32**: abitazioni civili 18.3–26.3; signorili 20.5–28.8.

The canone concordato ceiling is close to the OMI civili minimum in C18 and above the OMI civili maximum in B32. Note that OMI uses gross surface and the accordo uses net.

### Cited Findings
- C18 "CIPRO (VIA ANGELO EMO)", 2026 semester 1:
  - Abitazioni civili NORMALE: sale €3,700–5,000/mq; locazione 13.5–19 €/mq/month (L).
  - Abitazioni di tipo economico: 12–17 €/mq/month.
  - Box: 8.5–12; posti auto coperti: 7–9.8.
  - Source: [GeoPOI stampaomi C18](https://www1.agenziaentrate.gov.it/servizi/geopoi_omi/stampaomi.php?H501/RM00000127/20261/R/C18/12.4461113/41.9078583)
- B32 "C.STORICO: CORSO VITTORIO (PONTE, PARIONE, REGOLA, S.EUSTACHIO)", 2026 semester 1:
  - Abitazioni civili NORMALE: sale €5,700–7,900/mq; locazione 18.3–26.3 €/mq/month (L).
  - Abitazioni signorili: 20.5–28.8 €/mq/month.
  - Box: 19.5–27.5.
  - Source: [GeoPOI stampaomi B32](https://www1.agenziaentrate.gov.it/servizi/geopoi_omi/stampaomi.php?H501/RM00003264/20261/R/B32/12.4700033/41.8972672)
- The latest available OMI semester is 2026/1, per the GeoPOI semester list (`zoneomi.php?richiesta=5`). — [GeoPOI OMI](https://www1.agenziaentrate.gov.it/servizi/geopoi_omi/index.php)

### Inferences
These apply OMI €/mq to the same surfaces for comparability. Strictly, OMI applies to gross commercial surface, which would be larger.
- **A (100 mq):** OMI civili €1,350–1,900/month (€16,200–22,800/yr). The concordato ceiling of €1,350 equals the OMI minimum, so a concordato contract here is at or below the bottom of the market range.
- **B (97.5 mq):** OMI civili €1,784.25–2,564.25/month; signorili €1,998.75–2,808.00/month. The concordato ceiling of €2,817.75 is roughly at the OMI signorili maximum. Concordato is therefore much more competitive with the market in B32 than in C18, which follows from B32's very wide band.
- The OMI surface convention (DPR 138/98: terraces about 30% up to 25 mq and 10% beyond) differs from the accordo's 25%. Comparisons are therefore indicative only.

### Gaps
- I did not compute OMI values on a properly computed gross commercial surface, because wall thickness and layout are unknown.

---

## PDF scaricati (in /home/user/REPOSITORY-TEST/fonti_pdf/6_canoni_immobili/)
All files were verified with `file` as "PDF document"; there were no failures. None was executed.

| File | URL | Pages | What to read |
|---|---|---|---|
| Roma_Accordo_Territoriale_2023_QC20230082672.pdf (main accordo, signed 25/07/2023, deposited 27/07/2023; **scanned, no text layer**) | https://www.comune.roma.it/web-resources/cms/documents/QC20230082672-ACCORDO_TERRITORIALE_PER_IL_TERRITORIO_DEL_COMUNE_DI_ROMA_CAPITALE__1_.PDF | 38 | **p.1–3** Titolo A (3+2): zones A.2, superficie **A.6 (p.2)**, durata A.7 (p.2), furnished/energy/attico **A.8 (p.3)**, vincolati A.9. **p.4–7** Titolo B transitori (B.6 +10%, B.7 superficie, B.10 adjustments). **p.8–9** Titolo G (validity, ISTAT) and signatures (p.9). **Allegato 1 p.10–17**: **C18 on p.10**, **B32 on p.17** (landscape page, "PREGIO" section). **Allegato 2/A p.18–19** (fascia criteria and 20 parameters). **Allegato 2/B p.20** (calculation sheet). |
| Roma_Accordo_Studenti_2023_QC20230082672.pdf (students' accordo, 25/07/2023; scanned) | https://www.comune.roma.it/web-resources/cms/documents/QC20230082672-ACC_TERR_STUD_UNIV_FUORI_SEDE_COMUNE_ROMA_CAPITALE.PDF | 8 | p.1 Art.1 (beneficiaries, DM Allegato C); **p.2 Art.4** (criteria of the 25/07 accordo, cap at max, deposit) and **Art.6** (furnished +10% with wi-fi) |
| Roma_Accordo_2023_QC20230092205.pdf (ANPU adhesion, 05/09/2023) | https://www.comune.roma.it/web-resources/cms/documents/QC20230092205DOC00021320230905115636.PDF | 1 | p.1 confirms the 25/07/2023 signing and 27/07/2023 deposit |
| Roma_Accordo_Territoriale_7ago2023_signed.pdf (Confabitare–Unioncasa–Assocasa, Prot. QC/2023/84927, deposited 26/09/2023; text PDF) | https://www.comune.roma.it/web-resources/cms/documents/QC20230097987-ACCORDO_TERRITORIALE_DI_ROMA_DEL_7_AGOSTO_2023_SIGNED.PDF | 118 | p.2 parties/premises; p.3 Art.2–3 (OMI zoning); p.4 Art.5 (fasce, boundaries); **p.5 Art.6** (validity to 3/9/2026, ISTAT FOI); **p.5–6 Art.7** (superficie); **p.8 Art.12** (duration +7/8/9%, vincolati +15%, guarantee −4%); p.9 Art.16 (transitorio +20%); p.14 Art.27 (students +4/6%); **Allegato 1 p.18** (B32, row 14) and **p.19** (C18, row 45); **Allegato 2/A p.32–33**; **Allegato 2/B p.34–35** |
| Roma_Accordo_Territoriale_2019_depositato_28022019.pdf (archive, previous accordo, replaced) | https://www.comune.roma.it/web-resources/cms/documents/Accordo_territoriale_depositato_28022019.pdf | 42 | Historical reference only |

Index page: https://www.comune.roma.it/web/it/scheda-servizi.page?contentId=INF241325

## Key assumptions and uncertainty flags (summary)
1. 100 mq and 90 mq are net walkable surfaces. If gross, every rent falls by about 10–15%.
2. The terrace is counted at the full 25% (7.5 mq). The accordo says "non oltre", so it could be less.
3. Zones were assigned with the GeoPOI OMI polygons: Via Rialto → C18 (not Trionfale C43 or Prati C40), Via Sora → B32. The streets are 167 m or more from any boundary. The civic numbers were not geocoded individually.
4. Two parallel accordi are in force. Figures use the 25/07/2023 one (main coalition); the 7/08/2023 alternatives are shown in italics.
5. Both accordi have passed their 3-year term and remain in prorogatio. An ISTAT revaluation of the bands is applicable but was not quantified.
6. Internal inconsistency in the 25/07/2023 accordo: the furniture uplift is +15% in the text but "+8%" on the Allegato 2/B sheet. Either way it cannot push the rent above the band maximum.
7. B32 vincolo: a +15% uplift applies only if the building at Via Sora 17 is individually protected (D.Lgs. 42/2004) or in cat. A/1, A/8 or A/9. Not verified.
