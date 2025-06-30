import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo } from 'react';
import delaunate from './delaunate';
import cozinheira from '../public/cozinheira-multi-point.json' with { type: 'json' };
import { BufferAttribute, BufferGeometry, DoubleSide, ShaderMaterial, Vector3 } from 'three';
import vertexShader from './shaders/height.vert.glsl?raw';
import fragmentShader from './shaders/height.frag.glsl?raw';
import { projectLngLatToMeters } from './project';

export default function App() {

  const terrain = useMemo(() => {
    const {
      positions: vertices,
      indices,
      maxAltitude,
      minAltitude,
    } = delaunate(cozinheira as GeoJSON.FeatureCollection<GeoJSON.Geometry>, 1, cozinheira.features[0].geometry.coordinates as [number, number, number], true);
    
    const geom = new BufferGeometry();

    geom.setIndex(indices);
    geom.setAttribute('position', new BufferAttribute(vertices, 3));
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
      vertexShader,
      fragmentShader: `#define MAX_POLYGON_VERTICES ${perimiterVertices.length}\n${fragmentShader}`,
      uniforms: {
        uMaxAltitude: { value: maxAltitude },
        uMinAltitude: { value: minAltitude },
        uContour: { value: false },
        uNumPolygonPoints: { value: perimiterVertices.length },
        uPolygonPoints: { value: perimiterVertices },
      },
      side: DoubleSide,
    })

    return { geom, material };
  }, []);


  return (
    <Canvas
      camera={{
        position: [0, 200, 0],
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <points
        renderOrder={1} geometry={terrain.geom}
        onPointerEnter={(e) => console.log(e.unprojectedPoint)}
      />
      <mesh geometry={terrain.geom} material={terrain.material} />
      <OrbitControls />
    </Canvas>
  )
}
