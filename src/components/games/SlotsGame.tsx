import { useCallback, useEffect, useState } from 'react';
import { Cherry } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { playSound } from '@/hooks/useSounds';
import { BetChips } from '@/components/BetChips';

interface SlotsGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
const PAYOUTS: { [key: string]: number } = {
  '🍒': 49,
  '🍋': 49,
  '🍊': 49,
  '🍇': 49,
  '⭐': 49,
  '💎': 49,
  '7️⃣': 343,
};

export const SlotsGame = ({ balance, onWin, onLose, onBetPlaced }: SlotsGameProps) => {
  const [betAmount, setBetAmount] = useState(25);
  const [reels, setReels] = useState(['🍒', '🍋', '🍊']);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [isWin, setIsWin] = useState(false);
  const [autoRunnerEnabled, setAutoRunnerEnabled] = useState(false);
  const [autoRunnerMode, setAutoRunnerMode] = useState<'untilBroke' | 'infinite'>('untilBroke');
  const [spinsPerMin, setSpinsPerMin] = useState(30);

  const spin = useCallback(() => {
    if (betAmount > balance) {
      toast.error('Insufficient balance!');
      setAutoRunnerEnabled(false);
      return;
    }
    if (betAmount <= 0) {
      toast.error('Bet must be greater than 0!');
      return;
    }

    setSpinning(true);
    setLastWin(null);
    setIsWin(false);
    (onBetPlaced ?? onLose)(betAmount);
    playSound('spin');

    let spins = 0;
    const maxSpins = 10;
    const interval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
      spins++;

      if (spins >= maxSpins) {
        clearInterval(interval);

        const finalReels = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ];

        setReels(finalReels);
        setSpinning(false);

        if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
          const multiplier = PAYOUTS[finalReels[0]];
          const winnings = betAmount * multiplier;
          onWin(winnings);
          setLastWin(winnings - betAmount);
          setIsWin(true);
          playSound('win');
          toast.success(`🎰 JACKPOT! ${finalReels[0]}${finalReels[0]}${finalReels[0]} +$${(winnings - betAmount).toFixed(2)}!`);
        } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
          const winnings = betAmount * 7;
          onWin(winnings);
          setLastWin(winnings - betAmount);
          setIsWin(true);
          playSound('win');
          toast.success(`🎰 Two match! +$${(winnings - betAmount).toFixed(2)}`);
        } else {
          onLose(betAmount);
          setLastWin(-betAmount);
          setIsWin(false);
          playSound('lose');
          toast.error('No match — try again!');
        }
      }
    }, 65);
  }, [balance, betAmount, onBetPlaced, onLose, onWin]);

  useEffect(() => {
    if (!autoRunnerEnabled || spinning) return;

    const canAfford = betAmount <= balance;
    if (!canAfford && autoRunnerMode === 'untilBroke') {
      setAutoRunnerEnabled(false);
      toast.info('Slots auto-runner stopped: insufficient balance.');
      return;
    }
    if (!canAfford && autoRunnerMode === 'infinite') return;

    const intervalMs = Math.max(500, 60000 / Math.max(1, spinsPerMin));
    const t = setTimeout(() => spin(), intervalMs * (0.78 + Math.random() * 0.22));
    return () => clearTimeout(t);
  }, [autoRunnerEnabled, autoRunnerMode, balance, betAmount, spin, spinsPerMin, spinning]);

  return (
    <div className="game-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-neon-purple/20 rounded-lg glow-purple">
          <Cherry className="w-6 h-6 text-neon-purple" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Slots</h2>
          <p className="text-muted-foreground text-sm">Match symbols to win</p>
        </div>
      </div>

      <div className={`bg-gradient-to-b from-neon-purple/20 to-neon-purple/5 rounded-xl p-6 ${isWin ? 'animate-win-flash' : ''}`}>
        <div className="bg-secondary rounded-xl p-4 border-2 border-gold/30">
          <div className="flex justify-center gap-2">
            {reels.map((symbol, i) => (
              <div
                key={i}
                className={`w-24 h-24 overflow-hidden bg-background rounded-lg flex items-center justify-center text-5xl border border-border game-tile ${
                  spinning ? 'animate-slots-reel-blur' : isWin ? 'animate-bounce-in' : ''
                }`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {symbol}
              </div>
            ))}
          </div>
        </div>

        {lastWin !== null && (
          <div className="text-center mt-4 animate-pop">
            <span className={`font-display text-2xl font-bold ${lastWin > 0 ? 'text-win glow-green' : 'text-lose'}`}>
              {lastWin > 0 ? `+$${lastWin.toFixed(2)}` : `-$${Math.abs(lastWin).toFixed(2)}`}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 text-xs text-center">
        {Object.entries(PAYOUTS).slice(0, 4).map(([symbol, payout]) => (
          <div key={symbol} className="bg-secondary rounded p-2 game-tile">
            <div className="text-2xl">{symbol}{symbol}{symbol}</div>
            <div className="font-display text-gold">{payout}x</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        {Object.entries(PAYOUTS).slice(4).map(([symbol, payout]) => (
          <div key={symbol} className="bg-secondary rounded p-2 game-tile">
            <div className="text-2xl">{symbol}{symbol}{symbol}</div>
            <div className="font-display text-gold">{payout}x</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="p-3 rounded-lg border border-gold/20 bg-black/20 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gold">Auto Runner</p>
              <p className="text-[11px] text-muted-foreground">Auto-spin with your current bet.</p>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant={autoRunnerMode === 'untilBroke' ? 'default' : 'outline'}
                onClick={() => setAutoRunnerMode('untilBroke')}
                className="text-xs"
              >
                Till Broke
              </Button>
              <Button
                size="sm"
                variant={autoRunnerMode === 'infinite' ? 'default' : 'outline'}
                onClick={() => setAutoRunnerMode('infinite')}
                className="text-xs"
              >
                ∞
              </Button>
              <Button
                size="sm"
                variant={autoRunnerEnabled ? 'default' : 'outline'}
                onClick={() => setAutoRunnerEnabled(v => !v)}
                className={autoRunnerEnabled ? 'bg-gold text-black hover:bg-gold/90' : ''}
              >
                {autoRunnerEnabled ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Spins/min:</span>
            <Input
              type="number"
              min={1}
              max={120}
              step={5}
              value={spinsPerMin}
              onChange={(e) => setSpinsPerMin(Math.max(1, parseInt(e.target.value || '1', 10)))}
              className="bg-secondary border-border text-sm w-20"
            />
            <span className="text-gold font-bold">{spinsPerMin}</span>
          </div>
        </div>

        <BetChips value={betAmount} onChange={setBetAmount} balance={balance} disabled={spinning} />
        <div className="flex gap-2">
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="font-display text-lg bg-secondary border-border"
            disabled={spinning}
          />
        </div>

        <Button
          className="w-full h-14 font-display text-lg bg-neon-purple hover:bg-neon-purple/80 glow-purple transition-all duration-200 hover:scale-[1.02]"
          disabled={spinning || balance === 0}
          onClick={spin}
        >
          {spinning ? '🎰 Spinning…' : 'SPIN'}
        </Button>
      </div>
    </div>
  );
};
