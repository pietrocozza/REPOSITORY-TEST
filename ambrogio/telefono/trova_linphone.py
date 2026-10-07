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
adatte = [u for u in ruote if TAG in u] or [u for u in ruote if "py3-none" in u or "abi3" in u]
if not adatte:
    print(f"Nessun pacchetto Linphone per Python {TAG[2]}.{TAG[3:]} trovato. Pacchetti visti:", file=sys.stderr)
    for u in ruote:
        print("  " + u.rsplit("/", 1)[-1], file=sys.stderr)
    sys.exit(1)
print(max(adatte, key=lambda u: versione(u.rsplit("/", 1)[-1])))
