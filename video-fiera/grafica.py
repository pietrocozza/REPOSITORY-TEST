"""Grafica sovrapposta al video: scritta ad arco arcobaleno e orsetti gommosi.

Gli orsetti sono disegnati da zero con Pillow (ellissi + ombre + riflessi),
la scritta usa il font Luckiest Guy (licenza Apache 2.0, Google Fonts).
"""

import colorsys
import math

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

W, H = 1080, 1920


# --------------------------------------------------------------------------
# Utilità
# --------------------------------------------------------------------------

def ease_out_back(x, s=2.2):
    x = min(max(x, 0.0), 1.0) - 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2


def incolla(frame, sp, x, y):
    """alpha_composite che accetta anche coordinate negative / fuori dal frame."""
    x, y = int(round(x)), int(round(y))
    sx, sy = max(0, -x), max(0, -y)
    dx, dy = max(0, x), max(0, y)
    w = min(sp.width - sx, frame.width - dx)
    h = min(sp.height - sy, frame.height - dy)
    if w <= 0 or h <= 0:
        return
    frame.alpha_composite(sp, (dx, dy), (sx, sy, sx + w, sy + h))


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# --------------------------------------------------------------------------
# Scritta ad arco arcobaleno
# --------------------------------------------------------------------------

class ScrittaArcobaleno:
    """La scritta curva come un arcobaleno, in alto nel cielo.

    Ogni lettera ha il suo colore dell'arcobaleno, bordo bianco spesso e
    contorno scuro; le lettere "saltano fuori" una alla volta all'inizio e poi
    ondeggiano a tempo di musica.
    """

    def __init__(self, testo, font_path, centro=(540, 830), raggio=480,
                 apertura_gradi=152, t_inizio=0.15, passo=0.06, beat=0.46875):
        self.testo = testo
        self.cx, self.cy = centro
        self.raggio = raggio
        self.t_inizio = t_inizio
        self.passo = passo
        self.beat = beat

        n = len(testo)
        arco = math.radians(apertura_gradi) * raggio

        # Dimensione del font scelta perché la scritta riempia l'arco
        size = 200
        while size > 20:
            font = ImageFont.truetype(font_path, size)
            larghezze = [font.getlength(c) for c in testo]
            totale = sum(larghezze) + 0.04 * size * (n - 1)
            if totale <= arco:
                break
            size -= 1
        self.size = size
        spaziatura = 0.04 * size

        # angolo di ogni lettera (centro della lettera) lungo l'arco
        totale = sum(larghezze) + spaziatura * (n - 1)
        pos = -totale / 2
        self.lettere = []
        for i, c in enumerate(testo):
            centro_l = pos + larghezze[i] / 2
            pos += larghezze[i] + spaziatura
            ang = centro_l / raggio  # radianti, 0 = in cima
            hue = (i / (n - 1)) * 0.80  # rosso -> viola
            sprite = self._sprite_lettera(c, font, hue)
            sprite = sprite.rotate(-math.degrees(ang), resample=Image.BICUBIC, expand=True)
            self.lettere.append({"ang": ang, "sprite": sprite, "t0": t_inizio + i * passo})

        self.banda = self._banda_arcobaleno()

    def _sprite_lettera(self, c, font, hue):
        size = self.size
        pad = int(size * 0.35)
        asc, desc = font.getmetrics()
        w = int(font.getlength(c)) + 2 * pad
        h = asc + desc + 2 * pad
        # la linea di base della lettera sta al centro verticale dello sprite,
        # così rotazione e posizionamento sono attorno alla base
        h2 = 2 * max(asc + pad, desc + pad)
        img = Image.new("RGBA", (w, h2), (0, 0, 0, 0))
        base_y = h2 // 2
        org = (pad, base_y - asc)

        bordo_scuro = max(4, int(size * 0.16))
        bordo_bianco = max(3, int(size * 0.10))

        # ombra morbida
        ombra = Image.new("L", img.size, 0)
        ImageDraw.Draw(ombra).text((org[0] + size * 0.05, org[1] + size * 0.07), c, font=font,
                                   fill=255, stroke_width=bordo_scuro)
        ombra = ombra.filter(ImageFilter.GaussianBlur(size * 0.06))
        img.paste((40, 10, 60, 150), (0, 0), ombra)

        d = ImageDraw.Draw(img)
        d.text(org, c, font=font, fill=(45, 15, 70, 255), stroke_width=bordo_scuro,
               stroke_fill=(45, 15, 70, 255))
        d.text(org, c, font=font, fill=(255, 255, 255, 255), stroke_width=bordo_bianco,
               stroke_fill=(255, 255, 255, 255))

        # riempimento: sfumatura verticale del colore della lettera (più chiaro in alto)
        mask = Image.new("L", img.size, 0)
        ImageDraw.Draw(mask).text(org, c, font=font, fill=255)
        top = org[1] + font.getbbox(c)[1]
        bot = base_y
        grad = Image.new("RGBA", img.size)
        gpx = np.zeros((img.size[1], img.size[0], 4), dtype=np.uint8)
        for y in range(img.size[1]):
            k = np.clip((y - top) / max(1, bot - top), 0, 1)
            r, g, b = colorsys.hsv_to_rgb(hue, 0.55 + 0.45 * k, 1.0 - 0.18 * k)
            gpx[y, :, :3] = (int(r * 255), int(g * 255), int(b * 255))
            gpx[y, :, 3] = 255
        grad = Image.fromarray(gpx, "RGBA")
        img.paste(grad, (0, 0), mask)

        # riflesso lucido nella parte alta della lettera
        lucido = Image.new("L", img.size, 0)
        ImageDraw.Draw(lucido).rectangle([0, 0, img.size[0], top + (bot - top) * 0.32], fill=110)
        lucido = ImageChops.multiply(lucido, mask.filter(ImageFilter.MinFilter(5)))
        img.paste((255, 255, 255), (0, 0), lucido)
        return img

    def _banda_arcobaleno(self):
        """Un vero arcobaleno (7 strisce) sotto le lettere, semitrasparente."""
        scala = 2
        img = Image.new("RGBA", (W * scala, H * scala), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        colori = ["#ff3b30", "#ff9500", "#ffd60a", "#34c759", "#0a84ff", "#5e5ce6", "#bf5af2"]
        spessore = 13
        r_est = self.raggio - self.size * 0.18
        for i, col in enumerate(colori):
            r = (r_est - i * spessore) * scala
            box = [(self.cx * scala - r), (self.cy * scala - r), (self.cx * scala + r), (self.cy * scala + r)]
            d.ellipse(box, fill=hex_rgb(col) + (255,))
        r = (r_est - len(colori) * spessore) * scala
        d.ellipse([(self.cx * scala - r), (self.cy * scala - r), (self.cx * scala + r), (self.cy * scala + r)],
                  fill=(0, 0, 0, 0))
        img = img.resize((W, H), Image.LANCZOS)
        # tieni solo la metà superiore e sfuma le estremità
        a = np.array(img)
        yy = np.arange(H)[:, None]
        sfuma = np.clip((self.cy + 40 - yy) / 160.0, 0, 1)
        a[..., 3] = (a[..., 3] * sfuma * 0.62).astype(np.uint8)
        return Image.fromarray(a, "RGBA")

    def eventi_audio(self):
        """Un 'pop' per ogni lettera che compare, con altezza che sale."""
        ev = []
        n = len(self.lettere)
        for i, l in enumerate(self.lettere):
            f = 523 * 2 ** (1.5 * i / max(1, n - 1))  # da Do5 a salire di un'ottava e mezza
            ev.append((l["t0"], "pop", f, math.sin(l["ang"]) * 0.8))
        return ev

    def disegna(self, frame, t):
        """Disegna la scritta sul frame RGBA (Image) al tempo t."""
        # arcobaleno che si "apre" da sinistra a destra mentre arrivano le lettere
        t_fine = self.lettere[-1]["t0"] + 0.3
        prog = np.clip((t - self.t_inizio) / (t_fine - self.t_inizio), 0, 1)
        if prog > 0:
            banda = self.banda
            if prog < 1:
                ang_lim = math.pi * prog  # da sinistra (pi) verso destra (0)
                m = Image.new("L", (W, H), 0)
                deg0 = 180
                ImageDraw.Draw(m).pieslice([self.cx - 900, self.cy - 900, self.cx + 900, self.cy + 900],
                                           start=deg0, end=deg0 + math.degrees(ang_lim) + 0.5, fill=255)
                banda = banda.copy()
                banda.putalpha(ImageChops.multiply(banda.getchannel("A"), m))
            frame.alpha_composite(banda)

        # piccolo "battito" a tempo
        fase_beat = (t % self.beat) / self.beat
        pulsa = 1 + 0.05 * math.exp(-fase_beat * 6)

        for i, l in enumerate(self.lettere):
            dt = t - l["t0"]
            if dt <= 0:
                continue
            s = ease_out_back(dt / 0.32) * pulsa
            if s <= 0.02:
                continue
            onda = 10 * math.sin(2 * math.pi * 1.1 * t - i * 0.55)
            r = self.raggio + onda
            ang = l["ang"]
            sp = l["sprite"]
            if abs(s - 1) > 0.01:
                sp = sp.resize((max(1, int(sp.width * s)), max(1, int(sp.height * s))), Image.BICUBIC)
            x = self.cx + r * math.sin(ang) - sp.width / 2
            y = self.cy - r * math.cos(ang) - sp.height / 2
            incolla(frame, sp, x, y)


# --------------------------------------------------------------------------
# Orsetti gommosi
# --------------------------------------------------------------------------

COLORI_ORSETTI = {
    "rosso": "#e3122a",
    "arancio": "#ff7a00",
    "giallo": "#ffcc00",
    "verde": "#2fbf3a",
    "bianco": "#f2ecd8",
    "lampone": "#ff3d8b",
}


def _forma_orsetto(s):
    """Maschera della sagoma dell'orsetto in una tela 400x520 * s."""
    m = Image.new("L", (int(400 * s), int(520 * s)), 0)
    d = ImageDraw.Draw(m)

    def ell(cx, cy, rx, ry, fill=255):
        d.ellipse([(cx - rx) * s, (cy - ry) * s, (cx + rx) * s, (cy + ry) * s], fill=fill)

    ell(118, 62, 44, 42)  # orecchie
    ell(282, 62, 44, 42)
    ell(200, 140, 108, 96)  # testa
    ell(200, 330, 118, 138)  # corpo
    ell(92, 262, 46, 64)  # braccia
    ell(308, 262, 46, 64)
    ell(128, 448, 62, 58)  # gambe
    ell(272, 448, 62, 58)
    return m


def crea_orsetto(colore_hex, altezza=170):
    """Sprite RGBA di un orsetto gommoso traslucido e lucido."""
    s = 2.0  # disegno a risoluzione doppia per bordi morbidi
    forma = _forma_orsetto(s)
    wbig, hbig = forma.size
    col = np.array(hex_rgb(colore_hex), dtype=float)

    # profondità: più "spesso" al centro -> colore più saturo e scuro ai bordi
    prof = np.array(forma.filter(ImageFilter.GaussianBlur(28 * s)), dtype=float) / 255
    prof = np.clip(prof * 1.6, 0, 1)
    fm = np.array(forma, dtype=float) / 255

    rgb = np.zeros((hbig, wbig, 3))
    for k in range(3):
        rgb[..., k] = col[k] * (0.55 + 0.45 * prof) + (1 - prof) * col[k] * 0.1
    # luce interna (gelatina illuminata da dietro)
    glow = np.array(_forma_orsetto(s).filter(ImageFilter.GaussianBlur(60 * s)), dtype=float) / 255
    rgb += (glow[..., None] ** 2) * 60

    alpha = fm * (0.80 + 0.17 * prof)

    img = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8), "RGBA")

    # dettagli su un livello a parte, sfumati, poi fusi sopra la gelatina
    det = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(det)

    def ell(cx, cy, rx, ry, fill):
        d.ellipse([(cx - rx) * s, (cy - ry) * s, (cx + rx) * s, (cy + ry) * s], fill=fill)

    scuro = tuple(int(c * 0.5) for c in col) + (230,)
    chiaro = tuple(int(min(255, c * 0.6 + 110)) for c in col) + (120,)
    ell(200, 175, 48, 36, chiaro)  # muso
    ell(200, 340, 70, 82, chiaro)  # pancia
    det = det.filter(ImageFilter.GaussianBlur(6 * s))
    d = ImageDraw.Draw(det)
    ell(160, 128, 13, 15, scuro)  # occhi
    ell(240, 128, 13, 15, scuro)
    ell(200, 160, 16, 11, scuro)  # naso
    img.alpha_composite(det)

    # riflessi lucidi
    luce = Image.new("L", img.size, 0)
    dl = ImageDraw.Draw(luce)
    for cx, cy, rx, ry, a in [(150, 92, 30, 18, 230), (128, 255, 22, 40, 170),
                              (140, 300, 18, 34, 150), (300, 420, 14, 10, 120),
                              (98, 44, 12, 10, 200)]:
        dl.ellipse([(cx - rx) * s, (cy - ry) * s, (cx + rx) * s, (cy + ry) * s], fill=a)
    luce = luce.filter(ImageFilter.GaussianBlur(5 * s))
    luce = ImageChops.multiply(luce, forma)
    img.paste((255, 255, 255), (0, 0), luce)

    # bordo leggermente più scuro
    bordo = ImageChops.subtract(forma, forma.filter(ImageFilter.MinFilter(int(7 * s) | 1)))
    bordo = bordo.filter(ImageFilter.GaussianBlur(1.5 * s))
    img.paste(tuple(int(c * 0.45) for c in col), (0, 0), bordo.point(lambda v: v * 0.6))

    h = altezza
    w = int(img.width * h / img.height)
    img = img.resize((w, h), Image.LANCZOS)

    # ombra morbida sotto
    pad = 16
    out = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    ombra = Image.new("RGBA", out.size, (0, 0, 0, 0))
    ombra.paste((0, 0, 0, 110), (pad + 4, pad + 7), img.getchannel("A"))
    ombra = ombra.filter(ImageFilter.GaussianBlur(6))
    out.alpha_composite(ombra)
    out.alpha_composite(img, (pad, pad))
    return out


class PioggiaOrsetti:
    """Orsetti che cadono dal cielo (e che le esplosioni sparano in aria)."""

    def __init__(self, durata, fps, esplosioni=(), finale=None, seed=3):
        self.rng = np.random.default_rng(seed)
        self.fps = fps
        self.sprite_cache = {}
        self.orsetti = []
        rng = self.rng
        colori = list(COLORI_ORSETTI)

        def nuovo(t0, x, y, vx, vy, size):
            col = colori[rng.integers(len(colori))]
            self.orsetti.append({
                "t0": t0, "x": x, "y": y, "vx": vx, "vy": vy,
                "rot": rng.uniform(0, 360), "vrot": rng.uniform(-260, 260),
                "size": size, "col": col, "osc": rng.uniform(0, 6.28),
            })

        # pioggia continua: frequenza che cresce nel finale
        t = 0.3
        while t < durata:
            rate = 3.5
            if finale and t >= finale:
                rate = 14
            nuovo(t, rng.uniform(40, W - 40), -140, rng.uniform(-40, 40), rng.uniform(150, 420),
                  int(rng.uniform(95, 165)))
            t += rng.exponential(1 / rate)

        # esplosioni di orsetti
        for te, (ex, ey) in esplosioni:
            for _ in range(16):
                ang = rng.uniform(-math.pi * 0.95, -math.pi * 0.05)
                v = rng.uniform(900, 1900)
                nuovo(te + rng.uniform(0, 0.08), ex + rng.uniform(-60, 60), ey + rng.uniform(-60, 60),
                      math.cos(ang) * v * 0.7, math.sin(ang) * v, int(rng.uniform(100, 175)))

    def _sprite(self, col, size):
        k = (col, size)
        if k not in self.sprite_cache:
            self.sprite_cache[k] = crea_orsetto(COLORI_ORSETTI[col], size)
        return self.sprite_cache[k]

    def disegna(self, frame, t):
        g = 1500.0  # gravità px/s²
        for o in self.orsetti:
            dt = t - o["t0"]
            if dt < 0:
                continue
            # cadono con un po' di attrito dell'aria (velocità limite ~1100 px/s)
            vy_lim = 1100
            vy = o["vy"]
            y = o["y"] + vy * dt + 0.5 * g * dt * dt
            v_now = vy + g * dt
            if v_now > vy_lim:
                t_lim = (vy_lim - vy) / g
                if t_lim > 0:
                    y = o["y"] + vy * t_lim + 0.5 * g * t_lim ** 2 + vy_lim * (dt - t_lim)
            x = o["x"] + o["vx"] * dt * math.exp(-dt * 0.8) + 25 * math.sin(o["osc"] + dt * 3)
            if y > H + 150 or y < -900 or x < -300 or x > W + 300:
                continue
            sp = self._sprite(o["col"], o["size"])
            ang = o["rot"] + o["vrot"] * dt
            sp = sp.rotate(ang, resample=Image.BICUBIC, expand=True)
            incolla(frame, sp, x - sp.width / 2, y - sp.height / 2)
