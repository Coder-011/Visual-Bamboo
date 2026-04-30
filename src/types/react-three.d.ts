import 'react-three-fiber';
import * as THREE from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Three.js elements
      mesh: any;
      group: any;
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      cylinderGeometry: any;
      torusGeometry: any;
      meshStandardMaterial: any;
      sphereGeometry: any;
      boxGeometry: any;
      bufferGeometry: any;
      primitive: any;
    }
  }
}

export {};