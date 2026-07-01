import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Play, RotateCcw, Settings, Maximize2, Volume2, VolumeX } from 'lucide-react';
import type { ElectronAPI } from '@/types/electron';

interface WinAnimationConfig {
  duration: number;
  intensity: number;
  particleCount: number;
  cameraEffect: 'zoom' | 'shake' | 'both';
  soundEnabled: boolean;
  fullscreenEnabled: boolean;
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

export const WinAnimationDesktop = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [config, setConfig] = useState<WinAnimationConfig>({
    duration: 3000,
    intensity: 1,
    particleCount: 50,
    cameraEffect: 'zoom',
    soundEnabled: true,
    fullscreenEnabled: false
  });

  const particlesRef = useRef<Particle[]>([]);

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

  // Electron API integration
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Listen for keyboard shortcuts
      window.electronAPI.onPlayWinAnimation(() => {
        playAnimation();
      });
      
      window.electronAPI.onResetAnimation(() => {
        resetAnimation();
      });
      
      window.electronAPI.onToggleSettings(() => {
        setShowSettings(prev => !prev);
      });
    }
  }, []);

  // Sound generation using Web Audio API
  const createSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled || typeof AudioContext === 'undefined') return;
    
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
  }, [soundEnabled, config.intensity]);

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
      particle.vy += 0.2; // gravity
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
      
      // Draw particle as a rotating square
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
      
      // Add glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = particle.color;
      ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
      
      ctx.restore();
    }
    
    if (isAnimating) {
      animationRef.current = requestAnimationFrame(updateParticles);
    }
  }, [isAnimating]);

  const createConfetti = useCallback(() => {
    const centerX = (canvasRef.current?.width || 800) / 2;
    const centerY = (canvasRef.current?.height || 600) / 2;
    
    for (let i = 0; i < config.particleCount; i++) {
      setTimeout(() => {
        const particle = createParticle(
          centerX + (Math.random() - 0.5) * 100,
          centerY + (Math.random() - 0.5) * 100
        );
        particlesRef.current.push(particle);
        
        // Random sparkle sounds
        if (Math.random() > 0.7) {
          createSound(1200, 0.05, 'triangle');
        }
      }, i * 30);
    }
  }, [config.particleCount, createParticle, createSound]);

  const createStars = useCallback(() => {
    const starSymbols = ['⭐', '✨', '🌟', '💫'];
    const container = document.body;
    
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const star = document.createElement('div');
        star.textContent = starSymbols[Math.floor(Math.random() * starSymbols.length)];
        star.style.cssText = `
          position: fixed;
          left: ${20 + Math.random() * 60}%;
          top: ${20 + Math.random() * 60}%;
          font-size: 2rem;
          color: #FFD700;
          opacity: 0;
          animation: starBurst 1s ease-out forwards;
          z-index: 1000;
          pointer-events: none;
        `;
        container.appendChild(star);
        
        setTimeout(() => star.remove(), 1000);
      }, i * 100);
    }
  }, []);

  const applyCameraEffect = useCallback(() => {
    const gameContainer = document.querySelector('#gameContainer') || document.body;
    
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

  const showVictoryText = useCallback(() => {
    const victoryText = document.createElement('div');
    victoryText.textContent = 'VICTORY!';
    victoryText.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 4rem;
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

  const playAnimation = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    resetAnimation();
    
    // Sound effects
    createSound(800, 0.1, 'sine'); // Main victory sound
    setTimeout(() => createSound(1200, 0.05, 'triangle'), 200); // Sparkle
    setTimeout(() => createSound(200, 0.15, 'sawtooth'), 400); // Boom
    
    // Visual effects
    applyCameraEffect();
    showVictoryText();
    
    // Create glow effect
    const glowEffect = document.createElement('div');
    glowEffect.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 200px;
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
      setIsAnimating(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }, config.duration);
  }, [isAnimating, createSound, applyCameraEffect, showVictoryText, createConfetti, createStars, updateParticles, config.duration]);

  const resetAnimation = useCallback(() => {
    particlesRef.current = [];
    setIsAnimating(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Remove any leftover elements
    document.querySelectorAll('[style*="victory"], [style*="star"], [style*="glow"]').forEach(el => el.remove());
    
    // Remove animation classes
    const gameContainer = document.querySelector('#gameContainer') || document.body;
    gameContainer.classList.remove('camera-zoom', 'camera-shake');
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
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
        animation: cameraZoom 0.5s ease-out;
      }
      
      @keyframes cameraZoom {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      
      .camera-shake {
        animation: cameraShake 0.3s ease-out;
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

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Canvas for particle effects */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-50"
      />
      
      {/* Main content area */}
      <div id="gameContainer" className="relative z-10 flex flex-col items-center justify-center h-full">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold text-white mb-8 drop-shadow-lg">
            Win Animation Desktop
          </h1>
          
          {/* Control buttons */}
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={playAnimation}
              disabled={isAnimating}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4"
            >
              <Play className="w-6 h-6 mr-2" />
              Play Win Animation
            </Button>
            
            <Button
              onClick={resetAnimation}
              variant="outline"
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 px-8 py-4"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              Reset
            </Button>
            
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 px-8 py-4"
            >
              <Settings className="w-6 h-6 mr-2" />
              Settings
            </Button>
            
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 px-8 py-4"
            >
              <Maximize2 className="w-6 h-6 mr-2" />
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
            
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              variant="outline"
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 px-8 py-4"
            >
              {soundEnabled ? <Volume2 className="w-6 h-6 mr-2" /> : <VolumeX className="w-6 h-6 mr-2" />}
              {soundEnabled ? 'Sound On' : 'Sound Off'}
            </Button>
          </div>
          
          {/* Instructions */}
          <div className="text-white/70 text-sm space-y-2 max-w-md mx-auto">
            <p>• Press <kbd className="px-2 py-1 bg-white/20 rounded">Space</kbd> to play animation</p>
            <p>• Press <kbd className="px-2 py-1 bg-white/20 rounded">Ctrl+R</kbd> to reset</p>
            <p>• Press <kbd className="px-2 py-1 bg-white/20 rounded">F11</kbd> for fullscreen</p>
            <p>• Press <kbd className="px-2 py-1 bg-white/20 rounded">Ctrl+,</kbd> for settings</p>
          </div>
        </div>
      </div>
      
      {/* Settings panel */}
      {showSettings && (
        <Card className="absolute top-4 right-4 w-80 bg-black/80 backdrop-blur-md border-white/20 p-6 z-20">
          <h3 className="text-white text-lg font-semibold mb-4">Animation Settings</h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-white text-sm">Duration: {(config.duration / 1000).toFixed(1)}s</Label>
              <Slider
                value={[config.duration / 1000]}
                onValueChange={([value]) => setConfig(prev => ({ ...prev, duration: value * 1000 }))}
                min={2}
                max={4}
                step={0.1}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-white text-sm">Intensity: {config.intensity.toFixed(1)}x</Label>
              <Slider
                value={[config.intensity]}
                onValueChange={([value]) => setConfig(prev => ({ ...prev, intensity: value }))}
                min={0.5}
                max={2}
                step={0.1}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-white text-sm">Particle Count: {config.particleCount}</Label>
              <Slider
                value={[config.particleCount]}
                onValueChange={([value]) => setConfig(prev => ({ ...prev, particleCount: value }))}
                min={20}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-white text-sm">Camera Effect</Label>
              <Select value={config.cameraEffect} onValueChange={(value: 'zoom' | 'shake' | 'both') => setConfig(prev => ({ ...prev, cameraEffect: value }))}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/80 border-white/20">
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="shake">Shake</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
