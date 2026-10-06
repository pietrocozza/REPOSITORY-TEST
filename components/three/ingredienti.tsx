'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import type {} from '@react-three/fiber' // tipi JSX di <mesh>, <group>…
import type { Ingrediente } from '@/lib/ricette'

// Gli ingredienti modellati in 3D direttamente nel codice (nessun file da scaricare).
// Ogni ingrediente parte da y = 0 e cresce verso l'alto; il pane è largo circa 2 unità.

// ───────── rumore "organico" per rendere le superfici irregolari ─────────
const fract = (x: number) => x - Math.floor(x)
const hash = (x: number, y: number, z: number) => fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453)
const liscio = (t: number) => t * t * (3 - 2 * t)
export function rumore(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  const fx = liscio(x - ix), fy = liscio(y - iy), fz = liscio(z - iz)
  const l = (a: number, b: number, t: number) => a + (b - a) * t
  const c = (dx: number, dy: number, dz: number) => hash(ix + dx, iy + dy, iz + dz)
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), fx), l(c(0, 1, 0), c(1, 1, 0), fx), fy),
    l(l(c(0, 0, 1), c(1, 0, 1), fx), l(c(0, 1, 1), c(1, 1, 1), fx), fy),
    fz,
  )
}

const colore = (hex: string) => new THREE.Color(hex)
const mescola = (a: THREE.Color, b: THREE.Color, t: number) => a.clone().lerp(b, Math.min(1, Math.max(0, t)))

function coloraVertici(geo: THREE.BufferGeometry, f: (p: THREE.Vector3, i: number) => THREE.Color) {
  const pos = geo.attributes.position
  const col = new Float32Array(pos.count * 3)
  const p = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i)
    const c = f(p, i)
    col.set([c.r, c.g, c.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
}

function deforma(geo: THREE.BufferGeometry, f: (p: THREE.Vector3) => void) {
  const pos = geo.attributes.position
  const p = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i)
    f(p)
    pos.setXYZ(i, p.x, p.y, p.z)
  }
  geo.computeVertexNormals()
}

// ───────── pane ─────────
function PaneSopra() {
  const { cupola, semi } = useMemo(() => {
    const R = 1.0, H = 0.66
    const profilo: THREE.Vector2[] = [new THREE.Vector2(0, 0), new THREE.Vector2(R * 0.9, 0), new THREE.Vector2(R * 0.99, 0.04)]
    for (let k = 1; k <= 30; k++) {
      const t = (k / 30) * (Math.PI / 2)
      profilo.push(new THREE.Vector2(Math.max(0.0001, R * Math.pow(Math.cos(t), 0.55)), 0.05 + (H - 0.05) * Math.sin(t)))
    }
    const cupola = new THREE.LatheGeometry(profilo, 96)
    deforma(cupola, (p) => {
      const n = rumore(p.x * 3, p.y * 3, p.z * 3) - 0.5
      const s = 1 + n * 0.03
      p.x *= s
      p.z *= s
      if (p.y > 0.06) p.y += n * 0.02
    })
    const scuro = colore('#7f3f0e'), dorato = colore('#c97a2c'), chiaro = colore('#efc68e')
    coloraVertici(cupola, (p) => {
      if (p.y < 0.03) return chiaro // la parte tagliata, chiara
      const t = p.y / H
      const n = rumore(p.x * 6, p.y * 6, p.z * 6) * 0.25
      return mescola(dorato, scuro, Math.pow(t, 1.3) + n - 0.1)
    })

    // semi di sesamo distribuiti sulla cupola
    const semi: THREE.Matrix4[] = []
    const up = new THREE.Vector3(0, 1, 0)
    for (let i = 0; i < 90; i++) {
      const a = hash(i, 1, 7) * Math.PI * 2
      const t = 0.25 + hash(i, 3, 9) * 1.2
      const r = R * Math.pow(Math.cos(Math.min(t, 1.5)), 0.55)
      const y = 0.05 + (H - 0.05) * Math.sin(Math.min(t, 1.5))
      const pos = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)
      const norm = new THREE.Vector3(Math.cos(a) * Math.sin(Math.PI / 2 - t * 0.9), Math.cos(Math.PI / 2 - t * 0.9), Math.sin(a) * Math.sin(Math.PI / 2 - t * 0.9)).normalize()
      const q = new THREE.Quaternion().setFromUnitVectors(up, norm)
      q.multiply(new THREE.Quaternion().setFromAxisAngle(up, hash(i, 5, 2) * Math.PI))
      semi.push(new THREE.Matrix4().compose(pos, q, new THREE.Vector3(1, 0.4, 0.6)))
    }
    return { cupola, semi }
  }, [])

  return (
    <group>
      <mesh geometry={cupola}>
        <meshPhysicalMaterial vertexColors roughness={0.42} clearcoat={0.45} clearcoatRoughness={0.4} sheen={0.4} sheenColor="#ffd9a6" />
      </mesh>
      <instancedMesh args={[undefined, undefined, semi.length]} ref={(m) => m && semi.forEach((mat, i) => m.setMatrixAt(i, mat))}>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshStandardMaterial color="#f4e6c8" roughness={0.5} />
      </instancedMesh>
    </group>
  )
}

function PaneSotto() {
  const geo = useMemo(() => {
    const p = [
      [0, 0], [0.88, 0], [0.95, 0.04], [0.99, 0.13], [1.0, 0.22], [0.98, 0.3], [0.94, 0.34], [0, 0.34],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    const g = new THREE.LatheGeometry(p, 96)
    deforma(g, (v) => {
      const n = rumore(v.x * 3, v.y * 4, v.z * 3) - 0.5
      v.x *= 1 + n * 0.025
      v.z *= 1 + n * 0.025
    })
    const lato = colore('#b8692a'), sotto = colore('#8a4a17'), taglio = colore('#f0c993')
    coloraVertici(g, (v) => (v.y > 0.32 ? taglio : mescola(sotto, lato, v.y / 0.3 + (rumore(v.x * 8, v.y * 8, v.z * 8) - 0.5) * 0.3)))
    return g
  }, [])
  return (
    <mesh geometry={geo}>
      <meshPhysicalMaterial vertexColors roughness={0.5} clearcoat={0.25} sheen={0.4} sheenColor="#ffd9a6" />
    </mesh>
  )
}

// ───────── carne ─────────
function Carne({ vegetale = false }: { vegetale?: boolean }) {
  const geo = useMemo(() => {
    const p = [
      [0, 0], [0.4, 0], [0.8, 0.005], [0.98, 0.03], [1.05, 0.12], [1.04, 0.2], [0.98, 0.28], [0.8, 0.3], [0.4, 0.3], [0, 0.3],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    const g = new THREE.LatheGeometry(p, 120)
    deforma(g, (v) => {
      const n = rumore(v.x * 7, v.y * 7, v.z * 7) - 0.5
      const n2 = rumore(v.x * 2, 3, v.z * 2) - 0.5
      const s = 1 + n * 0.05 + n2 * 0.06
      v.x *= s
      v.z *= s
      v.y += n * 0.04
    })
    const a = colore(vegetale ? '#4f5a1e' : '#2e150a'), b = colore(vegetale ? '#8b7a35' : '#7a3d1c'), c = colore(vegetale ? '#7fa83a' : '#a5582a')
    coloraVertici(g, (v) => {
      const n = rumore(v.x * 9, v.y * 9, v.z * 9)
      const base = mescola(a, b, n * 1.2)
      return vegetale && n > 0.78 ? c : n > 0.82 ? mescola(base, c, 0.6) : base
    })
    return g
  }, [vegetale])
  return (
    <mesh geometry={geo}>
      <meshPhysicalMaterial vertexColors roughness={0.78} clearcoat={0.2} clearcoatRoughness={0.6} />
    </mesh>
  )
}

// ───────── formaggio fuso che cola ─────────
function Formaggio() {
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(1.95, 0.04, 1.95, 48, 1, 48)
    g.rotateY(Math.PI / 4)
    g.translate(0, 0.04, 0)
    deforma(g, (v) => {
      const r = Math.hypot(v.x, v.z)
      const cola = Math.max(0, r - 0.92)
      v.y -= Math.pow(cola, 1.5) * 1.1 + (rumore(v.x * 4, 0, v.z * 4) - 0.5) * 0.02
      const s = r > 0.92 ? 1 - cola * 0.25 : 1
      v.x *= s
      v.z *= s
    })
    return g
  }, [])
  return (
    <mesh geometry={geo}>
      <meshPhysicalMaterial color="#ffad1f" roughness={0.3} clearcoat={0.7} clearcoatRoughness={0.25} sheen={0.3} sheenColor="#fff1c0" />
    </mesh>
  )
}

// ───────── verdure ─────────
function Lattuga() {
  const geo = useMemo(() => {
    const g = new THREE.RingGeometry(0.001, 1.14, 180, 14)
    g.rotateX(-Math.PI / 2)
    deforma(g, (v) => {
      const r = Math.hypot(v.x, v.z)
      const a = Math.atan2(v.z, v.x)
      const bordo = 1 + 0.06 * Math.sin(a * 9) + 0.04 * (rumore(Math.cos(a) * 3, Math.sin(a) * 3, 1) - 0.5)
      v.x *= bordo
      v.z *= bordo
      v.y = 0.035 + 0.05 * Math.sin(a * 15 + r * 5) * Math.pow(r / 1.14, 2) + (rumore(v.x * 3, 2, v.z * 3) - 0.5) * 0.04
    })
    const centro = colore('#d7e8a0'), bordo = colore('#4f9a2c')
    coloraVertici(g, (v) => mescola(centro, bordo, Math.hypot(v.x, v.z) / 1.1 + (rumore(v.x * 10, 0, v.z * 10) - 0.5) * 0.3))
    return g
  }, [])
  return (
    <mesh geometry={geo}>
      <meshPhysicalMaterial vertexColors side={THREE.DoubleSide} roughness={0.45} clearcoat={0.5} sheen={0.5} sheenColor="#e9ffc0" />
    </mesh>
  )
}

function Pomodoro() {
  return (
    <group>
      {[
        [-0.47, -0.06],
        [0.47, 0.05],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, i * 1.2, 0]}>
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.09, 48]} />
            <meshPhysicalMaterial color="#c9261b" roughness={0.25} clearcoat={1} clearcoatRoughness={0.1} />
          </mesh>
          <mesh position={[0, 0.091, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.4, 40]} />
            <meshPhysicalMaterial color="#ef5a3c" roughness={0.2} clearcoat={1} />
          </mesh>
          {[0, 1, 2, 3, 4].map((k) => (
            <mesh key={k} position={[Math.cos((k / 5) * Math.PI * 2) * 0.22, 0.093, Math.sin((k / 5) * Math.PI * 2) * 0.22]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.09, 20]} />
              <meshPhysicalMaterial color="#f7b26a" roughness={0.2} clearcoat={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function Cipolla() {
  const anelli = [
    [-0.45, 0.1, 0.4],
    [0.3, -0.3, 0.34],
    [0.35, 0.4, 0.38],
    [-0.2, -0.45, 0.3],
  ]
  return (
    <group>
      {anelli.map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.6]}>
          <torusGeometry args={[r, 0.035, 12, 48]} />
          <meshPhysicalMaterial color="#e9cdb4" roughness={0.3} clearcoat={0.9} transmission={0.25} thickness={0.2} sheen={0.5} sheenColor="#d79bd0" />
        </mesh>
      ))}
    </group>
  )
}

// ───────── bacon, uovo, nocciole, salsa ─────────
function Bacon() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1.95, 0.3, 80, 6)
    g.rotateX(-Math.PI / 2)
    deforma(g, (v) => {
      v.y = 0.035 + 0.03 * Math.sin(v.x * 7) + (rumore(v.x * 4, 1, v.z * 4) - 0.5) * 0.02
    })
    const grasso = colore('#f1c8a6'), carne = colore('#9c2c18')
    coloraVertici(g, (v) => {
      const s = Math.abs(Math.sin((v.z / 0.3) * Math.PI * 2.2 + rumore(v.x * 3, 0, 0) * 2))
      return mescola(carne, grasso, s > 0.75 ? 0.9 : 0.05)
    })
    return g
  }, [])
  return (
    <group>
      {[
        [-0.17, 0.2],
        [0.18, -0.25],
      ].map(([z, ry], i) => (
        <mesh key={i} geometry={geo} position={[0, 0, z]} rotation={[0, ry, 0]}>
          <meshPhysicalMaterial vertexColors side={THREE.DoubleSide} roughness={0.4} clearcoat={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function Uovo() {
  const albume = useMemo(() => {
    const g = new THREE.RingGeometry(0.001, 1.05, 120, 8)
    g.rotateX(-Math.PI / 2)
    deforma(g, (v) => {
      const r = Math.hypot(v.x, v.z)
      const a = Math.atan2(v.z, v.x)
      const b = 1 + 0.08 * (rumore(Math.cos(a) * 2, Math.sin(a) * 2, 4) - 0.5)
      v.x *= b
      v.z *= b
      v.y = 0.05 * (1 - Math.pow(r / 1.05, 3))
    })
    return g
  }, [])
  return (
    <group>
      <mesh geometry={albume}>
        <meshPhysicalMaterial color="#fbf6ee" side={THREE.DoubleSide} roughness={0.25} clearcoat={0.8} />
      </mesh>
      <mesh position={[0.12, 0.06, 0.05]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[0.34, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#ffae00" roughness={0.15} clearcoat={1} />
      </mesh>
    </group>
  )
}

function Nocciole() {
  const matrici = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => {
        const a = hash(i, 2, 3) * Math.PI * 2
        const r = Math.sqrt(hash(i, 4, 1)) * 0.95
        const s = 0.6 + hash(i, 8, 8) * 0.8
        return new THREE.Matrix4().compose(
          new THREE.Vector3(Math.cos(a) * r, 0.04, Math.sin(a) * r),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(hash(i, 1, 1) * 3, hash(i, 2, 2) * 3, 0)),
          new THREE.Vector3(s, s * 0.8, s),
        )
      }),
    [],
  )
  return (
    <instancedMesh args={[undefined, undefined, matrici.length]} ref={(m) => m && matrici.forEach((mat, i) => m.setMatrixAt(i, mat))}>
      <dodecahedronGeometry args={[0.06, 0]} />
      <meshStandardMaterial color="#8a5527" roughness={0.6} />
    </instancedMesh>
  )
}

function Salsa() {
  const geo = useMemo(() => {
    const g = new THREE.RingGeometry(0.001, 1.0, 140, 6)
    g.rotateX(-Math.PI / 2)
    deforma(g, (v) => {
      const r = Math.hypot(v.x, v.z)
      const a = Math.atan2(v.z, v.x)
      const goccia = Math.max(0, Math.sin(a * 7 + 1)) ** 6
      const s = 1 + goccia * 0.06
      v.x *= s
      v.z *= s
      v.y = 0.025 - Math.max(0, r - 0.85) * goccia * 0.6
    })
    return g
  }, [])
  return (
    <mesh geometry={geo}>
      <meshPhysicalMaterial color="#e86a26" side={THREE.DoubleSide} roughness={0.15} clearcoat={1} clearcoatRoughness={0.05} />
    </mesh>
  )
}

export function Strato({ tipo }: { tipo: Ingrediente }) {
  switch (tipo) {
    case 'paneSopra':
      return <PaneSopra />
    case 'paneSotto':
      return <PaneSotto />
    case 'carne':
      return <Carne />
    case 'vegetale':
      return <Carne vegetale />
    case 'formaggio':
      return <Formaggio />
    case 'lattuga':
      return <Lattuga />
    case 'pomodoro':
      return <Pomodoro />
    case 'cipolla':
      return <Cipolla />
    case 'bacon':
      return <Bacon />
    case 'uovo':
      return <Uovo />
    case 'nocciole':
      return <Nocciole />
    case 'salsa':
      return <Salsa />
  }
}

// ───────── contorni ─────────
export function Patatine() {
  const { matrici, colori } = useMemo(() => {
    const matrici: THREE.Matrix4[] = []
    const colori: number[] = []
    for (let i = 0; i < 34; i++) {
      const a = hash(i, 1, 2) * Math.PI * 2
      const r = Math.sqrt(hash(i, 3, 4)) * 0.45
      const h = 0.9 + hash(i, 5, 6) * 0.5
      matrici.push(
        new THREE.Matrix4().compose(
          new THREE.Vector3(Math.cos(a) * r, 0.5 + h / 2 - 0.2, Math.sin(a) * r),
          new THREE.Quaternion().setFromEuler(new THREE.Euler((hash(i, 7, 1) - 0.5) * 0.5, hash(i, 2, 9) * 3, (hash(i, 8, 3) - 0.5) * 0.5)),
          new THREE.Vector3(1, h, 1),
        ),
      )
      const c = mescola(colore('#f6c45a'), colore('#d98d24'), hash(i, 9, 9))
      colori.push(c.r, c.g, c.b)
    }
    return { matrici, colori }
  }, [])
  return (
    <group>
      <instancedMesh
        args={[undefined, undefined, matrici.length]}
        ref={(m) => {
          if (!m) return
          matrici.forEach((mat, i) => m.setMatrixAt(i, mat))
          m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(colori), 3)
        }}
      >
        <boxGeometry args={[0.1, 1, 0.1]} />
        <meshPhysicalMaterial roughness={0.45} clearcoat={0.4} />
      </instancedMesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.72, 0.52, 1, 48, 1, true]} />
        <meshPhysicalMaterial color="#b3241a" roughness={0.5} clearcoat={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export function Anelli() {
  const geo = useMemo(() => {
    const g = new THREE.TorusGeometry(0.48, 0.17, 28, 72)
    deforma(g, (v) => {
      const n = rumore(v.x * 14, v.y * 14, v.z * 14) - 0.5
      v.multiplyScalar(1 + n * 0.035)
    })
    const a = colore('#e7ad55'), b = colore('#a8621f')
    coloraVertici(g, (v) => mescola(a, b, rumore(v.x * 9, v.y * 9, v.z * 9) * 1.3 - 0.2))
    return g
  }, [])
  return (
    <group>
      {[
        [0, 0.17, 0, -Math.PI / 2, 0],
        [0.15, 0.5, 0.05, -Math.PI / 2 + 0.25, 0.3],
        [-0.1, 0.82, -0.05, -Math.PI / 2 - 0.2, -0.4],
      ].map(([x, y, z, rx, rz], i) => (
        <mesh key={i} geometry={geo} position={[x, y, z]} rotation={[rx, 0, rz]}>
          <meshPhysicalMaterial vertexColors roughness={0.75} clearcoat={0.2} />
        </mesh>
      ))}
    </group>
  )
}
