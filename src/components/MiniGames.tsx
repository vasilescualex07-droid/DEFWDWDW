import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dices, Gift, Star, Lock } from 'lucide-react';

export const MiniGames = () => {
  const [dailyBonus, setDailyBonus] = useState(false);
  const [luckyWheel, setLuckyWheel] = useState(false);
  const [mysteryBox, setMysteryBox] = useState(false);

  return (
    <Card className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-purple-900/90 to-blue-900/90 border-purple-500/30 backdrop-blur-sm">
      <div className="flex items-center gap-2 p-2">
        <Button
          onClick={() => setDailyBonus(!dailyBonus)}
          variant={dailyBonus ? "default" : "outline"}
          size="sm"
          className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold"
        >
          <Gift className="w-4 h-4 mr-2" />
          Daily Bonus
        </Button>
        <Button
          onClick={() => setLuckyWheel(!luckyWheel)}
          variant={luckyWheel ? "default" : "outline"}
          size="sm"
          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold"
        >
          <Star className="w-4 h-4 mr-2" />
          Lucky Wheel
        </Button>
        <Button
          onClick={() => setMysteryBox(!mysteryBox)}
          variant={mysteryBox ? "default" : "outline"}
          size="sm"
          className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold"
        >
          <Dices className="w-4 h-4 mr-2" />
          Mystery Box
        </Button>
      </div>
    </Card>
  );
};
