import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, Environment } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { Heart, Sparkles } from 'lucide-react';
import { albumCubeConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

interface CubeProps {
  rotationProgress: number;
}

const Cube = ({ rotationProgress }: CubeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const textures = useTexture(albumCubeConfig.cubeTextures);

  // Responsive cube size
  const cubeSize = Math.min(viewport.width * 0.35, 2.5);

  useFrame(() => {
    if (meshRef.current) {
      // Map rotation progress (0-1) to rotation angles
      const targetRotationY = rotationProgress * Math.PI * 2;
      const targetRotationX = Math.sin(rotationProgress * Math.PI) * 0.3;

      // Smooth interpolation
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotationY,
        0.1
      );
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        targetRotationX,
        0.1
      );
    }
  });

  return (
    <mesh ref={meshRef} castShadow>
      <boxGeometry args={[cubeSize, cubeSize, cubeSize]} />
      {textures.map((texture, index) => (
        <meshStandardMaterial
          key={index}
          attach={`material-${index}`}
          map={texture}
          roughness={0.2}
          metalness={0.1}
        />
      ))}
    </mesh>
  );
};

const AlbumCube = () => {
  // Null check: if config is empty, do not render
  if (albumCubeConfig.albums.length === 0 || albumCubeConfig.cubeTextures.length === 0) {
    return null;
  }

  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [rotationProgress, setRotationProgress] = useState(0);
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
  const [blurAmount, setBlurAmount] = useState(0);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: '+=300%',
      scrub: 1,
      pin: true,
      onUpdate: (self) => {
        const progress = self.progress;
        setRotationProgress(progress);

        // Calculate current album index
        const albumIndex = Math.min(
          Math.floor(progress * 4),
          albumCubeConfig.albums.length - 1
        );
        setCurrentAlbumIndex(albumIndex);

        // Velocity-based blur effect
        const velocity = Math.abs(self.getVelocity());
        const targetBlur = Math.min(velocity / 500, 8);
        const targetSpacing = Math.min(velocity / 100, 30);

        setBlurAmount(prev => prev + (targetBlur - prev) * 0.2);
        setLetterSpacing(prev => prev + (targetSpacing - prev) * 0.2);
      },
    });

    scrollTriggerRef.current = st;

    return () => {
      st.kill();
    };
  }, []);

  const currentAlbum = albumCubeConfig.albums[currentAlbumIndex];

  return (
    <section
      id="message"
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-pink-100 via-white to-pink-50"
    >
      {/* Floating hearts background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Heart className="absolute top-20 left-[10%] w-10 h-10 text-pink-300/40 fill-pink-300/40 animate-heart-float" />
        <Heart className="absolute top-40 right-[15%] w-8 h-8 text-pink-400/30 fill-pink-400/30 animate-heart-float" style={{ animationDelay: '0.5s' }} />
        <Heart className="absolute bottom-40 left-[20%] w-12 h-12 text-pink-300/40 fill-pink-300/40 animate-heart-float" style={{ animationDelay: '1s' }} />
        <Sparkles className="absolute top-1/3 right-[8%] w-8 h-8 text-pink-400/30 animate-sparkle" />
        <Heart className="absolute bottom-1/4 right-[25%] w-6 h-6 text-pink-400/30 fill-pink-400/30 animate-heart-float" style={{ animationDelay: '0.8s' }} />
      </div>

      {/* Background title with blur effect */}
      <div
        ref={titleRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        style={{
          filter: `blur(${blurAmount}px)`,
          letterSpacing: `${letterSpacing}px`,
        }}
      >
        <h2 className="font-display text-[18vw] text-pink-200/30 uppercase whitespace-nowrap select-none">
          {currentAlbum.subtitle}
        </h2>
      </div>

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-10">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <spotLight
              position={[10, 10, 10]}
              angle={0.15}
              penumbra={1}
              intensity={1}
              castShadow
              color="#FFB6C1"
            />
            <spotLight
              position={[-10, -10, -10]}
              angle={0.15}
              penumbra={1}
              intensity={0.5}
              color="#FF69B4"
            />
            <pointLight position={[0, 0, 5]} intensity={0.5} color="#FF6B9D" />
            <Cube rotationProgress={rotationProgress} />
            <Environment preset="city" />
          </Suspense>
        </Canvas>
      </div>

      {/* Album info overlay */}
      <div className="absolute bottom-12 left-12 z-20">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
          <p className="font-cute text-xs text-pink-500/70 uppercase tracking-wider">
            Thông Điệp {String(currentAlbum.id).padStart(2, '0')} / {String(albumCubeConfig.albums.length).padStart(2, '0')}
          </p>
        </div>
        <h3 className="font-display text-4xl md:text-6xl text-pink-500 mb-2 transition-all duration-300 gradient-text">
          {currentAlbum.title}
        </h3>
        <p className="font-cute text-sm text-pink-400/70 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {currentAlbum.subtitle}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 z-20">
        <div className="flex flex-col gap-3">
          {albumCubeConfig.albums.map((album, index) => (
            <div
              key={album.id}
              className={`w-2 rounded-full transition-all duration-300 ${
                index === currentAlbumIndex
                  ? 'bg-gradient-to-b from-pink-400 to-pink-500 w-2 h-8'
                  : 'bg-pink-200/50 h-2'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-12 right-12 z-20 flex items-center gap-2">
        <Heart className="w-4 h-4 text-pink-400 animate-pulse-heart" />
        <p className="font-cute text-xs text-pink-500/60 uppercase tracking-wider">
          {albumCubeConfig.scrollHint}
        </p>
      </div>

      {/* Decorative corner lines */}
      <div className="absolute top-12 left-12 w-20 h-1 bg-gradient-to-r from-pink-400/50 to-transparent rounded-full" />
      <div className="absolute top-12 left-12 w-1 h-20 bg-gradient-to-b from-pink-400/50 to-transparent rounded-full" />
      
      {/* Decorative corner hearts */}
      <div className="absolute top-12 right-12 flex gap-1">
        <Heart className="w-4 h-4 text-pink-300 fill-pink-300" />
        <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
      </div>
    </section>
  );
};

export default AlbumCube;
