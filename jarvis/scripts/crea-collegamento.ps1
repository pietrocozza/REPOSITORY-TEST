# Crea l'icona "Jarvis" sul desktop: con un doppio clic Jarvis si accende e si apre nella sua finestra.
# Uso (in PowerShell, nella cartella jarvis):  npm run collegamento

$cartella = Split-Path -Parent $PSScriptRoot
$desktop = [Environment]::GetFolderPath('Desktop')
$percorso = Join-Path $desktop 'Jarvis.lnk'

$shell = New-Object -ComObject WScript.Shell
$link = $shell.CreateShortcut($percorso)
$link.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
# La finestra di PowerShell parte ridotta a icona: è il "motore" di Jarvis. Chiudendola, Jarvis si spegne.
$link.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -Command `"Set-Location -LiteralPath '$cartella'; npm start`""
$link.WorkingDirectory = $cartella
$link.IconLocation = Join-Path $PSScriptRoot 'jarvis.ico'
$link.Description = 'Avvia J.A.R.V.I.S.'
$link.Save()

Write-Host "`nFatto: sul desktop c'è l'icona Jarvis ($percorso).`n" -ForegroundColor Green
