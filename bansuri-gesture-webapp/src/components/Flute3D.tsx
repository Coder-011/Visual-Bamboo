import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { HoleState } from '../store/useBansuriStore';

interface Flute3DProps {
  holeStates: HoleState[];
}

const Flute3D: React.FC<Flute3DProps> = ({ holeStates }) => {
  const fluteRef = useRef<THREE.Group>(null);
  const holeRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Hole positions along the flute (6 holes)
  const holePositions = [
    { x: -1.2, y: 0.05 },
    { x: -0.8, y: 0.05 },
    { x: -0.4, y: 0.05 },
    { x: 0.0, y: 0.05 },
    { x: 0.4, y: 0.05 },
    { x: 0.8, y: 0.05 },
  ];

  useFrame((state) => {
    if (fluteRef.current) {
      // Gentle idle animation
      fluteRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      fluteRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.01;
    }

    // Update hole colors based on state
    holeRefs.current.forEach((hole, index) => {
      if (hole && hole.material) {
        const material = hole.material as THREE.MeshStandardMaterial;
        const state = holeStates[index];
        
        if (state === 'CLOSED') {
          material.emissive.setHex(0x8B4513);
          material.emissiveIntensity = 0.8;
        } else if (state === 'HALF_OPEN') {
          material.emissive.setHex(0xDAA520);
          material.emissiveIntensity = 0.5;
        } else {
          material.emissive.setHex(0x000000);
          material.emissiveIntensity = 0;
        }
      }
    });
  });

  return (
    <group ref={fluteRef}>
      {/* Bamboo flute body */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.06, 3, 32]} />
        <meshStandardMaterial
          color="#C19A6B"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Flute tip (blow end) */}
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
      {holePositions.map((pos, index) => (
        <mesh
          key={index}
          ref={(el) => { holeRefs.current[index] = el; }}
          position={[pos.x, pos.y, 0]}
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

      {/* Ambient light reflection */}
      <pointLight position={[0, 1, 2]} intensity={0.5} color="#FFD700" />
    </group>
  );
};

export default Flute3D;