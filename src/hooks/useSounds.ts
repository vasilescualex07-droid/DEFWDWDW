import { useCallback, useRef } from 'react';

type SoundType = 'win' | 'lose' | 'click' | 'spin' | 'reveal' | 'cashout' | 'deal' | 'bounce' | 'explosion' | 'levelup' | 'coin' | 'whoosh';

let audioContext: AudioContext | null = null;

// Sound enabled state with localStorage persistence
let soundEnabled = (() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('sound_enabled');
    return saved !== 'false';
  }
  return true;
})();

export const isSoundEnabled = () => soundEnabled;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('sound_enabled', enabled.toString());
  }
};

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Enhanced oscillator with more control
const createOscillator = (
  ctx: AudioContext, 
  frequency: number, 
  type: OscillatorType = 'sine',
  detune: number = 0
) => {
  const osc = ctx.createOscillator();
  osc.frequency.value = frequency;
  osc.type = type;
  osc.detune.value = detune;
  return osc;
};

// Create a rich, warm filter chain
const createFilterChain = (ctx: AudioContext) => {
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 3000;
  lowpass.Q.value = 1;
  
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 80;
  
  lowpass.connect(highpass);
  return { input: lowpass, output: highpass };
};

// Play a single enhanced tone
const playTone = (
  frequency: number, 
  duration: number, 
  type: OscillatorType = 'sine', 
  gain = 0.12, 
  attack = 0.02, 
  release = 0.1,
  pan = 0
) => {
  if (!soundEnabled) return;
  
  const ctx = getAudioContext();
  const osc = createOscillator(ctx, frequency, type);
  const gainNode = ctx.createGain();
  const panner = ctx.createStereoPanner();
  const filter = createFilterChain(ctx);
  
  osc.connect(filter.input);
  filter.output.connect(gainNode);
  gainNode.connect(panner);
  panner.connect(ctx.destination);
  
  panner.pan.value = pan;
  
  // Ensure safe timing
  const safeDuration = Math.max(duration, attack + release + 0.01);
  const releaseStart = Math.max(ctx.currentTime + attack + 0.01, ctx.currentTime + safeDuration - release);
  
  // Smooth ADSR envelope
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + attack);
  gainNode.gain.setValueAtTime(gain, releaseStart - 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, releaseStart + release);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + safeDuration);
};

// Play rich chord with multiple oscillators and slight detuning
const playChord = (frequencies: number[], duration: number, gain = 0.06, spread = true) => {
  frequencies.forEach((freq, i) => {
    const pan = spread ? (i / frequencies.length - 0.5) * 0.6 : 0;
    playTone(freq, duration, 'sine', gain, 0.03, 0.15, pan);
    // Add slight detune for richness
    playTone(freq * 1.002, duration, 'sine', gain * 0.3, 0.05, 0.15, pan);
  });
};

// Create noise burst for impact sounds
const playNoise = (duration: number, gain: number = 0.05, filterFreq: number = 1000) => {
  if (!soundEnabled) return;
  
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  source.start();
};

// Sound definitions with richer, more satisfying audio
const sounds: Record<SoundType, () => void> = {
  win: () => {
    // Triumphant ascending arpeggio with major 7th chord
    const notes = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.25, 'sine', 0.1, 0.02, 0.1, (i - 1.5) * 0.3), i * 80);
    });
    // Sparkle on top
    setTimeout(() => {
      playChord([1046.5, 1318.5, 1567.98], 0.5, 0.06);
    }, 320);
  },
  
  lose: () => {
    // Gentle descending minor second
    playTone(392, 0.2, 'triangle', 0.08);
    setTimeout(() => playTone(369.99, 0.3, 'triangle', 0.06), 150);
  },
  
  click: () => {
    // Crisp, satisfying click with subtle resonance
    playTone(1800, 0.03, 'sine', 0.08, 0.002, 0.015);
    playTone(2400, 0.02, 'sine', 0.04, 0.001, 0.01);
  },
  
  spin: () => {
    // Sweeping whoosh effect
    const ctx = getAudioContext();
    if (!soundEnabled) return;
    
    for (let i = 0; i < 8; i++) {
      const freq = 200 + i * 100;
      setTimeout(() => playTone(freq, 0.08, 'sine', 0.03, 0.01, 0.04, (i % 2 === 0 ? -0.3 : 0.3)), i * 40);
    }
  },
  
  reveal: () => {
    // Magical reveal sound
    playTone(880, 0.1, 'sine', 0.08);
    setTimeout(() => playTone(1108.73, 0.12, 'sine', 0.07), 50);
    setTimeout(() => playTone(1318.51, 0.15, 'sine', 0.06), 100);
  },
  
  cashout: () => {
    // Satisfying cash register cha-ching
    playChord([523.25, 659.25, 783.99], 0.1, 0.05);
    setTimeout(() => {
      playChord([659.25, 830.61, 987.77], 0.15, 0.07);
    }, 100);
    setTimeout(() => {
      playChord([783.99, 987.77, 1174.66], 0.25, 0.08);
      // Add coin jingle
      for (let i = 0; i < 3; i++) {
        setTimeout(() => playTone(2000 + Math.random() * 500, 0.05, 'sine', 0.04), i * 50);
      }
    }, 200);
  },
  
  deal: () => {
    // Smooth card deal with swish
    playNoise(0.04, 0.04, 2000);
    playTone(800, 0.04, 'sine', 0.04, 0.005, 0.02);
  },
  
  bounce: () => {
    // Plinko bounce with natural randomness
    const baseFreq = 400 + Math.random() * 600;
    playTone(baseFreq, 0.06, 'sine', 0.025, 0.005, 0.03);
    // Subtle harmonic
    playTone(baseFreq * 2, 0.04, 'sine', 0.01, 0.005, 0.02);
  },
  
  explosion: () => {
    // Dramatic crash sound
    playNoise(0.3, 0.12, 500);
    playTone(80, 0.25, 'sine', 0.15, 0.01, 0.2);
    playTone(60, 0.3, 'sine', 0.1, 0.02, 0.25);
  },
  
  levelup: () => {
    // Celebratory fanfare
    const fanfare = [523.25, 659.25, 783.99, 1046.5];
    fanfare.forEach((freq, i) => {
      setTimeout(() => {
        playTone(freq, 0.2, 'sine', 0.1);
        playTone(freq * 0.5, 0.2, 'sine', 0.05);
      }, i * 100);
    });
    setTimeout(() => {
      playChord([1046.5, 1318.5, 1567.98, 2093], 0.5, 0.08);
    }, 400);
  },
  
  coin: () => {
    // Single coin sound
    playTone(1800, 0.08, 'sine', 0.06);
    setTimeout(() => playTone(2200, 0.06, 'sine', 0.04), 30);
  },
  
  whoosh: () => {
    // Quick swoosh for transitions
    playNoise(0.1, 0.05, 1500);
    for (let i = 0; i < 5; i++) {
      playTone(300 + i * 150, 0.05, 'sine', 0.02, 0.01, 0.03);
    }
  }
};

export const useSounds = () => {
  const enabled = useRef(soundEnabled);

  const play = useCallback((sound: SoundType) => {
    if (!enabled.current || !soundEnabled) return;
    
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    sounds[sound]();
  }, []);

  const toggle = useCallback(() => {
    enabled.current = !enabled.current;
    setSoundEnabled(enabled.current);
    return enabled.current;
  }, []);

  return { play, toggle, enabled: enabled.current };
};

export const playSound = (sound: SoundType) => {
  if (!soundEnabled) return;
  
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  sounds[sound]();
};
