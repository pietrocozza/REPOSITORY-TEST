import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

// ─────────────────────────────────────────────────────────────────────────────
// Il "cervello" visibile di Jarvis: una rete di neuroni in 3D.
//  - ogni neurone ha un corpo luminoso (soma), un alone e dei dendriti ramificati
//  - i neuroni sono collegati da sinapsi curve, percorse da un leggero scintillio
//  - gli impulsi elettrici viaggiano lungo le sinapsi e fanno "scattare" i neuroni,
//    che a loro volta propagano il segnale: a cascata quando Jarvis pensa
// Non usa React: si monta su qualunque elemento HTML (app Next.js o demo).
// ─────────────────────────────────────────────────────────────────────────────

export type StatoRete = 'spento' | 'pronto' | 'ascolto' | 'elaborazione' | 'risposta'

export type ReteNeurale = {
  /** cambia comportamento e colori in base a cosa sta facendo Jarvis */
  setStato: (stato: StatoRete) => void
  /** volume della voce (microfono o sintesi), da 0 a 1 */
  setLivello: (livello: number) => void
  /** una scarica di impulsi dal centro (es. quando arriva una domanda) */
  stimola: (forza?: number) => void
  distruggi: () => void
}

// Azzurro dominante, con ciano, blu, turchese e qualche accento viola e magenta
const PALETTE: [string, number][] = [
  ['#38bdf8', 5], // azzurro
  ['#22d3ee', 4], // ciano
  ['#60a5fa', 3], // blu
  ['#2dd4bf', 2], // turchese
  ['#a78bfa', 2], // viola
  ['#f472b6', 1], // magenta
]

// Come si comporta la rete in ogni stato
const COMPORTAMENTO: Record<StatoRete, {
  spontanei: number // scariche spontanee al secondo, per neurone
  propaga: number // probabilità che un neurone che scatta mandi un impulso su ogni sinapsi
  innesca: number // probabilità che un impulso in arrivo faccia scattare il neurone
  velocita: number // velocità degli impulsi
  rotazione: number // velocità di rotazione automatica
  accento: string // colore che tinge gli impulsi
  luce: number // luminosità generale
}> = {
  spento: { spontanei: 0.006, propaga: 0.2, innesca: 0.15, velocita: 1.2, rotazione: 0.15, accento: '#60a5fa', luce: 0.45 },
  pronto: { spontanei: 0.025, propaga: 0.4, innesca: 0.3, velocita: 1.8, rotazione: 0.35, accento: '#38bdf8', luce: 0.85 },
  ascolto: { spontanei: 0.04, propaga: 0.5, innesca: 0.35, velocita: 2.4, rotazione: 0.25, accento: '#e0f7ff', luce: 1.0 },
  elaborazione: { spontanei: 0.09, propaga: 0.8, innesca: 0.55, velocita: 3.4, rotazione: 1.2, accento: '#a78bfa', luce: 1.15 },
  risposta: { spontanei: 0.035, propaga: 0.6, innesca: 0.4, velocita: 2.6, rotazione: 0.5, accento: '#22d3ee', luce: 1.05 },
}

const NUM_NEURONI = 170
const MAX_IMPULSI = 420
const SCIA = 4 // punti per impulso: testa + coda
const CAMPIONI = 32 // punti precalcolati lungo ogni sinapsi

type Neurone = {
  pos: THREE.Vector3
  colore: THREE.Color
  raggio: number
  energia: number // 0..1, si accende quando scatta e poi si spegne
  riposo: number // secondi di "periodo refrattario"
  sinapsi: number[] // indici delle sinapsi collegate
}

type Sinapsi = { a: number; b: number; punti: THREE.Vector3[]; lunghezza: number }

type Impulso = { sinapsi: number; verso: 1 | -1; t: number; velocita: number; colore: THREE.Color; attivo: boolean }

// Numeri casuali ripetibili: la rete ha sempre la stessa forma
function generatore(seme: number) {
  return () => {
    seme = (seme + 0x6d2b79f5) | 0
    let t = Math.imul(seme ^ (seme >>> 15), 1 | seme)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Materiale per tutti i punti luminosi (aloni, impulsi, pulviscolo): un disco sfumato
function materialeLuce(scala: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uScala: { value: scala }, uLuce: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aDimensione;
      attribute vec3 aColore;
      varying vec3 vColore;
      uniform float uScala;
      void main() {
        vColore = aColore;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aDimensione * uScala / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColore;
      uniform float uLuce;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = pow(max(0.0, 1.0 - d), 2.2);
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColore * a * uLuce, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

export function creaReteNeurale(contenitore: HTMLElement, opzioni: { seme?: number } = {}): ReteNeurale {
  const casuale = generatore(opzioni.seme ?? 7)
  const ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ───────── Scena, camera, renderer ─────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor('#02040b')
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  contenitore.appendChild(renderer.domElement)

  const scena = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0.6, 10.5)

  const controlli = new OrbitControls(camera, renderer.domElement)
  controlli.enableDamping = true
  controlli.enablePan = false
  controlli.minDistance = 5
  controlli.maxDistance = 16
  controlli.autoRotate = !ridotto
  controlli.rotateSpeed = 0.6
  // la rete sta un po' più in alto del centro, lasciando spazio ai sottotitoli
  controlli.target.set(0, -0.7, 0)

  const cervello = new THREE.Group()
  scena.add(cervello)

  // ───────── Neuroni: posizioni dentro un ellissoide, più fitti al centro ─────────
  const coloriPesati = PALETTE.flatMap(([c, peso]) => Array(peso).fill(c) as string[])
  const neuroni: Neurone[] = []
  let tentativi = 0
  while (neuroni.length < NUM_NEURONI && tentativi++ < 20000) {
    const dir = new THREE.Vector3(casuale() * 2 - 1, casuale() * 2 - 1, casuale() * 2 - 1)
    if (dir.lengthSq() > 1 || dir.lengthSq() < 0.0001) continue
    const r = Math.pow(casuale(), 0.42)
    const pos = dir.normalize().multiplyScalar(r).multiply(new THREE.Vector3(3.6, 2.5, 2.7))
    if (neuroni.some((n) => n.pos.distanceToSquared(pos) < 0.42 * 0.42)) continue
    neuroni.push({
      pos,
      colore: new THREE.Color(coloriPesati[Math.floor(casuale() * coloriPesati.length)]),
      raggio: 0.035 + casuale() * 0.045,
      energia: 0,
      riposo: 0,
      sinapsi: [],
    })
  }

  // ───────── Sinapsi: ogni neurone si collega ai vicini con un filo curvo ─────────
  const sinapsi: Sinapsi[] = []
  const giaCollegati = new Set<string>()
  const collega = (a: number, b: number) => {
    const chiave = a < b ? `${a}-${b}` : `${b}-${a}`
    if (a === b || giaCollegati.has(chiave)) return
    giaCollegati.add(chiave)
    const pa = neuroni[a].pos
    const pb = neuroni[b].pos
    const lung = pa.distanceTo(pb)
    // due punti intermedi spostati di lato: il filo si piega in modo organico
    const piega = () =>
      new THREE.Vector3(casuale() - 0.5, casuale() - 0.5, casuale() - 0.5).multiplyScalar(lung * 0.35)
    const curva = new THREE.CatmullRomCurve3([
      pa.clone(),
      pa.clone().lerp(pb, 0.33).add(piega()),
      pa.clone().lerp(pb, 0.66).add(piega()),
      pb.clone(),
    ])
    const id = sinapsi.length
    sinapsi.push({ a, b, punti: curva.getSpacedPoints(CAMPIONI), lunghezza: curva.getLength() })
    neuroni[a].sinapsi.push(id)
    neuroni[b].sinapsi.push(id)
  }
  neuroni.forEach((n, i) => {
    const vicini = neuroni
      .map((m, j) => ({ j, d: n.pos.distanceToSquared(m.pos) }))
      .filter((x) => x.j !== i)
      .sort((x, y) => x.d - y.d)
    const quanti = 2 + Math.floor(casuale() * 3)
    for (let k = 0; k < quanti; k++) collega(i, vicini[k].j)
    // ogni tanto un collegamento più lungo, verso un neurone più lontano
    if (casuale() < 0.18) collega(i, vicini[6 + Math.floor(casuale() * 10)].j)
  })

  // ───────── Geometria delle sinapsi: tubi sottili con uno scintillio che scorre ─────────
  const SEG = 24
  const RADIALI = 4
  const posizioni: number[] = []
  const colori: number[] = []
  const lungo: number[] = [] // posizione lungo la sinapsi (0..1)
  const semi: number[] = []
  const indici: number[] = []
  const tmp = new THREE.Color()
  for (const s of sinapsi) {
    const curva = new THREE.CatmullRomCurve3(s.punti)
    const tubo = new THREE.TubeGeometry(curva, SEG, 0.0075, RADIALI, false)
    const base = posizioni.length / 3
    const pos = tubo.attributes.position
    const seme = casuale()
    for (let v = 0; v < pos.count; v++) {
      const t = Math.floor(v / (RADIALI + 1)) / SEG
      posizioni.push(pos.getX(v), pos.getY(v), pos.getZ(v))
      tmp.copy(neuroni[s.a].colore).lerp(neuroni[s.b].colore, t)
      colori.push(tmp.r, tmp.g, tmp.b)
      lungo.push(t)
      semi.push(seme)
    }
    const idx = tubo.index!
    for (let k = 0; k < idx.count; k++) indici.push(base + idx.getX(k))
    tubo.dispose()
  }
  const geoSinapsi = new THREE.BufferGeometry()
  geoSinapsi.setAttribute('position', new THREE.Float32BufferAttribute(posizioni, 3))
  geoSinapsi.setAttribute('aColore', new THREE.Float32BufferAttribute(colori, 3))
  geoSinapsi.setAttribute('aLungo', new THREE.Float32BufferAttribute(lungo, 1))
  geoSinapsi.setAttribute('aSeme', new THREE.Float32BufferAttribute(semi, 1))
  geoSinapsi.setIndex(indici)
  const matSinapsi = new THREE.ShaderMaterial({
    uniforms: { uTempo: { value: 0 }, uLuce: { value: 1 }, uAttivita: { value: 0.3 } },
    vertexShader: /* glsl */ `
      attribute vec3 aColore;
      attribute float aLungo;
      attribute float aSeme;
      varying vec3 vColore;
      varying float vLuce;
      uniform float uTempo;
      uniform float uAttivita;
      void main() {
        vColore = aColore;
        float onda = fract(aLungo - uTempo * (0.15 + aSeme * 0.25) + aSeme * 13.0);
        vLuce = 0.22 + smoothstep(0.82, 1.0, onda) * (0.5 + uAttivita);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColore;
      varying float vLuce;
      uniform float uLuce;
      void main() { gl_FragColor = vec4(vColore * vLuce * uLuce, 1.0); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  cervello.add(new THREE.Mesh(geoSinapsi, matSinapsi))

  // ───────── Dendriti: rametti che partono da ogni neurone e si biforcano ─────────
  const ramiPos: number[] = []
  const ramiCol: number[] = []
  const ramo = (da: THREE.Vector3, dir: THREE.Vector3, lung: number, colore: THREE.Color, luce: number, livello: number) => {
    let p = da.clone()
    const d = dir.clone()
    const passi = 5
    for (let k = 0; k < passi; k++) {
      d.add(new THREE.Vector3(casuale() - 0.5, casuale() - 0.5, casuale() - 0.5).multiplyScalar(0.5)).normalize()
      const q = p.clone().addScaledVector(d, lung / passi)
      const l1 = luce * (1 - k / passi)
      const l2 = luce * (1 - (k + 1) / passi)
      ramiPos.push(p.x, p.y, p.z, q.x, q.y, q.z)
      ramiCol.push(colore.r * l1, colore.g * l1, colore.b * l1, colore.r * l2, colore.g * l2, colore.b * l2)
      // biforcazione a metà ramo
      if (livello < 2 && k === 2 && casuale() < 0.7) ramo(q, d, lung * 0.55, colore, l2, livello + 1)
      p = q
    }
  }
  for (const n of neuroni) {
    const quanti = 3 + Math.floor(casuale() * 4)
    for (let k = 0; k < quanti; k++) {
      const dir = new THREE.Vector3(casuale() - 0.5, casuale() - 0.5, casuale() - 0.5).normalize()
      ramo(n.pos, dir, 0.18 + casuale() * 0.3, n.colore, 0.55, 0)
    }
  }
  const geoRami = new THREE.BufferGeometry()
  geoRami.setAttribute('position', new THREE.Float32BufferAttribute(ramiPos, 3))
  geoRami.setAttribute('color', new THREE.Float32BufferAttribute(ramiCol, 3))
  const matRami = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  cervello.add(new THREE.LineSegments(geoRami, matRami))

  // ───────── Corpi dei neuroni (sfere) e aloni luminosi ─────────
  const geoSoma = new THREE.IcosahedronGeometry(1, 3)
  const matSoma = new THREE.MeshBasicMaterial({ toneMapped: false })
  const somi = new THREE.InstancedMesh(geoSoma, matSoma, neuroni.length)
  const matrice = new THREE.Matrix4()
  neuroni.forEach((n, i) => {
    matrice.makeScale(n.raggio, n.raggio, n.raggio).setPosition(n.pos)
    somi.setMatrixAt(i, matrice)
    somi.setColorAt(i, n.colore)
  })
  cervello.add(somi)

  const geoAloni = new THREE.BufferGeometry()
  const aloniPos = new Float32Array(neuroni.length * 3)
  neuroni.forEach((n, i) => n.pos.toArray(aloniPos, i * 3))
  geoAloni.setAttribute('position', new THREE.BufferAttribute(aloniPos, 3))
  const aloniCol = new THREE.BufferAttribute(new Float32Array(neuroni.length * 3), 3)
  const aloniDim = new THREE.BufferAttribute(new Float32Array(neuroni.length), 1)
  geoAloni.setAttribute('aColore', aloniCol)
  geoAloni.setAttribute('aDimensione', aloniDim)
  const matAloni = materialeLuce(1)
  cervello.add(new THREE.Points(geoAloni, matAloni))

  // ───────── Impulsi: punti luminosi con una piccola scia ─────────
  const impulsi: Impulso[] = Array.from({ length: MAX_IMPULSI }, () => ({
    sinapsi: 0, verso: 1, t: 0, velocita: 1, colore: new THREE.Color(), attivo: false,
  }))
  const geoImpulsi = new THREE.BufferGeometry()
  const impPos = new THREE.BufferAttribute(new Float32Array(MAX_IMPULSI * SCIA * 3), 3)
  const impCol = new THREE.BufferAttribute(new Float32Array(MAX_IMPULSI * SCIA * 3), 3)
  const impDim = new THREE.BufferAttribute(new Float32Array(MAX_IMPULSI * SCIA), 1)
  impPos.setUsage(THREE.DynamicDrawUsage)
  impCol.setUsage(THREE.DynamicDrawUsage)
  impDim.setUsage(THREE.DynamicDrawUsage)
  geoImpulsi.setAttribute('position', impPos)
  geoImpulsi.setAttribute('aColore', impCol)
  geoImpulsi.setAttribute('aDimensione', impDim)
  const matImpulsi = materialeLuce(1)
  const puntiImpulsi = new THREE.Points(geoImpulsi, matImpulsi)
  puntiImpulsi.frustumCulled = false
  cervello.add(puntiImpulsi)

  // ───────── Pulviscolo sullo sfondo ─────────
  const NUM_POLVERE = 700
  const polverePos = new Float32Array(NUM_POLVERE * 3)
  const polvereCol = new Float32Array(NUM_POLVERE * 3)
  const polvereDim = new Float32Array(NUM_POLVERE)
  for (let i = 0; i < NUM_POLVERE; i++) {
    const v = new THREE.Vector3(casuale() - 0.5, casuale() - 0.5, casuale() - 0.5).normalize()
    v.multiplyScalar(5 + casuale() * 14).toArray(polverePos, i * 3)
    const c = new THREE.Color(coloriPesati[Math.floor(casuale() * coloriPesati.length)]).multiplyScalar(0.25 + casuale() * 0.35)
    c.toArray(polvereCol, i * 3)
    polvereDim[i] = 0.04 + casuale() * 0.08
  }
  const geoPolvere = new THREE.BufferGeometry()
  geoPolvere.setAttribute('position', new THREE.BufferAttribute(polverePos, 3))
  geoPolvere.setAttribute('aColore', new THREE.BufferAttribute(polvereCol, 3))
  geoPolvere.setAttribute('aDimensione', new THREE.BufferAttribute(polvereDim, 1))
  const matPolvere = materialeLuce(1)
  const polvere = new THREE.Points(geoPolvere, matPolvere)
  scena.add(polvere)

  // ───────── Post-produzione: bagliore (bloom) ─────────
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scena, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.8, 0.45, 0.12)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  // ───────── Logica di scarica e propagazione ─────────
  let stato: StatoRete = 'spento'
  let livello = 0
  let livelloLiscio = 0
  let luceAttuale = COMPORTAMENTO.spento.luce
  const accento = new THREE.Color(COMPORTAMENTO.spento.accento)
  const accentoObiettivo = accento.clone()

  const lanciaImpulso = (s: number, daNeurone: number) => {
    const libero = impulsi.find((p) => !p.attivo)
    if (!libero) return
    const sin = sinapsi[s]
    const c = COMPORTAMENTO[stato]
    libero.attivo = true
    libero.sinapsi = s
    libero.verso = sin.a === daNeurone ? 1 : -1
    libero.t = 0
    libero.velocita = (c.velocita * (0.75 + casuale() * 0.5)) / sin.lunghezza
    libero.colore.copy(neuroni[daNeurone].colore).lerp(accento, 0.45).multiplyScalar(1.6)
  }

  const scatta = (i: number, forza = 1) => {
    const n = neuroni[i]
    if (n.riposo > 0) return
    n.energia = Math.min(1.4, n.energia + forza)
    n.riposo = 0.45
    const c = COMPORTAMENTO[stato]
    for (const s of n.sinapsi) if (casuale() < c.propaga * forza) lanciaImpulso(s, i)
  }

  const arriva = (p: Impulso) => {
    const sin = sinapsi[p.sinapsi]
    const dest = p.verso === 1 ? sin.b : sin.a
    const n = neuroni[dest]
    n.energia = Math.min(1.4, n.energia + 0.25)
    if (casuale() < COMPORTAMENTO[stato].innesca + livelloLiscio * 0.3) scatta(dest, 0.9)
  }

  // ───────── Ciclo di animazione ─────────
  const orologio = new THREE.Clock()
  const p0 = new THREE.Vector3()
  const coloreSoma = new THREE.Color()
  const bianco = new THREE.Color('#ffffff')
  let raf = 0

  const puntoSu = (s: Sinapsi, t: number, fuori: THREE.Vector3) => {
    const x = Math.min(Math.max(t, 0), 1) * CAMPIONI
    const k = Math.min(Math.floor(x), CAMPIONI - 1)
    return fuori.copy(s.punti[k]).lerp(s.punti[k + 1], x - k)
  }

  const fotogramma = () => {
    const dt = Math.min(orologio.getDelta(), 0.05)
    const tempo = orologio.elapsedTime
    const c = COMPORTAMENTO[stato]

    livelloLiscio += (livello - livelloLiscio) * Math.min(1, dt * 10)
    luceAttuale += (c.luce + livelloLiscio * 0.35 - luceAttuale) * Math.min(1, dt * 3)
    accento.lerp(accentoObiettivo, Math.min(1, dt * 3))

    // scariche spontanee: di più quando parla o ascolta a voce alta
    const frequenza = neuroni.length * (c.spontanei + livelloLiscio * 0.06) * (ridotto ? 0.3 : 1)
    let daLanciare = frequenza * dt
    while (daLanciare > 0) {
      if (casuale() < daLanciare) scatta(Math.floor(casuale() * neuroni.length), 0.8 + livelloLiscio * 0.4)
      daLanciare -= 1
    }

    // impulsi in viaggio
    let v = 0
    for (const p of impulsi) {
      if (p.attivo) {
        p.t += p.velocita * dt
        if (p.t >= 1) {
          p.attivo = false
          arriva(p)
        }
      }
      const s = sinapsi[p.sinapsi]
      for (let k = 0; k < SCIA; k++, v++) {
        if (!p.attivo) {
          impDim.setX(v, 0)
          continue
        }
        const tt = p.t - k * 0.035
        const t = p.verso === 1 ? tt : 1 - tt
        puntoSu(s, t, p0)
        impPos.setXYZ(v, p0.x, p0.y, p0.z)
        const sfuma = tt < 0 ? 0 : 1 - k / SCIA
        impCol.setXYZ(v, p.colore.r * sfuma, p.colore.g * sfuma, p.colore.b * sfuma)
        impDim.setX(v, (k === 0 ? 0.32 : 0.22) * sfuma)
      }
    }
    impPos.needsUpdate = true
    impCol.needsUpdate = true
    impDim.needsUpdate = true

    // neuroni: si accendono quando scattano, poi tornano tranquilli
    neuroni.forEach((n, i) => {
      n.energia = Math.max(0, n.energia - dt * 1.6)
      n.riposo = Math.max(0, n.riposo - dt)
      const e = n.energia
      coloreSoma.copy(n.colore).lerp(bianco, Math.min(0.8, e * 0.6)).multiplyScalar(0.9 + e * 2.2)
      somi.setColorAt(i, coloreSoma)
      const r = n.raggio * (1 + e * 0.9)
      matrice.makeScale(r, r, r).setPosition(n.pos)
      somi.setMatrixAt(i, matrice)
      coloreSoma.copy(n.colore).multiplyScalar(0.16 + e * 0.9)
      aloniCol.setXYZ(i, coloreSoma.r, coloreSoma.g, coloreSoma.b)
      aloniDim.setX(i, 0.3 + n.raggio * 3 + e * 0.8)
    })
    somi.instanceColor!.needsUpdate = true
    somi.instanceMatrix.needsUpdate = true
    aloniCol.needsUpdate = true
    aloniDim.needsUpdate = true

    // respiro e luce generale
    const respiro = 1 + Math.sin(tempo * 0.8) * 0.012 + livelloLiscio * 0.04
    cervello.scale.setScalar(respiro)
    matSinapsi.uniforms.uTempo.value = tempo
    matSinapsi.uniforms.uAttivita.value = 0.3 + livelloLiscio + (stato === 'elaborazione' ? 0.6 : 0)
    matSinapsi.uniforms.uLuce.value = luceAttuale
    matAloni.uniforms.uLuce.value = luceAttuale
    matRami.opacity = Math.min(1, 0.55 * luceAttuale + 0.2)
    bloom.strength = 0.55 + luceAttuale * 0.3 + livelloLiscio * 0.3
    polvere.rotation.y = tempo * 0.01
    polvere.rotation.x = Math.sin(tempo * 0.05) * 0.1

    controlli.autoRotateSpeed += (c.rotazione - controlli.autoRotateSpeed) * Math.min(1, dt * 2)
    controlli.update(dt)
    composer.render(dt)
    raf = requestAnimationFrame(fotogramma)
  }

  // ───────── Dimensioni: segue quelle del contenitore ─────────
  const ridimensiona = () => {
    const w = Math.max(1, contenitore.clientWidth)
    const h = Math.max(1, contenitore.clientHeight)
    renderer.setSize(w, h, false)
    composer.setSize(w, h)
    bloom.setSize(w, h)
    camera.aspect = w / h
    // su schermi stretti la camera si allontana, così la rete resta tutta visibile
    camera.position.setLength(w / h < 0.8 ? 15 : w / h < 1.2 ? 12.5 : 10.5)
    camera.updateProjectionMatrix()
    const scala = h * renderer.getPixelRatio() * 0.9
    matAloni.uniforms.uScala.value = scala
    matImpulsi.uniforms.uScala.value = scala
    matPolvere.uniforms.uScala.value = scala
  }
  const osservatore = new ResizeObserver(ridimensiona)
  osservatore.observe(contenitore)
  ridimensiona()
  raf = requestAnimationFrame(fotogramma)

  return {
    setStato(nuovo) {
      stato = nuovo
      accentoObiettivo.set(COMPORTAMENTO[nuovo].accento)
      if (nuovo === 'elaborazione') this.stimola(0.6)
    },
    setLivello(l) {
      livello = Math.max(0, Math.min(1, l))
    },
    stimola(forza = 1) {
      // fa scattare i neuroni più vicini al centro
      const centrali = neuroni
        .map((n, i) => ({ i, d: n.pos.lengthSq() }))
        .sort((a, b) => a.d - b.d)
        .slice(0, Math.round(4 + forza * 8))
      for (const { i } of centrali) {
        neuroni[i].riposo = 0
        scatta(i, forza)
      }
    },
    distruggi() {
      cancelAnimationFrame(raf)
      osservatore.disconnect()
      controlli.dispose()
      composer.dispose()
      scena.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose()
      })
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
