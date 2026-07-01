import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Gem, Skull, Lightbulb, ArrowLeft, ArrowRight, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { playSound } from '@/hooks/useSounds';
import { UndertaleArena, type ArenaDifficulty } from '@/components/boss/UndertaleArena';

interface TowerGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

const TOWER_HEIGHT = 8;
const TILES_PER_ROW = 3;

type Strategy = 'manual' | 'left' | 'right' | 'zigzag' | 'random';

const STRATEGIES: { id: Strategy; name: string; icon: typeof Shuffle; description: string }[] = [
  { id: 'manual', name: 'Manual', icon: Lightbulb, description: 'Choose your own path' },
  { id: 'left', name: 'Left', icon: ArrowLeft, description: 'Always pick left tile' },
  { id: 'right', name: 'Right', icon: ArrowRight, description: 'Always pick right tile' },
  { id: 'zigzag', name: 'Zigzag', icon: Shuffle, description: 'Alternate left-right' },
  { id: 'random', name: 'Random', icon: Shuffle, description: 'Random selection each level' },
];

interface TileState {
  revealed: boolean;
  isSafe: boolean;
}

export const TowerGame = ({ balance, onWin, onLose, onBetPlaced }: TowerGameProps) => {
  const [betAmount, setBetAmount] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [tower, setTower] = useState<TileState[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>('manual');
  const [showStrategies, setShowStrategies] = useState(false);
  const [arenaActive, setArenaActive] = useState(false);
  const [arenaHits, setArenaHits] = useState(0);
  const [dodgeBonus, setDodgeBonus] = useState(0);
  const [trapRevealBonus, setTrapRevealBonus] = useState(0);

  const getMultiplier = (level: number) => {
    return parseFloat((1.4 ** level + dodgeBonus).toFixed(2));
  };
  const arenaDifficulty: ArenaDifficulty = useMemo(
    () => ({ cadenceMs: 950, telegraphMs: 700, strikeMs: 175, maxSlashes: 2, moveSpeed: 200 }),
    []
  );

  const getNextTile = (): number => {
    switch (selectedStrategy) {
      case 'left': return 0;
      case 'right': return 2;
      case 'zigzag': return currentLevel % 2 === 0 ? 0 : 2;
      case 'random': return Math.floor(Math.random() * TILES_PER_ROW);
      default: return -1;
    }
  };

  const startGame = () => {
    if (betAmount > balance || betAmount <= 0) {
      toast.error('Invalid bet amount!');
      return;
    }

    (onBetPlaced ?? onLose)(betAmount);
    playSound('click');

    const newTower: TileState[][] = [];
    for (let i = 0; i < TOWER_HEIGHT; i++) {
      const safeIndex = Math.floor(Math.random() * TILES_PER_ROW);
      const row: TileState[] = [];
      for (let j = 0; j < TILES_PER_ROW; j++) {
        row.push({ revealed: false, isSafe: j === safeIndex });
      }
      newTower.push(row);
    }

    setTower(newTower);
    setIsPlaying(true);
    setCurrentLevel(0);
    setGameOver(false);
    setWon(false);
    setArenaActive(false);
    setArenaHits(0);
    setDodgeBonus(0);
    setTrapRevealBonus(0);
  };

  const selectTile = (tileIndex: number) => {
    if (!isPlaying || gameOver || currentLevel >= TOWER_HEIGHT) return;

    const newTower = [...tower];
    const row = newTower[currentLevel];
    
    row[tileIndex].revealed = true;
    
    const convertedSafe = !row[tileIndex].isSafe && Math.random() < trapRevealBonus;
    if (row[tileIndex].isSafe || convertedSafe) {
      playSound('reveal');
      const newLevel = currentLevel + 1;
      setCurrentLevel(newLevel);
      
      if (newLevel >= TOWER_HEIGHT) {
        const winAmount = betAmount * getMultiplier(newLevel);
        onWin(winAmount);
        playSound('win');
        toast.success(`🏆 Reached the top! Won $${winAmount.toFixed(2)}!`);
        setWon(true);
        setGameOver(true);
        setIsPlaying(false);
      }
    } else {
      row.forEach(tile => tile.revealed = true);
      onLose(betAmount);
      playSound('lose');
      toast.error('💀 Hit a trap! Game over!');
      setGameOver(true);
      setIsPlaying(false);
    }
    
    setTower(newTower);
  };

  const startDodge = () => {
    if (!isPlaying || gameOver || arenaActive) return;
    setArenaHits(0);
    setArenaActive(true);
  };

  const finishDodge = () => {
    const addBonus = arenaHits === 0 ? 0.3 : arenaHits === 1 ? 0.2 : arenaHits === 2 ? 0.1 : 0;
    const addTrap = arenaHits === 0 ? 0.18 : arenaHits === 1 ? 0.12 : arenaHits === 2 ? 0.06 : 0;
    setDodgeBonus((v) => Math.min(1.6, parseFloat((v + addBonus).toFixed(2))));
    setTrapRevealBonus((v) => Math.min(0.45, parseFloat((v + addTrap).toFixed(2))));
    setArenaActive(false);
  };

  const autoSelectNext = () => {
    const nextTile = getNextTile();
    if (nextTile >= 0 && isPlaying && !gameOver) {
      selectTile(nextTile);
    }
  };

  const cashOut = () => {
    if (!isPlaying || currentLevel === 0) return;
    
    const winAmount = betAmount * getMultiplier(currentLevel);
    onWin(winAmount);
    playSound('cashout');
    toast.success(`💰 Cashed out $${winAmount.toFixed(2)}!`);
    setWon(true);
    setGameOver(true);
    setIsPlaying(false);
  };

  const currentMultiplier = getMultiplier(currentLevel);
  const nextMultiplier = getMultiplier(currentLevel + 1);
  const potentialWin = betAmount * currentMultiplier;
  const suggestedTile = getNextTile();

  return (
    <div className="game-card space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/20 rounded-lg">
            <Building2 className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Tower</h2>
            <p className="text-muted-foreground text-sm">Climb the tower, avoid the traps!</p>
          </div>
        </div>
        {!isPlaying && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStrategies(!showStrategies)}
            className="text-sky-400"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            Plans
          </Button>
        )}
      </div>

      {/* Strategy Selector */}
      {showStrategies && !isPlaying && (
        <div className="grid grid-cols-5 gap-2 p-3 bg-card/50 rounded-lg border border-border animate-fade-in">
          {STRATEGIES.map(strategy => {
            const Icon = strategy.icon;
            return (
              <button
                key={strategy.id}
                onClick={() => setSelectedStrategy(strategy.id)}
                className={`p-2 rounded-lg text-center transition-all ${
                  selectedStrategy === strategy.id
                    ? 'bg-sky-500/20 border border-sky-500 text-sky-400'
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
          </div>
        </div>
      )}

      {isPlaying && (
        <div className="text-center animate-fade-in">
          <Badge variant="outline" className="text-lg px-4 py-2 font-display border-win text-win glow-green">
            Current: {currentMultiplier}x (${potentialWin.toFixed(2)})
          </Badge>
          {currentLevel < TOWER_HEIGHT && (
            <p className="text-sm text-muted-foreground mt-2">
              Next level: {nextMultiplier}x
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2">
        {Array.from({ length: TOWER_HEIGHT }).map((_, levelIndex) => (
          <div 
            key={levelIndex}
            className={`grid grid-cols-3 gap-2 transition-all duration-500 ${
              isPlaying && levelIndex === currentLevel 
                ? 'scale-105 opacity-100' 
                : levelIndex < currentLevel 
                  ? 'opacity-60' 
                  : 'opacity-40'
            }`}
          >
            {Array.from({ length: TILES_PER_ROW }).map((_, tileIndex) => {
              const tile = tower[levelIndex]?.[tileIndex];
              const isClickable = isPlaying && levelIndex === currentLevel && !gameOver;
              const isRevealed = tile?.revealed;
              const isSafe = tile?.isSafe;
              const isSuggested = isClickable && selectedStrategy !== 'manual' && tileIndex === suggestedTile;

              return (
                <button
                  key={tileIndex}
                  onClick={() => selectTile(tileIndex)}
                  disabled={!isClickable}
                  className={`
                    h-14 rounded-lg font-display text-lg font-bold
                    transition-all duration-300 transform
                    ${isClickable 
                      ? `bg-sky-500/20 hover:bg-sky-500/40 hover:scale-105 cursor-pointer border ${isSuggested ? 'border-sky-400 ring-2 ring-sky-400' : 'border-sky-500/40'} hover:border-sky-400` 
                      : isRevealed
                        ? isSafe
                          ? 'bg-win/30 border border-win text-win'
                          : 'bg-lose/30 border border-lose text-lose'
                        : 'bg-secondary/50 border border-border/30'
                    }
                    ${isRevealed ? 'animate-tower-tile-snap' : ''}
                  `}
                >
                  {isRevealed ? (
                    isSafe ? (
                      <Gem className="w-6 h-6 mx-auto text-win" />
                    ) : (
                      <Skull className="w-6 h-6 mx-auto text-lose" />
                    )
                  ) : (
                    <span className="text-muted-foreground">
                      {levelIndex < currentLevel ? '✓' : isSuggested ? '→' : '?'}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="col-span-3 flex justify-center">
              <span className="text-xs text-muted-foreground font-display">
                Level {levelIndex + 1} • {getMultiplier(levelIndex + 1)}x
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Auto-select button for strategies */}
      {isPlaying && selectedStrategy !== 'manual' && !gameOver && (
        <Button
          variant="outline"
          onClick={autoSelectNext}
          className="w-full border-sky-500 text-sky-400 hover:bg-sky-500/20"
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Auto-Select ({STRATEGIES.find(s => s.id === selectedStrategy)?.name})
        </Button>
      )}

      {isPlaying && !gameOver && (
        <div className="p-3 rounded-lg border border-sky-500/30 bg-black/20 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-sky-300 font-display">
              Arena Buff: +{dodgeBonus.toFixed(2)}x • Trap save {(trapRevealBonus * 100).toFixed(0)}%
            </p>
            <Button size="sm" variant="outline" onClick={startDodge} disabled={arenaActive}>
              Dodge Slash
            </Button>
          </div>
          {arenaActive && (
            <UndertaleArena
              attackEnabled
              pattern="rain"
              signature="houseGrid"
              difficulty={arenaDifficulty}
              durationMs={3000}
              onHit={() => setArenaHits((n) => n + 1)}
              onDone={finishDodge}
            />
          )}
        </div>
      )}

      {gameOver && (
        <div className={`text-center animate-pop ${won ? 'text-win' : 'text-lose'}`}>
          <p className="font-display text-2xl font-bold">
            {won ? `🏆 Won $${potentialWin.toFixed(2)}!` : '💀 Game Over!'}
          </p>
        </div>
      )}

      {!isPlaying ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Bet Amount</label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-secondary border-border font-display"
              />
              <Button 
                variant="outline" 
                onClick={() => setBetAmount(Math.floor(balance / 2))}
                className="game-tile"
              >
                1/2
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setBetAmount(Math.floor(balance))}
                className="game-tile"
              >
                Max
              </Button>
            </div>
          </div>
          <Button
            onClick={startGame}
            disabled={betAmount <= 0 || betAmount > balance}
            className="w-full h-14 text-lg font-display bg-sky-500 hover:bg-sky-600 text-white transition-all duration-300 hover:scale-[1.02]"
          >
            Start Climbing {selectedStrategy !== 'manual' && `(${STRATEGIES.find(s => s.id === selectedStrategy)?.name})`}
          </Button>
        </div>
      ) : (
        <Button
          onClick={cashOut}
          disabled={currentLevel === 0}
          className="w-full h-14 text-lg font-display bg-win hover:bg-win/90 text-win-foreground glow-green transition-all duration-300 hover:scale-[1.02]"
        >
          Cash Out ${potentialWin.toFixed(2)}
        </Button>
      )}

      <div className="text-center text-xs text-muted-foreground">
        <p>Pick the safe tile • Dodge arena boosts multiplier and can save trap picks.</p>
      </div>
    </div>
  );
};