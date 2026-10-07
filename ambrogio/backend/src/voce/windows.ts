import { execFile } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ErroreVoce } from './gemini.ts'

// Voce di riserva, gratis e senza internet: la sintesi vocale di Windows (voce italiana se installata).
// Serve al telefono quando Gemini ha finito le richieste: meno bella, ma Ambrogio non resta muto.
// Il testo passa da una variabile d'ambiente, mai dentro il comando.

const SCRIPT = [
  'Add-Type -AssemblyName System.Speech',
  '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
  "$v = $s.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -like 'it-*' } | Select-Object -First 1",
  'if ($v) { $s.SelectVoice($v.VoiceInfo.Name) }',
  '$f = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)',
  '$s.SetOutputToWaveFile($env:AMBROGIO_VOCE_FILE, $f)',
  '$s.Speak($env:AMBROGIO_VOCE_TESTO)',
  '$s.Dispose()',
].join('; ')

export function sintetizzaWindows(testo: string): Promise<Buffer> {
  if (process.platform !== 'win32') return Promise.reject(new ErroreVoce('errore', 'La voce di Windows c’è solo su Windows.'))
  const file = path.join(os.tmpdir(), `ambrogio-voce-${process.pid}-${Date.now()}.wav`)
  return new Promise((risolvi, rifiuta) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', SCRIPT],
      { env: { ...process.env, AMBROGIO_VOCE_FILE: file, AMBROGIO_VOCE_TESTO: testo }, timeout: 30_000, windowsHide: true },
      (err) => {
        try {
          if (err) throw new ErroreVoce('errore', `Voce di Windows non disponibile: ${err.message}`)
          risolvi(fs.readFileSync(file))
        } catch (e) {
          rifiuta(e)
        } finally {
          fs.rm(file, { force: true }, () => {})
        }
      },
    )
  })
}
