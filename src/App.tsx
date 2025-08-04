import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { MapControls, OrbitControls } from '@react-three/drei'
import Scene, { type ScenePointerEvent } from './Scene'
import { useCallback, useState } from 'react';
import { LngLat } from '@maptiler/sdk';

export type PopoverState = {
  lngLat: LngLat;
  altitude: number;
  transformX: number;
  transformY: number;
  visible: boolean;
}

export default function App() {

  const [showContour, setShowContour] = useState(false);
  const [showPoints, setShowPoints] = useState(false);
  const [showSlope, setShowSlope] = useState(false);

  const [popoverState, setPopoverState] = useState<PopoverState>({
    lngLat: new LngLat(0, 0),
    altitude: 0,
    transformX: -100,
    transformY: -100,
    visible: false,
  });
  
  const handleMouseMove = useCallback((event: ScenePointerEvent) => {
    setPopoverState({
      lngLat: event.lngLat,
      altitude: event.altitude,
      transformX: event.clientX,
      transformY: event.clientY,
      visible: true,
    })
  }, []);

  return (
    <>
    <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1000, color: 'white' }}>
      <div>
      <input type="checkbox" checked={showContour} onChange={(e) => setShowContour(v => !v)} />
      <label htmlFor="showContour">Show Contour</label>
      </div>
      <div>
      <input type="checkbox" checked={showPoints} onChange={(e) => setShowPoints(v => !v)} />
      <label htmlFor="showContour">Show Control Points</label>
      </div>
      <div>
      <input type="checkbox" checked={showSlope} onChange={(e) => setShowSlope(v => !v)} />
      <label htmlFor="showSlope">Show Slope</label>
      </div>
    </div>
    <Canvas
      camera={{
        position: [0, 200, 0],
      }}
    >
      <Scene showContour={showContour} showPoints={showPoints} showSlope={showSlope} onMouseMove={handleMouseMove} />
      <MapControls />
    </Canvas>
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 1000,
      color: 'black',
      background: 'white',
      padding: '10px',
      borderRadius: '5px',
      transform: `translate(${popoverState.transformX + 20}px, ${popoverState.transformY + 20}px)`
    }}>
      {popoverState.visible && (
        <div>
          <div>{popoverState.lngLat.lat.toFixed(7)}</div>
          <div>{popoverState.lngLat.lng.toFixed(7)}</div>
          <div>{popoverState.altitude.toFixed(2)}</div>
        </div>
      )}
    </div>
    </>

  )
}
