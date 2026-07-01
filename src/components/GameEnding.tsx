import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface GameEndingProps {
  show: boolean;
  totalProfit: number;
  playerName: string;
  playerLevel: number;
  run: number;
  nextVaultMax: number;
  onNewGamePlus: () => void;
  onKeepPlaying: () => void;
}

export const GameEnding = ({
  show,
  totalProfit,
  playerName,
  playerLevel,
  run,
  nextVaultMax,
  onNewGamePlus,
  onKeepPlaying,
}: GameEndingProps) => {
  const [phase, setPhase] = useState<'hidden' | 'backdrop' | 'title' | 'story' | 'buttons'>('hidden');

  useEffect(() => {
    if (!show) { setPhase('hidden'); return; }
    setPhase('backdrop');
    const t1 = setTimeout(() => setPhase('title'),   600);
    const t2 = setTimeout(() => setPhase('story'),  1800);
    const t3 = setTimeout(() => setPhase('buttons'),3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [show]);

  if (phase === 'hidden') return null;

  const ordinal = (n: number) => {
    const s = ['th','st','nd','rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden flex flex-col items-center justify-center">
      {/* Close button */}
      <button
        onClick={onKeepPlaying}
        className="absolute top-4 right-4 z-20 p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.55)' }}
        title="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(20,0,0,0.98) 0%, rgba(0,0,0,0.99) 100%)',
          animation: 'gacha-root-in 0.8s ease-out forwards',
        }}
      />

      {/* Slow rotating gold rays */}
      <div
        className="absolute inset-0 gacha-rays-big"
        style={{ opacity: 0.22, animation: 'summon-rays-spin 6s linear infinite' }}
      />

      {/* Red vignette pulse */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(180,0,0,0.18) 100%)',
          animation: 'summon-ring-pulse 2s ease-in-out infinite',
        }}
      />

      {/* Stars cascade */}
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          className="absolute gacha-star-rise pointer-events-none select-none"
          style={{
            left: `${4 + i * 4}%`,
            bottom: 0,
            color: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ef4444' : '#ffffff',
            fontSize: `${14 + (i % 5) * 6}px`,
            animationDelay: `${(i * 0.18) % 2.4}s`,
            animationDuration: `${2.2 + (i % 4) * 0.5}s`,
            textShadow: '0 0 12px currentColor',
          }}
        >
          {['★', '◆', '✦', '●', '✧'][i % 5]}
        </span>
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center max-w-2xl">

        {/* Run badge */}
        {phase !== 'backdrop' && (
          <div className="gacha-badge-in flex flex-col items-center gap-1">
            <div
              className="font-display text-xs font-black tracking-[0.4em] px-5 py-1.5 rounded-full border"
              style={{
                background: 'linear-gradient(90deg, rgba(239,68,68,0.2), rgba(180,0,0,0.1), rgba(239,68,68,0.2))',
                borderColor: 'rgba(239,68,68,0.6)',
                color: '#fca5a5',
                textShadow: '0 0 12px rgba(239,68,68,0.8)',
              }}
            >
              ◆ {ordinal(run)} CLEAR ◆
            </div>
          </div>
        )}

        {/* Main title */}
        {phase !== 'backdrop' && (
          <div className="gacha-title-in relative">
            <div className="absolute inset-0 gacha-shine overflow-hidden rounded-xl pointer-events-none" />
            <h1
              className="font-display font-black uppercase leading-none select-none"
              style={{
                fontSize: 'clamp(2.4rem, 8vw, 5.5rem)',
                background: 'linear-gradient(180deg, #ffffff 0%, #ffd700 30%, #ef4444 70%, #991b1b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 30px rgba(239,68,68,0.9)) drop-shadow(0 0 60px rgba(255,215,0,0.4)) drop-shadow(0 4px 8px rgba(0,0,0,1))',
              }}
            >
              YOU BROKE<br />THE HOUSE
            </h1>
          </div>
        )}

        {/* Story + stats */}
        {(phase === 'story' || phase === 'buttons') && (
          <div className="gacha-amount-in flex flex-col gap-4" style={{ animationDelay: '0s' }}>
            <p
              className="font-display text-sm md:text-base tracking-wide leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
            >
              The casino owner stares across the empty table.<br />
              The chips are gone. The vault is empty.<br />
              <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{playerName}</span> walked in with nothing —
              and walked out with everything.
            </p>

            <div
              className="grid grid-cols-3 gap-3 p-4 rounded-2xl border"
              style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,215,0,0.25)' }}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-display tracking-widest text-amber-400/70 uppercase">Total Taken</span>
                <span className="text-lg font-display font-black text-amber-400">${formatNumber(totalProfit)}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-display tracking-widest text-amber-400/70 uppercase">Level</span>
                <span className="text-lg font-display font-black text-amber-400">LVL {playerLevel}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-display tracking-widest text-amber-400/70 uppercase">Clears</span>
                <span className="text-lg font-display font-black text-amber-400">× {run}</span>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        {phase === 'buttons' && (
          <div className="gacha-amount-in flex flex-col gap-3 w-full max-w-sm" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onNewGamePlus}
                className="flex-1 py-3 px-6 rounded-xl font-display font-black text-sm tracking-widest uppercase transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #ffd700, #f59e0b)',
                  color: '#000',
                  boxShadow: '0 0 24px rgba(255,215,0,0.5), 0 4px 12px rgba(0,0,0,0.6)',
                }}
              >
                ★ NEW GAME+
              </button>
              <button
                onClick={onKeepPlaying}
                className="flex-1 py-3 px-6 rounded-xl font-display font-black text-sm tracking-widest uppercase transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.65)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                KEEP PLAYING
              </button>
            </div>
            <p
              className="text-[11px] font-display tracking-widest text-center"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              NEXT VAULT · ${nextVaultMax.toLocaleString()} · ×4 HARDER
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
