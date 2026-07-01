import { useState, useEffect } from 'react';
import { Sparkles, Trophy, Skull } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { RoguelikeSparkles } from '@/components/RoguelikeSparkles';

interface Bet {
  id: string;
  player: string;
  game: string;
  amount: number;
  multiplier: number;
  profit: number;
  won: boolean;
  timestamp: number;
}

const BETS_KEY = 'casino_recent_bets';
const MAX_BETS = 15;

export const addBetToHistory = (bet: Omit<Bet, 'id' | 'timestamp'>) => {
  const stored = localStorage.getItem(BETS_KEY);
  const bets: Bet[] = stored ? JSON.parse(stored) : [];
  
  const newBet: Bet = {
    ...bet,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
  };
  
  const updated = [newBet, ...bets].slice(0, MAX_BETS);
  localStorage.setItem(BETS_KEY, JSON.stringify(updated));
  
  window.dispatchEvent(new CustomEvent('newBet', { detail: newBet }));
};

export const RecentBets = () => {
  const [bets, setBets] = useState<Bet[]>(() => {
    const stored = localStorage.getItem(BETS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    const handleNewBet = (e: CustomEvent<Bet>) => {
      setBets(prev => [e.detail, ...prev].slice(0, MAX_BETS));
    };

    window.addEventListener('newBet', handleNewBet as EventListener);
    return () => window.removeEventListener('newBet', handleNewBet as EventListener);
  }, []);

  if (bets.length === 0) return null;

  return (
    <div className="stat-panel">
      <div className="flex items-center gap-2 mb-3 text-gold/90">
        <Sparkles className="w-5 h-5" />
        <span className="text-sm font-display font-bold">LIVE BETS</span>
      </div>
      
      <div className="space-y-2 max-h-[180px] overflow-y-auto">
        {bets.map((bet, i) => (
          <div 
            key={bet.id} 
            className={`relative flex items-center justify-between text-sm py-2 px-3 rounded-lg border-l-4 overflow-visible transition-all ${
              i === 0 ? 'animate-pop-burst' : 'animate-stagger-in'
            } ${bet.won ? 'bg-win/15 border-win/50' : 'bg-lose/15 border-lose/50'}`}
            style={{ animationDelay: i === 0 ? '0ms' : `${i * 55}ms`, animationFillMode: 'backwards' }}
          >
            {i === 0 && (
              <RoguelikeSparkles
                variant={bet.won ? 'win' : 'lose'}
                count={6}
                size="sm"
                spread={20}
                mode="burst"
              />
            )}
            <div className="flex items-center gap-2 relative z-10">
              {bet.won ? (
                <Trophy className="w-4 h-4 text-win flex-shrink-0" />
              ) : (
                <Skull className="w-4 h-4 text-lose flex-shrink-0" />
              )}
              <span className="font-medium text-foreground/90">{bet.game}</span>
            </div>
            <div className="flex items-center gap-2 relative z-10">
              <span className={`font-display font-black ${bet.won ? 'text-win' : 'text-lose'}`}>
                {bet.won ? '+' : '-'}${formatNumber(Math.abs(bet.profit))}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-display font-bold ${bet.won ? 'bg-win/30 text-win' : 'bg-lose/30 text-lose'}`}>
                {formatNumber(bet.multiplier)}x
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
