import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bird, Car, Skull } from 'lucide-react';
import { toast } from 'sonner';
import { playSound } from '@/hooks/useSounds';

interface ChickenGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

const ROAD_LANES = 5;

interface LaneState {
  crossed: boolean;
}

export const ChickenGame = ({ balance, onWin, onLose, onBetPlaced }: ChickenGameProps) => {
  const [betAmount, setBetAmount] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLane, setCurrentLane] = useState(0);
  const [lanes, setLanes] = useState<LaneState[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [chickenPosition, setChickenPosition] = useState(0); // lane marker for the roadmap UI

  // Skill-based lane dodge encounter
  const [encounterActive, setEncounterActive] = useState(false);
  const [encounterDone, setEncounterDone] = useState(0);
  const [encounterHits, setEncounterHits] = useState(0);
  const [encounterTimeLeftMs, setEncounterTimeLeftMs] = useState(0);
  const [encounterBurst, setEncounterBurst] = useState(0);

  const arenaW = 320;
  const arenaH = 160;
  const chickenSize = 16;

  type CarObj = { id: number; x: number; y: number; w: number; h: number; speed: number; dir: 1 | -1 };
  const carsRef = useRef<CarObj[]>([]);
  const rafRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const startRef = useRef(0);
  const lastRef = useRef(0);
  const chickenRef = useRef({ x: arenaW / 2 - chickenSize / 2, y: arenaH - chickenSize - 10 });
  const [chickenXY, setChickenXY] = useState(chickenRef.current);

  const getMultiplier = (lane: number) => {
    // Slight skill reward: fewer hits during the last cleared lane grants a tiny multiplier bump
    const lastLaneBonus = Math.max(0, 0.12 - Math.min(0.12, encounterHits * 0.06));
    return parseFloat((1.5 ** lane + lastLaneBonus).toFixed(2));
  };

  const laneConfig = useMemo(() => {
    const lane = currentLane + 1;
    const durationMs = 2400 + lane * 350; // later lanes require a bit longer survival
    const carCount = Math.min(6, 2 + lane);
    const speedBase = 90 + lane * 18;
    return { durationMs, carCount, speedBase };
  }, [currentLane]);

  const startGame = () => {
    if (betAmount > balance || betAmount <= 0) {
      toast.error('Invalid bet amount!');
      return;
    }

    (onBetPlaced ?? onLose)(betAmount);
    playSound('click');

    const newLanes: LaneState[] = Array.from({ length: ROAD_LANES }, () => ({ crossed: false }));

    setLanes(newLanes);
    setIsPlaying(true);
    setCurrentLane(0);
    setChickenPosition(0);
    setGameOver(false);
    setWon(false);
    setEncounterActive(false);
    setEncounterHits(0);
    setEncounterDone((n) => n + 1);
  };

  const rectsOverlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  const buildCarsForLane = () => {
    const rows = 3;
    const rowY = [38, 78, 118];
    const cars: CarObj[] = [];
    for (let i = 0; i < laneConfig.carCount; i++) {
      const r = i % rows;
      const dir: 1 | -1 = r % 2 === 0 ? 1 : -1;
      const w = 42 + Math.floor(Math.random() * 26);
      const h = 16;
      const speed = laneConfig.speedBase + Math.random() * 70;
      const x = dir === 1 ? -Math.random() * arenaW : arenaW + Math.random() * arenaW;
      cars.push({ id: i + 1, x, y: rowY[r], w, h, speed, dir });
    }
    carsRef.current = cars;
  };

  const startEncounter = () => {
    if (!isPlaying || gameOver || encounterActive || currentLane >= ROAD_LANES) return;
    setEncounterBurst((n) => n + 1);
    setEncounterHits(0);
    setEncounterTimeLeftMs(laneConfig.durationMs);
    setEncounterActive(true);
    buildCarsForLane();
    chickenRef.current = { x: arenaW / 2 - chickenSize / 2, y: arenaH - chickenSize - 10 };
    setChickenXY(chickenRef.current);
    startRef.current = performance.now();
    lastRef.current = startRef.current;
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (k === ' ' || k === 'spacebar') {
        if (!encounterActive && isPlaying && !gameOver) startEncounter();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [encounterActive, gameOver, isPlaying, laneConfig.durationMs]);

  useEffect(() => {
    if (!encounterActive) return;

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - lastRef.current) / 1000);
      lastRef.current = now;
      const elapsed = now - startRef.current;
      const timeLeft = Math.max(0, laneConfig.durationMs - elapsed);
      setEncounterTimeLeftMs(timeLeft);

      // Chicken movement
      const speed = 210 + currentLane * 12;
      const k = keysRef.current;
      const dx = (k['arrowright'] || k['d'] ? 1 : 0) - (k['arrowleft'] || k['a'] ? 1 : 0);
      const dy = (k['arrowdown'] || k['s'] ? 1 : 0) - (k['arrowup'] || k['w'] ? 1 : 0);
      const nx = Math.max(0, Math.min(arenaW - chickenSize, chickenRef.current.x + dx * speed * dt));
      const ny = Math.max(0, Math.min(arenaH - chickenSize, chickenRef.current.y + dy * speed * dt));
      if (nx !== chickenRef.current.x || ny !== chickenRef.current.y) {
        chickenRef.current = { x: nx, y: ny };
        setChickenXY(chickenRef.current);
      }

      // Cars
      for (const c of carsRef.current) {
        c.x += c.dir * c.speed * dt;
        if (c.dir === 1 && c.x > arenaW + 60) c.x = -c.w - 60;
        if (c.dir === -1 && c.x < -c.w - 60) c.x = arenaW + 60;
      }

      const chick = { x: chickenRef.current.x, y: chickenRef.current.y, w: chickenSize, h: chickenSize };
      for (const c of carsRef.current) {
        if (rectsOverlap(chick, { x: c.x, y: c.y, w: c.w, h: c.h })) {
          setEncounterHits((h) => h + 1);
          playSound('lose');
          onLose(betAmount);
          toast.error('🚗 Hit! The chicken got flattened.');
          setGameOver(true);
          setIsPlaying(false);
          setEncounterActive(false);
          return;
        }
      }

      if (timeLeft <= 0) {
        // Lane cleared
        const newLanes = [...lanes];
        if (newLanes[currentLane]) newLanes[currentLane].crossed = true;
        setLanes(newLanes);
        setChickenPosition(currentLane + 1);
        playSound('reveal');
        const next = currentLane + 1;
        setCurrentLane(next);
        setEncounterActive(false);

        if (next >= ROAD_LANES) {
          const winAmount = betAmount * getMultiplier(next);
          onWin(winAmount);
          playSound('win');
          toast.success(`🐔 Crossed all lanes! Won $${winAmount.toFixed(2)}!`);
          setWon(true);
          setGameOver(true);
          setIsPlaying(false);
        } else {
          toast.success('✅ Lane cleared! Press SPACE to dodge the next lane.');
        }
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [betAmount, currentLane, encounterActive, getMultiplier, laneConfig.durationMs, lanes, onLose, onWin]);

  const cashOut = () => {
    if (!isPlaying || currentLane === 0) return;
    
    const winAmount = betAmount * getMultiplier(currentLane);
    onWin(winAmount);
    playSound('cashout');
    toast.success(`💰 Chicken retreated with $${winAmount.toFixed(2)}!`);
    setWon(true);
    setGameOver(true);
    setIsPlaying(false);
    setEncounterActive(false);
  };

  const currentMultiplier = getMultiplier(currentLane);
  const nextMultiplier = getMultiplier(currentLane + 1);
  const potentialWin = betAmount * currentMultiplier;

  return (
    <div className="game-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-500/20 rounded-lg">
          <Bird className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Chicken Cross</h2>
          <p className="text-muted-foreground text-sm">Help the chicken cross the road!</p>
        </div>
      </div>

      {/* Current Multiplier */}
      {isPlaying && (
        <div className="text-center animate-fade-in">
          <Badge variant="outline" className="text-lg px-4 py-2 font-display border-win text-win glow-green">
            Current: {currentMultiplier}x (${potentialWin.toFixed(2)})
          </Badge>
          {currentLane < ROAD_LANES && (
            <p className="text-sm text-muted-foreground mt-2">
              Cross next lane: {nextMultiplier}x
            </p>
          )}
        </div>
      )}

      {/* Road Visual */}
      <div className="relative bg-secondary/30 rounded-xl p-4 overflow-hidden">
        {/* Start zone */}
        <div className="bg-green-500/20 border-b-2 border-dashed border-green-500/50 p-3 mb-2 rounded-t-lg flex items-center justify-center">
          <span className="text-xs text-green-400 font-display">🏠 START</span>
        </div>
        
        {/* Lanes */}
        <div className="space-y-2">
          {lanes.map((lane, index) => (
            <div 
              key={index}
              className={`
                relative h-16 rounded-lg flex items-center justify-between px-4
                transition-all duration-300
                ${lane.crossed 
                  ? 'bg-win/20 border border-win/50'
                  : index === currentLane && isPlaying
                    ? 'bg-amber-500/20 border-2 border-amber-400 animate-pulse'
                    : 'bg-gray-800/50 border border-border/30'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-display">Lane {index + 1}</span>
                {lane.crossed && <span className="text-win text-xl">✓</span>}
              </div>
              <span className="text-xs text-muted-foreground">{getMultiplier(index + 1)}x</span>
              
              {/* Chicken position indicator */}
              {chickenPosition === index + 1 && (
                <div className="absolute left-1/2 -translate-x-1/2 text-3xl animate-bounce">
                  🐔
                </div>
              )}
            </div>
          ))}
        </div>

        {/* End zone */}
        <div className="bg-primary/20 border-t-2 border-dashed border-primary/50 p-3 mt-2 rounded-b-lg flex items-center justify-center">
          <span className="text-xs text-primary font-display">🏆 FINISH - {getMultiplier(ROAD_LANES)}x</span>
        </div>

        {/* Chicken at start */}
        {isPlaying && chickenPosition === 0 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-3xl animate-bounce">
            🐔
          </div>
        )}
      </div>

      {/* Result */}
      {gameOver && (
        <div className={`text-center animate-pop ${won ? 'text-win' : 'text-lose'}`}>
          <p className="font-display text-2xl font-bold">
            {won ? `🐔 Won $${potentialWin.toFixed(2)}!` : '💀 Game Over!'}
          </p>
        </div>
      )}

      {/* Controls */}
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
            className="w-full h-14 text-lg font-display bg-amber-500 hover:bg-amber-600 text-black transition-all duration-300 hover:scale-[1.02]"
          >
            🐔 Start Crossing (${betAmount.toFixed(2)})
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-amber-400/30 bg-black/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-amber-300 font-display">
                Dodge the cars to clear the lane (WASD/Arrows). Press SPACE to start.
              </p>
              <Button size="sm" variant="outline" onClick={startEncounter} disabled={encounterActive || gameOver}>
                {encounterActive ? 'Dodging...' : 'Start (Space)'}
              </Button>
            </div>

            <div className="relative rounded-xl border border-border/40 bg-gradient-to-b from-black/60 to-black/30 overflow-hidden">
              <div className="absolute inset-0 scanlines pointer-events-none" aria-hidden />
              <div className="absolute inset-0 vignette opacity-70 pointer-events-none" aria-hidden />
              <div className="relative mx-auto" style={{ width: arenaW, height: arenaH }}>
                {/* lanes */}
                <div className="absolute left-0 top-[32px] w-full h-[1px] bg-amber-500/25" />
                <div className="absolute left-0 top-[72px] w-full h-[1px] bg-amber-500/25" />
                <div className="absolute left-0 top-[112px] w-full h-[1px] bg-amber-500/25" />

                {/* cars */}
                {carsRef.current.map((c) => (
                  <div
                    key={c.id}
                    className="absolute rounded-md border border-lose/40 bg-lose/30"
                    style={{
                      left: c.x,
                      top: c.y,
                      width: c.w,
                      height: c.h,
                      boxShadow: '0 0 16px rgba(239,68,68,0.25)',
                    }}
                  >
                    <Car className="w-4 h-4 text-lose absolute left-1 top-0.5 opacity-80" />
                  </div>
                ))}

                {/* chicken */}
                <div
                  key={encounterBurst}
                  className={`absolute ${encounterActive ? 'animate-impact-pop ring-2 ring-amber-400/50' : ''}`}
                  style={{
                    left: chickenXY.x,
                    top: chickenXY.y,
                    width: chickenSize,
                    height: chickenSize,
                    borderRadius: 6,
                    background: 'rgba(245,158,11,0.85)',
                    boxShadow: '0 0 18px rgba(245,158,11,0.35)',
                  }}
                />
                <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground/80 font-display tracking-wider">
                  {encounterActive ? `Survive: ${(encounterTimeLeftMs / 1000).toFixed(1)}s` : 'Ready'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={cashOut}
            disabled={currentLane === 0}
            className="h-14 text-lg font-display bg-win hover:bg-win/90 text-win-foreground glow-green transition-all duration-300 hover:scale-[1.02]"
          >
            Retreat ${potentialWin.toFixed(2)}
          </Button>
          <Button
            onClick={startEncounter}
            disabled={encounterActive || gameOver || currentLane >= ROAD_LANES}
            className="h-14 text-lg font-display bg-amber-500 hover:bg-amber-600 text-black transition-all duration-300 hover:scale-[1.02]"
          >
            🚗 Dodge Lane
          </Button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-center text-xs text-muted-foreground">
        <p>Pure skill: survive each lane’s cars to advance • Cash out anytime.</p>
      </div>
    </div>
  );
};