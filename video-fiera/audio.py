"""Colonna sonora del video: musichetta originale + effetti sonori stupidi.

Tutto è sintetizzato da zero con numpy (nessun campione esterno), così non ci
sono problemi di diritti. Il brano è a 128 BPM: 32 battiti = 15 secondi esatti,
e i tagli del montaggio cadono sui battiti.
"""

import wave

import numpy as np

SR = 48000
BPM = 128
BEAT = 60 / BPM  # 0.46875 s
DURATA = 15.0

rng = np.random.default_rng(7)


# --------------------------------------------------------------------------
# Strumenti di base
# --------------------------------------------------------------------------

def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def nota_hz(nome):
    """'C5' -> frequenza. Solo diesis (es. 'F#4')."""
    nomi = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6,
            "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    lettere, ottava = nome[:-1], int(nome[-1])
    midi = 12 * (ottava + 1) + nomi[lettere]
    return 440.0 * 2 ** ((midi - 69) / 12)


def fase(freq):
    """Fase integrata di una frequenza che può variare nel tempo."""
    return 2 * np.pi * np.cumsum(freq) / SR


def inviluppo(n, attacco=0.005, rilascio=0.05):
    env = np.ones(n)
    a = min(n, int(attacco * SR))
    r = min(n - a, int(rilascio * SR))
    if a:
        env[:a] = np.linspace(0, 1, a)
    if r:
        env[n - r:] *= np.linspace(1, 0, r)
    return env


def filtro_fft(x, basso=None, alto=None, morbido=1.0):
    """Passa-banda nel dominio della frequenza (statico, ma basta e avanza)."""
    n = len(x)
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if alto is not None:  # passa-basso
        g *= 1 / (1 + (f / alto) ** (4 * morbido))
    if basso is not None:  # passa-alto
        g *= 1 / (1 + (basso / np.maximum(f, 1e-3)) ** (4 * morbido))
    return np.fft.irfft(spec * g, n)


def formante(x, centro, larghezza):
    """Esalta una zona di frequenze (per suoni nasali: kazoo, clacson, papera)."""
    n = len(x)
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = 0.25 + np.exp(-((f - centro) / larghezza) ** 2)
    return np.fft.irfft(spec * g, n)


def dente_di_sega(freq, armoniche=30):
    """Dente di sega band-limited (additivo) con frequenza variabile."""
    ph = fase(freq)
    out = np.zeros_like(ph)
    for k in range(1, armoniche + 1):
        mask = (freq * k) < SR / 2 - 500
        out += mask * np.sin(k * ph) / k
    return out


def quadra(freq, armoniche=25):
    ph = fase(freq)
    out = np.zeros_like(ph)
    for k in range(1, 2 * armoniche, 2):
        mask = (freq * k) < SR / 2 - 500
        out += mask * np.sin(k * ph) / k
    return out


def triangolo(freq, armoniche=15):
    ph = fase(freq)
    out = np.zeros_like(ph)
    for i, k in enumerate(range(1, 2 * armoniche, 2)):
        out += ((-1) ** i) * np.sin(k * ph) / (k * k)
    return out


def norm(x, picco=1.0):
    m = np.max(np.abs(x))
    return x * (picco / m) if m > 0 else x


# --------------------------------------------------------------------------
# Musichetta (originale): kazoo + basso "zum-pa" + batteria chiptune
# --------------------------------------------------------------------------

# (nota, battito di inizio, durata in battiti)
MELODIA = [
    # batt. 1 - Do
    ("C5", 0, .5), ("E5", .5, .5), ("G5", 1, .5), ("E5", 1.5, .5), ("C6", 2, 1), ("G5", 3, .5),
    # batt. 2 - Do
    ("A5", 4, .5), ("G5", 4.5, .5), ("E5", 5, .5), ("C5", 5.5, .5), ("D5", 6, 1),
    # batt. 3 - Fa
    ("F5", 8, .5), ("A5", 8.5, .5), ("C6", 9, .5), ("A5", 9.5, .5), ("F5", 10, .5), ("A5", 10.5, .5), ("C6", 11, 1),
    # batt. 4 - Sol
    ("B5", 12, .5), ("A5", 12.5, .5), ("G5", 13, .5), ("F5", 13.5, .5), ("D5", 14, .5), ("B4", 14.5, .5), ("G4", 15, 1),
    # batt. 5 - Do
    ("C5", 16, .5), ("E5", 16.5, .5), ("G5", 17, .5), ("C6", 17.5, .5), ("E6", 18, 1), ("D6", 19, .5), ("C6", 19.5, .5),
    # batt. 6 - La-
    ("A5", 20, .5), ("C6", 20.5, .5), ("A5", 21, .5), ("E5", 21.5, .5), ("A5", 22, 1), ("G5", 23, 1),
    # batt. 7 - Fa / Sol
    ("F5", 24, .5), ("A5", 24.5, .5), ("C6", 25, 1), ("G5", 26, .5), ("B5", 26.5, .5), ("D6", 27, 1),
    # batt. 8 - Do: scaletta e "ta-daaa"
    ("C6", 28, .25), ("G5", 28.25, .25), ("E5", 28.5, .25), ("G5", 28.75, .25), ("C6", 29, 2.6),
]

# accordo per ogni mezza battuta (2 battiti): radice del basso + note dell'accordo
ACCORDI = ["C", "C", "C", "C", "F", "F", "G", "G", "C", "C", "Am", "Am", "F", "G", "C", "C"]
ACC_NOTE = {
    "C": ("C3", ["E4", "G4", "C5"]),
    "F": ("F2", ["F4", "A4", "C5"]),
    "G": ("G2", ["D4", "G4", "B4"]),
    "Am": ("A2", ["E4", "A4", "C5"]),
}


def kazoo(freq, dur):
    t = t_axis(dur)
    vib = 1 + 0.012 * np.sin(2 * np.pi * 5.8 * t) * np.clip(t / 0.12, 0, 1)
    f = freq * vib * (1 + 0.03 * np.exp(-t * 40))  # piccolo "scoop" iniziale
    x = dente_di_sega(f, 40)
    x = formante(x, 900, 500) + 0.6 * formante(x, 2400, 600)
    x += 0.05 * rng.standard_normal(len(t)) * np.abs(np.sin(fase(f) / 2))  # ronzio
    return x * inviluppo(len(t), 0.012, 0.04)


def basso(freq, dur):
    t = t_axis(dur)
    x = triangolo(np.full(len(t), freq))
    return x * np.exp(-t * 5) * inviluppo(len(t), 0.003, 0.03)


def plettro(freqs, dur):
    t = t_axis(dur)
    x = sum(quadra(np.full(len(t), f), 8) for f in freqs) / len(freqs)
    return filtro_fft(x, alto=3000) * np.exp(-t * 14) * inviluppo(len(t), 0.002, 0.02)


def cassa(dur=0.22):
    t = t_axis(dur)
    f = 45 + 110 * np.exp(-t * 30)
    return np.sin(fase(f)) * np.exp(-t * 14)


def rullante(dur=0.16):
    t = t_axis(dur)
    rumore = filtro_fft(rng.standard_normal(len(t)), basso=1200, alto=8000)
    tono = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return (0.6 * norm(rumore) + 0.4 * tono) * np.exp(-t * 22)


def charleston(dur=0.04):
    t = t_axis(dur)
    return norm(filtro_fft(rng.standard_normal(len(t)), basso=7000)) * np.exp(-t * 90)


def musica():
    out = np.zeros(int(DURATA * SR) + SR)

    def metti(x, t0, gain):
        i = int(t0 * SR)
        out[i:i + len(x)] += gain * x[: len(out) - i]

    for nome, b0, bd in MELODIA:
        metti(kazoo(nota_hz(nome), bd * BEAT * 0.92), b0 * BEAT, 0.30)

    for i, acc in enumerate(ACCORDI):
        rad, note = ACC_NOTE[acc]
        b = i * 2
        fine = b >= 30  # ultima mezza battuta: accordo lungo
        metti(basso(nota_hz(rad), BEAT * (2.5 if fine else 0.9)), b * BEAT, 0.55)
        if not fine:
            metti(plettro([nota_hz(n) for n in note], BEAT * 0.6), (b + 1) * BEAT, 0.22)
        else:
            metti(plettro([nota_hz(n) for n in note], BEAT * 2.6), (b + 1) * BEAT, 0.25)

    for b in range(32):
        if b >= 31:
            break
        if b % 2 == 0:
            metti(cassa(), b * BEAT, 0.7)
        else:
            metti(rullante(), b * BEAT, 0.35)
        metti(charleston(), b * BEAT, 0.07)
        metti(charleston(), (b + 0.5) * BEAT, 0.10)
    # piatto finale sul "ta-da"
    t = t_axis(1.6)
    piatto = norm(filtro_fft(rng.standard_normal(len(t)), basso=4000)) * np.exp(-t * 2.8)
    metti(piatto, 29 * BEAT, 0.18)
    metti(cassa(), 29 * BEAT, 0.8)
    return out[: int(DURATA * SR)]


# --------------------------------------------------------------------------
# Effetti sonori stupidi
# --------------------------------------------------------------------------

def sfx_pop(freq=900, dur=0.07):
    t = t_axis(dur)
    f = freq * (1 + 1.2 * np.exp(-t * 60))
    return np.sin(fase(f)) * np.exp(-t * 45) * inviluppo(len(t), 0.001, 0.01)


def sfx_boing(dur=0.75, base=170):
    """Molla da cartone animato."""
    t = t_axis(dur)
    f = base * (1 + 0.9 * np.exp(-t * 3.2) * np.sin(2 * np.pi * 13 * t)) + 120 * np.exp(-t * 6)
    x = np.sin(fase(f)) + 0.35 * np.sin(2 * fase(f)) + 0.15 * np.sin(3 * fase(f))
    return x * np.exp(-t * 3.5) * inviluppo(len(t), 0.003, 0.05)


def sfx_fischietto(dur=0.55, da=500, a=1900):
    """Fischietto a coulisse (slide whistle)."""
    t = t_axis(dur)
    k = t / dur
    f = da * (a / da) ** (k ** 0.8)
    f *= 1 + 0.015 * np.sin(2 * np.pi * 7 * t)
    soffio = filtro_fft(rng.standard_normal(len(t)), basso=1500, alto=6000) * 0.05
    return (np.sin(fase(f)) + soffio) * inviluppo(len(t), 0.03, 0.06)


def sfx_clacson(freq=330, dur=0.2):
    """Trombetta da clown (pa-pè)."""
    t = t_axis(dur)
    f = freq * (1 + 0.25 * np.exp(-t * 35))
    x = np.tanh(2.5 * quadra(f, 20))
    x = formante(x, 1300, 450)
    return x * inviluppo(len(t), 0.004, 0.04)


def sfx_qua(dur=0.22):
    """Verso della papera."""
    t = t_axis(dur)
    f = 260 * (1 + 0.35 * np.exp(-t * 18)) * (1 - 0.25 * t / dur)
    x = dente_di_sega(f, 40)
    x = formante(x, 1100, 300) + 0.5 * formante(x, 2600, 400)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.6
    return x * env


def sfx_esplosione(dur=1.8):
    t = t_axis(dur)
    rumore = rng.standard_normal(len(t))
    rombo = filtro_fft(rumore, alto=350) * np.exp(-t * 2.2)
    schiocco = filtro_fft(rumore, basso=300, alto=5000) * np.exp(-t * 18)
    sub = np.sin(fase(30 + 70 * np.exp(-t * 8))) * np.exp(-t * 3)
    x = 1.4 * norm(rombo) + 0.8 * norm(schiocco) + 1.0 * sub
    return np.tanh(1.8 * x) * inviluppo(len(t), 0.002, 0.3)


def sfx_razzo(dur=0.6):
    """Fischio del razzo che sale + scoppio scoppiettante."""
    t = t_axis(dur)
    f = 1400 + 1600 * (t / dur) ** 1.4
    fischio = np.sin(fase(f)) * 0.5 + 0.15 * filtro_fft(rng.standard_normal(len(t)), basso=2000, alto=7000)
    fischio *= inviluppo(len(t), 0.05, 0.03)
    return fischio


def sfx_crepitio(dur=1.2, densita=60):
    n = int(dur * SR)
    out = np.zeros(n)
    t = t_axis(dur)
    for _ in range(int(densita * dur)):
        i = rng.integers(0, n - 800)
        click = rng.standard_normal(600) * np.exp(-np.arange(600) / 60)
        out[i:i + 600] += click * rng.uniform(0.3, 1.0) * np.exp(-t[i] * 1.5)
    bang_t = t_axis(0.5)
    bang = filtro_fft(rng.standard_normal(len(bang_t)), alto=1200) * np.exp(-bang_t * 9)
    out[: len(bang)] += 1.5 * norm(bang)
    return filtro_fft(out, basso=200)


def sfx_moto(dur=1.6, giri=(35, 120), su=0.5):
    """Sgasata della moto: VRUUUM."""
    t = t_axis(dur)
    k = np.clip(t / (dur * su), 0, 1)
    rpm = giri[0] + (giri[1] - giri[0]) * (np.sin(np.pi / 2 * k) ** 2)
    rpm *= 1 + 0.04 * np.sin(2 * np.pi * 9 * t)
    x = dente_di_sega(rpm, 60)
    x *= 1 + 0.5 * np.sin(fase(rpm / 2))  # irregolarità dello scoppio
    x = np.tanh(3 * x)
    x = filtro_fft(x, alto=2500)
    x += 0.15 * filtro_fft(rng.standard_normal(len(t)), basso=200, alto=1500)
    return x * inviluppo(len(t), 0.05, 0.35)


def sfx_sgommata(dur=1.0):
    t = t_axis(dur)
    x = filtro_fft(rng.standard_normal(len(t)), basso=900, alto=3000)
    x = norm(x) * (0.7 + 0.3 * np.sin(2 * np.pi * 23 * t))
    return x * inviluppo(len(t), 0.05, 0.3)


def sfx_applausi(dur=2.4):
    n = int(dur * SR)
    out = np.zeros(n)
    t = t_axis(dur)
    for _ in range(int(220 * dur)):
        i = rng.integers(0, n - 1500)
        l = int(rng.uniform(400, 1200))
        clap = filtro_fft(rng.standard_normal(l), basso=rng.uniform(600, 1400), alto=6000)
        out[i:i + l] += clap * np.exp(-np.arange(l) / (l / 5)) * rng.uniform(0.3, 1)
    env = np.clip(t / 0.4, 0, 1) * np.clip((dur - t) / 0.6, 0, 1)
    return norm(out) * env


def sfx_squittio(dur=0.18):
    """Orsetto gommoso schiacciato."""
    t = t_axis(dur)
    f = 1500 + 900 * np.sin(np.pi * t / dur)
    return np.sin(fase(f)) * np.sin(np.pi * t / dur) ** 2


# --------------------------------------------------------------------------
# Missaggio
# --------------------------------------------------------------------------

def colonna_sonora(eventi_extra=()):
    """Restituisce (n, 2) float in [-1, 1].

    eventi_extra: lista di (tempo, nome) per gli effetti legati alla grafica
    (es. i "pop" delle lettere), calcolati in make_video.py.
    """
    n = int(DURATA * SR)
    L = np.zeros(n + SR * 3)
    R = np.zeros(n + SR * 3)

    def metti(x, t0, gain, pan=0.0):
        i = int(t0 * SR)
        x = x * gain
        gl, gr = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
        L[i:i + len(x)] += gl * x
        R[i:i + len(x)] += gr * x

    mus = musica()
    metti(mus, 0, 0.55)

    b = BEAT
    # 0 - intro fuochi d'artificio
    metti(sfx_razzo(0.55), 0.0, 0.25, -0.3)
    metti(sfx_crepitio(1.6), 0.55, 0.35, 0.2)
    metti(sfx_boing(), 1.55, 0.45)
    # 6 battiti - impennata
    metti(sfx_moto(1.8, (40, 135), 0.45), 6 * b, 0.55, -0.2)
    metti(sfx_fischietto(0.5, 450, 1800), 6 * b + 0.55, 0.30, 0.3)
    metti(sfx_clacson(320, 0.16), 9 * b, 0.35, 0.4)
    metti(sfx_clacson(400, 0.22), 9 * b + 0.2, 0.35, 0.4)
    # 10 battiti - BUM 1 (+ orsetti sparati in aria)
    metti(sfx_esplosione(1.8), 10 * b, 0.95)
    for k in range(5):
        metti(sfx_pop(500 + 140 * k, 0.07), 10 * b + 0.12 + 0.07 * k, 0.25, (-1) ** k * 0.5)
    metti(sfx_boing(0.7, 140), 10 * b + 0.55, 0.40)
    # 12 battiti - moto nel cerchio di fuoco
    metti(sfx_moto(2.2, (30, 95), 0.7), 12 * b, 0.45, 0.2)
    metti(sfx_qua(), 12 * b + 0.45, 0.45, -0.4)
    metti(sfx_qua(0.2), 12 * b + 0.75, 0.40, -0.4)
    metti(sfx_fischietto(0.6, 1800, 400), 15 * b, 0.25, 0.3)
    # 17 battiti - fuochi
    metti(sfx_razzo(0.5), 17 * b, 0.22, 0.4)
    metti(sfx_crepitio(1.6, 80), 17 * b + 0.45, 0.35, -0.2)
    metti(sfx_squittio(), 19 * b, 0.25, 0.3)
    # 21 battiti - sgommata
    metti(sfx_moto(1.0, (60, 150), 0.3), 21 * b, 0.45)
    metti(sfx_sgommata(0.9), 21 * b + 0.05, 0.12)
    # 23 battiti - BUM 2 + fischietto in discesa
    metti(sfx_esplosione(1.8), 23 * b, 0.95)
    metti(sfx_fischietto(0.7, 2000, 350), 23 * b + 0.35, 0.30, -0.3)
    metti(sfx_boing(0.8, 120), 23 * b + 1.05, 0.45)
    # 26 battiti - gran finale
    metti(sfx_razzo(0.5), 26 * b - 0.3, 0.20, -0.4)
    metti(sfx_crepitio(2.4, 90), 26 * b + 0.1, 0.35, 0.3)
    metti(sfx_clacson(350, 0.15), 26 * b + 0.15, 0.35, -0.3)
    metti(sfx_clacson(350, 0.15), 26 * b + 0.35, 0.35, -0.3)
    metti(sfx_clacson(470, 0.3), 26 * b + 0.55, 0.35, -0.3)
    metti(sfx_applausi(2.3), 27.5 * b, 0.28)
    metti(sfx_qua(), 31 * b - 0.05, 0.40, 0.3)

    for t0, nome, *args in eventi_extra:
        if nome == "pop":
            metti(sfx_pop(args[0], 0.06), t0, 0.16, args[1] if len(args) > 1 else 0.0)
        elif nome == "squittio":
            metti(sfx_squittio(), t0, 0.12, args[0] if args else 0.0)

    st = np.stack([L[:n], R[:n]], axis=1)
    # dissolvenza finale cortissima per non tagliare di netto
    f = int(0.25 * SR)
    st[-f:] *= np.linspace(1, 0, f)[:, None]
    st = np.tanh(st * 1.1) / np.tanh(1.1)
    return norm(st, 0.95)


def salva_wav(percorso, st):
    pcm = (np.clip(st, -1, 1) * 32767).astype("<i2")
    with wave.open(str(percorso), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    salva_wav("prova-audio.wav", colonna_sonora())
