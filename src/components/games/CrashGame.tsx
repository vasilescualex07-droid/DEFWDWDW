import { useState, useEffect, useRef } from 'react';
import { Rocket, Zap, Target, TrendingUp, Shield, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { playSound } from '@/hooks/useSounds';
import { BetChips } from '@/components/BetChips';

interface CrashGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

type GameState = 'waiting' | 'running' | 'crashed';
type Strategy = 'manual' | 'safe' | 'balanced' | 'risky' | 'martingale';

const STRATEGIES: { id: Strategy; name: string; icon: typeof Target; description: string; autoCashout: number }[] = [
  { id: 'manual', name: 'Manual', icon: Target, description: 'Set your own cashout', autoCashout: 2 },
  { id: 'safe', name: 'Safe', icon: Shield, description: 'Low risk, steady gains', autoCashout: 1.25 },
  { id: 'balanced', name: 'Balanced', icon: TrendingUp, description: 'Moderate risk/reward', autoCashout: 1.75 },
  { id: 'risky', name: 'Risky', icon: Zap, description: 'High risk, big wins', autoCashout: 3.5 },
  { id: 'martingale', name: 'Martingale', icon: Lightbulb, description: 'Double bet on loss', autoCashout: 2 },
];

export const CrashGame = ({ balance, onWin, onLose, onBetPlaced }: CrashGameProps) => {
  const [betAmount, setBetAmount] = useState(25);
  const [baseBet, setBaseBet] = useState(25);
  const [autoCashout, setAutoCashout] = useState(2);
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [multiplier, setMultiplier] = useState(1);
  const [crashPoint, setCrashPoint] = useState(0);
  const [hasBet, setHasBet] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>('manual');
  const [showStrategies, setShowStrategies] = useState(false);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateCrashPoint = () => {
    const random = Math.random();
    return Math.max(1.01, Math.floor((1 / (1 - random)) * 100) / 100);
  };

  const handleStrategyChange = (strategyId: Strategy) => {
    setSelectedStrategy(strategyId);
    const strategy = STRATEGIES.find(s => s.id === strategyId);
    if (strategy && strategyId !== 'manual') {
      setAutoCashout(strategy.autoCashout);
    }
    if (strategyId === 'martingale') {
      setBaseBet(betAmount);
    }
  };

  const startGame = () => {
    if (betAmount > balance) {
      toast.error('Insufficient balance!');
      return;
    }
    if (betAmount <= 0) {
      toast.error('Bet must be greater than 0!');
      return;
    }

    const crash = generateCrashPoint();
    setCrashPoint(crash);
    setGameState('running');
    setMultiplier(1);
    setHasBet(true);
    setHasCashedOut(false);
    (onBetPlaced ?? onLose)(betAmount);
    playSound('spin');

    let currentMultiplier = 1;
    intervalRef.current = setInterval(() => {
      currentMultiplier += 0.012;
      currentMultiplier = Math.round(currentMultiplier * 1000) / 1000;
      setMultiplier(currentMultiplier);

      if (currentMultiplier >= autoCashout && !hasCashedOut) {
        cashOut(currentMultiplier);
        return;
      }

      if (currentMultiplier >= crash) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setGameState('crashed');
        playSound('lose');

        if (selectedStrategy === 'martingale') {
          const newLosses = consecutiveLosses + 1;
          setConsecutiveLosses(newLosses);
          const nextBet = Math.min(baseBet * Math.pow(2, newLosses), balance);
          setBetAmount(nextBet);
        }

        if (!hasCashedOut) {
          onLose(betAmount);
          toast.error(`💥 Crashed at ${crash.toFixed(2)}x!`);
        }
        setTimeout(() => {
          setGameState('waiting');
          setHasBet(false);
          setMultiplier(1);
        }, 1500);
      }
    }, 50);
  };

  const cashOut = (currentMult?: number) => {
    const mult = currentMult || multiplier;
    if (!hasBet || hasCashedOut || gameState !== 'running') return;

    setHasCashedOut(true);
    const winnings = betAmount * mult;
    onWin(winnings);
    playSound('cashout');

    if (selectedStrategy === 'martingale') {
      setConsecutiveLosses(0);
      setBetAmount(baseBet);
    }

    toast.success(`🚀 Cashed out at ${mult.toFixed(2)}x! +$${(winnings - betAmount).toFixed(2)}`);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="game-card space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neon-purple/20 rounded-lg glow-purple">
            <Rocket className="w-6 h-6 text-neon-purple" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Crash</h2>
            <p className="text-muted-foreground text-sm">Cash out before it crashes!</p>
          </div>
        </div>
        {gameState === 'waiting' && (
          <Button variant="ghost" size="sm" onClick={() => setShowStrategies(!showStrategies)} className="text-neon-purple">
            <Lightbulb className="w-4 h-4 mr-1" />
            Plans
          </Button>
        )}
      </div>

      {showStrategies && gameState === 'waiting' && (
        <div className="grid grid-cols-5 gap-2 p-3 bg-card/50 rounded-lg border border-border animate-fade-in">
          {STRATEGIES.map(strategy => {
            const Icon = strategy.icon;
            return (
              <button
                key={strategy.id}
                onClick={() => handleStrategyChange(strategy.id)}
                className={`p-2 rounded-lg text-center transition-all ${
                  selectedStrategy === strategy.id
                    ? 'bg-neon-purple/20 border border-neon-purple text-neon-purple'
                    : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4 mx-auto mb-1" />
                <div className="text-xs font-medium">{strategy.name}</div>
              </button>
            );
          })}
          <div className="col-span-5 text-xs text-muted-foreground text-center mt-1">
            {STRATEGIES.find(s => s.id === selectedStrategy)?.description}
            {selectedStrategy !== 'manual' && ` (Auto: ${autoCashout}x)`}
          </div>
        </div>
      )}

      <div className="relative h-48 bg-secondary rounded-xl flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />

        {gameState === 'running' && (
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-neon-purple/50 rounded-full animate-pulse"
                style={{ left: `${(i * 8.3) % 100}%`, top: `${(i * 13.7) % 100}%`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="text-center animate-fade-in">
            <div className="font-display text-4xl text-muted-foreground mb-2">Place your bet</div>
            <div className="text-sm text-muted-foreground">
              {selectedStrategy !== 'manual' && `Strategy: ${STRATEGIES.find(s => s.id === selectedStrategy)?.name}`}
            </div>
          </div>
        )}

        {gameState === 'running' && (
          <div
            className={`font-display text-7xl font-bold animate-crash-tick-glow ${
              multiplier >= 5 ? 'text-gold glow-gold' :
              multiplier >= 2 ? 'text-win glow-green' : 'text-foreground'
            }`}
            style={{ transform: `scale(${1 + (multiplier - 1) * 0.02})`, transition: 'transform 0.05s ease-out' }}
          >
            {multiplier.toFixed(2)}x
          </div>
        )}

        {gameState === 'crashed' && (
          <div className="text-center">
            <div className="font-display text-6xl font-bold text-lose glow-red mb-2 animate-shake">
              {crashPoint.toFixed(2)}x
            </div>
            <div className="text-lg text-lose font-display animate-pulse">💥 CRASHED!</div>
          </div>
        )}

        {gameState === 'running' && (
          <Rocket
            className="absolute w-8 h-8 text-gold animate-float"
            style={{
              bottom: `${Math.min(80, (multiplier - 1) * 20)}%`,
              left: '50%',
              transform: 'translateX(-50%) rotate(-45deg)',
              filter: 'drop-shadow(0 0 10px hsl(45 100% 50%))'
            }}
          />
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-sm text-muted-foreground mb-1 block">Auto Cashout</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={autoCashout}
              onChange={(e) => setAutoCashout(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
              step={0.1}
              min={1.01}
              className="font-display bg-secondary border-border"
              disabled={gameState === 'running' || selectedStrategy !== 'manual'}
            />
            <span className="text-muted-foreground">x</span>
          </div>
        </div>
        <div className="flex-1">
          <label className="text-sm text-muted-foreground mb-1 block">Potential Win</label>
          <div className="font-display text-xl text-gold">${(betAmount * autoCashout).toFixed(2)}</div>
        </div>
      </div>

      {selectedStrategy === 'martingale' && consecutiveLosses > 0 && (
        <div className="text-center text-sm text-amber-400 animate-pulse">
          Martingale: {consecutiveLosses} losses · next bet ${betAmount.toFixed(2)}
        </div>
      )}

      <div className="space-y-3">
        <BetChips value={betAmount} onChange={(v) => { setBetAmount(v); if (selectedStrategy === 'martingale') setBaseBet(v); }} balance={balance} disabled={gameState === 'running'} />
        <div className="flex gap-2">
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => {
              const val = Math.max(0, parseFloat(e.target.value) || 0);
              setBetAmount(val);
              if (selectedStrategy === 'martingale') setBaseBet(val);
            }}
            className="font-display text-lg bg-secondary border-border"
            min={0}
            max={balance}
            disabled={gameState === 'running'}
          />
        </div>

        {gameState === 'waiting' && (
          <Button className="w-full h-14 font-display text-lg glow-purple bg-neon-purple hover:bg-neon-purple/80 transition-all duration-200 hover:scale-[1.02]" disabled={balance === 0} onClick={startGame}>
            <Zap className="w-5 h-5 mr-2" /> Start Game
          </Button>
        )}
        {gameState === 'running' && !hasCashedOut && (
          <Button className="w-full h-14 font-display text-lg glow-gold bg-gold hover:bg-gold/80 text-accent-foreground animate-pulse-glow transition-all duration-200" onClick={() => cashOut()}>
            Cash Out ${(betAmount * multiplier).toFixed(2)}
          </Button>
        )}
        {gameState === 'running' && hasCashedOut && (
          <Button className="w-full h-14 font-display text-lg" variant="secondary" disabled>Cashed Out! Waiting…</Button>
        )}
        {gameState === 'crashed' && (
          <Button className="w-full h-14 font-display text-lg" variant="secondary" disabled>Crashed! Next round starting…</Button>
        )}
      </div>
    </div>
  );
};
