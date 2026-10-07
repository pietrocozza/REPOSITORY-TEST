#!/usr/bin/env bash
# Installa il "telefono" di Ambrogio dentro Linux (WSL): Python e il pezzo ufficiale di Linphone.
# Si lancia dalla finestra di Ubuntu, nella cartella ambrogio:  bash telefono/installa.sh
set -e
CARTELLA="$(cd "$(dirname "$0")" && pwd)"
AMBIENTE="$HOME/.ambrogio-telefono"

echo
echo "== 1/4  Programmi di base (ti chiede la password di Ubuntu: mentre la scrivi non si vede nulla, è normale)"
sudo apt-get update -y
sudo apt-get install -y python3 python3-venv python3-pip curl ca-certificates
# librerie che il pezzo di Linphone può chiedere (i nomi cambiano tra le versioni di Ubuntu: si prova con tutti)
for p in libasound2t64 libasound2 libpulse0 libv4l-0t64 libv4l-0 libgl1 libegl1 libglew2.2 libxext6 libxinerama1 libxrandr2 libsqlite3-0 libxml2 libturbojpeg; do
  sudo apt-get install -y "$p" >/dev/null 2>&1 || true
done

echo
echo "== 2/4  Ambiente Python di Ambrogio in $AMBIENTE"
python3 -m venv "$AMBIENTE"
"$AMBIENTE/bin/pip" install --upgrade pip >/dev/null

echo
echo "== 3/4  Cerco il pezzo ufficiale di Linphone sul sito linphone.org"
URL="$("$AMBIENTE/bin/python" "$CARTELLA/trova_linphone.py")"
echo "Trovato: $URL"
"$AMBIENTE/bin/pip" install "$URL"

echo
echo "== 4/4  Prova"
if "$AMBIENTE/bin/python" -c "import linphone; print('Linphone pronto, versione', linphone.Core.get_version())"; then
  echo
  echo "TUTTO OK. Adesso puoi fare la chiamata di prova:  bash telefono/prova.sh"
else
  echo
  echo "Linphone non parte: copia le righe qui sopra e mandale a Claude."
  exit 1
fi
