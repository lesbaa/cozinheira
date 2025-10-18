import { memo, useMemo } from 'react';
import featuresData from '../data/features.json' with { type: 'json' };
import useQueryElevationAtPosition from '../hooks/useQueryElevationAtPosition';
import { projectLngLatToMeters } from '../project';
import { Instance, Instances } from '@react-three/drei';
import { isCloseTo } from '../utils/math';
import Logger from '../utils/logger';
import type { Feature, FeatureCollection, Point } from 'geojson';
import useFeatureMeshes from '../hooks/useFeatureMeshes';
import type { Mesh } from 'three';
import { useThree } from '@react-three/fiber';

const UNKNOWN_ALT_REPLACEMENT = 10;

interface FeatureProperties {
  id: number;
  name: string;
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

type FeatureType = {
  id: string;
  color: string;
  mesh: string;
  sizeMultiplier?: number;
}

const featureTypes: Record<string, FeatureType> = {
  SOB: { 
    id: "SOB",
    color: "",
    mesh: "Blobbed_1",
    sizeMultiplier: 1.5,
  },
  MARM: { 
    id: "MARM",
    color: "",
    mesh: "Bubbled_4",
    sizeMultiplier: 0.75,
  },
  HAWTH: { 
    id: "HAWTH",
    color: "",
    mesh: "Dead_3",
    sizeMultiplier: 0.75,
  },
  AMEND: { 
    id: "AMEND",
    color: "",
    mesh: "Blobbed_1",
    sizeMultiplier: 1,
  },
  FIG: { 
    id: "FIG",
    color: "",
    mesh: "Boxed_4",
    sizeMultiplier: 1,
  },
  CARVP: { 
    id: "CARVP",
    color: "",
    mesh: "Blobbed_2",
    sizeMultiplier: 1,
  },
  AZINH: { 
    id: "AZINH",
    color: "",
    mesh: "Blobbed_5",
    sizeMultiplier: 0.75,
  },
  LILAC: { 
    id: "LILAC",
    color: "",
    mesh: "Bubbled_5",
    sizeMultiplier: 0.5,
  },
  AMEIXA: { 
    id: "AMEIXA",
    color: "",
    mesh: "Boxed_5",
    sizeMultiplier: 0.75,
  },
  CYP: { 
    id: "CYP",
    color: "",
    mesh: "Boxed_1",
    sizeMultiplier: 2,
  },
  OSYRISALBA: { 
    id: "OSYRISALBA",
    color: "",
    mesh: "Dead_3",
    sizeMultiplier: 0.25,
  },
  GILB: { 
    id: "GILB",
    color: "",
    mesh: "Boxed_3",
    sizeMultiplier: 0.5,
  },
  HERA: { 
    id: "HERA",
    color: "",
    mesh: "Climber",
  },
  MADRESSILVA: { 
    id: "MADRESSILVA",
    color: "",
    mesh: "ClimberTwo",
  },
  GORSE: { 
    id: "GORSE",
    color: "",
    mesh: "Dead_1",
    sizeMultiplier: 0.5,
  },
  GORREIRO: { 
    id: "GORREIRO",
    color: "",
    mesh: "Dead_2",
    sizeMultiplier: 0.5,
  },
  SALGB: { 
    id: "SALGB",
    color: "",
    mesh: "Domed_1",
    sizeMultiplier: 0.75,
  },
  OLIVEIRA: { 
    id: "OLIVEIRA",
    color: "",
    mesh: "Bubbled_1",
    sizeMultiplier: 1,
  },
  UNKNOWN: { 
    id: "UNKNOWN",
    color: "",
    mesh: "QuestionMark",
    sizeMultiplier: 1,
  },
  POND: { 
    id: "pond",
    color: "",
    mesh: "Droplet",
  },
  WELL: { 
    id: "well",
    color: "",
    mesh: "Bucket",
  },
} as const;

function Features({
  origin,
  onFeatureHover,
  onFeatureSelect,
}: {
  origin: [number, number, number];
  onFeatureHover: (feature: FeatureHoverEventData | null) => void;
  onFeatureSelect: (feature: FeatureHoverEventData | null) => void;
}) {
  const getMesh = useFeatureMeshes();
  const { queryElevation, ready } = useQueryElevationAtPosition();

  return (
    <>
      {Object.values(featureTypes).map((featureType) => {
        return (
          <FeatureType
            visible={ready}
            getMesh={getMesh}
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
    </>
  )
}

function FeatureType({
  visible,
  features,
  queryElevation,
  origin,
  featureType,
  getMesh,
  onFeatureHover,
  onFeatureSelect,
}: {
  visible: boolean,
  features: Feature<Point, FeatureProperties>[],
  queryElevation: (position: { x: number, y: number }, debugFunctionCall?: boolean) => number,
  origin: [number, number, number],
  featureType: FeatureType,
  getMesh: (name: string) => Mesh,
  onFeatureHover: (feature: FeatureHoverEventData | null) => void;
  onFeatureSelect: (feature: FeatureHoverEventData | null) => void;
}) {

  const mesh = getMesh(featureType.mesh);
  const isBillboard = useMemo(() => {
    if (!mesh) return false;

    return mesh.name === "QuestionMark" || mesh.name === "Droplet";
  }, [mesh]);


  const cam = useThree((state) => state.camera);

  if (!mesh || !mesh.geometry || !mesh.material) return null;

  return (
    <Instances
      visible={visible}
      limit={features.length}
      name="features"
      geometry={mesh.geometry}
      material={mesh.material}
      frustumCulled={false}
      >
      {features.map((feature) => {

        const lngLat = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]] as [number, number];
        const alt = feature.geometry.coordinates[2];
        const { x, y } = projectLngLatToMeters([origin[0], origin[1]], lngLat);
        const queriedElevation = queryElevation({ x, y });

        const position = constructPosition(x, y, alt, queriedElevation, origin, feature.properties.id?.toString());

        const rotation: [number, number, number] = isBillboard ? [
          cam.rotation.x,
          cam.rotation.y,
          cam.rotation.z,
        ] : [mesh.userData.upIsNegative ? Math.PI : 0, Number(feature.properties.id), 0];
        
        return (
          <Instance
            key={feature.properties.id}
            position={[
              position[0], // - 7.5, // why does this work?
              (alt ? alt - origin[2] : position[1]),
              position[2] // - 6, // same, why does this work?
            ]}
            onPointerEnter={(e) => onFeatureHover({ ...e.object.userData as FeatureHoverEventData, mouseX: e.clientX, mouseY: e.clientY })}
            onPointerDown={(e) => onFeatureSelect({ ...e.object.userData as FeatureHoverEventData, mouseX: e.clientX, mouseY: e.clientY })}
            onPointerLeave={() => onFeatureHover(null)}
            rotation={rotation}
            scale={(featureType.sizeMultiplier ?? 1) * (feature.properties.size ?? 1)}
            color={"#ffffff"}
            userData={{
              id: feature.properties.id,
              lngLat,
              alt: alt ? alt - origin[2] : position[1],
              position: [-x, queriedElevation, y],
              type: featureType.id,
              size: feature.properties.size,
              subType: feature.properties.featureSubType,
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
    Logger.warnOnce(`Object "${id}" at position ${x}, ${y} has invalid altitude`);
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

export default memo(Features);