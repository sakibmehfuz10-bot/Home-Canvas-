import React, { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, useTexture, Html, Float, DragControls, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface Product3DPreviewProps {
  imageUrl: string;
}

const Loader = () => {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-800">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-zinc-200 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
        <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 font-semibold tracking-wide uppercase">Loading 3D...</div>
      </div>
    </Html>
  );
};

const ProductMesh: React.FC<{ imageUrl: string; setIsDragging: (dragging: boolean) => void; isDragging: boolean }> = ({ imageUrl, setIsDragging, isDragging }) => {
  const texture = useTexture(imageUrl);
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current && !isDragging) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });
  
  // Calculate aspect ratio to scale the plane correctly
  const aspect = texture.image ? (texture.image as HTMLImageElement).width / (texture.image as HTMLImageElement).height : 1;
  const width = aspect > 1 ? 3 : 3 * aspect;
  const height = aspect > 1 ? 3 / aspect : 3;

  // Create a double-sided material
  const material = useMemo(() => new THREE.MeshStandardMaterial({ 
    map: texture, 
    transparent: true,
    side: THREE.DoubleSide,
    roughness: 0.4,
    metalness: 0.1
  }), [texture]);

  return (
    <DragControls onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)}>
      <Float speed={isDragging ? 0 : 2} rotationIntensity={isDragging ? 0 : 0.5} floatIntensity={isDragging ? 0 : 1}>
        <group ref={groupRef} position={[0, height / 2, 0]}>
          {/* Front face */}
          <mesh material={material} castShadow receiveShadow>
            <planeGeometry args={[width, height]} />
          </mesh>
          
          {/* Add a subtle thickness by adding a back face slightly offset, or just use a very thin box */}
          <mesh position={[0, 0, -0.01]} castShadow receiveShadow>
            <boxGeometry args={[width, height, 0.02]} />
            <meshStandardMaterial color="#f4f4f5" roughness={0.8} />
          </mesh>
        </group>
      </Float>
    </DragControls>
  );
};

const Product3DPreview: React.FC<Product3DPreviewProps> = ({ imageUrl }) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="w-full h-full min-h-[300px] bg-zinc-50 dark:bg-zinc-900 rounded-lg overflow-hidden relative border border-zinc-200 dark:border-zinc-800 cursor-grab active:cursor-grabbing">
      <div className="absolute top-2 left-2 z-10 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-zinc-600 dark:text-zinc-300 shadow-sm pointer-events-none">
        Drag to position • Scroll to zoom
      </div>
      <Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Suspense fallback={<Loader />}>
          <ProductMesh imageUrl={imageUrl} setIsDragging={setIsDragging} isDragging={isDragging} />
          <Environment preset="city" />
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        </Suspense>

        <OrbitControls 
          makeDefault
          enabled={!isDragging}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2 + 0.1}
          minDistance={2}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
};

export default Product3DPreview;
