import { createContext, useContext } from "react";
import { BufferGeometry, ShaderMaterial } from "three";
import type { Point2D } from "../project";

const TerrainContext = createContext<{
  terrainGeometry: BufferGeometry,
  terrainMaterial: ShaderMaterial,
  terrainPickingMaterial: ShaderMaterial,
  origin: [number, number, number],
  lngLats: number[][],
  minAltitude: number,
  maxAltitude: number,
  bounds: {
    min: Point2D,
    max: Point2D,
  },
}>({
  terrainGeometry: new BufferGeometry(),
  terrainMaterial: new ShaderMaterial(),
  terrainPickingMaterial: new ShaderMaterial(),
  origin: [0, 0, 0],
  lngLats: [],
  minAltitude: 0,
  maxAltitude: 0,
  bounds: {
    min: { x: 0, y: 0 },
    max: { x: 0, y: 0 },
  },
});

export const TerrainCtxProvider = TerrainContext.Provider;

export const useTerrainState = () => {
  return useContext(TerrainContext);
}
