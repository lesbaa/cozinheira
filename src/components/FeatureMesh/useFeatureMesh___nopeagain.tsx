import { FeatureTypesConfig, type FeatureType } from '../Features/types';
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { BoxGeometry, CanvasTexture, Material, Mesh, MeshBasicMaterial, PlaneGeometry, type BufferGeometry } from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

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

type GeometryAndMaterial = {
  geometry: BufferGeometry | BoxGeometry | PlaneGeometry;
  material: Material | MeshBasicMaterial;
}

// 2. Wrap your component in forwardRef
export function useFeatureMesh({ featureType }: {
  featureType: FeatureType,
}) {

  const [geometryAndMaterial, setGeometryAndMaterial] = useState<GeometryAndMaterial>(fallbackGeometryAndMaterial());

  useLayoutEffect(() => {
    if (featureType.mesh === "QuestionMark") {
      setGeometryAndMaterial(questionMarkGeometryAndMaterial());
      return;
    }
    
    if (featureType.mesh === "Bucket") {
      setGeometryAndMaterial(bucketGeometryAndMaterial());
      return;
    }

    if (featureType.mesh === "Droplet") {
      setGeometryAndMaterial(dropletGeometryAndMaterial());
      return;
    }

    if (featureType.mesh === "Climber") {
      setGeometryAndMaterial(fallbackGeometryAndMaterial());
      return;
    }

    if (featureType.mesh === "ClimberTwo") {
      setGeometryAndMaterial(fallbackGeometryAndMaterial());
      return;
    }

    const url = getURLForFeatureType(featureType);

    async function loadGLTFGeometryAndMaterial(url: string) {
      const { geometry, material } = await getGLTFGeometryAndMaterial({ url, scale: featureType.sizeMultiplier ?? 1, name: featureType.mesh, featureType });
      setGeometryAndMaterial({ geometry, material });
    }

    if (url) {
      loadGLTFGeometryAndMaterial(url);
    }

  }, [featureType]);

  return geometryAndMaterial;
};


async function getGLTFGeometryAndMaterial({ url,scale, name }: { url: string, scale: number, name: string, featureType: FeatureType }) {
  const loader = new GLTFLoader();

  const { scene } = await loader.loadAsync(url);

  const object = scene.getObjectByName(name) as Mesh;

  if (!object || !object.geometry) {
    return fallbackGeometryAndMaterial();
  }

  object.scale.set(scale, scale, scale);

  return {
    geometry: object.geometry as BufferGeometry,
    material: object.material as Material,
  };
}

const fallbackGeometryAndMaterial = () => {
  const geometry = new BoxGeometry(1, 5, 1);
  const material = new MeshBasicMaterial({ color: 'red' });

  return { geometry, material };
};

interface GetGeneralTexturedMeshProps extends React.ComponentProps<'mesh'> {
  name: string;
  text: string;
  // geometryRef: React.RefObject<BufferGeometry>;
  // materialRef: React.RefObject<Material>;
}

function getGeneralTexturedMeshGeometryAndMaterial({ name, text, }: GetGeneralTexturedMeshProps) {
  const texture = (() => {
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
  })();

  const geometry = new PlaneGeometry(6, 10);
  console.log(Object.values(geometry.attributes).map((attr) => attr.array.length));
  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.5,
  });

  return { geometry, material };
};

const questionMarkGeometryAndMaterial = () => {
  return getGeneralTexturedMeshGeometryAndMaterial({ name: "QuestionMark", text: "?" });
};

const bucketGeometryAndMaterial = () => {
  return getGeneralTexturedMeshGeometryAndMaterial({ name: "Bucket", text: "🪣" });
};

const dropletGeometryAndMaterial = () => {
  return getGeneralTexturedMeshGeometryAndMaterial({ name: "Droplet", text: "💧" });
};
