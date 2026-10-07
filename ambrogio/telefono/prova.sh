#!/usr/bin/env bash
# Chiamata di prova: Ambrogio fa squillare il tuo Linphone.  Si lancia da Ubuntu, nella cartella ambrogio:  bash telefono/prova.sh
CARTELLA="$(cd "$(dirname "$0")" && pwd)"
AMBIENTE="$HOME/.ambrogio-telefono"
if [ -f "$AMBIENTE/cartella-libpython" ]; then
  export LD_LIBRARY_PATH="$(cat "$AMBIENTE/cartella-libpython")${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi
exec "$AMBIENTE/bin/python" "$CARTELLA/prova_chiamata.py" "$@"
