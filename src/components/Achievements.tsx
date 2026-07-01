import { useState, useEffect } from 'react';
import { Award, Star, Trophy, Zap, Target, Flame, Crown, Gem, Lock, Check, X, Gift, Coins, TrendingUp, Clock, Skull, Swords, Heart, Shield, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Player } from '@/hooks/usePlayers';
import { toast } from 'sonner';

interface AchievementsProps {
  player: Player;
  onClose: () => void;
  onClaimReward?: (amount: number) => void;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  requirement: (player: Player) => boolean;
  progress: (player: Player) => number;
  maxProgress: number;
  reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  category: 'level' | 'games' | 'streak' | 'wins' | 'multiplier' | 'profit' | 'special';
  secretUntilUnlocked?: boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  // Level Achievements
  { id: 'first-steps', name: 'First Steps', description: 'Reach level 5', icon: Star, color: 'text-green-400', requirement: (p) => p.level >= 5, progress: (p) => p.level, maxProgress: 5, reward: 50, rarity: 'common', category: 'level' },
  { id: 'rising-star', name: 'Rising Star', description: 'Reach level 15', icon: Star, color: 'text-blue-400', requirement: (p) => p.level >= 15, progress: (p) => p.level, maxProgress: 15, reward: 200, rarity: 'rare', category: 'level' },
  { id: 'veteran', name: 'Veteran', description: 'Reach level 30', icon: Crown, color: 'text-purple-400', requirement: (p) => p.level >= 30, progress: (p) => p.level, maxProgress: 30, reward: 1000, rarity: 'epic', category: 'level' },
  { id: 'legend', name: 'Living Legend', description: 'Reach level 50', icon: Crown, color: 'text-gold', requirement: (p) => p.level >= 50, progress: (p) => p.level, maxProgress: 50, reward: 5000, rarity: 'legendary', category: 'level' },
  { id: 'god-tier', name: 'God Tier', description: 'Reach level 100', icon: Sparkles, color: 'text-pink-400', requirement: (p) => p.level >= 100, progress: (p) => p.level, maxProgress: 100, reward: 25000, rarity: 'mythic', category: 'level' },
  
  // Games Played
  { id: 'gambler', name: 'Gambler', description: 'Play 50 games', icon: Target, color: 'text-neon-cyan', requirement: (p) => p.stats.gamesPlayed >= 50, progress: (p) => p.stats.gamesPlayed, maxProgress: 50, reward: 100, rarity: 'common', category: 'games' },
  { id: 'addict', name: 'Addicted', description: 'Play 500 games', icon: Target, color: 'text-orange-400', requirement: (p) => p.stats.gamesPlayed >= 500, progress: (p) => p.stats.gamesPlayed, maxProgress: 500, reward: 500, rarity: 'rare', category: 'games' },
  { id: 'no-life', name: 'No Life', description: 'Play 2000 games', icon: Flame, color: 'text-red-400', requirement: (p) => p.stats.gamesPlayed >= 2000, progress: (p) => p.stats.gamesPlayed, maxProgress: 2000, reward: 2500, rarity: 'epic', category: 'games' },
  { id: 'eternal', name: 'Eternal Gambler', description: 'Play 10000 games', icon: Clock, color: 'text-pink-400', requirement: (p) => p.stats.gamesPlayed >= 10000, progress: (p) => p.stats.gamesPlayed, maxProgress: 10000, reward: 15000, rarity: 'mythic', category: 'games' },
  
  // Win Streaks
  { id: 'hot-streak', name: 'Hot Streak', description: 'Win 5 games in a row', icon: Flame, color: 'text-orange-400', requirement: (p) => p.stats.bestStreak >= 5, progress: (p) => p.stats.bestStreak, maxProgress: 5, reward: 150, rarity: 'common', category: 'streak' },
  { id: 'on-fire', name: 'On Fire', description: 'Win 10 games in a row', icon: Flame, color: 'text-red-500', requirement: (p) => p.stats.bestStreak >= 10, progress: (p) => p.stats.bestStreak, maxProgress: 10, reward: 500, rarity: 'rare', category: 'streak' },
  { id: 'unstoppable', name: 'Unstoppable', description: 'Win 20 games in a row', icon: Zap, color: 'text-gold', requirement: (p) => p.stats.bestStreak >= 20, progress: (p) => p.stats.bestStreak, maxProgress: 20, reward: 2000, rarity: 'legendary', category: 'streak' },
  { id: 'unbreakable', name: 'Unbreakable', description: 'Win 50 games in a row', icon: Shield, color: 'text-pink-400', requirement: (p) => p.stats.bestStreak >= 50, progress: (p) => p.stats.bestStreak, maxProgress: 50, reward: 10000, rarity: 'mythic', category: 'streak' },
  
  // Total Wins
  { id: 'winner', name: 'Winner', description: 'Win 25 games', icon: Trophy, color: 'text-green-400', requirement: (p) => p.stats.wins >= 25, progress: (p) => p.stats.wins, maxProgress: 25, reward: 75, rarity: 'common', category: 'wins' },
  { id: 'champion', name: 'Champion', description: 'Win 100 games', icon: Trophy, color: 'text-blue-400', requirement: (p) => p.stats.wins >= 100, progress: (p) => p.stats.wins, maxProgress: 100, reward: 300, rarity: 'rare', category: 'wins' },
  { id: 'master', name: 'Master', description: 'Win 500 games', icon: Trophy, color: 'text-purple-400', requirement: (p) => p.stats.wins >= 500, progress: (p) => p.stats.wins, maxProgress: 500, reward: 1500, rarity: 'epic', category: 'wins' },
  { id: 'grandmaster', name: 'Grandmaster', description: 'Win 2000 games', icon: Crown, color: 'text-gold', requirement: (p) => p.stats.wins >= 2000, progress: (p) => p.stats.wins, maxProgress: 2000, reward: 7500, rarity: 'legendary', category: 'wins' },
  
  // Big Wins
  { id: 'lucky-break', name: 'Lucky Break', description: 'Win $100 in one bet', icon: Gem, color: 'text-green-400', requirement: (p) => p.stats.biggestWin >= 100, progress: (p) => p.stats.biggestWin, maxProgress: 100, reward: 50, rarity: 'common', category: 'profit' },
  { id: 'jackpot', name: 'Jackpot', description: 'Win $1000 in one bet', icon: Gem, color: 'text-neon-purple', requirement: (p) => p.stats.biggestWin >= 1000, progress: (p) => p.stats.biggestWin, maxProgress: 1000, reward: 300, rarity: 'rare', category: 'profit' },
  { id: 'whale', name: 'Whale', description: 'Win $10000 in one bet', icon: Trophy, color: 'text-gold', requirement: (p) => p.stats.biggestWin >= 10000, progress: (p) => p.stats.biggestWin, maxProgress: 10000, reward: 2000, rarity: 'legendary', category: 'profit' },
  { id: 'mega-whale', name: 'Mega Whale', description: 'Win $100000 in one bet', icon: Sparkles, color: 'text-pink-400', requirement: (p) => p.stats.biggestWin >= 100000, progress: (p) => p.stats.biggestWin, maxProgress: 100000, reward: 15000, rarity: 'mythic', category: 'profit' },
  
  // High Multipliers
  { id: 'multiplier-hunter', name: 'Multiplier Hunter', description: 'Hit a 5x multiplier', icon: TrendingUp, color: 'text-green-400', requirement: (p) => p.stats.biggestMultiplier >= 5, progress: (p) => p.stats.biggestMultiplier, maxProgress: 5, reward: 75, rarity: 'common', category: 'multiplier' },
  { id: 'multiplier-master', name: 'Multiplier Master', description: 'Hit a 10x multiplier', icon: Zap, color: 'text-neon-blue', requirement: (p) => p.stats.biggestMultiplier >= 10, progress: (p) => p.stats.biggestMultiplier, maxProgress: 10, reward: 200, rarity: 'rare', category: 'multiplier' },
  { id: 'moon-shot', name: 'Moon Shot', description: 'Hit a 50x multiplier', icon: Zap, color: 'text-neon-purple', requirement: (p) => p.stats.biggestMultiplier >= 50, progress: (p) => p.stats.biggestMultiplier, maxProgress: 50, reward: 1000, rarity: 'epic', category: 'multiplier' },
  { id: 'to-the-stars', name: 'To The Stars', description: 'Hit a 100x multiplier', icon: Sparkles, color: 'text-gold', requirement: (p) => p.stats.biggestMultiplier >= 100, progress: (p) => p.stats.biggestMultiplier, maxProgress: 100, reward: 3000, rarity: 'legendary', category: 'multiplier' },
  { id: 'galaxy-brain', name: 'Galaxy Brain', description: 'Hit a 500x multiplier', icon: Sparkles, color: 'text-pink-400', requirement: (p) => p.stats.biggestMultiplier >= 500, progress: (p) => p.stats.biggestMultiplier, maxProgress: 500, reward: 20000, rarity: 'mythic', category: 'multiplier' },
  
  // Total Profit
  { id: 'profit', name: 'In Profit', description: 'Have $500 total profit', icon: Coins, color: 'text-win', requirement: (p) => p.stats.totalProfit >= 500, progress: (p) => Math.max(0, p.stats.totalProfit), maxProgress: 500, reward: 100, rarity: 'common', category: 'profit' },
  { id: 'rich', name: 'Getting Rich', description: 'Have $5000 total profit', icon: Coins, color: 'text-gold', requirement: (p) => p.stats.totalProfit >= 5000, progress: (p) => Math.max(0, p.stats.totalProfit), maxProgress: 5000, reward: 1000, rarity: 'epic', category: 'profit' },
  { id: 'millionaire', name: 'Millionaire', description: 'Have $50000 total profit', icon: Crown, color: 'text-gold', requirement: (p) => p.stats.totalProfit >= 50000, progress: (p) => Math.max(0, p.stats.totalProfit), maxProgress: 50000, reward: 5000, rarity: 'legendary', category: 'profit' },
  
  // Special / Secret Achievements
  { id: 'risk-taker', name: 'Risk Taker', description: 'Wager $10000 total', icon: Heart, color: 'text-red-400', requirement: (p) => p.stats.totalWagered >= 10000, progress: (p) => p.stats.totalWagered, maxProgress: 10000, reward: 500, rarity: 'rare', category: 'special' },
  { id: 'high-roller', name: 'High Roller', description: 'Wager $100000 total', icon: Heart, color: 'text-purple-400', requirement: (p) => p.stats.totalWagered >= 100000, progress: (p) => p.stats.totalWagered, maxProgress: 100000, reward: 3000, rarity: 'epic', category: 'special' },
  { id: 'comeback-kid', name: 'Comeback Kid', description: 'Win after going below $10 balance', icon: Shield, color: 'text-neon-cyan', requirement: (p) => p.balance > 100 && p.stats.losses > 0, progress: (p) => p.balance > 100 ? 1 : 0, maxProgress: 1, reward: 250, rarity: 'rare', category: 'special', secretUntilUnlocked: true },
  { id: 'boss-slayer', name: 'Boss Slayer', description: 'Defeat all 4 bosses', icon: Skull, color: 'text-lose', requirement: () => false, progress: () => 0, maxProgress: 4, reward: 5000, rarity: 'legendary', category: 'special' },
  { id: 'vip-elite', name: 'VIP Elite', description: 'Win $50000 in VIP room', icon: Crown, color: 'text-gold', requirement: () => false, progress: () => 0, maxProgress: 50000, reward: 10000, rarity: 'legendary', category: 'special' },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Unlock 30 achievements', icon: Award, color: 'text-pink-400', requirement: () => false, progress: () => 0, maxProgress: 30, reward: 25000, rarity: 'mythic', category: 'special' },
];

const rarityColors = {
  common: 'border-gray-500/30 bg-gray-500/5',
  rare: 'border-blue-500/30 bg-blue-500/5',
  epic: 'border-purple-500/30 bg-purple-500/5',
  legendary: 'border-gold/30 bg-gold/5',
  mythic: 'border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-purple-500/10',
};

const rarityGlow = {
  common: '',
  rare: 'shadow-blue-500/20',
  epic: 'shadow-purple-500/20',
  legendary: 'shadow-gold/30 shadow-lg',
  mythic: 'shadow-pink-500/40 shadow-xl animate-pulse',
};

const categoryIcons = {
  level: Star,
  games: Target,
  streak: Flame,
  wins: Trophy,
  multiplier: Zap,
  profit: Coins,
  special: Gift,
};

const categoryNames = {
  level: 'Level',
  games: 'Games Played',
  streak: 'Win Streaks',
  wins: 'Total Wins',
  multiplier: 'Multipliers',
  profit: 'Profit',
  special: 'Special',
};

export const Achievements = ({ player, onClose, onClaimReward }: AchievementsProps) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [claimedAchievements, setClaimedAchievements] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(`claimed_achievements_${player.name}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(`claimed_achievements_${player.name}`, JSON.stringify([...claimedAchievements]));
  }, [claimedAchievements, player.name]);

  // Calculate unlocked count dynamically based on the perfectionist achievement
  const calculateUnlockedCount = () => {
    let count = 0;
    for (const a of ACHIEVEMENTS) {
      if (a.id === 'perfectionist') continue;
      if (a.requirement(player)) count++;
    }
    return count;
  };

  const unlockedCount = calculateUnlockedCount();
  const totalRewards = ACHIEVEMENTS.filter(a => a.requirement(player) && claimedAchievements.has(a.id)).reduce((sum, a) => sum + a.reward, 0);
  const unclaimedRewards = ACHIEVEMENTS.filter(a => a.requirement(player) && !claimedAchievements.has(a.id)).reduce((sum, a) => sum + a.reward, 0);

  // Check perfectionist dynamically
  const isPerfectionistUnlocked = unlockedCount >= 30;

  const filteredAchievements = ACHIEVEMENTS.filter(a => {
    // Handle perfectionist specially
    const isUnlocked = a.id === 'perfectionist' ? isPerfectionistUnlocked : a.requirement(player);
    
    if (a.secretUntilUnlocked && !isUnlocked) return false;
    if (filter === 'unlocked') return isUnlocked;
    if (filter === 'locked') return !isUnlocked;
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    return true;
  });

  const claimReward = (achievement: Achievement) => {
    if (claimedAchievements.has(achievement.id)) return;
    setClaimedAchievements(prev => new Set([...prev, achievement.id]));
    onClaimReward?.(achievement.reward);
    toast.success(`🏆 Claimed ${achievement.name} reward: +$${achievement.reward}`);
  };

  const claimAll = () => {
    const unclaimed = ACHIEVEMENTS.filter(a => {
      const isUnlocked = a.id === 'perfectionist' ? isPerfectionistUnlocked : a.requirement(player);
      return isUnlocked && !claimedAchievements.has(a.id);
    });
    
    if (unclaimed.length === 0) return;
    
    const newClaimed = new Set(claimedAchievements);
    let totalClaimed = 0;
    unclaimed.forEach(a => {
      newClaimed.add(a.id);
      totalClaimed += a.reward;
    });
    
    setClaimedAchievements(newClaimed);
    onClaimReward?.(totalClaimed);
    toast.success(`🏆 Claimed ${unclaimed.length} rewards: +$${totalClaimed}`);
  };

  const categories = ['all', 'level', 'games', 'streak', 'wins', 'multiplier', 'profit', 'special'];

  return (
    <Card className="bg-gradient-to-br from-card via-neon-purple/5 to-card border-neon-purple/30 max-h-[85vh] overflow-hidden flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-neon-purple/30 to-pink-600/20 rounded-xl glow-purple">
              <Award className="w-6 h-6 text-neon-purple" />
            </div>
            <div>
              <CardTitle className="font-display text-xl text-gradient-purple">ACHIEVEMENTS</CardTitle>
              <p className="text-xs text-neon-purple/60">{unlockedCount}/{ACHIEVEMENTS.length} unlocked</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto flex-1">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-neon-purple/10 rounded-xl border border-neon-purple/20 text-center">
            <p className="text-xl font-display text-neon-purple">{unlockedCount}</p>
            <p className="text-[10px] text-muted-foreground">Unlocked</p>
          </div>
          <div className="p-3 bg-gold/10 rounded-xl border border-gold/20 text-center">
            <p className="text-xl font-display text-gold">${totalRewards.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Claimed</p>
          </div>
          <div className="p-3 bg-win/10 rounded-xl border border-win/20 text-center">
            <p className="text-xl font-display text-win">${unclaimedRewards.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Unclaimed</p>
          </div>
        </div>

        {/* Claim All Button */}
        {unclaimedRewards > 0 && (
          <Button 
            onClick={claimAll} 
            className="w-full bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90"
          >
            <Gift className="w-4 h-4 mr-2" />
            Claim All Rewards (${unclaimedRewards.toLocaleString()})
          </Button>
        )}

        {/* Category Filter */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const Icon = cat === 'all' ? Award : categoryIcons[cat as keyof typeof categoryIcons];
            return (
              <Button
                key={cat}
                size="sm"
                variant={categoryFilter === cat ? 'default' : 'outline'}
                onClick={() => setCategoryFilter(cat)}
                className="text-[10px] px-2 shrink-0"
              >
                <Icon className="w-3 h-3 mr-1" />
                {cat === 'all' ? 'All' : categoryNames[cat as keyof typeof categoryNames]}
              </Button>
            );
          })}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'unlocked', 'locked'] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className="flex-1 text-xs capitalize"
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Rarity Legend */}
        <div className="flex gap-2 justify-center text-[10px]">
          <span className="text-gray-400">● Common</span>
          <span className="text-blue-400">● Rare</span>
          <span className="text-purple-400">● Epic</span>
          <span className="text-gold">● Legendary</span>
          <span className="text-pink-400">● Mythic</span>
        </div>

        {/* Achievement List */}
        <div className="space-y-2">
          {filteredAchievements.map((achievement) => {
            const Icon = achievement.icon;
            const isUnlocked = achievement.id === 'perfectionist' ? isPerfectionistUnlocked : achievement.requirement(player);
            const isClaimed = claimedAchievements.has(achievement.id);
            const progress = achievement.id === 'perfectionist' ? unlockedCount : Math.min(achievement.progress(player), achievement.maxProgress);
            const progressPercent = (progress / achievement.maxProgress) * 100;

            return (
              <div
                key={achievement.id}
                className={`p-3 rounded-xl border transition-all ${rarityColors[achievement.rarity]} ${isUnlocked ? rarityGlow[achievement.rarity] : 'opacity-60'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-white/10' : 'bg-black/20'}`}>
                    {isUnlocked ? (
                      <Icon className={`w-5 h-5 ${achievement.color}`} />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-display text-sm ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {achievement.name}
                      </h4>
                      {isUnlocked && isClaimed && <Check className="w-4 h-4 text-win shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    {!isUnlocked && (
                      <div className="mt-2">
                        <Progress value={progressPercent} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {typeof progress === 'number' ? progress.toLocaleString() : progress} / {achievement.maxProgress.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-display ${
                      achievement.rarity === 'mythic' ? 'text-pink-400' :
                      achievement.rarity === 'legendary' ? 'text-gold' :
                      achievement.rarity === 'epic' ? 'text-purple-400' :
                      achievement.rarity === 'rare' ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {achievement.rarity.toUpperCase()}
                    </span>
                    {isUnlocked && !isClaimed ? (
                      <Button 
                        size="sm" 
                        onClick={() => claimReward(achievement)}
                        className="mt-1 h-6 text-xs bg-win hover:bg-win/80"
                      >
                        +${achievement.reward}
                      </Button>
                    ) : (
                      <p className={`text-xs mt-0.5 ${isClaimed ? 'text-muted-foreground' : 'text-win'}`}>
                        {isClaimed ? 'Claimed' : `+$${achievement.reward}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
