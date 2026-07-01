import { useCallback, useEffect, useState } from 'react';
import { Dices, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { playSound } from '@/hooks/useSounds';
import { BetChips } from '@/components/BetChips';

interface DiceGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
}

export const DiceGame = ({ balance, onWin, onLose }: DiceGameProps) => {
  const [betAmount, setBetAmount] = useState(25);
  const [target, setTarget] = useState(50);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [rollOver, setRollOver] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [autoBet, setAutoBet] = useState(false);
  const [streak, setStreak] = useState(0);

  const winChance = rollOver ? 100 - target : target;
  const multiplier = Math.max(1.01, 100 / winChance);

  const handleRoll = useCallback(() => {
    if (betAmount > balance) {
      toast.error('Insufficient balance!');
      setAutoBet(false);
      return;
    }
    if (betAmount <= 0) {
      toast.error('Bet must be greater than 0!');
      return;
    }

    setIsRolling(true);
    setShowResult(false);
    playSound('spin');

    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setLastRoll(Math.random() * 100);
      rollCount++;
      if (rollCount > 6) {
        clearInterval(rollInterval);

        const roll = Math.random() * 100;
        setLastRoll(roll);
        setShowResult(true);

        const won = rollOver ? roll > target : roll < target;

        if (won) {
          const winnings = betAmount * multiplier;
          onWin(winnings - betAmount);
          playSound('win');
          setStreak(s => s + 1);
          toast.success(`🎉 +$${(winnings - betAmount).toFixed(2)}  [${roll.toFixed(2)}]`);
        } else {
          onLose(betAmount);
          playSound('lose');
          setStreak(0);
          toast.error(`💀 -$${betAmount.toFixed(2)}  [${roll.toFixed(2)}]`);
        }

        setIsRolling(false);
      }
    }, 40);
  }, [balance, betAmount, multiplier, onLose, onWin, rollOver, target]);

  useEffect(() => {
    if (!autoBet || isRolling) return;
    if (betAmount > balance) {
      setAutoBet(false);
      toast.info('Auto-bet stopped: insufficient balance.');
      return;
    }
    const t = setTimeout(() => handleRoll(), 320);
    return () => clearTimeout(t);
  }, [autoBet, isRolling, balance, betAmount, handleRoll]);

  const won = lastRoll !== null && (rollOver ? lastRoll > target : lastRoll < target);

  return (
    <div className="game-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/20 rounded-lg glow-green">
          <Dices className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Dice</h2>
          <p className="text-muted-foreground text-sm">Roll the dice, beat the target</p>
        </div>
        {streak >= 2 && (
          <div className="ml-auto px-3 py-1 bg-win/20 border border-win/40 rounded-lg animate-pulse">
            <span className="font-display text-sm font-bold text-win">🔥 {streak} streak</span>
          </div>
        )}
      </div>

      <div className={`relative h-36 bg-secondary rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 ${showResult && won ? 'animate-win-flash ring-2 ring-win/50' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-lose/10 via-transparent to-win/10" />
        {showResult && (
          <div className={`absolute inset-0 ${won ? 'bg-gradient-radial from-win/20 to-transparent' : 'bg-gradient-radial from-lose/20 to-transparent'} animate-pulse`} />
        )}
        {lastRoll !== null ? (
          <div className={`font-display text-7xl font-bold transition-all duration-150 tabular-nums ${
            isRolling ? 'text-muted-foreground blur-[2px] animate-limbo-roll-shake' :
            showResult ? (won ? 'text-win glow-green animate-number-pop' : 'text-lose glow-red animate-shake') : 'text-foreground'
          }`}>
            {lastRoll.toFixed(2)}
          </div>
        ) : (
          <div className="font-display text-4xl text-muted-foreground animate-pulse">
            Roll to play
          </div>
        )}
        {isRolling && (
          <div className="absolute top-3 right-3">
            <Dices className="w-8 h-8 text-primary animate-dice-roll" />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Target: {target.toFixed(0)}</span>
          <div className="flex gap-2">
            <Button variant={rollOver ? 'default' : 'secondary'} size="sm" onClick={() => { setRollOver(true); playSound('click'); }} className="gap-1">
              <TrendingUp className="w-4 h-4" /> Over
            </Button>
            <Button variant={!rollOver ? 'default' : 'secondary'} size="sm" onClick={() => { setRollOver(false); playSound('click'); }} className="gap-1">
              <TrendingDown className="w-4 h-4" /> Under
            </Button>
          </div>
        </div>
        <Slider value={[target]} onValueChange={([v]) => setTarget(v)} min={2} max={98} step={1} className="py-4" disabled={isRolling} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary rounded-lg p-4 text-center game-tile">
          <div className="text-sm text-muted-foreground">Win Chance</div>
          <div className="font-display text-xl font-bold text-primary">{winChance.toFixed(0)}%</div>
        </div>
        <div className="bg-secondary rounded-lg p-4 text-center game-tile">
          <div className="text-sm text-muted-foreground">Multiplier</div>
          <div className="font-display text-xl font-bold text-gold">{multiplier.toFixed(2)}x</div>
        </div>
      </div>

      <div className="space-y-3">
        <BetChips value={betAmount} onChange={setBetAmount} balance={balance} disabled={isRolling} />
        <div className="flex gap-2">
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="font-display text-lg bg-secondary border-border"
            min={0}
            max={balance}
            disabled={isRolling}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            className="h-14 font-display text-lg glow-green transition-all duration-200 hover:scale-[1.02]"
            disabled={isRolling || balance === 0}
            onClick={handleRoll}
          >
            {isRolling ? 'Rolling…' : `Roll ${rollOver ? 'Over' : 'Under'} ${target}`}
          </Button>
          <Button
            variant={autoBet ? 'default' : 'secondary'}
            className={`h-14 font-display text-base gap-2 transition-all duration-200 hover:scale-[1.02] ${autoBet ? 'bg-win text-black glow-green' : ''}`}
            disabled={balance === 0}
            onClick={() => setAutoBet(v => !v)}
          >
            <RefreshCw className={`w-4 h-4 ${autoBet ? 'animate-spin' : ''}`} />
            {autoBet ? 'AUTO ON' : 'AUTO BET'}
          </Button>
        </div>
      </div>
    </div>
  );
};
