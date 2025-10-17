import { useGLTF } from "@react-three/drei";
import { useCallback, useMemo } from "react";
import { BoxGeometry, CanvasTexture, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry } from "three";
import logger from "../utils/logger";

export default function useFeatureMeshes() {
  // 1. Define the 2D points for the profile curve
  const dropletMesh = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.style.backgroundColor = 'transparent';
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const text = "💧";
    ctx.font = '90px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 50, 50);
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
  
    const mesh = new Mesh(
      new PlaneGeometry(3, 3),
      new MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.5 })
    );
    mesh.name = "Droplet";
    mesh.position.set(0, 1, 0);
    return mesh;
  }, []);

  const wellMesh = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.style.backgroundColor = 'transparent';
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const text = "🪣";
    ctx.font = '90px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 50, 50);
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
  
    const mesh = new Mesh(
      new PlaneGeometry(3, 3),
      new MeshBasicMaterial({ map: texture, transparent: true })
    );
    mesh.name = "QuestionMark";
    mesh.position.set(0, 1, 0);
    return mesh;
  }, []);

  const treeGLTF = useGLTF(`/trees/scene.gltf`);

//   const scene = useThree((state) => state.scene);


//   const [modelIndex, setModelIndex] = useState(0);

//   useEffect(() => {
//   console.log(treeGLTF.scene.children);

//     const interval = setInterval(() => {
//       setModelIndex((prev) => (prev + 1) % treeGLTF?.scene?.children?.length);
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [treeGLTF?.scene?.children]);

//   useEffect(() => {
//     if (!treeGLTF?.scene?.children) return;

// // console.log(Object.values(treeGLTF.nodes)[modelIndex]);

//   scene.add(treeGLTF.scene.children[modelIndex]);
//   scene.remove(treeGLTF.scene.children[modelIndex - 1]);
//   }, [treeGLTF, scene, modelIndex]);

  const treeMeshes = useMemo(() => {
    if (!treeGLTF.nodes) return {};

    const meshes = Object.entries(treeGLTF.nodes ?? {})
      .map(([, child]) => {
        child.userData.upIsNegative = false;

        return child;
      });

    if (!meshes) return {};

    return meshes.reduce((acc, mesh) => {
      acc[mesh.name] = mesh as Mesh;
      return acc;
    }, {} as Record<string, Mesh>);
  }, [treeGLTF.nodes]);

  const questionMarkMesh = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.style.backgroundColor = 'transparent';
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const text = "?";
    ctx.font = '90px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 50, 50);
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;

    const mesh = new Mesh(
      new PlaneGeometry(3, 3),
      new MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.5 })
    );
    mesh.name = "QuestionMark";
    return mesh;
  }, []);

  const meshes = useMemo(() => {
    return {
      "Droplet": dropletMesh,
      "Bucket": wellMesh,
      ...treeMeshes,
      "QuestionMark": questionMarkMesh,
    }
  }, [dropletMesh, wellMesh, questionMarkMesh, treeMeshes]);

  const getMesh = useCallback((name: string) => {
    const mesh = meshes[name as keyof typeof meshes];

    if (!mesh) {
      logger.warnOnce(`Mesh [${name}] not found...`)
      return new Mesh(
        new BoxGeometry(1,1,1),
        new MeshBasicMaterial({ color: 'red' })
      )
    }

    return mesh as Mesh;
  }, [meshes]);

  return getMesh
}