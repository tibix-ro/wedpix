import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

function Particles({ scrollY }) {
  const meshRef = useRef();

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    meshRef.current.rotation.x += delta * 0.1;
    meshRef.current.rotation.y += delta * 0.15;

    const drift = Math.min(scrollY * 0.018, 14);
    meshRef.current.position.y = drift;
    meshRef.current.position.x = Math.sin(scrollY * 0.0015) * 0.8;
    meshRef.current.scale.setScalar(1 + Math.min(scrollY * 0.00012, 0.14));
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#C9A96E" />
    </mesh>
  );
}

export default function HeroParticles3D({ scrollY }) {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Particles scrollY={scrollY} />
    </Canvas>
  );
}
