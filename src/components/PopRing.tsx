import { useEffect, useState } from 'react';

type RingVariant = 'gold' | 'win' | 'lose';

const RING_CLASS: Record<RingVariant, string> = {
  gold: 'roguelike-ring-gold',
  win: 'roguelike-ring-win',
  lose: 'roguelike-ring-lose',
};

interface PopRingProps {
  show: boolean;
  variant?: RingVariant;
  onComplete?: () => void;
  className?: string;
}

export const PopRing = ({ show, variant = 'gold', onComplete, className = '' }: PopRingProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      const t = setTimeout(() => {
        setMounted(false);
        onComplete?.();
      }, 550);
      return () => clearTimeout(t);
    }
  }, [show, onComplete]);

  if (!show && !mounted) return null;

  return (
    <span
      className={`pointer-events-none absolute inset-0 rounded-[inherit] border-2 ${RING_CLASS[variant]} ${className}`}
      aria-hidden
    />
  );
};
