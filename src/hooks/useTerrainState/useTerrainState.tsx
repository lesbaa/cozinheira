import { createContext, useContext, useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry, Color, DoubleSide, FloatType, GLSL3, Group, Mesh, Points, RGBAFormat, ShaderMaterial, Vector3 } from "three";
import cozinheira from '../../data/cozinheira-multi-point.json' with { type: 'json' };
import { projectLngLatToMeters, type Point2D } from "../../project";
import delaunate from "../../delaunate";
import DataMaterial from "../../materials/DataMaterial";
import type { ColorRamp } from "../../utils/ColorRamp";
import ColorRamps from "../../utils/ColorRamp";
import { useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import vertexShader from "./shaders/height.vert.glsl?raw";
import fragmentShaderPicker from "./shaders/picker.frag.glsl?raw";
import useGlobalState from "../useGlobalState";
import MapProviderMaterial from "../../materials/MapProviderMaterial/MapProviderMaterial";
import { bbox } from "@turf/turf";
// import { LngLatBounds } from "@maptiler/sdk";
import { LngLat, LngLatBounds } from "maplibre-gl";
// import MapProviderMaterial from "../../materials/MapProviderMaterial/MapProviderMaterial";
// import { LngLatBounds } from "@maptiler/sdk";
// import bbox from "@turf/bbox";
// import { LngLat } from "maplibre-gl";

export type TerrainContextValue = {
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
  pixelReadBuffer: Float32Array,
}

const TerrainContext = createContext<TerrainContextValue>({
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
  pixelReadBuffer: new Float32Array(4),
});

export function TerrainCtxProvider({
  children,
  colorRamp = ColorRamps.Lumo,
  showContour = false,
  showSlope = false,
}: {
  children: React.ReactNode;
  colorRamp?: ColorRamp;
  showContour?: boolean;
  showSlope?: boolean;
}) {
  const terrainState = useTerrainStateInternal({ colorRamp, showContour, showSlope });
  // console.count('+++++++++++======== TerrainCtxProvider 61');
  const value = useMemo(() => terrainState, [terrainState]);
  return (
    <TerrainContext.Provider value={value}>
      {children}
    </TerrainContext.Provider>
  )
}

function useTerrainStateInternal({
  colorRamp = ColorRamps.Lumo,
  showContour = false,
  showSlope = false,
}: {
  colorRamp?: ColorRamp;
  showContour?: boolean;
  showSlope?: boolean;
} = {}): TerrainContextValue {
  console.count('+++++++++++======== called useTerrainStateInternal');

  useEffect(() => {
    console.log('+++++++++++======== MOUNTED TerrainCtxProvider');
    return () => console.log('+++++++++++======== UNMOUNTED TerrainCtxProvider');
  }, []);

  const terrain = useMemo(() => {
    console.count('+++++++++++======== memoized terrain');
    const {
      positions: vertices,
      lngLats,
      normals,
      indices,
      maxAltitude,
      minAltitude,
      origin,
      bounds,
    } = delaunate(cozinheira as GeoJSON.FeatureCollection<GeoJSON.Geometry>, 'topography', true);

    const terrainGeometry = new BufferGeometry();
    terrainGeometry.setIndex(indices);
    terrainGeometry.setAttribute('position', new BufferAttribute(vertices, 3));
    terrainGeometry.setAttribute('normal', new BufferAttribute(normals, 3));
    terrainGeometry.computeVertexNormals();

    const originCoords = cozinheira.features.find((f) => f.properties?.pointType === 'origin')?.geometry.coordinates as [number, number, number] ?? [0,0,0];
    const originLngLat: [number, number] = [originCoords[0], originCoords[1]];

    const boundaryFeature = cozinheira.features.find((feature) => feature.properties?.name === 'boundary');
    const boundaryRing = boundaryFeature?.geometry.coordinates[0] as [number, number][] || [];

    const lngLatBounds = bbox(boundaryFeature as GeoJSON.Feature<GeoJSON.Geometry>);
    const perimiterVertices = boundaryRing.map((coord) => {
      const { x, y: z } = projectLngLatToMeters(originLngLat, [coord[0], coord[1]]);
      return new Vector3(-x, 0, z);
    });

    const terrainMaterial = new DataMaterial({
      maxValue: maxAltitude,
      minValue: minAltitude,
      perimiter: perimiterVertices,
      colorRamp,
      contour: false,
      contourColor: new Color('#ffffff'),
    })

    // const mapMaterial = new MapProviderMaterial({
    //   bounds: new LngLatBounds(
    //     new LngLat(lngLatBounds[0], lngLatBounds[1]),
    //     new LngLat(lngLatBounds[2], lngLatBounds[3]),
    //   ),
    // })

    const terrainPickingMaterial = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader,
      fragmentShader: fragmentShaderPicker,
      uniforms: {
        uMaxAltitude: { value: maxAltitude },
        uMinAltitude: { value: minAltitude },
        uOriginAltitude: { value: originCoords[2] },
      },
      side: DoubleSide,
    })

    // const cubes = []

    // for (let i = 0; i < vertices.length; i += 3) {
    //   cubes.push({ position: new Vector3(vertices[i], vertices[i + 1], vertices[i + 2]), lngLatAlt: lngLats[i / 3] });
    // }

    return {
      terrainGeometry,
      terrainMaterial,
      terrainPickingMaterial,
      origin,
      lngLats,
      minAltitude,
      maxAltitude,
      bounds,
    };

  }, [colorRamp]);

  const dpr = useThree((state) => state.gl.getPixelRatio());

  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);

  const target = useFBO(window.innerWidth * dpr, window.innerHeight * dpr, {
    type: FloatType,
    format: RGBAFormat,
  });

  const pixelReadBuffer = useMemo(() => new Float32Array(4), []);

  const { state: { mouseScreenPos } } = useGlobalState();

  useFrame((state) => {
    let oldMaterial: ShaderMaterial | null = null;
    const terrainMesh = scene.getObjectByName("terrain-mesh") as Mesh;

    if (terrainMesh?.material) {
      oldMaterial = terrainMesh.material as ShaderMaterial;
      terrainMesh.material = terrain.terrainPickingMaterial;
      terrainMesh.material.needsUpdate = true;
    }

    state.gl.setRenderTarget(target)

    const dpr = state.gl.getPixelRatio();

    camera.setViewOffset(
      window.innerWidth * dpr,
      window.innerHeight * dpr,
      Math.floor( mouseScreenPos.x * dpr ),
      Math.floor( mouseScreenPos.y * dpr ),
      1,
      1
    );

    const oldBackground = scene.background;
    scene.background = new Color(1, 0, 0);

    const features = scene.getObjectByName("features") as Group;
    const oldFeaturesVisible = features.visible;
    features.visible = false;

    const terrainPoints = scene.getObjectByName("terrain-points") as Points;
    const oldTerrainPointsVisible = terrainPoints.visible;
    terrainPoints.visible = false;

    state.gl.render(scene, camera)

    scene.background = oldBackground;

    features.visible = oldFeaturesVisible;
    terrainPoints.visible = oldTerrainPointsVisible;

    camera.clearViewOffset();

    gl.readRenderTargetPixels(
      target,
      0,
      0,
      1,
      1,
      pixelReadBuffer
    );

    if (terrainMesh) {
      terrainMesh.material = oldMaterial!;
    }

    state.gl.setRenderTarget(null)

  })

  useEffect(() => {
    if (terrain.terrainMaterial) {
      terrain.terrainMaterial.uniforms.uContour.value = showContour ? 1 : 0;
      terrain.terrainMaterial.needsUpdate = true;
      terrain.terrainMaterial.uniforms.uShowSlope.value = showSlope ? 1 : 0;
    }
  }, [showContour, terrain.terrainMaterial, showSlope])

  // return useMemo(() => { console.count('+++++++++++======== returning terrain state'); return { ...terrain, pixelReadBuffer } }, [terrain, pixelReadBuffer]);
  return useMemo(() => ({ ...terrain, pixelReadBuffer }), [terrain, pixelReadBuffer]);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTerrainState() {
  return useContext(TerrainContext);
}
