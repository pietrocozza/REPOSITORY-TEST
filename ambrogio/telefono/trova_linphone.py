"""Trova sul sito di Linphone il pacchetto Python ufficiale adatto a questo Linux e a questa versione di Python.

Stampa l'indirizzo del file .whl più recente (oppure niente, ed esce con errore, se non lo trova).
"""
import re
import sys
import urllib.request
from urllib.parse import urljoin

BASE = "https://download.linphone.org/snapshots/linphone-python/"
TAG = f"cp{sys.version_info.major}{sys.version_info.minor}"


def leggi(url):
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return r.read().decode("utf-8", "replace")
    except Exception as e:  # sito irraggiungibile o cartella mancante
        print(f"(non riesco a leggere {url}: {e})", file=sys.stderr)
        return ""


def cerca(url, profondita=3, visti=None):
    visti = visti if visti is not None else set()
    if url in visti or profondita < 0:
        return []
    visti.add(url)
    trovati = []
    for link in re.findall(r'href="([^"?#]+)"', leggi(url)):
        pieno = urljoin(url, link)
        if not pieno.startswith(BASE) or pieno == url:
            continue
        if pieno.endswith(".whl"):
            trovati.append(pieno)
        elif pieno.endswith("/") and len(pieno) > len(url):
            trovati += cerca(pieno, profondita - 1, visti)
    return trovati


def versione(nome):
    m = re.search(r"linphone-(\d+(?:\.\d+)*)", nome)
    return tuple(int(x) for x in m.group(1).split(".")) if m else ()


ruote = [u for u in cerca(BASE) if "x86_64" in u and "linux" in u]
if not ruote:
    print("Non trovo nessun pacchetto Linphone per Linux sul sito linphone.org.", file=sys.stderr)
    sys.exit(1)


def python_di(url):
    """versione di Python per cui è fatto il pacchetto: cp312 -> (3, 12); (0, 0) se va bene per tutti"""
    m = re.search(r"-cp3(\d+)-", url.rsplit("/", 1)[-1])
    return (3, int(m.group(1))) if m else (0, 0)


# prima le versioni stabili (niente alfa/beta come 5.6.0a7), poi la più recente; a parità, quella per il Python
# di questo Linux, poi per il Python più nuovo
nome = lambda u: u.rsplit("/", 1)[-1]
stabile = lambda u: re.match(r"linphone-\d+(?:\.\d+)*-", nome(u)) is not None
scelto = max(ruote, key=lambda u: (stabile(u), versione(nome(u)), TAG in u, python_di(u)))
print(scelto)
