import { Billboard, Hud, OrthographicCamera, Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const CompassGroup = ({ groupRef }: { groupRef: React.Ref<THREE.Group> }) => (
  <group ref={groupRef}>
    <mesh position={[0, 0, 25]} rotation={[Math.PI / 2, 0, 0]}>
      <coneGeometry args={[5, 15, 4]} />
      <meshBasicMaterial color='red' />
    </mesh>
    <mesh position={[0, 0, -25]} rotation={[-Math.PI / 2, 0, 0]}>
      <coneGeometry args={[5, 15, 4]} />
      <meshBasicMaterial color='grey' />
    </mesh>
    <mesh position={[0, 0, 25]} rotation={[Math.PI / 2, 0, 0]}>
      <coneGeometry args={[5, 15, 4]} />
      <meshBasicMaterial color='red' />
    </mesh>
    <mesh position={[0, 0, -25]} rotation={[-Math.PI / 2, 0, 0]}>
      <coneGeometry args={[5, 15, 4]} />
      <meshBasicMaterial color='grey' />
    </mesh>

    <Billboard position={[0, 0, 45]}>
      <Text fontSize={10} color='white'>
        N
      </Text>
    </Billboard>
    <Billboard position={[0, 0, -45]}>
      <Text fontSize={10} color='white'>
        S
      </Text>
    </Billboard>
    <Billboard position={[45, 0, 0]}>
      <Text fontSize={10} color='white'>
        E
      </Text>
    </Billboard>
    <Billboard position={[-45, 0, 0]}>
      <Text fontSize={10} color='white'>
        W
      </Text>
    </Billboard>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[38, 1, 32]} />
      <meshBasicMaterial color='white' side={THREE.DoubleSide} transparent={true} opacity={0.4} />
    </mesh>
    <mesh rotation={[0, -Math.PI / 2, 0]}>
      <torusGeometry args={[38, 1, 32]} />
      <meshBasicMaterial color='white' side={THREE.DoubleSide} transparent={true} opacity={0.4} />
    </mesh>
    <mesh rotation={[0, 0, 0]}>
      <ringGeometry args={[38, 40, 32]} />
      <meshBasicMaterial color='white' side={THREE.DoubleSide} />
    </mesh>
  </group>
)

export function Compass() {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const worldQuaternion = useMemo(() => {
    return new THREE.Quaternion()
  }, [])
  new THREE.Quaternion()

  useFrame(() => {
    if (groupRef.current) {
      camera.getWorldQuaternion(worldQuaternion)
      groupRef.current.quaternion.copy(worldQuaternion).invert()
    }
  })

  return (
    <Hud renderPriority={1}>
      <ambientLight intensity={Math.PI} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <OrthographicCamera makeDefault position={[0, 0, 100]} />
      <group
        position={[window.innerWidth / 2 - 120, -window.innerHeight / 2 + 120, 0]}
        scale={1.5}
      >
        <CompassGroup groupRef={groupRef} />
      </group>
    </Hud>
  )
}
