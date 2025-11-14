import Delaunator from 'delaunator';
import { projectLngLatToMeters, type Point2D } from './project';
import * as turf from '@turf/turf';
import { isCloseTo } from './utils/math';

const allowedGeometryTypes = ['MultiPoint', 'LineString', 'Polygon'];

type AllowedGeometry = GeoJSON.MultiPoint | GeoJSON.LineString | GeoJSON.Polygon;

const memoizedResults = new Map<MemoizedKey, ReturnType<typeof delaunate>>();

type MemoizedKey = {
  geojson: GeoJSON.FeatureCollection;
  featureName: string;
  cullOddAltitudes: boolean;
}

type DelaunateResult = {
  positions: Float32Array;
  indices: number[];
  normals: Float32Array;
  maxAltitude: number;
  minAltitude: number;
  origin: [number, number, number];
  lngLats: number[][];
  bounds: {
    min: Point2D;
    max: Point2D;
  };

}

export default function delaunate(
  geojson: GeoJSON.FeatureCollection,
  featureName: string = 'topography',
  cullOddAltitudes: boolean = false
): DelaunateResult {
  const memoKey: MemoizedKey = {
    geojson,
    featureName,
    cullOddAltitudes,
  }

  if (memoizedResults.has(memoKey)) {
    return memoizedResults.get(memoKey)!;
  }

  const points = [];
  const altitudes: Record<string, number> = {};
  const vertices: number[] = [];
  const normals: number[] = [];

  const featureIndex = geojson.features.findIndex(feature => feature.properties?.name === featureName);

  const originIndex = geojson.features.findIndex(feature => feature.properties?.pointType === 'origin');
  const originFeature = geojson.features[originIndex] as GeoJSON.Feature<GeoJSON.Point>;
  const origin = originFeature.geometry.coordinates as [number, number, number];
  
  const originVec2: [number, number] = [origin[0], origin[1]];

  const featureGeometry = geojson.features[featureIndex].geometry as AllowedGeometry;

  if (!allowedGeometryTypes.includes(featureGeometry.type) || !featureGeometry.coordinates) {
    throw new Error('Invalid geometry type');
  }
  const coordsArray: Array<[number, number, number]> = featureGeometry.coordinates as [number, number, number][];

  for (const coords of coordsArray) {

    const { x, y } = projectLngLatToMeters(originVec2, [coords[0], coords[1]]);
    const altKey = `${x},${y}`;

    const thisIndex = coordsArray.indexOf(coords);
    const averageAltitudeOfSurroundingPoints = coordsArray
      .slice(thisIndex - 6, thisIndex + 6)
      .reduce((acc, curr) => acc + curr[2], 0) / 12;

    if (cullOddAltitudes && !isCloseTo(averageAltitudeOfSurroundingPoints, coords[2], 50)) {
      continue;
    }

    if (altitudes[altKey]) {
      continue;
    }

    points.push(coords[0], coords[1]);

    altitudes[altKey] = coords[2];
  }

  const delaunator = new Delaunator(points);
  const indices = delaunator.triangles;
  const coords = delaunator.coords;
  const lngLats = [];

  const boundsLL = turf.bbox(geojson.features[featureIndex]);

  const [minX, minY, maxX, maxY] = boundsLL;

  const bounds = {
    min: projectLngLatToMeters(originVec2, [minX, minY]),
    max: projectLngLatToMeters(originVec2, [maxX, maxY]),
  }

  for (let i = 0; i < coords.length; i += 2) {
    const { x, y: z } = projectLngLatToMeters(originVec2, [coords[i], coords[i + 1]]);
    const altitudeKey = `${x},${z}`;
    const altitude = altitudes[altitudeKey];
    if (altitude === undefined) continue;
    const y = altitude - origin[2];

    lngLats.push([coords[i], coords[i + 1], altitudes[altitudeKey]]);
    if (!z || !x || !y) continue;

    vertices.push(-x, y, z);
  }


  for (let i = 0; i < indices.length; i += 3) {
    const v0 = [vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2]];
    const v1 = [vertices[i * 3 + 3], vertices[i * 3 + 4], vertices[i * 3 + 5]];
    const v2 = [vertices[i * 3 + 6], vertices[i * 3 + 7], vertices[i * 3 + 8]];
    normals.push(...calculateNormal(v0, v1, v2));
  }

  return {
    positions: new Float32Array(vertices),
    indices: Array.from(indices),
    normals: new Float32Array(normals),
    maxAltitude: Math.max(...vertices.filter((_, i) => i % 3 === 2)),
    minAltitude: Math.min(...vertices.filter((_, i) => i % 3 === 2)),
    origin,
    lngLats,
    bounds,
  }
}

function calculateNormal(v0: number[], v1: number[], v2: number[]) {
  const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
  const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

  // Cross product
  const normal = [
    edge1[1] * edge2[2] - edge1[2] * edge2[1],
    edge1[2] * edge2[0] - edge1[0] * edge2[2],
    edge1[0] * edge2[1] - edge1[1] * edge2[0]
  ];

  // Normalize
  const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
  if (length === 0) return [0, 0, 0]; // Avoid division by zero
  return [normal[0] / length, normal[1] / length, normal[2] / length];
}
