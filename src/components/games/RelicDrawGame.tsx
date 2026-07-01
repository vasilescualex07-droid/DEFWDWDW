import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { playSound } from '@/hooks/useSounds';
import { toast } from 'sonner';

interface RelicDrawGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

type Tier = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

const TIERS: Array<{ tier: Tier; chance: number; mult: number; label: string; color: string }> = [
  { tier: 'mythic', chance: 0.01, mult: 18, label: 'MYTHIC', color: 'text-pink-300' },
  { tier: 'legendary', chance: 0.04, mult: 8, label: 'LEGENDARY', color: 'text-gold' },
  { tier: 'epic', chance: 0.12, mult: 3.6, label: 'EPIC', color: 'text-neon-purple' },
  { tier: 'rare', chance: 0.28, mult: 1.8, label: 'RARE', color: 'text-neon-cyan' },
  { tier: 'common', chance: 0.55, mult: 1.05, label: 'COMMON', color: 'text-muted-foreground' },
];

function rollTier(): (typeof TIERS)[number] {
  let r = Math.random();
  for (const t of TIERS) {
    if (r <= t.chance) return t;
    r -= t.chance;
  }
  return TIERS[TIERS.length - 1];
}

export const RelicDrawGame = ({ balance, onWin, onLose, onBetPlaced }: RelicDrawGameProps) => {
  const [betAmount, setBetAmount] = useState(8);
  const [rolling, setRolling] = useState(false);
  const [last, setLast] = useState<{ tier: Tier; label: string; profit: number; mult: number } | null>(null);

  const drawRelic = () => {
    if (rolling) return;
    if (betAmount <= 0 || betAmount > balance) return;
    setRolling(true);
    setLast(null);
    (onBetPlaced ?? onLose)(betAmount);
    playSound('spin');

    setTimeout(() => {
      const r = rollTier();
      const payout = betAmount * r.mult;
      const profit = payout - betAmount;
      setLast({ tier: r.tier, label: r.label, profit, mult: r.mult });
      onWin(payout);
      if (profit > 0) playSound('win');
      toast.success(`${r.label} relic • ${r.mult.toFixed(2)}x`);
      setRolling(false);
    }, 900);
  };

  return (
    <div className="game-card space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-neon-purple/20 glow-purple">
          <Sparkles className="w-6 h-6 text-neon-purple" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Relic Draw</h2>
          <p className="text-muted-foreground text-sm">Gacha-style pull with rarity multipliers.</p>
        </div>
      </div>

      <div className="relative rounded-xl border border-neon-purple/25 bg-black/20 p-4 min-h-[170px] flex items-center justify-center overflow-hidden">
        {rolling && (
          <>
            <div className="absolute inset-0 summon-rays opacity-55" />
            <div className="absolute inset-0 summon-ring opacity-50" />
            <div className="absolute left-1/2 top-1/2 w-32 h-44 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neon-cyan/60 bg-neon-purple/10 animate-gacha-card-reveal" />
          </>
        )}
        {rolling ? (
          <div className="relative z-10 text-center animate-limbo-roll-shake">
            <p className="font-display text-3xl text-neon-cyan tracking-[0.2em]">PULLING...</p>
            <p className="text-xs text-gold mt-2 tracking-widest animate-pulse">ARCANE REVEAL</p>
          </div>
        ) : last ? (
          <div className="relative z-10 text-center animate-pop">
            <p className={`font-display text-3xl font-black tracking-wider ${TIERS.find(t => t.tier === last.tier)?.color}`}>{last.label}</p>
            <p className="text-sm text-muted-foreground mt-1">{last.mult.toFixed(2)}x multiplier</p>
            <p className={`font-display text-xl mt-2 ${last.profit >= 0 ? 'text-win' : 'text-lose'}`}>
              {last.profit >= 0 ? '+' : '-'}${Math.abs(last.profit).toFixed(2)}
            </p>
          </div>
        ) : (
          <div className="relative z-10 text-center">
            <p className="font-display text-2xl text-gold tracking-widest">SUMMON A RELIC</p>
            <p className="text-xs text-muted-foreground mt-2">Mythic chance: 1%</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {TIERS.map((t) => (
          <Badge key={t.tier} variant="outline" className={`justify-center ${t.color} border-border/60`}>
            {t.label}
          </Badge>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="bg-secondary border-border"
            disabled={rolling}
          />
          <Button variant="outline" onClick={() => setBetAmount(Math.floor(balance / 2))} disabled={rolling}>
            1/2
          </Button>
          <Button variant="outline" onClick={() => setBetAmount(Math.floor(balance))} disabled={rolling}>
            Max
          </Button>
        </div>
        <Button
          onClick={drawRelic}
          disabled={rolling || betAmount <= 0 || betAmount > balance}
          className="w-full bg-neon-purple hover:bg-neon-purple/80"
        >
          {rolling ? 'Drawing...' : 'Draw Relic'}
        </Button>
      </div>
    </div>
  );
};

