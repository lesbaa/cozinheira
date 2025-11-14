import { Canvas } from '@react-three/fiber'
import { MapControls } from '@react-three/drei'
import Scene, { type ScenePointerEvent } from './components/Scene'
import { useCallback, useRef, useState } from 'react';
import { LngLat } from '@maptiler/sdk';
import type { FeatureHoverEventData } from './components/Features/Features';
import { TerrainCtxProvider } from './hooks/useTerrainState/useTerrainState';
import { GlobalStateCtxProvider } from './hooks/useGlobalState';
import Menu from './components/Menu';
import { FeatureMeshesCtxProvider } from './hooks/useFeatureMeshes';

export type PopoverState = {
  lngLat: LngLat;
  altitude: number;
  transformX: number;
  transformY: number;
  visible: boolean;
}

export default function App() {
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


  const featureInfoRef = useRef<HTMLDivElement | null>(null);

  const showFeatureInfo = useCallback((feature: FeatureHoverEventData | null, focusFeature?: boolean) => {
    resetPopover();

    if (focusFeature && featureInfoRef.current && feature) {
      const elementHeight = featureInfoRef.current.offsetHeight;
      setFeatureInfo({
        ...feature,
        mouseY: window.innerHeight - elementHeight - 40,
        mouseX: 0,
      });
      return;
    }

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
      <Menu />
      <Canvas
        camera={{
          position: [0, 200, 0],
        }}
        onContextMenu={handleContextMenu}
      >
        <TerrainCtxProvider>
          <FeatureMeshesCtxProvider>
            <Scene
              showFeatureInfo={showFeatureInfo}
              onMouseMove={handleMouseMove}
              onMouseLeave={resetPopover}
            />
          </FeatureMeshesCtxProvider>
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
      <div
        style={{
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
        }}
        ref={featureInfoRef}
      >
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
