import { useEffect, useRef, useCallback } from 'react';

interface WinAnimationConfig {
  duration: number;
  intensity: number;
  particleCount: number;
  cameraEffect: 'zoom' | 'shake' | 'both';
  soundEnabled: boolean;
  maxFPS: number;
  performanceMode: 'high' | 'medium' | 'low';
}

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
}

export const useWinAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isAnimatingRef = useRef(false);

  const config: WinAnimationConfig = {
    duration: 3000,
    intensity: 1,
    particleCount: 30, // Reduced from 50 for better performance
    cameraEffect: 'zoom',
    soundEnabled: true,
    maxFPS: 60, // Frame limiting for smooth performance
    performanceMode: 'high' // Default to high performance
  };

  // Initialize canvas
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

  // Sound generation using Web Audio API
  const createSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!config.soundEnabled || typeof AudioContext === 'undefined') return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency * config.intensity;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.3 * config.intensity, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }, [config.intensity, config.soundEnabled]);

  const createParticle = useCallback((x?: number, y?: number): Particle => {
    const colors = ['#FFD700', '#FFA500', '#FF69B4', '#00CED1', '#98FB98', '#FF6347', '#9370DB'];
    return {
      x: x ?? Math.random() * (canvasRef.current?.width || 800),
      y: y ?? Math.random() * (canvasRef.current?.height || 600),
      vx: (Math.random() - 0.5) * 8 * config.intensity,
      vy: (Math.random() - 0.5) * 8 * config.intensity - 2,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      decay: Math.random() * 0.015 + 0.005,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    };
  }, [config.intensity]);

  let lastFrameTime = 0;
  const targetFrameTime = 1000 / config.maxFPS;

  const updateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime;
    
    // Frame limiting for consistent performance
    if (deltaTime < targetFrameTime) {
      if (isAnimatingRef.current) {
        animationRef.current = requestAnimationFrame(updateParticles);
      }
      return;
    }
    
    lastFrameTime = currentTime;
    
    // Clear canvas with performance optimization
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Batch particle updates for better performance
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      // Update particle physics
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2; // gravity
      particle.life -= particle.decay;
      particle.rotation += particle.rotationSpeed;
      
      // Remove dead particles
      if (particle.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      
      // Optimized drawing
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      
      // Simple rectangle drawing (no shadow for performance)
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
      
      ctx.restore();
    }
    
    if (isAnimatingRef.current) {
      animationRef.current = requestAnimationFrame(updateParticles);
    }
  }, [config.maxFPS]);

  const createConfetti = useCallback(() => {
    const centerX = (canvasRef.current?.width || 800) / 2;
    const centerY = (canvasRef.current?.height || 600) / 2;
    
    // Performance: Create particles in batches
    const batchSize = Math.min(config.particleCount, 10); // Max 10 particles per batch
    const batches = Math.ceil(config.particleCount / batchSize);
    
    for (let batch = 0; batch < batches; batch++) {
      setTimeout(() => {
        for (let i = 0; i < batchSize && (batch * batchSize + i) < config.particleCount; i++) {
          const particle = createParticle(
            centerX + (Math.random() - 0.5) * 100,
            centerY + (Math.random() - 0.5) * 100
          );
          particlesRef.current.push(particle);
        }
        
        // Reduced sound frequency for performance
        if (Math.random() > 0.8) { // Changed from 0.7 to 0.8
          createSound(1200, 0.05, 'triangle');
        }
      }, batch * 100); // Slower spawn rate for better performance
    }
  }, [config.particleCount, createParticle, createSound]);

  const createStars = useCallback(() => {
    const starSymbols = ['⭐', '✨', '🌟', '💫'];
    
    // Performance: Reduced star count and optimized creation
    const starCount = config.performanceMode === 'low' ? 3 : config.performanceMode === 'medium' ? 5 : 8;
    
    for (let i = 0; i < starCount; i++) {
      setTimeout(() => {
        const star = document.createElement('div');
        star.textContent = starSymbols[Math.floor(Math.random() * starSymbols.length)];
        star.style.cssText = `
          position: fixed;
          left: ${20 + Math.random() * 60}%;
          top: ${20 + Math.random() * 60}%;
          font-size: ${config.performanceMode === 'low' ? '1.5rem' : '2rem'};
          color: #FFD700;
          opacity: 0;
          animation: starBurst 1s ease-out forwards;
          z-index: 1000;
          pointer-events: none;
          will-change: transform, opacity;
        `;
        document.body.appendChild(star);
        
        setTimeout(() => star.remove(), 1000);
      }, i * 150); // Slower spawn for performance
    }
  }, [config.performanceMode]);

  const applyCameraEffect = useCallback(() => {
    const gameContainer = document.querySelector('.game-card, #gameContainer') || document.body;
    
    if (config.cameraEffect === 'zoom' || config.cameraEffect === 'both') {
      gameContainer.classList.add('camera-zoom');
      setTimeout(() => gameContainer.classList.remove('camera-zoom'), 500);
    }
    
    if (config.cameraEffect === 'shake' || config.cameraEffect === 'both') {
      setTimeout(() => {
        gameContainer.classList.add('camera-shake');
        setTimeout(() => gameContainer.classList.remove('camera-shake'), 300);
      }, 300);
    }
  }, [config.cameraEffect]);

  const showVictoryText = useCallback((profit: number = 0) => {
    const victoryText = document.createElement('div');
    let displayText = 'VICTORY!';
    
    if (profit >= 100) {
      displayText = 'MEGA WIN!';
    } else if (profit >= 50) {
      displayText = 'BIG WIN!';
    } else if (profit >= 20) {
      displayText = 'NICE WIN!';
    }
    
    victoryText.textContent = displayText;
    victoryText.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: ${profit >= 100 ? '5rem' : profit >= 50 ? '4.5rem' : '4rem'};
      font-weight: bold;
      color: #FFD700;
      text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
      z-index: 1000;
      pointer-events: none;
      animation: victoryReveal 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
    `;
    document.body.appendChild(victoryText);
    
    setTimeout(() => victoryText.remove(), config.duration);
  }, [config.duration]);

  const playWinAnimation = useCallback((profit: number = 0) => {
    if (isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    resetAnimation();
    
    // Sound effects
    createSound(800, 0.1, 'sine'); // Main victory sound
    setTimeout(() => createSound(1200, 0.05, 'triangle'), 200); // Sparkle
    setTimeout(() => createSound(200, 0.15, 'sawtooth'), 400); // Boom
    
    // Visual effects
    applyCameraEffect();
    showVictoryText(profit);
    
    // Create glow effect
    const glowEffect = document.createElement('div');
    glowEffect.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${200 + profit}px;
      height: ${200 + profit}px;
      background: radial-gradient(circle, rgba(255, 215, 0, 0.8) 0%, transparent 70%);
      border-radius: 50%;
      opacity: 0;
      z-index: 999;
      pointer-events: none;
      animation: glowPulse 1.5s ease-out forwards;
    `;
    document.body.appendChild(glowEffect);
    setTimeout(() => glowEffect.remove(), 1500);
    
    // Particle effects
    createConfetti();
    createStars();
    
    // Start particle animation
    updateParticles();
    
    // Stop animation after duration
    setTimeout(() => {
      isAnimatingRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }, config.duration);
  }, [createSound, applyCameraEffect, showVictoryText, createConfetti, createStars, updateParticles, config.duration]);

  const resetAnimation = useCallback(() => {
    particlesRef.current = [];
    isAnimatingRef.current = false;
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Remove any leftover elements
    document.querySelectorAll('[style*="victory"], [style*="star"], [style*="glow"]').forEach(el => el.remove());
    
    // Remove animation classes
    const gameContainer = document.querySelector('.game-card, #gameContainer') || document.body;
    gameContainer.classList.remove('camera-zoom', 'camera-shake');
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes victoryReveal {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0) rotate(-180deg); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2) rotate(10deg); }
        70% { transform: translate(-50%, -50%) scale(0.9) rotate(-5deg); }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
      }
      
      @keyframes glowPulse {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(2); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(3); }
      }
      
      @keyframes starBurst {
        0% { opacity: 0; transform: scale(0) rotate(0deg); }
        50% { opacity: 1; transform: scale(1.5) rotate(180deg); }
        100% { opacity: 0; transform: scale(0.5) rotate(360deg) translateY(-50px); }
      }
      
      .camera-zoom {
        animation: cameraZoom 0.5s ease-out !important;
      }
      
      @keyframes cameraZoom {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      
      .camera-shake {
        animation: cameraShake 0.3s ease-out !important;
      }
      
      @keyframes cameraShake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return {
    canvasRef,
    playWinAnimation,
    resetAnimation,
    isAnimating: () => isAnimatingRef.current
  };
};
