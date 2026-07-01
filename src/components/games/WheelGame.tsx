import { useState, useRef, useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { playSound } from '@/hooks/useSounds';
import { BetChips } from '@/components/BetChips';

interface WheelGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

const SEGMENTS = [
  { multiplier: 1.2, color: 'hsl(200, 70%, 45%)', weight: 30 },
  { multiplier: 1.5, color: 'hsl(142, 70%, 45%)', weight: 25 },
  { multiplier: 2, color: 'hsl(45, 80%, 50%)', weight: 20 },
  { multiplier: 3, color: 'hsl(280, 70%, 50%)', weight: 12 },
  { multiplier: 5, color: 'hsl(30, 80%, 50%)', weight: 8 },
  { multiplier: 10, color: 'hsl(0, 70%, 50%)', weight: 4 },
  { multiplier: 50, color: 'hsl(320, 70%, 50%)', weight: 1 },
];

const WHEEL_SEGMENTS = [
  ...Array(30).fill(SEGMENTS[0]),
  ...Array(25).fill(SEGMENTS[1]),
  ...Array(20).fill(SEGMENTS[2]),
  ...Array(12).fill(SEGMENTS[3]),
  ...Array(8).fill(SEGMENTS[4]),
  ...Array(4).fill(SEGMENTS[5]),
  ...Array(1).fill(SEGMENTS[6]),
].sort(() => Math.random() - 0.5);

export const WheelGame = ({ balance, onWin, onLose, onBetPlaced }: WheelGameProps) => {
  const [betAmount, setBetAmount] = useState(25);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [pointerKick, setPointerKick] = useState(0);
  const prevSpinning = useRef(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevSpinning.current && !spinning) {
      setPointerKick((k) => k + 1);
    }
    prevSpinning.current = spinning;
  }, [spinning]);

  const spin = () => {
    if (betAmount > balance) {
      toast.error('Insufficient balance!');
      return;
    }
    if (betAmount <= 0) {
      toast.error('Bet must be greater than 0!');
      return;
    }

    setSpinning(true);
    setLastResult(null);
    (onBetPlaced ?? onLose)(betAmount);
    playSound('spin');

    const totalWeight = SEGMENTS.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedSegment = SEGMENTS[0];
    for (const segment of SEGMENTS) {
      random -= segment.weight;
      if (random <= 0) {
        selectedSegment = segment;
        break;
      }
    }

    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const segmentIndex = WHEEL_SEGMENTS.findIndex(s => s.multiplier === selectedSegment.multiplier);
    const targetRotation = rotation + 1080 + (segmentIndex * segmentAngle) + (Math.random() * segmentAngle * 0.8);

    setRotation(targetRotation);

    setTimeout(() => {
      setSpinning(false);
      setLastResult(selectedSegment.multiplier);

      const winnings = betAmount * selectedSegment.multiplier;
      onWin(winnings);
      playSound('cashout');

      if (selectedSegment.multiplier >= 5) {
        toast.success(`🎡 BIG WIN! ${selectedSegment.multiplier}x! +$${(winnings - betAmount).toFixed(2)}`);
      } else {
        toast.success(`🎡 ${selectedSegment.multiplier}x! +$${(winnings - betAmount).toFixed(2)}`);
      }
    }, 3100);
  };

  return (
    <div className="game-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-neon-purple/20 rounded-lg glow-purple">
          <RotateCw className="w-6 h-6 text-neon-purple" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Wheel</h2>
          <p className="text-muted-foreground text-sm">Spin to win multipliers</p>
        </div>
      </div>

      <div className="relative flex items-center justify-center py-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 text-3xl text-gold" style={{ filter: 'drop-shadow(0 0 10px hsl(45 100% 50%))' }}>
          <span key={pointerKick} className={!spinning && lastResult !== null ? 'inline-block animate-pointer-settle-kick' : 'inline-block'}>
            ▼
          </span>
        </div>

        <div
          ref={wheelRef}
          className="w-52 h-52 rounded-full relative"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 3s cubic-bezier(0.15, 0.85, 0.25, 1)' : 'none',
            background: `conic-gradient(${WHEEL_SEGMENTS.map((s, i) =>
              `${s.color} ${(i / WHEEL_SEGMENTS.length) * 360}deg ${((i + 1) / WHEEL_SEGMENTS.length) * 360}deg`
            ).join(', ')})`,
            boxShadow: spinning
              ? '0 0 50px hsl(45 100% 50% / 0.5), inset 0 0 30px rgba(0,0,0,0.4)'
              : '0 0 25px hsl(45 100% 50% / 0.25), inset 0 0 20px rgba(0,0,0,0.3)',
            border: '4px solid hsl(45 80% 50%)'
          }}
        >
          <div className="absolute inset-4 rounded-full border-2 border-gold/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-18 h-18 rounded-full bg-gradient-to-br from-background to-card border-3 border-gold flex items-center justify-center shadow-xl"
              style={{ width: '72px', height: '72px', boxShadow: '0 0 20px hsl(45 100% 50% / 0.4)' }}
            >
              <span className="font-display text-xl font-bold text-gold">
                {lastResult ? `${lastResult}x` : '?'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-center">
        {SEGMENTS.map((segment, i) => (
          <div
            key={i}
            className="rounded p-1.5"
            style={{ backgroundColor: segment.color + '40' }}
          >
            <div className="font-display font-bold" style={{ color: segment.color }}>
              {segment.multiplier}x
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
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
          className="w-full h-14 font-display text-lg bg-neon-purple hover:bg-neon-purple/80 glow-purple transition-all duration-300 hover:scale-[1.02]"
          disabled={spinning || balance === 0}
          onClick={spin}
        >
          {spinning ? '🎡 Spinning…' : 'SPIN'}
        </Button>
      </div>
    </div>
  );
};
