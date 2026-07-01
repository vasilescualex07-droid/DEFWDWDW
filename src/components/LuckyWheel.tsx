import { useState, useEffect } from 'react';
import { RotateCw, Gift, Star, Zap, Coins, Sparkles, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { playSound } from '@/hooks/useSounds';
import { toast } from 'sonner';

interface LuckyWheelProps {
  balance: number;
  setBalance: (balance: number) => void;
  playerLevel: number;
  onClose: () => void;
}

interface WheelSegment {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

const WHEEL_SEGMENTS: WheelSegment[] = [
  { label: '$25', value: 25, color: '#6B7280', icon: Coins, rarity: 'common' },
  { label: '$50', value: 50, color: '#3B82F6', icon: Coins, rarity: 'common' },
  { label: '$100', value: 100, color: '#8B5CF6', icon: Star, rarity: 'uncommon' },
  { label: '$200', value: 200, color: '#F59E0B', icon: Star, rarity: 'uncommon' },
  { label: '$500', value: 500, color: '#10B981', icon: Zap, rarity: 'rare' },
  { label: '$1,000', value: 1000, color: '#EC4899', icon: Sparkles, rarity: 'epic' },
  { label: '$2,500', value: 2500, color: '#F97316', icon: Sparkles, rarity: 'epic' },
  { label: 'JACKPOT', value: 10000, color: '#EAB308', icon: Gift, rarity: 'legendary' },
];

// Weights for each segment (higher = more common)
const SEGMENT_WEIGHTS = [30, 25, 20, 12, 8, 3, 1.5, 0.5];

const LuckyWheel = ({ balance, setBalance, playerLevel, onClose }: LuckyWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const [spinData, setSpinData] = useState(() => {
    const saved = localStorage.getItem('lucky_wheel_data');
    return saved ? JSON.parse(saved) : { 
      lastSpinDate: '', 
      spinsUsedToday: 0,
      totalWon: 0, 
      totalSpins: 0,
      jackpotsWon: 0 
    };
  });

  const today = new Date().toDateString();
  const bonusSpins = Math.floor(playerLevel / 25); // Extra spin every 25 levels
  const totalSpinsAvailable = 1 + bonusSpins; // 1 base spin + bonus spins
  
  // Reset spins used if it's a new day
  const spinsUsedToday = spinData.lastSpinDate === today ? spinData.spinsUsedToday : 0;
  const remainingSpins = totalSpinsAvailable - spinsUsedToday;
  const canSpin = remainingSpins > 0;

  useEffect(() => {
    localStorage.setItem('lucky_wheel_data', JSON.stringify(spinData));
  }, [spinData]);

  const getWeightedSegment = (): number => {
    const totalWeight = SEGMENT_WEIGHTS.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < SEGMENT_WEIGHTS.length; i++) {
      random -= SEGMENT_WEIGHTS[i];
      if (random <= 0) return i;
    }
    return 0;
  };

  const spin = () => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);
    setResult(null);
    playSound('click');

    // Get weighted random segment
    const winningIndex = getWeightedSegment();
    const segment = WHEEL_SEGMENTS[winningIndex];
    
    // Calculate rotation (5-8 full spins + landing on segment)
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const targetAngle = 360 - (winningIndex * segmentAngle + segmentAngle / 2);
    const fullSpins = Math.floor(Math.random() * 3 + 5) * 360;
    const finalRotation = rotation + fullSpins + targetAngle - (rotation % 360);

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(segment);
      
      // Apply level bonus
      const levelBonus = 1 + (playerLevel * 0.01); // 1% bonus per level
      const finalValue = Math.floor(segment.value * levelBonus);
      
      setBalance(balance + finalValue);
      setSpinData((prev: typeof spinData) => ({
        ...prev,
        lastSpinDate: today,
        spinsUsedToday: (prev.lastSpinDate === today ? prev.spinsUsedToday : 0) + 1,
        totalWon: prev.totalWon + finalValue,
        totalSpins: prev.totalSpins + 1,
        jackpotsWon: segment.rarity === 'legendary' ? prev.jackpotsWon + 1 : prev.jackpotsWon,
      }));

      playSound('win');
      
      if (segment.rarity === 'legendary') {
        toast.success(`🎰 JACKPOT! +$${finalValue.toLocaleString()}!`, { duration: 5000 });
      } else if (segment.rarity === 'epic') {
        toast.success(`✨ Amazing! +$${finalValue.toLocaleString()}!`);
      } else {
        toast.success(`🎡 +$${finalValue.toLocaleString()}`);
      }
    }, 5000);
  };

  return (
    <Card className="bg-gradient-to-br from-card via-amber-950/20 to-card border-gold/30 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-gold/30 to-amber-600/20 rounded-xl glow-gold">
              <RotateCw className="w-6 h-6 text-gold" />
            </div>
            <div>
              <CardTitle className="font-display text-xl text-gradient-gold">LUCKY WHEEL</CardTitle>
              <p className="text-xs text-gold/60">Spin daily for free rewards!</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 bg-neon-blue/10 rounded-lg border border-neon-blue/20 text-center">
            <p className="text-sm font-display text-neon-blue">{remainingSpins}</p>
            <p className="text-[9px] text-muted-foreground">Spins Left</p>
          </div>
          <div className="p-2 bg-gold/10 rounded-lg border border-gold/20 text-center">
            <p className="text-sm font-display text-gold">${spinData.totalWon.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">Total Won</p>
          </div>
          <div className="p-2 bg-neon-purple/10 rounded-lg border border-neon-purple/20 text-center">
            <p className="text-sm font-display text-neon-purple">{spinData.totalSpins || 0}</p>
            <p className="text-[9px] text-muted-foreground">Total Spins</p>
          </div>
          <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20 text-center">
            <p className="text-sm font-display text-pink-400">{spinData.jackpotsWon}</p>
            <p className="text-[9px] text-muted-foreground">Jackpots</p>
          </div>
        </div>

        {/* Wheel Container */}
        <div className="relative flex items-center justify-center py-4">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-gold drop-shadow-lg" />
          
          {/* Wheel */}
          <div 
            className="relative w-64 h-64 rounded-full border-4 border-gold/50 shadow-[0_0_40px_rgba(234,179,8,0.3)]"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 5s cubic-bezier(0.2, 0.8, 0.3, 1)' : 'none',
            }}
          >
            {WHEEL_SEGMENTS.map((segment, index) => {
              const angle = (360 / WHEEL_SEGMENTS.length) * index;
              const Icon = segment.icon;
              return (
                <div
                  key={index}
                  className="absolute w-full h-full"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <div
                    className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left flex items-center justify-center"
                    style={{
                      transform: `rotate(${360 / WHEEL_SEGMENTS.length / 2}deg)`,
                      clipPath: `polygon(0 0, 100% 0, 50% 100%)`,
                      backgroundColor: segment.color,
                    }}
                  >
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <Icon className="w-4 h-4 text-white/80" />
                      <span className="text-[10px] font-display text-white font-bold mt-1">{segment.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (() => {
          const ResultIcon = result.icon;
          return (
            <div className={`text-center p-4 rounded-xl border animate-pop ${
              result.rarity === 'legendary' ? 'bg-gold/20 border-gold/40' :
              result.rarity === 'epic' ? 'bg-pink-500/20 border-pink-500/40' :
              result.rarity === 'rare' ? 'bg-green-500/20 border-green-500/40' :
              'bg-blue-500/20 border-blue-500/40'
            }`}>
              <div className="flex items-center justify-center gap-3">
                <ResultIcon className={`w-8 h-8 ${
                  result.rarity === 'legendary' ? 'text-gold' :
                  result.rarity === 'epic' ? 'text-pink-400' :
                  result.rarity === 'rare' ? 'text-green-400' :
                  'text-blue-400'
                }`} />
                <span className="font-display text-2xl">You won {result.label}!</span>
              </div>
              {playerLevel > 1 && (
                <p className="text-xs text-muted-foreground mt-2">
                  (+{playerLevel}% level bonus applied)
                </p>
              )}
            </div>
          );
        })()}

        {/* Spin Button */}
        <Button
          onClick={spin}
          disabled={!canSpin || isSpinning}
          className={`w-full py-6 text-lg font-display ${
            canSpin && !isSpinning
              ? 'bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90 animate-pulse'
              : 'bg-muted'
          }`}
        >
          {isSpinning ? (
            <span className="flex items-center gap-2">
              <RotateCw className="w-5 h-5 animate-spin" />
              Spinning...
            </span>
          ) : canSpin ? (
            <span className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Spin the Wheel! ({remainingSpins} left)
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Come back tomorrow!
            </span>
          )}
        </Button>

        {/* Level Bonus Info */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>Level {playerLevel} = +{playerLevel}% bonus on all wins</p>
          <p className="text-neon-cyan">
            Daily spins: 1 base {bonusSpins > 0 && `+ ${bonusSpins} bonus (Lv${Math.floor(playerLevel / 25) * 25})`}
          </p>
          {bonusSpins < Math.floor((playerLevel + 25) / 25) && (
            <p className="text-gold/60">Next bonus spin at Level {(Math.floor(playerLevel / 25) + 1) * 25}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LuckyWheel;