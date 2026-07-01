import { useCallback, useEffect, useState, useMemo } from 'react';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { playSound } from '@/hooks/useSounds';
import { BetChips } from '@/components/BetChips';

interface LimboGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

export const LimboGame = ({ balance, onWin, onLose, onBetPlaced }: LimboGameProps) => {
  const [betAmount, setBetAmount] = useState(25);
  const [targetMultiplier, setTargetMultiplier] = useState(2);
  const [result, setResult] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [autoRunnerEnabled, setAutoRunnerEnabled] = useState(false);
  const [autoRunnerMode, setAutoRunnerMode] = useState<'untilBroke' | 'infinite'>('untilBroke');
  const [roundsPerMin, setRoundsPerMin] = useState(50);
  const [rollPhantom, setRollPhantom] = useState(1.5);

  const winChance = (1 / targetMultiplier) * 100;

  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => {
      setRollPhantom(1.01 + Math.random() * 42);
    }, 60);
    return () => clearInterval(t);
  }, [isPlaying]);

  const phantomDisplay = useMemo(() => rollPhantom.toFixed(2), [rollPhantom]);

  const play = useCallback(() => {
    if (betAmount > balance) {
      toast.error('Insufficient balance!');
      setAutoRunnerEnabled(false);
      return;
    }
    if (betAmount <= 0) {
      toast.error('Bet must be greater than 0!');
      return;
    }

    setIsPlaying(true);
    setShowResult(false);
    (onBetPlaced ?? onLose)(betAmount);
    playSound('spin');

    setTimeout(() => {
      const random = Math.random();
      const generatedMultiplier = Math.max(1.01, Math.floor((1 / (1 - random)) * 100) / 100);

      setResult(generatedMultiplier);
      setShowResult(true);
      setIsPlaying(false);

      if (generatedMultiplier >= targetMultiplier) {
        const winnings = betAmount * targetMultiplier;
        onWin(winnings);
        playSound('win');
        toast.success(`🎯 ${generatedMultiplier.toFixed(2)}x! +$${(winnings - betAmount).toFixed(2)}`);
      } else {
        onLose(betAmount);
        playSound('lose');
        toast.error(`${generatedMultiplier.toFixed(2)}x — below ${targetMultiplier.toFixed(2)}x`);
      }
    }, 350);
  }, [balance, betAmount, onBetPlaced, onLose, onWin, targetMultiplier]);

  useEffect(() => {
    if (!autoRunnerEnabled || isPlaying) return;

    const canAfford = betAmount <= balance;
    if (!canAfford && autoRunnerMode === 'untilBroke') {
      setAutoRunnerEnabled(false);
      toast.info('Limbo auto-runner stopped: insufficient balance.');
      return;
    }
    if (!canAfford && autoRunnerMode === 'infinite') return;

    const intervalMs = Math.max(300, 60000 / Math.max(1, roundsPerMin));
    const t = setTimeout(() => play(), intervalMs * (0.8 + Math.random() * 0.2));
    return () => clearTimeout(t);
  }, [autoRunnerEnabled, autoRunnerMode, balance, betAmount, isPlaying, play, roundsPerMin]);

  const won = result !== null && result >= targetMultiplier;

  return (
    <div className="game-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-orange-500/20 rounded-lg" style={{ boxShadow: '0 0 20px hsl(30 100% 50% / 0.3)' }}>
          <Target className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Limbo</h2>
          <p className="text-muted-foreground text-sm">Beat the target multiplier</p>
        </div>
      </div>

      <div className={`relative h-40 bg-secondary rounded-xl flex items-center justify-center overflow-hidden transition-all duration-500 ${showResult && won ? 'animate-win-flash' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/30" />

        {result !== null && showResult ? (
          <div className={`font-display text-7xl font-bold transition-all duration-500 animate-pop ${won ? 'text-win glow-green' : 'text-lose glow-red'}`}>
            {result.toFixed(2)}x
          </div>
        ) : isPlaying ? (
          <div className="font-display text-6xl font-bold text-foreground/90 tabular-nums animate-limbo-roll-shake">
            {phantomDisplay}x
          </div>
        ) : (
          <div className="text-center">
            <div className="font-display text-5xl text-muted-foreground">{targetMultiplier.toFixed(2)}x</div>
            <div className="text-sm text-muted-foreground mt-2">Target</div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Target: {targetMultiplier.toFixed(2)}x</span>
          <span className="text-sm text-muted-foreground">Win Chance: {winChance.toFixed(1)}%</span>
        </div>
        <Slider
          value={[targetMultiplier]}
          onValueChange={([v]) => setTargetMultiplier(v)}
          min={1.1}
          max={100}
          step={0.1}
          className="py-4"
          disabled={isPlaying}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary rounded-lg p-4 text-center game-tile">
          <div className="text-sm text-muted-foreground">Win Chance</div>
          <div className="font-display text-xl font-bold text-primary">{winChance.toFixed(1)}%</div>
        </div>
        <div className="bg-secondary rounded-lg p-4 text-center game-tile">
          <div className="text-sm text-muted-foreground">Payout</div>
          <div className="font-display text-xl font-bold text-gold">{targetMultiplier.toFixed(2)}x</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-3 rounded-lg border border-orange-400/30 bg-black/20 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-display text-orange-300">Auto Runner</p>
            <div className="flex gap-2 items-center">
              <Button size="sm" variant={autoRunnerMode === 'untilBroke' ? 'default' : 'outline'} onClick={() => setAutoRunnerMode('untilBroke')} className="text-xs">Till Broke</Button>
              <Button size="sm" variant={autoRunnerMode === 'infinite' ? 'default' : 'outline'} onClick={() => setAutoRunnerMode('infinite')} className="text-xs">∞</Button>
              <Button size="sm" variant={autoRunnerEnabled ? 'default' : 'outline'} onClick={() => setAutoRunnerEnabled(v => !v)} className={autoRunnerEnabled ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}>
                {autoRunnerEnabled ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Rounds/min:</span>
            <Input type="number" min={1} max={300} step={10} value={roundsPerMin} onChange={(e) => setRoundsPerMin(Math.max(1, parseInt(e.target.value || '1', 10)))} className="bg-secondary border-border text-sm w-20" />
            <span className="text-orange-400 font-bold">{roundsPerMin}</span>
          </div>
        </div>

        <BetChips value={betAmount} onChange={setBetAmount} balance={balance} disabled={isPlaying} />
        <div className="flex gap-2">
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="font-display text-lg bg-secondary border-border"
            disabled={isPlaying}
          />
        </div>

        <Button
          className="w-full h-14 font-display text-lg bg-orange-500 hover:bg-orange-600 transition-all duration-300 hover:scale-[1.02]"
          style={{ boxShadow: '0 0 20px hsl(30 100% 50% / 0.3)' }}
          disabled={isPlaying || balance === 0}
          onClick={play}
        >
          {isPlaying ? 'Playing…' : `Bet ${targetMultiplier.toFixed(2)}x`}
        </Button>
      </div>
    </div>
  );
};
