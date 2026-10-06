'use client'

import { ContactShadows, Environment, Lightformer } from '@react-three/drei'

/**
 * Luci da studio fotografico: luce calda dall'alto, un controluce ambrato,
 * riflessi morbidi (generati nel codice, nessun file HDR da scaricare) e un'ombra morbida sotto il cibo.
 */
export default function Studio({ ombra = true, ombraY = 0, ombraFrames = Infinity }: { ombra?: boolean; ombraY?: number; ombraFrames?: number }) {
  return (
    <>
      <ambientLight intensity={0.35} color="#ffdcb8" />
      <spotLight position={[1.5, 7, 3]} angle={0.55} penumbra={0.9} intensity={90} decay={2} color="#ffd29e" />
      <directionalLight position={[-4, 2.5, -4]} intensity={2.2} color="#ff9a3d" />
      <directionalLight position={[4, 1, 3]} intensity={0.6} color="#ffe6cc" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#ffd9a8" position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ff8a3a" position={[-6, 1.5, -2]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#fff1e0" position={[6, 1, 3]} rotation-y={-Math.PI / 2} scale={[4, 3, 1]} />
      </Environment>
      {ombra && <ContactShadows position={[0, ombraY - 0.005, 0]} opacity={0.75} scale={5.5} blur={2.6} far={3} resolution={512} color="#000000" frames={ombraFrames} />}
    </>
  )
}
