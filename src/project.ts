import { LngLat } from "maplibre-gl";

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Earth's mean radius in meters (WGS84 ellipsoid is more accurate for larger scales, but 
 * for a local tangent plane, this is often sufficient).
 */
const EARTH_RADIUS_METERS = 6371000; 

/**
 * Converts degrees to radians.
 * @param degrees Angle in degrees.
 * @returns Angle in radians.
 */
function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Projects a lngLat point onto a local tangent plane (ENU) relative to an origin.
 *
 * @param origin The reference point (lngLat) for the local coordinate system.
 * @param point The point (lngLat) to project.
 * @returns The projected point in meters (x, y) relative to the origin.
 */
export function projectLngLatToMeters(origin: [number, number], point: [number, number]): Point2D {
  // origin[0] is longitude, origin[1] is latitude
  // point[0] is longitude, point[1] is latitude

  const originLatRad = degToRad(origin[1]); // Latitude of the origin in radians
  const deltaLngRad = degToRad(point[0] - origin[0]); // Difference in longitude in radians
  const deltaLatRad = degToRad(point[1] - origin[1]); // Difference in latitude in radians

  // X (East-West) distance in meters
  // This correctly accounts for the convergence of longitude lines using cos(latitude)
  const x = deltaLngRad * EARTH_RADIUS_METERS * Math.cos(originLatRad);

  // Y (North-South) distance in meters
  // This is simpler as latitude lines are approximately parallel
  const y = deltaLatRad * EARTH_RADIUS_METERS;

  return { x, y };
}

/**
 * Converts a point in meters (relative to an originLngLat) back to lngLat coordinates
 * using the reverse Local Tangent Plane (ENU) projection.
 *
 * @param originLngLat The original lngLat point that represents (0,0) in the meter scene.
 * @param pointInMeters The point's coordinates in meters (x, y) relative to the origin.
 * @returns The converted lngLat coordinates.
 */
export function convertMetersToLngLat(originLngLat: [number, number], pointInMeters: Point2D): LngLat {
  const originLatRad = degToRad(originLngLat[1]);

  // Recalculate the approximate meters per degree at the origin's latitude
  const metersPerDegreeLat = EARTH_RADIUS_METERS * (Math.PI / 180);
  const metersPerDegreeLng = EARTH_RADIUS_METERS * Math.cos(originLatRad) * (Math.PI / 180);

  // Calculate the change in latitude and longitude in degrees
  const deltaLatDegrees = pointInMeters.y / metersPerDegreeLat;
  const deltaLngDegrees = pointInMeters.x / metersPerDegreeLng;

  // Add the deltas to the origin's coordinates
  const resultLat = originLngLat[1] + deltaLatDegrees;
  const resultLng = originLngLat[0] + deltaLngDegrees;

  return new LngLat(resultLng, resultLat);
}

// Calculate distance using Haversine for comparison (for demonstration)
export function getDistanceInMeters(point1: [number, number], point2: [number, number]): number {
  const R = EARTH_RADIUS_METERS; // Radius of Earth in meters
  const dLat = degToRad(point2[1] - point1[1]);
  const dLon = degToRad(point2[0] - point1[0]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(point1[1])) * Math.cos(degToRad(point2[1])) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in meters
  return d;
}

