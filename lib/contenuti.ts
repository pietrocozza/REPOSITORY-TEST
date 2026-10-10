// Testi del sito. Ripresi fedelmente da soluzioneaffitto.com (corretti solo refusi e punteggiatura):
// niente numeri, promesse o servizi aggiunti.

// ───────── Home ─────────

export const VANTAGGI = [
  { titolo: 'Guadagni maggiori', testo: 'Lo stesso appartamento può generare fino al 300% in più di ricavi.', numero: 300, suffisso: '%', prefisso: '+' },
  { titolo: 'Protezione OTA', testo: 'Sei protetto da qualunque tipo di danno fino a 3 milioni di euro, a differenza di un contratto a lungo termine.', numero: 3, suffisso: ' mln €', prefisso: '' },
  { titolo: 'Pagamenti anticipati', testo: 'Gli ospiti pagano sempre in anticipo attraverso Booking, Airbnb ecc.' },
  { titolo: 'Flessibilità', testo: 'La tua casa sarà sempre disponibile quando ne avrai bisogno (no 3+2 e 4+4).' },
  { titolo: 'Gestione semplificata', testo: 'Non ci sono rischi di inquilini problematici: il conduttore è un turista (quasi sempre straniero) che viene e va via al termine della vacanza.' },
] as const

export const ZERO = [
  { titolo: 'Limiti', testo: 'Massima flessibilità: puoi decidere come e quando utilizzare il tuo appartamento senza vincoli.' },
  { titolo: 'Rischi', testo: 'Nessun rischio di morosità. Gli ospiti pagano sempre in anticipo prima di soggiornare nel tuo appartamento. Avrai un’assicurazione per ogni problema.' },
  { titolo: 'Spese', testo: 'Ogni spesa per le utenze, le pulizie, il cambio biancheria, ecc. è a completo carico degli ospiti. Non dovrai anticipare nulla.' },
] as const

export const SERVIZI = [
  { titolo: 'Valorizzazione', testo: 'Diamo valore al tuo appartamento con un servizio fotografico professionale, home staging e un restyling se necessario.' },
  { titolo: 'Gestione annuncio', testo: 'Pubblichiamo su tutti i siti di prenotazioni il tuo annuncio con foto e descrizione del tuo appartamento.' },
  { titolo: 'Selezione', testo: 'Selezioniamo i clienti che saranno ospiti nel tuo appartamento, occupandoci di tutte le comunicazioni con loro.' },
  { titolo: 'Accoglienza', testo: 'Accogliamo i clienti al momento del loro arrivo con personale multilingue.' },
  { titolo: 'Manutenzione', testo: 'Ci occupiamo noi della manutenzione grazie a un team dedicato alla tua casa.' },
  { titolo: 'Pulizia', testo: 'Il nostro personale si occupa di mantenere sempre pulito l’appartamento, con la biancheria pulita e profumata.' },
  { titolo: 'Burocrazia', testo: 'Pensiamo noi a tutte le pratiche per avviare la tua attività, nel rispetto delle normative più recenti, inclusi i requisiti del CIN e le disposizioni relative alle keybox, per un avvio senza intoppi e in piena conformità alle leggi.' },
  { titolo: 'Monitoraggio', testo: 'Con un semplice smartphone puoi sapere in tempo reale chi è l’ospite del momento, attraverso quale canale ha prenotato e il prezzo pagato.' },
] as const

export type Appartamento = { nome: string; dettaglio: string; citta: 'Roma' | 'Milano' | null; foto: string }

// Nome e indicazione come negli annunci. La città è indicata solo quando il nome o la zona la rendono certa.
export const APPARTAMENTI: Appartamento[] = [
  { nome: 'Suite Leonina', dettaglio: 'Metro B Cavour · 200 m dal Colosseo', citta: 'Roma', foto: '/img/case/leonina-1.jpg' },
  { nome: 'Suite Don Bosco', dettaglio: 'Metro Giulio Agricola', citta: 'Roma', foto: '/img/case/don-bosco-1.jpg' },
  { nome: 'Villa Chiara', dettaglio: 'Free Parking & Spa', citta: null, foto: '/img/case/villa-chiara.jpg' },
  { nome: 'Brera Apt 1 II', dettaglio: '5 min to Duomo', citta: 'Milano', foto: '/img/case/brera-apt.jpg' },
  { nome: 'Isola Luxe Apt', dettaglio: '150 m Metro Marche', citta: 'Milano', foto: '/img/case/isola-luxe.jpg' },
  { nome: 'Brera Terrace & Free Parking', dettaglio: 'Garibaldi FS', citta: 'Milano', foto: '/img/case/brera-terrace.jpg' },
  { nome: 'Turquoise Apartment', dettaglio: 'Milano Risorgimento', citta: 'Milano', foto: '/img/case/turquoise.jpg' },
  { nome: 'Suite Leonina', dettaglio: 'Metro B Cavour · 200 m dal Colosseo', citta: 'Roma', foto: '/img/case/leonina-2.jpg' },
  { nome: 'Suite Don Bosco', dettaglio: 'Metro Giulio Agricola', citta: 'Roma', foto: '/img/case/don-bosco-2.jpg' },
]

// ───────── Piani di gestione ─────────

export const PIANI = [
  {
    nome: 'Gestione online base',
    sottotitolo: 'Vuoi un avvio col botto? Lascia fare a noi.',
    percentuale: 12,
    voci: [
      'Creazione annuncio SEO',
      'Sincronizzazione dei calendari OTA',
      'Massimizzazione tariffe',
      'Supporto per SCIA e CIN',
      'Servizio fotografico professionale',
      'Comunicazioni con gli ospiti 24/24',
      'Check-in e check-out',
      'Logistica staff delle pulizie',
      'Copertura assicurativa',
      'Alloggiati Web e imposta di soggiorno',
      'Manutenzione e riparazioni',
      'Home staging affitti brevi',
    ],
  },
  {
    nome: 'Gestione completa',
    sottotitolo: 'Tutto incluso: dimenticati e incassa.',
    percentuale: 20,
    voci: [
      'Creazione annuncio SEO',
      'Channel manager prenotazioni',
      'Massimizzazione tariffe',
      'Adempimenti normativi d’inizio attività',
      'Servizio fotografico professionale',
      'Comunicazioni con gli ospiti 24/24',
      'Check-in e check-out',
      'Logistica staff delle pulizie',
      'Copertura assicurativa',
      'Alloggiati Web e imposta di soggiorno',
      'Manutenzione e riparazioni',
      'Home staging affitti brevi',
    ],
  },
] as const

export const EXTRA = [
  'Consulenza per le strategie di prezzo e occupazione',
  'Consulenza di interior design per affitti brevi',
  'Affitto garantito con sublocazione direttamente a noi (solo immobili selezionati)',
] as const

// ───────── Recensioni (verificate da Trustindex sul sito attuale, tutte 5 stelle) ─────────

export type Recensione = { nome: string; data: string; testo: string; lingua?: string }

export const RECENSIONI_GOOGLE: Recensione[] = [
  {
    nome: 'Giulia Greco',
    data: '2025-02-13',
    testo:
      'Dopo aver incontrato e valutato diverse agenzie, avevo deciso di affidarmi a Soluzione Affitto perché mi sembravano riuscire a combinare un approccio strutturato e professionale con uno più umano e personalizzato. Essendo una persona molto esigente, posso dire con certezza che, dopo oltre un anno di collaborazione, non avrei potuto fare una scelta migliore. I ragazzi sono sempre stati disponibili e pronti ad aiutarmi, andando spesso oltre le aspettative del loro ruolo.',
  },
  {
    nome: 'Niccolò Fabbri',
    data: '2025-02-19',
    testo:
      'Il servizio offerto è davvero valido, essendo io proprietario di un appartamento ma fuori zona, mi sono avvalso della loro collaborazione, che consiste nella gestione della chat con gli affittuari, del check-in e della pulizia, aspetti che non avrei potuto gestire direttamente. Consigliato.',
  },
  {
    nome: 'Andreas Martin Fedrigo D’Este Vignoli Babich',
    data: '2025-02-13',
    testo: 'Ho affidato casa mia a questa giovane realtà da oltre un anno e mi trovo veramente bene. Bravi, empatici e sempre operativi.',
  },
  {
    nome: 'Riccardo Fabbri',
    data: '2025-02-19',
    testo:
      'Hanno gestito la mia prenotazione con grande professionalità, l’ambiente e l’arredo confortevoli, check-in fatto in modo eccellente. Molto professionali e disponibili.',
  },
]

export const RECENSIONI_AIRBNB: Recensione[] = [
  { nome: 'Andrea', data: '2025-01-02', lingua: 'en', testo: 'The best airbnb I have ever stayed! It is located in a safe area just a few meters from Cavour station, there are also lots of restaurants and cafes nearby. The host was extremely nice and attentive, and lastly the place looked beautiful exactly like the pictures :) 10/10' },
  { nome: 'Ines', data: '2025-02-13', lingua: 'en', testo: 'It was amazing! I recommend it to everyone. It is close to the coleseum, train station,…. The room was just like the pictures, Beautiful!' },
  { nome: 'Mingfei', data: '2025-02-04', lingua: 'fr', testo: 'Pietro est un hôte très très serviable et même empressé à satisfaire tous nos besoins. Le logement est très bien situé, entouré par d’excellents pizzerias, fruiteries et de boutiques de mode, et, le plus important, de sites historiques (juste quelques pas à la Colisée). Nous sommes très satisfaits de ce séjour chez Pietro.' },
  { nome: 'Dermott', data: '2025-01-08', lingua: 'en', testo: 'Pietro was a lovely host and very communicative throughout our stay. The location was absolutely amazing, right near the colosseum.' },
  { nome: 'Lidi', data: '2025-02-11', lingua: 'pt', testo: 'igual nas fotos. muitos restaurantes próximos. dá pra conhecer todo bairro a pé, fomos até o Vaticano a pé sem saber!!! tudo é muito perto. anfitrião muito cordial / gentil e respondeu todas as msg prontamente. indico e voltaria! o barulho da rua até achamos divertidos.' },
  { nome: 'Con', data: '2025-01-29', lingua: 'en', testo: 'Great place, location very responsive host and very helpful in every way.' },
  { nome: 'Tessa', data: '2025-01-27', lingua: 'en', testo: 'Great location, the apartment looked just as the photos showed, it was clean and beautifully decorated. Something you have to consider before booking is the noisy surroundings because of the street but they offer solutions for that.' },
  { nome: 'Juliette', data: '2025-01-24', lingua: 'fr', testo: 'Nous avons passé un excellent séjour chez Pietro. L’appartement était très propre et conforme aux photos. Lors de notre première soirée, le quartier était un peu bruyant, mais cela ne nous a pas surpris, ayant lu les commentaires précédents. Les autres jours de la semaine ont été relativement calmes. Merci encore, Pietro !' },
  { nome: 'Laura', data: '2025-01-12', lingua: 'pt', testo: 'O espaço é maravilhoso e super bem localizado. Os arredores tem muitas opções de restaurantes e cafeterias e o checkin foi super tranquilo. Pierre e o cohost são muito atenciosos, recomendo.' },
  { nome: 'Zack', data: '2024-12-26', lingua: 'en', testo: 'Pietro’s place was conveniently located just less than 5 minutes walk away from Cavour station, one stop away from Termini. The neighbourhood had plenty of amenities, and was a short walk away to Colesseum. The apartment was comfortable and kitchen was well equipped. There was one night when the street below was very noisy up until about 2 am, so we appreciate the earplugs provided by the hosts.' },
]

// Testimonianze dei proprietari (pagina "Vantaggi locazione")
export const TESTIMONIANZE_PROPRIETARI = [
  { citta: 'Roma', nome: 'Nadia T.', testo: 'Ho dato in mano il mio appartamento a Pietro un anno fa. Con la ristrutturazione ha cambiato faccia, più moderno e luminoso, mi piace molto. Non credevo avrebbero rispettato sempre la scadenza anticipata per l’affitto, invece fino ad oggi è tutto regolare. Anche i piccoli danni causati dai clienti sono sempre stati sistemati a loro spese. Ottima scelta!' },
  { citta: 'Roma', nome: 'Leonardo S.', testo: 'Ragazzi affidabili, fino ad ora gli accordi sono stati rispettati. Affitto regolare e in anticipo.' },
  { citta: 'Roma', nome: 'Serena M.', testo: 'Esperienza molto positiva. Rapida risoluzione dei problemi. Molto attenti alle esigenze del proprietario e anche dei loro clienti.' },
  { citta: 'Milano', nome: 'Maria Elena P.', testo: 'Servizio impeccabile. Consigliatissimi!' },
  { citta: 'Milano', nome: 'Marco V.', testo: 'Mi sono affidato a loro con qualche dubbio iniziale, ma si sono dimostrati davvero affidabili. Ogni aspetto dell’affitto è stato gestito in modo puntuale, e non ho mai dovuto preoccuparmi di nulla. L’affitto arriva sempre senza ritardi, e sono soddisfatto della collaborazione.' },
  { citta: 'Milano', nome: 'Roberta I.', testo: 'La cosa che apprezzo di più è la trasparenza. Sin dall’inizio hanno spiegato ogni passaggio e hanno rispettato tutto ciò che era stato concordato. L’affitto arriva sempre puntuale e la casa è gestita in modo impeccabile. Ottima scelta per chi cerca tranquillità.' },
] as const

// ───────── Ristruttura gratis / locazione a noi ─────────

export const VANTAGGI_LOCAZIONE = [
  { titolo: 'Rivalutazione dell’immobile', testo: 'Investiamo nel tuo immobile, migliorando l’aspetto estetico e funzionale con l’aiuto di un designer professionista. Al termine, il tuo appartamento sarà valorizzato e rinnovato esteticamente, senza alcuna spesa da parte tua.' },
  { titolo: 'Incremento del canone', testo: 'In base alle caratteristiche dell’appartamento e alla situazione specifica, valuteremo la possibilità di aumentare il prezzo di locazione rispetto a quello chiesto al momento, per portare ancora più valore.' },
  { titolo: 'Arredamento incluso', testo: 'Alla fine della locazione ti lasceremo il nuovo arredamento, consentendoti di risparmiare e avere un appartamento come nuovo, aumentandone il valore di mercato.' },
  { titolo: 'Stabilità e sicurezza contro la morosità', testo: 'Lavorare con noi ti offre una stabilità che va oltre quella di un inquilino tradizionale. Grazie ai nostri contratti strutturati e a clausole rescissorie che eliminano il rischio di morosità, puoi contare su un flusso costante e sicuro.' },
  { titolo: 'Ispezioni programmate', testo: 'A differenza di una normale locazione, dove non potrai vedere la tua casa per anni, ti offriamo la possibilità di accedere al tuo immobile 1 o 2 volte al mese, garantendoti massima trasparenza e controllo sulla proprietà.' },
  { titolo: 'Manutenzione costante', testo: 'Appena rileviamo un piccolo danno, lo ripariamo immediatamente. La nostra reputazione con gli ospiti è fondamentale e, per garantire un servizio di massima qualità, ogni dettaglio viene curato con attenzione.' },
  { titolo: 'Pagamenti anticipati', testo: 'Ti pagheremo sempre l’affitto in anticipo, a differenza di un classico inquilino, garantendoti flussi di cassa stabili e senza ritardi.' },
  { titolo: 'Affidabilità e serietà', testo: 'Teniamo al tuo appartamento tanto quanto te. Vogliamo che tutti siano soddisfatti e fare in modo che tu possa stare sereno, sapendo che il tuo immobile è in ottime mani.' },
] as const

export type Faq = { domanda: string; risposta: string; punti?: readonly string[]; dopo?: string }

export const FAQ_LOCAZIONE: Faq[] = [
  { domanda: 'Perché dovrei affidarmi a voi per rimodernare il mio appartamento? E se non mi piace il risultato finale?', risposta: 'La ristrutturazione è realizzata con il supporto di un designer professionista, che si assicurerà di mantenere l’appartamento elegante e funzionale. Prima di iniziare qualsiasi lavoro, ti presenteremo un progetto dettagliato per ricevere la tua approvazione. Al termine, il tuo appartamento sarà esteticamente migliorato e valorizzato senza che tu debba investire nulla!' },
  { domanda: 'E se un ospite fa dei danni all’interno dell’appartamento?', risposta: 'Abbiamo a cuore la tua tranquillità. Tutti i nostri appartamenti sono coperti da una polizza assicurativa professionale che protegge sia da danni alla proprietà sia da danni a terzi. Questo significa che, in caso di qualsiasi danno, i costi saranno coperti, senza impatti economici per te. Inoltre, a dimostrazione della nostra serietà, inseriremo nel contratto una clausola di esonero da qualunque tipo di responsabilità nei tuoi confronti: la responsabilità sarà solo nostra.' },
  { domanda: 'I clienti che ospitate sono affidabili?', risposta: 'Comprendiamo la tua esigenza di sicurezza. Per questo motivo selezioniamo con grande cura i clienti che accogliamo. Collaboriamo con la questura per verificare l’identità di ogni singolo ospite e accettiamo solo persone affidabili. Questo processo di selezione garantisce che solo ospiti sicuri e controllati possano soggiornare nel tuo immobile. Sono ospiti solitamente in vacanza e spesso trattano l’appartamento meglio di casa loro.' },
  { domanda: 'Come garantite che l’appartamento rimanga pulito e in buone condizioni con un via vai di ospiti?', risposta: 'L’appartamento verrà pulito e sanificato più volte a settimana da professionisti, garantendo il suo perfetto mantenimento e un’usura estremamente inferiore rispetto a una normale locazione. Inoltre, ogni ospite sa che deve rispettare delle regole di soggiorno che stabiliscono chiaramente cosa è consentito e cosa no all’interno dell’immobile.' },
  { domanda: 'Come faccio a sapere che siete affidabili?', risposta: 'Siamo orgogliosi di poter contare sulle testimonianze di altri proprietari che hanno collaborato con noi a Milano e Roma. I loro feedback confermano la nostra professionalità e l’impegno a garantire la massima tutela per gli interessi dei nostri clienti. Possiamo anche organizzare una chiacchierata con alcuni dei nostri attuali locatori, se desideri conferme dirette.' },
  { domanda: 'Non mi sento protetto solo con le clausole contrattuali. Potete garantire ulteriori tutele?', risposta: 'Certamente. Oltre alle clausole contrattuali standard, prevediamo sempre un garante vincolato per ogni contratto, assicurandoti il pagamento dell’affitto in modo puntuale e senza sorprese. Siamo aperti anche a discuterne in modo più approfondito per accordarci su altre tutele che ti facciano sentire sicuro.' },
  { domanda: 'Il contratto sarà intestato a una società?', risposta: 'No. Il contratto sarà intestato a noi come persone fisiche: potrai usufruire della cedolare secca, una tassazione semplificata che ti permette di risparmiare su imposte di registro e bollo, riducendo i costi rispetto a un contratto con una società.' },
]

// ───────── Domande e risposte (gestione affitti brevi) ─────────

export const FAQ_GESTIONE: Faq[] = [
  { domanda: 'Perché abbiamo scelto il settore degli affitti brevi turistici?', risposta: 'Perché sono gli affitti più sicuri, flessibili e redditizi. Azzeri i rischi di morosità, puoi riprenderti casa quando vuoi, senza vincoli di tempo, e guadagni una cifra sempre superiore a quella di un affitto tradizionale. Con la gestione di Soluzione Affitto hai il vantaggio di non doverti occupare di nulla. Avrai, quindi, una rendita pura, slegata dal tuo tempo e dal tuo impegno.' },
  { domanda: 'Tra tasse, spese e commissione di gestione guadagnerò tanto quanto guadagnerei affittando la casa con i classici contratti di locazione 3+2 o 4+4?', risposta: 'I guadagni sono importanti e li avrai. Ma se stai valutando la formula che ti offre Soluzione Affitto è perché, in primo luogo, non puoi o non vuoi occuparti personalmente di tutte le attività e problematiche che girano intorno agli affitti e perché preferisci uno strumento di gestione più flessibile e meno rischioso. Se ti fiderai delle nostre proposte di restyling mirate a valorizzare al massimo la tua casa, i guadagni che incasserai saranno ben superiori a quelli di un affitto tradizionale, e con il vantaggio di non doverti occupare di nulla. Avrai, quindi, una rendita pura, slegata dal tuo tempo e dal tuo impegno.' },
  { domanda: 'Perché scegliere Soluzione Affitto?', risposta: 'Gestire una casa adibita a locazioni turistiche non è facile, considerate le tante attività che ci sono dietro, anche se Soluzione Affitto lo fa sembrare così. Questo perché abbiamo trasformato ogni aspetto del lavoro (accoglienza, assistenza durante il soggiorno, pulizie, gestione manutenzioni ecc.) in una procedura standardizzata e abbiamo selezionato una rete di fornitori (servizi di pulizie, artigiani ecc.) seri e disponibili che ci aiutano a rendere tutto sempre perfetto. Inoltre, manteniamo un contatto costante e trasparente con i proprietari per condividere obiettivi e criticità.' },
  {
    domanda: 'Cosa fa Soluzione Affitto nello specifico?',
    risposta: 'Una volta che la tua casa è pronta per gli ospiti, Soluzione Affitto gestisce tutto il processo con il fine di ottenere il massimo profitto. Partendo dall’inizio:',
    punti: [
      'Realizziamo il restyling e le foto professionali',
      'Gestiamo gli adempimenti burocratici previsti dalla legge',
      'Pubblicizziamo e promuoviamo la tua struttura sui migliori portali online',
      'Accogliamo gli ospiti e forniamo loro assistenza durante il soggiorno',
      'Puliamo e coordiniamo la manutenzione della casa',
      'Ti giriamo i canoni riscossi',
    ],
  },
  { domanda: 'Cosa copre la commissione di gestione?', risposta: 'La commissione di gestione copre tutte le attività che ti abbiamo elencato al punto precedente.' },
  { domanda: 'A quanto ammonta la commissione di gestione?', risposta: 'La commissione di gestione è determinata da diversi fattori, tra cui la posizione della tua casa, il numero di camere da letto e i servizi per gli ospiti. Contattaci per saperne di più.' },
  { domanda: 'Come faccio a sapere quello che succede dentro la mia casa?', risposta: 'Soluzione Affitto ti consente di mantenere sempre il controllo: avrai infatti accesso alla tua area riservata per tenere sott’occhio il calendario delle prenotazioni e avrai una rendicontazione mensile sull’attività, gli incassi e i costi di gestione. Inoltre, avremo sempre un rapporto telefonico per le questioni più importanti da decidere insieme.' },
  { domanda: 'C’è pericolo che gli ospiti non paghino il canone?', risposta: 'Quello che accade per i contratti di locazione tradizionale (3+2 o 4+4) è che se l’inquilino smette di pagare tu devi attivarti per uno sfratto (e a Roma e Milano sappiamo bene che ci vuole sempre non meno di un anno) e nel frattempo perdi soldi. Con gli affitti brevi turistici azzeri i rischi di morosità o di occupazione abusiva, perché gli ospiti, che sono turisti prevalentemente stranieri, pagano in anticipo tramite i portali e vanno via al termine della vacanza.' },
  { domanda: 'Se voglio utilizzare la mia casa per qualche giorno durante l’anno, oppure se la rivoglio indietro, posso farlo?', risposta: 'La tua casa è, prima di tutto, tua. Uno dei vantaggi che portano gli affitti brevi turistici è proprio questo: invece di vincolarti a un classico contratto di locazione che dura anni, avrai sempre e in ogni momento, dandone preavviso e a condizione di rispettare le prenotazioni degli ospiti già presenti nel tuo calendario, sia la possibilità di abitare o far abitare la tua casa ad amici o parenti per alcuni giorni, sia di rientrare definitivamente nella disponibilità della tua casa.' },
  { domanda: 'Come garantite che l’appartamento rimanga pulito e in buone condizioni con un via vai di ospiti?', risposta: 'L’appartamento verrà pulito e sanificato più volte a settimana da professionisti, garantendo il suo perfetto mantenimento e un’usura estremamente inferiore rispetto a una normale locazione. Inoltre, ogni ospite sa che deve rispettare delle regole di soggiorno che stabiliscono chiaramente cosa è consentito e cosa no all’interno dell’immobile.' },
  { domanda: 'Chi decide le tariffe che pagano gli ospiti?', risposta: 'Molte persone pensano che per guadagnare dagli affitti turistici basti pubblicizzare l’appartamento sui siti internet e il gioco è fatto. Ma ora tu sai quanta attività c’è dietro. Il discorso tariffario è particolarmente delicato. Noi pensiamo che non basti fare i prezzi della concorrenza o addirittura meno. Anzi, proprio il contrario. Come ti abbiamo detto, il processo di gestione parte con la valorizzazione del tuo appartamento e ciò conduce a poter richiedere delle tariffe tendenzialmente più alte. Inoltre, non definiamo una tariffa valida sempre. Al contrario, analizziamo costantemente il mercato e tramite alcuni parametri siamo in grado di stabilire delle tariffe dinamiche che variano di giorno in giorno, il tutto per massimizzare i profitti.' },
  { domanda: 'Come faccio a sapere se siete affidabili?', risposta: 'Siamo orgogliosi di poter contare sulle testimonianze di altri proprietari che hanno collaborato con noi a Milano e Roma. I loro feedback confermano la nostra professionalità e l’impegno a garantire la massima tutela per gli interessi dei nostri clienti. Possiamo anche organizzare una chiacchierata con alcuni dei nostri attuali locatori, se desideri conferme dirette.' },
  { domanda: 'Cosa devo fare per affidare l’immobile a Soluzione Affitto?', risposta: 'Il primo passo è contattarci: ti illustreremo esattamente i nostri servizi, capiremo se la tua casa è adatta per la locazione turistica e concorderemo la commissione di gestione. Se scegli di andare avanti, faremo una visita presso il tuo immobile per progettare l’eventuale restyling e definire il relativo budget. Se troveremo un accordo sulle nostre proposte, firmeremo un contratto di mandato per la gestione della tua casa e in poco tempo saremo online.' },
  { domanda: 'Se gli ospiti mi danneggiano casa?', risposta: 'Mantenere la tua proprietà in eccellenti condizioni è vitale per la nostra reputazione nel settore. La tua casa deve essere sempre pulita e ben tenuta perché gli ospiti devono trovare un alloggio sempre al top: in questo modo lasceranno buone recensioni e stimoleranno la richiesta della tua casa. Ecco perché facciamo un sopralluogo finale per verificare che sia tutto in ordine. Teniamo alla tua proprietà tanto quanto te. Eppure un danno o un incidente può verificarsi. Ecco perché i nostri ospiti firmano un contratto di locazione turistica con il quale si assumono la piena responsabilità per i danni cagionati durante il loro soggiorno. Da parte nostra, se dovessimo riscontrare un danno agiremo immediatamente, documentando il danno con foto e denunciando l’accaduto al portale di prenotazione. Le piattaforme su cui pubblicizziamo la tua casa hanno delle coperture assicurative e, se vorrai, potrai sottoscrivere anche tu specifiche coperture assicurative.' },
  { domanda: 'Su quali portali verrà pubblicizzata la mia casa?', risposta: 'Per mantenere il calendario delle prenotazioni il più pieno e prolifico possibile, pubblicizziamo la tua casa su Airbnb, Booking e Vrbo tramite fotografie di alta qualità e descrizioni personalizzate volte ad affascinare il potenziale ospite. Inoltre, stiamo lavorando per realizzare un nostro sito proprietario per aumentare la visibilità della tua casa.' },
  { domanda: 'Condominio e utenze chi li paga?', risposta: 'Dal momento che non ci sarà un contratto di durata come la locazione tradizionale, tu resti nella disponibilità del tuo immobile e sarai, quindi, tu a pagare il condominio e le utenze. Ciò ti garantisce anche il controllo della situazione.' },
  { domanda: 'Qual è la politica di Soluzione Affitto riguardo agli animali domestici?', risposta: 'La casa è tua e decidi tu se vorrai ospitare o meno animali domestici.' },
  { domanda: 'Che tipo di casa è idonea per gli affitti brevi?', risposta: 'Se hai un appartamento ubicato nelle vicinanze di un sito turistico, il 70% del problema è risolto. Se l’appartamento necessita di qualche ritocco non c’è problema: pensiamo noi, con i nostri home stager, a proporti il restyling migliore al fine di valorizzarlo al meglio e trarne i migliori risultati.' },
]

// ───────── Operazioni immobiliari ─────────

export const CANTIERI = [
  {
    citta: 'Roma',
    titolo: 'Rione Monti — Via Leonina',
    sottotitolo: '1° appartamento storico',
    testo: 'Nel cuore del Rione Monti, a pochi passi dal Colosseo, la trasformazione di un appartamento all’interno di una palazzina storica sottoposta al vincolo storico-artistico. Abbiamo ammodernato l’appartamento, che non era nelle migliori condizioni quando lo abbiamo acquisito, mantenendo però le sue peculiarità, come le travi di legno a vista del colore naturale e le arcate in pietra.',
    foto: '/img/case/leonina-1.jpg',
    stato: 'Completato',
  },
  {
    citta: 'Roma',
    titolo: 'Rione Monti — Via del Tempio della Pace',
    sottotitolo: '2° appartamento storico',
    testo: 'Letteralmente a pochi metri dal Colosseo e dal Foro Romano, in una delle location più esclusive della Capitale, una nuova acquisizione: un trilocale da ristrutturare completamente, al secondo piano senza ascensore di una palazzina del XV secolo. A fine lavori saranno presenti 2 camere matrimoniali con bagno en suite, una cucina a isola e uno spazioso soggiorno con divano letto.',
    foto: '/img/cantieri/tempio-della-pace.jpg',
    stato: 'Nuova acquisizione',
  },
  {
    citta: 'Milano',
    titolo: 'Brera — Via Pietro Maroncelli',
    sottotitolo: '1° appartamento Brera',
    testo: 'Nel primo capitolo del nostro video vi accompagniamo all’interno del cantiere per scoprire i lavori in corso nell’appartamento. Il nostro obiettivo? Raccontarvi questa trasformazione unica, con una seconda parte che svelerà il confronto tra il prima e il dopo.',
    foto: '/img/case/brera-apt.jpg',
    stato: 'Annuncio e foto provvisori',
    video: 'https://www.youtube.com/shorts/4q5nGH3raWE',
  },
  {
    citta: 'Milano',
    titolo: 'San Babila — Corso Monforte',
    sottotitolo: '1° appartamento San Babila',
    testo: 'Stiamo ristrutturando, prevediamo di pubblicare entro aprile 2025.',
    foto: '/img/cantieri/monforte.jpg',
    stato: 'In ristrutturazione',
  },
] as const

// ───────── Versioni brevi per elenchi grafici (riassunti dei testi sopra, nessuna aggiunta) ─────────

export const VANTAGGI_BREVI = [
  { icona: 'grafico', titolo: 'Guadagni maggiori', testo: 'Lo stesso appartamento può rendere fino al 300% in più.', dato: '+300%', foto: '/img/case/terrazza.jpg' },
  { icona: 'scudo', titolo: 'Protezione OTA', testo: 'Coperto da qualunque danno fino a 3 milioni di euro.', dato: '3 mln €', foto: '/img/case/living.jpg' },
  { icona: 'carta', titolo: 'Pagamenti anticipati', testo: 'Gli ospiti pagano sempre prima, tramite Booking e Airbnb.', dato: 'Prima', foto: '/img/case/brera-terrace.jpg' },
  { icona: 'chiave', titolo: 'Flessibilità', testo: 'La casa è tua quando ti serve. Niente 3+2 o 4+4.', dato: 'Sempre tua', foto: '/img/case/soggiorno.jpg' },
  { icona: 'valigia', titolo: 'Gestione semplificata', testo: 'Niente inquilini problematici: ospiti turisti che arrivano e ripartono.', dato: 'Zero pensieri', foto: '/img/case/leonina-2.jpg' },
] as const

export const SERVIZI_BREVI = [
  { icona: 'Valorizzazione', titolo: 'Valorizzazione', testo: 'Foto professionali, home staging e restyling.' },
  { icona: 'Gestione annuncio', titolo: 'Annuncio', testo: 'Su tutti i portali, con foto e descrizione.' },
  { icona: 'Selezione', titolo: 'Selezione ospiti', testo: 'Scegliamo noi gli ospiti e parliamo noi con loro.' },
  { icona: 'Accoglienza', titolo: 'Accoglienza', testo: 'Check-in con personale multilingue.' },
  { icona: 'Manutenzione', titolo: 'Manutenzione', testo: 'Un team dedicato alla tua casa.' },
  { icona: 'Pulizia', titolo: 'Pulizia', testo: 'Casa pulita, biancheria fresca e profumata.' },
  { icona: 'Burocrazia', titolo: 'Burocrazia', testo: 'Pratiche, CIN e keybox: tutto in regola.' },
  { icona: 'Monitoraggio', titolo: 'Monitoraggio', testo: 'Ospiti, canali e prezzi in tempo reale sul telefono.' },
] as const

export const VANTAGGI_LOCAZIONE_BREVI = [
  { icona: 'casa', titolo: 'Casa rivalutata', testo: 'La rinnoviamo con un designer, senza spese per te.' },
  { icona: 'grafico', titolo: 'Canone più alto', testo: 'Valutiamo di aumentarlo rispetto a quello di oggi.' },
  { icona: 'divano', titolo: 'Arredo incluso', testo: 'A fine locazione il nuovo arredamento resta a te.' },
  { icona: 'scudo', titolo: 'Zero morosità', testo: 'Contratti strutturati e clausole rescissorie.' },
  { icona: 'occhio', titolo: 'Ispezioni', testo: 'Puoi vedere la casa 1 o 2 volte al mese.' },
  { icona: 'chiave-inglese', titolo: 'Manutenzione', testo: 'Ogni piccolo danno riparato subito.' },
  { icona: 'carta', titolo: 'Affitto in anticipo', testo: 'Flussi di cassa stabili, senza ritardi.' },
  { icona: 'stretta', titolo: 'Serietà', testo: 'Teniamo alla tua casa quanto te.' },
] as const

// Come funziona la ristrutturazione gratuita (dalle pagine "Ristruttura gratis" e "FAQ locazione")
export const PASSI_LOCAZIONE = [
  { titolo: 'Visita e progetto', testo: 'Visitiamo la casa e ti presentiamo un progetto dettagliato da approvare.' },
  { titolo: 'Lavori a nostre spese', testo: 'Ristrutturiamo con un designer professionista. Tu non anticipi nulla.' },
  { titolo: 'Contratto sicuro', testo: 'Locazione a lungo termine con garante e cedolare secca.' },
  { titolo: 'Affitto in anticipo', testo: 'Ricevi il canone sempre puntuale, in anticipo.' },
] as const

export const CANTIERI_BREVI: Record<string, string> = {
  'Rione Monti — Via Leonina': 'Palazzina storica vincolata, a pochi passi dal Colosseo. Ammodernata conservando travi a vista e arcate in pietra.',
  'Rione Monti — Via del Tempio della Pace': 'Trilocale del XV secolo a pochi metri dal Colosseo e dal Foro. A fine lavori: 2 matrimoniali con bagno en suite, cucina a isola, soggiorno.',
  'Brera — Via Pietro Maroncelli': 'Cantiere in corso: il video racconta la trasformazione, la seconda parte mostrerà il prima e il dopo.',
  'San Babila — Corso Monforte': 'Stiamo ristrutturando, prevediamo di pubblicare entro aprile 2025.',
}
