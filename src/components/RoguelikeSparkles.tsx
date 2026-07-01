import { useMemo } from 'react';

type Variant = 'gold' | 'win' | 'lose' | 'purple' | 'mixed';

const VARIANT_COLORS: Record<Variant, string[]> = {
  gold: ['#ffd700', '#ffb700', '#ff8c00', '#daa520', '#b8860b'],
  win: ['#22c55e', '#16a34a', '#15803d', '#4ade80', '#86efac'],
  lose: ['#dc2626', '#b91c1c', '#991b1b', '#f87171', '#fca5a5'],
  purple: ['#a855f7', '#9333ea', '#7c3aed', '#c084fc', '#e879f9'],
  mixed: ['#ffd700', '#22c55e', '#a855f7', '#ffb700', '#4ade80', '#c084fc'],
};

const SPARKLE_CHARS = ['✦', '✧', '★', '∗', '·'];

interface RoguelikeSparklesProps {
  variant?: Variant;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  /** Spread radius in px (how far from center) */
  spread?: number;
  /** Whether to animate as burst (one-shot) or twinkle (loop) */
  mode?: 'twinkle' | 'burst' | 'float';
  className?: string;
}

export const RoguelikeSparkles = ({
  variant = 'gold',
  count = 8,
  size = 'md',
  spread = 24,
  mode = 'twinkle',
  className = '',
}: RoguelikeSparklesProps) => {
  const particles = useMemo(() => {
    const colors = VARIANT_COLORS[variant];
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + (i * 0.7);
      const r = spread * (0.4 + Math.random() * 0.6);
      return {
        id: i,
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        color: colors[i % colors.length],
        char: SPARKLE_CHARS[i % SPARKLE_CHARS.length],
        delay: i * 0.08 + Math.random() * 0.15,
        duration: 1 + Math.random() * 0.8,
      };
    });
  }, [count, spread, variant]);

  const sizeClass = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-base' : 'text-xs';

  const animationClass =
    mode === 'burst' ? 'animate-sparkle-burst' : mode === 'float' ? 'animate-sparkle-float' : 'animate-sparkle-twinkle';

  return (
    <span className={`pointer-events-none absolute inset-0 overflow-visible ${className}`} aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className={`absolute left-1/2 top-1/2 ${sizeClass} ${animationClass}`}
          style={{
            ...(mode === 'burst' && { ['--tx' as string]: `${p.x}px`, ['--ty' as string]: `${p.y}px` }),
            transform: mode === 'burst' ? undefined : `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))`,
            color: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: mode === 'burst' ? '0.6s' : `${p.duration}s`,
            animationFillMode: mode === 'burst' ? 'forwards' : 'both',
            textShadow: `0 0 8px ${p.color}, 0 0 12px ${p.color}40`,
          } as React.CSSProperties}
        >
          {p.char}
        </span>
      ))}
    </span>
  );
};
