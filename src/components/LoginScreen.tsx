import { useState } from 'react';
import { Zap, User, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Player } from '@/hooks/usePlayers';

interface LoginScreenProps {
  onLogin: (name: string) => Player;
  leaderboard: Player[];
}

export const LoginScreen = ({ onLogin, leaderboard }: LoginScreenProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 via-transparent to-neon-purple/10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-neon-blue/30 to-neon-purple/20 rounded-xl glow-blue">
              <Zap className="w-8 h-8 text-neon-blue" />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-wider">
              STAKE<span className="text-gradient-blue">LITE</span>
            </h1>
          </div>
          <p className="text-muted-foreground">Enter your name to play</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-card/80 backdrop-blur-sm border border-neon-blue/20 rounded-2xl p-6 space-y-4 shadow-[0_0_30px_hsl(217_91%_60%/0.1)]">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Player Name
            </label>
            <Input
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background/50 border-border/50 text-lg py-6"
              autoFocus
            />
            <p className="text-xs text-muted-foreground/60">
              Your name is your login. Use the same name to continue your progress.
            </p>
          </div>
          <Button 
            type="submit" 
            className="w-full py-6 text-lg font-display bg-gradient-to-r from-neon-blue to-neon-cyan hover:from-neon-blue/90 hover:to-neon-cyan/90 glow-blue"
            disabled={!name.trim()}
          >
            Play Now
          </Button>
        </form>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="bg-card/60 backdrop-blur-sm border border-neon-purple/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3 text-neon-blue">
              <Trophy className="w-5 h-5" />
              <h2 className="font-display text-lg">Top Players</h2>
            </div>
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((player, index) => (
                <div 
                  key={player.name}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/30"
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-display text-lg w-6 ${
                      index === 0 ? 'text-gold' : 
                      index === 1 ? 'text-gray-400' : 
                      index === 2 ? 'text-amber-700' : 'text-muted-foreground'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <span className="font-medium truncate max-w-[120px]">{player.name}</span>
                  </div>
                  <span className={`font-display font-bold ${player.balance > 100 ? 'text-win' : player.balance < 100 ? 'text-lose' : 'text-foreground'}`}>
                    ${player.balance.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Credit */}
      <div className="fixed bottom-3 right-3 text-[10px] text-muted-foreground/40 font-display tracking-wide">
        facut de alex
      </div>
    </div>
  );
};
