import { useEffect, useMemo, useState } from 'react';

export type GameBurstId =
  | 'dice'
  | 'crash'
  | 'mines'
  | 'tower'
  | 'chicken'
  | 'plinko'
  | 'limbo'
  | 'hilo'
  | 'wheel'
  | 'keno'
  | 'blackjack'
  | 'poker'
  | 'slots'
  | 'roulette'
  | 'relic'
  | 'win'
  | 'lose';

type Motion = 'radial' | 'sprayUp' | 'spiral' | 'shatter' | 'bounce';

const PRESETS: Record<
  GameBurstId,
  { colors: string[]; glyphs: string[]; motion: Motion; count: number; durationMs: number }
> = {
  dice: {
    colors: ['#22d3ee', '#60a5fa', '#a855f7'],
    glyphs: ['✦', '✧', '◈', '◆'],
    motion: 'bounce',
    count: 18,
    durationMs: 700,
  },
  crash: {
    colors: ['#a855f7', '#ec4899', '#22d3ee'],
    glyphs: ['⚡', '✦', '✧', '▲'],
    motion: 'sprayUp',
    count: 22,
    durationMs: 800,
  },
  mines: {
    colors: ['#22d3ee', '#00ff88', '#ffd700'],
    glyphs: ['✦', '✧', '◆', '⬟'],
    motion: 'shatter',
    count: 22,
    durationMs: 800,
  },
  tower: {
    colors: ['#60a5fa', '#22d3ee', '#ffd700'],
    glyphs: ['▣', '■', '◆', '✦'],
    motion: 'radial',
    count: 20,
    durationMs: 750,
  },
  chicken: {
    colors: ['#ffd700', '#ffb700', '#ff8c00'],
    glyphs: ['✦', '✧', '★', '·'],
    motion: 'sprayUp',
    count: 18,
    durationMs: 700,
  },
  plinko: {
    colors: ['#ec4899', '#a855f7', '#22d3ee'],
    glyphs: ['●', '✦', '✧', '◆'],
    motion: 'bounce',
    count: 24,
    durationMs: 900,
  },
  limbo: {
    colors: ['#fb923c', '#f97316', '#ffd700'],
    glyphs: ['✦', '✧', '▲', '◆'],
    motion: 'spiral',
    count: 20,
    durationMs: 850,
  },
  hilo: {
    colors: ['#22d3ee', '#60a5fa', '#00ff88'],
    glyphs: ['↑', '↓', '✦', '✧'],
    motion: 'sprayUp',
    count: 18,
    durationMs: 750,
  },
  wheel: {
    colors: ['#a855f7', '#ffd700', '#22d3ee', '#ec4899'],
    glyphs: ['✦', '✧', '◆', '★'],
    motion: 'spiral',
    count: 26,
    durationMs: 950,
  },
  keno: {
    colors: ['#ffd700', '#60a5fa', '#22d3ee'],
    glyphs: ['⬢', '✦', '✧', '•'],
    motion: 'shatter',
    count: 22,
    durationMs: 850,
  },
  blackjack: {
    colors: ['#ffffff', '#22c55e', '#dc2626', '#ffd700'],
    glyphs: ['♠', '♥', '♦', '♣'],
    motion: 'radial',
    count: 18,
    durationMs: 850,
  },
  poker: {
    colors: ['#ffd700', '#ffffff', '#a855f7'],
    glyphs: ['♠', '♥', '♦', '♣', '✦'],
    motion: 'radial',
    count: 20,
    durationMs: 850,
  },
  slots: {
    colors: ['#ec4899', '#ffd700', '#22d3ee'],
    glyphs: ['✦', '✧', '★', '◆'],
    motion: 'sprayUp',
    count: 26,
    durationMs: 950,
  },
  roulette: {
    colors: ['#dc2626', '#111827', '#16a34a', '#ffd700'],
    glyphs: ['●', '✦', '✧', '◆'],
    motion: 'spiral',
    count: 24,
    durationMs: 950,
  },
  relic: {
    colors: ['#6F00FF', '#22d3ee', '#ffd700', '#ec4899'],
    glyphs: ['✦', '✧', '◈', '◇', '✶'],
    motion: 'spiral',
    count: 26,
    durationMs: 980,
  },
  win: {
    colors: ['#ffd700', '#22c55e', '#22d3ee'],
    glyphs: ['✦', '✧', '★', '◆'],
    motion: 'radial',
    count: 18,
    durationMs: 750,
  },
  lose: {
    colors: ['#dc2626', '#b91c1c', '#991b1b'],
    glyphs: ['✦', '✧', '◆'],
    motion: 'shatter',
    count: 14,
    durationMs: 650,
  },
};

interface GameBurstProps {
  id: GameBurstId;
  show: boolean;
  /** Center of burst relative to its positioned parent. */
  xPct?: number;
  yPct?: number;
  className?: string;
  onDone?: () => void;
}

export const GameBurst = ({ id, show, xPct = 50, yPct = 45, className = '', onDone }: GameBurstProps) => {
  const [visible, setVisible] = useState(false);
  const preset = PRESETS[id] ?? PRESETS.win;

  const particles = useMemo(() => {
    const out: Array<{
      key: string;
      glyph: string;
      color: string;
      tx: number;
      ty: number;
      rot: number;
      delayMs: number;
      sizePx: number;
    }> = [];

    const baseSpread = preset.motion === 'sprayUp' ? 110 : preset.motion === 'bounce' ? 120 : 95;
    for (let i = 0; i < preset.count; i++) {
      const angle = (i / preset.count) * Math.PI * 2 + (preset.motion === 'spiral' ? i * 0.28 : 0);
      const radius = baseSpread * (0.35 + Math.random() * 0.9);
      let tx = Math.cos(angle) * radius;
      let ty = Math.sin(angle) * radius;

      if (preset.motion === 'sprayUp') {
        tx = (Math.random() - 0.5) * 180;
        ty = -40 - Math.random() * 170;
      } else if (preset.motion === 'shatter') {
        tx = (Math.random() - 0.5) * 220;
        ty = (Math.random() - 0.5) * 150;
      } else if (preset.motion === 'bounce') {
        tx = (Math.random() - 0.5) * 210;
        ty = -20 - Math.random() * 190;
      }

      out.push({
        key: `${id}-${i}-${Math.random().toString(16).slice(2)}`,
        glyph: preset.glyphs[i % preset.glyphs.length],
        color: preset.colors[i % preset.colors.length],
        tx: Math.round(tx),
        ty: Math.round(ty),
        rot: Math.round((Math.random() - 0.5) * 260),
        delayMs: Math.round(Math.random() * 90),
        sizePx: 10 + Math.round(Math.random() * 12),
      });
    }

    return out;
  }, [id, preset.colors, preset.count, preset.glyphs, preset.motion]);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, preset.durationMs);
    return () => clearTimeout(t);
  }, [show, onDone, preset.durationMs]);

  if (!show && !visible) return null;

  const motionClass =
    preset.motion === 'spiral'
      ? 'game-burst--spiral'
      : preset.motion === 'shatter'
      ? 'game-burst--shatter'
      : preset.motion === 'sprayUp'
      ? 'game-burst--spray'
      : preset.motion === 'bounce'
      ? 'game-burst--bounce'
      : 'game-burst--radial';

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      <div className={`absolute ${motionClass}`} style={{ left: `${xPct}%`, top: `${yPct}%` }}>
        {particles.map((p) => (
          <span
            key={p.key}
            className="game-burst__p"
            style={{
              ['--tx' as string]: `${p.tx}px`,
              ['--ty' as string]: `${p.ty}px`,
              ['--rot' as string]: `${p.rot}deg`,
              ['--c' as string]: p.color,
              animationDelay: `${p.delayMs}ms`,
              fontSize: `${p.sizePx}px`,
            } as React.CSSProperties}
          >
            {p.glyph}
          </span>
        ))}
      </div>
    </div>
  );
};

