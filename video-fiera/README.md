# BUONPRIMOGIORNOINFIERA

Video verticale di 15 secondi (1080x1920, 30 fps, H.264 + AAC): **[BUONPRIMOGIORNOINFIERA.mp4](BUONPRIMOGIORNOINFIERA.mp4)**

- Moto, fuochi d'artificio ed esplosioni da clip gratuite di Pexels.
- La scritta BUONPRIMOGIORNOINFIERA è curva ad arco in cielo, sopra un arcobaleno. Le lettere hanno i colori dell'arcobaleno, compaiono una alla volta con un "pop" e poi ondeggiano a tempo.
- Gli orsetti gommosi cadono per tutto il video. Le esplosioni li sparano in aria e nel finale ne piovono di più.
- La musichetta è originale (kazoo, basso e batteria chiptune, 128 BPM) e gli stacchi cadono sui battiti.
- Effetti sonori stupidi: molla "boing", fischietto a coulisse, trombetta da clown, papera, squittii, sgasate, BUM e applausi finali.

Musica, effetti sonori e orsetti sono generati da zero dallo script, quindi non ci sono diritti di terzi.

## Rigenerare il video

Servono Python 3 con `numpy` e `Pillow`, `ffmpeg` e `curl`.

```bash
cd video-fiera
python3 make_video.py
```

Lo script scarica clip e font in `cache/` (cartella non versionata) e riscrive `BUONPRIMOGIORNOINFIERA.mp4`. Impiega circa 2 minuti.

| Cosa | File |
| --- | --- |
| Clip usate, tagli e ordine del montaggio | `make_video.py` (`CLIP`, `MONTAGGIO`) |
| Scritta ad arco e orsetti | `grafica.py` |
| Musica ed effetti sonori (con i tempi) | `audio.py` (`MELODIA`, `colonna_sonora`) |

## Crediti

Tutte le clip sono gratuite con la [licenza Pexels](https://www.pexels.com/license/), che non chiede l'attribuzione. I crediti sono comunque questi:

| Clip | Autore |
| --- | --- |
| [Fuochi d'artificio (verticale)](https://www.pexels.com/video/fireworks-exploding-in-sky-10146828/) | K Srinivashan Ayush |
| [Impennata in città](https://www.pexels.com/video/a-man-performing-stunts-with-his-motorbike-9607278/) | Anastasia Shuraeva |
| [Sgommata](https://www.pexels.com/video/a-motorcycle-doing-burnout-9607153/) | Anastasia Shuraeva |
| [Moto nel cerchio di fuoco con il pubblico](https://www.pexels.com/video/motorcycle-stunt-show-with-spectators-32034255/) | GUST |
| [Fuochi d'artificio](https://www.pexels.com/video/fireworks-display-in-the-sky-at-night-5620687/) | Andrew Seto |
| [Esplosione di fuoco](https://www.pexels.com/video/fire-explosion-856227/) | Pixabay |
| [Esplosione di fuoco 2](https://www.pexels.com/video/fire-explosion-video-856295/) | Pixabay |

Font: [Luckiest Guy](https://fonts.google.com/specimen/Luckiest+Guy) di Astigmatic, con licenza Apache 2.0.
