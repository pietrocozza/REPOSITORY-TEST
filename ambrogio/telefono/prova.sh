#!/usr/bin/env bash
# Chiamata di prova: Ambrogio fa squillare il tuo Linphone.  Si lancia da Ubuntu, nella cartella ambrogio:  bash telefono/prova.sh
CARTELLA="$(cd "$(dirname "$0")" && pwd)"
exec "$HOME/.ambrogio-telefono/bin/python" "$CARTELLA/prova_chiamata.py" "$@"
