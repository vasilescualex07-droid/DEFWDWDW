import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Hammer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { playSound } from '@/hooks/useSounds';

interface StackRaidGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

const MAX_FLOORS = 8;

type Mutator =
  | { id: 'wind'; name: 'Abyssal Wind'; desc: 'Pushes your drop cursor.'; driftPxPerSec: number; payoutMult: number }
  | { id: 'haste'; name: 'Haste Rune'; desc: 'Cursor moves faster.'; speedMult: number; payoutMult: number }
  | { id: 'curse'; name: 'Crumbling Curse'; desc: 'Min overlap is harsher, but payout is juiced.'; minWAdd: number; payoutMult: number }
  | { id: 'blessing'; name: 'Stone Blessing'; desc: 'More forgiving overlap, lower payout.'; minWAdd: number; payoutMult: number }
  | { id: 'glitch'; name: 'Neon Glitch'; desc: 'Jittery cursor, big payout.'; jitterPx: number; payoutMult: number };

export const StackRaidGame = ({ balance, onWin, onLose, onBetPlaced }: StackRaidGameProps) => {
  const [betAmount, setBetAmount] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [placed, setPlaced] = useState<{ x: number; w: number }[]>([]);
  const [cursorX, setCursorX] = useState(0);
  const [mutator, setMutator] = useState<Mutator | null>(null);
  const [runPayoutMult, setRunPayoutMult] = useState(1);
  const [dropFlashKey, setDropFlashKey] = useState(0);
  const cursorXRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const dirRef = useRef<1 | -1>(1);
  const lastRef = useRef(0);

  const stageW = 320;
  const stageH = 180;
  const baseW = 150;
  const baseMinW = 26;
  const blockH = 16;

  const getMultiplier = (floor: number) => {
    // Clean stacking = better profit. Narrower blocks mean higher skill, so slightly higher reward.
    const lastW = placed[floor - 1]?.w ?? baseW;
    const skillBonus = Math.max(0, (baseW - lastW) / baseW) * 0.9;
    const m = (1.35 ** floor + skillBonus) * runPayoutMult;
    return parseFloat(m.toFixed(2));
  };
  const currentMultiplier = getMultiplier(currentFloor);
  const potentialWin = betAmount * currentMultiplier;

  const effectiveMinW = useMemo(() => {
    if (!mutator) return baseMinW;
    if (mutator.id === 'curse') return Math.max(18, baseMinW + mutator.minWAdd);
    if (mutator.id === 'blessing') return Math.max(12, baseMinW + mutator.minWAdd);
    return baseMinW;
  }, [baseMinW, mutator]);

  const pickMutator = (): Mutator => {
    const r = Math.random();
    if (r < 0.22) return { id: 'wind', name: 'Abyssal Wind', desc: 'Pushes your drop cursor.', driftPxPerSec: 38, payoutMult: 1.12 };
    if (r < 0.44) return { id: 'haste', name: 'Haste Rune', desc: 'Cursor moves faster.', speedMult: 1.22, payoutMult: 1.1 };
    if (r < 0.62) return { id: 'blessing', name: 'Stone Blessing', desc: 'More forgiving overlap, lower payout.', minWAdd: -8, payoutMult: 0.96 };
    if (r < 0.82) return { id: 'curse', name: 'Crumbling Curse', desc: 'Min overlap is harsher, but payout is juiced.', minWAdd: 8, payoutMult: 1.22 };
    return { id: 'glitch', name: 'Neon Glitch', desc: 'Jittery cursor, big payout.', jitterPx: 7, payoutMult: 1.28 };
  };

  const startGame = () => {
    if (betAmount <= 0 || betAmount > balance) {
      toast.error('Invalid bet amount!');
      return;
    }
    (onBetPlaced ?? onLose)(betAmount);
    const m = pickMutator();
    setMutator(m);
    setRunPayoutMult(m.payoutMult);
    setIsPlaying(true);
    setGameOver(false);
    setCurrentFloor(0);
    setPlaced([{ x: (stageW - baseW) / 2, w: baseW }]);
    dirRef.current = 1;
    cursorXRef.current = 0;
    setCursorX(0);
    playSound('click');
    toast.success(`Press SPACE to drop. Mutator: ${m.name}`);
  };

  const drop = () => {
    if (!isPlaying || gameOver) return;
    if (currentFloor >= MAX_FLOORS) return;
    // first placed block is base; we drop starting from floor 1
    const floorToPlace = currentFloor + 1;
    const prev = placed[placed.length - 1];
    const curW = prev.w;
    const curX = cursorXRef.current;

    const left = Math.max(prev.x, curX);
    const right = Math.min(prev.x + prev.w, curX + curW);
    const overlap = right - left;
    if (overlap <= effectiveMinW) {
      onLose(betAmount);
      setGameOver(true);
      setIsPlaying(false);
      playSound('lose');
      toast.error('🩸 Bad drop! The citadel shatters.');
      return;
    }

    const newBlock = { x: left, w: overlap };
    setPlaced((p) => [...p, newBlock]);
    setCurrentFloor(floorToPlace);
    setDropFlashKey((k) => k + 1);
    playSound('reveal');

    if (floorToPlace >= MAX_FLOORS) {
      const payout = betAmount * getMultiplier(floorToPlace);
      onWin(payout);
      setGameOver(true);
      setIsPlaying(false);
      playSound('win');
      toast.success(`🏰 Ascended! Won $${payout.toFixed(2)}!`);
    }
  };

  const cashOut = () => {
    if (!isPlaying || currentFloor === 0) return;
    onWin(potentialWin);
    setGameOver(true);
    setIsPlaying(false);
    playSound('cashout');
    toast.success(`💰 Cashed out $${potentialWin.toFixed(2)}!`);
  };

  // animation loop for moving cursor block
  const speed = useMemo(() => {
    const base = 210 + currentFloor * 18;
    if (mutator?.id === 'haste') return base * mutator.speedMult;
    return base;
  }, [currentFloor, mutator]);
  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - lastRef.current) / 1000);
      lastRef.current = now;
      const prev = placed[placed.length - 1];
      const w = prev?.w ?? baseW;
      const maxX = stageW - w;
      let x = cursorXRef.current + dirRef.current * speed * dt;
      if (mutator?.id === 'wind') x += mutator.driftPxPerSec * dt * (dirRef.current === 1 ? 1 : -1);
      if (mutator?.id === 'glitch') x += (Math.random() - 0.5) * mutator.jitterPx;
      if (x <= 0) {
        x = 0;
        dirRef.current = 1;
      } else if (x >= maxX) {
        x = maxX;
        dirRef.current = -1;
      }
      cursorXRef.current = x;
      setCursorX(x);
      rafRef.current = requestAnimationFrame(tick);
    };
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [gameOver, isPlaying, placed, speed]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === ' ' || k === 'spacebar') drop();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drop]);

  return (
    <div className="game-card space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 shadow-[0_0_25px_hsl(188_94%_42%/0.18)]">
          <Building2 className="w-6 h-6 text-neon-cyan" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Citadel Ascension</h2>
          <p className="text-muted-foreground text-sm">A cursed stack-run: skill drops + run RNG.</p>
        </div>
      </div>

      {isPlaying && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-display border-win text-win">
            {currentMultiplier.toFixed(2)}x (${potentialWin.toFixed(2)})
          </Badge>
          <Badge variant="outline" className="font-display border-neon-cyan/40 text-neon-cyan">
            Floors {currentFloor}/{MAX_FLOORS}
          </Badge>
          <Badge variant="outline" className="font-display border-neon-purple/30 text-neon-purple">
            Press SPACE to drop
          </Badge>
          {mutator && (
            <Badge variant="outline" className="font-display border-lose/30 text-lose">
              {mutator.name} • {mutator.payoutMult.toFixed(2)}x
            </Badge>
          )}
        </div>
      )}

      {isPlaying && (
        <div className="p-3 rounded-xl border border-neon-cyan/25 bg-black/20 shadow-[inset_0_1px_0_rgba(34,211,238,0.12)]">
          <div
            className="relative mx-auto rounded-xl border border-neon-purple/20 bg-gradient-to-b from-black/70 via-[#08111a]/55 to-black/35 overflow-hidden"
               style={{ width: stageW, height: stageH }}>
            <div className="absolute inset-0 scanlines pointer-events-none" aria-hidden />
            <div className="absolute inset-0 vignette opacity-70 pointer-events-none" aria-hidden />
            <div className="absolute -top-24 -left-20 w-64 h-64 bg-neon-purple/10 rounded-full blur-[60px]" aria-hidden />
            <div className="absolute -bottom-24 -right-20 w-64 h-64 bg-neon-cyan/10 rounded-full blur-[60px]" aria-hidden />

            {/* Impact flash on each successful drop */}
            <div
              key={dropFlashKey}
              className="pointer-events-none absolute inset-0 z-20 bg-neon-cyan/25 animate-stack-drop-flash"
              aria-hidden
            />

            {/* placed blocks (bottom-up) */}
            {placed.map((b, i) => {
              const y = stageH - (i + 1) * (blockH + 6) - 10;
              return (
                <div
                  key={i}
                  className="absolute rounded-md border border-neon-cyan/35 bg-neon-cyan/10"
                  style={{
                    left: b.x,
                    top: y,
                    width: b.w,
                    height: blockH,
                    boxShadow: '0 0 18px rgba(34,211,238,0.16), inset 0 0 0 1px rgba(111,0,255,0.08)',
                  }}
                />
              );
            })}

            {/* moving cursor block */}
            {!gameOver && currentFloor < MAX_FLOORS && placed.length > 0 && (
              <div
                className="absolute rounded-md border border-gold/40 bg-gold/10"
                style={{
                  left: cursorX,
                  top: stageH - (placed.length + 1) * (blockH + 6) - 10,
                  width: placed[placed.length - 1].w,
                  height: blockH,
                  boxShadow: '0 0 26px rgba(245,158,11,0.16), 0 0 42px rgba(111,0,255,0.10)',
                }}
              />
            )}
            <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground/80 font-display tracking-wider">
              {mutator ? mutator.desc : '...'}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: MAX_FLOORS }).map((_, i) => (
          <div
            key={i}
            className={`h-12 rounded-lg border flex items-center justify-center text-sm font-display ${
              i < currentFloor ? 'bg-win/20 border-win/50 text-win' : 'bg-secondary/60 border-border/40 text-muted-foreground'
            }`}
          >
            {i < currentFloor ? '🏠' : i + 1}
          </div>
        ))}
      </div>

      {!isPlaying ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="bg-secondary border-border"
            />
            <Button variant="outline" onClick={() => setBetAmount(Math.floor(balance / 2))}>1/2</Button>
            <Button variant="outline" onClick={() => setBetAmount(Math.floor(balance))}>Max</Button>
          </div>
          <Button className="w-full bg-neon-cyan hover:bg-neon-cyan/80 text-black" onClick={startGame}>
            <Hammer className="w-4 h-4 mr-2" />
            Begin Ascension
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={drop} disabled={gameOver || currentFloor >= MAX_FLOORS} className="bg-neon-cyan hover:bg-neon-cyan/80 text-black">
            Drop (Space)
          </Button>
          <Button onClick={cashOut} disabled={currentFloor === 0} className="bg-win hover:bg-win/90 text-win-foreground">
            Cash Out
          </Button>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Roguelike run RNG: every run rolls a mutator. Skill decides your overlap; the curse decides the vibe.
      </p>
    </div>
  );
};

