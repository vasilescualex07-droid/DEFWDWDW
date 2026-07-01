import { useState, useRef, useEffect } from 'react';
import { Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { playSound } from '@/hooks/useSounds';
import { BetChips } from '@/components/BetChips';

interface RouletteGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

type BetType = 'red' | 'black' | 'green' | 'odd' | 'even' | 'high' | 'low';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

export const RouletteGame = ({ balance, onWin, onLose, onBetPlaced }: RouletteGameProps) => {
  const [betAmount, setBetAmount] = useState(25);
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isWin, setIsWin] = useState(false);
  const [pointerKick, setPointerKick] = useState(0);
  const prevSpinning = useRef(false);

  const getNumberColor = (num: number): 'red' | 'black' | 'green' => {
    if (num === 0) return 'green';
    return RED_NUMBERS.includes(num) ? 'red' : 'black';
  };

  const checkWin = (num: number, bet: BetType): boolean => {
    const color = getNumberColor(num);
    switch (bet) {
      case 'red': return color === 'red';
      case 'black': return color === 'black';
      case 'green': return color === 'green';
      case 'odd': return num !== 0 && num % 2 === 1;
      case 'even': return num !== 0 && num % 2 === 0;
      case 'high': return num >= 19 && num <= 36;
      case 'low': return num >= 1 && num <= 18;
      default: return false;
    }
  };

  const getMultiplier = (bet: BetType): number => {
    if (bet === 'green') return 35;
    return 2;
  };

  const spin = () => {
    if (!selectedBet) {
      toast.error('Select a bet first!');
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

    setSpinning(true);
    setResult(null);
    setIsWin(false);
    (onBetPlaced ?? onLose)(betAmount);
    playSound('spin');

    const resultNumber = WHEEL_NUMBERS[Math.floor(Math.random() * 37)];
    const resultIndex = WHEEL_NUMBERS.indexOf(resultNumber);
    
    const degreesPerSlot = 360 / 37;
    const targetRotation = wheelRotation + 1800 + (resultIndex * degreesPerSlot);
    setWheelRotation(targetRotation);

    setTimeout(() => {
      setSpinning(false);
      setResult(resultNumber);
      
      const won = checkWin(resultNumber, selectedBet);
      setIsWin(won);
      if (won) {
        const multiplier = getMultiplier(selectedBet);
        const winnings = betAmount * multiplier;
        onWin(winnings);
        toast.success(`🎰 ${resultNumber} ${getNumberColor(resultNumber).toUpperCase()}! Won $${(winnings - betAmount).toFixed(2)}!`);
      } else {
        onLose(betAmount);
        playSound('lose');
        toast.error(`${resultNumber} ${getNumberColor(resultNumber).toUpperCase()} - You lose`);
      }
    }, 3100);
  };

  useEffect(() => {
    if (prevSpinning.current && !spinning) {
      setPointerKick((k) => k + 1);
    }
    prevSpinning.current = spinning;
  }, [spinning]);

  const BetButton = ({ type, label, color }: { type: BetType; label: string; color: string }) => (
    <Button
      variant={selectedBet === type ? 'default' : 'outline'}
      className={`h-12 font-display transition-all duration-200 ${selectedBet === type ? color + ' scale-105' : 'hover:scale-105'}`}
      onClick={() => { setSelectedBet(type); playSound('click'); }}
      disabled={spinning}
    >
      {label}
    </Button>
  );

  return (
    <div className="game-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-lose/20 rounded-lg glow-red">
          <Circle className="w-6 h-6 text-lose" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Roulette</h2>
          <p className="text-muted-foreground text-sm">Spin the wheel of fortune</p>
        </div>
      </div>

      {/* Wheel Display */}
      <div className={`relative h-56 bg-gradient-to-b from-card to-background rounded-xl flex items-center justify-center overflow-hidden ${isWin ? 'animate-win-flash' : ''}`}>
        {/* Outer ring decoration */}
        <div className="absolute w-52 h-52 rounded-full border-2 border-gold/30" />
        <div className="absolute w-48 h-48 rounded-full border border-gold/20" />
        
        {/* Main wheel with smooth cubic-bezier easing for gradual slowdown */}
        <div 
          className="w-44 h-44 rounded-full relative"
          style={{ 
            transform: `rotate(${wheelRotation}deg)`,
            transition: spinning 
              ? 'transform 3s cubic-bezier(0.15, 0.85, 0.25, 1)' 
              : 'none',
            background: `
              radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
              conic-gradient(from 0deg, 
                #b91c1c 0deg, #991b1b 9.73deg, 
                #18181b 9.73deg, #27272a 19.46deg, 
                #b91c1c 19.46deg, #991b1b 29.19deg, 
                #18181b 29.19deg, #27272a 38.92deg, 
                #b91c1c 38.92deg, #991b1b 48.65deg, 
                #18181b 48.65deg, #27272a 58.38deg, 
                #b91c1c 58.38deg, #991b1b 68.11deg, 
                #18181b 68.11deg, #27272a 77.84deg, 
                #15803d 77.84deg, #16a34a 87.57deg, 
                #18181b 87.57deg, #27272a 97.3deg, 
                #b91c1c 97.3deg, #991b1b 107.03deg, 
                #18181b 107.03deg, #27272a 116.76deg, 
                #b91c1c 116.76deg, #991b1b 126.49deg, 
                #18181b 126.49deg, #27272a 136.22deg, 
                #b91c1c 136.22deg, #991b1b 145.95deg, 
                #18181b 145.95deg, #27272a 155.68deg, 
                #b91c1c 155.68deg, #991b1b 165.41deg, 
                #18181b 165.41deg, #27272a 175.14deg, 
                #b91c1c 175.14deg, #991b1b 184.87deg, 
                #18181b 184.87deg, #27272a 194.6deg, 
                #b91c1c 194.6deg, #991b1b 204.33deg, 
                #18181b 204.33deg, #27272a 214.06deg, 
                #b91c1c 214.06deg, #991b1b 223.79deg, 
                #18181b 223.79deg, #27272a 233.52deg, 
                #b91c1c 233.52deg, #991b1b 243.25deg, 
                #18181b 243.25deg, #27272a 252.98deg, 
                #b91c1c 252.98deg, #991b1b 262.71deg, 
                #18181b 262.71deg, #27272a 272.44deg, 
                #b91c1c 272.44deg, #991b1b 282.17deg, 
                #18181b 282.17deg, #27272a 291.9deg, 
                #b91c1c 291.9deg, #991b1b 301.63deg, 
                #18181b 301.63deg, #27272a 311.36deg, 
                #b91c1c 311.36deg, #991b1b 321.09deg, 
                #18181b 321.09deg, #27272a 330.82deg, 
                #b91c1c 330.82deg, #991b1b 340.55deg, 
                #18181b 340.55deg, #27272a 350.28deg,
                #b91c1c 350.28deg
              )`,
            boxShadow: spinning 
              ? '0 0 40px hsl(45 100% 50% / 0.6), inset 0 0 20px rgba(0,0,0,0.5)' 
              : 'inset 0 0 20px rgba(0,0,0,0.5), 0 0 15px hsl(45 100% 50% / 0.2)',
            border: '3px solid hsl(45 80% 50%)'
          }}
        >
          {/* Inner decorative rings */}
          <div className="absolute inset-3 rounded-full border border-gold/40" />
          <div className="absolute inset-6 rounded-full border border-gold/20" />
          
          {/* Center hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-gold via-yellow-500 to-yellow-700 flex items-center justify-center font-display font-bold text-background shadow-lg"
            style={{ boxShadow: '0 0 15px hsl(45 100% 50% / 0.5), inset 0 2px 4px rgba(255,255,255,0.3)' }}
          >
            <span className="text-lg">{result ?? '?'}</span>
          </div>
        </div>
        
        {/* Pointer — kicks when the wheel settles */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
          <div
            key={pointerKick}
            className={!spinning && result !== null ? 'animate-pointer-settle-kick' : ''}
          >
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-gold drop-shadow-lg" />
          </div>
        </div>
      </div>

      {/* Result */}
      {result !== null && !spinning && (
        <div className="text-center animate-pop">
          <span className={`font-display text-3xl font-bold ${
            getNumberColor(result) === 'red' ? 'text-lose glow-red' :
            getNumberColor(result) === 'green' ? 'text-win glow-green' : 'text-foreground'
          }`}>
            {result} {getNumberColor(result).toUpperCase()}
          </span>
        </div>
      )}

      {/* Bet Selection */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <BetButton type="red" label="🔴 Red (2x)" color="bg-red-600 hover:bg-red-700" />
          <BetButton type="black" label="⚫ Black (2x)" color="bg-zinc-800 hover:bg-zinc-900" />
          <BetButton type="green" label="🟢 Green (35x)" color="bg-green-600 hover:bg-green-700" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <BetButton type="odd" label="Odd (2x)" color="bg-primary" />
          <BetButton type="even" label="Even (2x)" color="bg-primary" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <BetButton type="low" label="1-18 (2x)" color="bg-primary" />
          <BetButton type="high" label="19-36 (2x)" color="bg-primary" />
        </div>
      </div>

      {/* Bet Controls */}
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
          className="w-full h-14 font-display text-lg bg-lose hover:bg-lose/80 glow-red transition-all duration-200 hover:scale-[1.02]"
          disabled={spinning || balance === 0 || !selectedBet}
          onClick={spin}
        >
          {spinning ? '🎰 Spinning...' : 'SPIN'}
        </Button>
      </div>
    </div>
  );
};
