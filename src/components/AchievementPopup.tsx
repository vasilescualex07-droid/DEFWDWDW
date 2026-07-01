import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Award, Zap, Flame, Crown } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
}

const achievements: Achievement[] = [
  {
    id: 'first_win',
    title: 'First Victory',
    description: 'Win your first game',
    icon: <Trophy className="w-6 h-6" />,
    rarity: 'common',
    progress: 0,
    maxProgress: 1
  },
  {
    id: 'win_streak',
    title: 'Hot Streak',
    description: 'Win 5 games in a row',
    icon: <Flame className="w-6 h-6" />,
    rarity: 'rare',
    progress: 0,
    maxProgress: 5
  },
  {
    id: 'big_winner',
    title: 'Big Winner',
    description: 'Win 100+ in a single game',
    icon: <Star className="w-6 h-6" />,
    rarity: 'epic',
    progress: 0,
    maxProgress: 100
  },
  {
    id: 'jackpot',
    title: 'Jackpot Hunter',
    description: 'Hit a jackpot',
    icon: <Crown className="w-6 h-6" />,
    rarity: 'legendary',
    progress: 0,
    maxProgress: 1
  }
];

const rarityColors = {
  common: 'from-gray-600 to-gray-700',
  rare: 'from-blue-600 to-blue-700',
  epic: 'from-purple-600 to-purple-700',
  legendary: 'from-yellow-600 to-orange-600'
};

const rarityBorders = {
  common: 'border-gray-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500'
};

export const AchievementPopup = () => {
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

  const triggerAchievement = (achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement) {
      setCurrentAchievement(achievement);
      setShowAchievement(true);
      setTimeout(() => setShowAchievement(false), 3000);
    }
  };

  useEffect(() => {
    window.triggerAchievement = triggerAchievement;
    return () => {
      delete window.triggerAchievement;
    };
  }, []);

  if (!showAchievement || !currentAchievement) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-in">
      <Card className={`bg-gradient-to-br ${rarityColors[currentAchievement.rarity]} border-2 ${rarityBorders[currentAchievement.rarity]} p-4 shadow-2xl backdrop-blur-sm`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            {currentAchievement.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-yellow-300" />
              <span className="text-xs font-bold text-yellow-300 uppercase">{currentAchievement.rarity}</span>
            </div>
            <h3 className="text-lg font-bold text-white">{currentAchievement.title}</h3>
            <p className="text-sm text-white/80">{currentAchievement.description}</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-black/30 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentAchievement.progress / currentAchievement.maxProgress) * 100}%` }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
