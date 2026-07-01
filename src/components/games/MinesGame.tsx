import { useCallback, useEffect, useState } from 'react';
import { Bomb, Gem, Lightbulb, Target, Shield, Zap, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { playSound } from '@/hooks/useSounds';
import { BetChips } from '@/components/BetChips';

interface MinesGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

type GamePlan = 'manual' | 'custom' | 'corners' | 'edges' | 'center' | 'diagonal' | 'random5';

const GAME_PLANS: { id: GamePlan; name: string; icon: typeof Target; description: string; tiles: number[] }[] = [
  { id: 'manual', name: 'Manual', icon: Target, description: 'Pick your own tiles', tiles: [] },
  {
    id: 'custom',
    name: 'My picks',
    icon: Grid3X3,
    description: 'Tap tiles in order (Keno-style). Auto-runner reveals in that sequence each round.',
    tiles: [],
  },
  { id: 'corners', name: 'Corners', icon: Shield, description: 'Start with 4 corners', tiles: [0, 4, 20, 24] },
  { id: 'edges', name: 'Edges', icon: Zap, description: 'Play all edges first', tiles: [0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24] },
  { id: 'center', name: 'Center', icon: Target, description: 'Focus on center 9', tiles: [6, 7, 8, 11, 12, 13, 16, 17, 18] },
  { id: 'diagonal', name: 'Diagonal', icon: Lightbulb, description: 'X pattern strategy', tiles: [0, 6, 12, 18, 24, 4, 8, 16, 20] },
  { id: 'random5', name: 'Quick 5', icon: Gem, description: 'Auto-reveal 5 random', tiles: [] },
];

export const MinesGame = ({ balance, onWin, onLose, onBetPlaced }: MinesGameProps) => {
  const [betAmount, setBetAmount] = useState(25);
  const [mineCount, setMineCount] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [grid, setGrid] = useState<('hidden' | 'gem' | 'mine')[]>(Array(25).fill('hidden'));
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [lastRevealed, setLastRevealed] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<GamePlan>('manual');
  const [planTilesRemaining, setPlanTilesRemaining] = useState<number[]>([]);
  const [showPlans, setShowPlans] = useState(false);
  const [autoRunnerEnabled, setAutoRunnerEnabled] = useState(false);
  const [autoRunnerMode, setAutoRunnerMode] = useState<'untilBroke' | 'infinite'>('untilBroke');
  const [autoRevealMs, setAutoRevealMs] = useState(260);
  /** Tile indices 0–24 in reveal order (Keno-style custom auto path) */
  const [customPickOrder, setCustomPickOrder] = useState<number[]>([]);

  const toggleCustomPick = (index: number) => {
    setCustomPickOrder((prev) => {
      const at = prev.indexOf(index);
      if (at >= 0) return prev.filter((_, i) => i !== at);
      return [...prev, index];
    });
  };

  const calculateMultiplier = (revealed: number, mines: number) => {
    const totalTiles = 25;
    const safeTiles = totalTiles - mines;
    let probability = 1;
    for (let i = 0; i < revealed; i++) {
      probability *= (safeTiles - i) / (totalTiles - i);
    }
    return Math.max(1, 1 / probability);
  };

  const startGame = useCallback(() => {
    if (betAmount > balance) {
      toast.error('Insufficient balance!');
      return;
    }
    if (betAmount <= 0) {
      toast.error('Bet must be greater than 0!');
      return;
    }
    if (selectedPlan === 'custom' && customPickOrder.length === 0) {
      toast.error('Pick at least one tile for My picks (tap the grid below).');
      return;
    }

    const positions: number[] = [];
    while (positions.length < mineCount) {
      const pos = Math.floor(Math.random() * 25);
      if (!positions.includes(pos)) positions.push(pos);
    }

    setMinePositions(positions);
    setGrid(Array(25).fill('hidden'));
    setRevealedCount(0);
    setCurrentMultiplier(1);
    setGameActive(true);
    setLastRevealed(null);
    (onBetPlaced ?? onLose)(betAmount);
    playSound('click');

    // Set up game plan
    const plan = GAME_PLANS.find(p => p.id === selectedPlan);
    if (selectedPlan === 'custom') {
      setPlanTilesRemaining([...customPickOrder]);
    } else if (plan && plan.id === 'random5') {
      // Generate 5 random safe tiles to reveal
      const safeTiles = Array.from({ length: 25 }, (_, i) => i).filter(i => !positions.includes(i));
      const shuffled = safeTiles.sort(() => Math.random() - 0.5).slice(0, 5);
      setPlanTilesRemaining(shuffled);
    } else if (plan && plan.tiles.length > 0) {
      // Filter out any tiles that are mines
      const safePlanTiles = plan.tiles.filter(t => !positions.includes(t));
      setPlanTilesRemaining(safePlanTiles);
    } else {
      setPlanTilesRemaining([]);
    }
  }, [betAmount, balance, customPickOrder, mineCount, onBetPlaced, onLose, selectedPlan]);

  const revealTile = (index: number) => {
    if (!gameActive || grid[index] !== 'hidden') return;

    const newGrid = [...grid];
    setLastRevealed(index);
    
    if (minePositions.includes(index)) {
      minePositions.forEach(pos => newGrid[pos] = 'mine');
      setGrid(newGrid);
      setGameActive(false);
      onLose(betAmount);
      playSound('lose');
      toast.error('💥 You hit a mine!');
    } else {
      newGrid[index] = 'gem';
      const newRevealedCount = revealedCount + 1;
      const newMultiplier = calculateMultiplier(newRevealedCount, mineCount);
      
      setGrid(newGrid);
      setRevealedCount(newRevealedCount);
      setCurrentMultiplier(newMultiplier);
      playSound('reveal');

      // Update plan tiles remaining
      setPlanTilesRemaining(prev => prev.filter(t => t !== index));

      if (newRevealedCount === 25 - mineCount) {
        const winnings = betAmount * newMultiplier;
        onWin(winnings);
        setGameActive(false);
        toast.success(`🎉 Perfect game! Won $${(winnings - betAmount).toFixed(2)}`);
      }
    }
  };

  const autoRevealNext = useCallback(() => {
    if (!gameActive || planTilesRemaining.length === 0) return;
    
    const nextTile = planTilesRemaining[0];
    if (grid[nextTile] === 'hidden') {
      revealTile(nextTile);
    }
  }, [gameActive, grid, planTilesRemaining]);

  const cashOut = useCallback(() => {
    if (!gameActive || revealedCount === 0) return;
    
    const winnings = betAmount * currentMultiplier;
    onWin(winnings);
    setGameActive(false);
    playSound('cashout');
    
    const newGrid = [...grid];
    minePositions.forEach(pos => newGrid[pos] = 'mine');
    setGrid(newGrid);
    
    toast.success(`💎 Cashed out at ${currentMultiplier.toFixed(2)}x! Won $${(winnings - betAmount).toFixed(2)}`);
  }, [betAmount, currentMultiplier, gameActive, minePositions, onWin, revealedCount]);

  // Auto reveal selected plan tiles while round is active
  useEffect(() => {
    if (!autoRunnerEnabled || !gameActive) return;
    if (selectedPlan === 'manual') return;

    const t = setInterval(() => {
      if (planTilesRemaining.length > 0) {
        autoRevealNext();
      } else if (gameActive && revealedCount > 0) {
        // If planned tiles are exhausted, secure profit and continue next round
        cashOut();
      }
    }, Math.max(100, autoRevealMs));

    return () => clearInterval(t);
  }, [
    autoRevealMs,
    autoRevealNext,
    autoRunnerEnabled,
    cashOut,
    gameActive,
    planTilesRemaining.length,
    revealedCount,
    selectedPlan,
  ]);

  // Auto start next round
  useEffect(() => {
    if (!autoRunnerEnabled || gameActive) return;
    if (selectedPlan === 'manual') return;

    const canAfford = betAmount <= balance;
    if (!canAfford && autoRunnerMode === 'untilBroke') {
      setAutoRunnerEnabled(false);
      toast.info('Auto-runner stopped: insufficient balance.');
      return;
    }
    if (!canAfford && autoRunnerMode === 'infinite') {
      return;
    }

    const t = setTimeout(() => startGame(), 260 + Math.random() * 220);
    return () => clearTimeout(t);
  }, [autoRunnerEnabled, autoRunnerMode, balance, betAmount, gameActive, selectedPlan, startGame]);

  const getPlanTileClass = (index: number) => {
    if (!gameActive || selectedPlan === 'manual') return '';
    if (planTilesRemaining.includes(index)) return 'ring-2 ring-neon-cyan ring-offset-1 ring-offset-background';
    return '';
  };

  const getCustomPickerClass = (index: number) => {
    const order = customPickOrder.indexOf(index);
    const on = order >= 0;
    return `aspect-square rounded-md text-xs font-display font-bold transition-all duration-200 ${
      on
        ? 'bg-primary text-primary-foreground ring-2 ring-neon-cyan scale-[1.02]'
        : 'bg-secondary hover:bg-secondary/80 text-muted-foreground game-tile'
    }`;
  };

  return (
    <div className="game-card space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neon-cyan/20 rounded-lg glow-cyan">
            <Gem className="w-6 h-6 text-neon-cyan" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Mines</h2>
            <p className="text-muted-foreground text-sm">Find gems, avoid mines!</p>
          </div>
        </div>
        {!gameActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPlans(!showPlans)}
            className="text-neon-cyan"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            Plans
          </Button>
        )}
      </div>

      {/* Game Plans */}
      {showPlans && !gameActive && (
        <div className="grid grid-cols-3 gap-2 p-3 bg-card/50 rounded-lg border border-border animate-fade-in">
          {GAME_PLANS.map(plan => {
            const Icon = plan.icon;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`p-2 rounded-lg text-center transition-all ${
                  selectedPlan === plan.id
                    ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                    : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4 mx-auto mb-1" />
                <div className="text-xs font-medium">{plan.name}</div>
              </button>
            );
          })}
          <div className="col-span-3 text-xs text-muted-foreground text-center mt-1">
            {GAME_PLANS.find(p => p.id === selectedPlan)?.description}
          </div>
        </div>
      )}

      {/* Keno-style tile order for "My picks" + auto-runner (always visible when plan is custom) */}
      {selectedPlan === 'custom' && !gameActive && (
        <div className="space-y-2 rounded-lg border border-neon-cyan/25 bg-black/25 p-3 animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-neon-cyan font-medium">
              My picks — tap in reveal order (like Keno). Tap again to remove. Numbers show order while building.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 h-8 text-xs border-muted-foreground/40"
              onClick={() => setCustomPickOrder([])}
              disabled={customPickOrder.length === 0}
            >
              Clear
            </Button>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 25 }, (_, i) => i).map((index) => {
              const order = customPickOrder.indexOf(index);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleCustomPick(index)}
                  className={getCustomPickerClass(index)}
                >
                  {order >= 0 ? order + 1 : index + 1}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            {customPickOrder.length === 0
              ? 'Pick at least one tile to start or run auto.'
              : `${customPickOrder.length} tile${customPickOrder.length === 1 ? '' : 's'} in sequence`}
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-5 gap-2">
        {grid.map((tile, index) => (
          <button
            key={index}
            onClick={() => revealTile(index)}
            disabled={!gameActive || tile !== 'hidden'}
            className={`aspect-square rounded-lg flex items-center justify-center text-2xl game-tile ${getPlanTileClass(index)} ${
              tile === 'hidden' 
                ? 'hover:scale-105 cursor-pointer hover:bg-secondary/80' 
                : tile === 'gem'
                ? 'bg-neon-cyan/20 border border-neon-cyan glow-cyan'
                : 'bg-lose/20 border border-lose glow-red'
            } ${lastRevealed === index && tile !== 'hidden' ? 'animate-mines-tile-snap' : ''}`}
          >
            {tile === 'gem' && <Gem className="w-6 h-6 text-neon-cyan animate-bounce-in" />}
            {tile === 'mine' && <Bomb className="w-6 h-6 text-lose animate-shake" />}
          </button>
        ))}
      </div>

      {/* Stats */}
      {gameActive && (
        <div className="grid grid-cols-2 gap-4 animate-slide-up">
          <div className="bg-secondary rounded-lg p-4 text-center game-tile">
            <div className="text-sm text-muted-foreground">Gems Found</div>
            <div className="font-display text-xl font-bold text-neon-cyan">{revealedCount}</div>
          </div>
          <div className="bg-secondary rounded-lg p-4 text-center game-tile">
            <div className="text-sm text-muted-foreground">Multiplier</div>
            <div className="font-display text-xl font-bold text-gold">{currentMultiplier.toFixed(2)}x</div>
          </div>
        </div>
      )}

      {/* Auto-reveal button for plans */}
      {gameActive && selectedPlan !== 'manual' && planTilesRemaining.length > 0 && (
        <Button
          variant="outline"
          onClick={autoRevealNext}
          className="w-full border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20"
        >
          <Zap className="w-4 h-4 mr-2" />
          Auto-Reveal Next ({planTilesRemaining.length} remaining)
        </Button>
      )}

      {/* Auto Runner */}
      {!gameActive && (
        <div className="p-3 rounded-lg border border-gold/20 bg-black/20 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gold">Auto Runner</p>
              <p className="text-[11px] text-muted-foreground">
                Runs your plan repeatedly and cashes out when the sequence finishes. Use <span className="text-neon-cyan">My picks</span> for a Keno-style tile order.
              </p>
            </div>
            <Button
              size="sm"
              variant={autoRunnerEnabled ? 'default' : 'outline'}
              onClick={() => {
                if (selectedPlan === 'manual') {
                  toast.error('Pick a plan first (manual cannot auto-run).');
                  return;
                }
                if (selectedPlan === 'custom' && customPickOrder.length === 0) {
                  toast.error('Choose tiles in My picks first (Plans → My picks).');
                  return;
                }
                setAutoRunnerEnabled(v => !v);
              }}
              className={autoRunnerEnabled ? 'bg-gold text-black hover:bg-gold/90' : ''}
            >
              {autoRunnerEnabled ? 'ON' : 'OFF'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant={autoRunnerMode === 'untilBroke' ? 'default' : 'outline'}
              onClick={() => setAutoRunnerMode('untilBroke')}
              className="text-xs"
            >
              Until Broke
            </Button>
            <Button
              size="sm"
              variant={autoRunnerMode === 'infinite' ? 'default' : 'outline'}
              onClick={() => setAutoRunnerMode('infinite')}
              className="text-xs"
            >
              Infinite
            </Button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Reveal speed</span>
              <span>{Math.round(1000 / Math.max(100, autoRevealMs))} tiles/s</span>
            </div>
            <Slider
              value={[autoRevealMs]}
              onValueChange={([v]) => setAutoRevealMs(v)}
              min={120}
              max={700}
              step={20}
            />
          </div>
        </div>
      )}

      {/* Mine Count Slider */}
      {!gameActive && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Mines: {mineCount}</span>
            <span className="text-sm text-muted-foreground">Max Win: {calculateMultiplier(25 - mineCount, mineCount).toFixed(2)}x</span>
          </div>
          <Slider
            value={[mineCount]}
            onValueChange={([v]) => setMineCount(v)}
            min={1}
            max={24}
            step={1}
          />
        </div>
      )}

      {/* Bet Controls */}
      <div className="space-y-4">
        {!gameActive && (
          <div className="flex gap-2">
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="font-display text-lg bg-secondary border-border"
            />
            <Button variant="secondary" onClick={() => setBetAmount(Math.floor(balance / 2))} className="game-tile">1/2</Button>
            <Button variant="secondary" onClick={() => setBetAmount(Math.floor(balance))} className="game-tile">Max</Button>
          </div>
        )}

        {!gameActive ? (
          <Button
            className="w-full h-14 font-display text-lg bg-neon-cyan hover:bg-neon-cyan/80 glow-cyan transition-all duration-200 hover:scale-[1.02]"
            disabled={balance === 0}
            onClick={startGame}
          >
            Start Game {selectedPlan !== 'manual' && `(${GAME_PLANS.find(p => p.id === selectedPlan)?.name})`}
          </Button>
        ) : (
          <Button
            className="w-full h-14 font-display text-lg bg-gold hover:bg-gold/80 text-accent-foreground glow-gold transition-all duration-200 hover:scale-[1.02]"
            onClick={cashOut}
            disabled={revealedCount === 0}
          >
            Cash Out ${(betAmount * currentMultiplier).toFixed(2)}
          </Button>
        )}
      </div>
    </div>
  );
};
