import { useCallback, useEffect, useState } from 'react';
import { Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { playSound } from '@/hooks/useSounds';

interface KenoGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

const GRID_SIZE = 40;
const MAX_PICKS = 10;

// Fair payouts based on probability
const PAYOUTS: { [picks: number]: { [hits: number]: number } } = {
  1: { 1: 3.8 },
  2: { 1: 1, 2: 9 },
  3: { 2: 2, 3: 25 },
  4: { 2: 1, 3: 4, 4: 70 },
  5: { 3: 2, 4: 12, 5: 200 },
  6: { 3: 1, 4: 5, 5: 50, 6: 500 },
  7: { 3: 1, 4: 2, 5: 15, 6: 100, 7: 1000 },
  8: { 4: 2, 5: 8, 6: 50, 7: 300, 8: 2000 },
  9: { 4: 1, 5: 4, 6: 20, 7: 100, 8: 800, 9: 4000 },
  10: { 5: 2, 6: 10, 7: 50, 8: 300, 9: 2000, 10: 10000 },
};

export const KenoGame = ({ balance, onWin, onLose, onBetPlaced }: KenoGameProps) => {
  const [betAmount, setBetAmount] = useState(25);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hits, setHits] = useState(0);
  const [autoRunnerEnabled, setAutoRunnerEnabled] = useState(false);
  const [autoRunnerMode, setAutoRunnerMode] = useState<'untilBroke' | 'infinite'>('untilBroke');
  const [drawsPerMin, setDrawsPerMin] = useState(15);

  const toggleNumber = (num: number) => {
    if (isDrawing) return;
    
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num));
    } else if (selectedNumbers.length < MAX_PICKS) {
      setSelectedNumbers(prev => [...prev, num]);
      playSound('click');
    }
  };

  const draw = useCallback(() => {
    if (selectedNumbers.length === 0) {
      toast.error('Pick at least 1 number!');
      return;
    }
    if (betAmount > balance) {
      toast.error('Insufficient balance!');
      return;
    }
    if (betAmount <= 0) {
      toast.error('Bet must be greater than 0!');
      return;
    }

    setIsDrawing(true);
    setDrawnNumbers([]);
    setHits(0);
    (onBetPlaced ?? onLose)(betAmount);
    playSound('spin');

    // Draw 20 random numbers
    const numbers: number[] = [];
    while (numbers.length < 20) {
      const num = Math.floor(Math.random() * GRID_SIZE) + 1;
      if (!numbers.includes(num)) numbers.push(num);
    }

    // Reveal numbers one by one
    let revealIndex = 0;
    const interval = setInterval(() => {
      if (revealIndex < numbers.length) {
        setDrawnNumbers(prev => [...prev, numbers[revealIndex]]);
        if (selectedNumbers.includes(numbers[revealIndex])) {
          setHits(prev => prev + 1);
          playSound('reveal');
        }
        revealIndex++;
      } else {
        clearInterval(interval);
        setIsDrawing(false);
        
        // Calculate winnings
        const finalHits = numbers.filter(n => selectedNumbers.includes(n)).length;
        const payoutTable = PAYOUTS[selectedNumbers.length];
        const multiplier = payoutTable?.[finalHits] || 0;
        
        if (multiplier > 0) {
          const winnings = betAmount * multiplier;
          onWin(winnings);
          toast.success(`🎯 ${finalHits} hits! Won $${(winnings - betAmount).toFixed(2)}!`);
        } else {
          onLose(betAmount);
          toast.error(`${finalHits} hits - no win`);
        }
      }
    }, 150);
  }, [balance, betAmount, onBetPlaced, onLose, onWin, selectedNumbers]);

  useEffect(() => {
    if (!autoRunnerEnabled || isDrawing) return;
    if (selectedNumbers.length === 0) return;

    const canAfford = betAmount <= balance;
    if (!canAfford && autoRunnerMode === 'untilBroke') {
      setAutoRunnerEnabled(false);
      toast.info('Keno auto-runner stopped: insufficient balance.');
      return;
    }
    if (!canAfford && autoRunnerMode === 'infinite') return;

    const intervalMs = Math.max(500, 60000 / Math.max(1, drawsPerMin));
    const t = setTimeout(() => draw(), intervalMs * (0.75 + Math.random() * 0.3));
    return () => clearTimeout(t);
  }, [autoRunnerEnabled, autoRunnerMode, balance, betAmount, draw, drawsPerMin, isDrawing, selectedNumbers.length]);

  const clearSelection = () => {
    if (!isDrawing) {
      setSelectedNumbers([]);
      setDrawnNumbers([]);
      setHits(0);
    }
  };

  const getNumberState = (num: number) => {
    const isSelected = selectedNumbers.includes(num);
    const isDrawn = drawnNumbers.includes(num);
    const isHit = isSelected && isDrawn;
    return { isSelected, isDrawn, isHit };
  };

  const latestDrawn = drawnNumbers.length > 0 ? drawnNumbers[drawnNumbers.length - 1] : null;

  return (
    <div className="game-card space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-500/20 rounded-lg glow-gold">
          <Grid3X3 className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Keno</h2>
          <p className="text-muted-foreground text-sm">Pick up to 10 numbers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-secondary rounded-lg p-2 game-tile">
          <div className="text-xs text-muted-foreground">Picks</div>
          <div className="font-display text-lg text-primary">{selectedNumbers.length}/{MAX_PICKS}</div>
        </div>
        <div className="bg-secondary rounded-lg p-2 game-tile">
          <div className="text-xs text-muted-foreground">Hits</div>
          <div className="font-display text-lg text-win">{hits}</div>
        </div>
        <div className="bg-secondary rounded-lg p-2 game-tile">
          <div className="text-xs text-muted-foreground">Drawn</div>
          <div className="font-display text-lg text-gold">{drawnNumbers.length}/20</div>
        </div>
      </div>

      {/* Number Grid */}
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: GRID_SIZE }, (_, i) => i + 1).map(num => {
          const { isSelected, isDrawn, isHit } = getNumberState(num);
          const isLatestBall = isDrawing && drawnNumbers.length > 0 && num === latestDrawn;
          return (
            <button
              key={num}
              onClick={() => toggleNumber(num)}
              disabled={isDrawing}
              className={`aspect-square rounded text-xs font-display font-bold transition-all duration-300 ${
                isHit
                  ? 'bg-win text-white glow-green animate-pop'
                  : isSelected
                  ? 'bg-primary text-primary-foreground'
                  : isDrawn
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-secondary hover:bg-secondary/80 game-tile'
              } ${isLatestBall ? 'animate-keno-ball-pop z-10 ring-2 ring-gold/60' : ''}`}
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="p-3 rounded-lg border border-gold/20 bg-black/20 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gold">Auto Runner</p>
              <p className="text-[11px] text-muted-foreground">Auto-draw at your selected numbers.</p>
            </div>
            <Button
              size="sm"
              variant={autoRunnerEnabled ? 'default' : 'outline'}
              onClick={() => setAutoRunnerEnabled(v => !v)}
              className={autoRunnerEnabled ? 'bg-gold text-black hover:bg-gold/90' : ''}
              disabled={selectedNumbers.length === 0}
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
              <span>Draws / minute</span>
              <span>{drawsPerMin}</span>
            </div>
            <Input
              type="number"
              min={1}
              max={120}
              step={1}
              value={drawsPerMin}
              onChange={(e) => setDrawsPerMin(Math.max(1, parseInt(e.target.value || '1', 10)))}
              className="bg-secondary border-border text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="font-display bg-secondary border-border"
            disabled={isDrawing}
          />
          <Button variant="secondary" onClick={clearSelection} disabled={isDrawing} className="game-tile">
            Clear
          </Button>
        </div>

        <Button
          className="w-full h-12 font-display text-lg bg-amber-500 hover:bg-amber-600 glow-gold transition-all duration-300 hover:scale-[1.02]"
          disabled={isDrawing || balance === 0 || selectedNumbers.length === 0}
          onClick={draw}
        >
          {isDrawing ? 'Drawing...' : 'Draw'}
        </Button>
      </div>
    </div>
  );
};
