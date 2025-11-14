// import { useGLTF } from "@react-three/drei";
// import { useCallback, useEffect, useMemo, useState } from "react";
// import { BoxGeometry, CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
// import logger from "../utils/logger";

// const materialCache = new Map<string, MeshBasicMaterial>();
// const textureCache = new Map<string, CanvasTexture>();
// const geometryCache = new Map<string, PlaneGeometry>();
// const meshCache = new Map<string, Mesh>();
// const canvasCache = new Map<string, { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }>();

// const createCanvas = (width: number, height: number, name: string) => {
//   if (canvasCache.has(name)) {
//     return canvasCache.get(name)!;
//   }

//   const canvas = document.createElement('canvas');

//   canvas.style.backgroundColor = 'transparent';
//   canvas.width = width;
//   canvas.height = height;

//   const ctx = canvas.getContext('2d')!;

//   canvasCache.set(name, { canvas, ctx: ctx });

//   return { canvas, ctx };
// };

// export default function useFeatureMeshes() {
//   const dropletMesh = useMemo(() => {
//     const { canvas, ctx } = createCanvas(100, 150, 'droplet');
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     const text = "💧";
//     ctx.font = '90px Arial';
//     ctx.fillStyle = 'red';
//     ctx.textAlign = 'center';  
//     ctx.textBaseline = 'middle';
//     ctx.fillText(text, 50, 50);
//     const texture = textureCache.get('droplet') || new CanvasTexture(canvas);

//     textureCache.set('droplet', texture);


//     const material = materialCache.get('droplet') || new MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.5 });
//     materialCache.set('droplet', material);

//     const geometry = geometryCache.get('droplet') || new PlaneGeometry(3, 5);
//     geometryCache.set('droplet', geometry);

//     const mesh = meshCache.get('droplet') || new Mesh(
//       geometry,
//       material
//     );
//     mesh.name = "Droplet";
//     mesh.position.set(0, 1, 0);
//     texture.needsUpdate = true;

//     meshCache.set('droplet', mesh);
//     return mesh;
//   }, []);

//   const wellMesh = useMemo(() => {
//     const { canvas, ctx } = createCanvas(100, 150, 'well');

//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     const text = "🪣";

//     ctx.font = '90px Arial';
//     ctx.fillStyle = 'red';
//     ctx.textAlign = 'center';
//     ctx.textBaseline = 'middle';
//     ctx.fillText(text, 50, 50);

//     const texture = textureCache.get('well') || new CanvasTexture(canvas);

//     textureCache.set('well', texture);

//     const material = materialCache.get('well') || new MeshBasicMaterial({ map: texture, transparent: true });
//     materialCache.set('well', material);

//     const geometry = geometryCache.get('well') || new PlaneGeometry(3, 5);
//     geometryCache.set('well', geometry);

//     const mesh = meshCache.get('well') || new Mesh(
//       geometry,
//       material
//     );

//     mesh.name = "Well";

//     texture.needsUpdate = true;

//     meshCache.set('well', mesh);

//     return mesh;
//   }, []);

//   const treeGLTF = useGLTF(`./trees/scene.gltf`, false, true);
// //   const scene = useThree((state) => state.scene);


// //   const [modelIndex, setModelIndex] = useState(0);

// //   useEffect(() => {
// //   console.log(treeGLTF.scene.children);

// //     const interval = setInterval(() => {
// //       setModelIndex((prev) => (prev + 1) % treeGLTF?.scene?.children?.length);
// //     }, 1000);
// //     return () => clearInterval(interval);
// //   }, [treeGLTF?.scene?.children]);

// //   useEffect(() => {
// //     if (!treeGLTF?.scene?.children) return;

// // // console.log(Object.values(treeGLTF.nodes)[modelIndex]);

// //   scene.add(treeGLTF.scene.children[modelIndex]);
// //   scene.remove(treeGLTF.scene.children[modelIndex - 1]);
// //   }, [treeGLTF, scene, modelIndex]);


//   const [loaded, setLoaded] = useState(false)
//   useEffect(() => {
//     const t = setTimeout(() => {
//       setLoaded(true)
//     }, 0);
//     return () => clearTimeout(t);
//   }, []);

//   const treeMeshes = useMemo(() => {
//     if (!treeGLTF.nodes || !loaded) return {};

//     const meshes = Object.entries(treeGLTF.nodes ?? {})
//       .map(([, child]) => {
//         if ([
//           'Scene',
//           'Camera',
//           'DirectionalLight',
//           'DirectionalLightHelper',
//           'AmbientLight',
//           'AmbientLightHelper',
//           'HemisphereLight',
//           'HemisphereLightHelper',
//         ].includes(child.name)) return null;
//         if (meshCache.has(child.name)) return meshCache.get(child.name);
//         // console.log(
//         //   child.name,
//         //   !!child,
//         //   child?.geometry,
//         //   !!child?.geometry?.attributes?.position,
//         //   child?.geometry?.attributes?.position?.array?.length)
//         meshCache.set(child.name, child as Mesh);

//         child.userData.upIsNegative = false;

//         return child;
//       });

//     if (!meshes) return {};

//     return meshes.reduce((acc, mesh) => {
//       if (!mesh) return acc;
//       acc[mesh.name] = mesh as Mesh;
//       return acc;
//     }, {} as Record<string, Mesh>);
//   }, [treeGLTF.nodes, loaded]);

//   const questionMarkMesh = useMemo(() => {
//     const { canvas, ctx } = createCanvas(100, 150, 'questionMark');

//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     const text = "?";

//     ctx.font = '90px Arial';
//     ctx.fillStyle = 'red';
//     ctx.textAlign = 'center';
//     ctx.textBaseline = 'middle';
//     ctx.fillText(text, 50, 50);

//     const texture = textureCache.get('questionMark') || new CanvasTexture(canvas);
//     textureCache.set('questionMark', texture);
//     texture.needsUpdate = true;

//     const material = materialCache.get('questionMark') || new MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.5 });
//     materialCache.set('questionMark', material);

//     const geometry = geometryCache.get('questionMark') || new PlaneGeometry(3, 5);
//     geometryCache.set('questionMark', geometry);

//     const mesh = meshCache.get('questionMark') || new Mesh(
//       geometry,
//       material
//     );

//     mesh.name = "QuestionMark";

//     return mesh;
//   }, []);

//   const meshes = useMemo(() => {
//     return {
//       "Droplet": dropletMesh,
//       "Bucket": wellMesh,
//       ...treeMeshes,
//       "QuestionMark": questionMarkMesh,
//     }
//   }, [dropletMesh, wellMesh, questionMarkMesh, treeMeshes]);

//   const getMesh = useCallback((name: string) => {
//     const mesh = meshes[name as keyof typeof meshes];

//     if (!mesh || !loaded) {
//       // logger.warnOnce(`Mesh [${name}] not found...`)
//       return new Mesh(
//         new BoxGeometry(1,1,1),
//         new MeshBasicMaterial({ color: 'red' })
//       )
//     }

//     return mesh as Mesh;
//   }, [meshes, loaded]);

//   return getMesh;
// }