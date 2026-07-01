import { useCallback, useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  type: 'confetti' | 'sparkle' | 'star' | 'coin';
}

export const useGameEffects = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isAnimatingRef = useRef(false);

  const colors = {
    confetti: ['#FFD700', '#FFA500', '#FF69B4', '#00CED1', '#98FB98', '#FF6347', '#9370DB'],
    sparkle: ['#FFFFFF', '#FFFACD', '#F0E68C', '#FFD700'],
    star: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347'],
    coin: ['#FFD700', '#FFA500', '#FF8C00']
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const createParticle = useCallback((type: Particle['type'] = 'confetti', x?: number, y?: number): Particle => {
    const particleColors = colors[type];
    return {
      x: x ?? Math.random() * (canvasRef.current?.width || 800),
      y: y ?? Math.random() * (canvasRef.current?.height || 600),
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 2,
      size: Math.random() * 6 + 2,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      life: 1,
      decay: Math.random() * 0.02 + 0.005,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      type
    };
  }, []);

  const updateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const particle = particlesRef.current[i];
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.3;
      particle.life -= particle.decay;
      particle.rotation += particle.rotationSpeed;
      
      if (particle.life <= 0) {
        particlesRef.current.splice(i, 1);
        continue;
      }
      
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = particle.color;
      
      switch (particle.type) {
        case 'confetti':
          ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
          break;
        case 'sparkle':
          ctx.beginPath();
          ctx.moveTo(0, -particle.size);
          ctx.lineTo(particle.size/3, 0);
          ctx.lineTo(0, particle.size);
          ctx.lineTo(-particle.size/3, 0);
          ctx.closePath();
          ctx.fill();
          break;
        case 'star':
          drawStar(ctx, 0, 0, 5, particle.size, particle.size/2);
          break;
        case 'coin':
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#B8860B';
          ctx.lineWidth = 2;
          ctx.stroke();
          break;
      }
      
      ctx.restore();
    }
    
    if (isAnimatingRef.current) {
      animationRef.current = requestAnimationFrame(updateParticles);
    }
  }, []);

  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  };

  const triggerEffect = useCallback((type: 'confetti' | 'sparkle' | 'star' | 'coin', count: number = 50, x?: number, y?: number) => {
    const centerX = x ?? (canvasRef.current?.width || 800) / 2;
    const centerY = y ?? (canvasRef.current?.height || 600) / 2;
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const particle = createParticle(
          type,
          centerX + (Math.random() - 0.5) * 200,
          centerY + (Math.random() - 0.5) * 200
        );
        particlesRef.current.push(particle);
      }, i * 20);
    }
    
    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
      updateParticles();
    }
    
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 3000);
  }, [createParticle, updateParticles]);

  const clearEffects = useCallback(() => {
    particlesRef.current = [];
    isAnimatingRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  return {
    canvasRef,
    triggerEffect,
    clearEffects,
    isAnimating: () => isAnimatingRef.current
  };
};
