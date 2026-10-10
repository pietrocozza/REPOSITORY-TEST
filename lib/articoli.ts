// Articoli del blog. Testi originali; i numeri dei grafici sono dati pubblici con la fonte indicata.
// Ogni articolo riporta solo informazioni disponibili alla sua data.

export type Fonte = { nome: string; url: string }

export type Grafico = {
  tipo: 'barre' | 'intervalli'
  titolo: string
  unita: string
  categorie: string[]
  /** per "barre": una o più serie di valori; per "intervalli": [minimo, massimo] per categoria */
  serie: { nome: string; valori: number[] }[]
  fonti: Fonte[]
  nota?: string
}

export type Blocco =
  | { t: 'p'; testo: string }
  | { t: 'h2'; testo: string }
  | { t: 'punti'; voci: { titolo: string; testo: string }[] }
  | { t: 'confronto'; sinistra: { titolo: string; voci: string[] }; destra: { titolo: string; voci: string[] } }
  | { t: 'grafico'; grafico: Grafico }
  | { t: 'img'; src: string; alt: string; didascalia?: string }
  | { t: 'prima-dopo'; prima: string; dopo: string; alt: string }
  | { t: 'citazione'; testo: string }
  | { t: 'numeri'; voci: { valore: string; etichetta: string }[] }
  | { t: 'tappe'; voci: { data: string; testo: string }[] }
  | { t: 'nota'; testo: string }

export type Articolo = {
  slug: string
  titolo: string
  data: string
  categoria: 'Guide' | 'Normativa' | 'Mercato' | 'Gestione'
  estratto: string
  copertina: string
  minuti: number
  blocchi: Blocco[]
}

export const ARTICOLI: Articolo[] = [
  {
    slug: 'giubileo-2025-bilancio',
    titolo: 'Giubileo 2025: com’è andata davvero',
    data: '2026-01-20',
    categoria: 'Mercato',
    estratto: 'Oltre 33 milioni di pellegrini, più delle attese. Cosa ha significato per chi affitta a Roma e cosa resta dopo la chiusura della Porta Santa.',
    copertina: '/img/roma/san-pietro-tevere.jpg',
    minuti: 4,
    blocchi: [
      { t: 'p', testo: 'L’Anno Santo si è chiuso con un numero che pochi avevano messo in conto: secondo il bilancio presentato dalla Santa Sede, i pellegrini arrivati a Roma sono stati 33.475.369, da 185 Paesi.' },
      {
        t: 'grafico',
        grafico: {
          tipo: 'barre',
          titolo: 'Pellegrini del Giubileo 2025: stima e risultato',
          unita: 'milioni',
          categorie: ['Stima della vigilia', 'Pellegrini registrati'],
          serie: [{ nome: 'Pellegrini', valori: [31.79, 33.48] }],
          fonti: [
            { nome: 'Dicastero per l’Evangelizzazione, via Milano Finanza', url: 'https://www.milanofinanza.it/news/giubileo-2025-oltre-33-4-milioni-di-pellegrini-accolti-a-roma-202601051333472355' },
            { nome: 'FSSPX News', url: 'https://fsspx.news/it/news/giubileo-oltre-33-milioni-di-pellegrini-56468' },
          ],
          nota: 'La stima della vigilia (31,8 milioni) è quella riportata nei confronti pubblicati a fine Giubileo.',
        },
      },
      { t: 'h2', testo: 'Cosa ha cambiato per chi affitta' },
      {
        t: 'punti',
        voci: [
          { titolo: 'Domanda distribuita su tutto l’anno', testo: 'Le giornate giubilari erano in calendario da gennaio a dicembre, non solo in alta stagione.' },
          { titolo: 'Ospiti nuovi', testo: 'Pellegrini da 185 Paesi: un pubblico che va oltre il turista classico.' },
          { titolo: 'Basiliche e centro storico', testo: 'I percorsi giubilari passano dalle zone dove si concentrano gli affitti brevi.' },
        ],
      },
      { t: 'h2', testo: 'E adesso?' },
      { t: 'p', testo: 'Il Giubileo ha lasciato una città più abituata ai grandi numeri. Per un proprietario conta una cosa: un appartamento curato, con foto e recensioni forti, resta competitivo anche quando l’evento finisce.' },
    ],
  },
  {
    slug: 'self-check-in-keybox-tar-lazio',
    titolo: 'Self check-in e keybox: cosa ha deciso il TAR',
    data: '2025-06-05',
    categoria: 'Normativa',
    estratto: 'La circolare del Viminale aveva vietato il riconoscimento a distanza degli ospiti. A maggio il TAR del Lazio l’ha annullata. Ecco la vicenda in breve.',
    copertina: '/img/roma/vicolo.jpg',
    minuti: 3,
    blocchi: [
      { t: 'p', testo: 'Per mesi gli host hanno dovuto accogliere ogni ospite di persona. Il motivo era una circolare del Ministero dell’Interno che chiedeva di verificare di persona l’identità di chi entra in casa.' },
      {
        t: 'tappe',
        voci: [
          { data: '18 novembre 2024', testo: 'Circolare del Viminale: niente più identificazione da remoto. Keybox e serrature smart non bastano.' },
          { data: 'Inverno 2025', testo: 'Gli host si riorganizzano con check-in in presenza a ogni arrivo.' },
          { data: '27 maggio 2025', testo: 'Il TAR del Lazio (sentenza n. 10210) annulla la circolare su ricorso della federazione FARE.' },
        ],
      },
      { t: 'h2', testo: 'Perché il TAR l’ha annullata' },
      {
        t: 'punti',
        voci: [
          { titolo: 'Contrasto con la legge', testo: 'Secondo i giudici la circolare andava oltre l’articolo 109 del TULPS.' },
          { titolo: 'Proporzionalità', testo: 'Un obbligo così pesante non era giustificato rispetto allo scopo.' },
          { titolo: 'Istruttoria', testo: 'Mancava un’analisi adeguata delle alternative tecnologiche.' },
        ],
      },
      { t: 'nota', testo: 'La vicenda può avere altri passaggi giudiziari. Prima di scegliere il check-in da remoto verifica sempre le regole in vigore: noi lo facciamo per ogni casa che gestiamo.' },
      { t: 'p', testo: 'Le fonti: Diritto.it e Milano Finanza hanno riportato la sentenza e le motivazioni.' },
    ],
  },
  {
    slug: 'recensioni-cinque-stelle',
    titolo: 'Cinque stelle: le abitudini che fanno la differenza',
    data: '2025-03-12',
    categoria: 'Gestione',
    estratto: 'Le recensioni decidono le prenotazioni. Ecco cosa guardano gli ospiti e cosa ci hanno scritto davvero.',
    copertina: '/img/blog/camera-hotel.jpg',
    minuti: 4,
    blocchi: [
      { t: 'p', testo: 'Su Airbnb ogni soggiorno viene valutato su sei aspetti: pulizia, precisione dell’annuncio, check-in, comunicazione, posizione e qualità-prezzo. Basta un punto debole per perdere la quinta stella.' },
      {
        t: 'punti',
        voci: [
          { titolo: 'Pulizia', testo: 'È la prima cosa che l’ospite nota e l’ultima che dimentica.' },
          { titolo: 'Precisione', testo: 'Foto vere, descrizione onesta, anche sui difetti (come il rumore della strada).' },
          { titolo: 'Check-in', testo: 'Istruzioni chiare e qualcuno raggiungibile all’arrivo.' },
          { titolo: 'Comunicazione', testo: 'Risposte rapide, prima e durante il soggiorno.' },
        ],
      },
      {
        t: 'grafico',
        grafico: {
          tipo: 'barre',
          titolo: 'Le nostre ultime recensioni Airbnb, per lingua',
          unita: 'recensioni',
          categorie: ['Inglese', 'Francese', 'Portoghese'],
          serie: [{ nome: 'Recensioni a 5 stelle', valori: [6, 2, 2] }],
          fonti: [{ nome: 'Recensioni Airbnb verificate da Trustindex, dicembre 2024 – febbraio 2025', url: 'https://www.soluzioneaffitto.com/chi-siamo' }],
          nota: 'Tutte e 10 le recensioni sono a 5 stelle.',
        },
      },
      { t: 'citazione', testo: '“The best airbnb I have ever stayed! … the place looked beautiful exactly like the pictures :) 10/10” — Andrea, gennaio 2025' },
      { t: 'p', testo: 'Una lezione che ci hanno dato gli ospiti stessi: quando la strada è rumorosa, dirlo prima e lasciare dei tappi per le orecchie trasforma un difetto in un gesto di attenzione.' },
    ],
  },
  {
    slug: 'roma-record-turismo-2024',
    titolo: 'Roma da record: 51,4 milioni di presenze nel 2024',
    data: '2025-02-05',
    categoria: 'Mercato',
    estratto: 'Più arrivi, più notti, nuovo massimo storico. I numeri ufficiali del 2024 e cosa dicono a chi ha una casa in centro.',
    copertina: '/img/blog/pantheon-portico.jpg',
    minuti: 3,
    blocchi: [
      { t: 'p', testo: 'Il 2024 è stato l’anno migliore di sempre per il turismo a Roma: 22,2 milioni di arrivi e 51,4 milioni di presenze, cioè di notti trascorse in città.' },
      {
        t: 'grafico',
        grafico: {
          tipo: 'barre',
          titolo: 'Turismo a Roma, 2023 e 2024',
          unita: 'milioni',
          categorie: ['Arrivi', 'Presenze (notti)'],
          serie: [
            { nome: '2023', valori: [21.02, 49.19] },
            { nome: '2024', valori: [22.21, 51.45] },
          ],
          fonti: [{ nome: 'Roma Capitale, Annuario statistico 2024 – Turismo', url: 'https://www.comune.roma.it/web-resources/cms/documents/08_Turismo_Annuario_2024.pdf' }],
        },
      },
      { t: 'numeri', voci: [{ valore: '+5,6%', etichetta: 'arrivi sul 2023' }, { valore: '+4,6%', etichetta: 'presenze sul 2023' }, { valore: '2,3', etichetta: 'notti in media per arrivo' }] },
      { t: 'h2', testo: 'Cosa significa per un proprietario' },
      { t: 'p', testo: 'La domanda c’è. La differenza la fanno la qualità della casa, le foto e la gestione dei prezzi giorno per giorno: in una città così piena, un annuncio curato si distingue subito.' },
    ],
  },
  {
    slug: 'prezzi-dinamici',
    titolo: 'Prezzi dinamici: perché la tariffa fissa non funziona',
    data: '2024-12-16',
    categoria: 'Gestione',
    estratto: 'Anche a Roma l’occupazione cambia molto da un mese all’altro. Una tariffa unica lascia soldi sul tavolo nei mesi pieni e camere vuote in quelli tranquilli.',
    copertina: '/img/blog/agenda.jpg',
    minuti: 4,
    blocchi: [
      { t: 'p', testo: 'Nel 2023, nelle strutture ricettive di Roma, l’occupazione dei posti letto è andata da un minimo del 32% a un massimo del 53,2% a seconda del mese. Una differenza di oltre 20 punti.' },
      {
        t: 'grafico',
        grafico: {
          tipo: 'barre',
          titolo: 'Occupazione mensile dei posti letto a Roma, 2023',
          unita: '%',
          categorie: ['Mese più tranquillo', 'Media dell’anno', 'Mese più pieno'],
          serie: [{ nome: 'Occupazione', valori: [32, 45, 53.2] }],
          fonti: [{ nome: 'ISTAT, Annuario statistico 2024 – Turismo', url: 'https://www.istat.it/storage/ASI/2024/capitoli/C19.pdf' }],
        },
      },
      { t: 'h2', testo: 'Come si lavora sui prezzi' },
      {
        t: 'punti',
        voci: [
          { titolo: 'Ogni giorno ha il suo prezzo', testo: 'Eventi, fiere, ponti e stagioni spostano la domanda: la tariffa li segue.' },
          { titolo: 'Non inseguiamo il prezzo più basso', testo: 'Una casa valorizzata può chiedere tariffe più alte della concorrenza.' },
          { titolo: 'Si analizza il mercato ogni giorno', testo: 'Tariffe che cambiano di giorno in giorno, sulla base di parametri precisi.' },
        ],
      },
      { t: 'p', testo: 'L’obiettivo: un calendario più pieno nei mesi lenti e un ricavo per notte più alto in quelli forti.' },
    ],
  },
  {
    slug: 'cin-codice-identificativo-nazionale',
    titolo: 'CIN: il codice che ogni annuncio deve avere',
    data: '2024-11-25',
    categoria: 'Normativa',
    estratto: 'Dal 1° gennaio 2025 ogni casa in affitto breve deve avere il Codice Identificativo Nazionale. Chi è coinvolto, dove va esposto e cosa si rischia.',
    copertina: '/img/blog/firma.jpg',
    minuti: 3,
    blocchi: [
      { t: 'p', testo: 'Il CIN è un codice unico assegnato dal Ministero del Turismo a ogni immobile destinato a locazione turistica o breve. Lo prevede l’articolo 13-ter del decreto legge 145/2023.' },
      {
        t: 'punti',
        voci: [
          { titolo: 'Chi deve averlo', testo: 'Chi affitta per finalità turistiche, anche una sola casa, e le strutture ricettive.' },
          { titolo: 'Dove va esposto', testo: 'In ogni annuncio online e all’esterno dell’edificio.' },
          { titolo: 'Entro quando', testo: 'Dal 1° gennaio 2025: senza codice l’annuncio può essere rimosso.' },
        ],
      },
      {
        t: 'grafico',
        grafico: {
          tipo: 'intervalli',
          titolo: 'Sanzioni previste',
          unita: '€',
          categorie: ['Casa senza CIN', 'CIN non esposto'],
          serie: [{ nome: 'Da – a', valori: [800, 8000, 500, 5000] }],
          fonti: [
            { nome: 'DL 145/2023, art. 13-ter', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2023-10-18;145' },
            { nome: 'Altroconsumo, Codice CIN', url: 'https://www.altroconsumo.it/casa-energia/casa-condominio/speciali/codice-cin' },
          ],
          nota: 'L’importo varia in base alle dimensioni della struttura.',
        },
      },
      { t: 'p', testo: 'Per le case che gestiamo, la richiesta del CIN e la sua pubblicazione sugli annunci sono incluse nel servizio.' },
    ],
  },
  {
    slug: 'cedolare-secca-26-per-cento',
    titolo: 'Cedolare secca al 26%: cosa cambia dal secondo immobile',
    data: '2024-05-20',
    categoria: 'Normativa',
    estratto: 'La legge di bilancio 2024 ha alzato l’aliquota per gli affitti brevi. L’Agenzia delle Entrate ha chiarito: il 21% resta per un immobile.',
    copertina: '/img/blog/calcolatrice.jpg',
    minuti: 4,
    blocchi: [
      { t: 'p', testo: 'Dal 1° gennaio 2024 la cedolare secca sui redditi da locazione breve sale al 26%. Ma non per tutti: la circolare 10/E del 10 maggio 2024 chiarisce che il 21% si applica ancora a un immobile, scelto dal proprietario.' },
      {
        t: 'grafico',
        grafico: {
          tipo: 'barre',
          titolo: 'Aliquote a confronto nel 2024',
          unita: '%',
          categorie: ['Cedolare 1° immobile', 'Cedolare dal 2°', 'IRPEF fino a 28.000 €', 'IRPEF 28.000–50.000 €', 'IRPEF oltre 50.000 €'],
          serie: [{ nome: 'Aliquota', valori: [21, 26, 23, 35, 43] }],
          fonti: [
            { nome: 'Agenzia delle Entrate, circolare 10/E del 10 maggio 2024', url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/6101220/019_Com.st+Circolare+novit%C3%A0+locazioni+brevi+10.05.24/9e566bee-6fec-4298-677d-6ad0f85b443d' },
            { nome: 'QuiFinanza, Cedolare secca 2024', url: 'https://quifinanza.it/fisco-tasse/cedolare-secca-2024/782997/' },
          ],
        },
      },
      {
        t: 'punti',
        voci: [
          { titolo: 'Scegli tu quale', testo: 'Con più case, una va al 21% e le altre al 26%: si indica in dichiarazione.' },
          { titolo: 'Vale sui redditi dal 2024', testo: 'Conta quando matura l’affitto, non quando è stato firmato il contratto.' },
          { titolo: 'Oltre quattro case', testo: 'L’attività diventa d’impresa: serve la partita IVA e la cedolare non si applica.' },
        ],
      },
      { t: 'nota', testo: 'Ogni situazione fiscale è diversa: per i calcoli sul tuo caso rivolgiti al tuo commercialista.' },
    ],
  },
  {
    slug: 'contributo-di-soggiorno-roma',
    titolo: 'Contributo di soggiorno a Roma: le tariffe dal 1° ottobre',
    data: '2023-10-02',
    categoria: 'Normativa',
    estratto: 'Con la delibera 255/2023 Roma aggiorna il contributo di soggiorno. Quanto pagano gli ospiti di B&B, case vacanza e affittacamere.',
    copertina: '/img/blog/turisti-roma.jpg',
    minuti: 3,
    blocchi: [
      { t: 'p', testo: 'Il contributo lo paga l’ospite, a persona e a notte, fino a un massimo di 10 notti consecutive. Chi gestisce la casa lo incassa, lo dichiara e lo versa al Comune.' },
      {
        t: 'grafico',
        grafico: {
          tipo: 'barre',
          titolo: 'Contributo di soggiorno a Roma per l’extralberghiero',
          unita: '€ a persona per notte',
          categorie: ['Affittacamere cat. 1', 'B&B', 'Case vacanza cat. 1', 'Affittacamere cat. 2', 'Case vacanza cat. 2', 'Affittacamere cat. 3', 'Ostelli', 'Campeggi'],
          serie: [{ nome: 'Tariffa', valori: [7, 6, 6, 6, 5, 5, 3.5, 3] }],
          fonti: [
            { nome: 'Roma Capitale, delibera 255/2023 (riportata da Chekin)', url: 'https://chekin.com/it/blog/tassa-di-soggiorno-roma/' },
            { nome: 'Holidu Magazine', url: 'https://www.holidu.it/magazine/tassa-di-soggiorno-a-roma-tariffe-attuali-e-come-pagarla' },
          ],
        },
      },
      {
        t: 'punti',
        voci: [
          { titolo: 'Esenzioni', testo: 'Sono stabilite dal regolamento comunale: vanno verificate per ogni ospite.' },
          { titolo: 'Dichiarazione', testo: 'Si dichiara e si versa tramite il portale del Comune.' },
          { titolo: 'Con noi', testo: 'Incasso, Alloggiati Web e versamento sono inclusi nei nostri piani.' },
        ],
      },
    ],
  },
  {
    slug: 'home-staging-affitti-brevi',
    titolo: 'Home staging: piccoli interventi, grande effetto',
    data: '2024-03-18',
    categoria: 'Guide',
    estratto: 'Non serve rifare tutto. Luce, colori, tessili e qualche arredo scelto bene cambiano le foto e quindi le prenotazioni.',
    copertina: '/img/blog/soggiorno-staging.jpg',
    minuti: 4,
    blocchi: [
      { t: 'p', testo: 'L’ospite sceglie in pochi secondi, scorrendo le foto. Lo home staging serve a questo: far capire subito com’è vivere quella casa.' },
      { t: 'prima-dopo', prima: '/img/ristrutturazione/leonina-prima-ricostruzione.jpg', dopo: '/img/ristrutturazione/leonina-dopo.jpg', alt: 'Una camera di Via Leonina prima e dopo il nostro intervento' },
      { t: 'h2', testo: 'Cinque mosse che funzionano' },
      {
        t: 'punti',
        voci: [
          { titolo: 'Pareti chiare', testo: 'Una tinteggiatura in toni caldi e luminosi allarga gli spazi in foto.' },
          { titolo: 'Meno mobili, più respiro', testo: 'Via quello che non serve all’ospite: la stanza sembra più grande.' },
          { titolo: 'Tessili nuovi', testo: 'Lenzuola bianche, cuscini e plaid: costano poco e si vedono tanto.' },
          { titolo: 'Luce calda', testo: 'Lampade da tavolo e da terra per le foto al tramonto.' },
          { titolo: 'Un dettaglio del posto', testo: 'Travi a vista, arcate, pavimenti antichi: se ci sono, vanno valorizzati.' },
        ],
      },
      { t: 'img', src: '/img/ristrutturazione/cucina-tre-fasi.jpg', alt: 'Una cucina in tre fasi: prima, durante e dopo', didascalia: 'Una cucina in tre fasi di lavoro.' },
      { t: 'p', testo: 'Poi arrivano le foto professionali: senza, anche il miglior allestimento perde metà del suo effetto.' },
    ],
  },
  {
    slug: 'affitti-media-durata',
    titolo: 'Quando il turismo si ferma: gli affitti di media durata',
    data: '2020-11-20',
    categoria: 'Guide',
    estratto: 'Con i turisti fermi, studenti e lavoratori in trasferta diventano gli ospiti ideali. Le formule di contratto da conoscere.',
    copertina: '/img/blog/calendario.jpg',
    minuti: 4,
    blocchi: [
      { t: 'p', testo: 'In un anno come questo, una casa vuota non è un destino. Tra l’affitto breve e il classico 4+4 ci sono soluzioni intermedie, pensate per chi deve restare in città qualche mese.' },
      {
        t: 'grafico',
        grafico: {
          tipo: 'barre',
          titolo: 'Durata massima per tipo di contratto',
          unita: 'mesi',
          categorie: ['Locazione breve', 'Transitorio', 'Studenti universitari', 'Canone libero (primo periodo)'],
          serie: [{ nome: 'Durata massima', valori: [1, 18, 36, 48] }],
          fonti: [
            { nome: 'Legge 431/1998', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1998-12-09;431' },
            { nome: 'DL 50/2017, art. 4 (locazioni brevi fino a 30 giorni)', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2017-04-24;50' },
          ],
          nota: 'Transitorio: da 1 a 18 mesi. Studenti: da 6 a 36 mesi. Canone libero: 4 anni rinnovabili.',
        },
      },
      {
        t: 'confronto',
        sinistra: { titolo: 'Media durata', voci: ['Ospiti selezionati con un motivo preciso', 'Contratto scritto e registrato', 'Casa di nuovo libera a fine periodo'] },
        destra: { titolo: 'Da valutare', voci: ['Serve una causa di transitorietà documentata', 'Prezzo mensile, non a notte', 'Meno flessibilità durante il contratto'] },
      },
      { t: 'p', testo: 'Appena il turismo riparte, la casa torna agli affitti brevi: la flessibilità resta dalla tua parte.' },
    ],
  },
  {
    slug: 'protocollo-pulizie-sanificazione',
    titolo: 'Pulizie e sanificazione: un protocollo in cinque passi',
    data: '2020-06-10',
    categoria: 'Gestione',
    estratto: 'Con la ripartenza, la pulizia diventa il primo motivo di scelta. I passaggi per preparare una casa tra un ospite e l’altro.',
    copertina: '/img/blog/pulizie.jpg',
    minuti: 3,
    blocchi: [
      { t: 'p', testo: 'Gli ospiti che tornano a viaggiare vogliono una cosa prima di tutto: sapere che la casa è stata pulita a fondo. Un protocollo scritto, uguale per ogni casa, è il modo più semplice per garantirlo.' },
      {
        t: 'punti',
        voci: [
          { titolo: '1. Aria', testo: 'Finestre aperte per tutta la durata delle pulizie.' },
          { titolo: '2. Superfici di contatto', testo: 'Maniglie, interruttori, telecomandi, rubinetti: sanificati uno per uno.' },
          { titolo: '3. Biancheria', testo: 'Sempre pulita e lavata ad alta temperatura.' },
          { titolo: '4. Bagno e cucina', testo: 'Detergenti specifici e panni diversi per ogni ambiente.' },
          { titolo: '5. Controllo finale', testo: 'Una checklist prima di ogni arrivo.' },
        ],
      },
      { t: 'img', src: '/img/blog/letto-bianco.jpg', alt: 'Letto con biancheria bianca fresca', didascalia: 'Biancheria fresca a ogni cambio.' },
      { t: 'p', testo: 'Una casa pulita e sanificata più volte a settimana da professionisti si consuma anche meno di una in affitto tradizionale.' },
    ],
  },
  {
    slug: 'affitto-breve-o-4-piu-4',
    titolo: 'Affitto breve o 4+4? Pro e contro, senza giri di parole',
    data: '2019-04-15',
    categoria: 'Guide',
    estratto: 'Due modi di mettere a reddito la stessa casa. Tasse, flessibilità e rischi a confronto.',
    copertina: '/img/blog/contratto.jpg',
    minuti: 4,
    blocchi: [
      { t: 'p', testo: 'Chi ha un appartamento libero a Roma di solito si fa una domanda: meglio un inquilino fisso o gli ospiti a breve termine? La risposta dipende da quanto tempo vuoi dedicarci e da quanto ti serve la casa.' },
      {
        t: 'grafico',
        grafico: {
          tipo: 'barre',
          titolo: 'Cedolare secca nel 2019',
          unita: '%',
          categorie: ['Locazione breve', 'Canone libero 4+4', 'Canone concordato 3+2'],
          serie: [{ nome: 'Aliquota', valori: [21, 21, 10] }],
          fonti: [{ nome: 'Agenzia delle Entrate, cedolare secca', url: 'https://www.agenziaentrate.gov.it/portale/web/guest/schede/agevolazioni/cedolare-secca/infogen-cedolare-secca' }],
        },
      },
      {
        t: 'confronto',
        sinistra: { titolo: 'Affitto breve', voci: ['Ospiti che pagano in anticipo', 'Casa disponibile quando ti serve', 'Ricavi più alti in zone turistiche', 'Richiede gestione quotidiana'] },
        destra: { titolo: 'Contratto 4+4', voci: ['Canone fisso ogni mese', 'Casa vincolata per anni', 'In caso di morosità lo sfratto richiede tempo', 'Poca gestione'] },
      },
      { t: 'h2', testo: 'La nostra risposta' },
      { t: 'p', testo: 'In centro storico, con una casa curata, l’affitto breve rende di più e lascia libertà. Il lavoro quotidiano che richiede è proprio quello di cui ci occupiamo noi.' },
    ],
  },
]

export const articoloDa = (slug: string) => ARTICOLI.find((a) => a.slug === slug)

export const formattaData = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
