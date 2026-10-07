#!/usr/bin/env bash
# Installa il programma delle telefonate di Ambrogio dentro Linux (WSL): Python e il pezzo ufficiale di Linphone.
# Si lancia dalla finestra di Ubuntu, nella cartella ambrogio:  bash telefono/installa.sh
set -e
CARTELLA="$(cd "$(dirname "$0")" && pwd)"
AMBIENTE="$HOME/.ambrogio-telefono"
export PATH="$HOME/.local/bin:$PATH"

echo
echo "== 1/4  Programmi di base (se chiede la password di Ubuntu: mentre la scrivi non si vede nulla, è normale)"
# niente domande durante l'installazione (altrimenti resterebbe ferma ad aspettare una risposta)
APT="sudo DEBIAN_FRONTEND=noninteractive apt-get -y -q"
$APT update
$APT install python3 curl ca-certificates
# librerie che il pezzo di Linphone può chiedere (fatto per Ubuntu 24.04): si installano quelle che esistono qui
for p in libasound2t64 libpulse0 libv4l-0t64 libgl1 libegl1 libglew2.2 libxext6 libxinerama1 libxrandr2 \
         libsqlite3-0 libxml2 libturbojpeg libturbojpeg0 libmysqlclient21 libpython3.12t64 libsrtp2-1 libopus0 libspeex1 libspeexdsp1; do
  if apt-cache policy "$p" 2>/dev/null | grep -q 'Candidate: [0-9]'; then
    $APT install "$p" >/dev/null 2>&1 && echo "  ok  $p" || echo "  --  $p (non installata)"
  fi
done
if ! grep -q 'VERSION_ID="24.04"' /etc/os-release 2>/dev/null; then
  echo
  echo "ATTENZIONE: questo è $(. /etc/os-release; echo "$PRETTY_NAME"). Linphone è fatto per Ubuntu 24.04:"
  echo "se più sotto manca qualche libreria, installa Ubuntu 24.04 (in PowerShell: wsl --install -d Ubuntu-24.04)."
fi

echo
echo "== 2/4  Cerco il pezzo ufficiale di Linphone sul sito linphone.org"
URL="$(python3 "$CARTELLA/trova_linphone.py")"
echo "Trovato: ${URL##*/}"
# la versione di Python per cui è fatto (per esempio cp312 -> 3.12)
VERSIONE_PY="$(echo "${URL##*/}" | sed -n 's/.*-cp3\([0-9]*\)-.*/3.\1/p')"

echo
echo "== 3/4  Python ${VERSIONE_PY:-di sistema} solo per Ambrogio (in $AMBIENTE)"
# uv scarica la versione di Python giusta senza toccare quella di Ubuntu
if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi
rm -rf "$AMBIENTE"
uv venv --python "${VERSIONE_PY:-python3}" "$AMBIENTE"
uv pip install --python "$AMBIENTE/bin/python" "$URL"

echo
echo "== 4/4  Prova"
# Linphone vuole la libreria condivisa di Python (libpython3.X.so): si cerca dove sta
LIBPY="libpython${VERSIONE_PY}.so.1.0"
LIBDIR="$("$AMBIENTE/bin/python" -c 'import sysconfig; print(sysconfig.get_config_var("LIBDIR") or "")')"
if [ ! -e "$LIBDIR/$LIBPY" ]; then
  LIBDIR="$(dirname "$(find "$HOME/.local/share/uv" /usr/lib /usr/local/lib -name "$LIBPY" 2>/dev/null | head -n 1)" 2>/dev/null || true)"
fi
if [ -z "$LIBDIR" ] || [ ! -e "$LIBDIR/$LIBPY" ]; then
  echo "Il Python scaricato non ha $LIBPY: prendo Python $VERSIONE_PY completo da conda-forge (circa 50 MB)"
  if ! command -v micromamba >/dev/null 2>&1; then
    mkdir -p "$HOME/.local/bin"
    curl -Ls https://micro.mamba.pm/api/micromamba/linux-64/latest | tar -xj -C "$HOME/.local" bin/micromamba
  fi
  PYCOMPLETO="$HOME/.ambrogio-python"
  rm -rf "$PYCOMPLETO"
  MAMBA_ROOT_PREFIX="$HOME/.micromamba" micromamba create -y -q -p "$PYCOMPLETO" -c conda-forge "python=$VERSIONE_PY"
  rm -rf "$AMBIENTE"
  uv venv --python "$PYCOMPLETO/bin/python" "$AMBIENTE"
  uv pip install --python "$AMBIENTE/bin/python" "$URL"
  LIBDIR="$PYCOMPLETO/lib"
fi
# prova.sh e Ambrogio la ritrovano qui
echo "$LIBDIR" > "$AMBIENTE/cartella-libpython"
export LD_LIBRARY_PATH="$LIBDIR${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"

MANCANTI="$(find "$AMBIENTE/lib" -path '*linphone*' -name '*.so*' -exec ldd {} \; 2>/dev/null | grep 'not found' | awk '{print $1}' | sort -u)"
if [ -n "$MANCANTI" ]; then
  echo "Librerie che mancano a Linphone:"
  echo "$MANCANTI" | sed 's/^/  /'
fi

if "$AMBIENTE/bin/python" -c "import linphone; print('Linphone pronto, versione', linphone.Core.get_version())"; then
  echo
  echo "TUTTO OK. Adesso puoi fare la chiamata di prova:  bash telefono/prova.sh"
else
  echo
  echo "Linphone non parte: copia le righe qui sopra e mandale a Claude."
  exit 1
fi
