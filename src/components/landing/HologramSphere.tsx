'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Sphere, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 3D Grid Tunnel Component
function GridTunnel({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
    const groupRef = useRef<THREE.Group>(null!);
    const gridRefs = useRef<THREE.GridHelper[]>([]);

    useFrame((state) => {
        const [mx, my] = mouse.current;
        if (groupRef.current) {
            groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, -mx * 0.5, 0.05);
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, my * 0.5, 0.05);
        }

        // Constant movement forward scroll
        const time = state.clock.getElapsedTime();
        gridRefs.current.forEach((grid) => {
            if (grid) {
                grid.position.z = ((time * 3) % 40) - 20;
            }
        });
    });

    return (
        <group ref={groupRef}>
            {/* Floor Grids for seamless looping */}
            {[0, 1].map((i) => (
                <React.Fragment key={i}>
                    <gridHelper
                        args={[100, 50, "#F59E0B", "#EF4444"]}
                        position={[0, -4, i * 40]}
                        ref={(el) => { if (el) gridRefs.current[i] = el; }}
                    >
                        <meshBasicMaterial attach="material" transparent opacity={0.1} />
                    </gridHelper>
                    {/* Ceiling Grids */}
                    <gridHelper
                        args={[100, 50, "#F59E0B", "#EF4444"]}
                        position={[0, 4, i * 40]}
                        ref={(el) => { if (el) gridRefs.current[i + 2] = el; }}
                    >
                        <meshBasicMaterial attach="material" transparent opacity={0.1} />
                    </gridHelper>
                </React.Fragment>
            ))}

            {/* Side Glowing Lines */}
            <mesh position={[-15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <planeGeometry args={[200, 0.02]} />
                <meshBasicMaterial color="#F59E0B" transparent opacity={0.3} />
            </mesh>
            <mesh position={[15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <planeGeometry args={[200, 0.02]} />
                <meshBasicMaterial color="#F59E0B" transparent opacity={0.3} />
            </mesh>
        </group>
    );
}

// Neural Network Nodes (Neurons) - Now with Unique Nexus Identity
function NeuralNodes({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
    const pointsRef = useRef<THREE.Points>(null!);
    const neuronsCount = 800; // Increased density for more detail
    const [shapeIndex, setShapeIndex] = React.useState(0);

    // 1. Pre-calculate Unique Nexus Shapes
    const shapes = useMemo(() => {
        const vortexPos = new Float32Array(neuronsCount * 3);
        const helixPos = new Float32Array(neuronsCount * 3);
        const matrixPos = new Float32Array(neuronsCount * 3);

        for (let i = 0; i < neuronsCount; i++) {
            // --- Shape 0: Neural Vortex (Swirling Eye) ---
            const angle = i * 0.2;
            const radius = (i / neuronsCount) * 2.5;
            const spiralY = (Math.random() - 0.5) * 1.5;
            vortexPos[i * 3] = radius * Math.cos(angle);
            vortexPos[i * 3 + 1] = spiralY;
            vortexPos[i * 3 + 2] = radius * Math.sin(angle);

            // --- Shape 1: Data Helix (Digital DNA) ---
            const helixY = (i / neuronsCount - 0.5) * 6;
            const helixAngle = i * 0.1;
            const helixRadius = 1.2;
            const side = i % 2 === 0 ? 1 : -1;
            helixPos[i * 3] = side * helixRadius * Math.cos(helixAngle);
            helixPos[i * 3 + 1] = helixY;
            helixPos[i * 3 + 2] = side * helixRadius * Math.sin(helixAngle);

            // --- Shape 2: Crystalline Matrix (Abstract Star) ---
            const phi = Math.acos(-1 + (2 * i) / neuronsCount);
            const theta = Math.sqrt(neuronsCount * Math.PI) * phi;
            const crystalRadius = 2.5 + (i % 5 === 0 ? 1 : 0); // Spiky effect
            matrixPos[i * 3] = crystalRadius * Math.cos(theta) * Math.sin(phi);
            matrixPos[i * 3 + 1] = crystalRadius * Math.sin(theta) * Math.sin(phi);
            matrixPos[i * 3 + 2] = crystalRadius * Math.cos(phi);
        }
        return [vortexPos, helixPos, matrixPos];
    }, []);

    const currentPositions = useMemo(() => new Float32Array(neuronsCount * 3), []);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setShapeIndex((prev) => (prev + 1) % shapes.length);
        }, 4000); // Slower cycles for more organic feel
        return () => clearInterval(interval);
    }, [shapes]);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        const [mx, my] = mouse.current;
        const targetSet = shapes[shapeIndex];

        // Pulsing Effect
        const pulse = 1 + Math.sin(time * 2) * 0.05;

        for (let i = 0; i < neuronsCount * 3; i++) {
            currentPositions[i] = THREE.MathUtils.lerp(currentPositions[i], targetSet[i] * pulse, 0.04);
        }

        if (pointsRef.current) {
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
            pointsRef.current.rotation.y += 0.005; // Base rotation
            pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, pointsRef.current.rotation.y + mx * 0.5, 0.05);
            pointsRef.current.rotation.z = THREE.MathUtils.lerp(pointsRef.current.rotation.z, my * 0.5, 0.05);
        }
    });

    return (
        <Points ref={pointsRef} positions={currentPositions} stride={3}>
            <PointMaterial
                transparent
                vertexColors={false}
                color="#F59E0B"
                size={0.06}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </Points>
    );
}

// Background data field
function DataField() {
    const pointsRef = useRef<THREE.Points>(null!);
    const count = 3000;

    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        return pos;
    }, []);

    useFrame((state) => {
        pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.015;
    });

    return (
        <Points ref={pointsRef} positions={positions} stride={3}>
            <PointMaterial
                transparent
                color="#F59E0B"
                size={0.015}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={0.3}
            />
        </Points>
    );
}

// Connections
function NeuralConnections({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
    const linesRef = useRef<THREE.LineSegments>(null!);
    const neuronsCount = 100;

    const positions = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i < neuronsCount; i++) {
            const theta = THREE.MathUtils.randFloatSpread(360);
            const phi = THREE.MathUtils.randFloatSpread(360);
            const distance = 2.2 + Math.random() * 0.4;
            pts.push(new THREE.Vector3(
                distance * Math.sin(theta) * Math.cos(phi),
                distance * Math.sin(theta) * Math.sin(phi),
                distance * Math.cos(theta)
            ));
        }

        const segments: number[] = [];
        for (let i = 0; i < neuronsCount; i++) {
            for (let j = i + 1; j < neuronsCount; j++) {
                if (pts[i].distanceTo(pts[j]) < 1.0) {
                    segments.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
                }
            }
        }
        return new Float32Array(segments);
    }, []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        const [mx, my] = mouse.current;
        if (linesRef.current) {
            linesRef.current.rotation.y = THREE.MathUtils.lerp(linesRef.current.rotation.y, time * 0.08 + mx * 0.15, 0.05);
            linesRef.current.rotation.x = THREE.MathUtils.lerp(linesRef.current.rotation.x, time * 0.03 + my * 0.15, 0.05);
        }
    });

    return (
        <lineSegments ref={linesRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <lineBasicMaterial
                color="#F59E0B"
                transparent
                opacity={0.15}
                blending={THREE.AdditiveBlending}
            />
        </lineSegments>
    );
}

// Morphing Brain Core
function Core() {
    const meshRef = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        meshRef.current.rotation.z = time * 0.3;
    });

    return (
        <Sphere ref={meshRef} args={[0.5, 64, 64]}>
            <MeshDistortMaterial
                color="#F59E0B"
                speed={4}
                distort={0.6}
                radius={1}
                transparent
                opacity={0.4}
                blending={THREE.AdditiveBlending}
            />
        </Sphere>
    );
}

export default function HologramSphere() {
    const mouse = useRef<[number, number]>([0, 0]);

    return (
        <div
            className="w-full h-full relative"
            onPointerMove={(e) => {
                const x = (e.clientX / window.innerWidth) * 2 - 1;
                const y = -(e.clientY / window.innerHeight) * 2 + 1;
                mouse.current = [x, y];
            }}
        >
            <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 2]}>
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#F59E0B" />

                <DataField />
                <GridTunnel mouse={mouse} />

                <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
                    <Core />
                    <NeuralNodes mouse={mouse} />
                    <NeuralConnections mouse={mouse} />
                </Float>
            </Canvas>

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-50 blur-[120px]" />
            </div>
        </div>
    );
}
