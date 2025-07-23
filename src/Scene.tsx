import { useCallback, useEffect, useMemo, useState } from 'react';
import delaunate from './delaunate';
import cozinheira from '../public/cozinheira-multi-point.json' with { type: 'json' };
import { BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, Color, DoubleSide, FloatType, GLSL3, Mesh, MeshBasicMaterial, MeshNormalMaterial, Points, RGBAFormat, ShaderMaterial, Texture, Vector2, Vector3 } from 'three';
import vertexShader from './shaders/height.vert.glsl?raw';
import fragmentShader from './shaders/height.frag.glsl?raw';
import fragmentShaderPicker from './shaders/picker.frag.glsl?raw';
import { projectLngLatToMeters } from './project';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import { ConvexGeometry } from 'three-stdlib';

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
  showPoints,
}: {
  colorRamp?: {
    color: string;
    value: number;
  }[];
  showContour: boolean;
  showPoints: boolean;
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
  const viewport = useThree((state) => state.viewport);
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
      indices,
      maxAltitude,
      minAltitude,
    } = delaunate(cozinheira as GeoJSON.FeatureCollection<GeoJSON.Geometry>, 1, cozinheira.features[0].geometry.coordinates as [number, number, number], true);
    console.log(maxAltitude, minAltitude)
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


    const cubes = []

    for (let i = 0; i < vertices.length; i += 3) {
      cubes.push({ position: new Vector3(vertices[i], vertices[i + 1], vertices[i + 2]), lngLatAlt: lngLats[i / 3] });
    }

    return { geom, material, cubes, pickingMaterial };
  }, [colorRampTexture]);


  useEffect(() => {
    if (terrain.material) {
      terrain.material.uniforms.uContour.value = showContour;
      terrain.material.needsUpdate = true;
    }
  }, [showContour, terrain.material])

  // Store mouse position and interpolated height
  const [mouseScreenPos, setMouseScreenPos] = useState(new Vector2());
  const [interpolatedHeight, setInterpolatedHeight] = useState(null);

  const pixelReadBuffer = useMemo(() => new Float32Array(4), []);

  // Event handler for mouse move
  const onMouseMove = useCallback((event: MouseEvent) => {
    setMouseScreenPos(new Vector2(event.clientX, event.clientY));
    console.log(event.clientX, event.clientY, pixelReadBuffer)
  }, [dpr, pixelReadBuffer]);

  useEffect(() => {
    // Attach listener to the canvas element
    const canvas = gl.domElement;
    canvas.addEventListener('mousemove', onMouseMove);
    return () => canvas.removeEventListener('mousemove', onMouseMove);
  }, [gl.domElement, onMouseMove, viewport]);

  // Buffer to read pixel data

  useFrame((state) => {
    let oldMaterial: ShaderMaterial | null = null;
    const terrainMesh = scene.getObjectByName("terrain-mesh") as Mesh;

    if (terrainMesh?.material) {
      oldMaterial = terrainMesh.material as ShaderMaterial;
      terrainMesh.material = terrain.pickingMaterial;
      terrainMesh.material.needsUpdate = true;
      // terrainPoints.visible = false;
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
    state.gl.render(scene, camera)

    scene.background = oldBackground;
    camera.clearViewOffset();
    // console.log(target)
    gl.readRenderTargetPixels(
      target,
      0,
      0,
      1, // width
      1, // height
      pixelReadBuffer // The Float32Array to store the RGBA pixel data
    );

    if (terrainMesh) {
      terrainMesh.material = oldMaterial!;
      // terrainPoints.visible = true;
    }

    state.gl.setRenderTarget(null)

  })

  return (
    <>
    <directionalLight position={[10, 10, 5]} intensity={1} />
    <points
      visible={false}
      name="terrain-points"
      renderOrder={99} geometry={terrain.geom}
      // onPointerEnter={(e) => console.log(e.unprojectedPoint)}
      // onPointerEnter={(e) => console.log(e.unprojectedPoint)}
    />
    <mesh
      name="terrain-mesh"
      renderOrder={1}
      geometry={terrain.geom}
      material={terrain.material}
    />
    {/* <mesh renderOrder={1} geometry={terrain.geom} material={new MeshNormalMaterial({ side: DoubleSide })} /> */}
    {/* {
      terrain.cubes.map((cube, i) => (
        <mesh key={i} position={cube.position} renderOrder={1} geometry={new BoxGeometry(1, 1, 1)} material={new MeshBasicMaterial({ color: 'red' })}
          userData={{ lngLatAlt: cube.lngLatAlt }}
          onClick={() => console.log(cube.lngLatAlt)}
        />
      ))
    } */}
    </>
  )
}