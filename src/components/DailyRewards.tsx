import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Gift, Lock, CheckCircle2, Flame, Sparkles } from 'lucide-react';

interface DailyReward {
  day: number;
  reward: number;
  claimed: boolean;
  available: boolean;
}

export const DailyRewards = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [rewards, setRewards] = useState<DailyReward[]>([
    { day: 1, reward: 10, claimed: true, available: false },
    { day: 2, reward: 20, claimed: true, available: false },
    { day: 3, reward: 30, claimed: false, available: true },
    { day: 4, reward: 40, claimed: false, available: false },
    { day: 5, reward: 50, claimed: false, available: false },
    { day: 6, reward: 75, claimed: false, available: false },
    { day: 7, reward: 100, claimed: false, available: false },
  ]);

  const [streak, setStreak] = useState(2);

  const claimReward = (day: number) => {
    setRewards(prev => prev.map(r => 
      r.day === day ? { ...r, claimed: true, available: false } : r
    ));
    setStreak(prev => prev + 1);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 left-4 z-40 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-full shadow-lg shadow-pink-500/30 transition-all hover:scale-105 flex items-center gap-2"
      >
        <Calendar className="w-5 h-5" />
        Daily Rewards
      </Button>

      {isOpen && (
        <Card className="fixed top-36 left-4 z-40 w-80 bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-pink-500/30 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 flex items-center gap-2">
                <Gift className="w-6 h-6" />
                Daily Rewards
              </h2>
              <div className="flex items-center gap-1 text-orange-400">
                <Flame className="w-4 h-4" />
                <span className="font-bold">{streak} Day Streak</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {rewards.map((reward) => (
                <div
                  key={reward.day}
                  className={`relative p-2 rounded-lg text-center transition-all ${
                    reward.claimed
                      ? 'bg-green-500/20 border border-green-500/30'
                      : reward.available
                      ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 cursor-pointer hover:scale-105'
                      : 'bg-slate-700/30 border border-slate-600/30'
                  }`}
                  onClick={() => reward.available && claimReward(reward.day)}
                >
                  <div className="text-xs text-gray-400 mb-1">Day {reward.day}</div>
                  <div className="text-lg font-bold text-white">${reward.reward}</div>
                  {reward.claimed && (
                    <div className="absolute -top-1 -right-1">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  {!reward.available && !reward.claimed && (
                    <div className="absolute -top-1 -right-1">
                      <Lock className="w-3 h-3 text-gray-500" />
                    </div>
                  )}
                  {reward.available && (
                    <div className="absolute -top-1 -right-1 animate-pulse">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center text-sm text-gray-400">
              Come back every day for bigger rewards!
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
