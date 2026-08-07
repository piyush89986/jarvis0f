import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Stars, Float, Ring } from '@react-three/drei';
import * as THREE from 'three';

// ─────────────────────────────────────────────
// Core Orb Mesh — morphs with state
// ─────────────────────────────────────────────
const OrbMesh = ({ state, audioLevel }) => {
  const meshRef = useRef();
  const ringRef = useRef();
  const ring2Ref = useRef();
  const timeRef = useRef(0);

  // State-based config
  const config = useMemo(() => {
    switch (state) {
      case 'listening':
        return { color: '#00ff88', emissive: '#00cc66', distort: 0.6 + audioLevel * 0.8, speed: 4, scale: 1.1 + audioLevel * 0.3 };
      case 'thinking':
        return { color: '#a855f7', emissive: '#7c3aed', distort: 0.4, speed: 8, scale: 1.05 };
      case 'speaking':
        return { color: '#3b82f6', emissive: '#1d4ed8', distort: 0.3 + audioLevel * 0.7, speed: 5, scale: 1.0 + audioLevel * 0.2 };
      case 'error':
        return { color: '#ef4444', emissive: '#b91c1c', distort: 0.8, speed: 10, scale: 1.0 };
      case 'idle':
      default:
        return { color: '#6366f1', emissive: '#4338ca', distort: 0.2, speed: 1.5, scale: 1.0 };
    }
  }, [state, audioLevel]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;

    // Smooth scale transition
    const targetScale = config.scale;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.08
    );

    // Slow rotation
    meshRef.current.rotation.y += delta * (state === 'thinking' ? 1.5 : 0.3);
    meshRef.current.rotation.x = Math.sin(timeRef.current * 0.5) * 0.1;

    // Ring animations
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.8;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(timeRef.current) * 0.2;
      const ringOpacity = state === 'listening' ? 0.7 : state === 'thinking' ? 0.5 : 0.25;
      ringRef.current.material.opacity += (ringOpacity - ringRef.current.material.opacity) * 0.05;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.5;
      ring2Ref.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group>
      {/* Main distort orb */}
      <Sphere ref={meshRef} args={[1, 128, 128]}>
        <MeshDistortMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={state === 'idle' ? 0.3 : 0.8}
          distort={config.distort}
          speed={config.speed}
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.92}
        />
      </Sphere>

      {/* Inner glow sphere */}
      <Sphere args={[0.75, 64, 64]}>
        <meshBasicMaterial
          color={config.emissive}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Orbital ring 1 */}
      <Ring ref={ringRef} args={[1.35, 1.45, 64]}>
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </Ring>

      {/* Orbital ring 2 */}
      <Ring ref={ring2Ref} args={[1.6, 1.65, 64]}>
        <meshBasicMaterial
          color={config.emissive}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </Ring>
    </group>
  );
};

// ─────────────────────────────────────────────
// Floating particles around the orb
// ─────────────────────────────────────────────
const Particles = ({ state }) => {
  const pointsRef = useRef();
  const count = 200;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.random() * 2.5;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * (state === 'thinking' ? 0.5 : 0.1);
    pointsRef.current.rotation.x += delta * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color={state === 'listening' ? '#00ff88' : state === 'thinking' ? '#a855f7' : '#818cf8'}
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
};

// ─────────────────────────────────────────────
// Ambient lighting that changes with state
// ─────────────────────────────────────────────
const DynamicLighting = ({ state }) => {
  const lightRef = useRef();
  const timeRef = useRef(0);

  const lightColor = useMemo(() => {
    switch (state) {
      case 'listening': return '#00ff88';
      case 'thinking': return '#a855f7';
      case 'speaking': return '#3b82f6';
      case 'error': return '#ef4444';
      default: return '#6366f1';
    }
  }, [state]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(timeRef.current * 2) * 0.5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight ref={lightRef} color={lightColor} intensity={2.5} position={[2, 2, 2]} />
      <pointLight color="#ffffff" intensity={0.5} position={[-2, -1, -2]} />
    </>
  );
};

// ─────────────────────────────────────────────
// Main exported component
// ─────────────────────────────────────────────
const ThreeOrb = ({ state = 'idle', audioLevel = 0 }) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <DynamicLighting state={state} />
        <Stars radius={80} depth={50} count={1500} factor={3} saturation={0} fade speed={0.5} />
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
          <OrbMesh state={state} audioLevel={audioLevel} />
        </Float>
        <Particles state={state} />
      </Canvas>

      {/* State label overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '10px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontFamily: 'monospace',
          pointerEvents: 'none',
        }}
      >
        {state === 'idle' && '● STANDBY'}
        {state === 'listening' && '◉ LISTENING'}
        {state === 'thinking' && '◌ PROCESSING'}
        {state === 'speaking' && '▶ SPEAKING'}
        {state === 'error' && '✕ ERROR'}
      </div>
    </div>
  );
};

export default ThreeOrb;
