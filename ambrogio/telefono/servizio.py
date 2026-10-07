"""Il telefono di Ambrogio: servizio che gira in Ubuntu (WSL) e lo comanda il motore di Ambrogio su Windows.

Il motore lo accende con  wsl.exe -d Ubuntu-24.04 -- bash telefono/servizio.sh  e parla con lui così:
  - comandi (una riga JSON per comando, su stdin):
      {"cmd": "chiama", "a": "sip:…"}           fa partire la chiamata (senza "a": il numero del file .env)
      {"cmd": "parla", "file": "/mnt/c/…wav", "id": 3}   fa sentire un file WAV a chi è al telefono
      {"cmd": "riattacca"}                       chiude la chiamata
      {"cmd": "esci"}                            spegne il servizio
  - eventi (righe che iniziano con @@AMBROGIO seguito da JSON, su stdout):
      pronto, squilla, risposto, codice, frase (un pezzo di parlato di chi è al telefono, in un file WAV),
      parlato (finito di far sentire un file), fine, errore

Ambrogio non ha scheda audio: parla con il "lettore" della chiamata e ascolta la registrazione della chiamata,
che si legge mentre cresce per capire quando chi è al telefono parla e quando ha finito (pausa di silenzio).
"""
import array
import json
import math
import os
import queue
import sys
import threading
import time
import wave

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prova_chiamata import (  # noqa: E402  (le stesse funzioni della chiamata di prova)
    CARTELLA,
    DOMINIO,
    crea_credenziali,
    descrivi_errore,
    enum_linphone,
    indirizzo,
    leggi_env,
    nome_stato,
)

FRAME_MS = 20
INIZIO_FRAME = 4  # 80 ms sopra la soglia: sta parlando
FINE_SILENZIO_MS = 900  # tanto silenzio: ha finito la frase
PREROLL_MS = 300  # si tiene anche un pezzetto prima dell'inizio
MIN_PARLATO_MS = 350
MAX_FRASE_S = 25
DOPO_PARLATO_MS = 450  # dopo che Ambrogio ha parlato si aspetta un attimo (eco)


def evento(nome, **dati):
    print("@@AMBROGIO " + json.dumps({"evento": nome, **dati}, ensure_ascii=False), flush=True)


def scrivi_silenzio(percorso, hz=16000, secondi=1):
    with wave.open(percorso, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(hz)
        w.writeframes(b"\0\0" * hz * secondi)


def durata_wav(percorso):
    with wave.open(percorso, "rb") as w:
        return w.getnframes() / float(w.getframerate())


def leggi_intestazione(f):
    """formato della registrazione mentre è ancora aperta: (frequenza, canali, inizio dei dati)"""
    f.seek(0)
    testa = f.read(4096)
    if len(testa) < 44 or testa[:4] != b"RIFF":
        return None
    frequenza = int.from_bytes(testa[24:28], "little")
    canali = int.from_bytes(testa[22:24], "little") or 1
    if not 4000 <= frequenza <= 192000 or canali > 8:
        return None  # intestazione non ancora scritta del tutto: si riprova dopo
    pos = 12
    while pos + 8 <= len(testa):
        nome = testa[pos:pos + 4]
        lung = int.from_bytes(testa[pos + 4:pos + 8], "little")
        if nome == b"data":
            return frequenza, canali, pos + 8
        pos += 8 + lung
        if lung > 4096:
            break
    return frequenza, canali, 44


class Orecchio:
    """Legge la registrazione della chiamata mentre cresce e ritaglia le frasi di chi parla"""

    def __init__(self, percorso, cartella_frasi):
        self.percorso = percorso
        self.cartella = cartella_frasi
        self.f = None
        self.formato = None
        self.pos = 0
        self.avanzo = b""
        self.fondo = 300.0  # rumore di fondo stimato
        self.storico = []  # ultimi frame (per il pezzetto prima dell'inizio)
        self.frase = None  # frame della frase in corso
        self.sopra = 0
        self.silenzio_ms = 0
        self.zitto_fino = 0.0
        self.numero = 0
        self.misura = None  # (ora, dimensione) per capire il formato se manca l'intestazione

    def zitto_per(self, secondi):
        """mentre parla Ambrogio non si ascolta (si sentirebbe la sua eco)"""
        self.zitto_fino = max(self.zitto_fino, time.time() + secondi)
        self.frase = None
        self.sopra = 0

    def leggi(self):
        if self.f is None:
            if not os.path.exists(self.percorso):
                return None
            self.f = open(self.percorso, "rb")
        if self.formato is None:
            self.formato = leggi_intestazione(self.f) or self.indovina_formato()
            if self.formato is None:
                return None
            self.pos = self.formato[2]
        self.f.seek(self.pos)
        nuovi = self.f.read()
        self.pos += len(nuovi)
        if not nuovi:
            return None
        frequenza, canali, _ = self.formato
        dati = self.avanzo + nuovi
        lung = int(frequenza * FRAME_MS / 1000) * 2 * canali
        n = len(dati) // lung
        self.avanzo = dati[n * lung:]
        for i in range(n):
            frase = self.frame(dati[i * lung:(i + 1) * lung])
            if frase:
                return frase
        return None

    def indovina_formato(self):
        """Linphone scrive l'intestazione del WAV solo a fine chiamata: durante la chiamata il formato
        si capisce da quanto cresce il file (byte al secondo = frequenza x canali x 2)."""
        dimensione = os.path.getsize(self.percorso)
        if dimensione <= 44:
            return None
        if self.misura is None:
            self.misura = (time.time(), dimensione)
            return None
        t0, d0 = self.misura
        trascorso = time.time() - t0
        if trascorso < 1.5:
            return None
        al_secondo = (dimensione - d0) / trascorso
        if al_secondo <= 0:
            self.misura = (time.time(), dimensione)
            return None
        # prima si prova mono (il caso normale delle telefonate), poi stereo
        frequenze = (8000, 16000, 24000, 32000, 44100, 48000)
        frequenza = min(frequenze, key=lambda f: abs(f * 2 - al_secondo))
        canali = 1
        if abs(frequenza * 2 - al_secondo) > al_secondo * 0.08:
            frequenza = min(frequenze, key=lambda f: abs(f * 4 - al_secondo))
            canali = 2
        evento("formato", frequenza=frequenza, canali=canali, byte_al_secondo=int(al_secondo))
        # si parte dai dati nuovi (allineati al campione)
        inizio = dimensione - ((dimensione - 44) % (2 * canali))
        return frequenza, canali, inizio

    def frame(self, pezzo):
        campioni = array.array("h", pezzo)
        if self.formato[1] > 1:
            campioni = campioni[::self.formato[1]]
        rms = math.sqrt(sum(c * c for c in campioni) / max(1, len(campioni)))
        self.storico.append(campioni)
        del self.storico[:-int(PREROLL_MS / FRAME_MS)]
        if time.time() < self.zitto_fino:
            self.fondo = min(self.fondo * 1.002 + 1, max(80.0, rms)) if rms > 0 else self.fondo
            return None
        # il rumore di fondo segue i momenti più silenziosi
        self.fondo = min(self.fondo * 1.002 + 1, max(80.0, rms)) if self.frase is None else self.fondo
        soglia = max(450.0, self.fondo * 3)
        if self.frase is None:
            self.sopra = self.sopra + 1 if rms > soglia else 0
            if self.sopra >= INIZIO_FRAME:
                self.frase = list(self.storico)
                self.silenzio_ms = 0
            return None
        self.frase.append(campioni)
        self.silenzio_ms = self.silenzio_ms + FRAME_MS if rms < soglia * 0.7 else 0
        durata = len(self.frase) * FRAME_MS
        if self.silenzio_ms >= FINE_SILENZIO_MS or durata >= MAX_FRASE_S * 1000:
            frase, self.frase, self.sopra = self.frase, None, 0
            if durata - self.silenzio_ms < MIN_PARLATO_MS:
                return None
            return self.salva(frase)
        return None

    def salva(self, frames):
        self.numero += 1
        os.makedirs(self.cartella, exist_ok=True)
        percorso = os.path.join(self.cartella, f"frase-{int(time.time())}-{self.numero}.wav")
        with wave.open(percorso, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(self.formato[0])
            for f in frames:
                w.writeframes(f.tobytes())
        return percorso

    def chiudi(self):
        if self.f:
            self.f.close()


def leggi_comandi(coda):
    for riga in sys.stdin:
        riga = riga.strip()
        if not riga:
            continue
        try:
            coda.put(json.loads(riga))
        except ValueError:
            evento("errore", messaggio=f"comando non valido: {riga[:80]}")
    coda.put({"cmd": "esci"})


def main():
    env = leggi_env()
    utente = env.get("AMBROGIO_LINPHONE_UTENTE", "").removeprefix("sip:").split("@")[0]
    password = env.get("AMBROGIO_LINPHONE_PASSWORD", "")
    predefinito = env.get("AMBROGIO_LINPHONE_CHIAMA", "")
    if not (utente and password):
        evento("errore", messaggio="Nel file .env mancano AMBROGIO_LINPHONE_UTENTE o AMBROGIO_LINPHONE_PASSWORD.")
        return 1
    io = indirizzo(utente)

    import linphone

    casa = os.path.join(os.path.expanduser("~"), ".ambrogio-telefono", "linphone")
    for cartella in (casa, os.path.join(os.path.expanduser("~"), ".local", "share", "linphone")):
        os.makedirs(cartella, exist_ok=True)
    cartella_chiamate = os.path.join(CARTELLA, "data", "telefono")
    os.makedirs(cartella_chiamate, exist_ok=True)
    silenzio = os.path.join(casa, "silenzio.wav")
    scrivi_silenzio(silenzio)

    fabbrica = linphone.Factory.get()
    for campo in ("data_dir", "config_dir", "download_dir", "cache_dir"):
        try:
            setattr(fabbrica, campo, casa)
        except Exception:
            pass
    configurazione = os.path.join(casa, "linphonerc")
    if os.path.exists(configurazione):
        os.remove(configurazione)
    core = fabbrica.create_core(configurazione, "", None)
    try:
        core.zrtp_secrets_file = os.path.join(casa, "zrtp-segreti.db")
    except Exception:
        pass
    if os.path.exists("/etc/ssl/certs/ca-certificates.crt"):
        try:
            core.root_ca = "/etc/ssl/certs/ca-certificates.crt"
        except Exception:
            pass
    # niente scheda audio: in sottofondo silenzio, la voce di Ambrogio passa dal lettore della chiamata
    core.use_files = True
    core.play_file = silenzio
    core.video_capture_enabled = False
    core.video_display_enabled = False
    trasporti = fabbrica.create_transports()
    trasporti.udp_port = -1
    trasporti.tcp_port = -1
    trasporti.tls_port = -1
    core.transports = trasporti
    nat = core.create_nat_policy()
    nat.stun_server = "stun.linphone.org"
    nat.ice_enabled = True
    nat.stun_enabled = True
    core.nat_policy = nat
    zrtp = enum_linphone(linphone, "MediaEncryption", "ZRTP")
    if zrtp is not None:
        try:
            core.media_encryption = zrtp
        except Exception:
            pass

    parametri = core.create_account_params()
    parametri.identity_address = fabbrica.create_address(io)
    parametri.server_address = fabbrica.create_address(f"sip:{DOMINIO};transport=tls")
    parametri.register_enabled = True
    parametri.nat_policy = nat
    account = core.create_account(parametri)
    credenziali = crea_credenziali(fabbrica, utente, password)

    def gira(secondi, condizione=lambda: False):
        fine = time.time() + secondi
        while time.time() < fine:
            core.iterate()
            if condizione():
                return True
            time.sleep(0.02)
        return False

    core.start()
    if not gira(20, lambda: nome_stato(core.global_state) == "On"):
        evento("errore", messaggio="Linphone non riesce ad accendersi.")
        return 1
    for pulizia in ("clear_accounts", "clear_all_auth_info"):
        try:
            getattr(core, pulizia)()
        except Exception:
            pass
    core.add_auth_info(credenziali)
    core.add_account(account)
    core.default_account = account
    gira(30, lambda: nome_stato(account.state) in ("Ok", "Failed"))
    stato = nome_stato(account.state)
    if stato != "Ok":
        evento("errore", messaggio="Linphone ha rifiutato nome o password di Ambrogio." if stato == "Failed"
               else f"Non riesco a collegarmi a sip.linphone.org (stato {stato}).")
        return 1
    evento("pronto", versione=linphone.Core.get_version(), account=io)

    comandi = queue.Queue()
    threading.Thread(target=leggi_comandi, args=(comandi,), daemon=True).start()

    chiamata = None
    orecchio = None
    ultimo_stato = None
    codice_detto = False
    parlando = None  # (id, fine prevista, lettore)

    def chiudi_chiamata(motivo):
        nonlocal chiamata, orecchio, ultimo_stato, parlando, codice_detto
        if orecchio:
            orecchio.chiudi()
        evento("fine", motivo=motivo)
        chiamata, orecchio, ultimo_stato, parlando, codice_detto = None, None, None, None, False

    while True:
        core.iterate()
        try:
            cmd = comandi.get_nowait()
        except queue.Empty:
            cmd = None

        if cmd:
            tipo = cmd.get("cmd")
            if tipo == "esci":
                if chiamata:
                    core.terminate_all_calls()
                    gira(2)
                core.stop()
                return 0
            if tipo == "chiama":
                if chiamata:
                    evento("errore", messaggio="C'è già una chiamata in corso.")
                else:
                    a = cmd.get("a") or predefinito
                    if not a:
                        evento("errore", messaggio="Non so chi chiamare: manca AMBROGIO_LINPHONE_CHIAMA nel file .env.")
                    else:
                        registrazione = os.path.join(cartella_chiamate, f"chiamata-{int(time.time())}.wav")
                        core.record_file = registrazione
                        chiamata = core.invite(indirizzo(a))
                        if chiamata is None:
                            evento("errore", messaggio="La chiamata non parte (indirizzo sbagliato?).")
                        else:
                            orecchio = Orecchio(registrazione, cartella_chiamate)
                            evento("squilla", a=indirizzo(a))
            elif tipo == "parla":
                if not chiamata:
                    evento("parlato", id=cmd.get("id"), errore="nessuna chiamata")
                else:
                    try:
                        lettore = chiamata.player
                        if parlando:
                            lettore.close()
                        lettore.open(cmd["file"])
                        lettore.start()
                        secondi = durata_wav(cmd["file"])
                        parlando = (cmd.get("id"), time.time() + secondi + 0.2, lettore)
                        orecchio.zitto_per(secondi + DOPO_PARLATO_MS / 1000)
                    except Exception as e:
                        evento("parlato", id=cmd.get("id"), errore=str(e))
            elif tipo == "riattacca":
                if chiamata:
                    try:
                        chiamata.terminate()
                    except Exception:
                        core.terminate_all_calls()

        if chiamata is not None:
            stato = nome_stato(chiamata.state)
            if stato != ultimo_stato:
                ultimo_stato = stato
                if stato == "StreamsRunning" and orecchio and orecchio.numero == 0 and not getattr(orecchio, "risposto", False):
                    orecchio.risposto = True
                    evento("risposto")
                if stato in ("End", "Released", "Error"):
                    chiudi_chiamata(f"{stato}: {descrivi_errore(chiamata)}")
                    continue
            if not codice_detto:
                try:
                    codice = chiamata.authentication_token
                except Exception:
                    codice = None
                if codice:
                    codice_detto = True
                    evento("codice", codice=codice.upper())
                    try:
                        chiamata.authentication_token_verified = True
                    except Exception:
                        pass
            if parlando and time.time() >= parlando[1]:
                try:
                    parlando[2].close()
                except Exception:
                    pass
                evento("parlato", id=parlando[0])
                parlando = None
            if orecchio and getattr(orecchio, "risposto", False):
                try:
                    frase = orecchio.leggi()
                except Exception as e:  # un problema nell'ascolto non deve far cadere la chiamata
                    frase = None
                    if not getattr(orecchio, "segnalato", False):
                        orecchio.segnalato = True
                        evento("errore", messaggio=f"ascolto: {type(e).__name__}: {e}")
                if frase:
                    evento("frase", file=frase)
        time.sleep(0.01)


if __name__ == "__main__":
    try:
        sys.exit(main() or 0)
    except Exception as e:  # qualunque errore arriva al motore di Ambrogio, spiegato
        import traceback

        traceback.print_exc()
        evento("errore", messaggio=f"{type(e).__name__}: {e}")
        sys.exit(1)
