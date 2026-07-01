import { useEffect, useRef } from 'react';

export const SoundManager = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    if (!audioContextRef.current) return;
    
    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.log('Audio error:', error);
    }
  };

  const playWinSound = () => {
    playSound(523.25, 0.1, 'sine', 0.4); // C5
    setTimeout(() => playSound(659.25, 0.1, 'sine', 0.4), 100); // E5
    setTimeout(() => playSound(783.99, 0.2, 'sine', 0.4), 200); // G5
    setTimeout(() => playSound(1046.50, 0.3, 'triangle', 0.5), 300); // C6
  };

  const playLoseSound = () => {
    playSound(200, 0.2, 'sawtooth', 0.3);
    setTimeout(() => playSound(150, 0.3, 'sawtooth', 0.3), 200);
  };

  const playClickSound = () => {
    playSound(800, 0.05, 'sine', 0.2);
  };

  const playBoostSound = () => {
    playSound(440, 0.1, 'sine', 0.3);
    setTimeout(() => playSound(880, 0.1, 'sine', 0.4), 100);
    setTimeout(() => playSound(1320, 0.15, 'triangle', 0.5), 200);
  };

  const playAchievementSound = () => {
    playSound(523.25, 0.1, 'sine', 0.4);
    setTimeout(() => playSound(659.25, 0.1, 'sine', 0.4), 80);
    setTimeout(() => playSound(783.99, 0.1, 'sine', 0.4), 160);
    setTimeout(() => playSound(1046.50, 0.2, 'triangle', 0.5), 240);
    setTimeout(() => playSound(1318.51, 0.3, 'triangle', 0.5), 320);
  };

  useEffect(() => {
    (window as any).playWinSound = playWinSound;
    (window as any).playLoseSound = playLoseSound;
    (window as any).playClickSound = playClickSound;
    (window as any).playBoostSound = playBoostSound;
    (window as any).playAchievementSound = playAchievementSound;
  }, []);

  return null;
};
