# Crea l'icona "Ambrogio" sul desktop: con un doppio clic Ambrogio si accende e si apre nella sua finestra.
# Uso (in PowerShell, nella cartella ambrogio):  npm run collegamento

$cartella = Split-Path -Parent $PSScriptRoot
$desktop = [Environment]::GetFolderPath('Desktop')
$percorso = Join-Path $desktop 'Ambrogio.lnk'

# la vecchia icona di quando si chiamava Jarvis non serve più
$vecchia = Join-Path $desktop 'Jarvis.lnk'
if (Test-Path -LiteralPath $vecchia) { Remove-Item -LiteralPath $vecchia }

$shell = New-Object -ComObject WScript.Shell
$link = $shell.CreateShortcut($percorso)
$link.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
# La finestra di PowerShell parte ridotta a icona: è il "motore" di Ambrogio. Chiudendola, Ambrogio si spegne.
$link.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -Command `"Set-Location -LiteralPath '$cartella'; npm start`""
$link.WorkingDirectory = $cartella
$link.IconLocation = Join-Path $PSScriptRoot 'ambrogio.ico'
$link.Description = 'Avvia Ambrogio'
$link.Save()

Write-Host "`nFatto: sul desktop c'è l'icona Ambrogio ($percorso).`n" -ForegroundColor Green
