import features from '../data/features.json' with { type: 'json' };
import { projectLngLatToMeters } from '../project';

export default function Features({
  origin,
}: {
  origin: [number, number, number];
}) {
  console.log(features.features);
  return (
    <group>
      {features.features.map((feature) => {
        const lngLat = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]] as [number, number];
        const { x, y } = projectLngLatToMeters(lngLat, [origin[0], origin[1]]);
        const z = feature.geometry.coordinates[2];
        return (
        <mesh key={feature.properties.id} position={[x, 10, -y] as [number, number, number]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="red" />
        </mesh>
      )})}
    </group>
  )
}