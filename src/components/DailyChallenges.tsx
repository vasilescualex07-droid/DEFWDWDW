import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Clock, Flame, Trophy, Zap, TrendingUp, Gift, X, LucideIcon } from "lucide-react";
import { toast } from "sonner";

interface Challenge {
  id: string;
  title: string;
  description: string;
  iconName: "Trophy" | "Target" | "Zap" | "Flame" | "TrendingUp" | "Gift";
  target: number;
  current: number;
  reward: number;
  type: "wins" | "bets" | "profit" | "streak" | "games" | "bigwin";
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
  claimed: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Trophy,
  Target,
  Zap,
  Flame,
  TrendingUp,
  Gift,
};

interface DailyChallengesProps {
  balance: number;
  setBalance: (balance: number) => void;
  stats: {
    totalWins: number;
    totalBets: number;
    totalProfit: number;
    currentStreak: number;
    gamesPlayed: number;
    biggestWin: number;
  };
  onClose?: () => void;
}

const DailyChallenges = ({ balance, setBalance, stats, onClose }: DailyChallengesProps) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [timeLeft, setTimeLeft] = useState("");
  const [dailyStreak, setDailyStreak] = useState(0);

  // Generate daily challenges based on date
  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem("challengeDate");
    const savedChallenges = localStorage.getItem("dailyChallenges");
    const savedStreak = localStorage.getItem("dailyStreak");

    if (savedStreak) {
      setDailyStreak(parseInt(savedStreak));
    }

    if (savedDate === today && savedChallenges) {
      setChallenges(JSON.parse(savedChallenges));
    } else {
      // Generate new challenges
      const newChallenges = generateChallenges();
      setChallenges(newChallenges);
      localStorage.setItem("challengeDate", today);
      localStorage.setItem("dailyChallenges", JSON.stringify(newChallenges));
      
      // Update streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (savedDate === yesterday.toDateString()) {
        const newStreak = dailyStreak + 1;
        setDailyStreak(newStreak);
        localStorage.setItem("dailyStreak", newStreak.toString());
      } else if (savedDate !== today) {
        setDailyStreak(1);
        localStorage.setItem("dailyStreak", "1");
      }
    }
  }, []);

  // Update challenge progress
  useEffect(() => {
    setChallenges(prev => prev.map(challenge => {
      let current = 0;
      switch (challenge.type) {
        case "wins":
          current = stats.totalWins;
          break;
        case "bets":
          current = stats.totalBets;
          break;
        case "profit":
          current = Math.max(0, stats.totalProfit);
          break;
        case "streak":
          current = stats.currentStreak;
          break;
        case "games":
          current = stats.gamesPlayed;
          break;
        case "bigwin":
          current = stats.biggestWin;
          break;
      }
      return {
        ...challenge,
        current: Math.min(current, challenge.target),
        completed: current >= challenge.target
      };
    }));
  }, [stats]);

  // Save challenges when they change
  useEffect(() => {
    if (challenges.length > 0) {
      localStorage.setItem("dailyChallenges", JSON.stringify(challenges));
    }
  }, [challenges]);

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const generateChallenges = (): Challenge[] => {
    const allChallenges: Omit<Challenge, "current" | "completed" | "claimed">[] = [
      // Easy
      { id: "e1", title: "First Steps", description: "Win 3 games", iconName: "Trophy", target: 3, reward: 100, type: "wins", difficulty: "easy" },
      { id: "e2", title: "Getting Started", description: "Place 10 bets", iconName: "Target", target: 10, reward: 75, type: "bets", difficulty: "easy" },
      { id: "e3", title: "Warming Up", description: "Play 5 games", iconName: "Zap", target: 5, reward: 50, type: "games", difficulty: "easy" },
      // Medium
      { id: "m1", title: "On Fire", description: "Win 10 games", iconName: "Flame", target: 10, reward: 300, type: "wins", difficulty: "medium" },
      { id: "m2", title: "High Roller", description: "Place 25 bets", iconName: "Target", target: 25, reward: 250, type: "bets", difficulty: "medium" },
      { id: "m3", title: "Profit Hunter", description: "Earn $500 profit", iconName: "TrendingUp", target: 500, reward: 200, type: "profit", difficulty: "medium" },
      { id: "m4", title: "Hot Streak", description: "Win 5 games in a row", iconName: "Flame", target: 5, reward: 400, type: "streak", difficulty: "medium" },
      // Hard
      { id: "h1", title: "Unstoppable", description: "Win 25 games", iconName: "Trophy", target: 25, reward: 750, type: "wins", difficulty: "hard" },
      { id: "h2", title: "Big Winner", description: "Win $1,000 in one game", iconName: "Gift", target: 1000, reward: 500, type: "bigwin", difficulty: "hard" },
      { id: "h3", title: "Marathon", description: "Play 50 games", iconName: "Zap", target: 50, reward: 600, type: "games", difficulty: "hard" },
    ];

    // Pick 2 easy, 2 medium, 1 hard
    const easy = allChallenges.filter(c => c.difficulty === "easy").sort(() => Math.random() - 0.5).slice(0, 2);
    const medium = allChallenges.filter(c => c.difficulty === "medium").sort(() => Math.random() - 0.5).slice(0, 2);
    const hard = allChallenges.filter(c => c.difficulty === "hard").sort(() => Math.random() - 0.5).slice(0, 1);

    return [...easy, ...medium, ...hard].map(c => ({
      ...c,
      current: 0,
      completed: false,
      claimed: false
    }));
  };

  const claimReward = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.completed || challenge.claimed) return;

    // Apply streak bonus
    const streakBonus = Math.min(dailyStreak * 0.1, 1); // Max 100% bonus at 10 day streak
    const totalReward = Math.floor(challenge.reward * (1 + streakBonus));

    setBalance(balance + totalReward);
    setChallenges(prev => prev.map(c => 
      c.id === challengeId ? { ...c, claimed: true } : c
    ));
    
    toast.success(`🎯 ${challenge.title} completed! +$${totalReward.toLocaleString()}`);
  };

  const claimAll = () => {
    const claimable = challenges.filter(c => c.completed && !c.claimed);
    if (claimable.length === 0) return;

    const streakBonus = Math.min(dailyStreak * 0.1, 1);
    const totalReward = claimable.reduce((sum, c) => sum + Math.floor(c.reward * (1 + streakBonus)), 0);

    setBalance(balance + totalReward);
    setChallenges(prev => prev.map(c => 
      c.completed ? { ...c, claimed: true } : c
    ));
    
    toast.success(`🏆 Claimed ${claimable.length} challenges! +$${totalReward.toLocaleString()}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "text-green-400 bg-green-500/20";
      case "medium": return "text-yellow-400 bg-yellow-500/20";
      case "hard": return "text-red-400 bg-red-500/20";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const completedCount = challenges.filter(c => c.completed).length;
  const claimableCount = challenges.filter(c => c.completed && !c.claimed).length;

  return (
    <Card className="bg-gradient-to-br from-orange-900/40 to-amber-900/40 border-orange-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-300">
            <Target className="w-6 h-6" />
            Daily Challenges
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-orange-300">{dailyStreak} day streak</span>
              {dailyStreak > 0 && (
                <span className="text-xs text-green-400">+{Math.min(dailyStreak * 10, 100)}% bonus</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Resets in {timeLeft}</span>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-muted-foreground">
            {completedCount}/{challenges.length} completed
          </span>
          {claimableCount > 0 && (
            <Button 
              size="sm" 
              onClick={claimAll}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              Claim All ({claimableCount})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {challenges.map(challenge => (
            <div 
              key={challenge.id}
              className={`p-4 rounded-lg border transition-all ${
                challenge.claimed 
                  ? "bg-muted/30 border-muted opacity-60" 
                  : challenge.completed 
                    ? "bg-green-500/10 border-green-500/30 animate-pulse" 
                    : "bg-card/50 border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getDifficultyColor(challenge.difficulty)}`}>
                    {(() => {
                      const Icon = iconMap[challenge.iconName];
                      return Icon ? <Icon className="w-5 h-5" /> : null;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{challenge.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(challenge.difficulty)}`}>
                        {challenge.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-400">
                      ${challenge.reward.toLocaleString()}
                    </div>
                    {dailyStreak > 0 && !challenge.claimed && (
                      <div className="text-xs text-orange-400">
                        +${Math.floor(challenge.reward * Math.min(dailyStreak * 0.1, 1)).toLocaleString()}
                      </div>
                    )}
                  </div>
                  {challenge.completed && !challenge.claimed ? (
                    <Button 
                      size="sm"
                      onClick={() => claimReward(challenge.id)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      Claim
                    </Button>
                  ) : challenge.claimed ? (
                    <span className="text-xs text-muted-foreground px-3">Claimed ✓</span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(challenge.current / challenge.target) * 100} 
                  className="h-2 flex-1"
                />
                <span className="text-xs text-muted-foreground w-16 text-right">
                  {challenge.current}/{challenge.target}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyChallenges;
