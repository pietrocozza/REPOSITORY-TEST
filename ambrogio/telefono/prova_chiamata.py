"""Chiamata di prova del telefono di Ambrogio (Linphone).

Ambrogio si collega con il suo account Linphone, fa squillare il tuo, e quando rispondi:
  - ti fa sentire tre bip (così sai che la sua voce arriva fino a te);
  - per 8 secondi ascolta e registra quello che dici (così sappiamo che la tua voce arriva a lui);
poi riattacca e dice com'è andata.

Legge account e password dal file .env di Ambrogio (AMBROGIO_LINPHONE_UTENTE, _PASSWORD, _CHIAMA).
Niente scheda audio: Ambrogio "parla" da un file e "ascolta" su un file, come farà nelle telefonate vere.
"""
import array
import math
import os
import sys
import tempfile
import time
import wave

DOMINIO = "sip.linphone.org"
ASCOLTO_SECONDI = 8
CARTELLA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def leggi_env():
    valori = {}
    try:
        with open(os.path.join(CARTELLA, ".env"), encoding="utf-8-sig") as f:
            for riga in f:
                riga = riga.strip()
                if riga and not riga.startswith("#") and "=" in riga:
                    chiave, valore = riga.split("=", 1)
                    valori[chiave.strip()] = valore.strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return valori


def indirizzo(testo):
    """'ambrogio.ai' oppure 'sip:ambrogio.ai@sip.linphone.org' -> indirizzo SIP completo"""
    testo = testo.strip()
    if not testo.startswith("sip:"):
        testo = "sip:" + testo
    if "@" not in testo:
        testo += "@" + DOMINIO
    return testo


def nome_stato(stato):
    """RegistrationState.Ok, RegistrationStateOk, CallState.StreamsRunning … -> Ok, StreamsRunning"""
    nome = getattr(stato, "name", None) or str(stato)
    nome = nome.split(".")[-1]
    for prefisso in ("RegistrationState", "CallState", "GlobalState", "Reason"):
        if nome.startswith(prefisso) and len(nome) > len(prefisso):
            return nome[len(prefisso):]
    return nome


def crea_bip(percorso):
    """tre bip a 16 kHz, poi silenzio: è la "voce" di Ambrogio per la prova"""
    hz = 16000
    campioni = array.array("h")
    for _ in range(3):
        campioni.extend(int(9000 * math.sin(2 * math.pi * 880 * i / hz)) for i in range(int(hz * 0.35)))
        campioni.extend([0] * int(hz * 0.35))
    campioni.extend([0] * hz * 2)
    with wave.open(percorso, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(hz)
        w.writeframes(campioni.tobytes())


def volume(percorso):
    """quanto è forte la registrazione (0 = silenzio)"""
    try:
        with wave.open(percorso, "rb") as w:
            dati = array.array("h", w.readframes(w.getnframes()))
    except Exception:
        return None
    if not dati:
        return 0
    return int(math.sqrt(sum(c * c for c in dati) / len(dati)))


def firma(funzione):
    """come va chiamata una funzione di Linphone (per capire gli errori)"""
    doc = (getattr(funzione, "__doc__", None) or "").strip().splitlines()
    return doc[0] if doc else repr(funzione)


def crea_credenziali(fabbrica, utente, password):
    """nome utente e password dell'account di Ambrogio, nei modi in cui le varie versioni di Linphone li accettano"""
    tentativi = [
        lambda: fabbrica.create_auth_info(utente, None, password, None, None, DOMINIO),
        # con tre soli dati: qualunque sia l'ordine, sotto si rimette ogni campo al suo posto
        lambda: fabbrica.create_auth_info(utente, None, password),
        lambda: fabbrica.create_auth_info(utente, password, DOMINIO),
        lambda: fabbrica.create_auth_info(username=utente, userid=None, passwd=password, ha1=None, realm=None, domain=DOMINIO),
    ]
    errori = []
    for prova in tentativi:
        try:
            credenziali = prova()
            break
        except TypeError as e:
            errori.append(str(e))
    else:
        esci("Non riesco a passare a Linphone nome e password.\n"
             f"Linphone dice: {firma(fabbrica.create_auth_info)}\n" + "\n".join(errori))
    # si completa in ogni caso quello che serve
    for campo, valore in (("username", utente), ("userid", utente), ("password", password), ("domain", DOMINIO)):
        try:
            if getattr(credenziali, campo, None) != valore:
                setattr(credenziali, campo, valore)
        except Exception:
            pass
    return credenziali


def enum_linphone(linphone, tipo, nome):
    """linphone.MediaEncryption.ZRTP o linphone.MediaEncryption.MediaEncryptionZRTP, come capita"""
    classe = getattr(linphone, tipo, None)
    for candidato in (nome, tipo + nome):
        if classe is not None and hasattr(classe, candidato):
            return getattr(classe, candidato)
    return None


def descrivi_errore(chiamata):
    parti = []
    try:
        parti.append(nome_stato(chiamata.reason))
    except Exception:
        pass
    try:
        info = chiamata.error_info
        frase = getattr(info, "phrase", "") or ""
        codice = getattr(info, "protocol_code", "") or ""
        if frase or codice:
            parti.append(f"{codice} {frase}".strip())
    except Exception:
        pass
    return " · ".join(parti) or "?"


def esci(messaggio):
    print("\n" + messaggio)
    sys.exit(1)


def main():
    env = leggi_env()
    utente = env.get("AMBROGIO_LINPHONE_UTENTE", "")
    password = env.get("AMBROGIO_LINPHONE_PASSWORD", "")
    chiama = env.get("AMBROGIO_LINPHONE_CHIAMA", "")
    if not (utente and password and chiama):
        esci("Nel file .env mancano AMBROGIO_LINPHONE_UTENTE, AMBROGIO_LINPHONE_PASSWORD o AMBROGIO_LINPHONE_CHIAMA.")
    utente = utente.removeprefix("sip:").split("@")[0]
    io, destinatario = indirizzo(utente), indirizzo(chiama)

    import linphone

    lavoro = tempfile.mkdtemp(prefix="ambrogio-telefono-")
    voce = os.path.join(lavoro, "bip.wav")
    registrazione = os.path.join(lavoro, "ascolto.wav")
    crea_bip(voce)

    # Linphone vuole cartelle sue per configurazione e dati: senza, resta a metà avvio
    casa = os.path.join(os.path.expanduser("~"), ".ambrogio-telefono", "linphone")
    for cartella in (casa, os.path.join(os.path.expanduser("~"), ".local", "share", "linphone")):
        os.makedirs(cartella, exist_ok=True)

    fabbrica = linphone.Factory.get()
    for campo in ("data_dir", "config_dir", "download_dir", "cache_dir"):
        try:
            setattr(fabbrica, campo, casa)
        except Exception:
            pass
    core = fabbrica.create_core(os.path.join(casa, "linphonerc"), "", None)
    # certificati per il collegamento sicuro (TLS) con sip.linphone.org
    for certificati in ("/etc/ssl/certs/ca-certificates.crt",):
        if os.path.exists(certificati):
            try:
                core.root_ca = certificati
            except Exception:
                pass
    # niente scheda audio: si parla da un file e si ascolta su un file
    core.use_files = True
    core.play_file = voce
    core.record_file = registrazione
    core.video_capture_enabled = False
    core.video_display_enabled = False
    # porte scelte a caso (sotto Linux in Windows le porte fisse possono essere occupate)
    trasporti = fabbrica.create_transports()
    trasporti.udp_port = -1
    trasporti.tcp_port = -1
    trasporti.tls_port = -1
    core.transports = trasporti

    # ICE e STUN di Linphone: servono perché la voce passi attraverso i router di casa
    nat = core.create_nat_policy()
    nat.stun_server = "stun.linphone.org"
    nat.ice_enabled = True
    nat.stun_enabled = True
    core.nat_policy = nat

    parametri = core.create_account_params()
    parametri.identity_address = fabbrica.create_address(io)
    parametri.server_address = fabbrica.create_address(f"sip:{DOMINIO};transport=tls")
    parametri.register_enabled = True
    parametri.nat_policy = nat
    account = core.create_account(parametri)
    credenziali = crea_credenziali(fabbrica, utente, password)
    def aspetta(condizione, secondi):
        fine = time.time() + secondi
        while time.time() < fine:
            core.iterate()
            if condizione():
                return True
            time.sleep(0.02)
        return False

    core.start()
    print(f"Linphone {linphone.Core.get_version()} — mi accendo …")
    accensione = [None]

    def acceso():
        stato = nome_stato(core.global_state)
        if stato != accensione[0]:
            print(f"  Linphone: {stato}")
            accensione[0] = stato
        return stato == "On"

    if not aspetta(acceso, 20):
        esci("Linphone non riesce ad accendersi del tutto: copia tutte le righe e mandale a Claude.")

    # l'account salvato dalle prove precedenti si toglie, così non risulta due volte
    for pulizia in ("clear_accounts", "clear_all_auth_info"):
        try:
            getattr(core, pulizia)()
        except Exception:
            pass
    core.add_auth_info(credenziali)
    core.add_account(account)
    core.default_account = account
    print(f"Mi collego come {io} …")
    ultimo = [None]

    def registrato():
        stato = nome_stato(account.state)
        if stato != ultimo[0]:
            print(f"  collegamento: {stato}")
            ultimo[0] = stato
        return stato in ("Ok", "Failed")

    aspetta(registrato, 30)
    finale = nome_stato(account.state)
    if finale == "Failed":
        esci("Linphone ha rifiutato il collegamento: controlla nome utente e password di Ambrogio nel file .env.")
    if finale != "Ok":
        esci(f"Non riesco a collegarmi a sip.linphone.org (stato: {finale}): copia tutte le righe e mandale a Claude.")
    print("Collegato!")

    # Il Linphone del telefono di solito vuole le chiamate cifrate (altrimenti risponde "NotAcceptable"):
    # si prova prima con ZRTP (quella di Linphone), poi SRTP, poi senza cifratura.
    finita = ("End", "Released", "Error")
    chiamata = None
    for cifratura in ("ZRTP", "SRTP", "None"):
        valore = enum_linphone(linphone, "MediaEncryption", cifratura)
        if valore is None and cifratura != "None":
            nomi = [n for n in dir(getattr(linphone, "MediaEncryption", object)) if not n.startswith("_")]
            print(f"  (cifratura {cifratura} non trovata; Linphone offre: {', '.join(nomi) or '?'})")
            continue
        try:
            if cifratura != "None" and not core.is_media_encryption_supported(valore):
                print(f"  (cifratura {cifratura} non disponibile qui)")
                continue
        except Exception:
            pass
        if valore is not None:
            try:
                core.media_encryption = valore
            except Exception as e:
                print(f"  (non riesco a impostare la cifratura {cifratura}: {e})")
                continue
            # "cifratura obbligatoria" spenta, se questa versione di Linphone ha l'impostazione
            for campo in ("media_encryption_mandatory", "media_encryption_mandatory_enabled"):
                try:
                    setattr(core, campo, False)
                    break
                except Exception:
                    pass

        print(f"Chiamo {destinatario} (cifratura {cifratura}) … rispondi dal telefono.")
        chiamata = core.invite(destinatario)
        if chiamata is None:
            esci("La chiamata non parte (indirizzo da chiamare sbagliato?).")
        ultimo_stato = [None]

        def stato_chiamata(c=chiamata, u=ultimo_stato):
            stato = nome_stato(c.state)
            if stato != u[0]:
                print(f"  chiamata: {stato}")
                u[0] = stato
            return stato

        aspetta(lambda: stato_chiamata() in ("StreamsRunning",) + finita, 60)
        if stato_chiamata() == "StreamsRunning":
            break
        motivo = descrivi_errore(chiamata)
        aspetta(lambda: stato_chiamata() == "Released", 3)
        if "NotAcceptable" in motivo:
            print(f"  il telefono non accetta la cifratura {cifratura} ({motivo}): provo la prossima")
            continue
        core.terminate_all_calls()
        aspetta(lambda: False, 2)
        esci(f"Nessuna risposta o chiamata rifiutata (motivo: {motivo}).")
    else:
        esci("Il telefono non ha accettato nessun tipo di chiamata: copia tutte le righe e mandale a Claude.")

    print(f"Hai risposto! Dovresti sentire tre bip. Poi parla pure: ti ascolto per {ASCOLTO_SECONDI} secondi …")
    aspetta(lambda: stato_chiamata() in finita, ASCOLTO_SECONDI + 3)
    if stato_chiamata() not in finita:
        chiamata.terminate()
    aspetta(lambda: stato_chiamata() in ("Released",), 5)
    core.stop()

    forza = volume(registrazione)
    print()
    if forza is None:
        print("La chiamata funziona, ma non trovo la registrazione: mandami queste righe.")
    elif forza > 150:
        print(f"PERFETTO: ti ho sentito (volume {forza}). La voce passa nei due sensi.")
    else:
        print(f"La chiamata funziona ma ho registrato solo silenzio (volume {forza}). Dimmi se tu hai sentito i bip.")


if __name__ == "__main__":
    try:
        main()
    except (TypeError, AttributeError) as e:
        import traceback
        traceback.print_exc()
        print("\nCopia tutte queste righe e mandale a Claude.")
