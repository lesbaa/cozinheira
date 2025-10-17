import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { projectLngLatToMeters } from "../project";
import { useTerrainState } from "../hooks/useTerrainState";
import logger from "../utils/logger";
import useQueryElevationAtPosition from "../hooks/useQueryElevationAtPosition";
import { Vector3, type Mesh } from "three";
import { useFrame } from "@react-three/fiber";

export default function UserPosition() {
  const { origin } = useTerrainState();

  const { queryElevation } = useQueryElevationAtPosition();
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);

  const handleLatLng = useCallback(({ lat, lng }: { lat: number, lng: number }) => {
    const { x, y } = projectLngLatToMeters([origin[0], origin[1]], [lng, lat]);
    const elevation = queryElevation({ x, y }, false);
    setPosition([x, elevation - origin[2], y]);
    setActive(true);
  }, [origin, queryElevation]);

  useEffect(() => {

    if (!navigator.geolocation) {
      logger.warnOnce("Geolocation is not supported by this browser");
      return;
    }
  
    navigator.geolocation.getCurrentPosition((position) => {
      handleLatLng({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
    }, (error) => {
      logger.errorOnce("Error getting current position", error);
    });

    const watchId = navigator.geolocation.watchPosition((position) => {
      handleLatLng({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
    }, (error) => {
      logger.errorOnce("Error watching position", error);
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [handleLatLng]);

  const pulseSphereRef = useRef<Mesh>(null);

  const animAlphaRef = useRef(0);

  useFrame((_, delta) => {
    if (!pulseSphereRef.current || !active) {
      return;
    }

    animAlphaRef.current += delta;

    if (animAlphaRef.current > 1) {
      animAlphaRef.current = 0;
    }

    pulseSphereRef.current.material.opacity = 1.0 - animAlphaRef.current;
    pulseSphereRef.current.material.needsUpdate = true;
    pulseSphereRef.current.scale.set(
      1.0 + (4.0 * animAlphaRef.current),
      1.0 + (4.0 * animAlphaRef.current),
      1.0 + (4.0 * animAlphaRef.current)
    )

  })

  if (!active) return null;

  return (
    <>
      <mesh position={position} ref={pulseSphereRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="skyblue" transparent={true} />
      </mesh>
      <mesh position={position}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="skyblue" />
      </mesh>
    </>
  )
}