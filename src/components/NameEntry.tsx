import { useState, useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
const REEL_COUNT = 8;
const SPIN_DURATION = 1800;

interface ReelState {
  chars: string[];
  offset: number;
  settled: boolean;
  finalChar: string;
}

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function buildReel(finalChar: string): string[] {
  const reel: string[] = [];
  for (let i = 0; i < 30; i++) reel.push(randomChar());
  reel.push(finalChar);
  return reel;
}

interface Props {
  onConfirm: (name: string) => void;
}

export function NameEntry({ onConfirm }: Props) {
  const [inputName, setInputName] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<ReelState[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSpin = () => {
    const name = inputName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, REEL_COUNT);
    if (name.length < 2) {
      setError('Enter at least 2 characters');
      return;
    }
    setError('');
    setDone(false);
    setSpinning(true);

    const padded = name.padEnd(REEL_COUNT, ' ');
    const newReels: ReelState[] = padded.split('').map((ch) => ({
      chars: buildReel(ch === ' ' ? '' : ch),
      offset: 0,
      settled: false,
      finalChar: ch === ' ' ? '' : ch,
    }));
    setReels(newReels);

    newReels.forEach((_, i) => {
      const delay = i * 220;
      setTimeout(() => {
        setReels((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, settled: true } : r
          )
        );
        if (i === Math.min(name.length - 1, REEL_COUNT - 1)) {
          setTimeout(() => {
            setSpinning(false);
            setDone(true);
          }, 300);
        }
      }, SPIN_DURATION + delay);
    });
  };

  const handleConfirm = () => {
    const name = inputName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, REEL_COUNT);
    if (name.length >= 2) {
      onConfirm(inputName.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (done) handleConfirm();
      else handleSpin();
    }
  };

  const visibleLetters = inputName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, REEL_COUNT);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-blue-900/30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-gold/30 to-gold/10 rounded-xl glow-gold">
            <Zap className="w-7 h-7 text-gold animate-pulse" />
          </div>
          <h1 className="font-display text-4xl font-black tracking-[0.25em] drop-shadow-[0_0_20px_hsl(45_100%_50%/0.4)]">
            STAKE<span className="text-gradient-gold">LITE</span>
          </h1>
        </div>

        <p className="text-muted-foreground font-display tracking-widest text-sm">ENTER YOUR NAME TO PLAY</p>

        {/* Slot machine reels */}
        <div className="flex gap-2">
          {Array.from({ length: REEL_COUNT }).map((_, i) => {
            const reel = reels[i];
            const letter = visibleLetters[i] || '';
            const isActive = i < visibleLetters.length;

            return (
              <div
                key={i}
                className={`w-10 h-14 rounded-lg border-2 flex items-center justify-center overflow-hidden relative
                  ${isActive ? 'border-gold/60 bg-gold/10 shadow-[0_0_16px_hsl(45_100%_50%/0.3)]' : 'border-white/10 bg-white/5'}
                  transition-all duration-200`}
              >
                {reel && spinning ? (
                  <div
                    className={`absolute inset-0 flex flex-col items-center transition-all ${reel.settled ? '' : 'animate-spin-reel'}`}
                    style={{
                      animation: reel.settled ? 'none' : `spinReel ${0.08}s linear infinite`,
                    }}
                  >
                    {/* Rapid cycling chars */}
                    <SpinningReel reel={reel} />
                  </div>
                ) : (
                  <span className={`font-display font-black text-xl ${isActive ? 'text-gold' : 'text-white/20'}`}>
                    {reel?.finalChar || letter || (isActive ? letter : '_')}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <input
            ref={inputRef}
            type="text"
            value={inputName}
            onChange={(e) => { setInputName(e.target.value); setDone(false); setReels([]); }}
            onKeyDown={handleKeyDown}
            maxLength={REEL_COUNT}
            placeholder="Your name..."
            autoFocus
            className="w-full text-center bg-card/80 border-2 border-gold/30 rounded-xl px-4 py-3 font-display text-xl tracking-widest text-white placeholder:text-white/30 focus:outline-none focus:border-gold/70 focus:shadow-[0_0_20px_hsl(45_100%_50%/0.2)] transition-all"
          />
          {error && <p className="text-lose text-sm font-display">{error}</p>}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSpin}
            disabled={spinning}
            className="bg-gradient-to-r from-gold/80 to-amber-500/80 hover:from-gold hover:to-amber-500 text-black font-display font-black tracking-widest px-8 py-3 rounded-xl shadow-[0_0_20px_hsl(45_100%_50%/0.3)] hover:shadow-[0_0_30px_hsl(45_100%_50%/0.5)] transition-all active:scale-95 disabled:opacity-50"
          >
            {spinning ? 'SPINNING...' : '🎰 SPIN'}
          </Button>
          {done && (
            <Button
              onClick={handleConfirm}
              className="bg-gradient-to-r from-neon-blue/80 to-neon-purple/80 hover:from-neon-blue hover:to-neon-purple text-white font-display font-black tracking-widest px-8 py-3 rounded-xl shadow-[0_0_20px_hsl(217_91%_60%/0.3)] hover:shadow-[0_0_30px_hsl(217_91%_60%/0.5)] transition-all active:scale-95 animate-fade-in"
            >
              PLAY →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SpinningReel({ reel }: { reel: ReelState }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (reel.settled) return;
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % CHARS.length);
    }, 60);
    return () => clearInterval(interval);
  }, [reel.settled]);

  return (
    <span className="font-display font-black text-xl text-gold flex items-center justify-center w-full h-full">
      {reel.settled ? reel.finalChar : CHARS[idx]}
    </span>
  );
}
