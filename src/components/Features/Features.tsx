import featuresData from '../../data/features.json' with { type: 'json' };
import useQueryElevationAtPosition from '../../hooks/useQueryElevationAtPosition';
import { projectLngLatToMeters } from '../../project';
import { Instance, Instances } from '@react-three/drei';
import { isCloseTo } from '../../utils/math';
import type { Feature, FeatureCollection, Point } from 'geojson';
import { Material, type Mesh } from 'three';
import { useThree } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { FeatureTypesConfig, type FeatureType } from './types';
import useFeatureMeshes from '../../hooks/useFeatureMeshes';

const UNKNOWN_ALT_REPLACEMENT = 10;

interface FeatureProperties {
  id: number | string;
  name: string;
  hidden?: boolean;
  isDummyRenderElement?: boolean;
  description: string;
  featureType: string;
  featureSubType?: string;
  size: number;
}

export type FeatureHoverEventData = {
  mouseX: number;
  mouseY: number;
  id: number;
  lngLat: [number, number];
  alt: number;
  position: [number, number, number];
  type: string;
  size: number;
  subType: string;
  hidden: boolean;
  debugData: {
    queriedElevation: number;
    alt: number;
    id: string;
    position: [number, number, number];
  }
}

const features: FeatureCollection<Point, FeatureProperties> = featuresData as  FeatureCollection<Point, FeatureProperties>;

// const mnLng = -7.4457
// const mxLng = -7.4435
// const mnLat = 39.4197
// const mxLat = 39.418

// const side = 50;

// const features = {
//   features: new Array(side).fill(0).map((_, row) => 
//     new Array(side).fill(0).map((__, col) => ({
//       type: 'Feature',
//       geometry: {
//         type: 'Point',
//         coordinates: [mnLng + (mxLng - mnLng) * col / side, mnLat + (mxLat - mnLat) * row / side],
//       },
//       properties: {
//         id: 'features' + row + '-' + col,
//         name: 'features' + row + '-' + col,
//         description: 'features' + row + '-' + col,
//         featureType: 'features' + row + '-' + col,
//         size: 1,
//       },
//     }))
//   ).flat(),
//   properties: {
//     id: 'features',
//     name: 'features',
//     description: 'features',
//     featureType: 'features',
//     size: 1,
//   },
// }

// DarkGreenTree
// LightGreenTree
// RedTree
// YellowTree
// PurpleTree
// PinkTree
// DarkBlueTree
// LightBlueTree


function Features({
  origin,
  onFeatureHover,
  onFeatureSelect,
}: {
  origin: [number, number, number];
  onFeatureHover: (feature: FeatureHoverEventData | null) => void;
  onFeatureSelect: (feature: FeatureHoverEventData | null) => void;
}) {
  const { queryElevation } = useQueryElevationAtPosition();

  return (
    <group name="features">
      {Object.values(FeatureTypesConfig).map((featureType) => {
        // console.log("==============")
        // console.log(features.features.filter((feature) => feature.properties.featureType === featureType.id).length, featureType.mesh)
        // console.log("==============")
        return (
          <FeatureType
            featureType={featureType}
            features={features.features.filter((feature) => feature.properties.featureType === featureType.id)}
            queryElevation={queryElevation}
            origin={origin}
            key={featureType.id}
            onFeatureHover={onFeatureHover}
            onFeatureSelect={onFeatureSelect}
          />
        )
      })}
    </group>
  )
}

function FeatureType({
  features,
  queryElevation,
  origin,
  featureType,
  onFeatureHover,
  onFeatureSelect,
}: {
  features: Feature<Point, FeatureProperties>[],
  queryElevation: (position: { x: number, y: number }, debugFunctionCall?: boolean) => number,
  origin: [number, number, number],
  featureType: FeatureType,
  onFeatureHover: (feature: FeatureHoverEventData | null) => void;
  onFeatureSelect: (feature: FeatureHoverEventData | null) => void;
}) {
  const cam = useThree((state) => state.camera);

  const instancesRef = useRef(null);

  useFrame(() => {
    if (featureType.isCanvasMesh) {
      const instances = instancesRef.current;
      if (instances) {
        // @ts-expect-error - who gives a fuck?
        (instances).children.forEach((mesh: Mesh) => {
          mesh.rotation.set(cam.rotation.x, cam.rotation.y, cam.rotation.z);
        });
      }
    }
  });


  const colorMap = {
    "SOB": "black",
    "MARM": "black",
    "HAWTH": "black",
    "AMEND": "black",
    "FIG": "black",
    "CARVP": "black",
    "AZINH": "black",
    "LILAC": "black",
    "AMEIXA": "black",
    "CYP": "black",
    "OSYRISALBA": "black",
    "GILB": "black",
    "HERA": "black",
    "MADRESSILVA": "black",
    "GORSE": "black",
    "GORREIRO": "black",
    "SALGB": "black",
    "OLIVEIRA": "black",
    "UNKNOWN": "black",
    "POND": "cyan",
    "WELL": "cyan",
  }

  const { featureMeshes, loading } = useFeatureMeshes();
  // if (loading) {
  //   return null;
  // }
  
  // 2. Get the correct mesh.
  const mesh = featureMeshes?.[featureType.mesh] ?? featureMeshes?.Fallback;

  // 3. Safety check. If no mesh, don't render.
  // if (!mesh || !mesh.geometry) {
  //   return null;
  // }

  if (features.length < 5 && mesh) {
    return (
      <group ref={instancesRef}>
      {features.map((feature) => {
        const lngLat = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]] as [number, number];
        const alt = feature.geometry.coordinates[2];
        const { x, y } = projectLngLatToMeters([origin[0], origin[1]], lngLat);
        const queriedElevation = queryElevation({ x, y });

        const position = constructPosition(x, y, alt, queriedElevation, origin, feature.properties.id?.toString());

        return (
          <mesh
            name={feature.properties.id.toString()}
            key={feature.properties.id.toString()}
            visible={!feature.properties.hidden}
            position={[
              position[0], // - 7.5, // why does this work?
              (alt ? alt - origin[2] : position[1]),
              position[2] // - 6, // same, why does this work?
            ]}
            // frustumCulled={false}
            onPointerEnter={(e) => onFeatureHover({ ...e.object.userData as FeatureHoverEventData, mouseX: e.clientX, mouseY: e.clientY })}
            onPointerDown={(e) => onFeatureSelect({ ...e.object.userData as FeatureHoverEventData, mouseX: e.clientX, mouseY: e.clientY })}
            onPointerLeave={() => onFeatureHover(null)}
            scale={(featureType.sizeMultiplier ?? 1) * (feature.properties.size ?? 1)}
            userData={{
              id: feature.properties.id,
              lngLat,
              alt: alt ? alt - origin[2] : position[1],
              position: [-x, queriedElevation, y],
              type: featureType.id,
              size: feature.properties.size,
              subType: feature.properties.featureSubType,
              hidden: feature.properties.hidden,
              debugData: {
                queriedElevation,
                alt,
                id: feature.properties.id,
                position,
              }
            }}
            onClick={(e) => onFeatureSelect(e.object.userData as FeatureHoverEventData | null)}
          >
            <primitive bufferGeometry object={mesh.geometry} />
            <primitive material object={mesh.material} />
          </mesh>
        )
      })}
      </group>
    )
  }
  

  // console.log(featureType.mesh, features.length)
  return (
    <Instances
      ref={instancesRef}
      visible={!loading && Boolean(mesh?.geometry)}
      limit={features.length}
      name={`features-instances-${featureType.id}`}
      geometry={mesh?.geometry}
      material={mesh?.material}
      key={mesh?.name && features.length}
    >
      {features.map((feature) => {
        const lngLat = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]] as [number, number];
        const alt = feature.geometry.coordinates[2];
        const { x, y } = projectLngLatToMeters([origin[0], origin[1]], lngLat);
        const queriedElevation = queryElevation({ x, y });

        const position = constructPosition(x, y, alt, queriedElevation, origin, feature.properties.id?.toString());

        return (
          <Instance
            name={feature.properties.id.toString()}
            key={feature.properties.id.toString()}
            visible={!feature.properties.hidden}
            position={[
              position[0], // - 7.5, // why does this work?
              (alt ? alt - origin[2] : position[1]),
              position[2] // - 6, // same, why does this work?
            ]}
            // frustumCulled={false}
            onPointerEnter={(e) => onFeatureHover({ ...e.object.userData as FeatureHoverEventData, mouseX: e.clientX, mouseY: e.clientY })}
            onPointerDown={(e) => onFeatureSelect({ ...e.object.userData as FeatureHoverEventData, mouseX: e.clientX, mouseY: e.clientY })}
            onPointerLeave={() => onFeatureHover(null)}
            scale={(featureType.sizeMultiplier ?? 1) * (feature.properties.size ?? 1)}
            userData={{
              id: feature.properties.id,
              lngLat,
              alt: alt ? alt - origin[2] : position[1],
              position: [-x, queriedElevation, y],
              type: featureType.id,
              size: feature.properties.size,
              subType: feature.properties.featureSubType,
              hidden: feature.properties.hidden,
              debugData: {
                queriedElevation,
                alt,
                id: feature.properties.id,
                position,
              }
            }}
            onClick={(e) => onFeatureSelect(e.object.userData as FeatureHoverEventData | null)}
          />
        )
      })}
    </Instances>
  )
}

const constructPositionMemoizedData: Record<string, [number, number, number]> = {}

function constructPosition(
  x: number,
  y: number,
  alt: number,
  queriedElevation: number,
  origin: [number, number, number],
  id: string = 'unknown',
  forceRefresh: boolean = false,
  debug: boolean = false,
) {

  const dataKey = `${x},${y},${alt},${queriedElevation},${origin[0]},${origin[1]},${origin[2]},${id}`;

  if (constructPositionMemoizedData[dataKey] && !forceRefresh) {
    return constructPositionMemoizedData[dataKey];
  }

  const position: [number, number, number] = isCloseTo(queriedElevation, 0, 1.01)
    ? [-x, alt - origin[2], y]
    : [-x, queriedElevation - origin[2], y];

  const invalidAltitude = position[1] === 0
    || position[1] === null
    || position[1] === undefined
    || isNaN(position[1])
    // || !isCloseTo(position[1], 0, 500) // TODO find the max difference

  if (invalidAltitude) {
    // Logger.warnOnce(`Object "${id}" at position ${x}, ${y} has invalid altitude`);
    return [
      position[0],
      UNKNOWN_ALT_REPLACEMENT,
      position[2],
    ];
  }

  if (debug) {
    console.table({ position, x, y, alt, queriedElevation, origin, heh: debug });
  }

  constructPositionMemoizedData[dataKey] = position;

  return position;
}

export default Features;