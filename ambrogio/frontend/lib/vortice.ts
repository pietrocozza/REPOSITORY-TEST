// Il vortice della Sala macchine: un anello toroidale fatto di centinaia di fibre luminose, visto inclinato,
// con impulsi che corrono lungo le fibre e una corona di segnali sul bordo esterno.
// Tutto è calcolato sulla scheda video (WebGL2): le fibre sono descritte da pochi numeri e il movimento nasce
// dal tempo, quindi la struttura resta la stessa da un fotogramma all'altro e cambia solo l'attività.
// Ingressi: stato di Ambrogio, livello del microfono, livello e bande della voce, attività, modulo attivo.

import type { Modo } from '@/lib/nucleo-neurale'

export type IngressiVortice = {
  modo: Modo
  /** microfono 0–1 (in ascolto) */
  livelloIn: number
  /** voce di Ambrogio 0–1 (-1 se non misurabile) */
  livelloOut: number
  /** 8 bande di frequenza della voce di Ambrogio, 0–1 */
  bande: number[]
  /** modulo in uso adesso (indice in MODULI) o -1 */
  settore: number
  /** modulo selezionato da Pietro o -1 */
  selezione: number
}

export const MODULI = ['Linguaggio', 'Memoria', 'Ricerca', 'Email', 'Telefono', 'Voce', 'Pratiche', 'Affitti'] as const

const R = 1.0 // raggio dell'anello
const r = 0.42 // raggio della sezione
const DIST = 3.35 // distanza della camera
const PUNTI_FIBRA = 150
const TAU = Math.PI * 2

// Parametri per stato: velocità, luce, densità impulsi, fasci ambra, respiro
const STATI: Record<Modo, { vel: number; luce: number; impulsi: number; ambra: number; respiro: number; corona: number }> = {
  idle: { vel: 0.25, luce: 0.55, impulsi: 0.12, ambra: 0.12, respiro: 0.022, corona: 0.25 },
  listening: { vel: 0.35, luce: 0.8, impulsi: 0.2, ambra: 0.1, respiro: 0.025, corona: 0.45 },
  thinking: { vel: 0.85, luce: 0.78, impulsi: 0.65, ambra: 0.75, respiro: 0.03, corona: 0.55 },
  working: { vel: 1.0, luce: 0.85, impulsi: 0.85, ambra: 0.9, respiro: 0.03, corona: 0.65 },
  waiting: { vel: 0.4, luce: 0.7, impulsi: 0.25, ambra: 0.4, respiro: 0.025, corona: 0.4 },
  speaking: { vel: 0.6, luce: 0.95, impulsi: 0.45, ambra: 0.35, respiro: 0.04, corona: 0.85 },
  success: { vel: 0.5, luce: 0.9, impulsi: 0.4, ambra: 0.3, respiro: 0.03, corona: 0.6 },
  error: { vel: 0.3, luce: 0.6, impulsi: 0.15, ambra: 0.2, respiro: 0.02, corona: 0.3 },
}

// numeri pseudo-casuali stabili
const caso = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const COMUNE = /* glsl */ `
uniform float uTempo;
uniform float uRespiro;
uniform float uAudio;      // livello che deforma il volume (voce o microfono)
uniform float uOndeIn;     // onde dell'ascolto
uniform mat3 uRot;
uniform float uF;
uniform float uAspetto;
const float R = ${R.toFixed(3)};
const float TAU = 6.2831853;

vec3 toro(float u, float v, float rr) {
  // deformazioni continue e lente: il volume respira, il bordo ondeggia
  float raggio = R * (1.0 + uRespiro * sin(uTempo * 0.9) + uAudio * 0.05)
               + 0.025 * sin(2.0 * u - uTempo * 0.35) + uOndeIn * 0.035 * sin(7.0 * u - uTempo * 5.0);
  float sez = rr * (1.0 + 0.07 * sin(3.0 * u + uTempo * 0.6) + uAudio * 0.12);
  return vec3((raggio + sez * cos(v)) * cos(u), (raggio + sez * cos(v)) * sin(u), sez * sin(v));
}
vec4 proietta(vec3 p, out float vicino) {
  vec3 q = uRot * p;
  vicino = clamp((q.z + 1.35) / 2.7, 0.0, 1.0); // 1 = davanti
  q.z -= ${DIST.toFixed(2)};
  return vec4(q.x * uF / uAspetto, q.y * uF, 0.0, -q.z);
}
float distAng(float a, float b) {
  float d = mod(a - b + 3.14159265, TAU) - 3.14159265;
  return abs(d);
}
`

const VS_FIBRE = /* glsl */ `#version 300 es
precision highp float;
in float aT;
in vec4 aFibra;   // u0, ampiezza, v0, avvolgimento
in vec4 aFibra2;  // raggio, seme, tipo (0 blu, 1 ciano, 2 ambra), fascio
uniform float uVel;
uniform float uLuce;
uniform float uAmbra;
uniform float uSettore;    // angolo del modulo attivo (-10 = nessuno)
uniform float uSelezione;  // fascio selezionato (-1 = nessuno)
uniform float uOnda;       // 0..1 onda di completamento (-1 = spenta)
uniform float uErrore;
${COMUNE}
out vec4 vColore;
void main() {
  float seme = aFibra2.y;
  float u = aFibra.x + aFibra.y * aT + uTempo * uVel * (0.05 + 0.05 * seme);
  float v = aFibra.z + aFibra.w * aFibra.y * aT + uTempo * uVel * (seme - 0.5) * 0.3;
  vec3 p = toro(u, v, aFibra2.x);
  float vicino;
  gl_Position = proietta(p, vicino);

  // colori come nel riferimento: tanto blu, poi ciano, oro, arancio, qualche rosso e verde, e fibre ghiaccio
  float tipo = aFibra2.z;
  vec3 c = tipo < 0.5 ? vec3(0.36, 0.62, 1.0)
         : tipo < 1.5 ? vec3(0.4, 0.86, 0.95)
         : tipo < 2.5 ? vec3(1.0, 0.8, 0.3)
         : tipo < 3.5 ? vec3(1.0, 0.52, 0.18)
         : tipo < 4.5 ? vec3(1.0, 0.26, 0.3)
         : tipo < 5.5 ? vec3(0.35, 1.0, 0.55)
         : vec3(0.92, 0.96, 1.0);
  float a = (0.07 + 0.3 * vicino * vicino) * uLuce;
  // i colori caldi si accendono di più quando Ambrogio lavora, ma restano sempre visibili
  if (tipo > 1.5 && tipo < 5.5) a *= 1.15 + uAmbra * 0.9;
  else a *= 0.85;
  // estremità sfumate
  a *= smoothstep(0.0, 0.08, aT) * smoothstep(1.0, 0.92, aT);
  float ang = mod(u, TAU);
  // modulo in uso: il suo settore si accende
  if (uSettore > -5.0) {
    float s = 1.0 - smoothstep(0.15, 0.55, distAng(ang, uSettore));
    a *= 1.0 + 2.2 * s;
    c = mix(c, vec3(0.92, 0.96, 1.0), s * 0.35);
    if (uErrore > 0.5) c = mix(c, vec3(1.0, 0.3, 0.33), s * 0.8);
  }
  // fascio selezionato: il suo percorso si legge attraverso la massa
  if (uSelezione > -0.5) {
    if (abs(aFibra2.w - uSelezione) < 0.5) { a = max(a * 3.0, 0.22 + 0.25 * vicino); c = mix(c, vec3(0.92, 0.96, 1.0), 0.45); }
    else a *= 0.45;
  }
  // onda di completamento che percorre l'anello
  if (uOnda >= 0.0) {
    float w = 1.0 - smoothstep(0.0, 0.45, distAng(ang, uOnda * TAU));
    a *= 1.0 + 3.0 * w;
    c = mix(c, vec3(0.92, 0.96, 1.0), w * 0.6);
  }
  vColore = vec4(c * a, a);
}
`

const VS_IMPULSI = /* glsl */ `#version 300 es
precision highp float;
in vec4 aFibra;
in vec4 aFibra2;
in vec4 aImpulso; // fase, velocità, posizione nella scia (0..4), indice 0..1
uniform float uVel;
uniform float uDensita;
uniform float uSelezione;
${COMUNE}
out vec4 vColore;
void main() {
  float seme = aFibra2.y;
  float t = fract(aImpulso.x + uTempo * aImpulso.y * (0.25 + uVel)) - aImpulso.z * 0.0035;
  float u = aFibra.x + aFibra.y * t + uTempo * uVel * (0.05 + 0.05 * seme);
  float v = aFibra.z + aFibra.w * aFibra.y * t + uTempo * uVel * (seme - 0.5) * 0.3;
  vec3 p = toro(u, v, aFibra2.x);
  float vicino;
  gl_Position = proietta(p, vicino);
  float attivo = step(aImpulso.w, uDensita);
  if (uSelezione > -0.5 && abs(aFibra2.w - uSelezione) < 0.5) attivo = 1.0;
  float scia = 1.0 - aImpulso.z / 4.0;
  float a = attivo * scia * (0.35 + 0.65 * vicino) * smoothstep(0.0, 0.05, t) * smoothstep(1.0, 0.95, t);
  vec3 c = aFibra2.z > 1.5 && aFibra2.z < 5.5 ? vec3(1.0, 0.85, 0.55) : vec3(0.92, 0.96, 1.0);
  if (aFibra2.z > 3.5 && aFibra2.z < 4.5) c = vec3(1.0, 0.4, 0.42);
  vColore = vec4(c * a, a);
}
`

const VS_CORONA = /* glsl */ `#version 300 es
precision highp float;
in vec3 aRaggio; // angolo, estremità (0 base, 1 punta), seme
uniform float uCorona;
uniform float uBande[8];
uniform float uLuce;
uniform float uSettore;
${COMUNE}
out vec4 vColore;
void main() {
  float u = aRaggio.x;
  float seme = aRaggio.z;
  // onde e gruppi coerenti: la corona riceve e trasmette
  float onda = max(0.0, sin(4.0 * u - uTempo * 1.1)) * max(0.0, sin(11.0 * u + uTempo * 0.7 + seme));
  float banda = uBande[int(mod(floor(u / TAU * 16.0), 8.0))];
  float lung = 0.05 + 0.11 * seme * seme + uCorona * (0.12 * onda + 0.22 * banda) + uOndeIn * 0.08 * max(0.0, sin(9.0 * u - uTempo * 6.0));
  if (uSettore > -5.0) lung += 0.1 * (1.0 - smoothstep(0.1, 0.5, distAng(mod(u, TAU), uSettore)));
  vec3 base = toro(u, 0.0, 0.45);
  vec3 dir = vec3(cos(u), sin(u), 0.0);
  vec3 p = base + dir * (0.015 + aRaggio.y * lung);
  float vicino;
  gl_Position = proietta(p, vicino);
  gl_PointSize = aRaggio.y > 0.5 ? 1.6 + 1.6 * vicino : 1.0;
  // una parte dell'anello calda (ambra), il resto ghiaccio, come nel riferimento
  float caldo = smoothstep(0.2, 0.4, fract(u / TAU + 0.05)) * (1.0 - smoothstep(0.7, 0.85, fract(u / TAU + 0.05)));
  vec3 c = mix(vec3(0.9, 0.95, 1.0), vec3(1.0, 0.55, 0.2), caldo);
  if (seme > 0.97) c = vec3(1.0, 0.3, 0.35); // qualche punta rossa, come segnali da guardare
  float a = (0.18 + 0.45 * vicino) * (0.5 + 0.5 * uLuce) * (aRaggio.y > 0.5 ? 1.0 : 0.55);
  vColore = vec4(c * a, a);
}
`

const VS_NODI = /* glsl */ `#version 300 es
precision highp float;
in vec3 aNodo; // u, v, indice
uniform float uSelezione;
uniform float uSettore;
uniform float uHover;
${COMUNE}
out vec4 vColore;
void main() {
  vec3 p = toro(aNodo.x, aNodo.y, 0.42);
  float vicino;
  gl_Position = proietta(p, vicino);
  bool acceso = abs(aNodo.z - uSelezione) < 0.5 || abs(aNodo.z - uHover) < 0.5 || (uSettore > -5.0 && distAng(aNodo.x, uSettore) < 0.1);
  gl_PointSize = acceso ? 9.0 : 5.0;
  float a = acceso ? 1.0 : 0.55 + 0.3 * vicino;
  vColore = vec4(vec3(0.92, 0.96, 1.0) * a, a);
}
`

const FS = /* glsl */ `#version 300 es
precision mediump float;
in vec4 vColore;
out vec4 colore;
void main() { colore = vColore; }
`

const FS_PUNTO = /* glsl */ `#version 300 es
precision mediump float;
in vec4 vColore;
out vec4 colore;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  if (r > 0.5) discard;
  float anello = smoothstep(0.5, 0.38, r) * (0.35 + 0.65 * smoothstep(0.18, 0.3, r));
  colore = vColore * anello;
}
`

const POSTI: Record<string, number> = { aT: 0, aRaggio: 0, aNodo: 0, aFibra: 1, aFibra2: 2, aImpulso: 3 }

function compila(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const crea = (tipo: number, src: string) => {
    const s = gl.createShader(tipo)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(`${tipo === gl.VERTEX_SHADER ? 'vertex' : 'fragment'} shader: ${gl.getShaderInfoLog(s) || 'errore senza dettagli'} (${gl.isContextLost() ? 'contesto perso' : 'contesto ok'})`)
    return s
  }
  const p = gl.createProgram()!
  gl.attachShader(p, crea(gl.VERTEX_SHADER, vs))
  gl.attachShader(p, crea(gl.FRAGMENT_SHADER, fs))
  // posizioni fisse degli attributi: programmi diversi possono usare lo stesso VAO
  for (const [nome, loc] of Object.entries(POSTI)) gl.bindAttribLocation(p, loc, nome)
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'programma')
  return p
}

type Prog = { p: WebGLProgram; vao: WebGLVertexArrayObject; u: (nome: string) => WebGLUniformLocation | null }

// matrici 3x3 (colonne)
function mul(a: number[], b: number[]) {
  const o = new Array(9).fill(0)
  for (let c = 0; c < 3; c++) for (let rr = 0; rr < 3; rr++) for (let k = 0; k < 3; k++) o[c * 3 + rr] += a[k * 3 + rr] * b[c * 3 + k]
  return o
}
const rotX = (a: number) => [1, 0, 0, 0, Math.cos(a), Math.sin(a), 0, -Math.sin(a), Math.cos(a)]
const rotY = (a: number) => [Math.cos(a), 0, -Math.sin(a), 0, 1, 0, Math.sin(a), 0, Math.cos(a)]
const rotZ = (a: number) => [Math.cos(a), Math.sin(a), 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 1]

export class Vortice {
  private tela: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private fibre: Prog
  private impulsi: Prog
  private corona: Prog
  private nodi: Prog
  private nFibre: number
  private nFibreAttive: number
  private nImpulsi: number
  private nRaggi = 1400
  private indici: number
  private raf = 0
  private ultimo = performance.now()
  private tempo = 0
  private ridotto: boolean
  private leggi: () => IngressiVortice
  // valori addolciti (transizioni di ~600 ms)
  private s = { vel: 0.25, luce: 0.55, impulsi: 0.1, ambra: 0.1, respiro: 0.02, corona: 0.25, audio: 0, ondeIn: 0, settore: -10 }
  private onda = -1
  private ondaInizio = 0
  private modoPrima: Modo = 'idle'
  private mouse = { x: 0, y: 0 }
  private parallasse = { x: 0, y: 0, vx: 0, vy: 0 }
  private rot = [1, 0, 0, 0, 1, 0, 0, 0, 1]
  private f = 1
  private aspetto = 1
  hover = -1
  private tempiFotogramma: number[] = []
  private dpr = 1
  /** fotogrammi al secondo misurati */
  fps = 60
  qualita: 'piena' | 'media' | 'leggera' = 'piena'

  constructor(tela: HTMLCanvasElement, leggi: () => IngressiVortice, opz: { ridotto?: boolean } = {}) {
    const gl = tela.getContext('webgl2', { antialias: true, alpha: false, premultipliedAlpha: false })
    if (!gl) throw new Error('WebGL2 non disponibile')
    this.tela = tela
    this.gl = gl
    this.leggi = leggi
    this.ridotto = Boolean(opz.ridotto)
    this.nFibre = this.ridotto ? 260 : 460
    this.nFibreAttive = this.nFibre
    this.nImpulsi = this.ridotto ? 120 : 420

    // ── fibre: fasci intrecciati (16 fasci, ciascuno con fibre simili), più fibre sciolte ──
    const nFasci = 16
    const fibra = (i: number) => {
      const fascio = i % nFasci
      const sciolta = caso(i * 3.1) < 0.22
      const uBase = (fascio / nFasci) * TAU + (sciolta ? caso(i) * TAU : (caso(i * 1.7) - 0.5) * 0.5)
      const span = TAU * (0.45 + caso(i * 2.3) * 0.9)
      const v0 = (fascio * 2.4 + (sciolta ? caso(i * 5.1) * TAU : (caso(i * 4.3) - 0.5) * 0.9)) % TAU
      const avv = (fascio % 3 === 0 ? 1.0 : fascio % 3 === 1 ? 1.6 : 2.3) * (caso(i * 6.7) < 0.5 ? 1 : -1) * (0.9 + caso(i * 7.9) * 0.2)
      const rr = r * (0.78 + caso(i * 8.3) * 0.3)
      const x = caso(i * 9.7)
      const tipo = x < 0.38 ? 0 : x < 0.52 ? 1 : x < 0.68 ? 2 : x < 0.79 ? 3 : x < 0.85 ? 4 : x < 0.9 ? 5 : 6
      return { f1: [uBase, span, v0, avv], f2: [rr, caso(i * 11.3), tipo, fascio] }
    }
    const datiFibre = Array.from({ length: this.nFibre }, (_, i) => fibra(i))
    {
      const n = this.nFibre * PUNTI_FIBRA
      const aT = new Float32Array(n)
      const a1 = new Float32Array(n * 4)
      const a2 = new Float32Array(n * 4)
      const idx = new Uint32Array(this.nFibre * (PUNTI_FIBRA + 1))
      let k = 0
      for (let i = 0; i < this.nFibre; i++) {
        for (let j = 0; j < PUNTI_FIBRA; j++) {
          const v = i * PUNTI_FIBRA + j
          aT[v] = j / (PUNTI_FIBRA - 1)
          a1.set(datiFibre[i].f1, v * 4)
          a2.set(datiFibre[i].f2, v * 4)
          idx[k++] = v
        }
        idx[k++] = 0xffffffff // fine fibra (riavvio della linea)
      }
      this.indici = idx.length
      this.fibre = this.prog(VS_FIBRE, FS, { aT: [aT, 1], aFibra: [a1, 4], aFibra2: [a2, 4] }, idx)
    }
    // ── impulsi: ognuno corre su una fibra, con una scia di 4 segmenti ──
    {
      const n = this.nImpulsi * 8
      const a1 = new Float32Array(n * 4)
      const a2 = new Float32Array(n * 4)
      const ai = new Float32Array(n * 4)
      for (let p = 0; p < this.nImpulsi; p++) {
        const f = datiFibre[Math.floor(caso(p * 13.7) * this.nFibre)]
        const fase = caso(p * 2.9)
        const vel = 0.04 + caso(p * 3.3) * 0.08
        for (let s = 0; s < 4; s++)
          for (let e = 0; e < 2; e++) {
            const v = p * 8 + s * 2 + e
            a1.set(f.f1, v * 4)
            a2.set(f.f2, v * 4)
            ai.set([fase, vel, s + e, p / this.nImpulsi], v * 4)
          }
      }
      this.impulsi = this.prog(VS_IMPULSI, FS, { aFibra: [a1, 4], aFibra2: [a2, 4], aImpulso: [ai, 4] })
    }
    // ── corona: raggi (linee) e punte (punti) ──
    {
      const a = new Float32Array(this.nRaggi * 2 * 3)
      for (let i = 0; i < this.nRaggi; i++) {
        const u = (i / this.nRaggi) * TAU
        const seme = caso(i * 17.3)
        a.set([u, 0, seme, u, 1, seme], i * 6)
      }
      this.corona = this.prog(VS_CORONA, FS, { aRaggio: [a, 3] })
    }
    // ── nodi dei moduli (sulla superficie esterna, in alto) ──
    {
      const a = new Float32Array(MODULI.length * 3)
      MODULI.forEach((_, i) => a.set([(i / MODULI.length) * TAU + 0.2, 1.1, i], i * 3))
      this.nodi = this.prog(VS_NODI, FS_PUNTO, { aNodo: [a, 3] })
    }
    this.puntiCorona = compila(gl, VS_CORONA, FS_PUNTO)

    tela.addEventListener('pointermove', this.muovi)
    tela.addEventListener('pointerleave', this.esci)
    this.raf = requestAnimationFrame(this.disegna)
  }

  private puntiCorona: WebGLProgram
  private buffer: WebGLBuffer[] = []

  private prog(vs: string, fs: string, attributi: Record<string, [Float32Array, number]>, indici?: Uint32Array): Prog {
    const gl = this.gl
    const p = compila(gl, vs, fs)
    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)
    for (const [nome, [dati, dim]] of Object.entries(attributi)) {
      const loc = gl.getAttribLocation(p, nome)
      if (loc < 0) continue
      const b = gl.createBuffer()
      this.buffer.push(b)
      gl.bindBuffer(gl.ARRAY_BUFFER, b)
      gl.bufferData(gl.ARRAY_BUFFER, dati, gl.STATIC_DRAW)
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, dim, gl.FLOAT, false, 0, 0)
    }
    if (indici) {
      const b = gl.createBuffer()
      this.buffer.push(b)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indici, gl.STATIC_DRAW)
    }
    gl.bindVertexArray(null)
    const cache = new Map<string, WebGLUniformLocation | null>()
    return {
      p,
      vao,
      u: (nome) => {
        if (!cache.has(nome)) cache.set(nome, gl.getUniformLocation(p, nome))
        return cache.get(nome)!
      },
    }
  }

  private muovi = (e: PointerEvent) => {
    const b = this.tela.getBoundingClientRect()
    this.mouse.x = ((e.clientX - b.left) / b.width) * 2 - 1
    this.mouse.y = ((e.clientY - b.top) / b.height) * 2 - 1
    // nodo sotto il cursore
    const px = e.clientX - b.left
    const py = e.clientY - b.top
    let migliore = -1
    let dMin = 18
    this.posizioniNodi().forEach((n) => {
      const d = Math.hypot(n.x - px, n.y - py)
      if (d < dMin) {
        dMin = d
        migliore = n.indice
      }
    })
    this.hover = migliore
    this.tela.style.cursor = migliore >= 0 ? 'pointer' : 'default'
  }

  private esci = () => {
    this.mouse.x = 0
    this.mouse.y = 0
    this.hover = -1
  }

  /** onda luminosa di completamento */
  completa() {
    this.onda = 0
    this.ondaInizio = this.tempo
  }

  /** posizione sullo schermo (in pixel CSS) di un punto dell'anello: per etichette e richiami */
  proietta(u: number, v: number, rr = 0.42) {
    const q = this.applicaRot([(R + rr * Math.cos(v)) * Math.cos(u), (R + rr * Math.cos(v)) * Math.sin(u), rr * Math.sin(v)])
    const w = -(q[2] - DIST)
    const b = this.tela.getBoundingClientRect()
    return { x: ((q[0] * this.f) / this.aspetto / w + 1) * 0.5 * b.width, y: (1 - (q[1] * this.f) / w) * 0.5 * b.height, davanti: q[2] > 0 }
  }

  posizioniNodi() {
    return MODULI.map((nome, i) => ({ nome, indice: i, ...this.proietta((i / MODULI.length) * TAU + 0.2, 1.1) }))
  }

  /** angolo (sull'anello) del settore di un modulo */
  static angoloModulo(i: number) {
    return (i / MODULI.length) * TAU + 0.2
  }

  private applicaRot(p: number[]) {
    const m = this.rot
    return [m[0] * p[0] + m[3] * p[1] + m[6] * p[2], m[1] * p[0] + m[4] * p[1] + m[7] * p[2], m[2] * p[0] + m[5] * p[1] + m[8] * p[2]]
  }

  private adatta() {
    const b = this.tela.getBoundingClientRect()
    const limite = this.qualita === 'piena' ? 2 : this.qualita === 'media' ? 1.25 : 1
    this.dpr = Math.min(window.devicePixelRatio || 1, limite)
    const w = Math.max(1, Math.round(b.width * this.dpr))
    const h = Math.max(1, Math.round(b.height * this.dpr))
    if (this.tela.width !== w || this.tela.height !== h) {
      this.tela.width = w
      this.tela.height = h
    }
    this.aspetto = b.width / Math.max(1, b.height)
    // l'anello riempie la vista senza toccare i bordi (la corona compresa)
    this.f = Math.min(this.aspetto, 1) * 1.82
    this.gl.viewport(0, 0, w, h)
  }

  /** se il computer fatica, meno fibre, meno impulsi, risoluzione più bassa */
  private regolaQualita(dt: number) {
    this.tempiFotogramma.push(dt)
    if (this.tempiFotogramma.length < 90) return
    const medio = this.tempiFotogramma.reduce((a, b) => a + b, 0) / this.tempiFotogramma.length
    this.tempiFotogramma = []
    this.fps = Math.round(1000 / medio)
    if (medio > 24 && this.qualita !== 'leggera') {
      this.qualita = this.qualita === 'piena' ? 'media' : 'leggera'
      this.nFibreAttive = Math.round(this.nFibre * (this.qualita === 'media' ? 0.7 : 0.45))
    } else if (medio < 15 && this.qualita !== 'piena') {
      this.qualita = this.qualita === 'leggera' ? 'media' : 'piena'
      this.nFibreAttive = Math.round(this.nFibre * (this.qualita === 'media' ? 0.7 : 1))
    }
  }

  private disegna = (ora: number) => {
    this.raf = requestAnimationFrame(this.disegna)
    if (document.hidden) return
    const dt = Math.min(100, ora - this.ultimo)
    this.ultimo = ora
    this.regolaQualita(dt)
    const sec = dt / 1000
    const ing = this.leggi()
    const obiettivo = STATI[ing.modo] ?? STATI.idle
    const lento = this.ridotto ? 0.35 : 1
    this.tempo += sec * lento

    // transizioni morbide (~600 ms)
    const k = 1 - Math.exp(-sec / 0.22)
    const s = this.s
    s.vel += (obiettivo.vel * lento - s.vel) * k
    s.luce += (obiettivo.luce - s.luce) * k
    s.impulsi += (obiettivo.impulsi - s.impulsi) * k
    s.ambra += (obiettivo.ambra - s.ambra) * k
    s.respiro += (obiettivo.respiro - s.respiro) * k
    s.corona += (obiettivo.corona - s.corona) * k
    // audio: attacco rapido, rilascio più lento (le pause della voce rilassano l'anello)
    const audio = ing.modo === 'speaking' ? Math.max(0, ing.livelloOut) : 0
    s.audio += (audio - s.audio) * (audio > s.audio ? 1 - Math.exp(-sec / 0.05) : 1 - Math.exp(-sec / 0.25))
    const ondeIn = ing.modo === 'listening' ? ing.livelloIn : 0
    s.ondeIn += (ondeIn - s.ondeIn) * (1 - Math.exp(-sec / 0.12))
    const settore = ing.settore >= 0 ? Vortice.angoloModulo(ing.settore) : ing.modo === 'error' ? Vortice.angoloModulo(0) : -10

    // completamento: onda luminosa
    if (ing.modo === 'success' && this.modoPrima !== 'success') this.completa()
    this.modoPrima = ing.modo
    if (this.onda >= 0) {
      this.onda = (this.tempo - this.ondaInizio) / 1.2
      if (this.onda > 1) this.onda = -1
    }

    // inquadratura stabile: inclinazione obliqua, lentissima variazione e parallasse elastica del cursore
    const p = this.parallasse
    const molla = 18
    const smorza = 7
    p.vx += ((this.mouse.x - p.x) * molla - p.vx * smorza) * sec
    p.vy += ((this.mouse.y - p.y) * molla - p.vy * smorza) * sec
    p.x += p.vx * sec
    p.y += p.vy * sec
    const deriva = this.ridotto ? 0 : Math.sin(this.tempo * 0.05) * 0.05
    // anello visto di sbieco (ruotato attorno all'asse verticale), poi inclinato: asse lungo dal basso a sinistra all'alto a destra
    this.rot = mul(
      rotZ(-0.32 + deriva * 0.5),
      mul(rotY(0.92 + p.x * 0.08 + deriva), rotX(0.12 + p.y * 0.06 + Math.sin(this.tempo * 0.07) * 0.02)),
    )

    this.adatta()
    const gl = this.gl
    gl.clearColor(0.02, 0.031, 0.051, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE) // luce additiva: gli incroci brillano, le fibre restano distinguibili

    const comuni = (pr: Prog | { p: WebGLProgram; u: (n: string) => WebGLUniformLocation | null }) => {
      gl.useProgram(pr.p)
      gl.uniform1f(pr.u('uTempo'), this.tempo)
      gl.uniform1f(pr.u('uRespiro'), s.respiro)
      gl.uniform1f(pr.u('uAudio'), s.audio)
      gl.uniform1f(pr.u('uOndeIn'), s.ondeIn)
      gl.uniformMatrix3fv(pr.u('uRot'), false, this.rot)
      gl.uniform1f(pr.u('uF'), this.f)
      gl.uniform1f(pr.u('uAspetto'), this.aspetto)
    }

    // fibre
    comuni(this.fibre)
    gl.uniform1f(this.fibre.u('uVel'), s.vel)
    gl.uniform1f(this.fibre.u('uLuce'), s.luce * (1 + s.audio * 0.6))
    gl.uniform1f(this.fibre.u('uAmbra'), Math.max(0.15, s.ambra))
    gl.uniform1f(this.fibre.u('uSettore'), settore)
    gl.uniform1f(this.fibre.u('uSelezione'), ing.selezione >= 0 ? ing.selezione * 2 : this.hover >= 0 ? this.hover * 2 : -1)
    gl.uniform1f(this.fibre.u('uOnda'), this.onda)
    gl.uniform1f(this.fibre.u('uErrore'), ing.modo === 'error' ? 1 : 0)
    gl.bindVertexArray(this.fibre.vao)
    gl.drawElements(gl.LINE_STRIP, (this.indici / this.nFibre) * this.nFibreAttive, gl.UNSIGNED_INT, 0)

    // impulsi
    comuni(this.impulsi)
    gl.uniform1f(this.impulsi.u('uVel'), s.vel)
    gl.uniform1f(this.impulsi.u('uDensita'), this.ridotto ? s.impulsi * 0.5 : s.impulsi)
    gl.uniform1f(this.impulsi.u('uSelezione'), ing.selezione >= 0 ? ing.selezione * 2 : -1)
    gl.bindVertexArray(this.impulsi.vao)
    gl.drawArrays(gl.LINES, 0, this.nImpulsi * 8)

    // corona: raggi e punte
    const bande = ing.modo === 'speaking' ? ing.bande : ing.bande.map(() => 0)
    comuni(this.corona)
    gl.uniform1f(this.corona.u('uCorona'), s.corona + s.audio * 0.6)
    gl.uniform1fv(this.corona.u('uBande[0]'), new Float32Array(Array.from({ length: 8 }, (_, i) => bande[i] ?? 0)))
    gl.uniform1f(this.corona.u('uLuce'), s.luce)
    gl.uniform1f(this.corona.u('uSettore'), settore)
    gl.bindVertexArray(this.corona.vao)
    gl.drawArrays(gl.LINES, 0, this.nRaggi * 2)
    // punte luminose (stesso buffer, solo i punti finali)
    const pc = { p: this.puntiCorona, u: (n: string) => gl.getUniformLocation(this.puntiCorona, n) }
    comuni(pc)
    gl.uniform1f(pc.u('uCorona'), s.corona + s.audio * 0.6)
    gl.uniform1fv(pc.u('uBande[0]'), new Float32Array(Array.from({ length: 8 }, (_, i) => bande[i] ?? 0)))
    gl.uniform1f(pc.u('uLuce'), s.luce)
    gl.uniform1f(pc.u('uSettore'), settore)
    gl.drawArrays(gl.POINTS, 0, this.nRaggi * 2)

    // nodi
    comuni(this.nodi)
    gl.uniform1f(this.nodi.u('uSelezione'), ing.selezione)
    gl.uniform1f(this.nodi.u('uSettore'), settore)
    gl.uniform1f(this.nodi.u('uHover'), this.hover)
    gl.bindVertexArray(this.nodi.vao)
    gl.drawArrays(gl.POINTS, 0, MODULI.length)
    gl.bindVertexArray(null)
  }

  distruggi() {
    cancelAnimationFrame(this.raf)
    this.tela.removeEventListener('pointermove', this.muovi)
    this.tela.removeEventListener('pointerleave', this.esci)
    // si liberano programmi e buffer, ma il contesto resta vivo: lo stesso riquadro può ospitare un nuovo vortice
    const gl = this.gl
    for (const pr of [this.fibre, this.impulsi, this.corona, this.nodi]) {
      gl.deleteVertexArray(pr.vao)
      gl.deleteProgram(pr.p)
    }
    gl.deleteProgram(this.puntiCorona)
    for (const b of this.buffer) gl.deleteBuffer(b)
  }
}
