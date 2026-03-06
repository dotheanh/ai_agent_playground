import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  life: number;
  maxLife: number;
}

const HeartParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);
  const isMovingRef = useRef(false);

  const colors = [
    '#FF6B9D', // pink primary
    '#FF85A2', // pink medium
    '#FFB6C1', // pink light
    '#FF69B4', // hot pink
    '#FFC0CB', // pink
    '#FF1493', // deep pink
    '#FFA6C9', // carnation pink
    '#F8C8DC', // pastel pink
  ];

  const createParticle = useCallback((x: number, y: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    return {
      x,
      y,
      size: Math.random() * 12 + 6,
      speedX: Math.cos(angle) * speed * 0.5,
      speedY: Math.sin(angle) * speed * 0.5 - 1,
      opacity: 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      maxLife: Math.random() * 60 + 40,
    };
  }, []);

  const drawHeart = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    rotation: number,
    color: string,
    opacity: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    
    // Draw heart shape
    const s = size;
    ctx.moveTo(0, -s * 0.3);
    ctx.bezierCurveTo(-s * 0.5, -s * 0.8, -s, -s * 0.3, -s, 0.1);
    ctx.bezierCurveTo(-s, s * 0.5, 0, s * 0.9, 0, s);
    ctx.bezierCurveTo(0, s * 0.9, s, s * 0.5, s, 0.1);
    ctx.bezierCurveTo(s, -s * 0.3, s * 0.5, -s * 0.8, 0, -s * 0.3);
    
    ctx.closePath();
    ctx.fill();
    
    // Add sparkle effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(-s * 0.3, -s * 0.2, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      isMovingRef.current = true;
      
      // Create particles based on mouse movement
      const dx = mouseRef.current.x - lastMouseRef.current.x;
      const dy = mouseRef.current.y - lastMouseRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 15) {
        const particleCount = Math.min(Math.floor(distance / 10), 4);
        for (let i = 0; i < particleCount; i++) {
          const offsetX = (Math.random() - 0.5) * 20;
          const offsetY = (Math.random() - 0.5) * 20;
          particlesRef.current.push(
            createParticle(mouseRef.current.x + offsetX, mouseRef.current.y + offsetY)
          );
        }
        lastMouseRef.current = { ...mouseRef.current };
      }
    };

    const handleMouseStop = () => {
      isMovingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseStop);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.life++;
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;
        particle.speedY += 0.05; // gravity
        
        // Fade out
        const lifeRatio = particle.life / particle.maxLife;
        particle.opacity = 1 - lifeRatio;

        if (particle.life >= particle.maxLife) {
          return false;
        }

        drawHeart(
          ctx,
          particle.x,
          particle.y,
          particle.size * (1 - lifeRatio * 0.3),
          particle.rotation,
          particle.color,
          particle.opacity
        );

        return true;
      });

      // Occasionally add floating hearts even without mouse movement
      if (Math.random() < 0.02 && particlesRef.current.length < 50) {
        particlesRef.current.push(
          createParticle(
            Math.random() * canvas.width,
            canvas.height + 20
          )
        );
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseStop);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [createParticle, drawHeart]);

  return (
    <canvas
      ref={canvasRef}
      className="heart-particle-canvas"
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }}
    />
  );
};

export default HeartParticles;
