import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { FeatureTypesConfig } from "../components/Features/types";
import { BoxGeometry, BufferGeometry, CanvasTexture, Material, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";

const meshesArray = Object.values(FeatureTypesConfig);

const textureCache = new Map<string, CanvasTexture>();
const canvasCache = new Map<string, { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }>();

const meshCache = new Map<string, { geometry: BufferGeometry; name: string; material: Material }>()

type PreloadTreeGeometryAndMaterialOptions = {
  omit: string[];
}

export async function preloadTreeGeometryAndMaterial({
  omit = [],
}: PreloadTreeGeometryAndMaterialOptions) {
  const loader = new GLTFLoader();
  const promises = meshesArray
    .filter(({ mesh, isCanvasMesh }) => !omit.includes(mesh) && !isCanvasMesh)
    .map(async (mesh) => {
      try {
        const { scene } = await loader.loadAsync(`./trees_ind/${mesh.mesh}.glb`)
        const object = scene.getObjectByName(mesh.mesh) as Mesh;
        if (!object || !object.geometry) {
          return fallbackGeometryAndMaterial(mesh.mesh);
        }
        // console.log('Created PlaneGeometry, checking object.attributes:', name, object.geometry);
        // console.log('  - Position count:', object.geometry.attributes.position.count);
        // console.log('  - UV count:', object.geometry.attributes.uv.count);
        // console.log('  - Index count:', object.geometry.index?.count);

        return {
          name: mesh.mesh,
          geometry: object.geometry as BufferGeometry,
          material: object.material as Material,
        };
      } catch {
        return fallbackGeometryAndMaterial(mesh.mesh);
      }

    })

  return Promise.all(promises)
}

type PreloadFeatureMeshesOptions = {
  omit: string[];
}

export type PreloadedFeatureMeshes = Record<string, { name: string; geometry: BufferGeometry; material: Material }>;

export async function preloadFeatureMeshes({
  omit = [],
}: PreloadFeatureMeshesOptions = { omit: [] }): Promise<PreloadedFeatureMeshes> {
  try {
    
    const treeMeshes = await preloadTreeGeometryAndMaterial({ omit });
    const featureMeshes = {
      "QuestionMark": questionMarkGeometryAndMaterial(),
      "Bucket": bucketGeometryAndMaterial(),
      "Droplet": dropletGeometryAndMaterial(),
      ...treeMeshes.reduce((acc, mesh) => {
        acc[mesh.name] = mesh;
        return acc;
      }, {} as Record<string, { name: string; geometry: BufferGeometry; material: Material }>),
    }

    // await new Promise(resolve => setTimeout(resolve, 0));
    
    return featureMeshes;
  } catch (error) {
    console.error(error);
    return {
      Fallback: {
        name: "Fallback",
        geometry: new BoxGeometry(1, 1, 1),
        material: new MeshBasicMaterial({ color: 'red' }),
      },
    };
  }
}

const fallbackGeometryAndMaterial = (name: string = "Fallback") => {
  const geometry = new BoxGeometry(1, 5, 1);
  const material = new MeshBasicMaterial({ color: 'red' });

  return { name, geometry, material };
};

interface GetGeneralTexturedMeshProps extends React.ComponentProps<'mesh'> {
  name: string;
  text: string;
  // geometryRef: React.RefObject<BufferGeometry>;
  // materialRef: React.RefObject<Material>;
}

function getGeneralTexturedMeshGeometryAndMaterial({ name, text, }: GetGeneralTexturedMeshProps) {
  if (meshCache.has(name)) {
    return meshCache.get(name)
  }

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

  const geometry = new PlaneGeometry(3, 5);
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  // console.log(geometry.attributes.length);
  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.5,
  });

  meshCache.set(name, {
    name,
    geometry,
    material,
  })

  return { name, geometry, material };
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


function createCanvas(width: number, height: number, name: string) {
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