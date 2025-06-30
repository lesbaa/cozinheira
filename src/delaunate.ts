import Delaunator from 'delaunator';
import { projectLngLatToMeters } from './project';
import { isCloseTo } from './math';

const allowedGeometryTypes = ['MultiPoint', 'LineString', 'Polygon'];

export default function delaunate(geojson: GeoJSON.FeatureCollection<GeoJSON.Geometry>, featureIndex: number = 0, origin: [number, number, number], cullOddAltitudes: boolean = false) {
  const points = [];
  const altitudes: Record<string, number> = {};
  const vertices: number[] = [];
  const normals: number[] = [];

  const originVec2: [number, number] = [origin[0], origin[1]];

  if (!allowedGeometryTypes.includes(geojson.features[featureIndex].geometry.type) || !geojson.features[featureIndex].geometry.coordinates) {
    throw new Error('Invalid geometry type');
  }

  const coordsArray: Array<[number, number, number]> = geojson.features[featureIndex].geometry.coordinates;

  for (const coords of coordsArray) {

    const { x, y } = projectLngLatToMeters(originVec2, [coords[0], coords[1]]);
    const altKey = `${x},${y}`;

    const thisIndex = coordsArray.indexOf(coords);
    const averageAltitudeOfSurroundingPoints = coordsArray
      .slice(thisIndex - 6, thisIndex + 6)
      .reduce((acc, curr) => acc + curr[2], 0) / 6;

    if (cullOddAltitudes && isCloseTo(averageAltitudeOfSurroundingPoints, coords[2], 500)) {
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

  for (let i = 0; i < coords.length; i += 2) {
    const { x, y: z } = projectLngLatToMeters(originVec2, [coords[i], coords[i + 1]]);
    const altitudeKey = `${x},${z}`;
    const y = altitudes[altitudeKey] - origin[2];
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
