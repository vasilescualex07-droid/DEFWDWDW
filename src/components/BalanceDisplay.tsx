import { Coins, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { RoguelikeSparkles } from '@/components/RoguelikeSparkles';
import { PopRing } from '@/components/PopRing';

interface BalanceDisplayProps {
  balance: number;
  onReset: () => void;
}

export const BalanceDisplay = ({ balance, onReset }: BalanceDisplayProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [flash, setFlash] = useState<'win' | 'lose' | null>(null);
  const [delta, setDelta] = useState<{ value: number; isWin: boolean } | null>(null);
  const prevBalance = useRef(balance);

  useEffect(() => {
    if (balance !== prevBalance.current) {
      const diff = balance - prevBalance.current;
      setIsAnimating(true);
      setFlash(diff > 0 ? 'win' : 'lose');
      setDelta({ value: Math.abs(diff), isWin: diff > 0 });
      prevBalance.current = balance;
      const t = setTimeout(() => {
        setIsAnimating(false);
        setFlash(null);
      }, 700);
      const t2 = setTimeout(() => setDelta(null), 1500);
      return () => {
        clearTimeout(t);
        clearTimeout(t2);
      };
    }
  }, [balance]);

  return (
    <div className="flex items-center gap-4">
      <div className={`relative flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-300 overflow-visible ${
        flash === 'win' 
          ? 'bg-win/15 border-win/50 shadow-[0_0_20px_hsl(var(--win)/0.35)] animate-pop-burst' 
          : flash === 'lose'
          ? 'bg-lose/15 border-lose/50 shadow-[0_0_20px_hsl(var(--lose)/0.35)] animate-danger-pulse'
          : 'bg-secondary/80 border-gold/20 shadow-[0_0_12px_rgba(0,0,0,0.4)]'
      }`}>
        {flash === 'win' && <PopRing show variant="win" />}
        {flash === 'lose' && <PopRing show variant="lose" />}
        {flash === 'win' && (
          <RoguelikeSparkles variant="win" count={10} size="sm" spread={32} mode="burst" />
        )}
        {delta && (
          <span
            className={`absolute -top-2 left-1/2 -translate-x-1/2 font-display font-black text-xl md:text-2xl tabular-nums animate-delta-float whitespace-nowrap ${
              delta.isWin ? 'text-win drop-shadow-[0_0_12px_hsl(var(--win))]' : 'text-lose drop-shadow-[0_0_12px_hsl(var(--lose))]'
            }`}
            style={{ textShadow: delta.isWin ? '0 0 20px hsl(var(--win)), 0 2px 4px black' : '0 0 20px hsl(var(--lose)), 0 2px 4px black' }}
            aria-hidden
          >
            {delta.isWin ? '+' : '-'}${formatNumber(delta.value)}
          </span>
        )}
        <Coins className={`w-6 h-6 text-gold transition-transform duration-300 ${isAnimating && flash === 'win' ? 'animate-impact-pop' : ''}`} />
        <span className={`font-display font-black text-2xl md:text-3xl text-gradient-gold transition-transform duration-200 ${isAnimating && flash === 'win' ? 'scale-110' : 'scale-100'}`}
          style={{ textShadow: '0 0 16px hsl(45 100% 50% / 0.4)' }}
        >
          ${formatNumber(balance)}
        </span>
      </div>
      {balance === 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="border-gold/40 text-gold hover:bg-gold/20 hover:text-gold font-display tracking-wider animate-danger-pulse"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset $100
        </Button>
      )}
    </div>
  );
};