import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { landingProgress } from './progress';
import { mixColor, mixNumber, mixVector, sampleBeat } from './beats';

type SceneProps = { reducedMotion: boolean; onFailure?: () => void };

function ContextGuard({ onFailure }: { onFailure?: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const handleContextLoss = () => onFailure?.();
    gl.domElement.addEventListener('webglcontextlost', handleContextLoss);
    return () => gl.domElement.removeEventListener('webglcontextlost', handleContextLoss);
  }, [gl, onFailure]);
  return null;
}

function TableScene({ reducedMotion }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera);
  const pointer = useThree((state) => state.pointer);
  const accent = useMemo(() => new THREE.Color('#F5A623'), []);
  const background = useMemo(() => new THREE.Color('#1B3FBF'), []);
  const colorScratch = useMemo(() => new THREE.Color(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const cameraPositionTarget = useMemo(() => new THREE.Vector3(), []);
  const fog = useMemo(() => new THREE.Fog('#1B3FBF', 8, 18), []);

  useFrame((state, delta) => {
    if (!group.current) return;
    const { current, next, local } = sampleBeat(landingProgress.value);
    const cameraPosition = mixVector(current.camera, next.camera, local);
    const targetPosition = mixVector(current.target, next.target, local);
    cameraPositionTarget.set(...cameraPosition);
    camera.position.lerp(cameraPositionTarget, 1 - Math.pow(0.001, delta));
    cameraTarget.lerp(target.set(targetPosition[0] + pointer.x * 0.25, targetPosition[1] - pointer.y * 0.12, targetPosition[2]), 1 - Math.pow(0.001, delta));
    camera.lookAt(cameraTarget);
    group.current.rotation.y = mixNumber(current.tableRotation, next.tableRotation, local);
    const scale = mixNumber(current.tableScale, next.tableScale, local);
    group.current.scale.setScalar(scale);
    if (!reducedMotion) group.current.rotation.y += Math.sin(state.clock.elapsedTime * 0.18) * 0.015;
    mixColor(current.accent, next.accent, local, accent, colorScratch);
    mixColor(current.background, next.background, local, background, colorScratch);
    state.scene.background = background;
    fog.color.copy(background);
    state.scene.fog = fog;
  });

  return (
    <group ref={group}>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.35}>
        <circleGeometry args={[7, 64]} />
        <meshStandardMaterial color="#1B3FBF" roughness={0.92} />
      </mesh>
      <TableTop accent={accent} />
      <Chairs accent={accent} />
      <Plate accent={accent} />
      <QrPlacard accent={accent} />
      <MenuCards accent={accent} />
      <Tickets accent={accent} />
      <Receipt accent={accent} />
      <ContactShadows position={[0, -0.25, 0]} opacity={0.35} scale={9} blur={2.4} far={4} />
    </group>
  );
}

function TableTop({ accent }: { accent: THREE.Color }) {
  return (
    <group>
      <mesh position-y={0}>
        <cylinderGeometry args={[2.7, 2.7, 0.38, 64]} />
        <meshStandardMaterial color="#EEF0F2" roughness={0.56} />
      </mesh>
      <mesh position-y={0.22}>
        <torusGeometry args={[2.53, 0.08, 12, 64]} />
        <meshStandardMaterial color={accent} metalness={0.25} roughness={0.35} />
      </mesh>
      <mesh position-y={-0.72}>
        <cylinderGeometry args={[0.66, 0.9, 1.05, 32]} />
        <meshStandardMaterial color="#12141A" roughness={0.62} />
      </mesh>
    </group>
  );
}

function Chairs({ accent }: { accent: THREE.Color }) {
  const positions: [number, number, number][] = [[0, 0, -3.55], [3.55, 0, 0], [0, 0, 3.55], [-3.55, 0, 0]];
  return <group>{positions.map((position, index) => (
    <mesh key={index} position={position} rotation-y={index * Math.PI / 2}>
      <boxGeometry args={[1.15, 0.28, 0.86]} />
      <meshStandardMaterial color={index === 0 ? accent : '#12141A'} roughness={0.6} />
    </mesh>
  ))}</group>;
}

function Plate({ accent }: { accent: THREE.Color }) {
  return <group position-y={0.32}>
    <mesh rotation-x={-Math.PI / 2}>
      <cylinderGeometry args={[1.08, 0.96, 0.12, 48]} />
      <meshStandardMaterial color="#EEF0F2" roughness={0.32} />
    </mesh>
    <mesh position-y={0.12} rotation-x={-Math.PI / 2}>
      <torusGeometry args={[0.7, 0.045, 10, 40]} />
      <meshStandardMaterial color={accent} roughness={0.4} />
    </mesh>
    <mesh position={[0.12, 0.18, 0.05]}>
      <sphereGeometry args={[0.43, 24, 12]} />
      <meshStandardMaterial color="#F5A623" roughness={0.7} />
    </mesh>
  </group>;
}

function QrPlacard({ accent }: { accent: THREE.Color }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) {
      const { current, next, local } = sampleBeat(landingProgress.value);
      ref.current.position.x = mixNumber(-1.65, 0.95, local);
      ref.current.position.z = mixNumber(1.1, -0.8, local);
      ref.current.rotation.y = mixNumber(0.2, Math.PI * 0.72, local);
      ref.current.scale.setScalar(mixNumber(0.75, 1, Math.min(1, local + current.menuSpread * 0.1 + next.menuSpread * 0.1)));
    }
  });
  return <mesh ref={ref} position-y={0.55} rotation-x={-0.2}>
    <boxGeometry args={[0.85, 0.08, 0.85]} />
    <meshStandardMaterial color="#EEF0F2" emissive={accent} emissiveIntensity={0.18} roughness={0.35} />
  </mesh>;
}

function MenuCards({ accent }: { accent: THREE.Color }) {
  return <group position-y={0.55}>{[-1, 0, 1].map((offset) => (
    <mesh key={offset} position={[offset * 1.05, 0, -1.4]} rotation-x={-Math.PI / 2.2} rotation-z={offset * 0.15}>
      <boxGeometry args={[0.82, 0.06, 1.18]} />
      <meshStandardMaterial color="#EEF0F2" emissive={accent} emissiveIntensity={0.1} roughness={0.5} />
    </mesh>
  ))}</group>;
}

function Tickets({ accent }: { accent: THREE.Color }) {
  return <group>{[[-3.2, 0.35, -1.1], [-3.2, 0.55, 0], [-3.2, 0.75, 1.1]].map((position, index) => (
    <mesh key={index} position={position as [number, number, number]} rotation-y={Math.PI / 2}>
      <boxGeometry args={[0.7, 0.05, 0.95]} />
      <meshStandardMaterial color={index === 2 ? accent : '#EEF0F2'} emissive={index === 2 ? accent : '#000000'} emissiveIntensity={0.15} />
    </mesh>
  ))}</group>;
}

function Receipt({ accent }: { accent: THREE.Color }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const { current, next, local } = sampleBeat(landingProgress.value);
    const progress = mixNumber(current.receiptProgress, next.receiptProgress, local);
    ref.current.scale.set(0.9, Math.max(0.02, progress), 1);
    ref.current.position.y = 0.42 + progress * 0.8;
    ref.current.rotation.z = progress * 0.12;
  });
  return <mesh ref={ref} position={[1.65, 0.42, 0.35]} rotation-x={-Math.PI / 2}>
    <planeGeometry args={[1.25, 2.2, 1, 8]} />
    <meshStandardMaterial color="#EEF0F2" emissive={accent} emissiveIntensity={0.08} side={THREE.DoubleSide} />
  </mesh>;
}

export default function LandingScene({ reducedMotion, onFailure }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 8.5, 0.2], fov: 38, near: 0.1, far: 40 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      }}
    >
      <ambientLight intensity={1.35} />
      <directionalLight position={[4, 8, 5]} intensity={3.2} color="#FFF3D6" />
      <pointLight position={[-4, 3, -2]} intensity={18} distance={12} color="#F5A623" />
      <ContextGuard onFailure={onFailure} />
      <TableScene reducedMotion={reducedMotion} />
    </Canvas>
  );
}
