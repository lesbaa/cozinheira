/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Box3,
  OrthographicCamera,
  Vector3,
  Mesh,
  Color,
  FloatType,
  RGBAFormat,
  Scene,
  DoubleSide,
  NearestFilter,
  Box3Helper
} from "three";
import useTerrainState from "./useTerrainState";
import { useThree } from "@react-three/fiber";
import { Billboard, ScreenSizer, useFBO } from "@react-three/drei";

export function useQueryElevationAtPositionState({
  debug = true,
}: {
  debug?: boolean;
}) {
  const terrain = useTerrainState();
  
  const gl = useThree((state) => state.gl);

  const scene = useMemo(() => {
    const scene = new Scene();
    scene.background = new Color(0, 1, 0);
    return scene;
  }, []);

  const cam = useMemo(() => {
    const cam = new OrthographicCamera(-1, 1, -1, 1, 0.1, 2000);
    cam.name = 'query-elevation-at-position-cam';
    // cam.position.set(terrain.origin[0], terrain.origin[2] + 100, terrain.origin[1]);
    cam.lookAt(new Vector3(terrain.origin[0], terrain.origin[1], terrain.origin[2]));
    return cam;
  }, []);

  const pickerMesh = useMemo(() => {
    const mesh = new Mesh(terrain.terrainGeometry, terrain.terrainPickingMaterial);

    mesh.position.set(terrain.origin[0], terrain.origin[2], terrain.origin[1]);
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
  }, [scene, terrain.origin, terrain.terrainGeometry, terrain.terrainPickingMaterial]);

  const bounds = useMemo(() => {
    const out =  fitOrthographicCamToSelectionAndReturnBounds(cam, pickerMesh);
    scene.add(new Box3Helper(out.boundingBox.clone(), 0xff0000));
    return out;
  }, [cam, pickerMesh]);

  const dpr = useThree((state) => state.gl.getPixelRatio());

  const terrainAspect = useMemo(() => {
    const geom = pickerMesh.geometry;
    const size = new Vector3();
    geom.computeBoundingBox();
    geom.boundingBox?.getSize(size);
    return size.x / size.z;
  }, [pickerMesh]);


  const targetRes = Math.max(window.innerWidth, window.innerHeight);

   const target = useFBO(targetRes * dpr, targetRes * dpr * terrainAspect, {
     type: FloatType,
     format: RGBAFormat,
     minFilter: NearestFilter,
     magFilter: NearestFilter,
   });

  const pixelReadBuffer = useMemo(() => new Float32Array(4 * target.width * target.height), [target]);
  
  // useFrame((state) => {
  //   const debugMesh = state.scene.getObjectByName('debug-mesh');
  //   if (debugMesh) {
  //     debugMesh.lookAt(state.camera.position);
  //   }
  // });

  useEffect(() => {
    // cam.updateProjectionMatrix();

    pickerMesh.visible = true;

    gl.setRenderTarget(target)

    // const dpr = gl.getPixelRatio();

    // this is what needs changed.

    const oldBackground = scene.background;
    scene.background = new Color(0, 0, 0);

    gl.render(scene, cam);

    pickerMesh.visible = false;
    scene.background = oldBackground;

    gl.readRenderTargetPixels(
      target,
      0,
      0,
      target.width,
      target.height,
      pixelReadBuffer
    );

    gl.setRenderTarget(null)
  }, [cam, gl, scene, target, pixelReadBuffer, pickerMesh]);

  const queryElevation = useCallback((positionInWorldUnits: { x: number, y: number }, debugFunctionCall: boolean = false) => {
    const textureCoords = mapWorldCoordsToTextureCoords(positionInWorldUnits, bounds.viewport, debugFunctionCall);
    if (debugFunctionCall) {
      console.log(`========================================`);
      console.log(`textureCoords`, textureCoords);
      console.log(`positionInWorldUnits`, positionInWorldUnits);
      console.log(`bounds.viewport`, bounds.viewport.min, bounds.viewport.max);
      console.log(`bounds.center`, bounds.center);
      console.log(`========================================`);
    }
    const pixelValue = getPixelValue(pixelReadBuffer, target.width, target.height, textureCoords.x, textureCoords.y);
    // if (pixelValue === 0) console.log("pixelValue", pixelValue, textureCoords, positionInWorldUnits);
    if (!pixelValue) {
      return 0;
    }

    return pixelValue;
  }, [bounds.center, bounds.viewport.max, bounds.viewport.min, bounds.viewport.max, pixelReadBuffer, target.height, target.width]);


  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (target.texture) {
      setReady(true);
    }
    queryElevation({ x: 0, y: 0 });
  }, [target.texture, queryElevation]);

  return {
    ready,
    queryElevation,
    Debug: () => debug ? 
      (
        <Billboard renderOrder={100}>
          <ScreenSizer>
            <mesh name="debug-mesh" position={[-300, -300, -40]} scale={[0.1, 0.1, 0.1]}>
              <planeGeometry args={[target.width, target.height, 10, 10]} />
              <meshBasicMaterial side={DoubleSide} map={target.texture} depthWrite={true} wireframe={false} />
            </mesh>
            <mesh name="debug-mesh-wf" position={[-300, -300, -40]} scale={[0.1, 0.1, 0.1]}>
              <planeGeometry args={[target.width, target.height, 10 , 10]} />
              <meshBasicMaterial side={DoubleSide} depthWrite={true} wireframe={true} />
            </mesh>
          </ScreenSizer>
        </Billboard>
      ) : null
  }
}

export default function useQueryElevationAtPosition() {
  return useContext(QueryPositionContext);
}

const QueryPositionContext = createContext<{
  queryElevation: (position: { x: number, y: number }, debugFunctionCall?: boolean) => number;
  ready: boolean;
  Debug: () => React.ReactNode;
}>({
  queryElevation: () => 0,
  ready: false,
  Debug: () => null,
});

export function QueryPositionCtxProvider({ children, debug }: { children: React.ReactNode, debug?: boolean }) {
  const state = useQueryElevationAtPositionState({ debug });
  return (
    <QueryPositionContext.Provider value={state}>
      {children}
    </QueryPositionContext.Provider>
  )
}

/**
 * Retrieves a pixel value from a Float32Array of pixel data.
 *
 * @param {Float32Array} pixelData - The flat array of pixel data.
 * @param {number} width - The width of the source image.
 * @param {number} height - The height of the source image.
 * @param {number} u - The horizontal texture coordinate [0, 1].
 * @param {number} v - The vertical texture coordinate [0, 1].
 * @returns {number} The pixel value, or 0 if out of bounds.
 */
function getPixelValue(pixelData: Float32Array, width: number, height: number, u: number, v: number) {
  // Assume 4 channels (RGBA). This must match the format used in gl.readPixels!
  const channels = 4;

  // Clamp UV coordinates to the [0, 1] range to avoid errors
  const u_clamped = Math.max(0, Math.min(1, u));
  const v_clamped = Math.max(0, Math.min(1, v));

  // 1. Convert UV to pixel coordinates
  // We use `width - 1` and `height - 1` to correctly map the 1.0 value to the last pixel.
  const x = Math.floor(u_clamped * (width - 1));
  const y = Math.floor(v_clamped * (height - 1));

  // 2. Calculate the index in the 1D array
  const index = (y * width + x) * channels;

  // Check if the calculated index is valid
  if (index < 0 || index + channels > pixelData.length) {
    return null; // Return null if coordinates are invalid
  }

  // 3. Retrieve the pixel data (e.g., RGBA)
  return pixelData[index];
}

function mapWorldCoordsToTextureCoords(
  positionInWorldUnits: { x: number, y: number },
  viewport: {
    min: { x: number, y: number },
    max: { x: number, y: number }
  },
  debugFunctionCall: boolean = false
) {
  
  const xScale = viewport.max.x - viewport.min.x;
  const yScale = viewport.max.y - viewport.min.y;
  const normalizedX = (positionInWorldUnits.x - viewport.min.x) / xScale;
  if (debugFunctionCall) console.log(`normalizedX`, positionInWorldUnits.x, viewport.min.x, xScale);
  const normalizedY = (positionInWorldUnits.y - viewport.min.y) / yScale;

  return {
    x: 1.0 - (isNaN(normalizedX) ? 0 : normalizedX),
    y: 1.0 - (isNaN(normalizedY) ? 0 : normalizedY),
  }
}


function fitOrthographicCamToSelectionAndReturnBounds(cam: OrthographicCamera, object: Mesh) {
  // 1. Get the bounding box of the object
  const boundingBox = new Box3();
  boundingBox.setFromObject(object);

  const center = new Vector3();
  const size = new Vector3();
  
  boundingBox.getCenter(center);
  boundingBox.getSize(size);
  
  // const oldY = center.y;
  // const oldZ = center.z;


  const viewSizeX = size.x;
  const viewSizeY = size.z;

  // if (boxAspect > aspect) {
  //     viewSizeY = size.x / aspect;
  // } else {
  //     viewSizeX = size.y * aspect;
  // }
  
  // viewSizeX *= 1.2;
  // viewSizeY *= 1.2;

  // 3. Set the cam's view properties
  cam.left = -viewSizeX / 2;
  cam.right = viewSizeX / 2;
  cam.top = -viewSizeY / 2;
  cam.bottom = viewSizeY / 2;

  // 4. Position the cam and update the projection matrix
  // center.multiply(new Vector3(0.5, 1, 1.1));

  cam.position.set(center.x, -1, center.z); // A safe distance
  cam.lookAt(center);
  cam.updateProjectionMatrix();

  const viewport = new Box3(
    new Vector3(-viewSizeX / 2, -viewSizeY / 2, -100),
    new Vector3(viewSizeX / 2, viewSizeY / 2, 100),
  )

  return {
    boundingBox,
    center,
    size,
    viewport,
    cam,
  }
}
