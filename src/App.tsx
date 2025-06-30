import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo } from 'react';
import delaunate from './delaunate';
import cozinheira from '../public/cozinheira-multi-point.json' with { type: 'json' };
import { BufferAttribute, BufferGeometry, DoubleSide, MeshStandardMaterial, ShaderMaterial, Vector2, Vector3 } from 'three';
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
    console.log(maxAltitude, minAltitude);
    const geom = new BufferGeometry();

    geom.setIndex(indices);
    geom.setAttribute('position', new BufferAttribute(vertices, 3));
    geom.computeVertexNormals();

    const perimiterVertices = cozinheira.features.find((feature) => feature.properties?.name === 'boundary')?.geometry.coordinates?.flat() ?? []
    const origin = cozinheira.features[0].geometry.coordinates[0] as [number, number, number] 
    const originXZ: [number, number] = [origin[0], origin[2]]
    const uPerimiterVertices = perimiterVertices.map((coord) => {
      const { x, y: z } = projectLngLatToMeters(originXZ, coord as [number, number])
      return new Vector3(x, z, origin[2])
    });


    const { x: originX, y: originZ } = projectLngLatToMeters(originXZ, originXZ)
    const uPolygonPlaneOrigin = new Vector3(originX, originZ, origin[2])

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader: `#define MAX_POLYGON_VERTICES ${uPerimiterVertices.length}\n${fragmentShader}`,
      uniforms: {
        uMaxAltitude: { value: maxAltitude },
        uMinAltitude: { value: minAltitude },
        uContour: { value: false },
        uNumPolygonPoints: { value: uPerimiterVertices.length },
        uPolygonPoints: { value: uPerimiterVertices },
        uPolygonPlaneNormal: { value: new Vector3(0, 1, 0) },
        uPolygonPlaneOrigin: { value: uPolygonPlaneOrigin },
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
