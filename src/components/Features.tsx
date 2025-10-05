import { memo } from 'react';
import features from '../data/features.json' with { type: 'json' };
import useQueryElevationAtPosition from '../hooks/useQueryElevationAtPosition';
import { projectLngLatToMeters } from '../project';
import { Instance, Instances } from '@react-three/drei';
import { isCloseTo } from '../utils/math';

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

function Features({
  origin,
}: {
  origin: [number, number, number];
}) {
  const { queryElevation, Debug } = useQueryElevationAtPosition({ debug: true });
  return (
    <Instances limit={features.features.length} name="features" frustumCulled={false}>
      {/* <Debug /> */}
      <boxGeometry args={[0.5, 4, 0.5]} />
      <meshBasicMaterial color={`hsl(20deg, 100%, 50%)`} />
      {features.features.map((feature) => {
        const lngLat = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]] as [number, number];
        const alt = feature.geometry.coordinates[2];
        const { x, y } = projectLngLatToMeters([origin[0], origin[1]], lngLat);
        const queriedElevation = queryElevation({ x, y });

        const position = constructPosition(x, y, alt, queriedElevation, origin);

        return (
          <Instance
            key={feature.properties.id}
            position={[
              position[0], // - 7.5, // why does this work?
              alt ? alt - origin[2] : position[1],
              position[2] // - 6, // same, why does this work?
            ]}
            color={feature.properties.featureType === 'UNKNOWN' ? 'red' : 'blue'}
            scale={1}
            userData={{
              id: feature.properties.id,
              lngLat,
              alt: alt ? alt - origin[2] : position[1],
              position: [-x, queriedElevation, y],
              type: feature.properties.featureType,
              size: feature.properties.size,
              subType: feature.properties.featureSubType,
              debugData: {
                queriedElevation,
                alt,
                id: feature.properties.id,
                position,
              }
            }}
            onClick={(e) => {
              console.log("e.object.userData", e.object.userData);
            }}
          />
        )
      })}
    </Instances>
  )
}

function constructPosition(
  x: number,
  y: number,
  alt: number,
  queriedElevation: number,
  origin: [number, number, number],
  debug: boolean = false,
) {
  const position: [number, number, number] = isCloseTo(queriedElevation, 0, 1.01)
    ? [-x, alt - origin[2], y]
    : [-x, queriedElevation - origin[2], y];

  const invalidAltitude = position[1] === 0
    || position[1] === null
    || position[1] === undefined
    || isNaN(position[1])
    // || !isCloseTo(position[1], 0, 500) // TODO find the max difference

  if (invalidAltitude) {
    return [
      position[0],
      50,
      position[2],
    ];
  }

  if (debug) {
    console.table({ position, x, y, alt, queriedElevation, origin, heh: debug });
  }

  return position;
}

export default memo(Features);