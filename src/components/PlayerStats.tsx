import { TrendingUp, TrendingDown, Target, Flame, Zap, Trophy, Gamepad2, BarChart3 } from 'lucide-react';
import { Player } from '@/hooks/usePlayers';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { RoguelikeSparkles } from '@/components/RoguelikeSparkles';

interface PlayerStatsProps {
  player: Player;
  winRate: number;
  xpProgress: number;
}

export const PlayerStats = ({ player, winRate, xpProgress }: PlayerStatsProps) => {
  const stats = player.stats;
  const isProfit = stats.totalProfit >= 0;
  
  return (
    <div className="stat-panel space-y-4">
      {/* Level & XP – roguelike header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 relative">
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(217,91%,60%)] to-[hsl(185,100%,50%)] flex items-center justify-center font-display font-black text-xl shadow-[0_0_20px_hsl(217_91%_60%/0.5),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <RoguelikeSparkles variant="gold" count={6} size="sm" spread={28} mode="twinkle" className="rounded-full" />
            <span className="relative z-10">{player.level}</span>
          </div>
          <div>
            <div className="font-display text-base font-bold">Level {player.level}</div>
            <div className="text-xs text-muted-foreground">{formatNumber(player.xp)} XP</div>
          </div>
        </div>
      </div>
      
      {/* Health-bar style XP */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground font-medium">Next level</span>
          <span className="text-neon-cyan font-bold">{Math.round(xpProgress)}%</span>
        </div>
        <div className="health-bar-track">
          <div className="health-bar-fill" style={{ width: `${xpProgress}%` }} />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-background/60 rounded-lg p-3 space-y-1 border border-border/50 hover:border-gold/20 transition-colors">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="text-xs">Games</span>
          </div>
          <div className="font-display text-lg font-bold">{formatNumber(stats.gamesPlayed, 0)}</div>
        </div>
        
        <div className="bg-background/60 rounded-lg p-3 space-y-1 border border-border/50 hover:border-gold/20 transition-colors">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Target className="w-3.5 h-3.5" />
            <span className="text-xs">Win Rate</span>
          </div>
          <div className={`font-display text-xl font-black ${winRate >= 50 ? 'text-win' : 'text-lose'}`}>
            {winRate}%
          </div>
        </div>
        
        <div className="bg-background/60 rounded-lg p-3 space-y-1 border border-border/50 hover:border-gold/20 transition-colors">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-xs">Biggest Win</span>
          </div>
          <div className="font-display text-xl font-black text-gold">
            {formatCurrency(stats.biggestWin)}
          </div>
        </div>
        
        <div className="bg-background/60 rounded-lg p-3 space-y-1 border border-border/50 hover:border-gold/20 transition-colors">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-xs">Best Multi</span>
          </div>
          <div className="font-display text-xl font-black text-neon-purple">
            {formatNumber(stats.biggestMultiplier)}x
          </div>
        </div>
      </div>

      {/* Profit & Streak */}
      <div className="flex gap-2">
        <div className={`flex-1 rounded-lg p-3 border-2 ${isProfit ? 'bg-win/15 border-win/40 shadow-[0_0_15px_hsl(var(--win)/0.2)]' : 'bg-lose/15 border-lose/40 shadow-[0_0_15px_hsl(var(--lose)/0.2)]'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            {isProfit ? <TrendingUp className="w-3.5 h-3.5 text-win" /> : <TrendingDown className="w-3.5 h-3.5 text-lose" />}
            <span className="text-xs text-muted-foreground">Total Profit</span>
          </div>
          <div className={`font-display text-xl font-black ${isProfit ? 'text-win' : 'text-lose'}`}>
            {isProfit ? '+' : ''}{formatCurrency(stats.totalProfit)}
          </div>
        </div>
        
        <div className="flex-1 bg-background/60 rounded-lg p-3 border border-border/50 hover:border-orange-500/30 transition-colors">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs text-muted-foreground">Win Streak</span>
          </div>
          <div className="font-display text-xl font-black">
            <span className="text-orange-500">{stats.currentStreak}</span>
            <span className="text-muted-foreground text-sm font-normal"> / {stats.bestStreak}</span>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="pt-3 border-t-2 border-gold/10 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <BarChart3 className="w-3 h-3" /> Total Wagered
          </span>
          <span className="font-medium">{formatCurrency(stats.totalWagered)}</span>
        </div>
        {stats.favoriteGame && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Favorite Game</span>
            <span className="font-medium text-primary">{stats.favoriteGame}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">W / L</span>
          <span>
            <span className="text-win font-medium">{formatNumber(stats.wins, 0)}</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-lose font-medium">{formatNumber(stats.losses, 0)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
