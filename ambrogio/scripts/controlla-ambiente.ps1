# Controllo dell'ambiente Windows per Ambrogio.
# Uso: apri PowerShell nella cartella ambrogio e scrivi:
#   powershell -ExecutionPolicy Bypass -File scripts\controlla-ambiente.ps1
# Non installa niente: mostra solo cosa c'è e cosa manca.

function Controlla($nome, $comando, $argomenti, $serve, $comeInstallare) {
  $percorso = (Get-Command $comando -ErrorAction SilentlyContinue | Select-Object -First 1).Source
  if ($percorso) {
    $versione = (& $comando $argomenti 2>&1 | Select-Object -First 1)
    Write-Host ("  OK   {0,-12} {1}" -f $nome, $versione) -ForegroundColor Green
  } elseif ($serve) {
    Write-Host ("  MANCA {0,-11} {1}" -f $nome, $comeInstallare) -ForegroundColor Yellow
  } else {
    Write-Host ("  --   {0,-12} non installato (non serve per ora)" -f $nome) -ForegroundColor DarkGray
  }
}

Write-Host "`nControllo dell'ambiente per Ambrogio`n"
Write-Host ("  Windows      {0}" -f [System.Environment]::OSVersion.VersionString)
Controlla "winget"      "winget" "--version"   $false "(gestore pacchetti di Windows)"
Controlla "Node.js"     "node"   "--version"   $true  "winget install OpenJS.NodeJS.LTS"
Controlla "npm"         "npm"    "--version"   $true  "si installa insieme a Node.js"
Controlla "Git"         "git"    "--version"   $true  "winget install Git.Git"
Controlla "Claude Code" "claude" "--version"   $true  "https://code.claude.com/docs (installer per Windows)"
Controlla "Python"      "python" "--version"   $false ""
Controlla "pip"         "pip"    "--version"   $false ""

$claude = Get-Command claude -ErrorAction SilentlyContinue
if ($claude) {
  Write-Host "`nLogin di Claude Code:"
  & claude auth status --text 2>&1 | ForEach-Object { Write-Host "  $_" }
}
if ($env:ANTHROPIC_API_KEY) {
  Write-Host "`n  ATTENZIONE: c'è una variabile ANTHROPIC_API_KEY (API a consumo). Ambrogio la ignora, ma è bene saperlo." -ForegroundColor Yellow
}
Write-Host ""
