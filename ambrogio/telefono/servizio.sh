#!/usr/bin/env bash
# Il telefono di Ambrogio: lo accende il motore di Ambrogio (non serve lanciarlo a mano).
CARTELLA="$(cd "$(dirname "$0")" && pwd)"
AMBIENTE="$HOME/.ambrogio-telefono"
if [ ! -x "$AMBIENTE/bin/python" ]; then
  echo '@@AMBROGIO {"evento": "errore", "messaggio": "Il telefono non è installato: in Ubuntu esegui bash telefono/installa.sh"}'
  exit 1
fi
if [ -f "$AMBIENTE/cartella-libpython" ]; then
  export LD_LIBRARY_PATH="$(cat "$AMBIENTE/cartella-libpython")${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi
exec "$AMBIENTE/bin/python" -u "$CARTELLA/servizio.py" "$@"
