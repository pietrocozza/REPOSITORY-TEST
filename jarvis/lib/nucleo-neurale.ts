/*
 * J.A.R.V.I.S. Neural Core
 * Motore WebGL procedurale senza dipendenze esterne (basato sull'interfaccia "Neural Interface").
 *
 * Rispetto alla versione originale:
 *  - ogni neurone si sposta per conto suo, e connessioni, impulsi e dendriti lo seguono
 *  - i neuroni principali hanno dendriti ramificati che ondeggiano
 *  - corpi dei neuroni con un nucleo netto e meno alone sfocato: immagine più definita
 */

export type Modo = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

type Palette = { a: [number, number, number]; b: [number, number, number]; css: string; speed: number }

export const PALETTES: Record<Modo, Palette> = {
  idle: { a: [0.21, 0.72, 0.86], b: [0.57, 0.91, 1.0], css: '#77e6ed', speed: 0.17 },
  listening: { a: [0.08, 0.84, 0.57], b: [0.4, 1.0, 0.89], css: '#77f1cc', speed: 0.29 },
  thinking: { a: [0.88, 0.38, 0.09], b: [1.0, 0.83, 0.4], css: '#efbf76', speed: 0.52 },
  speaking: { a: [0.33, 0.26, 0.93], b: [0.51, 0.84, 1.0], css: '#b5b4ff', speed: 0.38 },
  error: { a: [0.89, 0.16, 0.18], b: [1.0, 0.56, 0.37], css: '#ff947f', speed: 0.1 },
}

// Tipi di primitive disegnate dallo stesso shader
const LINEE = 0
const NEURONI = 1
const IMPULSI = 2
const POLVERE = 3
const ALONI = 4
const DENDRITI = 5

const VERTEX = /* glsl */ `
  precision highp float;
  attribute vec3 aPosition;
  attribute vec3 aTarget;
  attribute vec4 aData;

  uniform float uTime;
  uniform float uEnergy;
  uniform float uActivity;
  uniform float uAspect;
  uniform float uPixelRatio;
  uniform float uFit;
  uniform float uZoom;
  uniform float uKind;
  uniform float uFlow;
  uniform vec2 uRotation;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vFocus;

  const float PI = 3.14159265;

  // Ogni neurone ha un suo movimento lento e irregolare, calcolato dalla sua posizione:
  // così il neurone, le sue connessioni e i suoi dendriti si muovono insieme.
  vec3 drift(vec3 p) {
    float s = fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    float s2 = fract(s * 7.13);
    float s3 = fract(s * 13.7);
    vec3 d = vec3(
      sin(uTime * (0.23 + s * 0.35) + s * 31.0) + 0.4 * sin(uTime * (0.71 + s2 * 0.3) + s3 * 9.0),
      sin(uTime * (0.19 + s2 * 0.35) + s2 * 17.0) + 0.4 * cos(uTime * (0.63 + s3 * 0.3) + s * 5.0),
      cos(uTime * (0.21 + s3 * 0.35) + s3 * 5.0) + 0.4 * sin(uTime * (0.67 + s * 0.3) + s2 * 3.0)
    );
    return p + d * (0.034 + uEnergy * 0.05);
  }

  // Stessa curva usata per costruire le connessioni: gli impulsi ci corrono sopra
  vec3 curvePoint(vec3 a, vec3 b, float t) {
    vec3 x = cross(a, b) + vec3(0.001);
    float k = sin(t * PI) * distance(a, b) * 0.12 / length(x);
    return mix(a, b, t) + x * k;
  }

  vec3 deform(vec3 p) {
    float r = length(p);
    float breath = sin(uTime * 0.64 + r * 1.7) * 0.016;
    float wave = sin(r * 7.0 - uTime * 2.9) * uEnergy * 0.028;
    p *= 1.0 + breath + uEnergy * 0.16 + wave;
    vec3 organic = vec3(
      sin(p.y * 3.1 + uTime * 0.31),
      cos(p.z * 3.5 - uTime * 0.25),
      sin(p.x * 2.7 + uTime * 0.23)
    );
    return p + organic * (0.018 + uEnergy * 0.03);
  }

  vec3 rotate(vec3 p) {
    float cy = cos(uRotation.x);
    float sy = sin(uRotation.x);
    float cx = cos(uRotation.y);
    float sx = sin(uRotation.y);
    p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
    return vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);
  }

  void main() {
    vec3 p = aPosition;
    float phase = aData.y;
    float pulse = 1.0;

    if (uKind < 0.5) {
      // connessione: punto lungo la curva tra due neuroni in movimento
      p = curvePoint(drift(aPosition), drift(aTarget), aData.x);
    } else if (uKind < 1.5) {
      p = drift(aPosition);
    } else if (uKind < 2.5) {
      float t = fract(uFlow * (0.6 + phase * 0.6) + phase * 9.0);
      p = curvePoint(drift(aPosition), drift(aTarget), t);
      pulse = sin(t * PI);
    } else if (uKind > 4.5) {
      // dendrite: segue il suo neurone e ondeggia leggermente
      float len = distance(aTarget, aPosition);
      p = aTarget + (drift(aPosition) - aPosition)
        + vec3(sin(uTime * 1.1 + phase * 20.0), cos(uTime * 0.9 + phase * 13.0), sin(uTime * 1.3 + phase * 7.0))
        * len * 0.12;
    }

    if (uKind < 2.5 || uKind > 3.5) {
      p = deform(p);
    }

    if (uKind > 2.5 && uKind < 3.5) {
      p += vec3(sin(uTime * 0.07 + phase), cos(uTime * 0.04 + phase), 0.0) * 0.07;
    }

    p = rotate(p);

    float depth = 4.5 / uZoom - p.z;
    float f = 2.55 * uFit / depth;
    gl_Position = vec4(p.x * f / uAspect, p.y * f + 0.10, 0.0, 1.0);

    vFocus = 1.0 - smoothstep(-1.1, 1.4, p.z);
    float nearLight = clamp((p.z + 1.5) / 2.8, 0.0, 1.0);
    float colorMix = clamp(aData.z * 0.8 + nearLight * 0.35, 0.0, 1.0);
    vColor = mix(uColorA, uColorB, colorMix);

    float fire = pow(max(0.0, sin(uTime * (1.3 + phase * 0.5) - length(aPosition) * 6.0 + phase * 16.0)), 12.0);

    vAlpha = aData.w * (0.24 + nearLight * 0.76) * (0.85 + fire * 0.85 + uEnergy * 0.3);

    if (uKind < 0.5) {
      vAlpha *= 0.85 + uActivity * 0.25;
      gl_PointSize = 1.0;
    } else if (uKind < 1.5) {
      gl_PointSize = aData.x * uPixelRatio * (3.5 / depth) * (1.0 + fire * 0.38 + uEnergy * 0.35 + vFocus * 0.3);
      vAlpha *= 1.0 + fire;
    } else if (uKind < 2.5) {
      gl_PointSize = aData.x * uPixelRatio * (3.5 / depth) * (1.0 + uEnergy * 0.4);
      vAlpha = pulse * aData.w * (0.45 + nearLight * 0.6) * (0.8 + uEnergy * 0.7);
      vColor = mix(vColor, vec3(0.9, 0.97, 1.0), 0.35);
    } else if (uKind > 4.5) {
      vAlpha *= 0.9 + uActivity * 0.2;
      gl_PointSize = 1.0;
    } else {
      gl_PointSize = aData.x * uPixelRatio;
      vAlpha *= 0.33;
    }

    gl_PointSize = clamp(gl_PointSize, 1.0, 48.0);

    if (uKind > 3.5 && uKind < 4.5) {
      gl_PointSize = min(190.0, aData.x * uPixelRatio * (3.5 / depth) * uFit);
      vAlpha = aData.w * (0.7 + uEnergy);
    }
  }
`

const FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uKind;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vFocus;

  void main() {
    if (uKind < 0.5 || uKind > 4.5) {
      gl_FragColor = vec4(vColor, vAlpha);
      return;
    }

    vec2 p = gl_PointCoord - 0.5;
    float r = length(p) * 2.0;
    if (r > 1.0) discard;

    if (uKind > 3.5) {
      gl_FragColor = vec4(vColor, exp(-r * r * 4.5) * vAlpha);
      return;
    }

    // corpo del neurone: un disco netto con bordo morbido, più un alone leggero
    float body = 1.0 - smoothstep(0.24, 0.34, r);
    float rim = smoothstep(0.2, 0.3, r) * (1.0 - smoothstep(0.3, 0.42, r)) * 0.35;
    float glow = exp(-r * r * 7.0) * 0.2 * (1.0 - vFocus * 0.3);
    float intensity = body * 0.95 + rim + glow;
    vec3 color = mix(vColor, vec3(0.9, 0.98, 1.0), body * 0.6);
    gl_FragColor = vec4(color, intensity * vAlpha);
  }
`

const QUAD = /* glsl */ `
  attribute vec2 aVertex;
  varying vec2 vUV;
  void main() {
    vUV = aVertex * 0.5 + 0.5;
    gl_Position = vec4(aVertex, 0.0, 1.0);
  }
`

const BLUR = /* glsl */ `
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uTexture;
  uniform vec2 uStep;
  void main() {
    vec3 c = texture2D(uTexture, vUV).rgb * 0.227027;
    c += texture2D(uTexture, vUV + uStep * 1.384615).rgb * 0.316216;
    c += texture2D(uTexture, vUV - uStep * 1.384615).rgb * 0.316216;
    c += texture2D(uTexture, vUV + uStep * 3.230769).rgb * 0.070270;
    c += texture2D(uTexture, vUV - uStep * 3.230769).rgb * 0.070270;
    gl_FragColor = vec4(c, 1.0);
  }
`

const COMPOSITE = /* glsl */ `
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uScene;
  uniform sampler2D uBloom;
  uniform float uEnergy;
  uniform float uTime;
  uniform vec3 uColorA;

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec3 scene = texture2D(uScene, vUV).rgb;
    vec3 bloom = texture2D(uBloom, vUV).rgb;
    vec2 center = vUV - vec2(0.5, 0.55);
    float fog = exp(-dot(center, center) * 19.0);
    vec3 base = vec3(0.012, 0.028, 0.043) + uColorA * fog * 0.022;
    // meno bagliore rispetto all'originale: i dettagli restano nitidi
    vec3 color = base + scene + bloom * (0.45 + uEnergy * 0.35);
    color += vec3((rand(gl_FragCoord.xy + fract(uTime) * 10.0) - 0.5) / 440.0);
    gl_FragColor = vec4(color, 1.0);
  }
`

type Vec3 = [number, number, number]
type Nodo = [number, number, number, number, number] // x, y, z, gruppo, luminosità

function random(seed: number) {
  let t = seed
  return () => {
    t += 0x6d2b79f5
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function createNetwork() {
  const r = random(87421)
  const nodes: Nodo[] = []
  const groups: Vec3[] = []
  const normal = () => Math.sqrt(-2 * Math.log(Math.max(0.00001, r()))) * Math.cos(2 * Math.PI * r())

  // 14 gruppi di neuroni distribuiti su una sfera
  for (let g = 0; g < 14; g++) {
    const phi = Math.acos(1 - (2 * (g + 0.5)) / 14)
    const theta = g * 2.399963
    const center: Vec3 = [Math.sin(phi) * Math.cos(theta) * 0.89, Math.cos(phi) * 0.88, Math.sin(phi) * Math.sin(theta) * 0.75]
    groups.push(center)
    for (let n = 0; n < 66; n++) {
      nodes.push([center[0] + normal() * 0.14, center[1] + normal() * 0.13, center[2] + normal() * 0.14, g / 14, 0.8 + r() * 0.4])
    }
  }

  // neuroni sparsi
  for (let i = 0; i < 290; i++) {
    const a = r() * Math.PI * 2
    const y = r() * 2 - 1
    const rr = Math.pow(r(), 0.6) * 1.05
    const q = Math.sqrt(1 - y * y)
    nodes.push([Math.cos(a) * q * rr, y * rr, Math.sin(a) * q * rr, r(), 0.6 + r() * 0.5])
  }

  // filamenti che escono dai gruppi
  for (let g = 0; g < 14; g++) {
    const c = groups[g]
    const side = [normal() * 0.13, normal() * 0.13, normal() * 0.13]
    for (let n = 0; n < 18; n++) {
      const t = n / 18
      const amp = 1 + t * 0.52
      nodes.push([
        c[0] * amp + Math.sin(t * 7) * side[0],
        c[1] * amp + Math.sin(t * 5) * side[1],
        c[2] * amp + Math.cos(t * 6) * side[2],
        g / 14,
        0.5 + r() * 0.8,
      ])
    }
  }

  // connessioni: i vicini più prossimi, qualche collegamento lungo
  const edges: [number, number][] = []
  const seen = new Set<string>()
  const add = (a: number, b: number) => {
    const k = Math.min(a, b) + ':' + Math.max(a, b)
    if (a !== b && !seen.has(k)) {
      seen.add(k)
      edges.push([a, b])
    }
  }
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i]
    const candidates: [number, number][] = []
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue
      const b = nodes[j]
      candidates.push([j, (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2])
    }
    candidates.sort((x, y) => x[1] - y[1])
    for (let k = 0; k < 4; k++) add(i, candidates[k][0])
    if (i % 3 === 0) add(i, candidates[8 + Math.floor(r() * 18)][0])
    if (i % 16 === 0) add(i, Math.floor(r() * nodes.length))
  }

  // ogni vertice: posizione (3), destinazione (3), dati (4: dimensione o t, fase, gruppo, opacità)
  const points: number[] = []
  const lines: number[] = []
  const pulses: number[] = []
  const dust: number[] = []
  const halos: number[] = []
  const dendrites: number[] = []
  const push = (arr: number[], a: ArrayLike<number>, b: ArrayLike<number>, size: number, phase: number, group: number, alpha: number) => {
    arr.push(a[0], a[1], a[2], b[0], b[1], b[2], size, phase, group, alpha)
  }

  nodes.forEach((a, i) => {
    const soma = i % 37 === 0
    push(points, a, a, soma ? 17 : 5.5 + r() * 4.5, r(), a[3], a[4])

    // dendriti: rami che partono dai neuroni principali (e più corti da alcuni altri)
    const rami = soma ? 7 : i % 9 === 0 ? 3 : 0
    const lunghezza = soma ? 0.16 : 0.07
    for (let k = 0; k < rami; k++) {
      const ramo = (da: Vec3, dir: Vec3, len: number, luce: number, livello: number) => {
        let p: Vec3 = [...da]
        const d: Vec3 = [...dir]
        const passi = 4
        const fase = r()
        for (let s = 0; s < passi; s++) {
          d[0] += (r() - 0.5) * 0.9
          d[1] += (r() - 0.5) * 0.9
          d[2] += (r() - 0.5) * 0.9
          const l = Math.hypot(d[0], d[1], d[2]) || 1
          const q: Vec3 = [p[0] + (d[0] / l) * (len / passi), p[1] + (d[1] / l) * (len / passi), p[2] + (d[2] / l) * (len / passi)]
          const a1 = luce * (1 - s / passi)
          const a2 = luce * (1 - (s + 1) / passi)
          push(dendrites, a, p, 0, fase, a[3], a1)
          push(dendrites, a, q, 0, fase, a[3], a2)
          if (livello < 1 && s === 1 && r() < 0.8) ramo(q, d, len * 0.6, a2, livello + 1)
          p = q
        }
      }
      const dir: Vec3 = [r() - 0.5, r() - 0.5, r() - 0.5]
      ramo([a[0], a[1], a[2]], dir, lunghezza * (0.7 + r() * 0.6), soma ? 0.55 : 0.32, 0)
    }
  })

  groups.forEach((a, i) => push(halos, a, a, 145, 0, i / 14, 0.035))

  edges.forEach(([i, j], k) => {
    const a = nodes[i]
    const b = nodes[j]
    const length = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
    const segments = length > 0.35 ? 10 : 4
    const phase = r()
    const alpha = (length > 0.5 ? 0.15 : 0.36) * (0.6 + r() * 0.6)
    // ogni segmento conosce i due neuroni e la sua posizione t lungo la curva:
    // la forma viene calcolata nello shader, così segue i neuroni che si muovono
    for (let s = 0; s < segments; s++) {
      push(lines, a, b, s / segments, phase, a[3], alpha)
      push(lines, a, b, (s + 1) / segments, phase, a[3], alpha)
    }
    if (k % 3 === 0) push(pulses, a, b, 5 + r() * 5, phase, a[3], 0.7 + r() * 0.4)
  })

  for (let i = 0; i < 900; i++) {
    const p = [(r() - 0.5) * 9, (r() - 0.5) * 6, (r() - 0.5) * 5]
    push(dust, p, p, 1 + r() * 2, r(), r(), r() * 0.5 + 0.1)
  }

  return { nodes, edges, points, lines, pulses, dust, halos, dendrites }
}

type Target = { texture: WebGLTexture; framebuffer: WebGLFramebuffer; w: number; h: number }
type NomeBuffer = 'points' | 'lines' | 'pulses' | 'dust' | 'halos' | 'dendrites'

export type Fotogramma = { time: number; energy: number; mode: Modo; flow: number; paused: boolean }

export class NucleoNeurale {
  canvas: HTMLCanvasElement
  mode: Modo = 'idle'
  energy = 0
  fit = 1
  paused = false
  reduced: boolean
  network: ReturnType<typeof createNetwork>

  private onFrame?: (f: Fotogramma) => void
  private input = 0
  private external = false
  private colorA: number[] = PALETTES.idle.a.slice()
  private colorB: number[] = PALETTES.idle.b.slice()
  private speed = 0.17
  private time = 0
  private flow = 0
  private yaw = 0.15
  private pitch = -0.12
  private dragYaw = 0
  private dragPitch = 0
  private pointer: [number, number] = [0, 0]
  private zoom = 1
  private zoomTarget = 1
  private destroyed = false
  private inView = true
  private contextLost = false
  private dirty = true
  private width = 1
  private height = 1
  private dpr = 1
  private last = 0
  private raf = 0
  private gl: WebGLRenderingContext
  private motionQuery: MediaQueryList
  private abort = new AbortController()
  private resizeObserver: ResizeObserver
  private visibilityObserver: IntersectionObserver
  private renderProgram!: WebGLProgram
  private blurProgram!: WebGLProgram
  private compositeProgram!: WebGLProgram
  private locations: Record<string, WebGLUniformLocation | null> = {}
  private attributes: number[] = []
  private buffers = {} as Record<NomeBuffer, { buffer: WebGLBuffer; count: number }>
  private quad!: WebGLBuffer
  private targets: Target[] = []

  constructor(canvas: HTMLCanvasElement, options: { onFrame?: (f: Fotogramma) => void; onError?: (msg: string) => void } = {}) {
    this.canvas = canvas
    this.onFrame = options.onFrame
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.reduced = this.motionQuery.matches

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: false })
    if (!gl) throw new Error('WebGL non disponibile')
    this.gl = gl

    this.network = createNetwork()
    this.initGL()
    this.resize()
    this.bind(options.onError)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas.parentElement ?? canvas)
    this.visibilityObserver = new IntersectionObserver((entries) => {
      this.inView = entries[0].isIntersecting
    })
    this.visibilityObserver.observe(canvas)

    this.last = performance.now()
    this.frame = this.frame.bind(this)
    this.raf = requestAnimationFrame(this.frame)
  }

  private program(vertexSource: string, fragmentSource: string) {
    const g = this.gl
    const p = g.createProgram()!
    for (const [type, source] of [
      [g.VERTEX_SHADER, vertexSource],
      [g.FRAGMENT_SHADER, fragmentSource],
    ] as const) {
      const shader = g.createShader(type)!
      g.shaderSource(shader, source)
      g.compileShader(shader)
      if (!g.getShaderParameter(shader, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(shader) ?? 'Shader non valido')
      g.attachShader(p, shader)
      g.deleteShader(shader)
    }
    g.linkProgram(p)
    if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p) ?? 'Programma non valido')
    return p
  }

  private initGL() {
    const g = this.gl
    this.renderProgram = this.program(VERTEX, FRAGMENT)
    this.blurProgram = this.program(QUAD, BLUR)
    this.compositeProgram = this.program(QUAD, COMPOSITE)

    for (const name of ['uTime', 'uEnergy', 'uActivity', 'uAspect', 'uPixelRatio', 'uFit', 'uZoom', 'uKind', 'uFlow', 'uRotation', 'uColorA', 'uColorB']) {
      this.locations[name] = g.getUniformLocation(this.renderProgram, name)
    }
    this.attributes = ['aPosition', 'aTarget', 'aData'].map((name) => g.getAttribLocation(this.renderProgram, name))

    for (const name of ['points', 'lines', 'pulses', 'dust', 'halos', 'dendrites'] as NomeBuffer[]) {
      const buffer = g.createBuffer()!
      g.bindBuffer(g.ARRAY_BUFFER, buffer)
      g.bufferData(g.ARRAY_BUFFER, new Float32Array(this.network[name]), g.STATIC_DRAW)
      this.buffers[name] = { buffer, count: this.network[name].length / 10 }
    }

    this.quad = g.createBuffer()!
    g.bindBuffer(g.ARRAY_BUFFER, this.quad)
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), g.STATIC_DRAW)

    g.disable(g.DEPTH_TEST)
    g.clearColor(0, 0, 0, 1)
  }

  private createTarget(w: number, h: number): Target {
    const g = this.gl
    const texture = g.createTexture()!
    g.bindTexture(g.TEXTURE_2D, texture)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE)
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, w, h, 0, g.RGBA, g.UNSIGNED_BYTE, null)
    const framebuffer = g.createFramebuffer()!
    g.bindFramebuffer(g.FRAMEBUFFER, framebuffer)
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, texture, 0)
    if (g.checkFramebufferStatus(g.FRAMEBUFFER) !== g.FRAMEBUFFER_COMPLETE) throw new Error('Framebuffer non disponibile')
    return { texture, framebuffer, w, h }
  }

  resize() {
    const box = this.canvas.getBoundingClientRect()
    this.width = Math.max(1, box.width)
    this.height = Math.max(1, box.height)
    // risoluzione piena fino a 2x: linee più nitide sugli schermi ad alta densità
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.round(this.width * this.dpr)
    const h = Math.round(this.height * this.dpr)
    if (this.canvas.width === w && this.canvas.height === h && this.targets.length) return

    this.canvas.width = w
    this.canvas.height = h
    for (const t of this.targets) {
      this.gl.deleteTexture(t.texture)
      this.gl.deleteFramebuffer(t.framebuffer)
    }
    this.targets = [this.createTarget(w, h), this.createTarget(Math.ceil(w / 2), Math.ceil(h / 2)), this.createTarget(Math.ceil(w / 2), Math.ceil(h / 2))]
    this.fit = this.width < 760 ? Math.min(0.87, (this.width / this.height) * 0.86) : Math.min(1, (this.width - 280) / this.height)
    this.dirty = true
  }

  private bind(onError?: (msg: string) => void) {
    const opts = { signal: this.abort.signal }
    const canvas = this.canvas
    let drag: { x: number; y: number } | null = null

    canvas.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY }
      canvas.setPointerCapture(e.pointerId)
    }, opts)
    canvas.addEventListener('pointermove', (e) => {
      const box = canvas.getBoundingClientRect()
      this.pointer = [(e.clientX - box.left) / box.width - 0.5, (e.clientY - box.top) / box.height - 0.5]
      if (drag) {
        this.dragYaw += (e.clientX - drag.x) * 0.006
        this.dragPitch = Math.max(-1, Math.min(1, this.dragPitch + (e.clientY - drag.y) * 0.005))
        drag = { x: e.clientX, y: e.clientY }
        this.dirty = true
      }
    }, opts)
    canvas.addEventListener('pointerup', () => (drag = null), opts)
    canvas.addEventListener('pointercancel', () => (drag = null), opts)
    canvas.addEventListener('pointerleave', () => (this.pointer = [0, 0]), opts)
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      this.zoomTarget = Math.max(0.72, Math.min(1.4, this.zoomTarget - e.deltaY * 0.0006))
      this.dirty = true
    }, { ...opts, passive: false })
    this.motionQuery.addEventListener('change', (e) => {
      this.reduced = e.matches
      this.dirty = true
    }, opts)
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      this.contextLost = true
      onError?.('Grafica sospesa. Ricarica la pagina per ripristinarla.')
    }, opts)
  }

  setState(mode: Modo) {
    this.mode = mode
    this.dirty = true
  }

  /** livello della voce (0..1): sostituisce l'animazione automatica */
  setAudioLevel(level: number) {
    this.input = Math.max(0, Math.min(1, Number(level) || 0))
    this.external = true
    this.dirty = true
  }

  clearAudio() {
    this.external = false
    this.input = 0
  }

  setPaused(value: boolean) {
    this.paused = value
    this.dirty = true
  }

  private frame(now: number) {
    if (this.destroyed) return
    this.raf = requestAnimationFrame(this.frame)
    const dt = Math.min((now - this.last) / 1000, 0.05)
    this.last = now

    if (document.hidden || !this.inView || this.contextLost) return
    if ((this.paused || this.reduced) && !this.dirty) return

    if (!this.paused && !this.reduced) {
      this.time += dt
      this.flow += dt * this.speed
    }

    const palette = PALETTES[this.mode]
    const alpha = 1 - Math.exp(-dt * 3.6)
    for (let i = 0; i < 3; i++) {
      this.colorA[i] += (palette.a[i] - this.colorA[i]) * alpha
      this.colorB[i] += (palette.b[i] - this.colorB[i]) * alpha
    }
    this.speed += (palette.speed - this.speed) * alpha

    const t = this.time
    let target: number
    if (this.external) target = this.input
    else if (this.mode === 'speaking')
      target = (Math.pow(Math.abs(Math.sin(t * 7.8) * Math.cos(t * 3.7)), 0.65) * 0.76 + 0.1) * (0.45 + 0.55 * Math.pow(Math.sin(t * 1.3), 2))
    else if (this.mode === 'listening') target = 0.06 + 0.08 * Math.pow(Math.sin(t * 3.4), 2)
    else if (this.mode === 'thinking') target = 0.2 + 0.15 * Math.sin(t * 3.1) ** 2
    else target = 0.025
    if (this.paused || this.reduced) target = 0

    this.energy += (target - this.energy) * (1 - Math.exp(-dt * (target > this.energy ? 14 : 5)))
    this.yaw += (this.time * 0.028 + this.dragYaw + this.pointer[0] * 0.1 - this.yaw) * (1 - Math.exp(-dt * 3))
    this.pitch += (-0.12 + this.dragPitch + this.pointer[1] * 0.1 - this.pitch) * (1 - Math.exp(-dt * 3))
    this.zoom += (this.zoomTarget - this.zoom) * alpha

    this.render()
    this.onFrame?.({ time: t, energy: this.energy, mode: this.mode, flow: this.flow, paused: this.paused || this.reduced })

    this.dirty =
      (this.paused || this.reduced) &&
      Math.abs(this.colorA[0] - palette.a[0]) + Math.abs(this.colorA[1] - palette.a[1]) + Math.abs(this.colorA[2] - palette.a[2]) > 0.005
  }

  private render() {
    const g = this.gl
    const L = this.locations
    const [scene, ping, pong] = this.targets

    g.bindFramebuffer(g.FRAMEBUFFER, scene.framebuffer)
    g.viewport(0, 0, scene.w, scene.h)
    g.clear(g.COLOR_BUFFER_BIT)
    g.enable(g.BLEND)
    g.blendFunc(g.SRC_ALPHA, g.ONE)
    g.useProgram(this.renderProgram)

    const values: Record<string, number> = {
      uTime: this.time,
      uEnergy: this.energy,
      uActivity: this.mode === 'thinking' ? 1 : 0,
      uAspect: this.width / this.height,
      uPixelRatio: this.dpr,
      uFit: this.fit,
      uZoom: this.zoom,
      uFlow: this.flow,
    }
    for (const [name, value] of Object.entries(values)) g.uniform1f(L[name], value)
    g.uniform2f(L.uRotation, this.yaw, this.pitch)
    g.uniform3fv(L.uColorA, this.colorA)
    g.uniform3fv(L.uColorB, this.colorB)

    for (const [name, kind] of [
      ['dust', POLVERE],
      ['halos', ALONI],
      ['lines', LINEE],
      ['dendrites', DENDRITI],
      ['points', NEURONI],
      ['pulses', IMPULSI],
    ] as [NomeBuffer, number][]) {
      const buffer = this.buffers[name]
      g.bindBuffer(g.ARRAY_BUFFER, buffer.buffer)
      this.attributes.forEach((attribute, i) => {
        g.enableVertexAttribArray(attribute)
        g.vertexAttribPointer(attribute, i === 2 ? 4 : 3, g.FLOAT, false, 40, i * 12)
      })
      g.uniform1f(L.uKind, kind)
      g.drawArrays(kind === LINEE || kind === DENDRITI ? g.LINES : g.POINTS, 0, buffer.count)
    }
    for (const attribute of this.attributes) g.disableVertexAttribArray(attribute)
    g.disable(g.BLEND)

    this.blur(scene, ping, 1.3 / scene.w, 0)
    this.blur(ping, pong, 0, 1.6 / ping.h)
    this.blur(pong, ping, 1.8 / pong.w, 0)
    this.blur(ping, pong, 0, 1.8 / ping.h)

    g.bindFramebuffer(g.FRAMEBUFFER, null)
    g.viewport(0, 0, this.canvas.width, this.canvas.height)
    const program = this.compositeProgram
    this.useQuad(program)
    g.activeTexture(g.TEXTURE0)
    g.bindTexture(g.TEXTURE_2D, scene.texture)
    g.uniform1i(g.getUniformLocation(program, 'uScene'), 0)
    g.activeTexture(g.TEXTURE1)
    g.bindTexture(g.TEXTURE_2D, pong.texture)
    g.uniform1i(g.getUniformLocation(program, 'uBloom'), 1)
    g.uniform1f(g.getUniformLocation(program, 'uEnergy'), this.energy)
    g.uniform1f(g.getUniformLocation(program, 'uTime'), this.time)
    g.uniform3fv(g.getUniformLocation(program, 'uColorA'), this.colorA)
    g.drawArrays(g.TRIANGLES, 0, 6)
    g.disableVertexAttribArray(g.getAttribLocation(program, 'aVertex'))
    g.activeTexture(g.TEXTURE0)
  }

  private useQuad(program: WebGLProgram) {
    const g = this.gl
    g.useProgram(program)
    g.bindBuffer(g.ARRAY_BUFFER, this.quad)
    const attribute = g.getAttribLocation(program, 'aVertex')
    g.enableVertexAttribArray(attribute)
    g.vertexAttribPointer(attribute, 2, g.FLOAT, false, 0, 0)
  }

  private blur(from: Target, to: Target, x: number, y: number) {
    const g = this.gl
    const program = this.blurProgram
    g.bindFramebuffer(g.FRAMEBUFFER, to.framebuffer)
    g.viewport(0, 0, to.w, to.h)
    this.useQuad(program)
    g.activeTexture(g.TEXTURE0)
    g.bindTexture(g.TEXTURE_2D, from.texture)
    g.uniform1i(g.getUniformLocation(program, 'uTexture'), 0)
    g.uniform2f(g.getUniformLocation(program, 'uStep'), x, y)
    g.drawArrays(g.TRIANGLES, 0, 6)
    g.disableVertexAttribArray(g.getAttribLocation(program, 'aVertex'))
  }

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.abort.abort()
    this.resizeObserver.disconnect()
    this.visibilityObserver.disconnect()
    const g = this.gl
    for (const b of Object.values(this.buffers)) g.deleteBuffer(b.buffer)
    g.deleteBuffer(this.quad)
    for (const t of this.targets) {
      g.deleteFramebuffer(t.framebuffer)
      g.deleteTexture(t.texture)
    }
    for (const p of [this.renderProgram, this.blurProgram, this.compositeProgram]) g.deleteProgram(p)
  }
}
