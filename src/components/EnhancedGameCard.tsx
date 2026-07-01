import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, Flame, TrendingUp } from 'lucide-react';

interface EnhancedGameCardProps {
  children: ReactNode;
  title: string;
  icon?: ReactNode;
  onQuickAction?: () => void;
  quickActionLabel?: string;
  stats?: {
    wins?: number;
    losses?: number;
    profit?: number;
  };
}

export const EnhancedGameCard = ({ children, title, icon, onQuickAction, quickActionLabel, stats }: EnhancedGameCardProps) => {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border-slate-700/50 shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 animate-pulse" />
      
      {/* Header */}
      <div className="relative flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          {icon && <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-lg shadow-purple-500/30">
            {icon}
          </div>}
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            {title}
          </h2>
        </div>
        
        {onQuickAction && quickActionLabel && (
          <Button
            onClick={onQuickAction}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
          >
            <Zap className="w-4 h-4 mr-2" />
            {quickActionLabel}
          </Button>
        )}
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="relative flex items-center gap-4 px-4 py-2 bg-black/30 border-b border-slate-700/50">
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-300">Wins: <span className="font-bold text-white">{stats.wins || 0}</span></span>
          </div>
          <div className="w-px h-4 bg-slate-600" />
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">Profit: <span className="font-bold text-green-400">${stats.profit || 0}</span></span>
          </div>
          <div className="w-px h-4 bg-slate-600" />
          <div className="flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300">Rate: <span className="font-bold text-white">{stats.wins && stats.losses ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1) : 0}%</span></span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative p-4">
        {children}
      </div>

      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-0 hover:opacity-20 transition-opacity duration-300 -z-10" />
    </Card>
  );
};
