import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Scene from './Scene'
import { useState } from 'react';

export default function App() {

  const [showContour, setShowContour] = useState(true);
  const [showPoints, setShowPoints] = useState(true);

  return (
    <>
    <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1000, display: 'none' }}>
      <div>
      <input type="checkbox" checked={showContour} onChange={(e) => setShowContour(v => !v)} />
      <label htmlFor="showContour">Show Contour</label>
      </div>
      <div>
      <input type="checkbox" checked={showPoints} onChange={(e) => setShowPoints(v => !v)} />
      <label htmlFor="showContour">Show Control Points</label>
      </div>
    </div>
    <Canvas
      camera={{
        position: [0, 200, 0],
      }}
    >
      <Scene showContour={showContour} showPoints={showPoints} />
      <OrbitControls />
    </Canvas>
    </>

  )
}
