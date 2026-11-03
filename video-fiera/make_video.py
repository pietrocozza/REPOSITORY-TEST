"""Monta il video verticale "BUONPRIMOGIORNOINFIERA" (15 s, 1080x1920, 30 fps).

    python3 make_video.py

Serve: Python 3 con numpy e Pillow, ffmpeg, curl.
Le clip vengono scaricate da Pexels (licenza gratuita) nella cartella cache/,
insieme al font; il risultato è BUONPRIMOGIORNOINFIERA.mp4.
"""

import math
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

import audio
import grafica

QUI = Path(__file__).resolve().parent
CACHE = QUI / "cache"
USCITA = QUI / "BUONPRIMOGIORNOINFIERA.mp4"

W, H = 1080, 1920
FPS = 30
BEAT = audio.BEAT
DURATA = audio.DURATA
N_FRAME = int(round(DURATA * FPS))
TESTO = "BUONPRIMOGIORNOINFIERA"

FONT_URL = "https://raw.githubusercontent.com/google/fonts/main/apache/luckiestguy/LuckiestGuy-Regular.ttf"

# Clip gratuite da Pexels (https://www.pexels.com/license/)
CLIP = {
    "fuochi_verticali": {
        "url": "https://videos.pexels.com/video-files/10146828/10146828-hd_1080_1920_22fps.mp4",
        "pagina": "https://www.pexels.com/video/fireworks-exploding-in-sky-10146828/",
        "autore": "K Srinivashan Ayush",
    },
    "impennata": {
        "url": "https://videos.pexels.com/video-files/9607278/9607278-uhd_2560_1440_25fps.mp4",
        "pagina": "https://www.pexels.com/video/a-man-performing-stunts-with-his-motorbike-9607278/",
        "autore": "Anastasia Shuraeva",
    },
    "sgommata": {
        "url": "https://videos.pexels.com/video-files/9607153/9607153-uhd_2560_1440_25fps.mp4",
        "pagina": "https://www.pexels.com/video/a-motorcycle-doing-burnout-9607153/",
        "autore": "Anastasia Shuraeva",
    },
    "cerchio_di_fuoco": {
        "url": "https://videos.pexels.com/video-files/32034255/13654815_1920_1080_60fps.mp4",
        "pagina": "https://www.pexels.com/video/motorcycle-stunt-show-with-spectators-32034255/",
        "autore": "GUST",
    },
    "fuochi_orizzontali": {
        "url": "https://videos.pexels.com/video-files/5620687/5620687-uhd_2560_1440_30fps.mp4",
        "pagina": "https://www.pexels.com/video/fireworks-display-in-the-sky-at-night-5620687/",
        "autore": "Andrew Seto",
    },
    "esplosione_1": {
        "url": "https://videos.pexels.com/video-files/856227/856227-hd_1920_960_24fps.mp4",
        "pagina": "https://www.pexels.com/video/fire-explosion-856227/",
        "autore": "Pixabay",
    },
    "esplosione_2": {
        "url": "https://videos.pexels.com/video-files/856295/856295-uhd_2732_1154_24fps.mp4",
        "pagina": "https://www.pexels.com/video/fire-explosion-video-856295/",
        "autore": "Pixabay",
    },
}

# Montaggio: (clip, inizio nella clip in s, centro del ritaglio 9:16 da 0 a 1,
#             battito di fine). Ogni stacco cade su un battito della musica.
MONTAGGIO = [
    ("fuochi_verticali", 7.2, 0.50, 6),
    ("impennata", 0.9, 0.47, 10),
    ("esplosione_1", 0.0, 0.42, 12),
    ("cerchio_di_fuoco", 7.4, 0.60, 17),
    ("fuochi_orizzontali", 43.6, 0.45, 21),
    ("sgommata", 1.8, 0.50, 23),
    ("esplosione_2", 0.8, 0.50, 26),
    ("fuochi_verticali", 24.9, 0.50, 32),
]
ESPLOSIONI = {"esplosione_1", "esplosione_2"}


def frame_di_battito(b):
    return int(round(b * BEAT * FPS))


def scarica(url, dest):
    if dest.exists() and dest.stat().st_size > 0:
        return
    print("scarico", url)
    subprocess.run(["curl", "-sSfL", "--retry", "4", "-o", str(dest), url], check=True)


def prepara_sorgenti():
    CACHE.mkdir(exist_ok=True)
    for nome, c in CLIP.items():
        c["file"] = CACHE / f"{nome}.mp4"
        scarica(c["url"], c["file"])
    font = CACHE / "LuckiestGuy-Regular.ttf"
    scarica(FONT_URL, font)
    return font


def dimensioni(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout.strip()
    w, h = out.split(",")[:2]
    return int(w), int(h)


def segmenti():
    """Lista di (clip, inizio, centro, frame_iniziale, n_frame)."""
    out, f0 = [], 0
    for clip, ss, cx, b_fine in MONTAGGIO:
        f1 = frame_di_battito(b_fine)
        out.append((clip, ss, cx, f0, f1 - f0))
        f0 = f1
    assert f0 == N_FRAME, (f0, N_FRAME)
    return out


def monta_base(dest):
    """Taglia, ritaglia in verticale e concatena le clip (senza audio)."""
    args, filtri, etichette = ["ffmpeg", "-v", "error", "-y"], [], []
    for i, (clip, ss, cx, _f0, n) in enumerate(segmenti()):
        path = CLIP[clip]["file"]
        w, h = dimensioni(path)
        args += ["-ss", f"{ss:.3f}", "-t", f"{n / FPS + 0.5:.3f}", "-i", str(path)]
        cw = min(w, int(round(h * 9 / 16 / 2)) * 2)
        x = int(np.clip(w * cx - cw / 2, 0, w - cw))
        filtri.append(
            f"[{i}:v]crop={cw}:{h}:{x}:0,scale={W}:{H}:flags=lanczos,setsar=1,"
            f"fps={FPS},trim=end_frame={n},setpts=PTS-STARTPTS,format=yuv420p[v{i}]")
        etichette.append(f"[v{i}]")
    filtri.append("".join(etichette) + f"concat=n={len(etichette)}:v=1:a=0[out]")
    args += ["-filter_complex", ";".join(filtri), "-map", "[out]", "-an",
             "-c:v", "libx264", "-preset", "fast", "-crf", "12", str(dest)]
    subprocess.run(args, check=True)


def effetto_camera(img, t, segs):
    """Zoom "a scatto" a ogni stacco, tremolio e flash sulle esplosioni."""
    f = int(round(t * FPS))
    seg = max((s for s in segs if s[3] <= f), key=lambda s: s[3])
    clip, _ss, _cx, f0, _n = seg
    dt = (f - f0) / FPS

    zoom = 1 + 0.07 * math.exp(-dt * 9) if f0 > 0 else 1.0
    dx = dy = 0.0
    flash = 0.0
    if clip in ESPLOSIONI:
        amp = 38 * math.exp(-dt * 4.5)
        dx = amp * math.sin(dt * 71)
        dy = amp * math.cos(dt * 53)
        zoom = max(zoom, 1.06)
        flash = 0.6 * math.exp(-dt * 22)
    if zoom > 1.0005 or dx or dy:
        # trasformazione inversa: punto di uscita -> punto della sorgente
        a = 1 / zoom
        cx, cy = W / 2, H / 2
        img = img.transform((W, H), Image.AFFINE,
                            (a, 0, cx - a * cx + dx, 0, a, cy - a * cy + dy),
                            resample=Image.BILINEAR)
    if flash > 0.01:
        bianco = Image.new("RGBA", (W, H), (255, 236, 170, int(255 * flash)))
        img.alpha_composite(bianco)
    return img


def main():
    font = prepara_sorgenti()
    base = CACHE / "base.mp4"
    print("monto le clip...")
    monta_base(base)

    segs = segmenti()
    t_esplosioni = [(segs[i][3] / FPS, (540, 1150)) for i, s in enumerate(segs) if s[0] in ESPLOSIONI]
    t_finale = segs[-1][3] / FPS

    scritta = grafica.ScrittaArcobaleno(TESTO, str(font), beat=BEAT)
    orsetti = grafica.PioggiaOrsetti(DURATA, FPS, esplosioni=t_esplosioni, finale=t_finale)

    print("sintetizzo la musica e gli effetti...")
    eventi = scritta.eventi_audio()
    rng = np.random.default_rng(11)
    for _ in range(6):  # qualche squittio di orsetto qua e là
        eventi.append((float(rng.uniform(1.8, 14)), "squittio", float(rng.uniform(-0.7, 0.7))))
    wav = CACHE / "audio.wav"
    audio.salva_wav(wav, audio.colonna_sonora(eventi))

    print("disegno scritta e orsetti e codifico...")
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(base), "-f", "rawvideo",
                            "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen([
        "ffmpeg", "-v", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-i", str(wav),
        "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000",
        "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-maxrate", "8M", "-bufsize", "16M",
        "-pix_fmt", "yuv420p",
        "-profile:v", "high", "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart", "-shortest", str(USCITA),
    ], stdin=subprocess.PIPE)

    dim = W * H * 3
    for f in range(N_FRAME):
        raw = dec.stdout.read(dim)
        if len(raw) < dim:
            raise RuntimeError(f"il video di base è finito al frame {f}")
        t = f / FPS
        img = Image.frombuffer("RGB", (W, H), raw).convert("RGBA")
        img = effetto_camera(img, t, segs)
        orsetti.disegna(img, t)
        scritta.disegna(img, t)
        enc.stdin.write(img.convert("RGB").tobytes())
        if f % 30 == 0:
            print(f"  {t:4.1f} s", flush=True)
    enc.stdin.close()
    dec.stdout.close()
    dec.wait()
    if enc.wait() != 0:
        sys.exit("errore nella codifica finale")
    print("fatto:", USCITA)


if __name__ == "__main__":
    main()
