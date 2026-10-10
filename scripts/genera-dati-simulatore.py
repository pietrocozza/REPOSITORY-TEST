"""Genera lib/simulatore-dati.json a partire dai dati aperti di Inside Airbnb (CC BY 4.0).

Uso:
  1. scarica da https://insideairbnb.com/get-the-data/ per Roma e Milano
     data/listings.csv.gz e visualisations/reviews.csv
     e salvali come rome-listings.csv.gz, rome-reviews.csv, milan-listings.csv.gz, milan-reviews.csv
  2. python3 scripts/genera-dati-simulatore.py <cartella-dati> <data-rilevazione AAAA-MM>

Regole:
  - solo case intere, attive (almeno 6 recensioni negli ultimi 12 mesi), prezzo sotto il 99° percentile
  - incasso annuo = stima di Inside Airbnb (notti stimate dalle recensioni x prezzo)
  - fascia mostrata = mediana – 75° percentile degli annunci simili
  - se in una zona ci sono meno di 25 annunci con quel numero di camere, si parte dal dato
    di tutta la zona e si applica il rapporto camere/tutti misurato sull'intera città
  - stagionalità = quota di recensioni lasciate in ogni mese negli ultimi 24 mesi completi
"""
import json, sys
from pathlib import Path
import numpy as np
import pandas as pd

CARTELLA = Path(sys.argv[1])
RILEVAZIONE = sys.argv[2]
USCITA = Path(__file__).resolve().parent.parent / 'lib' / 'simulatore-dati.json'
MINIMO = 25

# Rioni del Municipio I: ogni annuncio va al centro più vicino
RIONI_ROMA = {
    'Monti': (41.8950, 12.4930),
    'Colosseo e Celio': (41.8865, 12.4965),
    'Esquilino e Termini': (41.8985, 12.5045),
    'Trevi e Piazza di Spagna': (41.9045, 12.4815),
    'Pantheon e Navona': (41.8995, 12.4745),
    "Campo de' Fiori e Ghetto": (41.8940, 12.4730),
    'Trastevere': (41.8885, 12.4690),
    'Testaccio e Aventino': (41.8800, 12.4800),
    'Prati': (41.9070, 12.4640),
    'Borgo e Vaticano': (41.9025, 12.4570),
    'Della Vittoria e Mazzini': (41.9195, 12.4610),
    'Castro Pretorio': (41.9060, 12.5020),
}
MUNICIPI_ROMA = {
    'II Parioli/Nomentano': 'Parioli e Nomentano',
    'III Monte Sacro': 'Monte Sacro',
    'IV Tiburtina': 'Tiburtina',
    'V Prenestino/Centocelle': 'Pigneto, Prenestino e Centocelle',
    'VI Roma delle Torri': 'Roma delle Torri',
    'VII San Giovanni/Cinecittà': 'San Giovanni e Cinecittà',
    'VIII Appia Antica': 'Garbatella, Ostiense e Appia',
    'IX Eur': 'Eur',
    'X Ostia/Acilia': 'Ostia e Acilia',
    'XI Arvalia/Portuense': 'Portuense e Magliana',
    'XII Monte Verde': 'Monteverde',
    'XIII Aurelia': 'Aurelio',
    'XIV Monte Mario': 'Monte Mario',
    'XV Cassia/Flaminia': 'Cassia e Flaminio',
}
# Quartieri di Milano (NIL) mostrati per primi; gli altri finiscono in "Altre zone"
CENTRO_MILANO = {
    'DUOMO': 'Duomo', 'BRERA': 'Brera', 'GUASTALLA': 'Guastalla', 'MAGENTA - S. VITTORE': 'Magenta e San Vittore',
    'TICINESE': 'Ticinese', 'NAVIGLI': 'Navigli', 'BUENOS AIRES - VENEZIA': 'Buenos Aires e Porta Venezia',
    'CENTRALE': 'Stazione Centrale', 'GARIBALDI REPUBBLICA': 'Garibaldi e Repubblica', 'ISOLA': 'Isola',
    'SARPI': 'Paolo Sarpi', 'PORTA ROMANA': 'Porta Romana',
}
ALTRI_MILANO = {
    'LORETO': 'Loreto', 'XXII MARZO': 'XXII Marzo', "CITTA' STUDI": 'Città Studi', 'LODI - CORVETTO': 'Lodi e Corvetto',
    'DE ANGELI - MONTE ROSA': 'De Angeli e Monte Rosa', 'MACIACHINI - MAGGIOLINA': 'Maciachini e Maggiolina',
    'WASHINGTON': 'Washington', 'TORTONA': 'Tortona', 'PAGANO': 'Pagano', 'VIALE MONZA': 'Viale Monza',
}


def carica(citta):
    df = pd.read_csv(CARTELLA / f'{citta}-listings.csv.gz', low_memory=False)
    df['prezzo'] = df.price.str.replace(r'[$,]', '', regex=True).astype(float)
    df = df[(df.room_type == 'Entire home/apt') & (df.number_of_reviews_ltm >= 6) & (df.estimated_revenue_l365d > 0)
            & df.prezzo.notna() & df.bedrooms.notna()]
    df = df[df.prezzo < df.prezzo.quantile(0.99)].copy()
    df['camere'] = df.bedrooms.clip(upper=3).astype(int).astype(str)
    return df


def stagionalita(citta, ids):
    r = pd.read_csv(CARTELLA / f'{citta}-reviews.csv', parse_dates=['date'])
    r = r[r.listing_id.isin(ids)]
    fine = pd.Timestamp(f'{RILEVAZIONE}-01')
    r = r[(r.date >= fine - pd.DateOffset(months=24)) & (r.date < fine)]
    quote = r.date.dt.month.value_counts().sort_index()
    return [round(float(q), 4) for q in (quote / quote.sum()).reindex(range(1, 13), fill_value=0)]


def arrotonda(v, passo):
    return int(round(v / passo) * passo)


def statistiche(s):
    return {
        'n': int(len(s)),
        'min': arrotonda(s.estimated_revenue_l365d.median(), 500),
        'max': arrotonda(s.estimated_revenue_l365d.quantile(0.75), 500),
        'tariffa': arrotonda(s.prezzo.median(), 5),
        'notti': int(round(s.estimated_occupancy_l365d.median())),
    }


def costruisci(df, gruppi):
    tutti = statistiche(df)
    rapporti = {c: statistiche(df[df.camere == c]) for c in ['0', '1', '2', '3']}
    zone = []
    for gruppo, nomi in gruppi:
        for nome in nomi:
            z = df[df.zona == nome]
            if len(z) < 30:
                continue
            base = statistiche(z)
            camere = {}
            for c in ['0', '1', '2', '3']:
                s = z[z.camere == c]
                if len(s) >= MINIMO:
                    camere[c] = statistiche(s) | {'stimata': False}
                else:
                    k = rapporti[c]
                    camere[c] = {
                        'n': int(len(s)),
                        'min': arrotonda(base['min'] * k['min'] / tutti['min'], 500),
                        'max': arrotonda(base['max'] * k['max'] / tutti['max'], 500),
                        'tariffa': arrotonda(base['tariffa'] * k['tariffa'] / tutti['tariffa'], 5),
                        'notti': base['notti'],
                        'stimata': True,
                    }
            zone.append({'nome': nome, 'gruppo': gruppo, 'n': int(len(z)), 'camere': camere})
    return zone


def main():
    km = lambda la, lo, a, b: np.hypot((la - a) * 111, (lo - b) * 83)

    roma = carica('rome')
    def zona_roma(r):
        if r.neighbourhood_cleansed == 'I Centro Storico':
            return min(RIONI_ROMA, key=lambda k: km(r.latitude, r.longitude, *RIONI_ROMA[k]))
        return MUNICIPI_ROMA.get(r.neighbourhood_cleansed, r.neighbourhood_cleansed)
    roma['zona'] = roma.apply(zona_roma, axis=1)

    milano = carica('milan')
    nomi_milano = CENTRO_MILANO | ALTRI_MILANO
    milano['zona'] = milano.neighbourhood_cleansed.map(nomi_milano).fillna('Altre zone di Milano')

    dati = {
        'rilevazione': RILEVAZIONE,
        'citta': {
            'roma': {
                'nome': 'Roma',
                'annunci': int(len(roma)),
                'stagionalita': stagionalita('rome', roma.id),
                'zone': costruisci(roma, [
                    ('Centro storico', sorted(RIONI_ROMA)),
                    ('Altri quartieri', sorted(MUNICIPI_ROMA.values())),
                ]),
            },
            'milano': {
                'nome': 'Milano',
                'annunci': int(len(milano)),
                'stagionalita': stagionalita('milan', milano.id),
                'zone': costruisci(milano, [
                    ('Centro e quartieri più richiesti', sorted(CENTRO_MILANO.values())),
                    ('Altri quartieri', sorted(set(ALTRI_MILANO.values())) + ['Altre zone di Milano']),
                ]),
            },
        },
    }
    USCITA.write_text(json.dumps(dati, ensure_ascii=False, indent=1) + '\n')
    print('scritto', USCITA)


main()
