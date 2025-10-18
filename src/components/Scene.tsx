import { useCallback, useMemo } from 'react';
import {

  PointsMaterial,
  Vector2,
} from 'three';
import { convertMetersToLngLat } from '../project';
import { type ThreeEvent } from '@react-three/fiber';
import type { LngLat } from '@maptiler/sdk';
import Features, { type FeatureHoverEventData } from './Features';
import { Compass } from './Compass';
import { QueryPositionCtxProvider } from '../hooks/useQueryElevationAtPosition';
import UserPosition from './UserPosition';
import { type ColorRamp } from '../utils/ColorRamp';
import { useTerrainState } from '../hooks/useTerrainState/useTerrainState';
import useGlobalState from '../hooks/useGlobalState';

export type ScenePointerEvent = ThreeEvent<PointerEvent> & { lngLat: LngLat, altitude: number };

export default function Scene({
  showPoints,
  onMouseMove,
  onMouseLeave,
  showFeatureInfo,
}: {
  colorRamp?: ColorRamp
  showContour: boolean;
  showSlope: boolean;
  showPoints: boolean;
  onMouseMove: (event: ScenePointerEvent) => void;
  onMouseLeave: () => void;
  showFeatureInfo: (feature: FeatureHoverEventData | null, focusFeature: boolean) => void;
}) {

  const terrain = useTerrainState();

  const { setMouseScreenPos } = useGlobalState();

  const handleMouseMove = useCallback((event: ScenePointerEvent) => {
    setMouseScreenPos(new Vector2(event.clientX, event.clientY));
    const alt = terrain.pixelReadBuffer[0];
    const lngLat = convertMetersToLngLat([terrain.origin[0], terrain.origin[1]], { x: event.point.x, y: event.point.y });
    onMouseMove?.({
      ...event,
      lngLat,
      altitude: alt,
    });
  }, [setMouseScreenPos, terrain.pixelReadBuffer, terrain.origin, onMouseMove]);


  const handleMouseLeave = useCallback(() => {
    onMouseLeave?.();
  }, [onMouseLeave]);

  const handleFeatureHover = useCallback((feature: FeatureHoverEventData | null) => {
    showFeatureInfo(feature);
  }, [showFeatureInfo]);

  const handleFeatureSelect = useCallback((feature: FeatureHoverEventData | null) => {
    if (!feature) {
      showFeatureInfo(null);
      return;
    }

    showFeatureInfo({
      ...feature,
      mouseX: 0,
      mouseY: 0,
    }, true);
  }, [showFeatureInfo]);

  const lightPosition = useMemo(() => {
    return [terrain.origin[0], terrain.origin[1] + 100, terrain.origin[2]] as [number, number, number];
  }, [terrain.origin]);

  return (
      <QueryPositionCtxProvider debug={true}>
        <directionalLight position={lightPosition} intensity={6} />
        <ambientLight intensity={2} />
        <points
          visible={showPoints}
          name="terrain-points"
          material={new PointsMaterial({ color: 'blue' })}
          renderOrder={99} geometry={terrain.terrainGeometry}
        />
        <mesh
          name="terrain-mesh"
          onPointerMove={handleMouseMove}
          onPointerDown={() => handleFeatureSelect(null)}
          onPointerLeave={handleMouseLeave}
          onClick={e => console.log("terrain mesh click", e)}
          renderOrder={1}
          geometry={terrain.terrainGeometry}
          material={terrain.terrainMaterial}
        />

        <Features
          origin={terrain.origin}
          onFeatureHover={handleFeatureHover}
          onFeatureSelect={handleFeatureSelect}
        />
        <Compass />
        <UserPosition />
      </QueryPositionCtxProvider>
  )
}