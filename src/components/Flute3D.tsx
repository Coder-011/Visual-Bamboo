import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { HoleState } from '../store/useBansuriStore';

interface Flute3DProps {
  holeStates: HoleState[];
}

// 6 hole positions along the flute body
const HOLE_X = [-1.2, -0.8, -0.4, 0.0, 0.4, 0.8];

// Finger colors: brown when closed, gold when half, transparent when open
function holeColor(state: HoleState): THREE.Color {
  if (state === 'CLOSED') return new THREE.Color(0x8B4513);
  if (state === 'HALF_OPEN') return new THREE.Color(0xDAA520);
  return new THREE.Color(0x000000);
}

function holeEmissive(state: HoleState): number {
  if (state === 'CLOSED') return 0.8;
  if (state === 'HALF_OPEN') return 0.5;
  return 0;
}

// Virtual finger: a small rounded cylinder above each hole
const VirtualFinger: React.FC<{ x: number; state: HoleState }> = ({ x, state }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const targetY = state === 'CLOSED' ? 0.08 : state === 'HALF_OPEN' ? 0.13 : 0.22;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.15;
    mat.color.set(holeColor(state));
    mat.emissive.set(state !== 'OPEN' ? holeColor(state) : new THREE.Color(0));
    mat.emissiveIntensity = holeEmissive(state);
    mat.opacity = state === 'OPEN' ? 0.15 : 0.9;
  });

  return (
    <mesh ref={meshRef} position={[x, 0.22, 0]}>
      <capsuleGeometry args={[0.04, 0.12, 4, 8]} />
      <meshStandardMaterial
        color={holeColor(state)}
        transparent
        opacity={state === 'OPEN' ? 0.15 : 0.9}
        roughness={0.6}
      />
    </mesh>
  );
};

const Flute3D: React.FC<Flute3DProps> = ({ holeStates }) => {
  const fluteRef = useRef<THREE.Group>(null);
  const holeRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    if (fluteRef.current) {
      fluteRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      fluteRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.01;
    }

    holeRefs.current.forEach((hole, index) => {
      if (hole && hole.material) {
        const mat = hole.material as THREE.MeshStandardMaterial;
        const hs = holeStates[index];
        mat.emissive.set(hs !== 'OPEN' ? holeColor(hs) : new THREE.Color(0));
        mat.emissiveIntensity = holeEmissive(hs);
      }
    });
  });

  return (
    <group ref={fluteRef}>
      {/* Bamboo flute body */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.06, 3, 32]} />
        <meshStandardMaterial color="#C19A6B" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Blow end cap */}
      <mesh position={[-1.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.08, 0.3, 16]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>

      {/* Traditional bindings */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((x, i) => (
        <mesh key={i} position={[x, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.085, 0.01, 8, 16]} />
          <meshStandardMaterial color="#5C4033" roughness={0.7} />
        </mesh>
      ))}

      {/* Finger holes */}
      {HOLE_X.map((x, index) => (
        <mesh
          key={index}
          ref={(el) => { holeRefs.current[index] = el; }}
          position={[x, 0.05, 0]}
        >
          <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
          <meshStandardMaterial
            color="#2C1810"
            emissive="#000000"
            emissiveIntensity={0}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* Virtual fingers above each hole */}
      {HOLE_X.map((x, index) => (
        <VirtualFinger key={index} x={x} state={holeStates[index]} />
      ))}

      <pointLight position={[0, 1, 2]} intensity={0.5} color="#FFD700" />
    </group>
  );
};

export default Flute3D;
