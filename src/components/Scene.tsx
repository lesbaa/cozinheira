import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import delaunate from '../delaunate';
import cozinheira from '../data/cozinheira-multi-point.json' with { type: 'json' };
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CameraHelper,
  CanvasTexture,
  Color,
  DoubleSide,
  FloatType,
  GLSL3,
  Group,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Points,
  PointsMaterial,
  RGBAFormat,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three';
import vertexShader from '../shaders/height.vert.glsl?raw';
import fragmentShader from '../shaders/height.frag.glsl?raw';
import fragmentShaderPicker from '../shaders/picker.frag.glsl?raw';
import { convertMetersToLngLat, projectLngLatToMeters } from '../project';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import type { LngLat } from '@maptiler/sdk';
import Features from './Features';
import { TerrainCtxProvider } from '../hooks/useTerrainState';

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

export default function Scene({
  colorRamp = ramp,
  showContour,
  showSlope,
  showPoints,
  onMouseMove,
  onMouseLeave,
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
}) {
  const colorRampCanvas = useMemo(() => {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    if (!ctx) return;

    c.width = 1;
    c.height = 256;


    return { ctx , c };
  }, [])

  const colorRampTexture = useMemo(() => {
    const texture = new CanvasTexture();

    return texture;
  }, [])
  

  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  // const viewport = useThree((state) => state.viewport);
  const dpr = useThree((state) => state.gl.getPixelRatio());

  const target = useFBO(window.innerWidth * dpr, window.innerHeight * dpr, {
    type: FloatType,
    format: RGBAFormat,
  });

  const scene = useThree((state) => state.scene);

  useEffect(() => {
    if (!colorRampCanvas) return;

    const gradient = colorRampCanvas.ctx.createLinearGradient(0, 0, 0, 256);

    colorRamp.forEach((stop) => {
      gradient.addColorStop(stop.value, stop.color);
    });

    colorRampCanvas.ctx.fillStyle = gradient;
    colorRampCanvas.ctx.fillRect(0, 0, 1, 256);

    colorRampTexture.image = colorRampCanvas.c;
    colorRampTexture.needsUpdate = true;

  }, [colorRampCanvas, colorRamp])


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
    const material = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader,
      fragmentShader: `#define MAX_POLYGON_VERTICES ${perimiterVertices.length}\n${fragmentShader}`,
      uniforms: {
        uMaxAltitude: { value: maxAltitude },
        uMinAltitude: { value: minAltitude },
        uContour: { value: false },
        uContourColor: { value: new Color('white') },
        uShowSlope: { value: false },
        uNumPolygonPoints: { value: perimiterVertices.length },
        uPolygonPoints: { value: perimiterVertices },
        uColorRamp: { value: colorRampTexture },
      },
      side: DoubleSide,
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

  }, [colorRampTexture]);


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


  // const debugCenter = useMemo(() => {
  //   return new Vector3();
  // },[])

  // const debugSphere = useMemo(() => {
  //   return new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 'red', wireframe: true }));
  // }, [])

  // const debugFeatureCenter = useMemo(() => {
  //   return new Vector3();
  // },[])

  // const debugFeatureSphere = useMemo(() => {
  //   return new Mesh(new SphereGeometry(0.5, 32), new MeshBasicMaterial({ color: 'blue', wireframe: true }));
  // }, [])

  // useEffect(() => {
  //   scene.add(debugSphere);
  //   scene.add(debugFeatureSphere);
  //   return () => {
  //     scene.remove(debugSphere);
  //     scene.remove(debugFeatureSphere);
  //   }
  //   }, [debugSphere, scene, debugFeatureSphere])

  // useFrame(() => {
  //   const mesh = scene.getObjectByName("terrain-mesh") as Mesh;
  //   const feature = scene.getObjectByName("features") as Group;

  //   if (mesh) {
  //     debugCenter.set(mesh.position.x, mesh.position.y, mesh.position.z);
  //     debugSphere.position.set(debugCenter.x, debugCenter.y, debugCenter.z);
  //   }

  //   if (feature) {
  //     debugFeatureCenter.set(feature.position.x, feature.position.y, feature.position.z);
  //     debugFeatureSphere.position.set(debugFeatureCenter.x, debugFeatureCenter.y, debugFeatureCenter.z);
  //   }
  // })

  return (
    <TerrainCtxProvider value={terrainCtxValue}>
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <points
        visible={showPoints}
        name="terrain-points"
        material={new PointsMaterial({ color: 'blue' })}
        renderOrder={99} geometry={terrain.geom}
        // onPointerEnter={(e) => console.log(e.unprojectedPoint)}
        // onPointerEnter={(e) => console.log(e.unprojectedPoint)}
      />
      <mesh
        name="terrain-mesh"
        onPointerMove={handleMouseMove}
        onPointerLeave={handleMouseLeave}
        renderOrder={1}
        geometry={terrain.geom}
        material={terrain.material}
      />

      <Features
        origin={terrain.origin}
      />

      <axesHelper args={[100]} position={[0, -500, 0]} />
    </TerrainCtxProvider>
  )
}