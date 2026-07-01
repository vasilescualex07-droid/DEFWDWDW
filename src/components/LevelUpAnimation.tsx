import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, Star, Zap } from 'lucide-react';

interface LevelUpAnimationProps {
  show: boolean;
  level: number;
  rewards: {
    coins: number;
    xp: number;
  };
  onComplete: () => void;
}

export const LevelUpAnimation = ({ show, level, rewards, onComplete }: LevelUpAnimationProps) => {
  const [showAnimation, setShowAnimation] = useState(show);

  useEffect(() => {
    setShowAnimation(show);
    if (show) {
      const timer = setTimeout(onComplete, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!showAnimation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="relative bg-gradient-to-br from-purple-900/95 to-blue-900/95 border-purple-500/50 p-8 max-w-md w-full mx-4 shadow-2xl shadow-purple-500/30 animate-bounce-in">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 animate-pulse rounded-lg" />
        
        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-xl animate-pulse" />
            <div className="relative p-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full">
              <Trophy className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 p-2 bg-green-500 rounded-full animate-bounce">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>

          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2">
            LEVEL UP!
          </h2>
          <p className="text-2xl font-bold text-white mb-6">Level {level}</p>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-yellow-500/20 rounded-full mb-2">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <span className="text-sm text-gray-300">+{rewards.xp} XP</span>
            </div>
            <div className="w-px h-12 bg-gray-600" />
            <div className="flex flex-col items-center">
              <div className="p-3 bg-orange-500/20 rounded-full mb-2">
                <Trophy className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-sm text-gray-300">+${rewards.coins}</span>
            </div>
          </div>

          <p className="text-sm text-gray-300">Keep playing to unlock more rewards!</p>
        </div>
      </Card>
    </div>
  );
};
