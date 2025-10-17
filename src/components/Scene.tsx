import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import delaunate from '../delaunate';
import cozinheira from '../data/cozinheira-multi-point.json' with { type: 'json' };
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  FloatType,
  GLSL3,
  Group,
  Mesh,
  Points,
  PointsMaterial,
  RGBAFormat,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import vertexShader from '../shaders/height.vert.glsl?raw';
import fragmentShaderPicker from '../shaders/picker.frag.glsl?raw';
import { convertMetersToLngLat, projectLngLatToMeters } from '../project';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import type { LngLat } from '@maptiler/sdk';
import Features, { type FeatureHoverEventData } from './Features';
import { TerrainCtxProvider } from '../hooks/useTerrainState';
import { Compass } from './Compass';
import { QueryPositionCtxProvider } from '../hooks/useQueryElevationAtPosition';
import UserPosition from './UserPosition';
import DataMaterial from '../materials/DataMaterial';

export type ScenePointerEvent = ThreeEvent<PointerEvent> & { lngLat: LngLat, altitude: number };

const ramp = [
  {
    color: 'yellow',
    value: 1,
  },
  {
    color: 'orange',
    value: 1,
  },
  {
    color: 'magenta',
    value: 0.7,
  },
  {
    color: '#13195a',
    value: 0,
  },
]

// const ramp = [
//   {
//     color: '#ffffff',
//     value: 1,
//   },
//   {
//     color: '#000000',
//     value: 0,
//   },
// ]

export default function Scene({
  colorRamp = ramp,
  showContour,
  showSlope,
  showPoints,
  onMouseMove,
  onMouseLeave,
  showFeatureInfo,
}: {
  colorRamp?: {
    color: string;
    value: number;
  }[];
  showContour: boolean;
  showSlope: boolean;
  showPoints: boolean;
  onMouseMove: (event: ScenePointerEvent) => void;
  onMouseLeave: () => void;
  showFeatureInfo: (feature: FeatureHoverEventData | null) => void;
}) {

  

  const camera = useThree((state) => state.camera);

  const gl = useThree((state) => state.gl);
  // const viewport = useThree((state) => state.viewport);
  const dpr = useThree((state) => state.gl.getPixelRatio());

  const target = useFBO(window.innerWidth * dpr, window.innerHeight * dpr, {
    type: FloatType,
    format: RGBAFormat,
  });

  const scene = useThree((state) => state.scene);

  const terrain = useMemo(() => {
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

    const geom = new BufferGeometry();
    geom.setIndex(indices);
    geom.setAttribute('position', new BufferAttribute(vertices, 3));
    geom.setAttribute('normal', new BufferAttribute(normals, 3));
    geom.computeVertexNormals();

    const originCoords = cozinheira.features.find((f) => f.properties?.pointType === 'origin')?.geometry.coordinates as [number, number, number] ?? [0,0,0];
    const originLngLat: [number, number] = [originCoords[0], originCoords[1]];

    const boundaryFeature = cozinheira.features.find((feature) => feature.properties?.name === 'boundary');
    const boundaryRing = boundaryFeature?.geometry.coordinates[0] as [number, number][] || [];

    const perimiterVertices = boundaryRing.map((coord) => {
      const { x, y: z } = projectLngLatToMeters(originLngLat, [coord[0], coord[1]]);
      return new Vector3(-x, 0, z);
    });

    const material = new DataMaterial({
      maxValue: maxAltitude,
      minValue: minAltitude,
      perimiter: perimiterVertices,
      colorRamp,
      contour: false,
      contourColor: new Color('white'),
    })

    const pickingMaterial = new ShaderMaterial({
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
      geom,
      material,
      pickingMaterial,
      origin,
      lngLats,
      minAltitude,
      maxAltitude,
      bounds,
    };

  }, [colorRamp]);


  useEffect(() => {
    if (terrain.material) {
      terrain.material.uniforms.uContour.value = showContour ? 1 : 0;
      terrain.material.needsUpdate = true;
      terrain.material.uniforms.uShowSlope.value = showSlope ? 1 : 0;
    }
  }, [showContour, terrain.material, showSlope])

  // Store mouse position and interpolated height
  const [mouseScreenPos, setMouseScreenPos] = useState(new Vector2());
  // const [interpolatedHeight, setInterpolatedHeight] = useState(null);

  const pixelReadBuffer = useMemo(() => new Float32Array(4), []);

  // Event handler for mouse move
  const handleMouseMove = useCallback((event: ScenePointerEvent) => {
    setMouseScreenPos(new Vector2(event.clientX, event.clientY));
    const alt = pixelReadBuffer[0];
    const lngLat = convertMetersToLngLat(terrain.origin, { x: event.point.x, y: event.point.y });
    onMouseMove?.({
      ...event,
      lngLat,
      altitude: alt,
    });
  }, [onMouseMove, pixelReadBuffer, terrain.origin]);


  const handleMouseLeave = useCallback(() => {
    onMouseLeave?.();
  }, [onMouseLeave]);

  // useEffect(() => {
  //   // Attach listener to the canvas element
  //   const canvas = gl.domElement;
  //   canvas.addEventListener('mousemove', handleMouseMove);
  //   return () => canvas.removeEventListener('mousemove', handleMouseMove);
  // }, [gl.domElement, handleMouseMove, viewport]);

  // Buffer to read pixel data

  useFrame((state) => {
    let oldMaterial: ShaderMaterial | null = null;
    const terrainMesh = scene.getObjectByName("terrain-mesh") as Mesh;

    if (terrainMesh?.material) {
      oldMaterial = terrainMesh.material as ShaderMaterial;
      terrainMesh.material = terrain.pickingMaterial;
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

  const terrainCtxValue = useMemo(() => {
    return {
      terrainGeometry: terrain.geom,
      terrainMaterial: terrain.material,
      terrainPickingMaterial: terrain.pickingMaterial,
      origin: terrain.origin,
      lngLats: terrain.lngLats,
      minAltitude: terrain.minAltitude,
      maxAltitude: terrain.maxAltitude,
      bounds: terrain.bounds,
    }
  }, [terrain]) 


  const handleFeatureHover = useCallback((feature: FeatureHoverEventData | null) => {
    showFeatureInfo(feature);
  }, [showFeatureInfo]);


  const handleFeatureSelect = useCallback((feature: FeatureHoverEventData | null) => {
    console.log("feature select", feature);
  }, []);

  const lightPosition = useMemo(() => {
    return [terrain.origin[0], terrain.origin[1] + 100, terrain.origin[2]] as [number, number, number];
  }, [terrain.origin]);

  return (
    <TerrainCtxProvider value={terrainCtxValue}>
      <QueryPositionCtxProvider debug={true}>
        <directionalLight position={lightPosition} intensity={6} />
        <ambientLight intensity={2} />
        <points
          visible={showPoints}
          name="terrain-points"
          material={new PointsMaterial({ color: 'blue' })}
          renderOrder={99} geometry={terrain.geom}
        />
        <mesh
          name="terrain-mesh"
          onPointerMove={handleMouseMove}
          onPointerLeave={handleMouseLeave}
          onClick={e => console.log("terrain mesh click", e)}
          renderOrder={1}
          geometry={terrain.geom}
          material={terrain.material}
        />

        <Features
          origin={terrain.origin}
          onFeatureHover={handleFeatureHover}
          onFeatureSelect={handleFeatureSelect}
        />
        <Compass />
        <UserPosition />
      </QueryPositionCtxProvider>
    </TerrainCtxProvider>
  )
}