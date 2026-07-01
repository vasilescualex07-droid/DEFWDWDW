import { useState, useEffect } from 'react';
import { Crown, Lock, Spade, Dices, Gem, Zap, Star, Trophy, Coins, TrendingUp, Gift, Sparkles, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { playSound } from '@/hooks/useSounds';
import { toast } from 'sonner';

interface VIPRoomProps {
  balance: number;
  playerLevel: number;
  onWin: (amount: number, bet?: number, multiplier?: number) => void;
  onLose: (amount: number) => void;
  onClose: () => void;
}

interface VIPTier {
  name: string;
  minLevel: number;
  color: string;
  multiplierRange: [number, number];
  minBet: number;
  cashbackRate: number;
  icon: React.ElementType;
}

const VIP_TIERS: VIPTier[] = [
  { name: 'Silver', minLevel: 30, color: 'from-gray-400 to-gray-600', multiplierRange: [2, 8], minBet: 50, cashbackRate: 0.02, icon: Star },
  { name: 'Gold', minLevel: 40, color: 'from-yellow-400 to-amber-600', multiplierRange: [2.5, 12], minBet: 100, cashbackRate: 0.03, icon: Crown },
  { name: 'Platinum', minLevel: 50, color: 'from-cyan-400 to-blue-600', multiplierRange: [3, 18], minBet: 250, cashbackRate: 0.04, icon: Gem },
  { name: 'Diamond', minLevel: 75, color: 'from-purple-400 to-pink-600', multiplierRange: [4, 25], minBet: 500, cashbackRate: 0.05, icon: Sparkles },
];

interface VIPGame {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  winChance: number;
  color: string;
  cooldown: number; // seconds between plays
}

const VIP_GAMES: VIPGame[] = [
  { id: 'diamond-dice', name: 'Diamond Dice', icon: Dices, description: 'Roll diamond-encrusted dice', winChance: 0.35, color: 'from-neon-cyan to-neon-blue', cooldown: 10 },
  { id: 'platinum-blackjack', name: 'Platinum Blackjack', icon: Spade, description: 'High-stakes card action', winChance: 0.40, color: 'from-purple-500 to-pink-500', cooldown: 15 },
  { id: 'ruby-slots', name: 'Ruby Slots', icon: Gem, description: 'Spin for jackpots', winChance: 0.25, color: 'from-red-500 to-orange-500', cooldown: 8 },
  { id: 'elite-roulette', name: 'Elite Roulette', icon: Target, description: 'VIP-only roulette', winChance: 0.30, color: 'from-gold to-amber-600', cooldown: 12 },
  { id: 'lucky-lightning', name: 'Lucky Lightning', icon: Zap, description: 'Strike it rich', winChance: 0.20, color: 'from-yellow-400 to-orange-500', cooldown: 20 },
  { id: 'crown-poker', name: 'Crown Poker', icon: Crown, description: 'Ultimate poker', winChance: 0.38, color: 'from-emerald-500 to-teal-600', cooldown: 15 },
];

export const VIPRoom = ({ balance, playerLevel, onWin, onLose, onClose }: VIPRoomProps) => {
  const [bet, setBet] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [selectedGame, setSelectedGame] = useState<VIPGame | null>(null);
  const [gameCooldowns, setGameCooldowns] = useState<Record<string, number>>({});
  const [vipStats, setVipStats] = useState(() => {
    const saved = localStorage.getItem('vip_stats');
    return saved ? JSON.parse(saved) : { totalWon: 0, totalLost: 0, gamesPlayed: 0, biggestWin: 0, cashbackEarned: 0 };
  });
  const [dailyBonus, setDailyBonus] = useState(() => {
    const saved = localStorage.getItem('vip_daily_bonus');
    if (!saved) return { claimed: false, date: '' };
    return JSON.parse(saved);
  });
  const [dailyPlays, setDailyPlays] = useState(() => {
    const saved = localStorage.getItem('vip_daily_plays');
    if (!saved) return { count: 0, date: '' };
    const data = JSON.parse(saved);
    const today = new Date().toDateString();
    return data.date === today ? data : { count: 0, date: today };
  });

  const REQUIRED_LEVEL = 30;
  const MAX_DAILY_PLAYS = 50; // Limit daily VIP plays
  const isUnlocked = playerLevel >= REQUIRED_LEVEL;

  // Determine current VIP tier
  const currentTier = [...VIP_TIERS].reverse().find(t => playerLevel >= t.minLevel) || VIP_TIERS[0];
  const nextTier = VIP_TIERS.find(t => playerLevel < t.minLevel);

  useEffect(() => {
    localStorage.setItem('vip_stats', JSON.stringify(vipStats));
  }, [vipStats]);

  useEffect(() => {
    localStorage.setItem('vip_daily_bonus', JSON.stringify(dailyBonus));
  }, [dailyBonus]);

  useEffect(() => {
    localStorage.setItem('vip_daily_plays', JSON.stringify(dailyPlays));
  }, [dailyPlays]);

  // Cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setGameCooldowns(prev => {
        const updated: Record<string, number> = {};
        for (const [key, value] of Object.entries(prev)) {
          if (value > 1) updated[key] = value - 1;
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const claimDailyBonus = () => {
    const today = new Date().toDateString();
    if (dailyBonus.claimed && dailyBonus.date === today) {
      toast.error('Daily bonus already claimed!');
      return;
    }

    const bonusAmount = 50 * (VIP_TIERS.indexOf(currentTier) + 1); // Reduced from 100
    onWin(bonusAmount, 0, 1);
    setDailyBonus({ claimed: true, date: today });
    toast.success(`👑 VIP Daily Bonus: +$${bonusAmount}`);
    playSound('cashout');
  };

  const canClaimDaily = () => {
    const today = new Date().toDateString();
    return !dailyBonus.claimed || dailyBonus.date !== today;
  };

  const playVIPGame = (game: VIPGame) => {
    // Check cooldown
    if (gameCooldowns[game.id] && gameCooldowns[game.id] > 0) {
      toast.error(`Wait ${gameCooldowns[game.id]}s before playing ${game.name} again!`);
      return;
    }
    
    // Check daily limit
    const today = new Date().toDateString();
    if (dailyPlays.date === today && dailyPlays.count >= MAX_DAILY_PLAYS) {
      toast.error(`Daily VIP play limit reached (${MAX_DAILY_PLAYS}). Come back tomorrow!`);
      return;
    }
    
    if (bet > balance) {
      toast.error('Insufficient balance!');
      return;
    }
    if (bet < currentTier.minBet) {
      toast.error(`Minimum bet is $${currentTier.minBet} for ${currentTier.name} tier!`);
      return;
    }

    setSelectedGame(game);
    setIsPlaying(true);
    setGameCooldowns(prev => ({ ...prev, [game.id]: game.cooldown }));
    setDailyPlays(prev => ({
      count: prev.date === today ? prev.count + 1 : 1,
      date: today
    }));
    playSound('click');

    setTimeout(() => {
      const won = Math.random() < game.winChance;

      if (won) {
        const [minMult, maxMult] = currentTier.multiplierRange;
        // Weighted towards lower multipliers to reduce expected value
        const rand = Math.random();
        const skewedRand = rand * rand; // Square to skew towards lower values
        const mult = minMult + skewedRand * (maxMult - minMult);
        const roundedMult = Math.round(mult * 10) / 10;
        const winAmount = bet * roundedMult;
        
        setMultiplier(roundedMult);
        setResult('win');
        onWin(winAmount, bet, roundedMult);
        playSound('win');
        
        setVipStats((prev: typeof vipStats) => ({
          ...prev,
          totalWon: prev.totalWon + winAmount,
          gamesPlayed: prev.gamesPlayed + 1,
          biggestWin: Math.max(prev.biggestWin, winAmount),
        }));
        
        toast.success(`💎 ${currentTier.name} WIN! ${roundedMult}x - $${winAmount.toFixed(2)}`);
      } else {
        setResult('lose');
        onLose(bet);
        playSound('lose');
        
        // Apply cashback
        const cashback = bet * currentTier.cashbackRate;
        if (cashback > 0) {
          setTimeout(() => {
            onWin(cashback, 0, 1);
            setVipStats((prev: typeof vipStats) => ({
              ...prev,
              totalLost: prev.totalLost + bet,
              gamesPlayed: prev.gamesPlayed + 1,
              cashbackEarned: prev.cashbackEarned + cashback,
            }));
            toast.info(`🔄 ${currentTier.name} Cashback: +$${cashback.toFixed(2)}`);
          }, 1000);
        } else {
          setVipStats((prev: typeof vipStats) => ({
            ...prev,
            totalLost: prev.totalLost + bet,
            gamesPlayed: prev.gamesPlayed + 1,
          }));
        }
      }

      setIsPlaying(false);
      setTimeout(() => {
        setResult(null);
        setSelectedGame(null);
      }, 2500);
    }, 1800);
  };

  if (!isUnlocked) {
    return (
      <Card className="bg-gradient-to-br from-card via-card to-purple-950/20 border-gold/30">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-gold/20 to-yellow-600/10 rounded-full animate-pulse-glow">
              <Lock className="w-12 h-12 text-gold" />
            </div>
          </div>
          <CardTitle className="font-display text-2xl text-gradient-gold">VIP ROOM LOCKED</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            You need <span className="text-gold font-bold">Level {REQUIRED_LEVEL}</span> to access the VIP High-Stakes Room
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Your level:</span>
            <span className="text-neon-blue font-display font-bold text-lg">{playerLevel}</span>
            <span className="text-muted-foreground">/ {REQUIRED_LEVEL}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-neon-blue to-gold transition-all duration-500"
              style={{ width: `${Math.min((playerLevel / REQUIRED_LEVEL) * 100, 100)}%` }}
            />
          </div>
          
          {/* VIP Preview */}
          <div className="mt-6 p-4 bg-gold/5 border border-gold/20 rounded-xl text-left">
            <h4 className="font-display text-sm text-gold mb-3">VIP Perks Preview:</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><Zap className="w-3 h-3 text-gold" /> 3x - 100x Multipliers</li>
              <li className="flex items-center gap-2"><Coins className="w-3 h-3 text-gold" /> Up to 12% Loss Cashback</li>
              <li className="flex items-center gap-2"><Gift className="w-3 h-3 text-gold" /> Daily VIP Bonuses</li>
              <li className="flex items-center gap-2"><Crown className="w-3 h-3 text-gold" /> Exclusive VIP Games</li>
              <li className="flex items-center gap-2"><Trophy className="w-3 h-3 text-gold" /> 4 VIP Tier Ranks</li>
            </ul>
          </div>
          
          <Button variant="outline" onClick={onClose} className="mt-4">
            Back to Games
          </Button>
        </CardContent>
      </Card>
    );
  }

  const TierIcon = currentTier.icon;

  return (
    <Card className="bg-gradient-to-br from-card via-purple-950/30 to-gold/5 border-gold/40 overflow-hidden relative">
      {/* VIP Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-gold/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 bg-gradient-to-br ${currentTier.color} rounded-xl`}>
              <TierIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="font-display text-xl text-gradient-gold">VIP {currentTier.name.toUpperCase()}</CardTitle>
              <p className="text-xs text-gold/60">Level {playerLevel} • {currentTier.cashbackRate * 100}% Cashback</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        {/* Tier Progress */}
        {nextTier && (
          <div className="p-3 bg-black/20 rounded-lg border border-white/10">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Next tier: {nextTier.name}</span>
              <span className="text-gold">Level {nextTier.minLevel}</span>
            </div>
            <Progress value={(playerLevel / nextTier.minLevel) * 100} className="h-2" />
          </div>
        )}

        {/* Daily Bonus */}
        <Button
          onClick={claimDailyBonus}
          disabled={!canClaimDaily()}
          className={`w-full ${canClaimDaily() ? 'bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90 animate-pulse' : 'bg-muted'}`}
        >
          <Gift className="w-4 h-4 mr-2" />
          {canClaimDaily() ? `Claim Daily Bonus (+$${100 * (VIP_TIERS.indexOf(currentTier) + 1)})` : 'Daily Bonus Claimed ✓'}
        </Button>

        {/* VIP Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 bg-win/10 rounded-lg border border-win/20 text-center">
            <p className="text-sm font-display text-win">${vipStats.totalWon.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">Won</p>
          </div>
          <div className="p-2 bg-lose/10 rounded-lg border border-lose/20 text-center">
            <p className="text-sm font-display text-lose">${vipStats.totalLost.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">Lost</p>
          </div>
          <div className="p-2 bg-neon-cyan/10 rounded-lg border border-neon-cyan/20 text-center">
            <p className="text-sm font-display text-neon-cyan">${vipStats.cashbackEarned.toFixed(0)}</p>
            <p className="text-[9px] text-muted-foreground">Cashback</p>
          </div>
          <div className="p-2 bg-gold/10 rounded-lg border border-gold/20 text-center">
            <p className="text-sm font-display text-gold">${vipStats.biggestWin.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">Best Win</p>
          </div>
        </div>

        {/* Bet Input */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Bet Amount (min ${currentTier.minBet})</label>
            <Input
              type="number"
              value={bet}
              onChange={(e) => setBet(Math.max(currentTier.minBet, Number(e.target.value)))}
              min={currentTier.minBet}
              className="bg-secondary/50 border-gold/20 font-display text-lg"
            />
          </div>
          <div className="flex gap-2 mt-5">
            <Button size="sm" variant="outline" onClick={() => setBet(currentTier.minBet)} className="border-gold/30 text-gold">MIN</Button>
            <Button size="sm" variant="outline" onClick={() => setBet(Math.floor(balance / 2))} className="border-gold/30 text-gold">½</Button>
            <Button size="sm" variant="outline" onClick={() => setBet(Math.floor(balance))} className="border-gold/30 text-gold">MAX</Button>
          </div>
        </div>

        {/* VIP Games */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {VIP_GAMES.map((game) => {
            const Icon = game.icon;
            const isActive = selectedGame?.id === game.id;
            const cooldown = gameCooldowns[game.id] || 0;
            const onCooldown = cooldown > 0;
            return (
              <button
                key={game.id}
                onClick={() => playVIPGame(game)}
                disabled={isPlaying || onCooldown}
                className={`relative p-4 rounded-xl bg-gradient-to-br ${game.color} bg-opacity-20 border border-white/10 transition-all duration-300 ${(isPlaying || onCooldown) ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg'} group ${isActive ? 'ring-2 ring-white' : ''}`}
              >
                <div className="absolute inset-0 bg-black/50 rounded-xl" />
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <Icon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                  <span className="font-display text-xs text-white">{game.name}</span>
                  {onCooldown ? (
                    <span className="text-[10px] text-yellow-400 font-bold">{cooldown}s cooldown</span>
                  ) : (
                    <span className="text-[10px] text-white/60">{Math.round(game.winChance * 100)}% win</span>
                  )}
                </div>
                {isPlaying && isActive && (
                  <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Daily plays remaining */}
        <div className="text-center text-xs text-muted-foreground">
          Daily plays: {MAX_DAILY_PLAYS - (dailyPlays.date === new Date().toDateString() ? dailyPlays.count : 0)} / {MAX_DAILY_PLAYS} remaining
        </div>

        {/* Result Display */}
        {result && (
          <div className={`text-center p-4 rounded-xl ${result === 'win' ? 'bg-win/20 border border-win/40' : 'bg-lose/20 border border-lose/40'} animate-pop`}>
            {result === 'win' ? (
              <div className="flex items-center justify-center gap-3">
                <Star className="w-8 h-8 text-gold animate-spin-slow" />
                <span className="font-display text-2xl text-gold">{multiplier}x WIN!</span>
                <Star className="w-8 h-8 text-gold animate-spin-slow" />
              </div>
            ) : (
              <div>
                <span className="font-display text-xl text-lose">Better luck next time!</span>
                {currentTier.cashbackRate > 0 && (
                  <p className="text-xs text-neon-cyan mt-1">+{currentTier.cashbackRate * 100}% cashback incoming...</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIP Tier Perks */}
        <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
          <div className="p-2 bg-gold/10 rounded-lg border border-gold/20">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-gold" />
            <span className="text-gold/80">{currentTier.multiplierRange[0]}-{currentTier.multiplierRange[1]}x</span>
          </div>
          <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <Coins className="w-4 h-4 mx-auto mb-1 text-purple-400" />
            <span className="text-purple-400/80">{currentTier.cashbackRate * 100}% Back</span>
          </div>
          <div className="p-2 bg-neon-cyan/10 rounded-lg border border-neon-cyan/20">
            <Clock className="w-4 h-4 mx-auto mb-1 text-neon-cyan" />
            <span className="text-neon-cyan/80">Daily Bonus</span>
          </div>
          <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
            <Crown className="w-4 h-4 mx-auto mb-1 text-pink-400" />
            <span className="text-pink-400/80">{currentTier.name}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
