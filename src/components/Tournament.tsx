import { useState, useEffect } from 'react';
import { Trophy, Clock, Users, Flame, Medal, Crown, Star, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { playSound } from '@/hooks/useSounds';
import { toast } from 'sonner';
import { Player } from '@/hooks/usePlayers';

interface TournamentProps {
  currentPlayer: string;
  balance: number;
  playerLevel: number;
  allPlayers: Player[];
  onWin: (amount: number, bet?: number, multiplier?: number) => void;
  onClose: () => void;
}

interface TournamentData {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'special';
  entryFee: number;
  prizePool: number;
  participants: { name: string; score: number }[];
  endsAt: number;
  minLevel: number;
}

export const Tournament = ({ currentPlayer, balance, playerLevel, allPlayers, onWin, onClose }: TournamentProps) => {
  const [activeTournament, setActiveTournament] = useState<TournamentData | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [myScore, setMyScore] = useState(0);

  // Generate fake tournaments
  const tournaments: TournamentData[] = [
    {
      id: 'daily-grind',
      name: 'Daily Grind',
      type: 'daily',
      entryFee: 25,
      prizePool: 1000,
      participants: allPlayers.slice(0, 5).map(p => ({ name: p.name, score: Math.floor(Math.random() * 5000) })),
      endsAt: Date.now() + 3600000, // 1 hour
      minLevel: 1,
    },
    {
      id: 'high-roller',
      name: 'High Roller Championship',
      type: 'weekly',
      entryFee: 100,
      prizePool: 10000,
      participants: allPlayers.slice(0, 8).map(p => ({ name: p.name, score: Math.floor(Math.random() * 20000) })),
      endsAt: Date.now() + 86400000, // 24 hours
      minLevel: 10,
    },
    {
      id: 'legend',
      name: 'Legends Only',
      type: 'special',
      entryFee: 500,
      prizePool: 50000,
      participants: allPlayers.slice(0, 3).map(p => ({ name: p.name, score: Math.floor(Math.random() * 100000) })),
      endsAt: Date.now() + 604800000, // 7 days
      minLevel: 30,
    },
  ];

  useEffect(() => {
    if (activeTournament) {
      const interval = setInterval(() => {
        const remaining = activeTournament.endsAt - Date.now();
        if (remaining <= 0) {
          // Tournament ended - check if won
          const sortedParticipants = [...activeTournament.participants, { name: currentPlayer, score: myScore }]
            .sort((a, b) => b.score - a.score);
          const myRank = sortedParticipants.findIndex(p => p.name === currentPlayer) + 1;
          
          if (myRank === 1) {
            const prize = activeTournament.prizePool * 0.5;
            onWin(prize, activeTournament.entryFee, prize / activeTournament.entryFee);
            toast.success(`🏆 1st Place! You won $${prize}!`);
          } else if (myRank === 2) {
            const prize = activeTournament.prizePool * 0.3;
            onWin(prize, activeTournament.entryFee, prize / activeTournament.entryFee);
            toast.success(`🥈 2nd Place! You won $${prize}!`);
          } else if (myRank === 3) {
            const prize = activeTournament.prizePool * 0.2;
            onWin(prize, activeTournament.entryFee, prize / activeTournament.entryFee);
            toast.success(`🥉 3rd Place! You won $${prize}!`);
          }
          
          setActiveTournament(null);
          setIsJoined(false);
          clearInterval(interval);
          return;
        }
        
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [activeTournament, myScore, currentPlayer, onWin]);

  const joinTournament = (tournament: TournamentData) => {
    if (balance < tournament.entryFee) {
      toast.error('Insufficient balance for entry fee!');
      return;
    }
    if (playerLevel < tournament.minLevel) {
      toast.error(`Requires level ${tournament.minLevel}!`);
      return;
    }
    setActiveTournament(tournament);
    setIsJoined(true);
    setMyScore(0);
    playSound('click');
    toast.success(`Joined ${tournament.name}!`);
  };

  const playRound = () => {
    const points = Math.floor(Math.random() * 1000) + 100;
    setMyScore(prev => prev + points);
    playSound('win');
    toast.success(`+${points} points!`);
  };

  if (activeTournament && isJoined) {
    const allParticipants = [...activeTournament.participants, { name: currentPlayer, score: myScore }]
      .sort((a, b) => b.score - a.score);
    const myRank = allParticipants.findIndex(p => p.name === currentPlayer) + 1;

    return (
      <Card className="bg-gradient-to-br from-card via-gold/5 to-card border-gold/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-gold/30 to-yellow-600/20 rounded-lg">
                <Trophy className="w-5 h-5 text-gold" />
              </div>
              <div>
                <CardTitle className="font-display text-lg text-gradient-gold">{activeTournament.name}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{timeLeft}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setActiveTournament(null); setIsJoined(false); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* My Score */}
          <div className="text-center p-4 bg-gradient-to-r from-gold/10 via-gold/20 to-gold/10 rounded-xl border border-gold/30">
            <p className="text-xs text-muted-foreground mb-1">Your Score</p>
            <p className="font-display text-3xl text-gold">{myScore.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">Rank #{myRank}</p>
          </div>

          <Button onClick={playRound} className="w-full bg-gradient-to-r from-gold to-yellow-600 text-black font-display hover:opacity-90">
            <Flame className="w-4 h-4 mr-2" />
            Play Round
          </Button>

          {/* Leaderboard */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-display">LEADERBOARD</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {allParticipants.slice(0, 10).map((p, i) => (
                <div 
                  key={p.name}
                  className={`flex items-center justify-between p-2 rounded-lg ${p.name === currentPlayer ? 'bg-gold/20 border border-gold/30' : 'bg-secondary/30'}`}
                >
                  <div className="flex items-center gap-2">
                    {i === 0 && <Crown className="w-4 h-4 text-gold" />}
                    {i === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                    {i === 2 && <Medal className="w-4 h-4 text-amber-700" />}
                    {i > 2 && <span className="w-4 text-center text-xs text-muted-foreground">{i + 1}</span>}
                    <span className={`text-sm ${p.name === currentPlayer ? 'text-gold font-bold' : 'text-foreground'}`}>{p.name}</span>
                  </div>
                  <span className="text-sm font-display">{p.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prizes */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-gold/10 rounded-lg border border-gold/30">
              <Crown className="w-4 h-4 mx-auto text-gold mb-1" />
              <span className="text-gold">${(activeTournament.prizePool * 0.5).toLocaleString()}</span>
            </div>
            <div className="p-2 bg-gray-400/10 rounded-lg border border-gray-400/30">
              <Medal className="w-4 h-4 mx-auto text-gray-400 mb-1" />
              <span className="text-gray-400">${(activeTournament.prizePool * 0.3).toLocaleString()}</span>
            </div>
            <div className="p-2 bg-amber-700/10 rounded-lg border border-amber-700/30">
              <Medal className="w-4 h-4 mx-auto text-amber-700 mb-1" />
              <span className="text-amber-700">${(activeTournament.prizePool * 0.2).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-card via-gold/5 to-card border-gold/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-gold/30 to-yellow-600/20 rounded-xl glow-gold">
              <Trophy className="w-6 h-6 text-gold" />
            </div>
            <div>
              <CardTitle className="font-display text-xl text-gradient-gold">TOURNAMENTS</CardTitle>
              <p className="text-xs text-gold/60">Compete for massive prizes!</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tournaments.map((t) => {
          const isLocked = playerLevel < t.minLevel;
          return (
            <div
              key={t.id}
              className={`p-4 rounded-xl border transition-all ${
                t.type === 'daily' ? 'bg-green-500/10 border-green-500/30' :
                t.type === 'weekly' ? 'bg-blue-500/10 border-blue-500/30' :
                'bg-purple-500/10 border-purple-500/30'
              } ${isLocked ? 'opacity-50' : 'hover:scale-[1.02]'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Star className={`w-4 h-4 ${
                    t.type === 'daily' ? 'text-green-400' :
                    t.type === 'weekly' ? 'text-blue-400' :
                    'text-purple-400'
                  }`} />
                  <span className="font-display text-sm">{t.name}</span>
                </div>
                {isLocked && <span className="text-xs text-muted-foreground">Lv.{t.minLevel}</span>}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t.participants.length}</span>
                  <span>Entry: ${t.entryFee}</span>
                </div>
                <span className="text-gold font-display">${t.prizePool.toLocaleString()} Pool</span>
              </div>
              <Button
                size="sm"
                onClick={() => joinTournament(t)}
                disabled={isLocked}
                className={`w-full ${
                  t.type === 'daily' ? 'bg-green-600 hover:bg-green-700' :
                  t.type === 'weekly' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isLocked ? 'Locked' : 'Join Tournament'}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
