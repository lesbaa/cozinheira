// import { Gltf, Text } from '@react-three/drei' // Commented out - not currently used
import { FeatureTypesConfig, type FeatureType } from '../Features/types';
import React, { useMemo } from 'react';
import { BoxGeometry, CanvasTexture, Material, Mesh, MeshBasicMaterial, PlaneGeometry, type BufferGeometry } from 'three';
import { Gltf, useGLTF } from '@react-three/drei';

// You may need to: npm install @react-three/drei

const meshesArray = Object.values(FeatureTypesConfig); // Commented out - not currently used

const textureCache = new Map<string, CanvasTexture>();
const canvasCache = new Map<string, { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }>();

const createCanvas = (width: number, height: number, name: string) => {
  if (canvasCache.has(name)) {
    return canvasCache.get(name)!;
  }

  const canvas = document.createElement('canvas');

  canvas.style.backgroundColor = 'transparent';
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;

  canvasCache.set(name, { canvas, ctx: ctx });

  return { canvas, ctx };
};

function getURLForFeatureType(featureType: FeatureType) {
  const mesh = meshesArray.find((mesh) => mesh.mesh === featureType.mesh);
  if (!mesh) {
    return null;
  }

  return `./trees_ind/${mesh.mesh}.glb`;
}


// 2. Wrap your component in forwardRef
export const FeatureMesh = ({ featureType }: {
  featureType: FeatureType,
  // geometryRef: React.RefObject<BufferGeometry>,
  // materialRef: React.RefObject<Material>,
}) => {

  // console.count(featureType.id);

  if (featureType.mesh === "QuestionMark") {
    return <QuestionMark />;
  }

  if (featureType.mesh === "Bucket") {
    return <Bucket />;
  }

  if (featureType.mesh === "Droplet") {
    return <Droplet />;
  }

  if (featureType.mesh === "Climber") {
    return <FallbackMesh />;
  }

  if (featureType.mesh === "ClimberTwo") {
    return <FallbackMesh />;
  }

  // return <FallbackMesh />;

  const url = getURLForFeatureType(featureType);

  if (url) {
    return (
        <GLTFMesh
          url={url}
          scale={featureType.sizeMultiplier ?? 1}
          name={featureType.mesh}
          featureType={featureType}
        />
    )
  }


  // Default fallback
  return <FallbackMesh />;
};

// function GLTFMesh({ url, scale, name, featureType }: { url: string, scale: number, name: string, featureType: FeatureType }) {
//   return (
//     <Gltf
//       src={url}
//       scale={scale}
//       name={name}
//       userData={{ featureType }}
//     />
//   )
// }

function GLTFMesh({ url, scale, name, featureType }: { url: string, scale: number, name: string, featureType: FeatureType }) {
  const { meshes, materials, ...rest } = useGLTF(url);

  const object = meshes[name];

  const firstMaterial = Object.values(materials)[0];

  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const material = useMemo(() => new MeshBasicMaterial({ color: 'red' }), []);

  if (!object || !object.geometry || !firstMaterial) {
    return (
      <>
        <primitive bufferGeometry object={geometry} />
        <primitive meshBasicMaterial object={material} />
      </>
    )
  }

  return (
    <>
        <primitive bufferGeometry object={object.geometry as BufferGeometry} scale={scale} name={name} />
        <primitive material object={firstMaterial as Material} name={name} />
    </>
  )
}

export default FeatureMesh;

const FallbackMesh = ({
  // geometryRef,
  // materialRef,
}: {
  // geometryRef: React.RefObject<BufferGeometry>,
  // materialRef: React.RefObject<Material>,
}) => {
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const material = useMemo(() => new MeshBasicMaterial({ color: 'red' }), []);

  return (
    <>
      <primitive bufferGeometry object={geometry} />
      <primitive meshBasicMaterial object={material} />
    </>
  )
};

interface GeneralTexturedMeshProps extends React.ComponentProps<'mesh'> {
  name: string;
  text: string;
  // geometryRef: React.RefObject<BufferGeometry>;
  // materialRef: React.RefObject<Material>;
}

export const GeneralTexturedMesh = ({ name, text, }: GeneralTexturedMeshProps  ) => {
  const texture = useMemo(() => {
    const { canvas, ctx } = createCanvas(100, 150, name);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '90px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 50, 50);

    const tex = textureCache.get(name) || new CanvasTexture(canvas);
    textureCache.set(name, tex);
    tex.needsUpdate = true; // Mark texture for update
    
    return tex;
  }, [name, text]); // <-- Dependencies added here

  const geometry = useMemo(() => new PlaneGeometry(3, 5), []);

  const material = useMemo(() => new MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.5,
  }), [texture]); // It must update if the texture changes

  return (
    // 4. Use `name` prop and forwarded ref
    <>
      <primitive bufferGeometry object={geometry} />
      <primitive meshBasicMaterial object={material} />
    </>
  )
};

const QuestionMark = ({ }: {}  ) => {
  return (
    <GeneralTexturedMesh
      name="QuestionMark"
      text="?"
    />
  )
};

const Bucket = ({ }: {}  ) => {
  return (
    <GeneralTexturedMesh
      name="Bucket"
      text="🪣"
    />
  )
};

const Droplet = ({ }: {}  ) => {
  return (
    <GeneralTexturedMesh
      name="Droplet"
      text="💧"
    />
  )
};
