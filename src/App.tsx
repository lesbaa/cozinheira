import { Canvas } from '@react-three/fiber'
import { MapControls } from '@react-three/drei'
import Scene, { type ScenePointerEvent } from './components/Scene'
import { useCallback, useState } from 'react';
import { LngLat } from '@maptiler/sdk';
import type { FeatureHoverEventData } from './components/Features';
import { TerrainCtxProvider } from './hooks/useTerrainState/useTerrainState';
import ColorRamps from './utils/ColorRamp';
import { GlobalStateCtxProvider } from './hooks/useGlobalState';

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
      visible: false,
    })
  }, []);

  const resetPopover = useCallback(() => {
    setPopoverState({
      lngLat: new LngLat(0, 0),
      altitude: 0,
      transformX: -100,
      transformY: -100,
      visible: false,
    })
  }, []);

  const [featureInfo, setFeatureInfo] = useState<FeatureHoverEventData | null>(null);

  const showFeatureInfo = useCallback((feature: FeatureHoverEventData | null) => {
    resetPopover();
    setFeatureInfo(feature);
  }, [resetPopover]);

  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setPopoverState((s) => ({
      ...s,
      visible: true,
    }))
  }, []);

  return (
    <GlobalStateCtxProvider>
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1000, color: 'white' }}>
        <div>
        <input type="checkbox" checked={showContour} onChange={() => setShowContour(v => !v)} />
        <label htmlFor="showContour">Show Contour</label>
        </div>
        <div>
        <input type="checkbox" checked={showPoints} onChange={() => setShowPoints(v => !v)} />
        <label htmlFor="showContour">Show Control Points</label>
        </div>
        <div>
        <input type="checkbox" checked={showSlope} onChange={() => setShowSlope(v => !v)} />
        <label htmlFor="showSlope">Show Slope</label>
        </div>
      </div>
      <Canvas
        camera={{
          position: [0, 200, 0],
        }}
        onContextMenu={handleContextMenu}
      >
        <TerrainCtxProvider
          colorRamp={ColorRamps.Lumo}
          showContour={showContour}
          showSlope={showSlope}
        >
          <Scene
            showFeatureInfo={showFeatureInfo}
            showContour={showContour}
            showPoints={showPoints}
            showSlope={showSlope}
            onMouseMove={handleMouseMove}
            onMouseLeave={resetPopover}
          />
        </TerrainCtxProvider>
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
        transition: 'opacity 0.3s ease-in-out',
        transform: `translate(${popoverState.transformX + 20}px, ${popoverState.transformY + 20}px)`,
        pointerEvents: popoverState.visible ? 'none' : 'auto',
        opacity: popoverState.visible ? 1 : 0,
      }}>
        {popoverState.visible && !featureInfo && (
          <div>
            <div>Lat: {popoverState.lngLat.lat.toFixed(10)}</div>
            <div>Lng: {popoverState.lngLat.lng.toFixed(10)}</div>
            <div>Alt:{popoverState.altitude.toFixed(2)}</div>
          </div>
        )}
      </div>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1000,
        color: 'black',
        background: 'white',
        padding: '10px',
        borderRadius: '5px',
        transition: 'opacity 0.3s ease-in-out',
        opacity: featureInfo ? 1 : 0,
        pointerEvents: featureInfo ? 'none' : 'auto',
        transform: `translate(${(featureInfo?.mouseX ?? -200) + 20}px, ${(featureInfo?.mouseY ?? -200) + 20}px)`
      }}>
        <div>ID: {featureInfo?.id}</div>
        <div>Type: {featureInfo?.type}</div>
        <div>SubType: {featureInfo?.subType}</div>
        <div>Size: {featureInfo?.size.toFixed(3)}</div>
        <div>Lat: {featureInfo?.lngLat[0].toFixed(6)}</div>
        <div>Lng: {featureInfo?.lngLat[1].toFixed(6)}</div>
        <div>Alt: {featureInfo?.alt.toFixed(3)}</div>
      </div>
    </GlobalStateCtxProvider>
  )
}
